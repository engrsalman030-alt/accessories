from sqlalchemy import Column, Integer, String, DateTime, Boolean
from database import Base
from datetime import datetime

class Setting(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, index=True)
    shop_name = Column(String, default="ShopManager Enterprise")
    address = Column(String, default="123 Business Avenue, Tech City")
    phone = Column(String, default="Tel: +1 234 567 890")
    email = Column(String, default="contact@yourshop.com")
    currency = Column(String, default="PKR")
    logo_url = Column(String, nullable=True)
    printer_type = Column(String, default="thermal") # thermal or standard
    
    # License & Security
    installation_date = Column(DateTime, default=datetime.utcnow)
    license_key = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
