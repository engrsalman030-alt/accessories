from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from models.supplier import Supplier
from schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse, SupplierListResponse, SupplierSummary
from datetime import datetime
from fastapi import HTTPException, status

async def get_all_suppliers(
    db: AsyncSession, skip: int = 0, limit: int = 50, search: Optional[str] = None
) -> List[SupplierListResponse]:
    query = select(Supplier)
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Supplier.name.ilike(search_term),
                Supplier.phone.ilike(search_term),
                Supplier.company.ilike(search_term)
            )
        )
    query = query.order_by(Supplier.name).offset(skip).limit(limit)
    result = await db.execute(query)
    suppliers = result.scalars().all()
    return [SupplierListResponse.from_orm(supplier) for supplier in suppliers]

async def get_supplier_by_id(db: AsyncSession, supplier_id: int) -> SupplierResponse:
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return SupplierResponse.from_orm(supplier)

async def create_supplier(db: AsyncSession, supplier_data: SupplierCreate) -> SupplierResponse:
    # Check for duplicate phone if provided
    if supplier_data.phone:
        result = await db.execute(
            select(Supplier).where(Supplier.phone == supplier_data.phone)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="Supplier with this phone already exists"
            )
    db_supplier = Supplier(**supplier_data.dict())
    db.add(db_supplier)
    await db.commit()
    await db.refresh(db_supplier)
    return SupplierResponse.from_orm(db_supplier)

async def update_supplier(
    db: AsyncSession, supplier_id: int, supplier_data: SupplierUpdate
) -> SupplierResponse:
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Check for duplicate phone if being updated
    if supplier_data.phone and supplier_data.phone != supplier.phone:
        result = await db.execute(
            select(Supplier).where(Supplier.phone == supplier_data.phone)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="Supplier with this phone already exists"
            )
    
    update_data = supplier_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(supplier, key, value)
    supplier.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(supplier)
    return SupplierResponse.from_orm(supplier)

async def delete_supplier(db: AsyncSession, supplier_id: int):
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Check outstanding balance
    if supplier.outstanding_balance != 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete supplier with outstanding balance of {supplier.outstanding_balance}"
        )
    
    # Check for purchase history
    from models.purchase import Purchase
    result = await db.execute(
        select(Purchase).where(Purchase.supplier_id == supplier_id).limit(1)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Cannot delete supplier with purchase history. Deactivate instead."
        )
    
    await db.delete(supplier)
    await db.commit()
    return {"message": "Supplier deleted successfully"}

async def get_supplier_summary(db: AsyncSession) -> SupplierSummary:
    # Total suppliers
    total_result = await db.execute(select(func.count()).select_from(Supplier))
    total_suppliers = total_result.scalar()
    
    # Total outstanding (sum of positive balances)
    outstanding_result = await db.execute(
        select(func.sum(Supplier.outstanding_balance))
        .where(Supplier.outstanding_balance > 0)
    )
    total_outstanding = outstanding_result.scalar() or 0
    
    # Count of suppliers with balance > 0
    with_balance_result = await db.execute(
        select(func.count()).select_from(Supplier)
        .where(Supplier.outstanding_balance > 0)
    )
    suppliers_with_balance = with_balance_result.scalar()
    
    return SupplierSummary(
        total_suppliers=total_suppliers,
        total_outstanding=total_outstanding,
        suppliers_with_balance=suppliers_with_balance
    )

async def get_supplier_ledger(
    db: AsyncSession, 
    supplier_id: int, 
    skip: int = 0, 
    limit: int = 100,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
):
    # Ensure naive datetimes for comparison with DB
    if start_date and start_date.tzinfo:
        start_date = start_date.replace(tzinfo=None)
    if end_date and end_date.tzinfo:
        end_date = end_date.replace(tzinfo=None)

    # First, get the supplier to ensure it exists
    supplier = await get_supplier_by_id(db, supplier_id)
    
    from models.ledger import Ledger
    
    # 1. Base query for this supplier
    base_filters = and_(
        Ledger.party_type == "supplier",
        Ledger.party_id == supplier_id
    )
    
    # 2. Calculate Opening Balance (sum of all entries BEFORE start_date)
    opening_balance = 0.0
    if start_date:
        # If start_date is provided, we need to know the state before it
        # However, our Ledger stores cumulative balance in Ledger.balance.
        # So we just need the LATEST balance before start_date.
        ob_query = (
            select(Ledger.balance)
            .where(and_(base_filters, Ledger.date < start_date))
            .order_by(Ledger.date.desc())
            .limit(1)
        )
        ob_result = await db.execute(ob_query)
        opening_balance = ob_result.scalar() or 0.0

    # 3. Fetch Ledger entries in range
    query = select(Ledger).where(base_filters)
    
    if start_date:
        query = query.where(Ledger.date >= start_date)
    if end_date:
        query = query.where(Ledger.date <= end_date)
        
    query = query.order_by(Ledger.date.asc()).offset(skip).limit(limit)
    result = await db.execute(query)
    ledger_entries = result.scalars().all()
    
    # 4. Get total count
    count_query = select(func.count()).select_from(Ledger).where(base_filters)
    if start_date:
        count_query = count_query.where(Ledger.date >= start_date)
    if end_date:
        count_query = count_query.where(Ledger.date <= end_date)
        
    count_result = await db.execute(count_query)
    total = count_result.scalar()
    
    return {
        "supplier": SupplierResponse.from_orm(supplier),
        "ledger": ledger_entries,
        "opening_balance": opening_balance,
        "total": total
    }