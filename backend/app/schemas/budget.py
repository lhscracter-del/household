from typing import Optional
from pydantic import BaseModel
from app.models.budget import BudgetType


class BudgetCreate(BaseModel):
    budget_type: BudgetType
    amount: int
    year: int
    month: Optional[int] = None  # yearly이면 null


class BudgetUpdate(BaseModel):
    amount: int


class BudgetResponse(BaseModel):
    id: int
    user_id: int
    budget_type: BudgetType
    amount: int
    year: int
    month: Optional[int]

    model_config = {"from_attributes": True}
