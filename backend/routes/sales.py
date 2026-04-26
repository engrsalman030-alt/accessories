from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from database import get_db
from routes.auth import get_current_user
from services.sale_service import get_all_sales, create_sale
from schemas.sale import SaleResponse, SaleCreate, SaleItemResponse

router = APIRouter(dependencies=[Depends(get_current_user)])

def serialize_sale(sale):
    """Convert a Sale ORM object to a dict with customer and product names."""
    items = []
    for item in sale.items:
        items.append(SaleItemResponse(
            id=item.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item.total_price,
            product_name=item.product.name if item.product else "Unknown Product"
        ))
    
    return SaleResponse(
        id=sale.id,
        customer_id=sale.customer_id,
        customer_type=sale.customer_type,
        customer_name=sale.customer.name if sale.customer else "Walk-in",
        subtotal=sale.subtotal,
        discount=sale.discount,
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
async def read_sales(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    sales = await get_all_sales(db, skip=skip, limit=limit)
    return [serialize_sale(s) for s in sales]

@router.post("/sales")
async def create_new_sale(sale: SaleCreate, db: AsyncSession = Depends(get_db)):
    try:
        result = await create_sale(db, sale)
        return serialize_sale(result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))
