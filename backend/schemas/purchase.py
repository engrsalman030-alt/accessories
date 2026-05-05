from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class PurchaseItemBase(BaseModel):
    product_id: int
    quantity: float
    unit_cost: float

class PurchaseItemCreate(PurchaseItemBase):
    serial_numbers: Optional[List[str]] = []

class PurchaseItemResponse(PurchaseItemBase):
    id: int
    total_cost: float
    product_name: Optional[str] = None
    serial_numbers: Optional[List[str]] = []
    
    class Config:
        from_attributes = True

class PurchaseBase(BaseModel):
    supplier_id: int
    subtotal: float = 0.0
    discount: float = 0.0
    discount_type: Optional[str] = "fixed"
    discount_value: Optional[float] = 0.0
    total_amount: float
    amount_paid: float = 0.0
    payment_method: Optional[str] = "cash"
    notes: Optional[str] = None

class PurchaseCreate(PurchaseBase):
    items: List[PurchaseItemCreate]

class PurchaseResponse(PurchaseBase):
    id: int
    balance_due: float
    status: str
    date: datetime
    supplier_name: Optional[str] = None
    items: List[PurchaseItemResponse] = []

    class Config:
        from_attributes = True
