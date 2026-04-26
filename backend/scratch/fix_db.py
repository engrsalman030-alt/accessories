import asyncio
from database import engine
from sqlalchemy import text

async def fix_schema():
    # Try adding the email column
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE suppliers ADD COLUMN email VARCHAR(100)"))
            print("Column 'email' added successfully.")
        except Exception as e:
            if "already exists" in str(e):
                print("Column 'email' already exists.")
            else:
                print(f"Error adding column: {e}")

if __name__ == "__main__":
    asyncio.run(fix_schema())
