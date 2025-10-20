from datetime import datetime, timedelta
from typing import Any, Dict, List
from db_ops import get_session
from models import Club, Event
import difflib
import re
from sqlalchemy import func, or_

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
        q = s.query(Event)
        if upcoming_only:
            q = q.filter(Event.start_time >= datetime.utcnow() - timedelta(days=1))
        events = q.order_by(Event.start_time.asc()).all()
        return [{
            "id": str(e.id),
            "clubId": str(e.club_id),
            "title": e.title,
            "startTime": e.start_time.isoformat(),
            "endTime": e.end_time.isoformat() if e.end_time else None,
            "location": e.location,
            "status": e.status
        } for e in events]

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

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from sqlalchemy import func, or_
from db_ops import get_session
from models import Club, Event, Review

def _avg_rating_for_club(session, club_id) -> float:
    # average rating; default to 4.6 if no reviews
    row = session.query(func.avg(Review.rating)).filter(Review.club_id == club_id).one()
    try:
        val = float(row[0]) if row[0] is not None else 4.6
    except Exception:
        val = 4.6
    return round(val, 1)

def _next_event_for_club(session, club_id) -> Optional[dict]:
    now = datetime.utcnow()
    evt = (
        session.query(Event)
        .filter(Event.club_id == club_id, Event.start_time >= now)
        .order_by(Event.start_time.asc())
        .first()
    )
    if not evt:
        return None
    # simple pretty date/time
    date_str = evt.start_time.strftime("%b %d")
    time_str = evt.start_time.strftime("%-I:%M %p")
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
        now = datetime.utcnow()

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
