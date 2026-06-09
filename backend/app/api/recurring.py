from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, nullslast
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.recurring import RecurringExpense
from app.schemas.recurring import RecurringCreate, RecurringUpdate, RecurringResponse

router = APIRouter()


@router.get("", response_model=List[RecurringResponse])
async def get_recurring(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RecurringExpense)
        .where(RecurringExpense.user_id == current_user.id)
        .order_by(nullslast(RecurringExpense.category_id.asc()), RecurringExpense.next_due_date.asc())
    )
    return result.scalars().all()


@router.post("", response_model=RecurringResponse, status_code=status.HTTP_201_CREATED)
async def create_recurring(
    body: RecurringCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    recurring = RecurringExpense(user_id=current_user.id, **body.model_dump())
    db.add(recurring)
    await db.commit()
    await db.refresh(recurring)
    return recurring


@router.put("/{recurring_id}", response_model=RecurringResponse)
async def update_recurring(
    recurring_id: int,
    body: RecurringUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RecurringExpense).where(
            RecurringExpense.id == recurring_id, RecurringExpense.user_id == current_user.id
        )
    )
    recurring = result.scalar_one_or_none()
    if not recurring:
        raise HTTPException(status_code=404, detail="반복 지출을 찾을 수 없습니다.")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(recurring, field, value)
    await db.commit()
    await db.refresh(recurring)
    return recurring


@router.delete("/{recurring_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recurring(
    recurring_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RecurringExpense).where(
            RecurringExpense.id == recurring_id, RecurringExpense.user_id == current_user.id
        )
    )
    recurring = result.scalar_one_or_none()
    if not recurring:
        raise HTTPException(status_code=404, detail="반복 지출을 찾을 수 없습니다.")
    await db.delete(recurring)
    await db.commit()
