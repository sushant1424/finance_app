"""Seed script — creates demo user with accounts, categories, transactions, budgets, goals."""

import random
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.db.base import *  # noqa — import all models
from app.models.user import User
from app.models.account import Account
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.models.goal import Goal


def seed():
    """Populate database with demo data."""
    db = SessionLocal()

    try:
        # Check if demo user already exists
        existing = db.query(User).filter(User.email == "demo@fintrack.com").first()
        if existing:
            print("Demo user already exists. Skipping seed.")
            return

        print("Seeding database...")

        # --- Demo User ---
        user = User(
            name="Demo User",
            email="demo@fintrack.com",
            hashed_password=hash_password("demo1234"),
            currency="NPR",
        )
        db.add(user)
        db.flush()

        # --- Accounts ---
        accounts_data = [
            {"name": "NIC Asia Bank", "type": "bank", "balance": Decimal("150000.00"), "color": "#3B82F6", "icon": "landmark"},
            {"name": "Cash Wallet", "type": "cash", "balance": Decimal("25000.00"), "color": "#10B981", "icon": "banknote"},
            {"name": "eSewa", "type": "wallet", "balance": Decimal("12000.00"), "color": "#8B5CF6", "icon": "smartphone"},
        ]
        accounts = []
        for acc_data in accounts_data:
            acc = Account(user_id=user.id, **acc_data)
            db.add(acc)
            accounts.append(acc)
        db.flush()

        # --- Categories ---
        categories_data = [
            # Income categories
            {"name": "Salary", "type": "income", "color": "#10B981", "icon": "briefcase"},
            {"name": "Freelance", "type": "income", "color": "#06B6D4", "icon": "laptop"},
            {"name": "Investment Returns", "type": "income", "color": "#8B5CF6", "icon": "trending-up"},
            {"name": "Other Income", "type": "income", "color": "#F59E0B", "icon": "plus-circle"},
            # Expense categories
            {"name": "Food & Dining", "type": "expense", "color": "#EF4444", "icon": "utensils"},
            {"name": "Transportation", "type": "expense", "color": "#F97316", "icon": "car"},
            {"name": "Shopping", "type": "expense", "color": "#EC4899", "icon": "shopping-bag"},
            {"name": "Utilities", "type": "expense", "color": "#6366F1", "icon": "zap"},
        ]
        categories = []
        for cat_data in categories_data:
            cat = Category(user_id=user.id, **cat_data)
            db.add(cat)
            categories.append(cat)
        db.flush()

        income_cats = [c for c in categories if c.type == "income"]
        expense_cats = [c for c in categories if c.type == "expense"]

        # --- Transactions (6 months) ---
        random.seed(42)
        today = date.today()
        transactions = []

        for month_offset in range(6, 0, -1):
            month_date = today.replace(day=1) - timedelta(days=month_offset * 30)
            year = month_date.year
            month = month_date.month

            # Monthly salary (1st of month)
            salary_amount = Decimal(str(random.randint(45000, 55000)))
            txn = Transaction(
                user_id=user.id,
                account_id=accounts[0].id,
                category_id=income_cats[0].id,
                amount=salary_amount,
                type="income",
                note="Monthly salary",
                date=date(year, month, 1),
                created_at=datetime(year, month, 1, 9, 0, tzinfo=timezone.utc),
            )
            db.add(txn)
            transactions.append(txn)

            # Freelance income (random, 1-2 per month)
            for _ in range(random.randint(1, 2)):
                day = random.randint(1, 28)
                amount = Decimal(str(random.randint(5000, 20000)))
                txn = Transaction(
                    user_id=user.id,
                    account_id=random.choice([accounts[0].id, accounts[2].id]),
                    category_id=income_cats[1].id,
                    amount=amount,
                    type="income",
                    note=random.choice(["Web design project", "Logo design", "Consulting fee", "Content writing"]),
                    date=date(year, month, day),
                    created_at=datetime(year, month, day, random.randint(8, 20), 0, tzinfo=timezone.utc),
                )
                db.add(txn)
                transactions.append(txn)

            # Daily expenses (15-25 per month)
            for _ in range(random.randint(15, 25)):
                day = random.randint(1, 28)
                cat = random.choice(expense_cats)
                account = random.choice(accounts)

                if cat.name == "Food & Dining":
                    amount = Decimal(str(random.randint(150, 2500)))
                    notes = ["Lunch at cafe", "Groceries", "Dinner out", "Morning coffee", "Snacks", "Restaurant"]
                elif cat.name == "Transportation":
                    amount = Decimal(str(random.randint(100, 3000)))
                    notes = ["Bus fare", "Taxi ride", "Fuel", "Bike maintenance", "Ride share"]
                elif cat.name == "Shopping":
                    amount = Decimal(str(random.randint(500, 15000)))
                    notes = ["Clothes", "Electronics", "Books", "Home supplies", "Online purchase"]
                else:  # Utilities
                    amount = Decimal(str(random.randint(500, 5000)))
                    notes = ["Electricity bill", "Internet bill", "Phone recharge", "Water bill", "Netflix"]

                txn = Transaction(
                    user_id=user.id,
                    account_id=account.id,
                    category_id=cat.id,
                    amount=amount,
                    type="expense",
                    note=random.choice(notes),
                    date=date(year, month, day),
                    created_at=datetime(year, month, day, random.randint(6, 23), random.randint(0, 59), tzinfo=timezone.utc),
                )
                db.add(txn)
                transactions.append(txn)

        # Add one anomalous transaction (very high amount)
        anomaly_date = today - timedelta(days=15)
        txn = Transaction(
            user_id=user.id,
            account_id=accounts[0].id,
            category_id=expense_cats[2].id,  # Shopping
            amount=Decimal("95000.00"),
            type="expense",
            note="Unusual large purchase",
            date=anomaly_date,
            created_at=datetime(anomaly_date.year, anomaly_date.month, anomaly_date.day, 3, 30, tzinfo=timezone.utc),
        )
        db.add(txn)
        transactions.append(txn)

        db.flush()

        # --- Budgets (current month) ---
        current_month = today.month
        current_year = today.year

        budgets_data = [
            {"category_id": expense_cats[0].id, "amount_limit": Decimal("15000.00")},
            {"category_id": expense_cats[1].id, "amount_limit": Decimal("8000.00")},
            {"category_id": expense_cats[2].id, "amount_limit": Decimal("20000.00")},
        ]
        for b_data in budgets_data:
            budget = Budget(
                user_id=user.id,
                month=current_month,
                year=current_year,
                **b_data,
            )
            db.add(budget)

        # --- Goals ---
        goals_data = [
            {
                "name": "Emergency Fund",
                "target_amount": Decimal("500000.00"),
                "current_amount": Decimal("175000.00"),
                "deadline": today + timedelta(days=365),
            },
            {
                "name": "New Laptop",
                "target_amount": Decimal("150000.00"),
                "current_amount": Decimal("45000.00"),
                "deadline": today + timedelta(days=180),
            },
        ]
        for g_data in goals_data:
            goal = Goal(user_id=user.id, **g_data)
            db.add(goal)

        db.commit()
        print(f"Seeded: 1 user, {len(accounts)} accounts, {len(categories)} categories, "
              f"{len(transactions)} transactions, {len(budgets_data)} budgets, {len(goals_data)} goals")

        # Run anomaly detection on seeded data
        try:
            from app.ml.anomaly_detector import detect_anomalies
            detect_anomalies(user.id, db)
            print("Anomaly detection completed on seeded data.")
        except Exception as e:
            print(f"Anomaly detection skipped: {e}")

    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
