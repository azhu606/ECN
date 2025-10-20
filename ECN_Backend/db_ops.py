# db_ops.py
from __future__ import annotations

import os
import uuid
from contextlib import contextmanager
from datetime import datetime, timedelta

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import your models & Base
from models import (
    Base,
    Club,
    Event,
)

# ------------------------------------------------------------------
# Engine / Session
# ------------------------------------------------------------------
DB_URL = os.getenv("ECN_DATABASE_URL", "postgresql+psycopg2://postgres@127.0.0.1:5432/ecn")
engine = create_engine(DB_URL, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


@contextmanager
def get_session():
    """Context manager that commits on success and rolls back on error."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


# ------------------------------------------------------------------
# Schema ops
# ------------------------------------------------------------------
def create_all() -> None:
    """Create all tables defined on Base.metadata."""
    Base.metadata.create_all(bind=engine)


def drop_all() -> None:
    """Drop all tables defined on Base.metadata."""
    Base.metadata.drop_all(bind=engine)


def reset_db() -> None:
    """Drop and recreate all tables (DANGEROUS)."""
    drop_all()
    create_all()


# ------------------------------------------------------------------
# Sample data
# ------------------------------------------------------------------
def add_sample_data() -> uuid.UUID:
    """
    Insert a minimal sample Club (and a sample Event for it) and return the club id.
    Adjust fields as your app requires.
    """
    with get_session() as s:
        club = Club(name="Sample Club")
        s.add(club)
        s.flush()  # populate club.id

        # Optional: add a small sample event so relations are exercised
        start = datetime.utcnow() + timedelta(days=7)
        evt = Event(
            club_id=club.id,
            title="Sample Kickoff",
            description="Welcome event",
            start_time=start,
            end_time=start + timedelta(hours=2),
        )
        s.add(evt)

        # Commit happens in context manager
        return club.id


# ------------------------------------------------------------------
# CRUD helpers (UUID keys)
# ------------------------------------------------------------------
def update_club_name(club_id: uuid.UUID, new_name: str) -> bool:
    """
    Update Club.name by UUID. Returns True if updated, False if not found.
    """
    with get_session() as s:
        club = s.get(Club, club_id)
        if not club:
            return False
        club.name = new_name
        # updated_at auto-handled by DB default/onupdate if configured; otherwise set manually
        return True


def delete_event(event_id: uuid.UUID) -> bool:
    """
    Delete an Event by UUID. Returns True if deleted, False if not found.
    """
    with get_session() as s:
        evt = s.get(Event, event_id)
        if not evt:
            return False
        s.delete(evt)
        return True


# ------------------------------------------------------------------
# Convenience CLI
# ------------------------------------------------------------------
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="ECN DB ops")
    sub = parser.add_subparsers(dest="cmd", required=True)

    sub.add_parser("create", help="Create all tables")
    sub.add_parser("drop", help="Drop all tables")
    sub.add_parser("reset", help="Drop & recreate all tables")
    sub.add_parser("seed", help="Insert sample club & event, print club id")

    upd = sub.add_parser("rename_club", help="Update a club's name")
    upd.add_argument("--id", required=True, help="Club UUID")
    upd.add_argument("--name", required=True, help="New club name")

    dele = sub.add_parser("delete_event", help="Delete an event by id")
    dele.add_argument("--id", required=True, help="Event UUID")

    args = parser.parse_args()

    if args.cmd == "create":
        create_all()
        print("Created all tables.")
    elif args.cmd == "drop":
        drop_all()
        print("Dropped all tables.")
    elif args.cmd == "reset":
        reset_db()
        print("Reset DB.")
    elif args.cmd == "seed":
        cid = add_sample_data()
        print(f"Seeded sample data. Club ID: {cid}")
    elif args.cmd == "rename_club":
        ok = update_club_name(uuid.UUID(args.id), args.name)
        print("Updated." if ok else "Club not found.")
    elif args.cmd == "delete_event":
        ok = delete_event(uuid.UUID(args.id))
        print("Deleted." if ok else "Event not found.")
