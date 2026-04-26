from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SaleItemBase(BaseModel):
    product_id: int
    quantity: float
    unit_price: float

class SaleItemCreate(SaleItemBase):
    pass

class SaleItemResponse(SaleItemBase):
    id: int
    total_price: float
    product_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class SaleBase(BaseModel):
    customer_id: Optional[int] = None
    customer_type: str  # retail, wholesale, distributor
    subtotal: float
    discount: float = 0.0
    total_amount: float
    amount_paid: float = 0.0
    payment_method: Optional[str] = "cash"
    notes: Optional[str] = None

class SaleCreate(SaleBase):
    items: List[SaleItemCreate]

class SaleResponse(SaleBase):
    id: int
    balance_due: float
    status: str
    date: datetime
    customer_name: Optional[str] = None
    items: List[SaleItemResponse] = []

    class Config:
        from_attributes = True
