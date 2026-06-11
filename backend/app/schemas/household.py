from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.household import InvitationStatus


class HouseholdMemberResponse(BaseModel):
    id: int
    name: str
    email: str

    model_config = {"from_attributes": True}


class InvitationCreate(BaseModel):
    email: EmailStr


class InvitationResponse(BaseModel):
    id: int
    household_id: int
    inviter_id: int
    inviter_name: str
    invitee_email: str
    status: InvitationStatus
    created_at: datetime

    model_config = {"from_attributes": True}
