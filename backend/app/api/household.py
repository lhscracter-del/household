from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from app.core.database import get_db
from app.core.deps import get_current_user, get_household_user_ids
from app.core.defaults import DEFAULT_PAYMENT_METHODS, DEFAULT_CATEGORIES
from app.models.user import User
from app.models.category import Category
from app.models.payment_method import PaymentMethod
from app.models.expense import Expense
from app.models.recurring import RecurringExpense
from app.models.household import Household, HouseholdInvitation, InvitationStatus
from app.schemas.household import HouseholdMemberResponse, InvitationCreate, InvitationResponse

router = APIRouter()


async def _remove_unused_defaults(db: AsyncSession, user: User) -> None:
    """가족 합류 전, 본인이 만든 결제수단/카테고리 중 지출 내역에서 사용되지 않은 것을 정리한다."""
    used_pm_ids = set()
    used_cat_ids = set()
    for model, field in ((Expense, "payment_method_id"), (RecurringExpense, "payment_method_id")):
        result = await db.execute(select(getattr(model, field)).where(model.user_id == user.id))
        used_pm_ids.update(row[0] for row in result.all() if row[0] is not None)
    for model, field in ((Expense, "category_id"), (RecurringExpense, "category_id")):
        result = await db.execute(select(getattr(model, field)).where(model.user_id == user.id))
        used_cat_ids.update(row[0] for row in result.all() if row[0] is not None)

    pm_result = await db.execute(select(PaymentMethod).where(PaymentMethod.user_id == user.id))
    for pm in pm_result.scalars().all():
        if pm.id not in used_pm_ids:
            await db.delete(pm)

    cat_result = await db.execute(select(Category).where(Category.user_id == user.id))
    for cat in cat_result.scalars().all():
        if cat.id not in used_cat_ids:
            await db.delete(cat)


async def _add_default_payment_methods_and_categories(db: AsyncSession, user: User) -> None:
    """가족 공유에서 나갈 때, 새 가구를 위한 기본 결제수단/카테고리를 다시 만들어준다."""
    now = datetime.utcnow()
    for pm in DEFAULT_PAYMENT_METHODS:
        db.add(PaymentMethod(user_id=user.id, created_at=now, updated_at=now, **pm))
    for cat in DEFAULT_CATEGORIES:
        db.add(Category(user_id=user.id, created_at=now, updated_at=now, **cat))


async def _to_invitation_response(db: AsyncSession, invitation: HouseholdInvitation) -> InvitationResponse:
    inviter = await db.get(User, invitation.inviter_id)
    return InvitationResponse(
        id=invitation.id,
        household_id=invitation.household_id,
        inviter_id=invitation.inviter_id,
        inviter_name=inviter.name if inviter else "",
        invitee_email=invitation.invitee_email,
        status=invitation.status,
        created_at=invitation.created_at,
    )


@router.get("/members", response_model=List[HouseholdMemberResponse])
async def get_members(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.household_id == current_user.household_id).order_by(User.id)
    )
    return result.scalars().all()


@router.get("/invitations", response_model=List[InvitationResponse])
async def get_invitations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(HouseholdInvitation).where(
            and_(
                HouseholdInvitation.status == InvitationStatus.pending,
                or_(
                    HouseholdInvitation.invitee_email == current_user.email,
                    HouseholdInvitation.household_id == current_user.household_id,
                ),
            )
        ).order_by(HouseholdInvitation.created_at.desc())
    )
    invitations = result.scalars().all()
    return [await _to_invitation_response(db, inv) for inv in invitations]


@router.post("/invitations", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
async def create_invitation(
    body: InvitationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.email == current_user.email:
        raise HTTPException(status_code=400, detail="자기 자신은 초대할 수 없습니다.")

    result = await db.execute(select(User).where(User.email == body.email))
    invitee = result.scalar_one_or_none()
    if not invitee:
        raise HTTPException(status_code=404, detail="등록되지 않은 이메일입니다.")

    if invitee.household_id == current_user.household_id:
        raise HTTPException(status_code=400, detail="이미 같은 가계부를 공유하고 있습니다.")

    existing_result = await db.execute(
        select(HouseholdInvitation).where(
            and_(
                HouseholdInvitation.household_id == current_user.household_id,
                HouseholdInvitation.invitee_email == body.email,
                HouseholdInvitation.status == InvitationStatus.pending,
            )
        )
    )
    if existing_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="이미 초대를 보냈습니다.")

    invitation = HouseholdInvitation(
        household_id=current_user.household_id,
        inviter_id=current_user.id,
        invitee_email=body.email,
        status=InvitationStatus.pending,
    )
    db.add(invitation)
    await db.commit()
    await db.refresh(invitation)
    return await _to_invitation_response(db, invitation)


@router.post("/invitations/{invitation_id}/accept", response_model=InvitationResponse)
async def accept_invitation(
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(HouseholdInvitation).where(HouseholdInvitation.id == invitation_id)
    )
    invitation = result.scalar_one_or_none()
    if not invitation or invitation.invitee_email != current_user.email:
        raise HTTPException(status_code=404, detail="초대를 찾을 수 없습니다.")
    if invitation.status != InvitationStatus.pending:
        raise HTTPException(status_code=400, detail="이미 처리된 초대입니다.")

    await _remove_unused_defaults(db, current_user)

    invitation.status = InvitationStatus.accepted
    invitation.responded_at = datetime.utcnow()
    current_user.household_id = invitation.household_id
    await db.commit()
    await db.refresh(invitation)
    return await _to_invitation_response(db, invitation)


@router.post("/invitations/{invitation_id}/reject", response_model=InvitationResponse)
async def reject_invitation(
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(HouseholdInvitation).where(HouseholdInvitation.id == invitation_id)
    )
    invitation = result.scalar_one_or_none()
    if not invitation or invitation.invitee_email != current_user.email:
        raise HTTPException(status_code=404, detail="초대를 찾을 수 없습니다.")
    if invitation.status != InvitationStatus.pending:
        raise HTTPException(status_code=400, detail="이미 처리된 초대입니다.")

    invitation.status = InvitationStatus.rejected
    invitation.responded_at = datetime.utcnow()
    await db.commit()
    await db.refresh(invitation)
    return await _to_invitation_response(db, invitation)


@router.delete("/invitations/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_invitation(
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(HouseholdInvitation).where(HouseholdInvitation.id == invitation_id)
    )
    invitation = result.scalar_one_or_none()
    if not invitation or invitation.inviter_id != current_user.id:
        raise HTTPException(status_code=404, detail="초대를 찾을 수 없습니다.")
    if invitation.status != InvitationStatus.pending:
        raise HTTPException(status_code=400, detail="이미 처리된 초대입니다.")

    await db.delete(invitation)
    await db.commit()


@router.post("/leave", response_model=HouseholdMemberResponse)
async def leave_household(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    household_user_ids = await get_household_user_ids(current_user, db)
    if len(household_user_ids) <= 1:
        raise HTTPException(status_code=400, detail="공유 중인 가계부가 없습니다.")

    new_household = Household()
    db.add(new_household)
    await db.flush()
    current_user.household_id = new_household.id
    await _add_default_payment_methods_and_categories(db, current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user
