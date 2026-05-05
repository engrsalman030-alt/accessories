from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from typing import List, Optional
from datetime import datetime
from models.customer import Customer
from schemas.customer import CustomerCreate, CustomerUpdate

async def get_all_suppliers(db: AsyncSession, skip: int = 0, limit: int = 100, search: Optional[str] = None):
    # This was a copy-paste placeholder name, let's fix it for customers
    pass

async def get_all_customers(db: AsyncSession, skip: int = 0, limit: int = 100, search: Optional[str] = None):
    # Base queries
    query = select(Customer)
    count_query = select(func.count()).select_from(Customer)

    if search:
        filters = or_(
            Customer.name.ilike(f"%{search}%"),
            Customer.business_name.ilike(f"%{search}%"),
            Customer.phone.ilike(f"%{search}%")
        )
        query = query.where(filters)
        count_query = count_query.where(filters)

    # Execute count
    total_result = await db.execute(count_query)
    total_count = total_result.scalar()

    # Execute data query
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    customers = result.scalars().all()
    
    return customers, total_count

async def get_customer_by_id(db: AsyncSession, customer_id: int):
    query = select(Customer).where(Customer.id == customer_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()

async def create_customer(db: AsyncSession, customer: CustomerCreate):
    db_customer = Customer(**customer.dict())
    db.add(db_customer)
    await db.commit()
    await db.refresh(db_customer)
    return db_customer

async def update_customer(db: AsyncSession, customer_id: int, customer: CustomerUpdate):
    db_customer = await get_customer_by_id(db, customer_id)
    if db_customer:
        for key, value in customer.dict(exclude_unset=True).items():
            setattr(db_customer, key, value)
        await db.commit()
        await db.refresh(db_customer)
    return db_customer

async def delete_customer(db: AsyncSession, customer_id: int):
    db_customer = await get_customer_by_id(db, customer_id)
    if db_customer:
        await db.delete(db_customer)
        await db.commit()
    return db_customer

from models.ledger import Ledger
from schemas.customer import CustomerResponse
from sqlalchemy import and_, func

async def get_customer_ledger(
    db: AsyncSession, 
    customer_id: int, 
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

    # First, get the customer to ensure it exists
    customer = await get_customer_by_id(db, customer_id)
    if not customer:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # 1. Base query for this customer
    base_filters = and_(
        Ledger.party_type == "customer",
        Ledger.party_id == customer_id
    )
    
    # 2. Fetch Ledger entries in range
    query = select(Ledger).where(base_filters)
    
    if start_date:
        query = query.where(Ledger.date >= start_date)
    if end_date:
        query = query.where(Ledger.date <= end_date)
        
    query = query.order_by(Ledger.date.asc()).offset(skip).limit(limit)
    result = await db.execute(query)
    ledger_entries = result.scalars().all()
    
    return ledger_entries
