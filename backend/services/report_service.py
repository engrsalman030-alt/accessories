from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from models.sale import Sale, SaleItem
from models.purchase import Purchase
from models.product import Product
from models.customer import Customer
from models.supplier import Supplier
from models.payment import Payment
from datetime import datetime

async def get_dashboard_summary(db: AsyncSession):
    # Total Sales
    sales_result = await db.execute(select(func.sum(Sale.total_amount)))
    total_sales = sales_result.scalar() or 0.0
    
    # Total Purchases
    purchases_result = await db.execute(select(func.sum(Purchase.total_amount)))
    total_purchases = purchases_result.scalar() or 0.0
    
    # Customer Outstandings
    cust_bal_result = await db.execute(select(func.sum(Customer.outstanding_balance)))
    total_cust_balance = cust_bal_result.scalar() or 0.0
    
    # Supplier Outstandings
    supp_bal_result = await db.execute(select(func.sum(Supplier.outstanding_balance)))
    total_supp_balance = supp_bal_result.scalar() or 0.0
    
    # Low Stock Products
    low_stock_result = await db.execute(select(Product).where(Product.stock_qty <= 10))
    low_stock_items = low_stock_result.scalars().all()

    # Total Stock Value (at Cost)
    stock_value_result = await db.execute(select(func.sum(Product.stock_qty * Product.cost_price)))
    total_stock_value = stock_value_result.scalar() or 0.0

    # Total Potential Retail Value
    retail_value_result = await db.execute(select(func.sum(Product.stock_qty * Product.retail_price)))
    total_stock_retail_value = retail_value_result.scalar() or 0.0

    # Recent Activities
    # 1. Recent Sales
    sales_q = await db.execute(
        select(Sale, Customer.name)
        .join(Customer, Sale.customer_id == Customer.id, isouter=True)
        .order_by(desc(Sale.created_at)).limit(5)
    )
    recent_sales = []
    for s, c_name in sales_q.all():
        recent_sales.append({
            "user": "System",
            "action": f"Sale #{s.id} to {c_name or 'Walk-in'} - PKR {s.total_amount}",
            "time": s.created_at.isoformat() + "Z",
            "type": "sale"
        })

    # 2. Recent Purchases
    purch_q = await db.execute(
        select(Purchase, Supplier.name)
        .join(Supplier, Purchase.supplier_id == Supplier.id)
        .order_by(desc(Purchase.created_at)).limit(5)
    )
    recent_purchases = []
    for p, s_name in purch_q.all():
        recent_purchases.append({
            "user": "System",
            "action": f"Purchase #{p.id} from {s_name} - PKR {p.total_amount}",
            "time": p.created_at.isoformat() + "Z",
            "type": "purchase"
        })

    # 3. Recent Payments
    pay_q = await db.execute(
        select(Payment).order_by(desc(Payment.created_at)).limit(5)
    )
    recent_payments = []
    for py in pay_q.scalars().all():
        recent_payments.append({
            "user": "System",
            "action": f"Payment of PKR {py.amount} ({py.party_type})",
            "time": py.created_at.isoformat() + "Z",
            "type": "payment"
        })

    # 4. Revenue Analytics (Last 7 days)
    from datetime import timedelta
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    revenue_analytics_q = await db.execute(
        select(func.date(Sale.date), func.sum(Sale.total_amount))
        .where(Sale.date >= seven_days_ago)
        .group_by(func.date(Sale.date))
        .order_by(func.date(Sale.date))
    )
    revenue_analytics = [{"date": str(d), "amount": float(a)} for d, a in revenue_analytics_q.all()]

    # 5. Top Selling Categories
    from models.product import Category
    top_categories_q = await db.execute(
        select(Category.name, func.sum(SaleItem.quantity))
        .join(Product, SaleItem.product_id == Product.id)
        .join(Category, Product.category_id == Category.id)
        .group_by(Category.name)
        .order_by(desc(func.sum(SaleItem.quantity)))
        .limit(5)
    )
    top_categories = [{"name": n, "value": float(v)} for n, v in top_categories_q.all()]

    activities = sorted(recent_sales + recent_purchases + recent_payments, key=lambda x: x['time'], reverse=True)[:8]
    
    return {
        "total_sales": total_sales,
        "total_purchases": total_purchases,
        "total_customer_balance": total_cust_balance,
        "total_supplier_balance": total_supp_balance,
        "total_stock_value": total_stock_value,
        "total_stock_retail_value": total_stock_retail_value,
        "low_stock_count": len(low_stock_items),
        "activities": activities,
        "revenue_analytics": revenue_analytics,
        "top_categories": top_categories
    }

from models.expense import Expense
from models.returns import SaleReturn, PurchaseReturn

async def get_profit_loss(db: AsyncSession, start_date: datetime, end_date: datetime):
    # Ensure naive datetimes for comparison with DB
    if start_date.tzinfo: start_date = start_date.replace(tzinfo=None)
    if end_date.tzinfo: end_date = end_date.replace(tzinfo=None)

    # 1. Total Revenue (Sales)
    revenue_q = await db.execute(
        select(func.sum(Sale.total_amount))
        .where(Sale.date.between(start_date, end_date))
    )
    total_revenue = revenue_q.scalar() or 0.0

    # 2. Total COGS (Cost of Goods Sold)
    # COGS = Sum(SaleItem.quantity * SaleItem.unit_cost)
    cogs_q = await db.execute(
        select(func.sum(SaleItem.quantity * SaleItem.unit_cost))
        .join(Sale, SaleItem.sale_id == Sale.id)
        .where(Sale.date.between(start_date, end_date))
    )
    total_cogs = cogs_q.scalar() or 0.0

    # 3. Total Expenses
    expense_q = await db.execute(
        select(func.sum(Expense.amount))
        .where(Expense.date.between(start_date, end_date))
    )
    total_expenses = expense_q.scalar() or 0.0

    # 4. Returns Impact
    # Sale Returns (Decreases Revenue)
    sale_returns_q = await db.execute(
        select(func.sum(SaleReturn.total_refund_amount))
        .where(SaleReturn.date.between(start_date, end_date))
    )
    total_sale_returns = sale_returns_q.scalar() or 0.0

    # 5. Calculations
    total_revenue = float(total_revenue)
    total_sale_returns = float(total_sale_returns)
    total_cogs = float(total_cogs)
    total_expenses = float(total_expenses)

    actual_revenue = total_revenue - total_sale_returns
    gross_profit = actual_revenue - total_cogs
    net_profit = gross_profit - total_expenses

    # 6. Periodic Breakdown (Optional but professional)
    # We can add daily/monthly summaries if needed, but the main summary is first.

    return {
        "revenue": total_revenue,
        "sale_returns": total_sale_returns,
        "actual_revenue": actual_revenue,
        "cogs": total_cogs,
        "gross_profit": gross_profit,
        "expenses": total_expenses,
        "net_profit": net_profit,
        "period": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat()
        }
    }
