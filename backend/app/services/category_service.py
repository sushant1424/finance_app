"""Category service — CRUD operations."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryUpdate


def get_categories(user: User, db: Session) -> list[Category]:
    """Get all categories for a user."""
    return db.query(Category).filter(Category.user_id == user.id).order_by(Category.name).all()


def create_category(data: CategoryCreate, user: User, db: Session) -> Category:
    """Create a new category."""
    category = Category(
        user_id=user.id,
        name=data.name,
        type=data.type,
        color=data.color,
        icon=data.icon,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def update_category(category_id: int, data: CategoryUpdate, user: User, db: Session) -> Category:
    """Update an existing category."""
    category = db.query(Category).filter(Category.id == category_id, Category.user_id == user.id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    if data.name is not None:
        category.name = data.name
    if data.type is not None:
        category.type = data.type
    if data.color is not None:
        category.color = data.color
    if data.icon is not None:
        category.icon = data.icon

    db.commit()
    db.refresh(category)
    return category


def delete_category(category_id: int, user: User, db: Session) -> None:
    """Delete a category."""
    category = db.query(Category).filter(Category.id == category_id, Category.user_id == user.id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    db.delete(category)
    db.commit()
