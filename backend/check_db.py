import asyncio
from sqlalchemy import text
from database import engine

async def check():
    async with engine.connect() as conn:
        print("Checking expense_categories...")
        res = await conn.execute(text("SELECT count(*) FROM expense_categories"))
        print(f"Categories count: {res.scalar()}")
        
        print("Checking expenses...")
        res = await conn.execute(text("SELECT count(*) FROM expenses WHERE category_id IS NULL"))
        print(f"Expenses with NULL category_id: {res.scalar()}")

if __name__ == "__main__":
    asyncio.run(check())
