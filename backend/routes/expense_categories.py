from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from database import get_db
from routes.auth import get_current_user
from pydantic import BaseModel
from models.expense import ExpenseCategory

router = APIRouter(dependencies=[Depends(get_current_user)])

from typing import List, Optional

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryResponse(CategoryBase):
    id: int
    class Config:
        from_attributes = True

@router.get("/expense-categories", response_model=List[CategoryResponse])
async def get_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ExpenseCategory).order_by(ExpenseCategory.name))
    return result.scalars().all()

@router.post("/expense-categories", response_model=CategoryResponse)
async def create_category(category: CategoryBase, db: AsyncSession = Depends(get_db)):
    # Check if exists
    existing = await db.execute(select(ExpenseCategory).where(ExpenseCategory.name == category.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Category already exists")
    
    db_cat = ExpenseCategory(**category.dict())
    db.add(db_cat)
    await db.commit()
    await db.refresh(db_cat)
    return db_cat

