# models.py
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    netid: Mapped[str] = mapped_column(unique=True, index=True)
    name: Mapped[str]
    email: Mapped[str] = mapped_column(unique=True)

class Club(db.Model):
    __tablename__ = "clubs"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(index=True)
    short_description: Mapped[str] = mapped_column(default="")
    long_description: Mapped[str] = mapped_column(default="")
    website: Mapped[str | None]
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, index=True)
    contacts: Mapped[list["ClubContact"]] = relationship(back_populates="club", cascade="all, delete-orphan")
    tags: Mapped[list["Tag"]] = relationship(secondary="club_tags", back_populates="clubs")
    events: Mapped[list["Event"]] = relationship(back_populates="club", cascade="all, delete-orphan")

class ClubContact(db.Model):
    __tablename__ = "club_contacts"
    id: Mapped[int] = mapped_column(primary_key=True)
    club_id: Mapped[int] = mapped_column(ForeignKey("clubs.id", ondelete="CASCADE"), index=True)
    name: Mapped[str]
    role: Mapped[str]                 # e.g., President
    email: Mapped[str | None]
    verified: Mapped[bool] = mapped_column(default=True)
    club: Mapped[Club] = relationship(back_populates="contacts")

class Tag(db.Model):
    __tablename__ = "tags"
    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(unique=True, index=True)
    label: Mapped[str]
    clubs: Mapped[list[Club]] = relationship(secondary="club_tags", back_populates="tags")

class ClubTag(db.Model):
    __tablename__ = "club_tags"
    club_id: Mapped[int] = mapped_column(ForeignKey("clubs.id", ondelete="CASCADE"), primary_key=True)
    tag_id: Mapped[int] = mapped_column(ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)

class Event(db.Model):
    __tablename__ = "events"
    id: Mapped[int] = mapped_column(primary_key=True)
    club_id: Mapped[int] = mapped_column(ForeignKey("clubs.id", ondelete="CASCADE"), index=True)
    title: Mapped[str]
    starts_at: Mapped[datetime]
    ends_at: Mapped[datetime | None]
    location: Mapped[str | None]
    rsvp_open: Mapped[bool] = mapped_column(default=True)
    rsvp_count: Mapped[int] = mapped_column(default=0)
    club: Mapped[Club] = relationship(back_populates="events")

class RSVP(db.Model):
    __tablename__ = "rsvps"
    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    __table_args__ = (UniqueConstraint("event_id", "user_id", name="uq_event_user"),)
