from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from models.sale import Sale, SaleItem
from models.purchase import Purchase, PurchaseItem
from models.product import Product
from models.customer import Customer
from models.supplier import Supplier
from models.ledger import Ledger
from models.returns import SaleReturn, SaleReturnItem, PurchaseReturn, PurchaseReturnItem
from datetime import datetime

async def process_sale_return(db: AsyncSession, sale_id: int = None, customer_id: int = None, items_data: list = [], reason: str = ""):
    target_customer_id = customer_id
    
    if sale_id:
        query = select(Sale).where(Sale.id == sale_id)
        result = await db.execute(query)
        sale = result.scalar_one_or_none()
        if sale:
            target_customer_id = sale.customer_id

    total_refund = 0
    db_return = SaleReturn(
        sale_id=sale_id,
        customer_id=target_customer_id,
        reason=reason,
        total_refund_amount=0
    )
    db.add(db_return)
    await db.flush()
    
    for item in items_data:
        qty = float(item['quantity'])
        price = float(item['unit_price'])
        total_price = qty * price
        total_refund += total_price
        
        db_return_item = SaleReturnItem(
            return_id=db_return.id,
            product_id=item['product_id'],
            quantity=qty,
            unit_price=price,
            condition=item.get('condition', 'fine'),
            serial_numbers=",".join(item.get('serial_numbers', [])) if isinstance(item.get('serial_numbers'), list) else item.get('serial_numbers')
        )
        db.add(db_return_item)
        
        # Update serial statuses if provided
        if item.get('serial_numbers'):
            serials = item['serial_numbers'] if isinstance(item['serial_numbers'], list) else item['serial_numbers'].split(',')
            from models.product_serial import ProductSerial
            for sn in serials:
                if sn.strip():
                    stmt_sn = update(ProductSerial).where(
                        ProductSerial.product_id == item['product_id'],
                        ProductSerial.serial_number == sn.strip()
                    ).values(status="in_stock" if item.get('condition') == 'fine' else "returned")
                    await db.execute(stmt_sn)
        
        # Adjust Stock: Fine goes to stock_qty, Damaged goes to scrap_qty
        if item.get('condition') == 'damaged':
            stmt = update(Product).where(Product.id == item['product_id']).values(
                scrap_qty=Product.scrap_qty + qty
            )
        else:
            stmt = update(Product).where(Product.id == item['product_id']).values(
                stock_qty=Product.stock_qty + qty
            )
        await db.execute(stmt)
        
    db_return.total_refund_amount = total_refund
    
    if target_customer_id:
        # Decrease customer balance
        stmt = update(Customer).where(Customer.id == target_customer_id).values(
            outstanding_balance=Customer.outstanding_balance - total_refund
        )
        await db.execute(stmt)
        
        # Record in Ledger
        db_ledger = Ledger(
            party_type="customer",
            party_id=target_customer_id,
            transaction_type="sale_return",
            reference_id=db_return.id,
            credit=total_refund,
            description=f"Sales Return {f'for Sale #{sale_id}' if sale_id else ''} - Reason: {reason}"
        )
        db.add(db_ledger)
        
    await db.commit()
    return db_return

async def process_purchase_return(db: AsyncSession, purchase_id: int = None, supplier_id: int = None, items_data: list = [], reason: str = ""):
    target_supplier_id = supplier_id
    
    if purchase_id:
        query = select(Purchase).where(Purchase.id == purchase_id)
        result = await db.execute(query)
        purchase = result.scalar_one_or_none()
        if purchase:
            target_supplier_id = purchase.supplier_id

    total_refund = 0
    db_return = PurchaseReturn(
        purchase_id=purchase_id,
        supplier_id=target_supplier_id,
        reason=reason,
        total_refund_amount=0
    )
    db.add(db_return)
    await db.flush()
    
    for item in items_data:
        qty = float(item['quantity'])
        cost = float(item['unit_cost'])
        total_cost = qty * cost
        total_refund += total_cost
        
        db_return_item = PurchaseReturnItem(
            return_id=db_return.id,
            product_id=item['product_id'],
            quantity=qty,
            unit_cost=cost,
            condition=item.get('condition', 'fine'),
            serial_numbers=",".join(item.get('serial_numbers', [])) if isinstance(item.get('serial_numbers'), list) else item.get('serial_numbers')
        )
        db.add(db_return_item)
        
        # Update serial statuses if provided
        if item.get('serial_numbers'):
            serials = item['serial_numbers'] if isinstance(item['serial_numbers'], list) else item['serial_numbers'].split(',')
            from models.product_serial import ProductSerial
            for sn in serials:
                if sn.strip():
                    stmt_sn = update(ProductSerial).where(
                        ProductSerial.product_id == item['product_id'],
                        ProductSerial.serial_number == sn.strip()
                    ).values(status="returned")
                    await db.execute(stmt_sn)
        
        # Decrease stock/scrap based on condition
        if item.get('condition') == 'damaged':
            stmt = update(Product).where(Product.id == item['product_id']).values(
                scrap_qty=Product.scrap_qty - qty
            )
        else:
            stmt = update(Product).where(Product.id == item['product_id']).values(
                stock_qty=Product.stock_qty - qty
            )
        await db.execute(stmt)
        
    db_return.total_refund_amount = total_refund
    
    if target_supplier_id:
        # Decrease supplier balance
        stmt = update(Supplier).where(Supplier.id == target_supplier_id).values(
            outstanding_balance=Supplier.outstanding_balance - total_refund
        )
        await db.execute(stmt)
        
        # Record in Ledger
        db_ledger = Ledger(
            party_type="supplier",
            party_id=target_supplier_id,
            transaction_type="purchase_return",
            reference_id=db_return.id,
            debit=total_refund,
            description=f"Purchase Return {f'for Purchase #{purchase_id}' if purchase_id else ''} - Reason: {reason}"
        )
        db.add(db_ledger)
    
    await db.commit()
    return db_return

async def get_all_sale_returns(db: AsyncSession, skip: int = 0, limit: int = 100):
    query = select(SaleReturn).options(
        selectinload(SaleReturn.sale).selectinload(Sale.customer),
        selectinload(SaleReturn.customer),
        selectinload(SaleReturn.items).selectinload(SaleReturnItem.product)
    ).order_by(SaleReturn.date.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

async def get_all_purchase_returns(db: AsyncSession, skip: int = 0, limit: int = 100):
    query = select(PurchaseReturn).options(
        selectinload(PurchaseReturn.purchase).selectinload(Purchase.supplier),
        selectinload(PurchaseReturn.supplier),
        selectinload(PurchaseReturn.items).selectinload(PurchaseReturnItem.product)
    ).order_by(PurchaseReturn.date.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

async def delete_sale_return(db: AsyncSession, return_id: int):
    # 1. Fetch return with items
    query = select(SaleReturn).options(selectinload(SaleReturn.items)).where(SaleReturn.id == return_id)
    result = await db.execute(query)
    db_return = result.scalar_one_or_none()
    
    if not db_return:
        return False
        
    # 2. Revert Stock and Balance
    for item in db_return.items:
        # Revert Stock (Decrease)
        if item.condition == 'damaged':
            stmt = update(Product).where(Product.id == item.product_id).values(
                scrap_qty=Product.scrap_qty - item.quantity
            )
        else:
            stmt = update(Product).where(Product.id == item.product_id).values(
                stock_qty=Product.stock_qty - item.quantity
            )
        await db.execute(stmt)
        
    if db_return.customer_id:
        # Revert Customer Balance (Increase back)
        stmt = update(Customer).where(Customer.id == db_return.customer_id).values(
            outstanding_balance=Customer.outstanding_balance + db_return.total_refund_amount
        )
        await db.execute(stmt)
        
        # Remove Ledger
        l_stmt = select(Ledger).where(
            Ledger.party_type == "customer",
            Ledger.party_id == db_return.customer_id,
            Ledger.reference_id == db_return.id,
            Ledger.transaction_type == "sale_return"
        )
        l_res = await db.execute(l_stmt)
        ledger = l_res.scalar_one_or_none()
        if ledger:
            await db.delete(ledger)
            
    # 3. Delete Return
    await db.delete(db_return)
    await db.commit()
    return True

async def delete_purchase_return(db: AsyncSession, return_id: int):
    # 1. Fetch return with items
    query = select(PurchaseReturn).options(selectinload(PurchaseReturn.items)).where(PurchaseReturn.id == return_id)
    result = await db.execute(query)
    db_return = result.scalar_one_or_none()
    
    if not db_return:
        return False
        
    # 2. Revert Stock and Balance
    for item in db_return.items:
        # Revert Stock (Increase back)
        if item.condition == 'damaged':
            stmt = update(Product).where(Product.id == item.product_id).values(
                scrap_qty=Product.scrap_qty + item.quantity
            )
        else:
            stmt = update(Product).where(Product.id == item.product_id).values(
                stock_qty=Product.stock_qty + item.quantity
            )
        await db.execute(stmt)
        
    if db_return.supplier_id:
        # Revert Supplier Balance (Increase back)
        stmt = update(Supplier).where(Supplier.id == db_return.supplier_id).values(
            outstanding_balance=Supplier.outstanding_balance + db_return.total_refund_amount
        )
        await db.execute(stmt)
        
        # Remove Ledger
        l_stmt = select(Ledger).where(
            Ledger.party_type == "supplier",
            Ledger.party_id == db_return.supplier_id,
            Ledger.reference_id == db_return.id,
            Ledger.transaction_type == "purchase_return"
        )
        l_res = await db.execute(l_stmt)
        ledger = l_res.scalar_one_or_none()
        if ledger:
            await db.delete(ledger)
            
    # 3. Delete Return
    await db.delete(db_return)
    await db.commit()
    return True

async def update_sale_return(db: AsyncSession, return_id: int, reason: str):
    query = select(SaleReturn).where(SaleReturn.id == return_id)
    result = await db.execute(query)
    db_return = result.scalar_one_or_none()
    
    if not db_return:
        return False
    
    db_return.reason = reason
    await db.commit()
    return True

async def update_purchase_return(db: AsyncSession, return_id: int, reason: str):
    query = select(PurchaseReturn).where(PurchaseReturn.id == return_id)
    result = await db.execute(query)
    db_return = result.scalar_one_or_none()
    
    if not db_return:
        return False
    
    db_return.reason = reason
    await db.commit()
    return True
