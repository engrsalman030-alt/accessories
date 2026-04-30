import uvicorn
import os
import sys
import asyncio

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from init_db import init_db

if __name__ == "__main__":
    # Initialize database before starting
    print("Running database migrations...")
    try:
        asyncio.run(init_db())
    except Exception as e:
        print(f"DATABASE INIT ERROR: {e}")
    
    # Get port from environment or default to 8000
    port = int(os.environ.get("PORT", 8000))
    
    # Run uvicorn
    from main import app
    print(f"Starting server on port {port}...")
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
