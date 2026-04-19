"""Category SQLAlchemy model."""

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from app.db.session import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False)  # income / expense
    color = Column(String(20), default="#6366F1")
    icon = Column(String(50), default="tag")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
