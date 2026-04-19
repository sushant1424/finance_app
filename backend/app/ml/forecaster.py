"""Expense forecasting using Linear Regression per category."""

import numpy as np
from collections import defaultdict
from datetime import date

from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.transaction import Transaction


def forecast_expenses(user_id: int, db: Session) -> dict:
    """
    Forecast next month's expenses per category using Linear Regression.
    Aggregates monthly expense totals, fits a model per category.
    Returns historical data, predictions, MAE, and RMSE.
    Requires at least 3 months of data.
    """
    # Get all expense transactions grouped by month and category
    results = (
        db.query(
            extract("year", Transaction.date).label("year"),
            extract("month", Transaction.date).label("month"),
            Transaction.category_id,
            func.sum(Transaction.amount).label("total"),
        )
        .filter(
            Transaction.user_id == user_id,
            Transaction.type == "expense",
        )
        .group_by("year", "month", Transaction.category_id)
        .order_by("year", "month")
        .all()
    )

    if not results:
        return {"sufficient_data": False, "forecasts": [], "overall": None}

    # Organize by category
    category_data = defaultdict(list)
    all_months = set()

    for row in results:
        year, month, cat_id, total = int(row.year), int(row.month), row.category_id, float(row.total)
        month_key = year * 12 + month
        all_months.add(month_key)
        category_data[cat_id].append({"month_key": month_key, "year": year, "month": month, "total": total})

    unique_months = sorted(all_months)
    if len(unique_months) < 3:
        return {"sufficient_data": False, "forecasts": [], "overall": None}

    # Lazy import
    from sklearn.linear_model import LinearRegression
    from sklearn.metrics import mean_absolute_error, mean_squared_error

    # Determine next month
    today = date.today()
    next_month = today.month + 1
    next_year = today.year
    if next_month > 12:
        next_month = 1
        next_year += 1
    next_month_key = next_year * 12 + next_month

    # Get category names
    categories = db.query(Category).filter(Category.user_id == user_id, Category.type == "expense").all()
    cat_names = {c.id: {"name": c.name, "color": c.color, "icon": c.icon} for c in categories}

    forecasts = []
    overall_historical = defaultdict(float)
    overall_predicted = 0.0
    total_mae = 0.0
    total_rmse = 0.0
    forecast_count = 0

    for cat_id, data_points in category_data.items():
        if len(data_points) < 3:
            continue

        X = np.array([d["month_key"] for d in data_points]).reshape(-1, 1)
        y = np.array([d["total"] for d in data_points])

        model = LinearRegression()
        model.fit(X, y)

        # Predict next month
        predicted = max(0, float(model.predict(np.array([[next_month_key]]))[0]))

        # Calculate metrics using leave-one-out or simple train metrics
        y_pred = model.predict(X)
        mae = float(mean_absolute_error(y, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y, y_pred)))

        # Build historical for this category
        historical = []
        for d in data_points:
            historical.append({
                "year": d["year"],
                "month": d["month"],
                "total": d["total"],
            })
            overall_historical[f"{d['year']}-{d['month']:02d}"] += d["total"]

        cat_info = cat_names.get(cat_id, {"name": f"Category {cat_id}", "color": "#6366F1", "icon": "tag"})

        forecasts.append({
            "category_id": cat_id,
            "category_name": cat_info["name"],
            "category_color": cat_info["color"],
            "category_icon": cat_info["icon"],
            "historical": historical,
            "predicted_next_month": round(predicted, 2),
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
        })

        overall_predicted += predicted
        total_mae += mae
        total_rmse += rmse
        forecast_count += 1

    # Overall metrics
    avg_mae = round(total_mae / forecast_count, 2) if forecast_count > 0 else 0
    avg_rmse = round(total_rmse / forecast_count, 2) if forecast_count > 0 else 0

    # Build overall historical sorted
    overall_hist_list = [
        {"month": k, "total": round(v, 2)}
        for k, v in sorted(overall_historical.items())
    ]

    return {
        "sufficient_data": True,
        "forecasts": forecasts,
        "overall": {
            "predicted_next_month": round(overall_predicted, 2),
            "next_month": next_month,
            "next_year": next_year,
            "mae": avg_mae,
            "rmse": avg_rmse,
            "historical": overall_hist_list,
        },
    }
