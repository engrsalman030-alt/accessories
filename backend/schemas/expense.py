from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ExpenseCategoryResponse(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class ExpenseBase(BaseModel):
    description: str
    amount: float
    payment_method: Optional[str] = "cash"
    notes: Optional[str] = None
    date: Optional[datetime] = None

class ExpenseCreate(ExpenseBase):
    category_id: int

class ExpenseResponse(ExpenseBase):
    id: int
    category_id: int
    category: Optional[ExpenseCategoryResponse] = None
    created_at: datetime

    class Config:
        from_attributes = True
