from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from sqlalchemy.orm import selectinload
from models.sale import Sale, SaleItem
from models.product import Product
from models.customer import Customer
from models.ledger import Ledger
from models.product_serial import ProductSerial
from schemas.sale import SaleCreate
from datetime import datetime

async def get_all_sales(db: AsyncSession, skip: int = 0, limit: int = 100):
    # Total count
    count_result = await db.execute(select(func.count()).select_from(Sale))
    total_count = count_result.scalar()

    # Data
    query = select(Sale).options(
        selectinload(Sale.customer),
        selectinload(Sale.items).selectinload(SaleItem.product),
        selectinload(Sale.items).selectinload(SaleItem.serials)
    ).order_by(Sale.date.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    sales = result.scalars().all()
    
    return sales, total_count

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
        discount_type=sale_data.discount_type or "fixed",
        discount_value=sale_data.discount_value or 0.0,
        total_amount=sale_data.total_amount,
        amount_paid=sale_data.amount_paid,
        balance_due=balance_due,
        payment_method=sale_data.payment_method,
        status=status,
        notes=sale_data.notes
    )
    db.add(db_sale)
    await db.flush() # Get sale ID
    
    # 3. Create Sale Items, Mark Serials, and Update Stock
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
        await db.flush()  # Get item ID for serial linkage
        
        # Mark serial numbers as sold if provided
        if item.serial_numbers:
            for sn in item.serial_numbers:
                sn_clean = sn.strip()
                if sn_clean:
                    # Try to find an existing in-stock serial
                    serial_query = select(ProductSerial).where(
                        ProductSerial.product_id == item.product_id,
                        ProductSerial.serial_number == sn_clean,
                        ProductSerial.status == "in_stock"
                    )
                    serial_result = await db.execute(serial_query)
                    existing = serial_result.scalar_one_or_none()
                    
                    if existing:
                        existing.sale_item_id = db_item.id
                        existing.status = "sold"
                    else:
                        # Create a new serial record marked as sold (for items added without purchase tracking)
                        db_serial = ProductSerial(
                            product_id=item.product_id,
                            serial_number=sn_clean,
                            serial_type="serial",
                            sale_item_id=db_item.id,
                            status="sold"
                        )
                        db.add(db_serial)
        
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
            selectinload(Sale.items).selectinload(SaleItem.product),
            selectinload(Sale.items).selectinload(SaleItem.serials)
        ).where(Sale.id == db_sale.id)
    )
    return result.scalar_one()

async def delete_sale(db: AsyncSession, sale_id: int):
    # 1. Fetch sale with items
    query = select(Sale).options(selectinload(Sale.items)).where(Sale.id == sale_id)
    result = await db.execute(query)
    sale = result.scalar_one_or_none()
    
    if not sale:
        return False
    
    # 2. Revert Stock (Increase stock back)
    for item in sale.items:
        stmt = update(Product).where(Product.id == item.product_id).values(
            stock_qty=Product.stock_qty + item.quantity
        )
        await db.execute(stmt)
        
        # 3. Mark serials as in_stock again
        sn_stmt = update(ProductSerial).where(
            ProductSerial.sale_item_id == item.id
        ).values(
            status="in_stock",
            sale_item_id=None
        )
        await db.execute(sn_stmt)
        
    # 4. Revert Customer Balance (Decrease balance)
    if sale.customer_id and sale.balance_due > 0:
        c_stmt = update(Customer).where(Customer.id == sale.customer_id).values(
            outstanding_balance=Customer.outstanding_balance - sale.balance_due
        )
        await db.execute(c_stmt)
        
    # 5. Remove Ledger Entries
    from models.ledger import Ledger
    l_stmt = select(Ledger).where(
        Ledger.party_type == "customer",
        Ledger.party_id == sale.customer_id,
        Ledger.reference_id == sale.id,
        Ledger.transaction_type == "sale"
    )
    l_res = await db.execute(l_stmt)
    ledgers = l_res.scalars().all()
    for l in ledgers:
        await db.delete(l)
        
    # 6. Delete Sale (Cascades to SaleItems usually, but we check if manual is needed)
    await db.delete(sale)
    await db.commit()
    return True

async def update_sale(db: AsyncSession, sale_id: int, sale_data: SaleCreate):
    # 1. Fetch old sale
    query = select(Sale).options(selectinload(Sale.items)).where(Sale.id == sale_id)
    result = await db.execute(query)
    old_sale = result.scalar_one_or_none()
    
    if not old_sale:
        return None
        
    # 2. Revert Old State
    # Stock
    for item in old_sale.items:
        await db.execute(
            update(Product).where(Product.id == item.product_id).values(
                stock_qty=Product.stock_qty + item.quantity
            )
        )
        # Revert serials
        await db.execute(
            update(ProductSerial).where(ProductSerial.sale_item_id == item.id).values(
                status="in_stock",
                sale_item_id=None
            )
        )
    
    # Customer Balance
    if old_sale.customer_id and old_sale.balance_due > 0:
        await db.execute(
            update(Customer).where(Customer.id == old_sale.customer_id).values(
                outstanding_balance=Customer.outstanding_balance - old_sale.balance_due
            )
        )
        
    # Remove old Ledger
    from models.ledger import Ledger
    await db.execute(
        delete(Ledger).where(
            Ledger.party_type == "customer",
            Ledger.party_id == old_sale.customer_id,
            Ledger.reference_id == old_sale.id,
            Ledger.transaction_type == "sale"
        )
    )
    
    # Delete old items
    for item in old_sale.items:
        await db.delete(item)
    await db.flush()
    
    # 3. Apply New State (similar to create_sale but on existing sale object)
    balance_due = sale_data.total_amount - sale_data.amount_paid
    
    old_sale.customer_id = sale_data.customer_id
    old_sale.customer_type = sale_data.customer_type
    old_sale.subtotal = sale_data.subtotal
    old_sale.discount = sale_data.discount
    old_sale.discount_type = sale_data.discount_type or "fixed"
    old_sale.discount_value = sale_data.discount_value or 0.0
    old_sale.total_amount = sale_data.total_amount
    old_sale.amount_paid = sale_data.amount_paid
    old_sale.balance_due = balance_due
    old_sale.payment_method = sale_data.payment_method
    old_sale.notes = sale_data.notes
    old_sale.updated_at = datetime.utcnow()
    
    # Create New Sale Items
    for item in sale_data.items:
        product_res = await db.execute(select(Product).where(Product.id == item.product_id))
        product = product_res.scalar_one()
        
        total_price = item.quantity * item.unit_price
        db_item = SaleItem(
            sale_id=old_sale.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            unit_cost=product.cost_price,
            total_price=total_price
        )
        db.add(db_item)
        await db.flush()
        
        # Mark serials
        if item.serial_numbers:
            for sn in item.serial_numbers:
                sn_clean = sn.strip()
                if sn_clean:
                    serial_query = select(ProductSerial).where(
                        ProductSerial.product_id == item.product_id,
                        ProductSerial.serial_number == sn_clean,
                        ProductSerial.status == "in_stock"
                    )
                    serial_result = await db.execute(serial_query)
                    existing = serial_result.scalar_one_or_none()
                    if existing:
                        existing.sale_item_id = db_item.id
                        existing.status = "sold"
        
        # Update Stock
        await db.execute(
            update(Product).where(Product.id == item.product_id).values(
                stock_qty=Product.stock_qty - item.quantity
            )
        )
        
    # 4. New Customer Balance
    if sale_data.customer_id and balance_due > 0:
        await db.execute(
            update(Customer).where(Customer.id == sale_data.customer_id).values(
                outstanding_balance=Customer.outstanding_balance + balance_due
            )
        )
        
        # Record in Ledger
        db_ledger = Ledger(
            party_type="customer",
            party_id=sale_data.customer_id,
            transaction_type="sale",
            reference_id=old_sale.id,
            debit=balance_due,
            description=f"Sale #{old_sale.id} (Updated) - Total: {sale_data.total_amount}"
        )
        db.add(db_ledger)
        
    await db.commit()
    
    # Re-fetch
    result = await db.execute(
        select(Sale).options(
            selectinload(Sale.customer),
            selectinload(Sale.items).selectinload(SaleItem.product),
            selectinload(Sale.items).selectinload(SaleItem.serials)
        ).where(Sale.id == old_sale.id)
    )
    return result.scalar_one()
