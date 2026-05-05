from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from database import get_db
from services.product_service import (
    get_all_products, get_product_by_id, create_product, update_product, delete_product,
    get_all_categories, create_category, get_all_brands, create_brand, get_product_detail
)
from schemas.product import (
    ProductResponse, ProductCreate, ProductUpdate,
    CategoryResponse, CategoryCreate, BrandResponse, BrandCreate,
    ProductDetailResponse
)
from routes.auth import get_current_user
from models.product import Product
from PIL import Image
import os

router = APIRouter(dependencies=[Depends(get_current_user)])

@router.get("/products")
async def read_products(
    page: int = Query(1, ge=1),
    size: int = Query(25, ge=1, le=1000),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    skip = (page - 1) * size
    products, total = await get_all_products(db, skip=skip, limit=size, search=search)
    
    # Manually serialize to match ProductResponse schema if needed, 
    # but FastAPI will handle List[ProductResponse] if we use response_model correctly.
    # However, since we are changing the return type to a dict, we remove response_model=List[ProductResponse].
    
    return {
        "items": products,
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size
    }

@router.post("/products", response_model=ProductResponse)
async def create_new_product(product: ProductCreate, db: AsyncSession = Depends(get_db)):
    return await create_product(db, product)

@router.get("/products/{product_id}", response_model=ProductResponse)
async def read_product(product_id: int, db: AsyncSession = Depends(get_db)):
    product = await get_product_by_id(db, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.get("/products/{product_id}/detail", response_model=ProductDetailResponse)
async def read_product_detail(product_id: int, db: AsyncSession = Depends(get_db)):
    detail = await get_product_detail(db, product_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return detail

@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_existing_product(product_id: int, product: ProductUpdate, db: AsyncSession = Depends(get_db)):
    updated_product = await update_product(db, product_id, product)
    if updated_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return updated_product

@router.delete("/products/{product_id}")
async def delete_existing_product(product_id: int, db: AsyncSession = Depends(get_db)):
    product = await delete_product(db, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

@router.post("/products/{product_id}/image")
async def upload_product_image(product_id: int, file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    try:
        product = await get_product_by_id(db, product_id)
        if product is None:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Ensure directory exists
        os.makedirs("uploads/products", exist_ok=True)
        
        # Read file contents
        contents = await file.read()
        from io import BytesIO
        image = Image.open(BytesIO(contents))
        
        # Convert to RGB if necessary (e.g. for RGBA or P)
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
            
        image.thumbnail((800, 800))
        image_path = f"uploads/products/{product_id}.jpg"
        image.save(image_path, "JPEG", quality=70)
        
        # Update product image_url
        product.image_url = f"/uploads/products/{product_id}.jpg"
        await db.commit()
        await db.refresh(product)
        return {"image_url": product.image_url}
    except Exception as e:
        print(f"IMAGE UPLOAD ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories", response_model=List[CategoryResponse])
async def read_categories(db: AsyncSession = Depends(get_db)):
    return await get_all_categories(db)

@router.post("/categories", response_model=CategoryResponse)
async def create_new_category(category: CategoryCreate, db: AsyncSession = Depends(get_db)):
    return await create_category(db, category)

@router.get("/brands", response_model=List[BrandResponse])
async def read_brands(db: AsyncSession = Depends(get_db)):
    return await get_all_brands(db)

@router.post("/brands", response_model=BrandResponse)
async def create_new_brand(brand: BrandCreate, db: AsyncSession = Depends(get_db)):
    return await create_brand(db, brand)

@router.get("/products/{product_id}/serials")
async def get_product_serials(product_id: int, status: Optional[str] = "in_stock", db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    from models.product_serial import ProductSerial
    query = select(ProductSerial).where(
        ProductSerial.product_id == product_id,
        ProductSerial.status == status
    ).order_by(ProductSerial.created_at.desc())
    result = await db.execute(query)
    serials = result.scalars().all()
    return [{"id": s.id, "serial_number": s.serial_number, "serial_type": s.serial_type, "status": s.status} for s in serials]