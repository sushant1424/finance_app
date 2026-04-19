"""Account routes — full CRUD."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.account import AccountCreate, AccountResponse, AccountUpdate
from app.schemas.common import APIResponse
from app.services.account_service import (
    create_account,
    delete_account,
    get_account,
    get_accounts,
    update_account,
)

router = APIRouter(prefix="/accounts", tags=["Accounts"])


@router.get("")
def list_accounts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all accounts for the current user."""
    accounts = get_accounts(user, db)
    return APIResponse(data=[AccountResponse.model_validate(a).model_dump() for a in accounts])


@router.post("")
def add_account(
    data: AccountCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new account."""
    account = create_account(data, user, db)
    return APIResponse(data=AccountResponse.model_validate(account).model_dump(), message="Account created")


@router.get("/{account_id}")
def read_account(
    account_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific account."""
    account = get_account(account_id, user, db)
    return APIResponse(data=AccountResponse.model_validate(account).model_dump())


@router.put("/{account_id}")
def edit_account(
    account_id: int,
    data: AccountUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an account."""
    account = update_account(account_id, data, user, db)
    return APIResponse(data=AccountResponse.model_validate(account).model_dump(), message="Account updated")


@router.delete("/{account_id}")
def remove_account(
    account_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an account."""
    delete_account(account_id, user, db)
    return APIResponse(message="Account deleted")
