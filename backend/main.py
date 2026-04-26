from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi import Request
import traceback
from config import settings

app = FastAPI(title="Shop Management API", version="1.0.0")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"ERROR OCCURRED: {exc}")
    traceback.print_exc()
    origin = request.headers.get("origin")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": type(exc).__name__},
        headers={
            "Access-Control-Allow-Origin": origin if origin else "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/health")
async def health():
    return {"status": "ok"}

# include routers
from routes.auth import router as auth_router
app.include_router(auth_router, prefix="/auth", tags=["auth"])

from routes.products import router as products_router
app.include_router(products_router, prefix="", tags=["Products"])

from routes.suppliers import router as suppliers_router
app.include_router(suppliers_router, prefix="", tags=["Suppliers"])

from routes import auth, products, suppliers, customers, purchases, sales, reports, payments, expenses, settings, expense_categories
app.include_router(expenses.router, prefix="", tags=["expenses"])
app.include_router(expense_categories.router, prefix="", tags=["Expense Categories"])

from routes.payments import router as payments_router
app.include_router(payments_router, prefix="", tags=["Payments"])

from routes.customers import router as customers_router
app.include_router(customers_router, prefix="", tags=["Customers"])

from routes.purchases import router as purchases_router
app.include_router(purchases_router, prefix="", tags=["Purchases"])

from routes.sales import router as sales_router
app.include_router(sales_router, prefix="", tags=["Sales"])

from routes.reports import router as reports_router
app.include_router(reports_router, prefix="", tags=["Reports"])

from routes.settings import router as settings_router
app.include_router(settings_router, prefix="", tags=["Settings"])

from routes.returns import router as returns_router
app.include_router(returns_router, prefix="", tags=["Returns"])