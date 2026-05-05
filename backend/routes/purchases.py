from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from database import get_db
from routes.auth import get_current_user
from services.purchase_service import get_all_purchases, create_purchase, delete_purchase, update_purchase
from schemas.purchase import PurchaseResponse, PurchaseCreate, PurchaseItemResponse
from models.product_serial import ProductSerial

router = APIRouter(dependencies=[Depends(get_current_user)])

async def serialize_purchase(purchase, db: AsyncSession):
    """Convert a Purchase ORM object to a PurchaseResponse with supplier and product names."""
    items = []
    for item in purchase.items:
        # Fetch serial numbers for this purchase item
        serial_query = select(ProductSerial).where(ProductSerial.purchase_item_id == item.id)
        serial_result = await db.execute(serial_query)
        serials = [s.serial_number for s in serial_result.scalars().all()]
        
        items.append(PurchaseItemResponse(
            id=item.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_cost=item.unit_cost,
            total_cost=item.total_cost,
            product_name=item.product.name if item.product else "Unknown Product",
            serial_numbers=serials
        ))
    
    return PurchaseResponse(
        id=purchase.id,
        supplier_id=purchase.supplier_id,
        supplier_name=purchase.supplier.name if purchase.supplier else "Unknown Supplier",
        subtotal=purchase.subtotal or 0.0,
        discount=purchase.discount or 0.0,
        discount_type=purchase.discount_type or "fixed",
        discount_value=purchase.discount_value or 0.0,
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
async def read_purchases(
    page: int = Query(1, ge=1),
    size: int = Query(25, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    skip = (page - 1) * size
    purchases, total = await get_all_purchases(db, skip=skip, limit=size)
    items = [await serialize_purchase(p, db) for p in purchases]
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size
    }

@router.post("/purchases")
async def create_new_purchase(purchase: PurchaseCreate, db: AsyncSession = Depends(get_db)):
    try:
        result = await create_purchase(db, purchase)
        return await serialize_purchase(result, db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/purchases/{purchase_id}")
async def update_existing_purchase(purchase_id: int, purchase_data: PurchaseCreate, db: AsyncSession = Depends(get_db)):
    try:
        updated = await update_purchase(db, purchase_id, purchase_data)
        if not updated:
            raise HTTPException(status_code=404, detail="Purchase not found")
        return await serialize_purchase(updated, db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/purchases/{purchase_id}")
async def delete_existing_purchase(purchase_id: int, db: AsyncSession = Depends(get_db)):
    success = await delete_purchase(db, purchase_id)
    if not success:
        raise HTTPException(status_code=404, detail="Purchase not found")
    return {"message": "Purchase deleted successfully"}
