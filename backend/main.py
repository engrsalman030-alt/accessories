from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import traceback
import os
from config import settings
from utils.logger import logger
from utils.license import verify_license
from database import async_session
import time

app = FastAPI(title="Shop Management API", version="1.0.0")

# 1. SMART LOGGING INTEGRATION
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    if response.status_code >= 400:
        logger.warning(f"{request.method} {request.url.path} - {response.status_code} ({process_time:.2f}ms)")
    return response

# 2. LICENSE CHECK MIDDLEWARE
@app.middleware("http")
async def license_check_middleware(request: Request, call_next):
    skip_paths = ["/auth", "/health", "/settings", "/uploads", "/docs", "/openapi.json"]
    if any(request.url.path.startswith(p) for p in skip_paths):
        return await call_next(request)
        
    async with async_session() as db:
        is_valid, message = await verify_license(db)
        if not is_valid:
            logger.error(f"LICENSE ALERT: Access denied for {request.url.path}. Reason: {message}")
            return JSONResponse(
                status_code=402, 
                content={"detail": message, "license_expired": True}
            )
            
    return await call_next(request)

# 3. UPDATED GLOBAL EXCEPTION HANDLER
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = f"CRITICAL ERROR: {str(exc)}\nPath: {request.url.path}\nMethod: {request.method}"
    logger.error(error_msg)
    logger.error(traceback.format_exc())

    origin = request.headers.get("origin")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please check system logs.", "type": type(exc).__name__},
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

# Ensure the upload directory exists before mounting to prevent startup crash
if not os.path.exists(settings.upload_dir):
    os.makedirs(settings.upload_dir, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

@app.get("/health")
async def health():
    return {"status": "ok"}

# include routers
from routes import auth, products, suppliers, customers, purchases, sales, reports, payments, expenses, settings, expense_categories, returns

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(products.router, prefix="", tags=["Products"])
app.include_router(suppliers.router, prefix="", tags=["Suppliers"])
app.include_router(expenses.router, prefix="", tags=["expenses"])
app.include_router(expense_categories.router, prefix="", tags=["Expense Categories"])
app.include_router(payments.router, prefix="", tags=["Payments"])
app.include_router(customers.router, prefix="", tags=["Customers"])
app.include_router(purchases.router, prefix="", tags=["Purchases"])
app.include_router(sales.router, prefix="", tags=["Sales"])
app.include_router(reports.router, prefix="", tags=["Reports"])
app.include_router(settings.router, prefix="", tags=["Settings"])
app.include_router(returns.router, prefix="", tags=["Returns"])