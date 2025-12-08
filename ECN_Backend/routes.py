from flask import Blueprint, request, jsonify, make_response, redirect
from services import list_clubs, create_club, list_events, create_event, search_clubs_smart, auth_register, auth_login, auth_me, auth_cookie_name
import os
from db_ops import get_session
from models import Club, Event, OfficerRole, Student
from sqlalchemy import func
from datetime import datetime

from datetime import datetime
import uuid

from models import Club, Event, OfficerRole, Student, EventRsvp


def _parse_iso_dt(value: str | None):
    if not value:
        return None
    v = value
    if v.endswith("Z"):
        v = v[:-1] + "+00:00"
    return datetime.fromisoformat(v)

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
                "description": e.description,
                "date": e.start_time.date().isoformat() if e.start_time else None,
                "time": fmt_time(e.start_time),
                "startTime": e.start_time.isoformat() if e.start_time else None,
                "location": e.location,
                "capacity": e.rsvp_limit,
                "registered": len(e.rsvp_ids or []),
                "status": e.status,  # "draft" | "published" | "live"
            }
            for e in events
        ]

        return jsonify(payload)

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
        
        return jsonify({"ok": True, "user": result["user"]})
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


@api_bp.put("/events/<uuid:event_id>")
def update_event(event_id):
    """
    Update basic fields of an event.
    Expects JSON body with optional:
      - title
      - description
      - location
      - capacity
      - startTime (ISO)
      - endTime (ISO)
    """
    body = request.get_json(force=True) or {}

    with get_session() as session:
        event = session.get(Event, event_id)
        if not event:
            return jsonify({"error": "Event not found"}), 404

        if "title" in body:
            event.title = body["title"]
        if "description" in body:
            event.description = body["description"]
        if "location" in body:
            event.location = body["location"]
        if "capacity" in body:
            event.rsvp_limit = body["capacity"]

        if "startTime" in body:
            event.start_time = _parse_iso_dt(body["startTime"])
        if "endTime" in body:
            event.end_time = _parse_iso_dt(body["endTime"])

        session.add(event)
        session.commit()

        return jsonify({"ok": True})

@api_bp.delete("/events/<uuid:event_id>")
def delete_event(event_id):
    with get_session() as session:
        event = session.get(Event, event_id)
        if not event:
            return jsonify({"error": "Event not found"}), 404

        session.delete(event)
        session.commit()
        return jsonify({"ok": True})

from datetime import datetime
from uuid import UUID

from flask import Blueprint, request, jsonify
from uuid import UUID
from datetime import datetime

from models import Student, Event, EventRsvp  # we don't need RsvpStatus here
from db_ops import get_session



from uuid import UUID
from datetime import datetime

from models import Student, Event, EventRsvp
from db_ops import get_session


from datetime import datetime
from flask import current_app  # at top of routes.py if not already

from db_ops import get_session
from models import Student, Event, EventRsvp

# ============================================================
# MY CLUBS ENDPOINTS - Add these to your routes.py
# ============================================================
# Add these imports at the top of routes.py if not already present:
# from models import Student, Club, Event, OfficerRole, EventRsvp
# from db_ops import get_session
# from datetime import datetime, timezone, timedelta
# from sqlalchemy import func
# ============================================================

# ---------- My Clubs Endpoints ----------

@api_bp.get("/students/<uuid:student_id>/my-clubs")
def get_student_my_clubs(student_id):
    """
    Returns all clubs a student has joined OR is an officer of, with engagement metrics and upcoming events.
    """
    from datetime import datetime, timezone, timedelta
    
    with get_session() as session:
        student = session.get(Student, student_id)
        if not student:
            return jsonify({"error": "Student not found"}), 404
        
        # Get club IDs from student's my_clubs array
        club_ids_from_my_clubs = set(student.my_clubs or [])
        
        # Get club IDs from student's officer_clubs array
        club_ids_from_officer_clubs = set(student.officer_clubs or [])
        
        # Get club IDs from OfficerRole table (most reliable source)
        officer_role_rows = (
            session.query(OfficerRole)
            .filter(OfficerRole.student_id == student_id)
            .all()
        )
        club_ids_from_officer_roles = set(r.club_id for r in officer_role_rows)
        
        # Combine all sources of club membership
        club_ids = list(club_ids_from_my_clubs | club_ids_from_officer_clubs | club_ids_from_officer_roles)
        
        if not club_ids:
            return jsonify([])
        
        # Fetch all clubs
        clubs = session.query(Club).filter(Club.id.in_(club_ids)).all()
        
        # Get officer roles for this student
        officer_roles = (
            session.query(OfficerRole)
            .filter(
                OfficerRole.student_id == student_id,
                OfficerRole.club_id.in_(club_ids)
            )
            .all()
        )
        
        # Build role lookup: club_id -> role
        role_lookup = {}
        for r in officer_roles:
            # Prioritize higher roles
            current = role_lookup.get(r.club_id)
            if r.role == "president":
                role_lookup[r.club_id] = "President"
            elif r.role in ("managing_exec", "officer") and current != "President":
                role_lookup[r.club_id] = "Officer"
        
        results = []
        # Use timezone-aware datetime
        now = datetime.now(timezone.utc)
        
        for club in clubs:
            # Determine role
            role = role_lookup.get(club.id, "Member")
            
            # Get member count
            member_count = len(club.member_ids or [])
            
            # Get upcoming events for this club
            upcoming_events = (
                session.query(Event)
                .filter(
                    Event.club_id == club.id,
                    Event.start_time >= now
                )
                .order_by(Event.start_time.asc())
                .limit(3)
                .all()
            )
            
            # Get recent events (past 30 days) for activity
            recent_events = (
                session.query(Event)
                .filter(
                    Event.club_id == club.id,
                    Event.start_time >= now - timedelta(days=30)
                )
                .order_by(Event.start_time.desc())
                .limit(5)
                .all()
            )
            
            # Calculate engagement score based on student's participation
            student_rsvped = student.rsvped_events or []
            student_attended = student.attended_events or []
            club_event_ids = [e.id for e in recent_events]
            
            rsvped_count = len([eid for eid in student_rsvped if eid in club_event_ids])
            attended_count = len([eid for eid in student_attended if eid in club_event_ids])
            
            if len(club_event_ids) > 0:
                engagement = min(100, int((attended_count / len(club_event_ids)) * 100 + (rsvped_count * 10)))
            else:
                engagement = 50  # Default for clubs with no recent events
            
            # Format next event
            next_event = None
            if upcoming_events:
                e = upcoming_events[0]
                next_event = {
                    "id": str(e.id),
                    "name": e.title,
                    "date": e.start_time.strftime("%b %d") if e.start_time else None,
                    "time": e.start_time.strftime("%-I:%M %p") if e.start_time else None,
                }
            
            # Build recent activity from events
            recent_activity = []
            for e in recent_events[:3]:
                # Make sure we're comparing timezone-aware datetimes
                event_time = e.start_time
                if event_time:
                    # If event_time is naive, make it aware
                    if event_time.tzinfo is None:
                        event_time = event_time.replace(tzinfo=timezone.utc)
                    
                    if event_time < now:
                        time_diff = now - event_time
                    else:
                        time_diff = event_time - now
                    
                    if time_diff.days > 0:
                        time_str = f"{time_diff.days} day{'s' if time_diff.days > 1 else ''} ago"
                    elif time_diff.seconds > 3600:
                        hours = time_diff.seconds // 3600
                        time_str = f"{hours} hour{'s' if hours > 1 else ''} ago"
                    else:
                        time_str = "Recently"
                    
                    activity_type = "event" if event_time >= now else "update"
                else:
                    time_str = "Recently"
                    activity_type = "update"
                
                recent_activity.append({
                    "type": activity_type,
                    "title": e.title,
                    "time": time_str,
                })
            
            # Calculate last activity time
            last_activity = "Unknown"
            if club.updated_at:
                updated_at = club.updated_at
                # If updated_at is naive, make it aware
                if updated_at.tzinfo is None:
                    updated_at = updated_at.replace(tzinfo=timezone.utc)
                
                time_diff = now - updated_at
                if time_diff.days > 0:
                    last_activity = f"{time_diff.days} day{'s' if time_diff.days > 1 else ''} ago"
                elif time_diff.seconds > 3600:
                    hours = time_diff.seconds // 3600
                    last_activity = f"{hours} hour{'s' if hours > 1 else ''} ago"
                else:
                    last_activity = "Recently"
            
            results.append({
                "id": str(club.id),
                "name": club.name,
                "role": role,
                "joinDate": student.created_at.isoformat() if student.created_at else None,
                "category": "General",  # You may want to add a category field to Club model
                "verified": club.verified,
                "lastActivity": last_activity,
                "memberCount": member_count,
                "engagement": engagement,
                "nextEvent": next_event,
                "recentActivity": recent_activity,
            })
        
        # Sort by role priority (President > Officer > Member)
        role_priority = {"President": 0, "Officer": 1, "Member": 2}
        results.sort(key=lambda x: role_priority.get(x["role"], 3))
        
        return jsonify(results)


@api_bp.get("/students/<uuid:student_id>/upcoming-events")
def get_student_upcoming_events(student_id):
    """
    Returns all upcoming events from clubs the student has joined or is an officer of.
    """
    from datetime import datetime, timezone
    
    with get_session() as session:
        student = session.get(Student, student_id)
        if not student:
            return jsonify({"error": "Student not found"}), 404
        
        # Get all club IDs (from my_clubs, officer_clubs, and OfficerRole table)
        club_ids_set = set(student.my_clubs or [])
        club_ids_set.update(student.officer_clubs or [])
        
        # Also check OfficerRole table
        officer_role_club_ids = (
            session.query(OfficerRole.club_id)
            .filter(OfficerRole.student_id == student_id)
            .all()
        )
        club_ids_set.update(r[0] for r in officer_role_club_ids)
        
        club_ids = list(club_ids_set)
        
        if not club_ids:
            return jsonify([])
        
        # Use timezone-aware datetime
        now = datetime.now(timezone.utc)
        
        # Get upcoming events from student's clubs
        events = (
            session.query(Event, Club)
            .join(Club, Event.club_id == Club.id)
            .filter(
                Event.club_id.in_(club_ids),
                Event.start_time >= now
            )
            .order_by(Event.start_time.asc())
            .limit(20)
            .all()
        )
        
        # Check which events student has RSVPed to
        student_rsvped = set(student.rsvped_events or [])
        
        results = []
        for event, club in events:
            results.append({
                "id": str(event.id),
                "name": event.title,
                "description": event.description,
                "clubId": str(club.id),
                "clubName": club.name,
                "date": event.start_time.strftime("%b %d") if event.start_time else None,
                "time": event.start_time.strftime("%-I:%M %p") if event.start_time else None,
                "startTime": event.start_time.isoformat() if event.start_time else None,
                "location": event.location,
                "capacity": event.rsvp_limit,
                "registered": len(event.rsvp_ids or []),
                "isRsvped": event.id in student_rsvped,
            })
        
        return jsonify(results)


@api_bp.get("/students/<uuid:student_id>/stats")
def get_student_stats(student_id):
    """
    Returns aggregated stats for the student's club memberships.
    """
    from datetime import datetime, timezone
    
    with get_session() as session:
        student = session.get(Student, student_id)
        if not student:
            return jsonify({"error": "Student not found"}), 404
        
        # Get all club IDs (from my_clubs, officer_clubs, and OfficerRole table)
        club_ids_set = set(student.my_clubs or [])
        club_ids_set.update(student.officer_clubs or [])
        
        # Also check OfficerRole table
        officer_role_club_ids = (
            session.query(OfficerRole.club_id)
            .filter(OfficerRole.student_id == student_id)
            .all()
        )
        club_ids_set.update(r[0] for r in officer_role_club_ids)
        
        club_ids = list(club_ids_set)
        clubs_joined = len(club_ids)
        
        # Count leadership roles
        leadership_roles = (
            session.query(OfficerRole)
            .filter(
                OfficerRole.student_id == student_id,
                OfficerRole.role.in_(["president", "managing_exec", "officer"])
            )
            .count()
        )
        
        # Count upcoming events from student's clubs
        # Use timezone-aware datetime
        now = datetime.now(timezone.utc)
        upcoming_events = 0
        if club_ids:
            upcoming_events = (
                session.query(Event)
                .filter(
                    Event.club_id.in_(club_ids),
                    Event.start_time >= now
                )
                .count()
            )
        
        # Calculate average engagement (simplified)
        attended = len(student.attended_events or [])
        rsvped = len(student.rsvped_events or [])
        avg_engagement = min(100, int((attended + rsvped) * 5)) if (attended + rsvped) > 0 else 50
        
        return jsonify({
            "clubsJoined": clubs_joined,
            "upcomingEvents": upcoming_events,
            "leadershipRoles": leadership_roles,
            "avgEngagement": avg_engagement,
        })


@api_bp.post("/clubs/<uuid:club_id>/join")
def join_club(club_id):
    """
    Add a student to a club's member list.
    
    Request JSON:
      { "userId": "<student_uuid>" }
    
    Response:
      201 { "joined": true, "memberCount": <int> }
    """
    data = request.get_json(force=True) or {}
    student_id = data.get("userId") or data.get("studentId")
    
    if not student_id:
        return jsonify({"error": "missing_user_id", "detail": "userId is required"}), 400
    
    with get_session() as session:
        student = session.get(Student, student_id)
        if not student:
            return jsonify({"error": "student_not_found"}), 404
        
        club = session.get(Club, club_id)
        if not club:
            return jsonify({"error": "club_not_found"}), 404
        
        # Check if already a member
        student_clubs = list(student.my_clubs or [])
        club_members = list(club.member_ids or [])
        
        if club.id in student_clubs:
            return jsonify({"error": "already_member", "detail": "Student is already a member of this club"}), 400
        
        # Add to both arrays
        student_clubs.append(club.id)
        club_members.append(student.id)
        
        student.my_clubs = student_clubs
        club.member_ids = club_members
        
        session.add(student)
        session.add(club)
        session.commit()
        
        return jsonify({
            "joined": True,
            "memberCount": len(club_members),
        }), 201


@api_bp.post("/clubs/<uuid:club_id>/leave")
def leave_club(club_id):
    """
    Remove a student from a club's member list.
    
    Request JSON:
      { "userId": "<student_uuid>" }
    
    Response:
      200 { "left": true, "memberCount": <int> }
    """
    data = request.get_json(force=True) or {}
    student_id = data.get("userId") or data.get("studentId")
    
    if not student_id:
        return jsonify({"error": "missing_user_id", "detail": "userId is required"}), 400
    
    with get_session() as session:
        student = session.get(Student, student_id)
        if not student:
            return jsonify({"error": "student_not_found"}), 404
        
        club = session.get(Club, club_id)
        if not club:
            return jsonify({"error": "club_not_found"}), 404
        
        # Check if student is an officer/president - they cannot leave without transferring role
        officer_role = (
            session.query(OfficerRole)
            .filter(
                OfficerRole.club_id == club_id,
                OfficerRole.student_id == student_id,
                OfficerRole.role.in_(["president", "managing_exec"])
            )
            .first()
        )
        
        if officer_role:
            return jsonify({
                "error": "cannot_leave",
                "detail": "You must transfer your leadership role before leaving the club"
            }), 400
        
        # Remove from both arrays
        student_clubs = [cid for cid in (student.my_clubs or []) if cid != club.id]
        club_members = [sid for sid in (club.member_ids or []) if sid != student.id]
        
        # Also remove from officer arrays if applicable
        club_officers = [sid for sid in (club.officers or []) if sid != student.id]
        
        # Remove from favorite clubs if present
        favorite_clubs = [cid for cid in (student.favorite_clubs or []) if cid != club.id]
        officer_clubs = [cid for cid in (student.officer_clubs or []) if cid != club.id]
        
        student.my_clubs = student_clubs
        student.favorite_clubs = favorite_clubs
        student.officer_clubs = officer_clubs
        club.member_ids = club_members
        club.officers = club_officers
        
        # Remove officer role if exists (for regular officer)
        regular_officer = (
            session.query(OfficerRole)
            .filter(
                OfficerRole.club_id == club_id,
                OfficerRole.student_id == student_id
            )
            .first()
        )
        if regular_officer:
            session.delete(regular_officer)
        
        session.add(student)
        session.add(club)
        session.commit()
        
        return jsonify({
            "left": True,
            "memberCount": len(club_members),
        }), 200


@api_bp.get("/students/<uuid:student_id>/recent-activity")
def get_student_recent_activity(student_id):
    """
    Returns recent activity across all of the student's clubs (joined or officer).
    """
    from datetime import datetime, timezone, timedelta
    
    with get_session() as session:
        student = session.get(Student, student_id)
        if not student:
            return jsonify({"error": "Student not found"}), 404
        
        # Get all club IDs (from my_clubs, officer_clubs, and OfficerRole table)
        club_ids_set = set(student.my_clubs or [])
        club_ids_set.update(student.officer_clubs or [])
        
        # Also check OfficerRole table
        officer_role_club_ids = (
            session.query(OfficerRole.club_id)
            .filter(OfficerRole.student_id == student_id)
            .all()
        )
        club_ids_set.update(r[0] for r in officer_role_club_ids)
        
        club_ids = list(club_ids_set)
        
        if not club_ids:
            return jsonify([])
        
        # Use timezone-aware datetime
        now = datetime.now(timezone.utc)
        
        # Get recent events from student's clubs (past 30 days and upcoming)
        events = (
            session.query(Event, Club)
            .join(Club, Event.club_id == Club.id)
            .filter(
                Event.club_id.in_(club_ids),
                Event.start_time >= now - timedelta(days=30)
            )
            .order_by(Event.updated_at.desc())
            .limit(10)
            .all()
        )
        
        results = []
        for event, club in events:
            # Determine time string
            time_str = "Recently"
            if event.updated_at:
                updated_at = event.updated_at
                # If updated_at is naive, make it aware
                if updated_at.tzinfo is None:
                    updated_at = updated_at.replace(tzinfo=timezone.utc)
                
                time_diff = now - updated_at
                if time_diff.days > 0:
                    time_str = f"{time_diff.days} day{'s' if time_diff.days > 1 else ''} ago"
                elif time_diff.seconds > 3600:
                    hours = time_diff.seconds // 3600
                    time_str = f"{hours} hour{'s' if hours > 1 else ''} ago"
                else:
                    minutes = max(1, time_diff.seconds // 60)
                    time_str = f"{minutes} minute{'s' if minutes > 1 else ''} ago"
            
            # Determine activity type
            event_time = event.start_time
            if event_time:
                # If event_time is naive, make it aware
                if event_time.tzinfo is None:
                    event_time = event_time.replace(tzinfo=timezone.utc)
                
                if event_time > now:
                    activity_type = "event"
                    title = f"{event.title} scheduled"
                else:
                    activity_type = "update"
                    title = event.title
            else:
                activity_type = "update"
                title = event.title
            
            results.append({
                "id": str(event.id),
                "type": activity_type,
                "title": title,
                "clubId": str(club.id),
                "clubName": club.name,
                "time": time_str,
            })
        
        return jsonify(results)
@api_bp.post("/events/<uuid:event_id>/rsvp")
def toggle_event_rsvp(event_id):
    """
    Toggle RSVP for a student on an event.

    Request JSON:
      { "userId": "<student_pk>" }  # or "studentId"

    Response:
      201 { "rsvped": True,  "registered": <int> }   # created RSVP
      200 { "rsvped": False, "registered": <int> }   # removed RSVP
    """
    data = request.get_json(force=True) or {}
    raw_student_id = data.get("userId") or data.get("studentId")

    if not raw_student_id:
        return jsonify(
            {"error": "missing_user_id", "detail": "userId (studentId) is required"}
        ), 400

    current_app.logger.info("RSVP request: event=%s student=%s", event_id, raw_student_id)

    with get_session() as session:
        # ---- Load student & event using PK as-is ----
        student = session.get(Student, raw_student_id)
        if not student:
            current_app.logger.info("Student not found for id %s", raw_student_id)
            return jsonify(
                {"error": "student_not_found", "detail": str(raw_student_id)}
            ), 404

        event = session.get(Event, event_id)
        if not event:
            current_app.logger.info("Event not found for id %s", event_id)
            return jsonify(
                {"error": "event_not_found", "detail": str(event_id)}
            ), 404

        # Existing RSVP row?
        rsvp = (
            session.query(EventRsvp)
            .filter_by(event_id=event.id, student_id=student.id)
            .one_or_none()
        )

        # Normalize arrays
        event_rsvp_ids = list(event.rsvp_ids or [])
        student_rsvped_events = list(student.rsvped_events or [])

        # ---- If no RSVP yet → create one ----
        if rsvp is None:
            if (
                event.rsvp_limit is not None
                and len(event_rsvp_ids) >= event.rsvp_limit
            ):
                return jsonify(
                    {"error": "event_full", "detail": "Event is at capacity"}
                ), 400

            rsvp = EventRsvp(
                event_id=event.id,
                student_id=student.id,
                rsvp_status="going",
                rsvp_time=datetime.utcnow(),
            )
            session.add(rsvp)

            if student.id not in event_rsvp_ids:
                event_rsvp_ids.append(student.id)
            if event.id not in student_rsvped_events:
                student_rsvped_events.append(event.id)

            event.rsvp_ids = event_rsvp_ids
            student.rsvped_events = student_rsvped_events

            session.add(event)
            session.add(student)
            session.commit()

            return jsonify(
                {
                    "rsvped": True,
                    "registered": len(event_rsvp_ids),
                }
            ), 201

        # ---- If RSVP exists → un-RSVP ----
        session.delete(rsvp)

        event_rsvp_ids = [sid for sid in event_rsvp_ids if sid != student.id]
        student_rsvped_events = [
            eid for eid in student_rsvped_events if eid != event.id
        ]

        event.rsvp_ids = event_rsvp_ids
        student.rsvped_events = student_rsvped_events

        session.add(event)
        session.add(student)
        session.commit()

        return jsonify(
            {
                "rsvped": False,
                "registered": len(event_rsvp_ids),
            }
        ), 200
