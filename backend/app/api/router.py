"""API router — aggregates all route modules."""

from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.accounts import router as accounts_router
from app.api.routes.transactions import router as transactions_router
from app.api.routes.categories import router as categories_router
from app.api.routes.budgets import router as budgets_router
from app.api.routes.goals import router as goals_router
from app.api.routes.insights import router as insights_router
from app.api.routes.reports import router as reports_router

api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(accounts_router)
api_router.include_router(transactions_router)
api_router.include_router(categories_router)
api_router.include_router(budgets_router)
api_router.include_router(goals_router)
api_router.include_router(insights_router)
api_router.include_router(reports_router)
