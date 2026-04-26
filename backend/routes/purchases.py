from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from database import get_db
from routes.auth import get_current_user
from services.purchase_service import get_all_purchases, create_purchase
from schemas.purchase import PurchaseResponse, PurchaseCreate, PurchaseItemResponse

router = APIRouter(dependencies=[Depends(get_current_user)])

def serialize_purchase(purchase):
    """Convert a Purchase ORM object to a PurchaseResponse with supplier and product names."""
    items = []
    for item in purchase.items:
        items.append(PurchaseItemResponse(
            id=item.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_cost=item.unit_cost,
            total_cost=item.total_cost,
            product_name=item.product.name if item.product else "Unknown Product"
        ))
    
    return PurchaseResponse(
        id=purchase.id,
        supplier_id=purchase.supplier_id,
        supplier_name=purchase.supplier.name if purchase.supplier else "Unknown Supplier",
        total_amount=purchase.total_amount,
        amount_paid=purchase.amount_paid,
        balance_due=purchase.balance_due,
        status=purchase.status,
        date=purchase.date,
        payment_method=purchase.payment_method,
        notes=purchase.notes,
        items=items
    )

@router.get("/purchases")
async def read_purchases(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    purchases = await get_all_purchases(db, skip=skip, limit=limit)
    return [serialize_purchase(p) for p in purchases]

@router.post("/purchases")
async def create_new_purchase(purchase: PurchaseCreate, db: AsyncSession = Depends(get_db)):
    try:
        result = await create_purchase(db, purchase)
        return serialize_purchase(result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
