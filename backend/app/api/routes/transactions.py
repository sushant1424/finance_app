"""Transaction routes — CRUD, filtering, pagination, CSV export."""

from datetime import date

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.transaction import TransactionCreate, TransactionUpdate
from app.services.transaction_service import (
    create_transaction,
    delete_transaction,
    export_transactions_csv,
    get_transaction,
    get_transactions,
    update_transaction,
)

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("")
def list_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    type: str | None = Query(None),
    category_id: int | None = Query(None),
    account_id: int | None = Query(None),
    search: str | None = Query(None),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get paginated, filtered transactions."""
    result = get_transactions(
        user, db, page=page, limit=limit,
        type_filter=type, category_id=category_id,
        account_id=account_id, search=search,
        date_from=date_from, date_to=date_to,
    )
    return {
        "success": True,
        "message": "Success",
        "data": result["data"],
        "total": result["total"],
        "page": result["page"],
        "limit": result["limit"],
        "total_pages": result["total_pages"],
    }


@router.post("")
def add_transaction(
    data: TransactionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new transaction."""
    txn = create_transaction(data, user, db)
    return APIResponse(data=txn, message="Transaction created")


@router.get("/export")
def export_csv(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Export all transactions as CSV."""
    csv_content = export_transactions_csv(user, db)
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions.csv"},
    )


@router.get("/{transaction_id}")
def read_transaction(
    transaction_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific transaction."""
    txn = get_transaction(transaction_id, user, db)
    return APIResponse(data=txn)


@router.put("/{transaction_id}")
def edit_transaction(
    transaction_id: int,
    data: TransactionUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a transaction."""
    txn = update_transaction(transaction_id, data, user, db)
    return APIResponse(data=txn, message="Transaction updated")


@router.delete("/{transaction_id}")
def remove_transaction(
    transaction_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a transaction."""
    delete_transaction(transaction_id, user, db)
    return APIResponse(message="Transaction deleted")
