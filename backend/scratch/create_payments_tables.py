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
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY, 
                party_type VARCHAR NOT NULL, 
                party_id INTEGER NOT NULL, 
                amount FLOAT NOT NULL, 
                method VARCHAR, 
                reference_note TEXT, 
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS ledger (
                id SERIAL PRIMARY KEY, 
                party_type VARCHAR NOT NULL, 
                party_id INTEGER NOT NULL, 
                transaction_type VARCHAR NOT NULL, 
                reference_id INTEGER, 
                debit FLOAT DEFAULT 0.0, 
                credit FLOAT DEFAULT 0.0, 
                balance FLOAT DEFAULT 0.0, 
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
                description TEXT
            )
        """))
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(update())
