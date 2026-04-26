from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from models.purchase import Purchase, PurchaseItem
from models.product import Product
from models.supplier import Supplier
from models.ledger import Ledger
from schemas.purchase import PurchaseCreate
from datetime import datetime

async def get_all_purchases(db: AsyncSession, skip: int = 0, limit: int = 100):
    query = select(Purchase).options(
        selectinload(Purchase.supplier),
        selectinload(Purchase.items).selectinload(PurchaseItem.product)
    ).order_by(Purchase.date.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

async def create_purchase(db: AsyncSession, purchase_data: PurchaseCreate):
    # 1. Calculate balance due
    balance_due = purchase_data.total_amount - purchase_data.amount_paid
    status = "paid" if balance_due <= 0 else ("partial" if purchase_data.amount_paid > 0 else "pending")
    
    # 2. Create Purchase record
    db_purchase = Purchase(
        supplier_id=purchase_data.supplier_id,
        subtotal=purchase_data.subtotal,
        discount=purchase_data.discount,
        total_amount=purchase_data.total_amount,
        amount_paid=purchase_data.amount_paid,
        balance_due=balance_due,
        payment_method=purchase_data.payment_method,
        status=status,
        notes=purchase_data.notes
    )
    db.add(db_purchase)
    await db.flush() # Get purchase ID
    
    # 3. Create Purchase Items and Update Stock
    for item in purchase_data.items:
        total_cost = item.quantity * item.unit_cost
        db_item = PurchaseItem(
            purchase_id=db_purchase.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_cost=item.unit_cost,
            total_cost=total_cost
        )
        db.add(db_item)
        
        # Update product stock and last cost
        stmt = update(Product).where(Product.id == item.product_id).values(
            stock_qty=Product.stock_qty + item.quantity,
            cost_price=item.unit_cost
        )
        await db.execute(stmt)
    
    # 4. Update Supplier Balance
    if balance_due > 0:
        stmt = update(Supplier).where(Supplier.id == purchase_data.supplier_id).values(
            outstanding_balance=Supplier.outstanding_balance + balance_due
        )
        await db.execute(stmt)
        
        # 5. Record in Ledger
        db_ledger = Ledger(
            party_type="supplier",
            party_id=purchase_data.supplier_id,
            transaction_type="purchase",
            reference_id=db_purchase.id,
            credit=balance_due, # Balance due is a liability (credit for supplier)
            description=f"Purchase #{db_purchase.id} - Total: {purchase_data.total_amount}"
        )
        db.add(db_ledger)
    
    await db.commit()
    
    # Re-fetch with relationships loaded
    query = select(Purchase).options(
        selectinload(Purchase.supplier),
        selectinload(Purchase.items).selectinload(PurchaseItem.product)
    ).where(Purchase.id == db_purchase.id)
    result = await db.execute(query)
    
    return result.scalar_one()
