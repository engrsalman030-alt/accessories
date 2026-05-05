from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from models.expense import Expense
from datetime import datetime, timedelta

async def get_expense_summary(db: AsyncSession):
    now = datetime.utcnow()
    
    # 1. Daily
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    daily_res = await db.execute(
        select(func.sum(Expense.amount)).where(Expense.date >= start_of_day)
    )
    daily_total = daily_res.scalar() or 0.0
    
    # 2. Weekly (Last 7 days)
    start_of_week = start_of_day - timedelta(days=7)
    weekly_res = await db.execute(
        select(func.sum(Expense.amount)).where(Expense.date >= start_of_week)
    )
    weekly_total = weekly_res.scalar() or 0.0
    
    # 3. Monthly
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_res = await db.execute(
        select(func.sum(Expense.amount)).where(Expense.date >= start_of_month)
    )
    monthly_total = monthly_res.scalar() or 0.0
    
    # 4. Yearly
    start_of_year = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    yearly_res = await db.execute(
        select(func.sum(Expense.amount)).where(Expense.date >= start_of_year)
    )
    yearly_total = yearly_res.scalar() or 0.0
    
    return {
        "daily": daily_total,
        "weekly": weekly_total,
        "monthly": monthly_total,
        "yearly": yearly_total
    }
