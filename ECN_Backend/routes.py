from flask import Blueprint, request, jsonify, make_response, redirect
from services import list_clubs, create_club, list_events, create_event, search_clubs_smart, auth_register, auth_login, auth_me, auth_cookie_name, send_verification_link, complete_verification, _FRONTEND_BASE
import os

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

# =================== SPRINT 6 ROUTES =======================
@api_bp.post("/auth/register")
def auth_register_route():
    #entrypoint for register, hash sets and sends verify link or returns it in dev
    try:
        body = request.get_json(force=True) or {}
        name = (body.get("name") or "").strip()
        email = (body.get("email") or "").strip()
        password = (body.get("password") or "").strip()
        result = auth_register(name=name, email=email, password=password)
        
        if os.getenv("ECN_EMAIL_MODE", "dev").lower() == "smtp":
            #PRODUCT VERSION: sends the actual email
            return jsonify({"ok": True, "user": result["user"]})
        else:
            #DEVELOPMENT VERSION: just returns a clickable url
            return jsonify({"ok": True, "verifyUrl": result["verifyUrl"], "user": result["user"]})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@api_bp.post("/auth/request-link")
def auth_request_link():
    #Resends verification link
    try:
        body = request.get_json(force=True) or {}
        email = (body.get("email") or "").strip()
        url = send_verification_link(email)
        
        if os.getenv("ECN_EMAIL_MODE", "dev").lower() == "smtp":
            return jsonify({"ok": True})
        else:
            return jsonify({"ok": True, "verifyUrl": url})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@api_bp.get("/auth/verify")
def auth_verify():
    #Endpoint the email link. Verifies user, sets cookie and then redirects to frontend
    token = request.args.get("token", "")
    try:
        result = complete_verification(token)
        resp = make_response(redirect(_FRONTEND_BASE))
        resp.set_cookie(
            auth_cookie_name(),
            result["token"],
            max_age=result["maxAge"],
            httponly=True,
            samesite="Lax",
            secure= os.getenv("ECN_COOKIE_SECURE", "false").lower() == "true",
            path="/",
        )
        return resp
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@api_bp.post("/auth/login")
def auth_login_route():
    #Email + password login
    try:
        body = request.get_json(force=True) or {}
        email = (body.get("email") or "").strip()
        password = (body.get("password") or "").strip()

        result = auth_login(email=email, password=password)
        resp = make_response(jsonify({"user": result["user"]}))
        resp.set_cookie(
            auth_cookie_name(),
            result["token"],
            max_age=result["maxAge"],
            httponly=True,
            samesite="Lax",
            secure=os.getenv("ECN_COOKIE_SECURE", "false").lower() == "true",
            path="/",
        )
        return resp
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    
@api_bp.get("/auth/me")
def auth_me_route():
    #Returns the current user from the cookie
    token = request.cookies.get(auth_cookie_name(), "")
    try:
        result = auth_me(token)
        return jsonify(result)
    except ValueError as e:
        return jsonify({"error": str(e)}), 401

@api_bp.post("/auth/logout")
def auth_logout_route():
    #Clears the cookie to log out
    resp = make_response(jsonify({"ok": True}))
    resp.set_cookie(
        auth_cookie_name(), 
        "", 
        max_age=0, 
        httponly=True, 
        samesite="Lax", 
        secure=os.getenv("ECN_COOKIE_SECURE", "false").lower() == "true", 
        path="/",
        )
    return resp
