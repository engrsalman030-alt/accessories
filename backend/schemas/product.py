from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int

    class Config:
        from_attributes = True

class BrandBase(BaseModel):
    name: str

class BrandCreate(BrandBase):
    pass

class BrandResponse(BrandBase):
    id: int

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str
    sku: str
    barcode: Optional[str] = None
    imei: Optional[str] = None
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    retail_price: float
    wholesale_price: float
    distributor_price: float
    stock_qty: float
    min_stock_qty: float
    is_active: bool = True

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    imei: Optional[str] = None
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    retail_price: Optional[float] = None
    wholesale_price: Optional[float] = None
    distributor_price: Optional[float] = None
    stock_qty: Optional[float] = None
    min_stock_qty: Optional[float] = None
    is_active: Optional[bool] = None

class ProductResponse(ProductBase):
    id: int
    category: Optional[CategoryResponse] = None
    brand: Optional[BrandResponse] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True