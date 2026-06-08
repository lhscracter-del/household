import csv
import io
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.expense import Expense
from app.models.category import Category

router = APIRouter()


@router.get("/csv")
async def export_csv(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conditions = [Expense.user_id == current_user.id]
    if start_date:
        conditions.append(Expense.date >= start_date)
    if end_date:
        conditions.append(Expense.date <= end_date)

    result = await db.execute(
        select(Expense, Category.name)
        .outerjoin(Category, Expense.category_id == Category.id)
        .where(and_(*conditions))
        .order_by(Expense.date.desc())
    )
    rows = result.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["날짜", "금액", "결제수단", "카테고리", "메모"])
    for expense, category_name in rows:
        payment_map = {"cash": "현금", "check_card": "체크카드", "credit_card": "신용카드"}
        writer.writerow([
            expense.date.isoformat(),
            expense.amount,
            payment_map.get(expense.payment_method.value, expense.payment_method.value),
            category_name or "미분류",
            expense.memo or "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=expenses.csv"},
    )
