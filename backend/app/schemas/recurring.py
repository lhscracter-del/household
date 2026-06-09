from datetime import date
from typing import Optional
from pydantic import BaseModel
from app.models.recurring import RecurrenceCycle


class RecurringCreate(BaseModel):
    amount: int
    payment_method_id: Optional[int] = None
    category_id: Optional[int] = None
    description: str
    cycle: RecurrenceCycle
    next_due_date: date


class RecurringUpdate(BaseModel):
    amount: Optional[int] = None
    payment_method_id: Optional[int] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    cycle: Optional[RecurrenceCycle] = None
    next_due_date: Optional[date] = None


class RecurringResponse(BaseModel):
    id: int
    user_id: int
    amount: int
    payment_method_id: Optional[int]
    category_id: Optional[int]
    description: str
    cycle: RecurrenceCycle
    next_due_date: date

    model_config = {"from_attributes": True}
