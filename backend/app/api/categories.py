from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.core.database import get_db
from app.core.deps import get_current_user, get_household_user_ids
from app.models.user import User
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse

router = APIRouter()


@router.get("", response_model=List[CategoryResponse])
async def get_categories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    household_user_ids = await get_household_user_ids(current_user, db)
    result = await db.execute(
        select(Category).where(
            or_(Category.user_id.in_(household_user_ids), Category.user_id.is_(None))
        ).order_by(Category.id)
    )
    return result.scalars().all()


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    body: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    category = Category(user_id=current_user.id, **body.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    body: CategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    household_user_ids = await get_household_user_ids(current_user, db)
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.user_id.in_(household_user_ids))
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="카테고리를 찾을 수 없습니다.")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(category, field, value)
    await db.commit()
    await db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    household_user_ids = await get_household_user_ids(current_user, db)
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.user_id.in_(household_user_ids))
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="카테고리를 찾을 수 없습니다.")
    await db.delete(category)
    await db.commit()
