# services.py
from datetime import datetime, timedelta
from typing import Any, Dict
from models import db, Club, Event, Tag, ClubContact
import difflib
import re
from sqlalchemy import or_, func

# ---- Helpers for smart search
def _normalize_text(s: str) -> str:
    tokens = re.findall(r"[a-z0-9]+", (s or "").lower())
    return " ".join(tokens)

def _tokenize(s: str) -> list[str]:
    return _normalize_text(s).split()

def _fuzzy_any_match(q_word: str, title_words: list[str], cutoff: float = 0.82) -> bool:
    if q_word in title_words:
        return True
    # difflib-based single-word fuzzy
    return bool(difflib.get_close_matches(q_word, title_words, n=1, cutoff=cutoff))

def _officer_roles() -> set[str]:
    """
    WE NEED TO MAKE THIS USER EDITABLE, I THINK
    Some clubs have C-suites, some have specific managers and stuff
    Put whatever roles will appear on the DB here:
    """
    return {
        "president",
        "vice president",
        "treasurer",
    }
# ---- Clubs ----
def list_clubs(q: str = "", tags: list[str] | None = None) -> Dict[str, Any]:
    query = Club.query
    if q:
        pattern = f"%{q.lower()}%"
        query = query.filter(db.func.lower(Club.name).like(pattern) | db.func.lower(Club.short_description).like(pattern))
    if tags:
        query = query.join(Club.tags).filter(Tag.slug.in_(tags))
    clubs = query.order_by(Club.updated_at.desc()).all()
    items = [{
        "id": c.id,
        "name": c.name,
        "shortDescription": c.short_description,
        "tags": [t.slug for t in c.tags],
        "updatedAt": c.updated_at.isoformat(),
        "verifiedContacts": [{"id": cc.id, "name": cc.name, "role": cc.role, "email": cc.email}
                             for cc in c.contacts if cc.verified],
    } for c in clubs]
    return {"items": items, "total": len(items)}

def create_club(payload: dict) -> int:
    if not payload.get("name"): raise ValueError("name is required")
    c = Club(name=payload["name"], short_description=payload.get("shortDescription",""))
    db.session.add(c); db.session.commit()
    return c.id

# ---- Events ----
def list_events(upcoming_only: bool = True):
    q = Event.query
    if upcoming_only:
        q = q.filter(Event.starts_at >= datetime.utcnow() - timedelta(days=1))
    return [{
        "id": e.id, "clubId": e.club_id, "title": e.title,
        "startsAt": e.starts_at.isoformat(), "location": e.location,
        "rsvpOpen": e.rsvp_open, "rsvpCount": e.rsvp_count
    } for e in q.order_by(Event.starts_at.asc()).all()]

def create_event(payload: dict) -> int:
    req = ["clubId", "title", "startsAt"]
    missing = [k for k in req if not payload.get(k)]
    if missing: raise ValueError(f"missing: {', '.join(missing)}")
    e = Event(
        club_id=payload["clubId"],
        title=payload["title"],
        starts_at=datetime.fromisoformat(payload["startsAt"]),
        ends_at=datetime.fromisoformat(payload["endsAt"]) if payload.get("endsAt") else None,
        location=payload.get("location"),
    )
    db.session.add(e); db.session.commit()
    return e.id

# ---- Smart Search Algorithm

def search_clubs_smart(q: str = "", tags: list[str] | None = None, fuzzy_cutoff: float = 0.82) -> Dict[str, Any]:
    """
    Smart search behavior:
      - Embedded logic 1: If #query_words > #words_in_club_name -> skip that club.
      - Embedded logic 2: Typo-tolerant per-word matching against club name words.
      - Officer search: If query matches a verified contact's name, AND that contact's
        role is in OFFICER_ROLES, return the club as well.

    Returns the SAME shape as list_clubs(..).
    """
    q_norm = _normalize_text(q)
    q_words = _tokenize(q_norm)

    # If no query, just fall back to list_clubs with optional tag filter
    if not q_words and not tags:
        return list_clubs(q="", tags=None)

    # --- Step 1: Build a *broad* SQL candidate set so we don't pull the whole DB.
    base = db.session.query(Club)

    if tags:
        base = base.join(Club.tags).filter(Tag.slug.in_(tags))

    if q_words:
        # Rough SQL-side filter (broad net): name or short_description or officer name ILIKE any token
        like_clauses = []
        for w in q_words:
            pat = f"%{w}%"
            like_clauses.append(func.lower(Club.name).like(pat))
            like_clauses.append(func.lower(Club.short_description).like(pat))
        # Join contacts for name filtering (LEFT OUTER JOIN so clubs without contacts still show on title hits)
        base = base.outerjoin(ClubContact, ClubContact.club_id == Club.id)
        for w in q_words:
            pat = f"%{w}%"
            like_clauses.append(func.lower(ClubContact.name).like(pat))

        base = base.filter(or_(*like_clauses))

    # Prefer recently updated
    candidates: list[Club] = base.order_by(Club.updated_at.desc()).all()

    seen = set()
    unique_candidates: list[Club] = []
    for c in candidates:
        if c.id not in seen:
            seen.add(c.id)
            unique_candidates.append(c)
    candidates = unique_candidates

    # --- Step 2: Refine in Python with your rules
    OFFICER_ROLES = {r.lower() for r in _officer_roles()}
    matched_ids: set[int] = set()

    for c in candidates:
        name_words = _tokenize(c.name)

        # Embedded logic 1: skip if query has more words than the club title
        if q_words and len(q_words) > len(name_words):
            # we may still include via officer name match (below), so don't 'continue' yet
            pass
        else:
            # Embedded logic 2: typo-tolerant (OR semantics across query words)
            if q_words and any(_fuzzy_any_match(qw, name_words, cutoff=fuzzy_cutoff) for qw in q_words):
                matched_ids.add(c.id)

        # Officer name search:
        # If ANY verified contact's normalized name fuzzily matches the WHOLE query string,
        # and their role is in OFFICER_ROLES, include the club.
        # (You can relax to per-word matching if you like—this is stricter/cleaner.)
        for cc in c.contacts:
            if not cc.verified:
                continue
            if cc.role and cc.role.lower() not in OFFICER_ROLES:
                continue
            cc_name_norm = _normalize_text(cc.name)
            # try exact first, then fuzzy on full string
            if cc_name_norm and (cc_name_norm == q_norm or difflib.SequenceMatcher(None, cc_name_norm, q_norm).ratio() >= 0.86):
                matched_ids.add(c.id)
                break  # no need to check more contacts

    # Preserve order from 'candidates' (recent first)
    matched_in_order = [c for c in candidates if c.id in matched_ids]

    items = [{
        "id": c.id,
        "name": c.name,
        "shortDescription": c.short_description,
        "tags": [t.slug for t in c.tags],
        "updatedAt": c.updated_at.isoformat(),
        "verifiedContacts": [
            {"id": cc.id, "name": cc.name, "role": cc.role, "email": cc.email}
            for cc in c.contacts if cc.verified
        ],
    } for c in matched_in_order]

    return {"items": items, "total": len(items)}
