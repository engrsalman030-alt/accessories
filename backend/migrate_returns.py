import asyncio
from sqlalchemy import text
from database import engine

async def migrate():
    async with engine.begin() as conn:
        print("Migrating sale_returns table...")
        try:
            await conn.execute(text("ALTER TABLE sale_returns ADD COLUMN customer_id INTEGER REFERENCES customers(id)"))
            print("Added customer_id to sale_returns")
        except Exception as e:
            print(f"sale_returns migration error (might already exist): {e}")

        print("Migrating purchase_returns table...")
        try:
            await conn.execute(text("ALTER TABLE purchase_returns ADD COLUMN supplier_id INTEGER REFERENCES suppliers(id)"))
            print("Added supplier_id to purchase_returns")
        except Exception as e:
            print(f"purchase_returns migration error (might already exist): {e}")

    print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate())
