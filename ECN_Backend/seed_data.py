"""
Populate the ECN database with sample data.
Creates:
- 10 students
- 10 clubs
- 20 events (spread among clubs)
- OfficerRoles (each student president of one club, officer in all)
- Reviews (each student reviews some clubs)
- RSVPs (students attend or RSVP to random events)
"""

import random
import uuid
from datetime import datetime, timedelta

from db_ops import get_session
from models import (
    Student, Club, Event, OfficerRole,
    Review, EventRsvp, ClubUpdateHistory
)

# -------------------------------
# Configuration
# -------------------------------
NUM_STUDENTS = 10
NUM_CLUBS = 10
NUM_EVENTS = 20

CLUB_NAMES = [
    "Algory Capital",
    "Emory Consulting Group",
    "AI Society",
    "Blockchain Club",
    "Emory Data Science Club",
    "Impact Investing Group",
    "Goizueta Finance Club",
    "Emory Entrepreneurship Club",
    "Marketing Analytics Club",
    "Quantitative Economics Club",
]

DESCRIPTIONS = [
    "A student organization focused on applied finance and investment.",
    "A group providing consulting solutions to real-world clients.",
    "Exploring machine learning and artificial intelligence at Emory.",
    "A blockchain research and application group.",
    "Building skills in Python, R, and data analysis.",
    "Investing for social good and community development.",
    "Focused on capital markets, trading, and corporate finance.",
    "Encouraging innovation and startup thinking.",
    "Leveraging analytics to improve marketing strategy.",
    "Studying quantitative methods in economics.",
]

LOCATIONS = [
    "Goizueta Business School",
    "White Hall",
    "Math & Science Center",
    "Emory Student Center",
    "Cox Hall",
    "Library Quad",
    "Rich Building",
    "Callaway Center",
    "Woodruff PE Center",
    "Virtual / Zoom"
]

def seed_data():
    random.seed(42)
    now = datetime.utcnow()

    with get_session() as s:
        # ---- Students ----
        students = []
        for i in range(NUM_STUDENTS):
            student = Student(
                netid=f"student{i+1}@emory.edu",
                name=f"Student {i+1}",
                email=f"student{i+1}@emory.edu"
            )
            students.append(student)
            s.add(student)
        s.flush()

        # ---- Clubs ----
        clubs = []
        for i, name in enumerate(CLUB_NAMES):
            club = Club(
                name=name,
                description=DESCRIPTIONS[i],
                contact_email=f"{name.lower().replace(' ', '')}@emory.edu",
                status="active",
                verified=True,
                update_recency_badge="recent"
            )
            clubs.append(club)
            s.add(club)
        s.flush()

        # ---- Events ----
        events = []
        for i in range(NUM_EVENTS):
            club = random.choice(clubs)
            start = now + timedelta(days=random.randint(1, 30))
            evt = Event(
                club_id=club.id,
                title=f"{club.name} Event {i+1}",
                description=f"A great event for {club.name}.",
                location=random.choice(LOCATIONS),
                start_time=start,
                end_time=start + timedelta(hours=2),
                status="upcoming"
            )
            events.append(evt)
            s.add(evt)
        s.flush()

        # ---- Officer Roles ----
        roles = []
        for i, student in enumerate(students):
            # Each student is president of one club
            club = clubs[i % NUM_CLUBS]
            pres_role = OfficerRole(
                club_id=club.id,
                student_id=student.id,
                role="president",
                assigned_at=now
            )
            s.add(pres_role)
            roles.append(pres_role)

            # All students officers in all clubs
            for c in clubs:
                role = OfficerRole(
                    club_id=c.id,
                    student_id=student.id,
                    role="officer",
                    assigned_at=now
                )
                s.add(role)
                roles.append(role)
        s.flush()

        # ---- Reviews ----
        for student in students:
            reviewed_clubs = random.sample(clubs, 4)
            for c in reviewed_clubs:
                rating = 5 if c.name == "Algory Capital" else random.randint(2, 5)
                review = Review(
                    club_id=c.id,
                    student_id=student.id,
                    rating=rating,
                    review_text=f"Review for {c.name} by {student.name}. Rating: {rating}",
                    status="approved"
                )
                s.add(review)
        s.flush()

        # ---- RSVPs ----
        for student in students:
            attended_events = random.sample(events, 5)
            for e in attended_events:
                rsvp = EventRsvp(
                    event_id=e.id,
                    student_id=student.id,
                    rsvp_status=random.choice(["going", "interested"]),
                    attended=random.choice([True, False]),
                    rsvp_time=now
                )
                s.add(rsvp)
        s.flush()

        # ---- Club Update History ----
        for c in clubs:
            history = ClubUpdateHistory(
                club_id=c.id,
                updated_by=random.choice(students).id,
                update_type="info",
                update_details=f"Updated description for {c.name}.",
                verified=True
            )
            s.add(history)

        print("Database seeded successfully with students, clubs, events, and relations.")
