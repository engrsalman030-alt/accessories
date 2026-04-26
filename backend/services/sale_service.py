from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from models.sale import Sale, SaleItem
from models.product import Product
from models.customer import Customer
from models.ledger import Ledger
from schemas.sale import SaleCreate
from datetime import datetime

async def get_all_sales(db: AsyncSession, skip: int = 0, limit: int = 100):
    query = select(Sale).options(
        selectinload(Sale.customer),
        selectinload(Sale.items).selectinload(SaleItem.product)
    ).order_by(Sale.date.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

async def create_sale(db: AsyncSession, sale_data: SaleCreate):
    # 1. Calculate balance due
    balance_due = sale_data.total_amount - sale_data.amount_paid
    status = "completed"
    
    # 2. Create Sale record
    db_sale = Sale(
        customer_id=sale_data.customer_id,
        customer_type=sale_data.customer_type,
        subtotal=sale_data.subtotal,
        discount=sale_data.discount,
        total_amount=sale_data.total_amount,
        amount_paid=sale_data.amount_paid,
        balance_due=balance_due,
        payment_method=sale_data.payment_method,
        status=status,
        notes=sale_data.notes
    )
    db.add(db_sale)
    await db.flush() # Get sale ID
    
    # 3. Create Sale Items and Update Stock
    for item in sale_data.items:
        # Fetch current product to get cost_price
        product_res = await db.execute(select(Product).where(Product.id == item.product_id))
        product = product_res.scalar_one()
        
        total_price = item.quantity * item.unit_price
        db_item = SaleItem(
            sale_id=db_sale.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            unit_cost=product.cost_price,
            total_price=total_price
        )
        db.add(db_item)
        
        # Update product stock (decrease)
        stmt = update(Product).where(Product.id == item.product_id).values(
            stock_qty=Product.stock_qty - item.quantity
        )
        await db.execute(stmt)
    
    # 4. Update Customer Balance (if not walk-in)
    if sale_data.customer_id and balance_due > 0:
        stmt = update(Customer).where(Customer.id == sale_data.customer_id).values(
            outstanding_balance=Customer.outstanding_balance + balance_due
        )
        await db.execute(stmt)
        
        # 5. Record in Ledger
        db_ledger = Ledger(
            party_type="customer",
            party_id=sale_data.customer_id,
            transaction_type="sale",
            reference_id=db_sale.id,
            debit=balance_due, # Balance due is an asset (debit for customer)
            description=f"Sale #{db_sale.id} - Total: {sale_data.total_amount}"
        )
        db.add(db_ledger)
    
    await db.commit()
    
    # Re-fetch with relationships loaded
    result = await db.execute(
        select(Sale).options(
            selectinload(Sale.customer),
            selectinload(Sale.items).selectinload(SaleItem.product)
        ).where(Sale.id == db_sale.id)
    )
    return result.scalar_one()
