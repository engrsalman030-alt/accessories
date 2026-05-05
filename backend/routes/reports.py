from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from routes.auth import get_current_user
from services.report_service import get_dashboard_summary, get_profit_loss
from services.customer_service import get_customer_ledger
from services.expense_service import get_expense_summary
from datetime import datetime, time
from typing import Optional

router = APIRouter(dependencies=[Depends(get_current_user)])

@router.get("/reports/summary")
async def read_dashboard_summary(db: AsyncSession = Depends(get_db)):
    return await get_dashboard_summary(db)

@router.get("/reports/expenses/summary")
async def read_expense_summary(db: AsyncSession = Depends(get_db)):
    return await get_expense_summary(db)

@router.get("/reports/profit-loss")
async def read_profit_loss(
    start_date: datetime,
    end_date: datetime,
    db: AsyncSession = Depends(get_db)
):
    # Adjust end_date to include the full day
    end_of_day = datetime.combine(end_date.date(), time(23, 59, 59))
    return await get_profit_loss(db, start_date, end_of_day)

@router.get("/ledger/customer/{customer_id}")
async def read_customer_ledger(
    customer_id: int,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    return await get_customer_ledger(db, customer_id, skip, limit)
