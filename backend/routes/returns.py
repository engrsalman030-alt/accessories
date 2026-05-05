from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from routes.auth import get_current_user
from services.return_service import (
    process_sale_return, 
    process_purchase_return,
    get_all_sale_returns,
    get_all_purchase_returns,
    update_sale_return,
    update_purchase_return
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
    serial_numbers: List[str] = []

class ReturnCreate(BaseModel):
    reference_id: int = None # sale_id or purchase_id
    customer_id: int = None
    supplier_id: int = None
    items: List[ReturnItem]
    reason: str = ""

class ReturnUpdate(BaseModel):
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

@router.put("/sale/{return_id}")
async def edit_sale_return(return_id: int, data: ReturnUpdate, db: AsyncSession = Depends(get_db)):
    updated = await update_sale_return(db, return_id, data.reason)
    if not updated:
        raise HTTPException(status_code=404, detail="Return not found")
    return {"message": "Sales return updated successfully"}

@router.put("/purchase/{return_id}")
async def edit_purchase_return(return_id: int, data: ReturnUpdate, db: AsyncSession = Depends(get_db)):
    updated = await update_purchase_return(db, return_id, data.reason)
    if not updated:
        raise HTTPException(status_code=404, detail="Return not found")
    return {"message": "Purchase return updated successfully"}

@router.delete("/sale/{return_id}")
async def delete_sr(return_id: int, db: AsyncSession = Depends(get_db)):
    from services.return_service import delete_sale_return
    success = await delete_sale_return(db, return_id)
    if not success:
        raise HTTPException(status_code=404, detail="Return not found")
    return {"message": "Sales return deleted successfully"}

@router.delete("/purchase/{return_id}")
async def delete_pr(return_id: int, db: AsyncSession = Depends(get_db)):
    from services.return_service import delete_purchase_return
    success = await delete_purchase_return(db, return_id)
    if not success:
        raise HTTPException(status_code=404, detail="Return not found")
    return {"message": "Purchase return deleted successfully"}

