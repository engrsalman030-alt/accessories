from pydantic_settings import BaseSettings
from typing import Optional
import os

# Find writable path for production
home = os.path.expanduser("~")
DOC_DIR = os.path.join(home, "Documents", "Alone-app")
UPLOAD_DIR = os.path.join(DOC_DIR, "uploads")

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///shop.db"
    secret_key: str = "7290f6719b3806282e75e921d7b42f6d234a974b974b974b974b" 
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480
    upload_dir: str = UPLOAD_DIR
    owner_username: str = "admin"
    owner_password: str = "admin123"
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()
