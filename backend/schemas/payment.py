from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal

class PaymentCreate(BaseModel):
    party_type: str  # 'supplier' or 'customer'
    party_id: int
    amount: float
    method: str
    reference_note: Optional[str] = None
    date: datetime

class PaymentResponse(BaseModel):
    party_type: str
    party_id: int
    amount: float
    method: str
    reference_note: Optional[str] = None
    date: datetime
    id: int
    created_at: datetime

    class Config:
        from_attributes = True