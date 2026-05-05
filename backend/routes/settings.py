from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from database import get_db, DATABASE_URL, engine
from routes.auth import get_current_user
from services.setting_service import get_settings, update_settings
from schemas.setting import SettingResponse, SettingUpdate
from PIL import Image
import os
import subprocess
import tempfile
from datetime import datetime
from urllib.parse import urlparse

router = APIRouter(dependencies=[Depends(get_current_user)])

@router.get("/settings", response_model=SettingResponse)
async def read_settings(db: AsyncSession = Depends(get_db)):
    return await get_settings(db)

@router.put("/settings", response_model=SettingResponse)
async def update_existing_settings(settings: SettingUpdate, db: AsyncSession = Depends(get_db)):
    try:
        return await update_settings(db, settings)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/settings/logo")
async def upload_logo(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    try:
        # Ensure directory exists
        os.makedirs("uploads/settings", exist_ok=True)
        
        # Read file contents
        contents = await file.read()
        from io import BytesIO
        image = Image.open(BytesIO(contents))
        
        # Convert to RGB if necessary (e.g. for RGBA or P)
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
            
        # Resize if too large
        image.thumbnail((500, 500))
        image_path = "uploads/settings/logo.jpg"
        image.save(image_path, "JPEG", quality=80)
        
        # Update settings with new logo URL
        settings = await get_settings(db)
        
        from sqlalchemy import update
        from models.setting import Setting
        
        stmt = update(Setting).where(Setting.id == 1).values(
            logo_url="/uploads/settings/logo.jpg"
        )
        await db.execute(stmt)
        await db.commit()
        
        return {"logo_url": "/uploads/settings/logo.jpg"}
    except Exception as e:
        print(f"LOGO UPLOAD ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

def get_db_params():
    if DATABASE_URL.startswith("sqlite"):
        return {'is_sqlite': True, 'path': DATABASE_URL.split(":///")[-1]}
    
    # Parse postgresql+asyncpg://user:pass@host:port/dbname
    parsed = urlparse(DATABASE_URL.replace('+asyncpg', ''))
    return {
        'is_sqlite': False,
        'dbname': parsed.path[1:],
        'user': parsed.username,
        'password': parsed.password,
        'host': parsed.hostname,
        'port': parsed.port or 5432
    }

@router.get("/settings/backup")
async def backup_database():
    try:
        db_params = get_db_params()
        os.makedirs("backups", exist_ok=True)
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        
        if db_params.get('is_sqlite'):
            import shutil
            filepath = f"backups/shopmanager_backup_{timestamp}.db"
            shutil.copy2(db_params['path'], filepath)
            return FileResponse(path=filepath, filename=os.path.basename(filepath), media_type="application/x-sqlite3")
            
        filepath = f"backups/shopmanager_backup_{timestamp}.dump"
        env = os.environ.copy()
        if db_params['password']:
            env['PGPASSWORD'] = db_params['password']
            
        command = ["pg_dump", "-U", db_params['user'], "-h", db_params['host'], "-p", str(db_params['port']), "-d", db_params['dbname'], "-F", "c", "-f", filepath]
        process = subprocess.run(command, env=env, capture_output=True, text=True)
        if process.returncode != 0:
            raise Exception(f"pg_dump failed: {process.stderr}")
            
        return FileResponse(path=filepath, filename=os.path.basename(filepath), media_type="application/octet-stream")
    except Exception as e:
        print(f"BACKUP ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/settings/restore")
async def restore_database(file: UploadFile = File(...)):
    try:
        db_params = get_db_params()
        
        if db_params.get('is_sqlite'):
            # Close all existing connections before overwriting the file
            await engine.dispose()
            
            import shutil
            contents = await file.read()
            with open(db_params['path'], "wb") as f:
                f.write(contents)
            return {"status": "success", "message": "Database restored successfully"}

        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".dump") as tmp:
            contents = await file.read()
            tmp.write(contents)
            tmp_path = tmp.name
            
        env = os.environ.copy()
        if db_params['password']:
            env['PGPASSWORD'] = db_params['password']
            
        command = ["pg_restore", "-U", db_params['user'], "-h", db_params['host'], "-p", str(db_params['port']), "-d", db_params['dbname'], "--clean", "-1", tmp_path]
        process = subprocess.run(command, env=env, capture_output=True, text=True)
        os.unlink(tmp_path)
        if process.returncode != 0:
            raise Exception(f"pg_restore failed: {process.stderr}")
            
        return {"status": "success", "message": "Database restored successfully"}
    except Exception as e:
        print(f"RESTORE ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/settings/factory-reset")
async def factory_reset(db: AsyncSession = Depends(get_db)):
    try:
        # Tables to truncate
        tables = [
            "ledger", "payments", "expenses", "sale_items", "sales", 
            "purchase_items", "purchases", "customers", "suppliers", 
            "products", "brands", "categories"
        ]
        
        # Delete all data from tables in correct order (child tables first)
        for table in tables:
            await db.execute(text(f"DELETE FROM {table}"))
        
        await db.commit()
        return {"status": "success", "message": "All data has been deleted"}
    except Exception as e:
        await db.rollback()
        print(f"FACTORY RESET ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
