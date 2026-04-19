"""Anomaly detection using Isolation Forest on user transactions."""

import numpy as np
from sqlalchemy.orm import Session

from app.models.transaction import Transaction


def detect_anomalies(user_id: int, db: Session) -> None:
    """
    Train an Isolation Forest on the user's transactions and flag anomalies.
    Features: amount, hour_of_day (from created_at), day_of_week, category_id.
    Requires at least 10 transactions. Contamination = 0.05.
    """
    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .order_by(Transaction.date)
        .all()
    )

    if len(transactions) < 10:
        return  # Not enough data

    # Build feature matrix
    features = []
    for txn in transactions:
        hour = txn.created_at.hour if txn.created_at else 12
        dow = txn.date.weekday() if txn.date else 0
        cat_id = txn.category_id if txn.category_id else 0
        features.append([float(txn.amount), hour, dow, cat_id])

    X = np.array(features)

    # Lazy import to avoid slow startup
    from sklearn.ensemble import IsolationForest

    model = IsolationForest(contamination=0.05, random_state=42, n_estimators=100)
    model.fit(X)

    predictions = model.predict(X)
    scores = model.decision_function(X)

    # Update transaction records
    for i, txn in enumerate(transactions):
        txn.is_anomaly = bool(predictions[i] == -1)
        txn.anomaly_score = float(scores[i])

    db.commit()


def get_anomalies(user_id: int, db: Session) -> dict:
    """
    Return anomaly detection results for the user.
    Re-runs detection if needed and returns flagged transactions.
    """
    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .all()
    )

    if len(transactions) < 10:
        return {"sufficient_data": False, "anomalies": [], "total_transactions": len(transactions)}

    # Check if anomaly detection has been run (if any have non-zero scores)
    has_scores = any(t.anomaly_score != 0.0 for t in transactions)
    if not has_scores:
        detect_anomalies(user_id, db)
        # Re-fetch after update
        transactions = (
            db.query(Transaction)
            .filter(Transaction.user_id == user_id)
            .all()
        )

    anomalies = []
    for txn in transactions:
        if txn.is_anomaly:
            anomalies.append({
                "id": txn.id,
                "amount": float(txn.amount),
                "type": txn.type,
                "note": txn.note,
                "date": str(txn.date),
                "category_id": txn.category_id,
                "account_id": txn.account_id,
                "anomaly_score": txn.anomaly_score,
            })

    return {
        "sufficient_data": True,
        "anomalies": anomalies,
        "total_transactions": len(transactions),
    }
