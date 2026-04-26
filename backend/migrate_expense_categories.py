import asyncio
from sqlalchemy import text
from database import engine

async def migrate():
    async with engine.begin() as conn:
        print("Creating expense_categories table...")
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS expense_categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR UNIQUE NOT NULL,
                description VARCHAR
            )
        """))

        # Insert defaults
        print("Inserting default categories...")
        defaults = ['Rent', 'Utilities', 'Salary', 'Marketing', 'Maintenance', 'Others']
        for cat in defaults:
            try:
                await conn.execute(text("INSERT INTO expense_categories (name) VALUES (:name) ON CONFLICT (name) DO NOTHING"), {"name": cat})
            except: pass

        print("Adding category_id to expenses...")
        try:
            # Check if column exists first
            await conn.execute(text("ALTER TABLE expenses ADD COLUMN category_id INTEGER REFERENCES expense_categories(id)"))
        except Exception as e:
            print(f"Column might already exist: {e}")

        # Migrate data
        print("Migrating existing expense categories...")
        result = await conn.execute(text("SELECT id, category FROM expenses WHERE category_id IS NULL"))
        rows = result.fetchall()
        for row in rows:
            exp_id, cat_name = row
            # Find or create category
            cat_res = await conn.execute(text("SELECT id FROM expense_categories WHERE name = :name"), {"name": cat_name})
            cat_id = cat_res.scalar()
            if not cat_id:
                insert_res = await conn.execute(text("INSERT INTO expense_categories (name) VALUES (:name) RETURNING id"), {"name": cat_name})
                cat_id = insert_res.scalar()
            
            await conn.execute(text("UPDATE expenses SET category_id = :cat_id WHERE id = :id"), {"cat_id": cat_id, "id": exp_id})

        print("Making category_id NOT NULL and dropping old column...")
        try:
            await conn.execute(text("ALTER TABLE expenses ALTER COLUMN category_id SET NOT NULL"))
            await conn.execute(text("ALTER TABLE expenses DROP COLUMN IF EXISTS category"))
        except Exception as e:
            print(f"Cleanup error: {e}")

    print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate())
