# db_ops.py
from models import db, Club, Event, Tag, ClubContact, User
from app import create_app

app = create_app()

def create_all():
    with app.app_context():
        db.create_all()

def drop_all():
    with app.app_context():
        db.drop_all()

def reset_db():
    with app.app_context():
        db.drop_all()
        db.create_all()

def add_sample_data():
    with app.app_context():
        club = Club(name="Sample Club", short_description="Placeholder")
        db.session.add(club)
        db.session.commit()

def update_club_name(club_id: int, new_name: str):
    with app.app_context():
        c = Club.query.get(club_id)
        if not c: return False
        c.name = new_name
        db.session.commit()
        return True

def delete_event(event_id: int):
    with app.app_context():
        e = Event.query.get(event_id)
        if not e: return False
        db.session.delete(e)
        db.session.commit()
        return True
