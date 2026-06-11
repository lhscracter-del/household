from datetime import date as Date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.core.database import get_db
from app.core.deps import get_current_user, get_household_user_ids
from app.models.user import User
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse

router = APIRouter()


@router.get("", response_model=List[ExpenseResponse])
async def get_expenses(
    start_date: Optional[Date] = Query(None),
    end_date: Optional[Date] = Query(None),
    payment_method_id: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    memo: Optional[str] = Query(None),
    order: str = Query("desc"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    household_user_ids = await get_household_user_ids(current_user, db)
    conditions = [Expense.user_id.in_(household_user_ids)]
    if start_date:
        conditions.append(Expense.date >= start_date)
    if end_date:
        conditions.append(Expense.date <= end_date)
    if payment_method_id:
        conditions.append(Expense.payment_method_id == payment_method_id)
    if category_id:
        conditions.append(Expense.category_id == category_id)
    if memo:
        conditions.append(func.lower(Expense.memo).contains(memo.lower()))

    # 같은 날짜 내에서도 순서가 결정적이도록 id를 보조 정렬키로 추가
    if order == "asc":
        order_by = (Expense.date.asc(), Expense.id.asc())
    else:
        order_by = (Expense.date.desc(), Expense.id.desc())
    result = await db.execute(
        select(Expense).where(and_(*conditions)).order_by(*order_by)
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
    household_user_ids = await get_household_user_ids(current_user, db)
    result = await db.execute(
        select(Expense).where(Expense.id == expense_id, Expense.user_id.in_(household_user_ids))
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
    household_user_ids = await get_household_user_ids(current_user, db)
    result = await db.execute(
        select(Expense).where(Expense.id == expense_id, Expense.user_id.in_(household_user_ids))
    )
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="지출 내역을 찾을 수 없습니다.")
    await db.delete(expense)
    await db.commit()
