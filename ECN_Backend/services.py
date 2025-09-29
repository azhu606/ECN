# services.py
from datetime import datetime, timedelta
from typing import Any, Dict
from models import db, Club, Event, Tag, ClubContact

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
