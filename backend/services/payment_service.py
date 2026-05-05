from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from sqlalchemy.orm import selectinload
from typing import List, Optional
from models.payment import Payment
from models.supplier import Supplier
from models.customer import Customer
from models.ledger import Ledger
from models.purchase import Purchase
from models.sale import Sale
from schemas.payment import PaymentCreate, PaymentResponse
from datetime import datetime
from fastapi import HTTPException, status

async def create_payment(db: AsyncSession, payment_data: PaymentCreate) -> PaymentResponse:
    try:
        # Start transaction
        # 1. Create Payment record
        db_payment = Payment(
            party_type=payment_data.party_type,
            party_id=int(payment_data.party_id),
            invoice_id=payment_data.invoice_id,
            amount=float(payment_data.amount),
            method=payment_data.method,
            reference_note=payment_data.reference_note,
            date=payment_data.date.replace(tzinfo=None) if payment_data.date.tzinfo else payment_data.date
        )
        db.add(db_payment)
        await db.flush()

        remaining_payment = float(payment_data.amount)

        # 2. Update party outstanding_balance and distribute to invoices
        if payment_data.party_type == 'supplier':
            result = await db.execute(
                select(Supplier).where(Supplier.id == payment_data.party_id)
            )
            party = result.scalar_one_or_none()
            if not party:
                raise HTTPException(status_code=404, detail="Supplier not found")
            party.outstanding_balance = float(party.outstanding_balance) - float(payment_data.amount)

            if payment_data.invoice_id:
                # Direct payment to a specific Purchase
                p_result = await db.execute(
                    select(Purchase).where(Purchase.id == payment_data.invoice_id)
                )
                purchase = p_result.scalar_one_or_none()
                if purchase:
                    payment_to_apply = min(remaining_payment, purchase.balance_due)
                    purchase.amount_paid += payment_to_apply
                    purchase.balance_due -= payment_to_apply
                    
                    if purchase.balance_due <= 0:
                        purchase.status = "paid"
                    else:
                        purchase.status = "partial"
            else:
                # Distribute to Purchases (FIFO)
                purchase_result = await db.execute(
                    select(Purchase)
                    .where((Purchase.supplier_id == payment_data.party_id) & (Purchase.balance_due > 0))
                    .order_by(Purchase.date.asc())
                )
                purchases = purchase_result.scalars().all()
                
                for purchase in purchases:
                    if remaining_payment <= 0:
                        break
                    
                    payment_to_apply = min(remaining_payment, purchase.balance_due)
                    purchase.amount_paid += payment_to_apply
                    purchase.balance_due -= payment_to_apply
                    remaining_payment -= payment_to_apply
                    
                    if purchase.balance_due <= 0:
                        purchase.status = "paid"
                    else:
                        purchase.status = "partial"

        elif payment_data.party_type == 'customer':
            result = await db.execute(
                select(Customer).where(Customer.id == payment_data.party_id)
            )
            party = result.scalar_one_or_none()
            if not party:
                raise HTTPException(status_code=404, detail="Customer not found")
            party.outstanding_balance = float(party.outstanding_balance) - float(payment_data.amount)

            if payment_data.invoice_id:
                # Direct payment to a specific Sale
                s_result = await db.execute(
                    select(Sale).where(Sale.id == payment_data.invoice_id)
                )
                sale = s_result.scalar_one_or_none()
                if sale:
                    payment_to_apply = min(remaining_payment, sale.balance_due)
                    sale.amount_paid += payment_to_apply
                    sale.balance_due -= payment_to_apply
                    
                    if sale.balance_due <= 0:
                        sale.status = "completed"
                    else:
                        sale.status = "partial"
            else:
                # Distribute to Sales (FIFO)
                sale_result = await db.execute(
                    select(Sale)
                    .where((Sale.customer_id == payment_data.party_id) & (Sale.balance_due > 0))
                    .order_by(Sale.date.asc())
                )
                sales = sale_result.scalars().all()
                
                for sale in sales:
                    if remaining_payment <= 0:
                        break
                    
                    payment_to_apply = min(remaining_payment, sale.balance_due)
                    sale.amount_paid += payment_to_apply
                    sale.balance_due -= payment_to_apply
                    remaining_payment -= payment_to_apply
                    
                    if sale.balance_due <= 0:
                        sale.status = "completed"
                    else:
                        sale.status = "partial"

        # 3. Create Ledger entry
        ledger_result = await db.execute(
            select(func.max(Ledger.balance)).where(
                (Ledger.party_type == payment_data.party_type) &
                (Ledger.party_id == payment_data.party_id)
            )
        )
        last_balance = ledger_result.scalar()
        if last_balance is None:
            last_balance = 0.0
            
        new_balance = float(last_balance) - float(payment_data.amount)

        ledger_entry = Ledger(
            party_type=payment_data.party_type,
            party_id=payment_data.party_id,
            transaction_type='payment',
            reference_id=db_payment.id,
            debit=float(payment_data.amount),
            credit=0.0,
            balance=new_balance,
            date=payment_data.date.replace(tzinfo=None) if payment_data.date.tzinfo else payment_data.date,
            description=f"Payment via {payment_data.method}"
        )
        db.add(ledger_entry)

        # 4. Commit all together
        await db.commit()
        await db.refresh(db_payment)
        
        return PaymentResponse.model_validate(db_payment)
    except Exception as e:
        await db.rollback()
        print(f"PAYMENT ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

async def get_payments(
    db: AsyncSession,
    party_type: Optional[str] = None,
    party_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50
) -> List[PaymentResponse]:
    query = select(Payment)
    
    if party_type:
        query = query.where(Payment.party_type == party_type)
    if party_id:
        query = query.where(Payment.party_id == party_id)
    
    query = query.order_by(Payment.date.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    payments = result.scalars().all()
    
    return [PaymentResponse.model_validate(payment) for payment in payments]