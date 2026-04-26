from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from datetime import datetime
from database import Base

class Ledger(Base):
    __tablename__ = "ledger"
    id = Column(Integer, primary_key=True, index=True)
    party_type = Column(String, nullable=False)  # customer or supplier
    party_id = Column(Integer, nullable=False)
    transaction_type = Column(String, nullable=False)  # sale, payment, purchase, etc.
    reference_id = Column(Integer, nullable=True)
    debit = Column(Float, default=0.0)
    credit = Column(Float, default=0.0)
    balance = Column(Float, default=0.0)
    date = Column(DateTime, default=datetime.utcnow)
    description = Column(Text, nullable=True)