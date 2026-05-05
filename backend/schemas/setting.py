from pydantic import BaseModel
from typing import Optional

class SettingBase(BaseModel):
    shop_name: Optional[str] = "ShopManager Enterprise"
    address: Optional[str] = "123 Business Avenue, Tech City"
    phone: Optional[str] = "Tel: +1 234 567 890"
    email: Optional[str] = "contact@yourshop.com"
    currency: Optional[str] = "PKR"
    logo_url: Optional[str] = None
    printer_type: Optional[str] = "thermal"

class SettingUpdate(SettingBase):
    pass

class SettingResponse(SettingBase):
    id: int

    class Config:
        from_attributes = True
