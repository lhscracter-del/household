from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.budget import Budget, BudgetType
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse

router = APIRouter()


@router.get("", response_model=List[BudgetResponse])
async def get_budgets(
    year: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conditions = [Budget.user_id == current_user.id]
    if year:
        conditions.append(Budget.year == year)
    result = await db.execute(select(Budget).where(and_(*conditions)))
    return result.scalars().all()


@router.post("", response_model=BudgetResponse)
async def upsert_budget(
    body: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # 같은 타입/연/월 예산이 있으면 금액만 업데이트
    conditions = [
        Budget.user_id == current_user.id,
        Budget.budget_type == body.budget_type,
        Budget.year == body.year,
    ]
    if body.budget_type == BudgetType.monthly:
        conditions.append(Budget.month == body.month)
    else:
        conditions.append(Budget.month.is_(None))

    result = await db.execute(select(Budget).where(and_(*conditions)))
    existing = result.scalar_one_or_none()

    if existing:
        existing.amount = body.amount
        await db.commit()
        await db.refresh(existing)
        return existing

    budget = Budget(user_id=current_user.id, **body.model_dump())
    db.add(budget)
    await db.commit()
    await db.refresh(budget)
    return budget


@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: int,
    body: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == current_user.id)
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="예산을 찾을 수 없습니다.")
    budget.amount = body.amount
    await db.commit()
    await db.refresh(budget)
    return budget


@router.delete("/{budget_id}", status_code=204)
async def delete_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == current_user.id)
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="예산을 찾을 수 없습니다.")
    await db.delete(budget)
    await db.commit()
