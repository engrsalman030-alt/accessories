from datetime import datetime, timedelta
from sqlalchemy import select
from models.setting import Setting
from sqlalchemy.ext.asyncio import AsyncSession
from utils.logger import logger

async def verify_license(db: AsyncSession):
    """
    Checks if the application license is still valid.
    A license is valid for 1 year (365 days) from the installation_date.
    """
    try:
        query = select(Setting).where(Setting.id == 1)
        result = await db.execute(query)
        setting = result.scalar_one_or_none()
        
        if not setting:
            # If no settings found, app is not initialized properly
            return True, "System Initializing"

        if not setting.is_active:
            return False, "Application License Suspended. Please contact support."

        # Check if 1 year has passed
        expiry_date = setting.installation_date + timedelta(days=365)
        current_date = datetime.utcnow()
        
        if current_date > expiry_date:
            # License expired
            return False, f"License Expired on {expiry_date.strftime('%Y-%m-%d')}. Please renew your subscription."
            
        return True, "License Valid"
    except Exception as e:
        logger.error(f"License verification failed: {str(e)}")
        # If check fails, fail-safe to allowed (or blocked depending on security preference)
        # For now, we allow it to avoid locking out the user on DB errors
        return True, "Bypassing Check"
