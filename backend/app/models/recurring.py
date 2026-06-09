import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Enum
from app.core.database import Base


class RecurrenceCycle(str, enum.Enum):
    monthly = "monthly"
    weekly = "weekly"


class RecurringExpense(Base):
    __tablename__ = "recurring_expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Integer, nullable=False)
    payment_method_id = Column(Integer, ForeignKey("payment_methods.id"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    description = Column(String(255), nullable=False)
    cycle = Column(Enum(RecurrenceCycle), nullable=False)
    next_due_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
