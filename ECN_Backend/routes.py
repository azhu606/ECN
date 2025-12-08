from flask import Blueprint, request, jsonify, make_response, redirect
from services import list_clubs, create_club, list_events, create_event, search_clubs_smart, auth_register, auth_login, auth_me, auth_cookie_name, send_verification_link, complete_verification, _FRONTEND_BASE
import os
from db_ops import get_session
from models import Club, Event, OfficerRole, Student
from sqlalchemy import func

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
@api_bp.get("/clubs/<uuid:club_id>/members")
def get_club_members(club_id):
    """
    Returns a flat member list for a club, including:
    - id
    - name
    - email
    - position: "president" | "officer" | "member"
    - joinDate: ISO string
    - eventsAttended: int

    Uses both Club arrays AND OfficerRole for membership.
    """
    with get_session() as session:
        club = session.get(Club, club_id)
        if not club:
            return jsonify({"error": "Club not found"}), 404

        # base membership from arrays (if you ever use them)
        member_ids = set(
            (club.member_ids or [])
            + (club.officers or [])
            + (club.president_ids or [])
        )

        # add from OfficerRole (source of truth for officers/president)
        role_rows = (
            session.query(OfficerRole)
            .filter(OfficerRole.club_id == club_id)
            .all()
        )

        president_ids = set()
        officer_ids = set()

        for r in role_rows:
            member_ids.add(r.student_id)
            if r.role == "president":
                president_ids.add(r.student_id)
            elif r.role == "officer":
                officer_ids.add(r.student_id)

        if not member_ids:
            return jsonify([])

        students = (
            session.query(Student)
            .filter(Student.id.in_(member_ids))
            .all()
        )

        results = []
        for s in students:
            if s.id in president_ids:
                position = "president"
            elif s.id in officer_ids or club.id in (s.officer_clubs or []):
                position = "officer"
            else:
                position = "member"

            results.append(
                {
                    "id": str(s.id),
                    "name": s.name,
                    "email": s.email,
                    "position": position,
                    "joinDate": s.created_at.isoformat(),
                    "eventsAttended": len(s.attended_events or []),
                }
            )

        # sort by hierarchy
        results.sort(
            key=lambda m: {"president": 0, "officer": 1, "member": 2}.get(m["position"], 3)
        )

        return jsonify(results)



@api_bp.get("/clubs/<uuid:club_id>/events")
def get_club_events(club_id):
    """
    Returns events for a given club, shaped for the ForOfficers UI.
    """
    upcoming = request.args.get("upcoming", "true").lower() != "false"

    with get_session() as session:
        club = session.get(Club, club_id)
        if not club:
            return jsonify({"error": "Club not found"}), 404

        q = session.query(Event).filter(Event.club_id == club_id)

        if upcoming:
            q = q.filter(Event.start_time >= datetime.utcnow())

        events = q.order_by(Event.start_time.asc()).all()

        def fmt_time(dt):
            # "7:00 PM" style
            return dt.strftime("%-I:%M %p") if dt else None

        payload = [
            {
                "id": str(e.id),
                "name": e.title,
                "date": e.start_time.date().isoformat() if e.start_time else None,
                "time": fmt_time(e.start_time),
                "location": e.location,
                "capacity": e.rsvp_limit,
                "registered": len(e.rsvp_ids or []),
                "status": e.status,  # "draft" | "published" | "live"
            }
            for e in events
        ]

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
    """
    DEV/DEMO LOGIN:
    - Looks up Student by email (case-insensitive)
    - Compares password to password_hash *as plain text*
    - Does NOT check is_verified
    """
    body = request.get_json(force=True) or {}
    email = (body.get("email") or "").strip().lower()
    password = (body.get("password") or "")
    #print(password)

    if not email or not password:
        return jsonify({"error": "missing_credentials"}), 400

    with get_session() as session:
        student = (
            session.query(Student)
            .filter(func.lower(Student.email) == email)
            .one_or_none()
        )

        if student is None:
            # this is what currently maps to your "No account for this email" message
            return jsonify({"error": "no account for email, please register"}), 404

        # DEV: compare plain text password to password_hash column
        if (student.password_hash or "") != password:
            return jsonify({"error": "wrong password"}), 401

        # success – return minimal user object
        user_payload = {
            "id": str(student.id),
            "name": student.name,
            "email": student.email,
        }

        return jsonify({"user": user_payload}), 200

'''
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
'''
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



@api_bp.get("/users/<uuid:user_id>/officer-clubs")
def get_user_officer_clubs(user_id):
    """
    Returns all clubs where this user is president / managing_exec / officer.
    Shape:
    [
      { "id": "...", "name": "...", "verified": true },
      ...
    ]
    """
    with get_session() as session:
        # Join OfficerRole -> Club, distinct by club
        rows = (
            session.query(Club)
            .join(OfficerRole, OfficerRole.club_id == Club.id)
            .filter(OfficerRole.student_id == user_id)
            .filter(OfficerRole.role.in_(["president", "managing_exec", "officer"]))
            .distinct(Club.id)
            .all()
        )

        payload = [
            {
                "id": str(c.id),
                "name": c.name,
                "verified": c.verified,
            }
            for c in rows
        ]
        return jsonify(payload)


from sqlalchemy import func  # if not already imported
# ...

@api_bp.get("/students/<uuid:student_id>/officer-clubs")
def get_officer_clubs(student_id):
    """
    Return all clubs where this student has an officer role
    (president or officer).
    """
    with get_session() as session:
        rows = (
            session.query(OfficerRole, Club)
            .join(Club, OfficerRole.club_id == Club.id)
            .filter(
                OfficerRole.student_id == student_id,
                OfficerRole.role.in_(["president", "officer"]),
            )
            .all()
        )

        # de-duplicate clubs in case the student has multiple roles
        clubs_by_id = {}
        for role, club in rows:
            if club.id not in clubs_by_id:
                clubs_by_id[club.id] = {
                    "id": str(club.id),
                    "name": club.name,
                    "verified": bool(club.verified),
                    "role": role.role,  # "president" or "officer"
                }

        return jsonify(list(clubs_by_id.values()))


