from pydantic import BaseModel, EmailStr
from typing import Optional
from decimal import Decimal
from datetime import datetime

class SupplierBase(BaseModel):
    name: str
    phone: Optional[str] = None
    company: Optional[str] = None
    address: Optional[str] = None
    email: Optional[EmailStr] = None
    notes: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    address: Optional[str] = None
    email: Optional[EmailStr] = None
    notes: Optional[str] = None

class SupplierResponse(SupplierBase):
    id: int
    outstanding_balance: Decimal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SupplierListResponse(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    company: Optional[str]
    outstanding_balance: Decimal
    created_at: datetime

    class Config:
        from_attributes = True

class SupplierSummary(BaseModel):
    total_suppliers: int
    total_outstanding: Decimal
    suppliers_with_balance: int