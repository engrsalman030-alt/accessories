from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from .supplier import SupplierResponse

class LedgerBase(BaseModel):
    party_type: str
    party_id: int
    transaction_type: str
    reference_id: Optional[int] = None
    debit: float
    credit: float
    balance: float
    date: datetime
    description: Optional[str] = None

class LedgerResponse(LedgerBase):
    id: int

    class Config:
        from_attributes = True

class SupplierLedgerResponse(BaseModel):
    supplier: SupplierResponse
    ledger: List[LedgerResponse]
    opening_balance: float
    total: int
