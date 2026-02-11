# app/utils/database.py
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
from app.config import settings

class Database:
    client: Optional[AsyncIOMotorClient] = None
    _db: Optional[AsyncIOMotorDatabase] = None

    async def connect(self):
        """Connect to MongoDB"""
        if self.client is None:
            self.client = AsyncIOMotorClient(settings.MONGODB_URI)
            self._db = self.client[settings.DATABASE_NAME]
            print(f"Connected to MongoDB: {settings.MONGODB_URI}")

    async def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            print("Disconnected from MongoDB")
        self.client = None
        self._db = None

    def get_database(self) -> AsyncIOMotorDatabase:
        """Get database instance"""
        if self._db is None:
            raise RuntimeError("Database not initialized. Call connect() first.")
        return self._db

# Global database instance
database = Database()

async def get_database() -> AsyncIOMotorDatabase:
    """Dependency to get database"""
    return database.get_database()
