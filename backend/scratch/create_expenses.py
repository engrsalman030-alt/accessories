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
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS expenses (
                id SERIAL PRIMARY KEY, 
                description VARCHAR NOT NULL, 
                category VARCHAR NOT NULL, 
                amount FLOAT NOT NULL, 
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
                payment_method VARCHAR DEFAULT 'cash', 
                notes TEXT, 
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(update())
