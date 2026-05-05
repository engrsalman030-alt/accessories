from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class ProductSerial(Base):
    __tablename__ = "product_serials"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    serial_number = Column(String, nullable=False)
    serial_type = Column(String, default="serial")  # serial, imei1, imei2
    purchase_item_id = Column(Integer, ForeignKey("purchase_items.id"), nullable=True)
    sale_item_id = Column(Integer, ForeignKey("sale_items.id"), nullable=True)
    status = Column(String, default="in_stock")  # in_stock, sold, returned
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product")
