"""Account service — CRUD operations for user accounts."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.user import User
from app.schemas.account import AccountCreate, AccountUpdate


def get_accounts(user: User, db: Session) -> list[Account]:
    """Get all accounts for a user."""
    return db.query(Account).filter(Account.user_id == user.id).order_by(Account.created_at.desc()).all()


def get_account(account_id: int, user: User, db: Session) -> Account:
    """Get a single account by ID, ensuring ownership."""
    account = db.query(Account).filter(Account.id == account_id, Account.user_id == user.id).first()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    return account


def create_account(data: AccountCreate, user: User, db: Session) -> Account:
    """Create a new account for the user."""
    account = Account(
        user_id=user.id,
        name=data.name,
        type=data.type,
        balance=data.balance,
        color=data.color,
        icon=data.icon,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


def update_account(account_id: int, data: AccountUpdate, user: User, db: Session) -> Account:
    """Update an existing account."""
    account = get_account(account_id, user, db)

    if data.name is not None:
        account.name = data.name
    if data.type is not None:
        account.type = data.type
    if data.balance is not None:
        account.balance = data.balance
    if data.color is not None:
        account.color = data.color
    if data.icon is not None:
        account.icon = data.icon
    if data.is_active is not None:
        account.is_active = data.is_active

    db.commit()
    db.refresh(account)
    return account


def delete_account(account_id: int, user: User, db: Session) -> None:
    """Delete an account."""
    account = get_account(account_id, user, db)
    db.delete(account)
    db.commit()
