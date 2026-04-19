"""Goal service — CRUD operations with contribution support."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.goal import Goal
from app.models.user import User
from app.schemas.goal import GoalCreate, GoalUpdate


def get_goals(user: User, db: Session) -> list[Goal]:
    """Get all goals for a user."""
    return db.query(Goal).filter(Goal.user_id == user.id).order_by(Goal.created_at.desc()).all()


def create_goal(data: GoalCreate, user: User, db: Session) -> Goal:
    """Create a new goal."""
    goal = Goal(
        user_id=user.id,
        name=data.name,
        target_amount=data.target_amount,
        current_amount=data.current_amount,
        deadline=data.deadline,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


def update_goal(goal_id: int, data: GoalUpdate, user: User, db: Session) -> Goal:
    """Update an existing goal."""
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user.id).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    if data.name is not None:
        goal.name = data.name
    if data.target_amount is not None:
        goal.target_amount = data.target_amount
    if data.current_amount is not None:
        goal.current_amount = data.current_amount
    if data.deadline is not None:
        goal.deadline = data.deadline
    if data.is_complete is not None:
        goal.is_complete = data.is_complete

    # Auto-complete if current >= target
    if goal.current_amount >= goal.target_amount:
        goal.is_complete = True

    db.commit()
    db.refresh(goal)
    return goal


def delete_goal(goal_id: int, user: User, db: Session) -> None:
    """Delete a goal."""
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user.id).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    db.delete(goal)
    db.commit()
