import csv
import io
from datetime import date as Date, datetime
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
from app.models.payment_method import PaymentMethod
from app.models.recurring import RecurringExpense
from app.models.budget import Budget
from app.schemas.backup import BackupData

router = APIRouter()


@router.get("/csv")
async def export_csv(
    start_date: Optional[Date] = Query(None),
    end_date: Optional[Date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conditions = [Expense.user_id == current_user.id]
    if start_date:
        conditions.append(Expense.date >= start_date)
    if end_date:
        conditions.append(Expense.date <= end_date)

    result = await db.execute(
        select(Expense, Category.name, PaymentMethod.name)
        .outerjoin(Category, Expense.category_id == Category.id)
        .outerjoin(PaymentMethod, Expense.payment_method_id == PaymentMethod.id)
        .where(and_(*conditions))
        .order_by(Expense.date.desc(), Expense.id.desc())
    )
    rows = result.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["날짜", "금액", "결제수단", "카테고리", "메모"])
    for expense, category_name, payment_name in rows:
        writer.writerow([
            expense.date.isoformat(),
            expense.amount,
            payment_name or "미등록",
            category_name or "미분류",
            expense.memo or "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=expenses.csv"},
    )


@router.get("/backup", response_model=BackupData)
async def export_backup(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    pm_result = await db.execute(select(PaymentMethod).where(PaymentMethod.user_id == current_user.id))
    cat_result = await db.execute(select(Category).where(Category.user_id == current_user.id))
    exp_result = await db.execute(select(Expense).where(Expense.user_id == current_user.id))
    rec_result = await db.execute(select(RecurringExpense).where(RecurringExpense.user_id == current_user.id))
    budget_result = await db.execute(select(Budget).where(Budget.user_id == current_user.id))

    return BackupData(
        version=1,
        exported_at=datetime.utcnow(),
        payment_methods=pm_result.scalars().all(),
        categories=cat_result.scalars().all(),
        expenses=exp_result.scalars().all(),
        recurring_expenses=rec_result.scalars().all(),
        budgets=budget_result.scalars().all(),
    )


@router.post("/restore")
async def restore_backup(
    body: BackupData,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # 기존 데이터 삭제 (지출, 반복 지출, 예산, 결제수단, 사용자 정의 카테고리)
    for model in (Expense, RecurringExpense, Budget, PaymentMethod, Category):
        result = await db.execute(select(model).where(model.user_id == current_user.id))
        for row in result.scalars().all():
            await db.delete(row)
    await db.flush()

    # 결제수단 복원 (id 매핑)
    pm_id_map = {}
    for pm in body.payment_methods:
        new_pm = PaymentMethod(
            user_id=current_user.id,
            payment_type=pm.payment_type,
            name=pm.name,
            is_default=pm.is_default,
        )
        db.add(new_pm)
        await db.flush()
        pm_id_map[pm.id] = new_pm.id

    # 사용자 정의 카테고리 복원 (id 매핑, 기본 카테고리는 공용이라 그대로 유지)
    cat_id_map = {}
    for cat in body.categories:
        new_cat = Category(
            user_id=current_user.id,
            name=cat.name,
            icon=cat.icon,
            color=cat.color,
            budget=cat.budget,
        )
        db.add(new_cat)
        await db.flush()
        cat_id_map[cat.id] = new_cat.id

    # 지출 내역 복원
    for exp in body.expenses:
        db.add(Expense(
            user_id=current_user.id,
            amount=exp.amount,
            payment_method_id=pm_id_map.get(exp.payment_method_id),
            category_id=cat_id_map.get(exp.category_id, exp.category_id),
            date=exp.date,
            memo=exp.memo,
            is_recurring=exp.is_recurring,
        ))

    # 반복 지출 복원
    for rec in body.recurring_expenses:
        db.add(RecurringExpense(
            user_id=current_user.id,
            amount=rec.amount,
            payment_method_id=pm_id_map.get(rec.payment_method_id),
            category_id=cat_id_map.get(rec.category_id, rec.category_id),
            description=rec.description,
            cycle=rec.cycle,
            next_due_date=rec.next_due_date,
        ))

    # 예산 복원
    for b in body.budgets:
        db.add(Budget(
            user_id=current_user.id,
            budget_type=b.budget_type,
            amount=b.amount,
            year=b.year,
            month=b.month,
        ))

    await db.commit()
    return {"message": "복원이 완료되었습니다."}
