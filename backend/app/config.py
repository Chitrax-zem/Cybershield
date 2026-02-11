# backend/app/config.py
from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # MongoDB (Atlas)
    MONGODB_URI: str = "mongodb+srv://chitranshnigam2000_db_user:Saurabh2000@cluster0.h4mbodo.mongodb.net/?appName=Cluster0"
    DATABASE_NAME: str = "malware_detection_db"

    # JWT
    SECRET_KEY: str = "8e56b7e7f79089fd16ccf47263174b70f2a6768da6e51d08"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # File Upload
    MAX_FILE_SIZE: int = 52428800  # 50MB
    # IMPORTANT: Keep leading dots and use lowercase
    ALLOWED_EXTENSIONS: List[str] = [".exe", ".apk", ".pdf", ".zip", ".dll", ".docx", ".bin", ".jar"]
    UPLOAD_DIR: str = "uploads"
    TEMP_DIR: str = "temp"

    # Security
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    # AI Model (placeholders)
    MODEL_PATH: str = "ml_model/malware_detector.pth"
    FEATURE_SIZE: int = 1000
    CONFIDENCE_THRESHOLD: float = 0.5

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# Ensure upload/temp dirs exist inside container
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.TEMP_DIR, exist_ok=True)
