from typing import Optional
from pydantic import BaseModel


class BudgetCreate(BaseModel):
    category_id: int
    amount: int
    year: int
    month: int


class BudgetUpdate(BaseModel):
    amount: Optional[int] = None


class BudgetResponse(BaseModel):
    id: int
    user_id: int
    category_id: int
    amount: int
    year: int
    month: int

    model_config = {"from_attributes": True}
