from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, extract
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.expense import Expense, PaymentMethod
from app.models.category import Category
from app.schemas.stats import SummaryResponse, CategoryStat, PaymentStat, TrendPoint

router = APIRouter()


@router.get("/summary", response_model=SummaryResponse)
async def get_summary(
    year: int = Query(...),
    month: int = Query(...),
    payment_method: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conditions = [
        Expense.user_id == current_user.id,
        extract("year", Expense.date) == year,
        extract("month", Expense.date) == month,
    ]
    if payment_method and payment_method != "all":
        conditions.append(Expense.payment_method == payment_method)

    result = await db.execute(
        select(func.sum(Expense.amount), func.count(Expense.id)).where(and_(*conditions))
    )
    row = result.one()
    total = row[0] or 0
    count = row[1] or 0

    # 전월 비교
    prev_month = month - 1 if month > 1 else 12
    prev_year = year if month > 1 else year - 1
    prev_cond = [
        Expense.user_id == current_user.id,
        extract("year", Expense.date) == prev_year,
        extract("month", Expense.date) == prev_month,
    ]
    prev_result = await db.execute(
        select(func.sum(Expense.amount)).where(and_(*prev_cond))
    )
    prev_total = prev_result.scalar() or 0
    diff_rate = round((total - prev_total) / prev_total * 100, 1) if prev_total else None

    return SummaryResponse(total=total, count=count, prev_total=prev_total, diff_rate=diff_rate)


@router.get("/by-category", response_model=List[CategoryStat])
async def get_by_category(
    year: int = Query(...),
    month: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(
            Expense.category_id,
            Category.name,
            func.sum(Expense.amount),
            func.count(Expense.id),
        )
        .outerjoin(Category, Expense.category_id == Category.id)
        .where(
            and_(
                Expense.user_id == current_user.id,
                extract("year", Expense.date) == year,
                extract("month", Expense.date) == month,
            )
        )
        .group_by(Expense.category_id, Category.name)
        .order_by(func.sum(Expense.amount).desc())
    )
    return [
        CategoryStat(
            category_id=row[0],
            category_name=row[1] or "미분류",
            total=row[2] or 0,
            count=row[3] or 0,
        )
        for row in result.all()
    ]


@router.get("/by-payment", response_model=List[PaymentStat])
async def get_by_payment(
    year: int = Query(...),
    month: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(
            Expense.payment_method,
            func.sum(Expense.amount),
            func.count(Expense.id),
        )
        .where(
            and_(
                Expense.user_id == current_user.id,
                extract("year", Expense.date) == year,
                extract("month", Expense.date) == month,
            )
        )
        .group_by(Expense.payment_method)
    )
    return [
        PaymentStat(payment_method=row[0].value, total=row[1] or 0, count=row[2] or 0)
        for row in result.all()
    ]


@router.get("/trend", response_model=List[TrendPoint])
async def get_trend(
    type: str = Query(..., description="monthly | weekly | yearly"),
    year: int = Query(...),
    month: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if type == "monthly":
        rows = []
        for m in range(1, 13):
            result = await db.execute(
                select(func.sum(Expense.amount)).where(
                    and_(
                        Expense.user_id == current_user.id,
                        extract("year", Expense.date) == year,
                        extract("month", Expense.date) == m,
                    )
                )
            )
            rows.append(TrendPoint(label=f"{m}월", total=result.scalar() or 0))
        return rows

    if type == "weekly" and month:
        rows = []
        for w in range(1, 6):
            start_day = (w - 1) * 7 + 1
            end_day = w * 7
            result = await db.execute(
                select(func.sum(Expense.amount)).where(
                    and_(
                        Expense.user_id == current_user.id,
                        extract("year", Expense.date) == year,
                        extract("month", Expense.date) == month,
                        extract("day", Expense.date) >= start_day,
                        extract("day", Expense.date) <= end_day,
                    )
                )
            )
            rows.append(TrendPoint(label=f"{w}주차", total=result.scalar() or 0))
        return rows

    return []
