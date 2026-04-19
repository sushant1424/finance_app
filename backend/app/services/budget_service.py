"""Budget service — CRUD with spent amount calculation."""

from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from app.models.budget import Budget
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetUpdate


def _calculate_spent(budget: Budget, user_id: int, db: Session) -> Decimal:
    """Calculate total spent for a budget's category in the budget's month/year."""
    result = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(
            Transaction.user_id == user_id,
            Transaction.category_id == budget.category_id,
            Transaction.type == "expense",
            extract("month", Transaction.date) == budget.month,
            extract("year", Transaction.date) == budget.year,
        )
        .scalar()
    )
    return Decimal(str(result))


def _enrich_budget(budget: Budget, user_id: int, db: Session) -> dict:
    """Add spent amount and category info to budget."""
    cat = db.query(Category).filter(Category.id == budget.category_id).first()
    return {
        "id": budget.id,
        "user_id": budget.user_id,
        "category_id": budget.category_id,
        "month": budget.month,
        "year": budget.year,
        "amount_limit": budget.amount_limit,
        "spent": _calculate_spent(budget, user_id, db),
        "category_name": cat.name if cat else None,
        "category_color": cat.color if cat else None,
        "category_icon": cat.icon if cat else None,
        "created_at": budget.created_at,
    }


def get_budgets(user: User, db: Session, month: int | None = None, year: int | None = None) -> list[dict]:
    """Get budgets for a user, optionally filtered by month/year."""
    query = db.query(Budget).filter(Budget.user_id == user.id)
    if month:
        query = query.filter(Budget.month == month)
    if year:
        query = query.filter(Budget.year == year)

    budgets = query.order_by(Budget.year.desc(), Budget.month.desc()).all()
    return [_enrich_budget(b, user.id, db) for b in budgets]


def create_budget(data: BudgetCreate, user: User, db: Session) -> dict:
    """Create a new budget."""
    # Check for duplicate
    existing = db.query(Budget).filter(
        Budget.user_id == user.id,
        Budget.category_id == data.category_id,
        Budget.month == data.month,
        Budget.year == data.year,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Budget already exists for this category and month",
        )

    budget = Budget(
        user_id=user.id,
        category_id=data.category_id,
        month=data.month,
        year=data.year,
        amount_limit=data.amount_limit,
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return _enrich_budget(budget, user.id, db)


def update_budget(budget_id: int, data: BudgetUpdate, user: User, db: Session) -> dict:
    """Update an existing budget."""
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user.id).first()
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

    if data.category_id is not None:
        budget.category_id = data.category_id
    if data.month is not None:
        budget.month = data.month
    if data.year is not None:
        budget.year = data.year
    if data.amount_limit is not None:
        budget.amount_limit = data.amount_limit

    db.commit()
    db.refresh(budget)
    return _enrich_budget(budget, user.id, db)


def delete_budget(budget_id: int, user: User, db: Session) -> None:
    """Delete a budget."""
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user.id).first()
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    db.delete(budget)
    db.commit()
