from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from db_ops import get_session
from models import Club, Event, Review, Student
import difflib
from sqlalchemy import func, or_
import hmac, hashlib, base64, os, uuid, json, re
from werkzeug.security import generate_password_hash, check_password_hash
from email.message import EmailMessage

#New Configuration Constants, for email authoritization, cookie expiration, and login
_SECRET = os.getenv("ECN_JWT_SECRET", "six-or-seven?") #Greatest key of all time
_COOKIE = "ecn_session"
_MAX_AGE = 60*60*24*14

#FOR NOW, IT IS LOCAL. WE WILL CHANGE THIS WHEN WE DEPLOY. 
_FRONTEND_BASE = os.getenv("ECN_FRONTEND_BASE", "http://localhost:3000")
_BACKEND_BASE = os.getenv("ECN_BACKEND_BASE", "http://127.0.0.1:5000")
_VERIFY_TTL_MIN = int(os.getenv("ECN_VERIFY_TTL_MIN", "15"))

#===== Email configurations ======
#When we deploy, we will need to change dev to smtp. Right now, it will simply return the email.
#When the mode changes, it will actually send an email (I am thinking of using either AMAZON SES or SendGrid. That is not yet implemented)
#To implement actually sending emails we gotta pay so doing that at the VERY end.
_EMAIL_MODE = os.getenv("ECN_EMAIL_MODE", "dev")  # "dev" or "smtp"

_SMTP_HOST = os.getenv("ECN_SMTP_HOST", "")       # e.g., "smtp.gmail.com"
_SMTP_PORT = int(os.getenv("ECN_SMTP_PORT", "587"))  # 587 (STARTTLS) or 465 (SSL)
_SMTP_USER = os.getenv("ECN_SMTP_USER", "")       # your SMTP username (often your email)
_SMTP_PASS = os.getenv("ECN_SMTP_PASS", "")       # app password or SMTP password
_EMAIL_FROM = os.getenv("ECN_EMAIL_FROM", _SMTP_USER or "no-reply@localhost")
_EMAIL_FROM_NAME = os.getenv("ECN_EMAIL_FROM_NAME", "Emory Core Nexus")

# ---- Helpers ----
def _normalize_text(s: str) -> str:
    tokens = re.findall(r"[a-z0-9]+", (s or "").lower())
    return " ".join(tokens)

def _tokenize(s: str) -> list[str]:
    return _normalize_text(s).split()

def _fuzzy_any_match(q_word: str, title_words: list[str], cutoff: float = 0.82) -> bool:
    if q_word in title_words:
        return True
    return bool(difflib.get_close_matches(q_word, title_words, n=1, cutoff=cutoff))

# ===== New Helpers for Sprint 6 (Email verification and user authoritization) ======
def _now_ts() -> int:
    #for token expirations and issued-times
    return int(datetime.now(timezone.utc).timestamp())

def _is_emory_email(email: str) -> bool:
    #the main checker (We cant get actual access)
    return (email or "").strip().lower().endswith("@emory.edu")

def _serialize_student(stu: Student) -> Dict[str, Any]:
    #converts Student to a Dict (for json)
    return {"id": str(stu.id), "netid": stu.netid, "name": stu.name, "email": stu.email, "isVerified": bool(stu.is_verified)}

def _sign(data: str) -> str:
    #Creates a token for plaintext payload (necessary for cookies)
    mac = hmac.new(_SECRET.encode(), msg=data.encode(), digestmod=hashlib.sha256).digest()
    sig = base64.urlsafe_b64encode(mac).decode().rstrip("=")
    payload = base64.urlsafe_b64encode(data.encode()).decode().rstrip("=")
    return f"{payload}.{sig}"

def _unsign(token: str) -> Optional[str]:
    #Verify token integrity and recover the payload. (Cookies)
    try:
        payload_b64, sig = token.split(".", 1)
        missing = (-len(payload_b64)) % 4
        payload_b64 = payload_b64 + ("=" * missing)
        data = base64.urlsafe_b64decode(payload_b64).decode()
        expected = hmac.new(_SECRET.encode(), msg=data.encode(), digestmod=hashlib.sha256).digest()
        expected_b64 = base64.urlsafe_b64encode(expected).decode().rstrip("=")
        if not hmac.compare_digest(sig, expected_b64):
            return None
        return data
    except Exception:
        return None

def auth_me(token: str) -> Dict[str, Any]:
    #Resolve current user from the cookie token
    raw = _unsign(token or "")
    if not raw:
        raise ValueError("Invalid session.")
    try:
        uid, email, issued_str = raw.split("|", 2)
    except Exception:
        raise ValueError("Invalid session.")
    with get_session() as s:
        stu = s.get(Student, uuid.UUID(uid))
        if not stu:
            raise ValueError("User not found.")
        return {"user": _serialize_student(stu)}

def auth_cookie_name() -> str:
    #Just for typos, we can delete this thought it could avoid an edge case
    return _COOKIE
    
# ---- Clubs ----
def list_clubs(q: str = "", tags: list[str] | None = None) -> Dict[str, Any]:
    with get_session() as s:
        query = s.query(Club)
        if q:
            pattern = f"%{q.lower()}%"
            query = query.filter(
                func.lower(Club.name).like(pattern)
                | func.lower(Club.description).like(pattern)
                | func.lower(Club.purpose).like(pattern)
            )
        clubs = query.order_by(Club.updated_at.desc()).all()
        items = [{
            "id": str(c.id),
            "name": c.name,
            "description": c.description,
            "createdAt": c.created_at.isoformat(),
            "updatedAt": c.updated_at.isoformat()
        } for c in clubs]
        return {"items": items, "total": len(items)}

def create_club(payload: dict) -> str:
    if not payload.get("name"):
        raise ValueError("name is required")
    with get_session() as s:
        c = Club(name=payload["name"], description=payload.get("description", ""))
        s.add(c)
        s.flush()
        return str(c.id)

# ---- Events ----
def list_events(upcoming_only: bool = True) -> List[Dict[str, Any]]:
    with get_session() as s:
        q = s.query(Event, Club).join(Club, Event.club_id == Club.id)
        if upcoming_only:
            q = q.filter(Event.start_time >= datetime.now(timezone.utc))


        results = q.order_by(Event.start_time.asc()).all()
        return [{
            "id": str(e.id),
            "clubId": str(e.club_id),
            "clubName": c.name,           # ← Add this
            "club_verified": c.verified,  # ← Add this
            "title": e.title,
            "startTime": e.start_time.isoformat(),
            "endTime": e.end_time.isoformat() if e.end_time else None,
            "location": e.location,
            "status": e.status
        } for e, c in results]  # ← Note: unpacking (e, c) tuple


def create_event(payload: dict) -> str:
    req = ["clubId", "title", "startTime", "endTime"]
    missing = [k for k in req if not payload.get(k)]
    if missing:
        raise ValueError(f"Missing: {', '.join(missing)}")

    with get_session() as s:
        evt = Event(
            club_id=payload["clubId"],
            title=payload["title"],
            description=payload.get("description"),
            location=payload.get("location"),
            start_time=datetime.fromisoformat(payload["startTime"]),
            end_time=datetime.fromisoformat(payload["endTime"]),
        )
        s.add(evt)
        s.flush()
        return str(evt.id)

# ---- Smart Search (Simplified) ----
def search_clubs_smart(q: str = "", tags: list[str] | None = None, fuzzy_cutoff: float = 0.82) -> Dict[str, Any]:
    q_norm = _normalize_text(q)
    q_words = _tokenize(q_norm)

    with get_session() as s:
        base = s.query(Club)
        if q_words:
            like_clauses = []
            for w in q_words:
                pat = f"%{w}%"
                like_clauses.append(func.lower(Club.name).like(pat))
                like_clauses.append(func.lower(Club.description).like(pat))
            base = base.filter(or_(*like_clauses))

        candidates = base.order_by(Club.updated_at.desc()).all()

        matched_ids = set()
        for c in candidates:
            name_words = _tokenize(c.name)
            if q_words and any(_fuzzy_any_match(qw, name_words, cutoff=fuzzy_cutoff) for qw in q_words):
                matched_ids.add(c.id)

        matched = [c for c in candidates if c.id in matched_ids]
        items = [{
            "id": str(c.id),
            "name": c.name,
            "description": c.description,
            "updatedAt": c.updated_at.isoformat()
        } for c in matched]
        return {"items": items, "total": len(items)}

def _avg_rating_for_club(session, club_id) -> float:
    # average rating; default to 4.6 if no reviews
    row = session.query(func.avg(Review.rating)).filter(Review.club_id == club_id).one()
    try:
        val = float(row[0]) if row[0] is not None else 4.6
    except Exception:
        val = 4.6
    return round(val, 1)

def _next_event_for_club(session, club_id) -> Optional[dict]:
    now = datetime.now(timezone.utc)
    evt = (
        session.query(Event)
        .filter(Event.club_id == club_id, Event.start_time >= now)
        .order_by(Event.start_time.asc())
        .first()
    )
    if not evt:
        return None
    
    # Convert UTC to EST/EDT for display
    from zoneinfo import ZoneInfo
    est_time = evt.start_time.replace(tzinfo=timezone.utc).astimezone(ZoneInfo("America/New_York"))
    
    date_str = est_time.strftime("%b %d")
    time_str = est_time.strftime("%-I:%M %p")
    
    return {
        "name": evt.title,
        "date": date_str,
        "time": time_str,
        "location": evt.location or "TBD",
    }

def _activity_score(upcoming_count: int, verified: bool) -> int:
    base = min(100, upcoming_count * 8)
    if verified:
        base += 10
    return min(100, base)

def _discoverability_index(activity: int, members: int) -> int:
    # simple composite metric
    return min(100, activity + min(40, members // 5))

def list_clubs(
    q: str = "",
    tags: List[str] | None = None,            # unused placeholder (no Tag model)
    school: Optional[str] = None,             # unused placeholder
    category: Optional[str] = None,           # unused placeholder
    verified_only: bool = False,
    sort_by: str = "discoverability",
    limit: int = 50,
    offset: int = 0,
) -> Dict[str, Any]:
    with get_session() as s:
        query = s.query(Club)

        if q:
            pattern = f"%{q.lower()}%"
            query = query.filter(
                func.lower(Club.name).like(pattern)
                | func.lower(Club.description).like(pattern)
                | func.lower(Club.purpose).like(pattern)
            )

        if verified_only:
            query = query.filter(Club.verified.is_(True))

        # total BEFORE pagination
        total = query.count()

        # simple recency ordering first (we’ll re-sort after computing metrics if needed)
        clubs = (
            query
            .order_by(Club.updated_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        # Build enriched items expected by the UI
        items: List[Dict[str, Any]] = []
        now = datetime.now(timezone.utc)

        # Preload upcoming events per club (counts) to compute activity
        upcoming_counts = {
            c.id: s.query(func.count(Event.id))
                    .filter(Event.club_id == c.id, Event.start_time >= now)
                    .scalar()
            for c in clubs
        }

        for c in clubs:
            members_count = len(c.member_ids or [])  # ARRAY(UUID) in your model
            verified = bool(c.verified)
            rating = _avg_rating_for_club(s, c.id)
            next_evt = _next_event_for_club(s, c.id)
            activity = _activity_score(upcoming_counts.get(c.id, 0), verified)
            discover = _discoverability_index(activity, members_count)

            items.append({
                "id": str(c.id),
                "name": c.name,
                "description": c.description,
                "category": "General",             # placeholder; no category field in model
                "school": [],                      # placeholder; no school list in model
                "members": members_count,
                "rating": rating,
                "verified": verified,
                "lastUpdatedISO": c.updated_at.isoformat(),
                "nextEvent": next_evt,
                "website": c.request_info_form_url,  # best available url-ish field
                "contactEmail": c.contact_email, 
                "tags": [],                        # placeholder; no tags model
                "activityScore": activity,
                "discoverabilityIndex": discover,
            })

        # Sort on the server side as requested
        def _key(item):
            if sort_by == "members":
                return item["members"]
            if sort_by == "rating":
                return item["rating"]
            if sort_by == "activity":
                return item["activityScore"]
            if sort_by == "updated":
                return item["lastUpdatedISO"]
            # default: discoverability
            return item["discoverabilityIndex"]

        reverse = sort_by != "updated"  # updated: newest first (max ISO)
        items.sort(key=_key, reverse=reverse)

        return {"items": items, "total": total}

def auth_register(name: str, email: str, password: str) -> Dict[str, Any]:
    #Creates and updates a user. Stores password hash, marks verification and triggers the email
    name = (name or "").strip()
    email = (email or "").strip().lower()
    password = (password or "").strip()
    if not name or not email or not password:
        raise ValueError("Missing name, email, or password.")
    if not _is_emory_email(email):
        raise ValueError("Please use an Emory email to use the Emory Core Nexus.")

    with get_session() as s:
        stu = s.query(Student).filter(func.lower(Student.email) == email).one_or_none()
        if not stu:
            stu = Student(netid=email, name=name, email=email, is_verified=False)
            s.add(stu)
            s.flush()
        # Always (re)set password hash on register to what they provided now
        stu.password_hash = password
        stu.is_verified = True
        user = _serialize_student(stu)

    issued = _now_ts()
    session_token = _sign(f"{user['id']}|{user['email']}|{issued}")
    return {"user": user, "token": session_token, "maxAge": _MAX_AGE}
"""
def complete_verification(token: str) -> Dict[str, Any]:
    #Consumes the clicked verification link and marks it verified.
    info = parse_verify_token(token)
    email = info["email"]

    with get_session() as s:
        stu = s.query(Student).filter(func.lower(Student.email) == email).one_or_none()
        if not stu:
            # If the user somehow clicked verify without a prior register, create a minimal record.
            name = email.split("@", 1)[0]
            stu = Student(netid=email, name=name, email=email, is_verified=True)
            s.add(stu)
            s.flush()
        else:
            stu.is_verified = True
        user = _serialize_student(stu)

    issued = _now_ts()
    session_token = _sign(f"{user['id']}|{user['email']}|{issued}")
    return {"user": user, "token": session_token, "maxAge": _MAX_AGE}
"""
#LOGIN METHOD:

def auth_login(email: str, password: str) -> Dict[str, Any]:
    #login for verified users. This is for all login post registration
    email = (email or "").strip().lower()
    password = (password or "").strip()
    if not email or not password:
        raise ValueError("Missing email or password.")
    if not _is_emory_email(email):
        raise ValueError("Please use an Emory email to use the Emory Core Nexus.")

    with get_session() as s:
        stu = s.query(Student).filter(func.lower(Student.email) == email).one_or_none()
        if not stu or not stu.password_hash:
            raise ValueError("No account for this email. Please register.")
        if (stu.password_hash or "") != password:
            raise ValueError("Incorrect email or password.")
        user = _serialize_student(stu)

    issued = _now_ts()
    token = _sign(f"{user['id']}|{user['email']}|{issued}")
    return {"user": user, "token": token, "maxAge": _MAX_AGE}

