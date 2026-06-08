from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.core.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # null = 기본 카테고리
    name = Column(String(100), nullable=False)
    icon = Column(String(10), nullable=True)
    color = Column(String(20), nullable=True)
    budget = Column(Integer, nullable=True)  # 월 예산 (optional)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
