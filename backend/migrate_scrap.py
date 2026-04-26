import asyncio
from sqlalchemy import text
from database import engine

async def migrate():
    async with engine.begin() as conn:
        print("Migrating products table...")
        try:
            await conn.execute(text("ALTER TABLE products ADD COLUMN scrap_qty FLOAT DEFAULT 0.0"))
            print("Added scrap_qty to products")
        except Exception as e:
            print(f"products migration error: {e}")

        print("Migrating sale_return_items table...")
        try:
            await conn.execute(text("ALTER TABLE sale_return_items ADD COLUMN condition VARCHAR DEFAULT 'fine'"))
            print("Added condition to sale_return_items")
        except Exception as e:
            print(f"sale_return_items migration error: {e}")

        print("Migrating purchase_return_items table...")
        try:
            await conn.execute(text("ALTER TABLE purchase_return_items ADD COLUMN condition VARCHAR DEFAULT 'fine'"))
            print("Added condition to purchase_return_items")
        except Exception as e:
            print(f"purchase_return_items migration error: {e}")

    print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate())
