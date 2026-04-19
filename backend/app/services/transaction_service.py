"""Transaction service — CRUD, filtering, pagination, CSV export, ML trigger."""

import csv
import io
import math
from datetime import date
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionUpdate


def _enrich_transaction(txn: Transaction, db: Session) -> dict:
    """Add category and account names to a transaction dict."""
    data = {
        "id": txn.id,
        "user_id": txn.user_id,
        "account_id": txn.account_id,
        "category_id": txn.category_id,
        "amount": txn.amount,
        "type": txn.type,
        "note": txn.note,
        "date": txn.date,
        "is_anomaly": txn.is_anomaly,
        "anomaly_score": txn.anomaly_score,
        "created_at": txn.created_at,
        "category_name": None,
        "category_color": None,
        "category_icon": None,
        "account_name": None,
    }
    if txn.category_id:
        cat = db.query(Category).filter(Category.id == txn.category_id).first()
        if cat:
            data["category_name"] = cat.name
            data["category_color"] = cat.color
            data["category_icon"] = cat.icon
    if txn.account_id:
        acc = db.query(Account).filter(Account.id == txn.account_id).first()
        if acc:
            data["account_name"] = acc.name
    return data


def get_transactions(
    user: User,
    db: Session,
    page: int = 1,
    limit: int = 10,
    type_filter: str | None = None,
    category_id: int | None = None,
    account_id: int | None = None,
    search: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> dict:
    """Get paginated, filtered transactions for a user."""
    query = db.query(Transaction).filter(Transaction.user_id == user.id)

    if type_filter:
        query = query.filter(Transaction.type == type_filter)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if account_id:
        query = query.filter(Transaction.account_id == account_id)
    if search:
        query = query.filter(Transaction.note.ilike(f"%{search}%"))
    if date_from:
        query = query.filter(Transaction.date >= date_from)
    if date_to:
        query = query.filter(Transaction.date <= date_to)

    total = query.count()
    total_pages = math.ceil(total / limit) if limit > 0 else 0

    transactions = (
        query.order_by(Transaction.date.desc(), Transaction.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "data": [_enrich_transaction(t, db) for t in transactions],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
    }


def get_transaction(transaction_id: int, user: User, db: Session) -> dict:
    """Get a single transaction by ID."""
    txn = db.query(Transaction).filter(
        Transaction.id == transaction_id, Transaction.user_id == user.id
    ).first()
    if not txn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return _enrich_transaction(txn, db)


def create_transaction(data: TransactionCreate, user: User, db: Session) -> dict:
    """Create a new transaction and update account balance."""
    txn = Transaction(
        user_id=user.id,
        account_id=data.account_id,
        category_id=data.category_id,
        amount=data.amount,
        type=data.type,
        note=data.note,
        date=data.date,
    )
    db.add(txn)

    # Update account balance
    account = db.query(Account).filter(Account.id == data.account_id).first()
    if account:
        if data.type == "income":
            account.balance = account.balance + data.amount
        else:
            account.balance = account.balance - data.amount

    db.commit()
    db.refresh(txn)

    # Run anomaly detection
    try:
        from app.ml.anomaly_detector import detect_anomalies
        detect_anomalies(user.id, db)
    except Exception:
        pass  # Don't fail the transaction if ML fails

    return _enrich_transaction(txn, db)


def update_transaction(transaction_id: int, data: TransactionUpdate, user: User, db: Session) -> dict:
    """Update an existing transaction and adjust account balances."""
    txn = db.query(Transaction).filter(
        Transaction.id == transaction_id, Transaction.user_id == user.id
    ).first()
    if not txn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    # Reverse old balance effect
    if txn.account_id:
        old_account = db.query(Account).filter(Account.id == txn.account_id).first()
        if old_account:
            if txn.type == "income":
                old_account.balance = old_account.balance - txn.amount
            else:
                old_account.balance = old_account.balance + txn.amount

    # Apply updates
    if data.amount is not None:
        txn.amount = data.amount
    if data.type is not None:
        txn.type = data.type
    if data.category_id is not None:
        txn.category_id = data.category_id
    if data.account_id is not None:
        txn.account_id = data.account_id
    if data.date is not None:
        txn.date = data.date
    if data.note is not None:
        txn.note = data.note

    # Apply new balance effect
    if txn.account_id:
        new_account = db.query(Account).filter(Account.id == txn.account_id).first()
        if new_account:
            if txn.type == "income":
                new_account.balance = new_account.balance + txn.amount
            else:
                new_account.balance = new_account.balance - txn.amount

    db.commit()
    db.refresh(txn)
    return _enrich_transaction(txn, db)


def delete_transaction(transaction_id: int, user: User, db: Session) -> None:
    """Delete a transaction and reverse its balance effect."""
    txn = db.query(Transaction).filter(
        Transaction.id == transaction_id, Transaction.user_id == user.id
    ).first()
    if not txn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    # Reverse balance
    if txn.account_id:
        account = db.query(Account).filter(Account.id == txn.account_id).first()
        if account:
            if txn.type == "income":
                account.balance = account.balance - txn.amount
            else:
                account.balance = account.balance + txn.amount

    db.delete(txn)
    db.commit()


def export_transactions_csv(user: User, db: Session) -> str:
    """Export all user transactions as CSV string."""
    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == user.id)
        .order_by(Transaction.date.desc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Type", "Amount", "Category", "Account", "Note", "Anomaly"])

    for txn in transactions:
        cat_name = ""
        acc_name = ""
        if txn.category_id:
            cat = db.query(Category).filter(Category.id == txn.category_id).first()
            cat_name = cat.name if cat else ""
        if txn.account_id:
            acc = db.query(Account).filter(Account.id == txn.account_id).first()
            acc_name = acc.name if acc else ""

        writer.writerow([
            str(txn.date),
            txn.type,
            str(txn.amount),
            cat_name,
            acc_name,
            txn.note or "",
            "Yes" if txn.is_anomaly else "No",
        ])

    return output.getvalue()
