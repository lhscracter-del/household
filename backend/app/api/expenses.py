from datetime import date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse

router = APIRouter()


@router.get("", response_model=List[ExpenseResponse])
async def get_expenses(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    payment_method_id: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conditions = [Expense.user_id == current_user.id]
    if start_date:
        conditions.append(Expense.date >= start_date)
    if end_date:
        conditions.append(Expense.date <= end_date)
    if payment_method_id:
        conditions.append(Expense.payment_method_id == payment_method_id)
    if category_id:
        conditions.append(Expense.category_id == category_id)

    result = await db.execute(
        select(Expense).where(and_(*conditions)).order_by(Expense.date.desc())
    )
    return result.scalars().all()


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    body: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    expense = Expense(user_id=current_user.id, **body.model_dump())
    db.add(expense)
    await db.commit()
    await db.refresh(expense)
    return expense


@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: int,
    body: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Expense).where(Expense.id == expense_id, Expense.user_id == current_user.id)
    )
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="지출 내역을 찾을 수 없습니다.")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(expense, field, value)
    await db.commit()
    await db.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Expense).where(Expense.id == expense_id, Expense.user_id == current_user.id)
    )
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="지출 내역을 찾을 수 없습니다.")
    await db.delete(expense)
    await db.commit()
