from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from database import get_db
from routes.auth import get_current_user
from services.payment_service import create_payment, get_payments
from schemas.payment import PaymentCreate, PaymentResponse

router = APIRouter(dependencies=[Depends(get_current_user)])

@router.post("/payments", response_model=PaymentResponse, status_code=201)
async def create_payment_endpoint(
    payment_data: PaymentCreate,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await create_payment(db, payment_data)
    except Exception as e:
        print(f"ROUTER ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/payments", response_model=List[PaymentResponse])
async def get_payments_endpoint(
    party_type: Optional[str] = None,
    party_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    return await get_payments(db, party_type, party_id, skip, limit)