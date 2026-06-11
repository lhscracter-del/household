from datetime import date as Date
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, extract
from app.core.database import get_db
from app.core.deps import get_current_user, get_household_user_ids
from collections import defaultdict
from app.models.user import User
from app.models.expense import Expense
from app.models.category import Category
from app.models.payment_method import PaymentMethod
from app.models.recurring import RecurringExpense
from app.schemas.stats import SummaryResponse, CategoryStat, PaymentStat, TrendPoint

router = APIRouter()


@router.get("/summary", response_model=SummaryResponse)
async def get_summary(
    year: int = Query(...),
    month: int = Query(...),
    payment_method_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    household_user_ids = await get_household_user_ids(current_user, db)
    conditions = [
        Expense.user_id.in_(household_user_ids),
        extract("year", Expense.date) == year,
        extract("month", Expense.date) == month,
    ]
    if payment_method_id:
        conditions.append(Expense.payment_method_id == payment_method_id)

    result = await db.execute(
        select(func.sum(Expense.amount), func.count(Expense.id)).where(and_(*conditions))
    )
    row = result.one()
    total = row[0] or 0
    count = row[1] or 0

    prev_month = month - 1 if month > 1 else 12
    prev_year = year if month > 1 else year - 1
    prev_result = await db.execute(
        select(func.sum(Expense.amount)).where(and_(
            Expense.user_id.in_(household_user_ids),
            extract("year", Expense.date) == prev_year,
            extract("month", Expense.date) == prev_month,
        ))
    )
    prev_total = prev_result.scalar() or 0
    diff_rate = round((total - prev_total) / prev_total * 100, 1) if prev_total else None

    return SummaryResponse(total=total, count=count, prev_total=prev_total, diff_rate=diff_rate)


@router.get("/by-category", response_model=List[CategoryStat])
async def get_by_category(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    start_date: Optional[Date] = Query(None),
    end_date: Optional[Date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    household_user_ids = await get_household_user_ids(current_user, db)
    if start_date and end_date:
        expense_conditions = [
            Expense.user_id.in_(household_user_ids),
            Expense.date >= start_date,
            Expense.date <= end_date,
        ]
        include_recurring = False
    else:
        expense_conditions = [
            Expense.user_id.in_(household_user_ids),
            extract("year", Expense.date) == year,
            extract("month", Expense.date) == month,
        ]
        include_recurring = True

    expense_result = await db.execute(
        select(Expense.category_id, Category.name, func.sum(Expense.amount), func.count(Expense.id))
        .outerjoin(Category, Expense.category_id == Category.id)
        .where(and_(*expense_conditions))
        .group_by(Expense.category_id, Category.name)
    )

    totals: dict = defaultdict(lambda: {
        "name": "미분류", "expense_total": 0, "expense_count": 0, "recurring_total": 0, "recurring_count": 0,
    })
    for row in expense_result.all():
        totals[row[0]]["name"] = row[1] or "미분류"
        totals[row[0]]["expense_total"] += row[2] or 0
        totals[row[0]]["expense_count"] += row[3] or 0

    if include_recurring:
        recurring_result = await db.execute(
            select(RecurringExpense.category_id, Category.name, func.sum(RecurringExpense.amount), func.count(RecurringExpense.id))
            .outerjoin(Category, RecurringExpense.category_id == Category.id)
            .where(and_(
                RecurringExpense.user_id.in_(household_user_ids),
                RecurringExpense.cycle == "monthly",
            ))
            .group_by(RecurringExpense.category_id, Category.name)
        )
        for row in recurring_result.all():
            totals[row[0]]["name"] = row[1] or "미분류"
            totals[row[0]]["recurring_total"] += row[2] or 0
            totals[row[0]]["recurring_count"] += row[3] or 0

    return sorted(
        [CategoryStat(
            category_id=k, category_name=v["name"],
            total=v["expense_total"] + v["recurring_total"], count=v["expense_count"] + v["recurring_count"],
            expense_total=v["expense_total"], expense_count=v["expense_count"],
            recurring_total=v["recurring_total"], recurring_count=v["recurring_count"],
        ) for k, v in totals.items()],
        key=lambda x: -x.total,
    )


@router.get("/by-payment", response_model=List[PaymentStat])
async def get_by_payment(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    start_date: Optional[Date] = Query(None),
    end_date: Optional[Date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    household_user_ids = await get_household_user_ids(current_user, db)
    if start_date and end_date:
        expense_conditions = [
            Expense.user_id.in_(household_user_ids),
            Expense.date >= start_date,
            Expense.date <= end_date,
        ]
        include_recurring = False
    else:
        expense_conditions = [
            Expense.user_id.in_(household_user_ids),
            extract("year", Expense.date) == year,
            extract("month", Expense.date) == month,
        ]
        include_recurring = True

    expense_result = await db.execute(
        select(
            Expense.payment_method_id, PaymentMethod.name, PaymentMethod.payment_type,
            func.sum(Expense.amount), func.count(Expense.id),
        )
        .outerjoin(PaymentMethod, Expense.payment_method_id == PaymentMethod.id)
        .where(and_(*expense_conditions))
        .group_by(Expense.payment_method_id, PaymentMethod.name, PaymentMethod.payment_type)
    )

    totals: dict = defaultdict(lambda: {
        "name": "미분류", "type": "cash", "expense_total": 0, "expense_count": 0, "recurring_total": 0, "recurring_count": 0,
    })
    for row in expense_result.all():
        totals[row[0]]["name"] = row[1] or "미분류"
        totals[row[0]]["type"] = row[2] or "cash"
        totals[row[0]]["expense_total"] += row[3] or 0
        totals[row[0]]["expense_count"] += row[4] or 0

    if include_recurring:
        recurring_result = await db.execute(
            select(
                RecurringExpense.payment_method_id, PaymentMethod.name, PaymentMethod.payment_type,
                func.sum(RecurringExpense.amount), func.count(RecurringExpense.id),
            )
            .outerjoin(PaymentMethod, RecurringExpense.payment_method_id == PaymentMethod.id)
            .where(and_(
                RecurringExpense.user_id.in_(household_user_ids),
                RecurringExpense.cycle == "monthly",
            ))
            .group_by(RecurringExpense.payment_method_id, PaymentMethod.name, PaymentMethod.payment_type)
        )
        for row in recurring_result.all():
            totals[row[0]]["name"] = row[1] or "미분류"
            totals[row[0]]["type"] = row[2] or "cash"
            totals[row[0]]["recurring_total"] += row[3] or 0
            totals[row[0]]["recurring_count"] += row[4] or 0

    return sorted(
        [PaymentStat(
            payment_method_id=k, payment_method_name=v["name"], payment_type=v["type"],
            total=v["expense_total"] + v["recurring_total"], count=v["expense_count"] + v["recurring_count"],
            expense_total=v["expense_total"], expense_count=v["expense_count"],
            recurring_total=v["recurring_total"], recurring_count=v["recurring_count"],
        ) for k, v in totals.items()],
        key=lambda x: -x.total,
    )


@router.get("/yearly-total", response_model=SummaryResponse)
async def get_yearly_total(
    year: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    household_user_ids = await get_household_user_ids(current_user, db)
    result = await db.execute(
        select(func.sum(Expense.amount), func.count(Expense.id)).where(
            and_(Expense.user_id.in_(household_user_ids), extract("year", Expense.date) == year)
        )
    )
    row = result.one()
    return SummaryResponse(total=row[0] or 0, count=row[1] or 0)


@router.get("/trend", response_model=List[TrendPoint])
async def get_trend(
    type: str = Query(..., description="monthly | weekly | yearly"),
    year: int = Query(...),
    month: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    household_user_ids = await get_household_user_ids(current_user, db)
    if type == "monthly":
        result = await db.execute(
            select(extract("month", Expense.date).label("m"), func.sum(Expense.amount))
            .where(and_(Expense.user_id.in_(household_user_ids), extract("year", Expense.date) == year))
            .group_by(extract("month", Expense.date))
            .order_by(extract("month", Expense.date))
        )
        month_map = {int(row[0]): int(row[1] or 0) for row in result.all()}
        return [TrendPoint(label=f"{m}월", total=month_map.get(m, 0)) for m in range(1, 13)]

    if type == "weekly" and month:
        week_expr = func.floor((extract("day", Expense.date) - 1) / 7 + 1)
        result = await db.execute(
            select(week_expr.label("w"), func.sum(Expense.amount))
            .where(and_(
                Expense.user_id.in_(household_user_ids),
                extract("year", Expense.date) == year,
                extract("month", Expense.date) == month,
            ))
            .group_by(week_expr)
            .order_by(week_expr)
        )
        week_map = {min(int(row[0]), 5): int(row[1] or 0) for row in result.all()}
        return [TrendPoint(label=f"{w}주차", total=week_map.get(w, 0)) for w in range(1, 6)]

    return []
