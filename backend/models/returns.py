from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class SaleReturn(Base):
    __tablename__ = "sale_returns"
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True) # Changed to nullable
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True) # Added customer_id
    reason = Column(Text, nullable=True)
    total_refund_amount = Column(Numeric(10, 2), default=0.0)
    date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    sale = relationship("Sale", back_populates="returns")
    customer = relationship("Customer")
    items = relationship("SaleReturnItem", back_populates="sale_return", cascade="all, delete-orphan")

class SaleReturnItem(Base):
    __tablename__ = "sale_return_items"
    id = Column(Integer, primary_key=True, index=True)
    return_id = Column(Integer, ForeignKey("sale_returns.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    condition = Column(String, default="fine") # fine or damaged
    serial_numbers = Column(Text, nullable=True) # Comma-separated serials
    
    sale_return = relationship("SaleReturn", back_populates="items")
    product = relationship("Product")

class PurchaseReturn(Base):
    __tablename__ = "purchase_returns"
    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"), nullable=True) # Changed to nullable
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True) # Added supplier_id
    reason = Column(Text, nullable=True)
    total_refund_amount = Column(Numeric(10, 2), default=0.0)
    date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    purchase = relationship("Purchase", back_populates="returns")
    supplier = relationship("Supplier")
    items = relationship("PurchaseReturnItem", back_populates="purchase_return", cascade="all, delete-orphan")

class PurchaseReturnItem(Base):
    __tablename__ = "purchase_return_items"
    id = Column(Integer, primary_key=True, index=True)
    return_id = Column(Integer, ForeignKey("purchase_returns.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_cost = Column(Numeric(10, 2), nullable=False)
    condition = Column(String, default="fine") # fine or damaged
    serial_numbers = Column(Text, nullable=True) # Comma-separated serials
    
    purchase_return = relationship("PurchaseReturn", back_populates="items")
    product = relationship("Product")
