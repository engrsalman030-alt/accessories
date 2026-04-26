from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime
from database import get_db
from routes.auth import get_current_user
from schemas.ledger import SupplierLedgerResponse
from services.supplier_service import (
    get_all_suppliers, get_supplier_by_id, create_supplier, 
    update_supplier, delete_supplier, get_supplier_summary,
    get_supplier_ledger
)
from schemas.supplier import (
    SupplierResponse, SupplierCreate, SupplierUpdate, 
    SupplierListResponse, SupplierSummary
)

router = APIRouter(dependencies=[Depends(get_current_user)])

@router.get("/suppliers", response_model=List[SupplierListResponse])
async def read_suppliers(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    return await get_all_suppliers(db, skip=skip, limit=limit, search=search)

@router.get("/suppliers/summary", response_model=SupplierSummary)
async def read_supplier_summary(db: AsyncSession = Depends(get_db)):
    return await get_supplier_summary(db)

@router.get("/suppliers/{supplier_id}", response_model=SupplierResponse)
async def read_supplier(supplier_id: int, db: AsyncSession = Depends(get_db)):
    return await get_supplier_by_id(db, supplier_id)

@router.post("/suppliers", response_model=SupplierResponse, status_code=201)
async def create_new_supplier(
    supplier: SupplierCreate, 
    db: AsyncSession = Depends(get_db)
):
    return await create_supplier(db, supplier)

@router.put("/suppliers/{supplier_id}", response_model=SupplierResponse)
async def update_existing_supplier(
    supplier_id: int, 
    supplier: SupplierUpdate, 
    db: AsyncSession = Depends(get_db)
):
    return await update_supplier(db, supplier_id, supplier)

@router.delete("/suppliers/{supplier_id}")
async def delete_existing_supplier(
    supplier_id: int, 
    db: AsyncSession = Depends(get_db)
):
    return await delete_supplier(db, supplier_id)

@router.get("/suppliers/{supplier_id}/ledger", response_model=SupplierLedgerResponse)
async def read_supplier_ledger(
    supplier_id: int,
    skip: int = 0,
    limit: int = 50,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    return await get_supplier_ledger(db, supplier_id, skip, limit, start_date, end_date)
