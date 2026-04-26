from pydantic import BaseModel
from typing import Optional

class SettingBase(BaseModel):
    shop_name: str
    address: str
    phone: str
    email: str
    currency: str
    logo_url: Optional[str] = None
    printer_type: Optional[str] = "thermal"

class SettingUpdate(SettingBase):
    pass

class SettingResponse(SettingBase):
    id: int

    class Config:
        from_attributes = True
