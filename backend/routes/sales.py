from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from database import get_db
from routes.auth import get_current_user
from services.sale_service import get_all_sales, create_sale, delete_sale, update_sale
from schemas.sale import SaleResponse, SaleCreate, SaleItemResponse
from models.product_serial import ProductSerial

router = APIRouter(dependencies=[Depends(get_current_user)])

async def serialize_sale(sale, db: AsyncSession):
    """Convert a Sale ORM object to a dict with customer and product names."""
    items = []
    for item in sale.items:
        # Fetch serial numbers for this sale item
        serial_query = select(ProductSerial).where(ProductSerial.sale_item_id == item.id)
        serial_result = await db.execute(serial_query)
        serials = [s.serial_number for s in serial_result.scalars().all()]
        
        items.append(SaleItemResponse(
            id=item.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item.total_price,
            product_name=item.product.name if item.product else "Unknown Product",
            serial_numbers=serials
        ))
    
    return SaleResponse(
        id=sale.id,
        customer_id=sale.customer_id,
        customer_type=sale.customer_type,
        customer_name=sale.customer.name if sale.customer else "Walk-in",
        subtotal=sale.subtotal,
        discount=sale.discount,
        discount_type=sale.discount_type or "fixed",
        discount_value=sale.discount_value or 0.0,
        total_amount=sale.total_amount,
        amount_paid=sale.amount_paid,
        balance_due=sale.balance_due,
        status=sale.status,
        date=sale.date,
        payment_method=sale.payment_method,
        notes=sale.notes,
        items=items
    )

@router.get("/sales")
async def read_sales(
    page: int = Query(1, ge=1),
    size: int = Query(25, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    skip = (page - 1) * size
    sales, total = await get_all_sales(db, skip=skip, limit=size)
    items = [await serialize_sale(s, db) for s in sales]
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size
    }

@router.post("/sales")
async def create_new_sale(sale: SaleCreate, db: AsyncSession = Depends(get_db)):
    try:
        result = await create_sale(db, sale)
        return await serialize_sale(result, db)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/sales/{sale_id}")
async def update_existing_sale(sale_id: int, sale_data: SaleCreate, db: AsyncSession = Depends(get_db)):
    try:
        updated = await update_sale(db, sale_id, sale_data)
        if not updated:
            raise HTTPException(status_code=404, detail="Sale not found")
        return await serialize_sale(updated, db)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/sales/{sale_id}")
async def delete_existing_sale(sale_id: int, db: AsyncSession = Depends(get_db)):
    success = await delete_sale(db, sale_id)
    if not success:
        raise HTTPException(status_code=404, detail="Sale not found")
    return {"message": "Sale deleted successfully"}

