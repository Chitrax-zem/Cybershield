# backend/main.py
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
from datetime import datetime

from app.config import settings
from app.utils.database import database
from app.api import auth, scan, analytics  # include routers

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting Malware Detection System...")
    print(f"📅 Startup time: {datetime.utcnow().isoformat()}")
    await database.connect()
    print("✅ Application started successfully")
    try:
        yield
    finally:
        print("🛑 Shutting down application...")
        await database.disconnect()
        print("✅ Application stopped")

app = FastAPI(
    title="AI-Powered Malware Detection System",
    description="Advanced malware detection using deep learning and explainable AI",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(scan.router)
app.include_router(analytics.router)

@app.get("/", tags=["Health"])
async def root():
    return {
        "message": "AI-Powered Malware Detection System",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "auth": "/api/auth",
            "scan": "/api/scan",
            "analytics": "/api/analytics"
        }
    }

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected" if database.client else "disconnected"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"❌ Error: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error",
            "error": str(exc),
            "path": str(request.url)
        }
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
