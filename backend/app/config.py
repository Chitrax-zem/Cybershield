# backend/app/config.py
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Union
import os
import json

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
    ALLOWED_EXTENSIONS: Union[List[str], str] = [
        ".exe",".apk",".pdf",".zip",".dll",".docx",".bin",".jar"
    ]
    UPLOAD_DIR: str = "uploads"
    TEMP_DIR: str = "temp"

    # Security - type is List[str] after parsing
    CORS_ORIGINS: Union[List[str], str] = "http://localhost:5173"

    # AI Model (placeholders)
    MODEL_PATH: str = "ml_model/malware_detector.pth"
    FEATURE_SIZE: int = 1000
    CONFIDENCE_THRESHOLD: float = 0.5

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS_ORIGINS from either JSON array or comma-separated string."""
        if isinstance(v, str):
            # Try to parse as JSON array first
            if v.strip().startswith("["):
                try:
                    return json.loads(v)
                except json.JSONDecodeError:
                    pass  # Fall through to comma-separated parsing
            # Parse as comma-separated string
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @field_validator("ALLOWED_EXTENSIONS", mode="before")
    @classmethod
    def parse_allowed_extensions(cls, v):
        """Parse ALLOWED_EXTENSIONS from either JSON array or comma-separated string."""
        if isinstance(v, str):
            # Try to parse as JSON array first
            if v.strip().startswith("["):
                try:
                    return json.loads(v)
                except json.JSONDecodeError:
                    pass  # Fall through to comma-separated parsing
            # Parse as comma-separated string
            return [ext.strip() for ext in v.split(",") if ext.strip()]
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# Ensure upload/temp dirs exist inside container
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.TEMP_DIR, exist_ok=True)