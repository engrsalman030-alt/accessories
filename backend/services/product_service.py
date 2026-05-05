from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func, distinct
from sqlalchemy.orm import selectinload
from typing import List, Optional
from models.product import Product, Category, Brand
from schemas.product import ProductCreate, ProductUpdate, CategoryCreate, BrandCreate

async def get_all_products(db: AsyncSession, skip: int = 0, limit: int = 100, search: Optional[str] = None):
    # Base query for data
    query = select(Product).options(selectinload(Product.category), selectinload(Product.brand))
    
    # Base query for count
    count_query = select(func.count()).select_from(Product)

    if search:
        filters = or_(
            Product.name.ilike(f"%{search}%"), 
            Product.sku.ilike(f"%{search}%"),
            Product.barcode.ilike(f"%{search}%")
        )
        query = query.where(filters)
        count_query = count_query.where(filters)

    # Execute count
    total_result = await db.execute(count_query)
    total_count = total_result.scalar()

    # Execute data query
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    products = result.scalars().all()
    
    return products, total_count

async def get_product_by_id(db: AsyncSession, product_id: int):
    query = select(Product).options(selectinload(Product.category), selectinload(Product.brand)).where(Product.id == product_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()

async def get_product_detail(db: AsyncSession, product_id: int):
    # 1. Fetch basic product
    product = await get_product_by_id(db, product_id)
    if not product:
        return None
        
    # 2. Calculate Stock Value
    # Note: Stock Value usually is stock_qty * cost_price
    # But some items might have different costs in different batches.
    # For simplicity, we use current product.cost_price or average.
    stock_value = product.stock_qty * (product.cost_price or 0)
    
    # 3. Find unique suppliers who supplied this product
    from models.purchase import Purchase, PurchaseItem
    from models.supplier import Supplier
    
    supplier_query = (
        select(distinct(Supplier.name))
        .join(Purchase, Supplier.id == Purchase.supplier_id)
        .join(PurchaseItem, Purchase.id == PurchaseItem.purchase_id)
        .where(PurchaseItem.product_id == product_id)
    )
    supplier_res = await db.execute(supplier_query)
    suppliers = supplier_res.scalars().all()
    
    return {
        "product": product,
        "stock_value": stock_value,
        "suppliers": suppliers
    }

async def create_product(db: AsyncSession, product: ProductCreate):
    product_data = product.dict()
    # Sanitize empty strings for unique fields to allow multiple NULLs
    if product_data.get("barcode") == "":
        product_data["barcode"] = None
    if product_data.get("sku") == "":
        product_data["sku"] = None
    if product_data.get("imei") == "":
        product_data["imei"] = None
        
    db_product = Product(**product_data)
    db.add(db_product)
    await db.commit()
    return await get_product_by_id(db, db_product.id)

async def update_product(db: AsyncSession, product_id: int, product: ProductUpdate):
    db_product = await get_product_by_id(db, product_id)
    if db_product:
        for key, value in product.dict(exclude_unset=True).items():
            setattr(db_product, key, value)
        await db.commit()
        return await get_product_by_id(db, db_product.id)
    return None

async def delete_product(db: AsyncSession, product_id: int):
    db_product = await get_product_by_id(db, product_id)
    if db_product:
        await db.delete(db_product)
        await db.commit()
    return db_product

async def get_all_categories(db: AsyncSession):
    query = select(Category)
    result = await db.execute(query)
    return result.scalars().all()

async def create_category(db: AsyncSession, category: CategoryCreate):
    db_category = Category(**category.dict())
    db.add(db_category)
    await db.commit()
    await db.refresh(db_category)
    return db_category

async def get_all_brands(db: AsyncSession):
    query = select(Brand)
    result = await db.execute(query)
    return result.scalars().all()

async def create_brand(db: AsyncSession, brand: BrandCreate):
    db_brand = Brand(**brand.dict())
    db.add(db_brand)
    await db.commit()
    await db.refresh(db_brand)
    return db_brand