"""Budget routes — CRUD with month/year filtering."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetUpdate
from app.schemas.common import APIResponse
from app.services.budget_service import (
    create_budget,
    delete_budget,
    get_budgets,
    update_budget,
)

router = APIRouter(prefix="/budgets", tags=["Budgets"])


@router.get("")
def list_budgets(
    month: int | None = Query(None),
    year: int | None = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get budgets, optionally filtered by month/year."""
    budgets = get_budgets(user, db, month=month, year=year)
    return APIResponse(data=budgets)


@router.post("")
def add_budget(
    data: BudgetCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new budget."""
    budget = create_budget(data, user, db)
    return APIResponse(data=budget, message="Budget created")


@router.put("/{budget_id}")
def edit_budget(
    budget_id: int,
    data: BudgetUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a budget."""
    budget = update_budget(budget_id, data, user, db)
    return APIResponse(data=budget, message="Budget updated")


@router.delete("/{budget_id}")
def remove_budget(
    budget_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a budget."""
    delete_budget(budget_id, user, db)
    return APIResponse(message="Budget deleted")
