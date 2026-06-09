from typing import Optional
from pydantic import BaseModel


class SummaryResponse(BaseModel):
    total: int
    count: int
    prev_total: Optional[int] = None
    diff_rate: Optional[float] = None


class CategoryStat(BaseModel):
    category_id: Optional[int]
    category_name: str
    total: int
    count: int


class PaymentStat(BaseModel):
    payment_method_id: Optional[int]
    payment_method_name: str
    payment_type: str
    total: int
    count: int


class TrendPoint(BaseModel):
    label: str
    total: int
