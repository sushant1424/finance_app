"""Category routes — full CRUD."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from app.schemas.common import APIResponse
from app.services.category_service import (
    create_category,
    delete_category,
    get_categories,
    update_category,
)

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("")
def list_categories(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all categories for the current user."""
    categories = get_categories(user, db)
    return APIResponse(data=[CategoryResponse.model_validate(c).model_dump() for c in categories])


@router.post("")
def add_category(
    data: CategoryCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new category."""
    category = create_category(data, user, db)
    return APIResponse(data=CategoryResponse.model_validate(category).model_dump(), message="Category created")


@router.put("/{category_id}")
def edit_category(
    category_id: int,
    data: CategoryUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a category."""
    category = update_category(category_id, data, user, db)
    return APIResponse(data=CategoryResponse.model_validate(category).model_dump(), message="Category updated")


@router.delete("/{category_id}")
def remove_category(
    category_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a category."""
    delete_category(category_id, user, db)
    return APIResponse(message="Category deleted")
