from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CustomerBase(BaseModel):
    name: str
    phone: Optional[str] = None
    business_name: Optional[str] = None
    address: Optional[str] = None
    type: str  # retail, wholesale, distributor
    credit_limit: float = 0.0

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    business_name: Optional[str] = None
    address: Optional[str] = None
    type: Optional[str] = None
    credit_limit: Optional[float] = None
    is_active: Optional[bool] = None

class CustomerResponse(CustomerBase):
    id: int
    outstanding_balance: float
    created_at: datetime

    class Config:
        from_attributes = True
