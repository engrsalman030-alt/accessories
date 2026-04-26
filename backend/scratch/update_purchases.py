import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def update():
    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as conn:
        await conn.execute(text("ALTER TABLE purchases ADD COLUMN IF NOT EXISTS payment_method VARCHAR DEFAULT 'cash'"))
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(update())
