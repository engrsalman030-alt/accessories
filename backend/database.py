import os
from config import settings
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Determine database path
# If we are in development, use the .env or local shop.db
# If we are in production (Documents folder exists or logic applied), use the Documents folder
DATABASE_URL = settings.database_url

if "shop.db" in DATABASE_URL:
    # Set default writable path for SQLite in production
    home = os.path.expanduser("~")
    data_dir = os.path.join(home, "Documents", "Alone-app", "data")
    os.makedirs(data_dir, exist_ok=True)
    db_path = os.path.join(data_dir, "shop.db")
    DATABASE_URL = f"sqlite+aiosqlite:///{db_path}"

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def get_db():
    async with async_session() as session:
        yield session
