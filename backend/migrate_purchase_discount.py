import asyncio
from sqlalchemy import text
from database import engine

async def migrate():
    async with engine.begin() as conn:
        print("Migrating purchases table...")
        try:
            await conn.execute(text("ALTER TABLE purchases ADD COLUMN subtotal FLOAT DEFAULT 0.0"))
            print("Added subtotal to purchases")
        except Exception as e:
            print(f"purchases subtotal migration error: {e}")

        try:
            await conn.execute(text("ALTER TABLE purchases ADD COLUMN discount FLOAT DEFAULT 0.0"))
            print("Added discount to purchases")
        except Exception as e:
            print(f"purchases discount migration error: {e}")

    print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate())
