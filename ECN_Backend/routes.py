from flask import Blueprint, request, jsonify
from sqlalchemy import func
from db_ops import get_session
from models import Club, Event, Review

api_bp = Blueprint("api", __name__, url_prefix="/api")

# ---------- Clubs ----------
@api_bp.get("/clubs")
def get_clubs():
    from services import list_clubs, search_clubs_smart  # local import avoids circulars

    q = request.args.get("q", "").strip()
    school = request.args.get("school")
    category = request.args.get("category")
    verified = request.args.get("verified", "false").lower() == "true"
    sort = request.args.get("sort", "discoverability")
    try:
        limit = int(request.args.get("limit", "50"))
        offset = int(request.args.get("offset", "0"))
    except Exception:
        limit, offset = 50, 0

    if request.args.get("smart", "false").lower() == "true":
        return jsonify(search_clubs_smart(q=q))

    data = list_clubs(
        q=q,
        school=school,
        category=category,
        verified_only=verified,
        sort_by=sort,
        limit=limit,
        offset=offset,
    )
    return jsonify(data)


@api_bp.post("/clubs")
def post_club():
    from services import create_club  # local import avoids circulars

    payload = request.get_json(force=True) or {}
    club_id = create_club(payload)
    return jsonify({"id": club_id}), 201


# ---------- Events ----------
@api_bp.get("/events")
def get_events():
    from services import list_events  # local import avoids circulars

    upcoming = request.args.get("upcoming", "true").lower() != "false"
    return jsonify(list_events(upcoming_only=upcoming))


@api_bp.post("/events")
def post_event():
    from services import create_event  # local import avoids circulars

    payload = request.get_json(force=True) or {}
    event_id = create_event(payload)
    return jsonify({"id": event_id}), 201


# ---------- Health ----------
@api_bp.get("/health")
def health():
    return {"ok": True}


# ---------- Officer / Analytics ----------
@api_bp.get("/clubs/<uuid:club_id>/metrics")
def get_club_metrics(club_id):
    with get_session() as session:
        club = session.get(Club, club_id)
        if not club:
            return jsonify({"error": "Club not found"}), 404

        members = len(club.member_ids or [])

        events = session.query(Event).filter(Event.club_id == club_id).all()
        total_registered = sum(len(e.rsvp_ids or []) for e in events)
        total_attended = sum(len(e.attendee_ids or []) for e in events)
        attendance_rate = round(
            (total_attended / total_registered) * 100, 1
        ) if total_registered else 0.0

        # (Optional) rating example if you need later:
        # avg_rating = session.query(func.avg(Review.rating))\
        #     .filter(Review.club_id == club_id).scalar() or 0

        # Simple placeholders—replace with real analytics later
        member_growth = 12
        profile_views = 245
        profile_growth = 8
        freshness_score = 92
        engagement_score = min(100, int(0.6 * attendance_rate + 0.4 * 85))

        event_attendance = int(round(total_attended / len(events))) if events else 0

        payload = {
            "members": members,
            "memberGrowth": member_growth,
            "eventAttendance": event_attendance,
            "attendanceRate": attendance_rate,
            "profileViews": profile_views,
            "profileGrowth": profile_growth,
            "freshnessScore": freshness_score,
            "engagementScore": engagement_score,
        }
        return jsonify(payload)
