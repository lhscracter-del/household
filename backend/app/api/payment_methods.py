from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.deps import get_current_user, get_household_user_ids
from app.models.user import User
from app.models.payment_method import PaymentMethod
from app.schemas.payment_method import PaymentMethodCreate, PaymentMethodUpdate, PaymentMethodResponse

VALID_TYPES = {"cash", "check_card", "credit_card"}

router = APIRouter()


@router.get("", response_model=List[PaymentMethodResponse])
async def get_payment_methods(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    household_user_ids = await get_household_user_ids(current_user, db)
    result = await db.execute(
        select(PaymentMethod)
        .where(PaymentMethod.user_id.in_(household_user_ids))
        .order_by(PaymentMethod.payment_type, PaymentMethod.id)
    )
    return result.scalars().all()


@router.post("", response_model=PaymentMethodResponse, status_code=status.HTTP_201_CREATED)
async def create_payment_method(
    body: PaymentMethodCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.payment_type not in VALID_TYPES:
        raise HTTPException(status_code=400, detail="올바르지 않은 결제 수단 유형입니다.")

    pm = PaymentMethod(user_id=current_user.id, **body.model_dump())
    db.add(pm)
    await db.commit()
    await db.refresh(pm)
    return pm


@router.put("/{pm_id}", response_model=PaymentMethodResponse)
async def update_payment_method(
    pm_id: int,
    body: PaymentMethodUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    household_user_ids = await get_household_user_ids(current_user, db)
    result = await db.execute(
        select(PaymentMethod).where(
            PaymentMethod.id == pm_id,
            PaymentMethod.user_id.in_(household_user_ids),
        )
    )
    pm = result.scalar_one_or_none()
    if not pm:
        raise HTTPException(status_code=404, detail="결제 수단을 찾을 수 없습니다.")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(pm, field, value)
    await db.commit()
    await db.refresh(pm)
    return pm


@router.delete("/{pm_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payment_method(
    pm_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    household_user_ids = await get_household_user_ids(current_user, db)
    result = await db.execute(
        select(PaymentMethod).where(
            PaymentMethod.id == pm_id,
            PaymentMethod.user_id.in_(household_user_ids),
        )
    )
    pm = result.scalar_one_or_none()
    if not pm:
        raise HTTPException(status_code=404, detail="결제 수단을 찾을 수 없습니다.")
    await db.delete(pm)
    await db.commit()
