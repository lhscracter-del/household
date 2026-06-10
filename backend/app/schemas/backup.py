from datetime import date as Date, datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.recurring import RecurrenceCycle
from app.models.budget import BudgetType


class BackupPaymentMethod(BaseModel):
    id: int
    payment_type: str
    name: str
    is_default: bool = False

    model_config = {"from_attributes": True}


class BackupCategory(BaseModel):
    id: int
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None
    budget: Optional[int] = None

    model_config = {"from_attributes": True}


class BackupExpense(BaseModel):
    id: int
    amount: int
    payment_method_id: Optional[int] = None
    category_id: Optional[int] = None
    date: Date
    memo: Optional[str] = None
    is_recurring: bool = False

    model_config = {"from_attributes": True}


class BackupRecurring(BaseModel):
    id: int
    amount: int
    payment_method_id: Optional[int] = None
    category_id: Optional[int] = None
    description: str
    cycle: RecurrenceCycle
    next_due_date: Date

    model_config = {"from_attributes": True}


class BackupBudget(BaseModel):
    id: int
    budget_type: BudgetType
    amount: int
    year: int
    month: Optional[int] = None

    model_config = {"from_attributes": True}


class BackupData(BaseModel):
    version: int = 1
    exported_at: Optional[datetime] = None
    payment_methods: List[BackupPaymentMethod] = []
    categories: List[BackupCategory] = []
    expenses: List[BackupExpense] = []
    recurring_expenses: List[BackupRecurring] = []
    budgets: List[BackupBudget] = []
