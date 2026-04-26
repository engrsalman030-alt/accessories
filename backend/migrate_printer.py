import asyncio
from sqlalchemy import text
from database import engine

async def migrate():
    async with engine.begin() as conn:
        print("Migrating settings table...")
        try:
            await conn.execute(text("ALTER TABLE settings ADD COLUMN printer_type VARCHAR DEFAULT 'thermal'"))
            print("Added printer_type to settings")
        except Exception as e:
            print(f"settings migration error (might already exist): {e}")

    print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate())
