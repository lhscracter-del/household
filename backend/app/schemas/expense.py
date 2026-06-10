from datetime import date as Date
from typing import Optional
from pydantic import BaseModel


class ExpenseCreate(BaseModel):
    amount: int
    payment_method_id: Optional[int] = None
    category_id: Optional[int] = None
    date: Date
    memo: Optional[str] = None
    is_recurring: bool = False


class ExpenseUpdate(BaseModel):
    amount: Optional[int] = None
    payment_method_id: Optional[int] = None
    category_id: Optional[int] = None
    date: Optional[Date] = None
    memo: Optional[str] = None


class ExpenseResponse(BaseModel):
    id: int
    user_id: int
    amount: int
    payment_method_id: Optional[int]
    category_id: Optional[int]
    date: Date
    memo: Optional[str]
    is_recurring: bool

    model_config = {"from_attributes": True}
