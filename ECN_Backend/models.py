# Before deploying this file, make sure to go the main function below and ensuring the credentials are linked to your local or global db
# ecn_models.py
from __future__ import annotations
from datetime import datetime
import uuid

from sqlalchemy import (
    Boolean, CheckConstraint, Enum, ForeignKey, Integer, String, Text,
    UniqueConstraint, TIMESTAMP, func, text, create_engine
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import ARRAY, UUID


# ---------------- Base ----------------
class Base(DeclarativeBase):
    pass


def pk_uuid() -> uuid.UUID:
    return uuid.uuid4()


# ---------------- Enums ----------------
ClubStatus = Enum("active", "inactive", "delisted", name="club_status")
EventStatus = Enum("upcoming", "past", "cancelled", name="event_status")
ReviewStatus = Enum("pending", "approved", "rejected", name="review_status")
ModerationAction = Enum("approve", "reject", "edit", name="moderation_action")
OfficerRoleEnum = Enum("president", "managing_exec", "officer", name="officer_role")
RsvpStatus = Enum("going", "not_going", "interested", name="rsvp_status")


# ---------------- Tables ----------------
class Student(Base):
    __tablename__ = "students"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=pk_uuid)
    netid: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    
    #Registration and login variables
    password_hash: Mapped[str | None] = mapped_column(String)
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))

    # Arrays default to empty
    my_clubs: Mapped[list[uuid.UUID]] = mapped_column(
        ARRAY(UUID(as_uuid=True)), nullable=False, server_default=text("'{}'")
    )
    favorite_clubs: Mapped[list[uuid.UUID]] = mapped_column(
        ARRAY(UUID(as_uuid=True)), nullable=False, server_default=text("'{}'")
    )
    officer_clubs: Mapped[list[uuid.UUID]] = mapped_column(
        ARRAY(UUID(as_uuid=True)), nullable=False, server_default=text("'{}'")
    )
    attended_events: Mapped[list[uuid.UUID]] = mapped_column(
        ARRAY(UUID(as_uuid=True)), nullable=False, server_default=text("'{}'")
    )
    rsvped_events: Mapped[list[uuid.UUID]] = mapped_column(
        ARRAY(UUID(as_uuid=True)), nullable=False, server_default=text("'{}'")
    )

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )


class Club(Base):
    __tablename__ = "clubs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=pk_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)

    description: Mapped[str | None] = mapped_column(Text)
    purpose: Mapped[str | None] = mapped_column(Text)
    activities: Mapped[str | None] = mapped_column(Text)
    media_urls: Mapped[list[str] | None] = mapped_column(ARRAY(String))

    status: Mapped[str] = mapped_column(ClubStatus, nullable=False, server_default=text("'active'"))
    verified: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    last_verified_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    last_updated_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    update_recency_badge: Mapped[str | None] = mapped_column(String)

    officers: Mapped[list[uuid.UUID]] = mapped_column(
        ARRAY(UUID(as_uuid=True)), nullable=False, server_default=text("'{}'")
    )
    president_ids: Mapped[list[uuid.UUID]] = mapped_column(
        ARRAY(UUID(as_uuid=True)), nullable=False, server_default=text("'{}'")
    )
    managing_exec_ids: Mapped[list[uuid.UUID]] = mapped_column(
        ARRAY(UUID(as_uuid=True)), nullable=False, server_default=text("'{}'")
    )
    member_ids: Mapped[list[uuid.UUID]] = mapped_column(
        ARRAY(UUID(as_uuid=True)), nullable=False, server_default=text("'{}'")
    )
    event_ids: Mapped[list[uuid.UUID]] = mapped_column(
        ARRAY(UUID(as_uuid=True)), nullable=False, server_default=text("'{}'")
    )

    contact_email: Mapped[str | None] = mapped_column(String)
    contact_phone: Mapped[str | None] = mapped_column(String)
    request_info_form_url: Mapped[str | None] = mapped_column(String)

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # Relationship to Event (normalized)
    events: Mapped[list["Event"]] = relationship(back_populates="club", cascade="all, delete-orphan")


class Event(Base):
    __tablename__ = "events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=pk_uuid)
    club_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)

    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    location: Mapped[str | None] = mapped_column(String)

    start_time: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)

    status: Mapped[str] = mapped_column(EventStatus, nullable=False, server_default=text("'upcoming'"))
    media_urls: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    rsvp_limit: Mapped[int | None] = mapped_column(Integer)

    rsvp_ids: Mapped[list[uuid.UUID]] = mapped_column(
        ARRAY(UUID(as_uuid=True)), nullable=False, server_default=text("'{}'")
    )
    attendee_ids: Mapped[list[uuid.UUID]] = mapped_column(
        ARRAY(UUID(as_uuid=True)), nullable=False, server_default=text("'{}'")
    )

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    club: Mapped["Club"] = relationship(back_populates="events")


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="reviews_rating_1_5"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=pk_uuid)
    club_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), nullable=False)

    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    review_text: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    status: Mapped[str] = mapped_column(ReviewStatus, nullable=False, server_default=text("'pending'"))
    moderated_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("students.id", ondelete="SET NULL"))

    moderation_action: Mapped[str | None] = mapped_column(ModerationAction)
    moderation_reason: Mapped[str | None] = mapped_column(Text)


class OfficerRole(Base):
    __tablename__ = "officer_roles"
    __table_args__ = (
        UniqueConstraint("club_id", "student_id", "role", name="uq_officer_roles_club_student_role"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=pk_uuid)
    club_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(OfficerRoleEnum, nullable=False)

    assigned_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))


class ClubUpdateHistory(Base):
    __tablename__ = "club_update_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=pk_uuid)
    club_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    updated_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("students.id", ondelete="SET NULL"))

    update_type: Mapped[str] = mapped_column(String, nullable=False)  # info, contact, status, etc.
    update_details: Mapped[str | None] = mapped_column(Text)
    verified: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    verified_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("students.id", ondelete="SET NULL"))

    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )


class EventRsvp(Base):
    __tablename__ = "event_rsvps"
    __table_args__ = (
        UniqueConstraint("event_id", "student_id", name="uq_event_rsvps_event_student"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=pk_uuid)
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), nullable=False)

    rsvp_status: Mapped[str] = mapped_column(RsvpStatus, nullable=False)
    rsvp_time: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    attended: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    attendance_time: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))


class ReviewModeration(Base):
    __tablename__ = "review_moderation"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=pk_uuid)
    review_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False)
    moderator_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("students.id", ondelete="SET NULL"))

    action: Mapped[str] = mapped_column(ModerationAction, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)
    action_time: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )


# ---------------- Create-all helper for local dev env----------------
if __name__ == "__main__":
    # Adjust DSN to your local or global environment for deployment
    engine = create_engine("postgresql+psycopg2://postgres@127.0.0.1:5432/ecn")
    Base.metadata.create_all(engine)
    print("ECN tables created.")
