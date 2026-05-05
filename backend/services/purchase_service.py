from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from sqlalchemy.orm import selectinload
from models.purchase import Purchase, PurchaseItem
from models.product import Product
from models.supplier import Supplier
from models.ledger import Ledger
from models.product_serial import ProductSerial
from schemas.purchase import PurchaseCreate
from datetime import datetime

async def get_all_purchases(db: AsyncSession, skip: int = 0, limit: int = 100):
    # Total count
    count_result = await db.execute(select(func.count()).select_from(Purchase))
    total_count = count_result.scalar()

    # Data
    query = select(Purchase).options(
        selectinload(Purchase.supplier),
        selectinload(Purchase.items).selectinload(PurchaseItem.product),
        selectinload(Purchase.items).selectinload(PurchaseItem.serials)
    ).order_by(Purchase.date.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    purchases = result.scalars().all()
    
    return purchases, total_count

async def create_purchase(db: AsyncSession, purchase_data: PurchaseCreate):
    # 1. Calculate balance due
    balance_due = purchase_data.total_amount - purchase_data.amount_paid
    status = "paid" if balance_due <= 0 else ("partial" if purchase_data.amount_paid > 0 else "pending")
    
    # 2. Create Purchase record
    db_purchase = Purchase(
        supplier_id=purchase_data.supplier_id,
        subtotal=purchase_data.subtotal,
        discount=purchase_data.discount,
        discount_type=purchase_data.discount_type or "fixed",
        discount_value=purchase_data.discount_value or 0.0,
        total_amount=purchase_data.total_amount,
        amount_paid=purchase_data.amount_paid,
        balance_due=balance_due,
        payment_method=purchase_data.payment_method,
        status=status,
        notes=purchase_data.notes
    )
    db.add(db_purchase)
    await db.flush() # Get purchase ID
    
    # 3. Create Purchase Items, Serial Numbers, and Update Stock
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
        await db.flush()  # Get item ID for serial linkage
        
        # Save serial numbers if provided
        if item.serial_numbers:
            for sn in item.serial_numbers:
                sn_clean = sn.strip()
                if sn_clean:
                    db_serial = ProductSerial(
                        product_id=item.product_id,
                        serial_number=sn_clean,
                        serial_type="serial",
                        purchase_item_id=db_item.id,
                        status="in_stock"
                    )
                    db.add(db_serial)
        
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
        selectinload(Purchase.items).selectinload(PurchaseItem.product),
        selectinload(Purchase.items).selectinload(PurchaseItem.serials)
    ).where(Purchase.id == db_purchase.id)
    result = await db.execute(query)
    
    return result.scalar_one()

async def delete_purchase(db: AsyncSession, purchase_id: int):
    # 1. Fetch purchase with items
    query = select(Purchase).options(selectinload(Purchase.items)).where(Purchase.id == purchase_id)
    result = await db.execute(query)
    purchase = result.scalar_one_or_none()
    
    if not purchase:
        return False
        
    # 2. Revert Stock (Decrease stock)
    for item in purchase.items:
        stmt = update(Product).where(Product.id == item.product_id).values(
            stock_qty=Product.stock_qty - item.quantity
        )
        await db.execute(stmt)
        
        # 3. Remove serial numbers associated with this purchase item
        from sqlalchemy import delete
        sn_stmt = delete(ProductSerial).where(ProductSerial.purchase_item_id == item.id)
        await db.execute(sn_stmt)
        
    # 4. Revert Supplier Balance (Decrease balance)
    if purchase.supplier_id and purchase.balance_due > 0:
        s_stmt = update(Supplier).where(Supplier.id == purchase.supplier_id).values(
            outstanding_balance=Supplier.outstanding_balance - purchase.balance_due
        )
        await db.execute(s_stmt)
        
    # 5. Remove Ledger Entries
    from models.ledger import Ledger
    l_stmt = select(Ledger).where(
        Ledger.party_type == "supplier",
        Ledger.party_id == purchase.supplier_id,
        Ledger.reference_id == purchase.id,
        Ledger.transaction_type == "purchase"
    )
    l_res = await db.execute(l_stmt)
    ledgers = l_res.scalars().all()
    for l in ledgers:
        await db.delete(l)
        
    # 6. Delete Purchase
    await db.delete(purchase)
    await db.commit()
    return True

async def update_purchase(db: AsyncSession, purchase_id: int, purchase_data: PurchaseCreate):
    # 1. Fetch old purchase
    query = select(Purchase).options(selectinload(Purchase.items)).where(Purchase.id == purchase_id)
    result = await db.execute(query)
    old_purchase = result.scalar_one_or_none()
    
    if not old_purchase:
        return None
        
    # 2. Revert Old State
    for item in old_purchase.items:
        # Revert Stock
        await db.execute(
            update(Product).where(Product.id == item.product_id).values(
                stock_qty=Product.stock_qty - item.quantity
            )
        )
        # Delete serials created by this purchase
        await db.execute(
            delete(ProductSerial).where(ProductSerial.purchase_item_id == item.id)
        )
        
    # Revert Supplier Balance
    if old_purchase.supplier_id and old_purchase.balance_due > 0:
        await db.execute(
            update(Supplier).where(Supplier.id == old_purchase.supplier_id).values(
                outstanding_balance=Supplier.outstanding_balance - old_purchase.balance_due
            )
        )
        
    # Remove Ledger
    from models.ledger import Ledger
    await db.execute(
        delete(Ledger).where(
            Ledger.party_type == "supplier",
            Ledger.party_id == old_purchase.supplier_id,
            Ledger.reference_id == old_purchase.id,
            Ledger.transaction_type == "purchase"
        )
    )
    
    # Delete old items
    for item in old_purchase.items:
        await db.delete(item)
    await db.flush()
    
    # 3. Apply New State
    balance_due = purchase_data.total_amount - purchase_data.amount_paid
    
    old_purchase.supplier_id = purchase_data.supplier_id
    old_purchase.subtotal = purchase_data.subtotal
    old_purchase.discount = purchase_data.discount
    old_purchase.discount_type = purchase_data.discount_type or "fixed"
    old_purchase.discount_value = purchase_data.discount_value or 0.0
    old_purchase.total_amount = purchase_data.total_amount
    old_purchase.amount_paid = purchase_data.amount_paid
    old_purchase.balance_due = balance_due
    old_purchase.payment_method = purchase_data.payment_method
    old_purchase.notes = purchase_data.notes
    old_purchase.updated_at = datetime.utcnow()
    
    for item in purchase_data.items:
        db_item = PurchaseItem(
            purchase_id=old_purchase.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_cost=item.unit_cost,
            total_cost=item.quantity * item.unit_cost
        )
        db.add(db_item)
        await db.flush()
        
        # Create serials
        if item.serial_numbers:
            for sn in item.serial_numbers:
                sn_clean = sn.strip()
                if sn_clean:
                    db_serial = ProductSerial(
                        product_id=item.product_id,
                        purchase_item_id=db_item.id,
                        serial_number=sn_clean,
                        status="in_stock"
                    )
                    db.add(db_serial)
        
        # Update Product Stock
        await db.execute(
            update(Product).where(Product.id == item.product_id).values(
                stock_qty=Product.stock_qty + item.quantity,
                cost_price=item.unit_cost # Update cost price to latest
            )
        )
        
    # 4. New Supplier Balance
    if purchase_data.supplier_id and balance_due > 0:
        await db.execute(
            update(Supplier).where(Supplier.id == purchase_data.supplier_id).values(
                outstanding_balance=Supplier.outstanding_balance + balance_due
            )
        )
        
        # Ledger Entry
        db_ledger = Ledger(
            party_type="supplier",
            party_id=purchase_data.supplier_id,
            transaction_type="purchase",
            reference_id=old_purchase.id,
            credit=balance_due,
            description=f"Purchase #{old_purchase.id} (Updated) - Total: {purchase_data.total_amount}"
        )
        db.add(db_ledger)
        
    await db.commit()
    
    # Re-fetch
    result = await db.execute(
        select(Purchase).options(
            selectinload(Purchase.supplier),
            selectinload(Purchase.items).selectinload(PurchaseItem.product),
            selectinload(Purchase.items).selectinload(PurchaseItem.serials)
        ).where(Purchase.id == old_purchase.id)
    )
    return result.scalar_one()
