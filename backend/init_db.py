import asyncio
from database import engine, Base
import models  # This ensures all models are imported and registered with Base.metadata

async def init_db():
    print("Initializing database...")
    async with engine.begin() as conn:
        # Create all tables defined in models
        await conn.run_sync(Base.metadata.create_all)
    print("Database initialized successfully.")

if __name__ == "__main__":
    asyncio.run(init_db())
