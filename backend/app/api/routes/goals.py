"""Goal routes — CRUD operations."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.goal import GoalCreate, GoalResponse, GoalUpdate
from app.services.goal_service import create_goal, delete_goal, get_goals, update_goal

router = APIRouter(prefix="/goals", tags=["Goals"])


@router.get("")
def list_goals(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all goals for the current user."""
    goals = get_goals(user, db)
    return APIResponse(data=[GoalResponse.model_validate(g).model_dump() for g in goals])


@router.post("")
def add_goal(
    data: GoalCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new goal."""
    goal = create_goal(data, user, db)
    return APIResponse(data=GoalResponse.model_validate(goal).model_dump(), message="Goal created")


@router.put("/{goal_id}")
def edit_goal(
    goal_id: int,
    data: GoalUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a goal."""
    goal = update_goal(goal_id, data, user, db)
    return APIResponse(data=GoalResponse.model_validate(goal).model_dump(), message="Goal updated")


@router.delete("/{goal_id}")
def remove_goal(
    goal_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a goal."""
    delete_goal(goal_id, user, db)
    return APIResponse(message="Goal deleted")
