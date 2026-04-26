from database import async_session
from models.product import Category, Brand, Product
from models.supplier import Supplier
from models.customer import Customer
import asyncio

async def seed():
    async with async_session() as session:
        # categories
        cat1 = Category(name="Cables")
        cat2 = Category(name="Chargers")
        cat3 = Category(name="Earphones")
        session.add_all([cat1, cat2, cat3])

        # brands
        brand1 = Brand(name="Samsung")
        brand2 = Brand(name="Anker")
        session.add_all([brand1, brand2])

        # products
        prod1 = Product(name="USB Cable", sku="USB001", retail_price=500, wholesale_price=400, distributor_price=350, stock_qty=100, min_stock_qty=10, category=cat1, brand=brand1)
        prod2 = Product(name="Wireless Charger", sku="WC001", retail_price=2000, wholesale_price=1800, distributor_price=1600, stock_qty=50, min_stock_qty=5, category=cat2, brand=brand2)
        prod3 = Product(name="Bluetooth Earphones", sku="BE001", retail_price=3000, wholesale_price=2700, distributor_price=2500, stock_qty=30, min_stock_qty=3, category=cat3, brand=brand1)
        session.add_all([prod1, prod2, prod3])

        # suppliers
        sup1 = Supplier(name="Supplier A", phone="123456789", company="Company A", address="Address A")
        sup2 = Supplier(name="Supplier B", phone="987654321", company="Company B", address="Address B")
        session.add_all([sup1, sup2])

        # customers
        cust1 = Customer(name="Retail Customer", phone="111111111", type="retail")
        cust2 = Customer(name="Wholesale Customer", phone="222222222", business_name="Business W", type="wholesale", credit_limit=50000)
        cust3 = Customer(name="Distributor Customer", phone="333333333", business_name="Business D", type="distributor", credit_limit=100000)
        session.add_all([cust1, cust2, cust3])

        await session.commit()
    print("Seed data inserted")

if __name__ == "__main__":
    asyncio.run(seed())