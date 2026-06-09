from typing import Optional
from pydantic import BaseModel


class PaymentMethodCreate(BaseModel):
    payment_type: str  # cash | check_card | credit_card
    name: str
    is_default: bool = False


class PaymentMethodUpdate(BaseModel):
    name: Optional[str] = None
    is_default: Optional[bool] = None


class PaymentMethodResponse(BaseModel):
    id: int
    user_id: int
    payment_type: str
    name: str
    is_default: bool

    model_config = {"from_attributes": True}
