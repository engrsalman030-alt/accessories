import asyncio
import httpx
from config import settings
from datetime import datetime, timedelta

async def test_api():
    async with httpx.AsyncClient() as client:
        # 1. Login
        print("Logging in...")
        res = await client.post(
            f"{settings.backend_url}/auth/token",
            data={"username": settings.owner_username, "password": settings.owner_password}
        )
        if res.status_code != 200:
            print(f"Login failed: {res.text}")
            return
        
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Get profit-loss
        print("Fetching profit-loss...")
        start_date = (datetime.now() - timedelta(days=30)).isoformat()
        end_date = datetime.now().isoformat()
        res = await client.get(
            f"{settings.backend_url}/reports/profit-loss", 
            headers=headers,
            params={"start_date": start_date, "end_date": end_date}
        )
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text}")

if __name__ == "__main__":
    asyncio.run(test_api())
