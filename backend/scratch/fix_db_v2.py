import asyncio
from database import engine
from sqlalchemy import text

async def fix_schema():
    # Columns to check for suppliers
    supplier_columns = [
        ("email", "VARCHAR(100)"),
        ("notes", "TEXT"),
        ("company", "VARCHAR(150)"),
        ("address", "TEXT"),
        ("phone", "VARCHAR(20)"),
        ("outstanding_balance", "FLOAT DEFAULT 0.0"),
        ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
        ("updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    ]
    
    for col_name, col_type in supplier_columns:
        async with engine.begin() as conn:
            try:
                await conn.execute(text(f"ALTER TABLE suppliers ADD COLUMN {col_name} {col_type}"))
                print(f"Added column '{col_name}' to 'suppliers'.")
            except Exception as e:
                if "already exists" in str(e):
                    pass
                else:
                    print(f"Error adding '{col_name}' to 'suppliers': {e}")

    # Columns to check for products
    product_columns = [
        ("barcode", "VARCHAR"),
        ("image_url", "VARCHAR"),
        ("is_active", "BOOLEAN DEFAULT TRUE"),
        ("updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    ]
    
    for col_name, col_type in product_columns:
        async with engine.begin() as conn:
            try:
                await conn.execute(text(f"ALTER TABLE products ADD COLUMN {col_name} {col_type}"))
                print(f"Added column '{col_name}' to 'products'.")
            except Exception as e:
                if "already exists" in str(e):
                    pass
                else:
                    print(f"Error adding '{col_name}' to 'products': {e}")

if __name__ == "__main__":
    asyncio.run(fix_schema())
