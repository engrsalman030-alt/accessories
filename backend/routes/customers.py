from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from database import get_db
from routes.auth import get_current_user
from services.customer_service import (
    get_all_customers, get_customer_by_id, create_customer, 
    update_customer, delete_customer
)
from schemas.customer import CustomerResponse, CustomerCreate, CustomerUpdate

router = APIRouter(dependencies=[Depends(get_current_user)])

@router.get("/customers", response_model=List[CustomerResponse])
async def read_customers(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    return await get_all_customers(db, skip=skip, limit=limit, search=search)

@router.get("/customers/{customer_id}", response_model=CustomerResponse)
async def read_customer(customer_id: int, db: AsyncSession = Depends(get_db)):
    customer = await get_customer_by_id(db, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.post("/customers", response_model=CustomerResponse)
async def create_new_customer(customer: CustomerCreate, db: AsyncSession = Depends(get_db)):
    return await create_customer(db, customer)

@router.put("/customers/{customer_id}", response_model=CustomerResponse)
async def update_existing_customer(customer_id: int, customer: CustomerUpdate, db: AsyncSession = Depends(get_db)):
    updated_customer = await update_customer(db, customer_id, customer)
    if updated_customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return updated_customer

@router.delete("/customers/{customer_id}")
async def delete_existing_customer(customer_id: int, db: AsyncSession = Depends(get_db)):
    customer = await delete_customer(db, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted"}
