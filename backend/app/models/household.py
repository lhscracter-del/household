import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from app.core.database import Base


class InvitationStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


class Household(Base):
    __tablename__ = "households"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class HouseholdInvitation(Base):
    __tablename__ = "household_invitations"

    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(Integer, ForeignKey("households.id"), nullable=False, index=True)
    inviter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    invitee_email = Column(String(255), nullable=False, index=True)
    status = Column(Enum(InvitationStatus, native_enum=False, length=20), nullable=False, default=InvitationStatus.pending)
    created_at = Column(DateTime, default=datetime.utcnow)
    responded_at = Column(DateTime, nullable=True)
