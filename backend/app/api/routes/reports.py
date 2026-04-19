"""Reports routes — summary with date range filtering."""

from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.common import APIResponse

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/summary")
def get_summary(
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get financial summary for a date range."""
    query = db.query(Transaction).filter(Transaction.user_id == user.id)

    if date_from:
        query = query.filter(Transaction.date >= date_from)
    if date_to:
        query = query.filter(Transaction.date <= date_to)

    transactions = query.all()

    total_income = sum(float(t.amount) for t in transactions if t.type == "income")
    total_expenses = sum(float(t.amount) for t in transactions if t.type == "expense")
    net = total_income - total_expenses
    count = len(transactions)

    # Monthly breakdown for chart
    monthly_query = (
        db.query(
            extract("year", Transaction.date).label("year"),
            extract("month", Transaction.date).label("month"),
            Transaction.type,
            func.sum(Transaction.amount).label("total"),
        )
        .filter(Transaction.user_id == user.id)
    )
    if date_from:
        monthly_query = monthly_query.filter(Transaction.date >= date_from)
    if date_to:
        monthly_query = monthly_query.filter(Transaction.date <= date_to)

    monthly_data = monthly_query.group_by("year", "month", Transaction.type).order_by("year", "month").all()

    monthly_chart = {}
    for row in monthly_data:
        key = f"{int(row.year)}-{int(row.month):02d}"
        if key not in monthly_chart:
            monthly_chart[key] = {"month": key, "income": 0, "expense": 0}
        monthly_chart[key][row.type] = float(row.total)

    # Category breakdown
    category_breakdown = []
    expense_by_cat = (
        db.query(
            Transaction.category_id,
            func.sum(Transaction.amount).label("total"),
        )
        .filter(
            Transaction.user_id == user.id,
            Transaction.type == "expense",
        )
    )
    if date_from:
        expense_by_cat = expense_by_cat.filter(Transaction.date >= date_from)
    if date_to:
        expense_by_cat = expense_by_cat.filter(Transaction.date <= date_to)

    expense_by_cat = expense_by_cat.group_by(Transaction.category_id).all()

    for row in expense_by_cat:
        cat = db.query(Category).filter(Category.id == row.category_id).first()
        amount = float(row.total)
        percentage = round((amount / total_expenses * 100), 1) if total_expenses > 0 else 0
        category_breakdown.append({
            "category_id": row.category_id,
            "category_name": cat.name if cat else "Unknown",
            "category_color": cat.color if cat else "#666",
            "amount": round(amount, 2),
            "percentage": percentage,
        })

    category_breakdown.sort(key=lambda x: x["amount"], reverse=True)

    return APIResponse(data={
        "total_income": round(total_income, 2),
        "total_expenses": round(total_expenses, 2),
        "net": round(net, 2),
        "transaction_count": count,
        "monthly_chart": list(monthly_chart.values()),
        "category_breakdown": category_breakdown,
    })
