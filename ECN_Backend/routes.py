from flask import Blueprint, request, jsonify
from services import list_clubs, create_club, list_events, create_event, search_clubs_smart

api_bp = Blueprint("api", __name__)

@api_bp.get("/clubs")
def get_clubs():
    q = request.args.get("q", "").strip()
    school = request.args.get("school")  # currently unused placeholder
    category = request.args.get("category")  # currently unused placeholder
    verified = request.args.get("verified", "false").lower() == "true"
    sort = request.args.get("sort", "discoverability")
    try:
        limit = int(request.args.get("limit", "50"))
        offset = int(request.args.get("offset", "0"))
    except Exception:
        limit, offset = 50, 0

    # If "smart=true", use smart search
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
    payload = request.get_json(force=True) or {}
    club_id = create_club(payload)
    return jsonify({"id": club_id}), 201

@api_bp.get("/events")
def get_events():
    upcoming = request.args.get("upcoming", "true").lower() != "false"
    return jsonify(list_events(upcoming_only=upcoming))

@api_bp.post("/events")
def post_event():
    payload = request.get_json(force=True) or {}
    event_id = create_event(payload)
    return jsonify({"id": event_id}), 201

@api_bp.get("/health")
def health():
    return {"ok": True}
