from sqlalchemy import Column, Integer, String
from database import Base

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
