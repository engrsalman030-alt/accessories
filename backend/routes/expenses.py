from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from database import get_db
from models.expense import Expense
from schemas.expense import ExpenseCreate, ExpenseResponse
from routes.auth import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])

from sqlalchemy.orm import selectinload

@router.get("/expenses", response_model=List[ExpenseResponse])
async def get_expenses(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Expense)
        .options(selectinload(Expense.category))
        .order_by(Expense.date.desc())
    )
    return result.scalars().all()

@router.post("/expenses", response_model=ExpenseResponse)
async def create_expense(expense: ExpenseCreate, db: AsyncSession = Depends(get_db)):
    new_expense = Expense(**expense.dict())
    if not new_expense.date:
        from datetime import datetime
        new_expense.date = datetime.utcnow()
    db.add(new_expense)
    await db.commit()
    await db.refresh(new_expense)
    return new_expense

@router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Expense).where(Expense.id == expense_id))
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    await db.delete(expense)
    await db.commit()
    return {"message": "Expense deleted"}
