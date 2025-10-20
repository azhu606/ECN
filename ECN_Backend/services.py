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
