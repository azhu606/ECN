from flask import Blueprint, request, jsonify, make_response, redirect
from services import list_clubs, create_club, list_events, create_event, search_clubs_smart, auth_register, auth_login, auth_me, auth_cookie_name, send_verification_link, complete_verification, _FRONTEND_BASE
import os
from db_ops import get_session
from models import Club, Event, OfficerRole, Student

api_bp = Blueprint("api", __name__)

@api_bp.get("/clubs")
def get_clubs():
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

# ----------------- Events --------------------

@api_bp.get("/events")
def get_events():
    upcoming = request.args.get("upcoming", "true").lower() != "false"
    return jsonify(list_events(upcoming_only=upcoming))

@api_bp.post("/events")
def post_event():
    payload = request.get_json(force=True) or {}
    event_id = create_event(payload)
    return jsonify({"id": event_id}), 201

# ------------ Health ----------------
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

        #RAGHAV WHOEVER DID THE METRICS LEFT THIS AS A PLACEHOLDER.
        #I DONT THINK THIS IS USEFUL AT ALL BUT NOT DELETING IT IN CASE

        """
        # (Optional) rating example if you need later:
        avg_rating = session.query(func.avg(Review.rating))\
             .filter(Review.club_id == club_id).scalar() or 0

        #Simple placeholders—replace with real analytics later
        """

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

# ---------- User Registration and Login ----------------
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


from datetime import datetime
from flask import Blueprint, request, jsonify
from db_ops import get_session
from models import Club

# ... existing code ...

# ---------- Club Profile (GET / PUT) ----------

@api_bp.get("/clubs/<uuid:club_id>/profile")
def get_club_profile(club_id):
    """
    Returns the editable profile for a single club + lightweight leadership info.
    """
    from datetime import datetime  

    with get_session() as session:
        club = session.get(Club, club_id)
        if not club:
            return jsonify({"error": "Club not found"}), 404

        # ---------- Leadership (president + officers) ----------
        # President (first president role we find)
        pres_row = (
            session.query(OfficerRole, Student)
            .join(Student, OfficerRole.student_id == Student.id)
            .filter(
                OfficerRole.club_id == club_id,
                OfficerRole.role == "president",
            )
            .first()
        )

        president = None
        if pres_row:
            pres_role, pres_student = pres_row
            president = {
                "name": pres_student.name,
                "email": pres_student.email,
            }

        # Officers (role = "officer")
        officer_rows = (
            session.query(OfficerRole, Student)
            .join(Student, OfficerRole.student_id == Student.id)
            .filter(
                OfficerRole.club_id == club_id,
                OfficerRole.role == "officer",
            )
            .all()
        )

        officers_list = [
            {
                "name": stu.name,
                "email": stu.email,
                "role": role.role.replace("_", " ").title(),  # e.g. "officer" -> "Officer"
            }
            for (role, stu) in officer_rows
        ]

        officers_payload = (
            {
                "president": president,
                "officers": officers_list,
            }
            if (president or officers_list)
            else None
        )

        # Optional generic meeting info (for demo purposes)
        meeting_info = f"General meetings for {club.name} are scheduled by the officers. Check your email or website for details."

        payload = {
            "id": str(club.id),
            "name": club.name,
            "description": club.description,
            "purpose": club.purpose,
            "activities": club.activities,
            "mediaUrls": club.media_urls or [],
            "contactEmail": club.contact_email,
            "contactPhone": club.contact_phone,
            "requestInfoFormUrl": club.request_info_form_url,
            "status": club.status,
            "verified": club.verified,
            "lastUpdatedAt": (
                club.last_updated_at.isoformat() if club.last_updated_at else None
            ),
            "updateRecencyBadge": club.update_recency_badge,
            "officers": officers_payload,
            "meetingInfo": meeting_info,
        }
        return jsonify(payload)

@api_bp.put("/clubs/<uuid:club_id>/profile")
def update_club_profile(club_id):
    """
    Updates the editable profile fields for a club.

    Expects JSON body with any subset of:
    - name
    - description
    - purpose
    - activities
    - mediaUrls (array of strings)
    - contactEmail
    - contactPhone
    - requestInfoFormUrl
    - status  (e.g. 'active' | 'inactive' | 'delisted')
    """
    body = request.get_json(force=True) or {}

    allowed_fields = {
        "name",
        "description",
        "purpose",
        "activities",
        "mediaUrls",
        "contactEmail",
        "contactPhone",
        "requestInfoFormUrl",
        "status",
    }

    if not any(k in body for k in allowed_fields):
        return jsonify({"error": "No updatable fields provided"}), 400

    with get_session() as session:
        club = session.get(Club, club_id)
        if not club:
            return jsonify({"error": "Club not found"}), 404

        # Map camelCase -> DB column names
        if "name" in body:
            club.name = body["name"]
        if "description" in body:
            club.description = body["description"]
        if "purpose" in body:
            club.purpose = body["purpose"]
        if "activities" in body:
            club.activities = body["activities"]
        if "mediaUrls" in body:
            club.media_urls = body["mediaUrls"] or []
        if "contactEmail" in body:
            club.contact_email = body["contactEmail"]
        if "contactPhone" in body:
            club.contact_phone = body["contactPhone"]
        if "requestInfoFormUrl" in body:
            club.request_info_form_url = body["requestInfoFormUrl"]
        if "status" in body:
            club.status = body["status"]

        # Update timestamps / badges
        club.last_updated_at = datetime.utcnow()
        club.update_recency_badge = body.get(
            "updateRecencyBadge", club.update_recency_badge
        )

        session.add(club)
        session.commit()
        session.refresh(club)

        payload = {
            "id": str(club.id),
            "name": club.name,
            "description": club.description,
            "purpose": club.purpose,
            "activities": club.activities,
            "mediaUrls": club.media_urls or [],
            "contactEmail": club.contact_email,
            "contactPhone": club.contact_phone,
            "requestInfoFormUrl": club.request_info_form_url,
            "status": club.status,
            "verified": club.verified,
            "lastUpdatedAt": (
                club.last_updated_at.isoformat() if club.last_updated_at else None
            ),
            "updateRecencyBadge": club.update_recency_badge,
        }
        return jsonify(payload)
