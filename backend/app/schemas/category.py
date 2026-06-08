from typing import Optional
from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None
    budget: Optional[int] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    budget: Optional[int] = None


class CategoryResponse(BaseModel):
    id: int
    user_id: Optional[int]
    name: str
    icon: Optional[str]
    color: Optional[str]
    budget: Optional[int]

    model_config = {"from_attributes": True}
