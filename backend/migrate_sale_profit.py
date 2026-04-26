import asyncio
from sqlalchemy import text
from database import engine

async def migrate():
    async with engine.begin() as conn:
        print("Migrating sale_items table...")
        try:
            await conn.execute(text("ALTER TABLE sale_items ADD COLUMN unit_cost FLOAT DEFAULT 0.0"))
            print("Added unit_cost to sale_items")
            
            # Populate unit_cost from current product cost_price for existing sales
            print("Populating existing unit_cost values...")
            await conn.execute(text("""
                UPDATE sale_items 
                SET unit_cost = products.cost_price 
                FROM products 
                WHERE sale_items.product_id = products.id
            """))
            print("Populated unit_cost from products table")
            
            await conn.execute(text("ALTER TABLE sale_items ALTER COLUMN unit_cost SET NOT NULL"))
        except Exception as e:
            print(f"Migration error: {e}")

    print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate())
