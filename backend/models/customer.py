from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from datetime import datetime
from database import Base

class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    business_name = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    type = Column(String, nullable=False)  # retail, wholesale, distributor
    credit_limit = Column(Float, default=0.0)
    outstanding_balance = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)