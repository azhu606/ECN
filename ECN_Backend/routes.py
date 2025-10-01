# routes.py
from flask import Blueprint, request, jsonify
from services import list_clubs, create_club, list_events, create_event, search_clubs_smart

api_bp = Blueprint("api", __name__)

@api_bp.get("/clubs")
def get_clubs():
    q = request.args.get("q", "")
    tags = request.args.getlist("tags")
    use_smart = request.args.get("smart", "false").lower() == "true"
    if use_smart:
        return jsonify(search_clubs_smart(q=q, tags=tags))
    return jsonify(list_clubs(q=q, tags=tags))

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
