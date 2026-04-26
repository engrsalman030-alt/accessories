from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from database import get_db
from services.product_service import (
    get_all_products, get_product_by_id, create_product, update_product, delete_product,
    get_all_categories, create_category, get_all_brands, create_brand
)
from schemas.product import (
    ProductResponse, ProductCreate, ProductUpdate,
    CategoryResponse, CategoryCreate, BrandResponse, BrandCreate
)
from routes.auth import get_current_user
from models.product import Product
from PIL import Image
import os

router = APIRouter(dependencies=[Depends(get_current_user)])

@router.get("/products", response_model=List[ProductResponse])
async def read_products(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    products = await get_all_products(db, skip=skip, limit=limit, search=search)
    return products

@router.post("/products", response_model=ProductResponse)
async def create_new_product(product: ProductCreate, db: AsyncSession = Depends(get_db)):
    return await create_product(db, product)

@router.get("/products/{product_id}", response_model=ProductResponse)
async def read_product(product_id: int, db: AsyncSession = Depends(get_db)):
    product = await get_product_by_id(db, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

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