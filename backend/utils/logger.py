import logging
import os
from logging.handlers import MemoryHandler
from datetime import datetime

# Directory for error logs
# We use the user's Documents folder to ensure it is writable even in a packaged app (DMG)
home = os.path.expanduser("~")
LOG_DIR = os.path.join(home, "Documents", "ShopManager", "logs")

try:
    os.makedirs(LOG_DIR, exist_ok=True)
except Exception:
    # Fallback to a temporary directory if Documents is somehow inaccessible
    import tempfile
    LOG_DIR = os.path.join(tempfile.gettempdir(), "ShopManager", "logs")
    os.makedirs(LOG_DIR, exist_ok=True)

class ErrorOnlyFileHandler(logging.FileHandler):
    """A file handler that only writes if the record is ERROR or above."""
    def emit(self, record):
        if record.levelno >= logging.ERROR:
            super().emit(record)

def setup_logger():
    logger = logging.getLogger("shop_app")
    logger.setLevel(logging.INFO)

    # Console handler for real-time visibility (captured by Electron)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    # File handler for errors only
    log_file = os.path.join(LOG_DIR, f"error_{datetime.now().strftime('%Y-%m-%d')}.log")
    file_handler = ErrorOnlyFileHandler(log_file)
    file_handler.setLevel(logging.ERROR)
    file_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s\n%(pathname)s:%(lineno)d\n')
    file_handler.setFormatter(file_formatter)
    
    # Memory handler to buffer logs and flush on error
    # We buffer INFO logs but only write to file if an ERROR occurs
    memory_handler = MemoryHandler(capacity=100, flushLevel=logging.ERROR, target=file_handler)
    logger.addHandler(memory_handler)

    return logger

logger = setup_logger()
