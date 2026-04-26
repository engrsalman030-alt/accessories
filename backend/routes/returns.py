from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from routes.auth import get_current_user
from services.return_service import (
    process_sale_return, 
    process_purchase_return,
    get_all_sale_returns,
    get_all_purchase_returns
)
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/returns", tags=["Returns"], dependencies=[Depends(get_current_user)])

class ReturnItem(BaseModel):
    product_id: int
    quantity: float
    unit_price: float = 0
    unit_cost: float = 0
    condition: str = "fine" # fine or damaged

class ReturnCreate(BaseModel):
    reference_id: int = None # sale_id or purchase_id
    customer_id: int = None
    supplier_id: int = None
    items: List[ReturnItem]
    reason: str = ""

@router.post("/sale")
async def create_sale_return(data: ReturnCreate, db: AsyncSession = Depends(get_db)):
    try:
        items_list = [item.dict() for item in data.items]
        return await process_sale_return(db, data.reference_id, data.customer_id, items_list, data.reason)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/purchase")
async def create_purchase_return(data: ReturnCreate, db: AsyncSession = Depends(get_db)):
    try:
        items_list = [item.dict() for item in data.items]
        return await process_purchase_return(db, data.reference_id, data.supplier_id, items_list, data.reason)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/sales")
async def list_sale_returns(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await get_all_sale_returns(db, skip, limit)

@router.get("/purchases")
async def list_purchase_returns(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await get_all_purchase_returns(db, skip, limit)
