from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from models.setting import Setting
from schemas.setting import SettingUpdate

async def get_settings(db: AsyncSession):
    query = select(Setting).where(Setting.id == 1)
    result = await db.execute(query)
    settings = result.scalar_one_or_none()
    
    if not settings:
        # Create default settings if they don't exist
        settings = Setting(id=1)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
        
    return settings

async def update_settings(db: AsyncSession, setting_data: SettingUpdate):
    settings = await get_settings(db)
    
    update_data = setting_data.dict(exclude_unset=True)
    if update_data:
        stmt = update(Setting).where(Setting.id == 1).values(**update_data)
        await db.execute(stmt)
        await db.commit()
    
    # Return updated settings
    return await get_settings(db)
