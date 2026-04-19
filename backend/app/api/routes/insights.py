"""Insights routes — anomaly detection and expense forecasting."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.common import APIResponse
from app.ml.anomaly_detector import detect_anomalies, get_anomalies
from app.ml.forecaster import forecast_expenses

router = APIRouter(prefix="/insights", tags=["Insights"])


@router.get("/anomalies")
def list_anomalies(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get anomaly detection results for the current user."""
    result = get_anomalies(user.id, db)
    return APIResponse(data=result)


@router.get("/forecast")
def get_forecast(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get expense forecast for the current user."""
    result = forecast_expenses(user.id, db)
    return APIResponse(data=result)


@router.post("/forecast/refresh")
def refresh_forecast(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Re-run anomaly detection and return fresh forecast."""
    detect_anomalies(user.id, db)
    result = forecast_expenses(user.id, db)
    return APIResponse(data=result, message="Forecast refreshed")
