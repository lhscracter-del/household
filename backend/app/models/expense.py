import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Enum, Text, Boolean
from app.core.database import Base


class PaymentMethodType(str, enum.Enum):
    cash = "cash"
    check_card = "check_card"
    credit_card = "credit_card"


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Integer, nullable=False)
    payment_method_id = Column(Integer, ForeignKey("payment_methods.id"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    date = Column(Date, nullable=False, index=True)
    memo = Column(Text, nullable=True)
    is_recurring = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
