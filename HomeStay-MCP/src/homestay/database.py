import os
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

class HomestayDatabase:
    _instance: Optional['HomestayDatabase'] = None
    _client: Optional[AsyncIOMotorClient] = None
    _db = None
    _connected = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    async def connect(self):
        """Connect to MongoDB with persistent connection"""
        if self._client is None or not self._connected:
            try:
                # Get MongoDB URI from environment or use default
                mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/HomestayDB')
                self._client = AsyncIOMotorClient(mongodb_uri)
                
                # Extract database name from URI or use default
                if '/' in mongodb_uri:
                    db_name = mongodb_uri.split('/')[-1]
                else:
                    db_name = 'HomestayDB'
                    
                self._db = self._client[db_name]
                
                # Test the connection
                await self._client.admin.command('ping')
                self._connected = True
                
            except Exception as e:
                self._connected = False
                raise Exception(f"Failed to connect to MongoDB: {str(e)}")
                
        return self._db
    
    async def disconnect(self):
        """Disconnect from MongoDB"""
        if self._client is not None:
            self._client.close()
            self._client = None
            self._db = None
            self._connected = False
    
    @property
    def db(self):
        return self._db
    
    @property
    def homestays(self):
        """Get the homestays collection - VERIFY THIS NAME"""
        if self._db is not None:
            # Check if this is the correct collection name in your database
            return self._db['Homestays Collection']  # Verify this matches your actual collection
        return None
    
    @property
    def is_connected(self):
        """Check if database is connected"""
        return self._connected and self._client is not None and self._db is not None

    async def verify_collection_structure(self):
        """Debug function to verify collection structure"""
        try:
            if not self.is_connected:
                await self.connect()

            collections = await self._db.list_collection_names()
            print(f"🔍 Available collections: {collections}")
            
            collection_name = 'Homestays Collection'
            if collection_name in collections:
                sample_doc = await self._db[collection_name].find_one()
                if sample_doc:
                    print(f"🔍 Sample document structure for '{collection_name}':")
                    print(f"  - Keys: {list(sample_doc.keys())}")
                    if 'features' in sample_doc and isinstance(sample_doc.get('features'), dict):
                        print(f"  - Features keys: {list(sample_doc['features'].keys())}")
                        if 'localAttractions' in sample_doc['features']:
                            print(f"  - Sample Local Attractions: {sample_doc['features']['localAttractions'][:2]}...")
            else:
                print(f"⚠️ Collection '{collection_name}' not found in database '{self._db.name}'")
            
        except Exception as e:
            print(f"🔍 Error verifying collection: {e}")

# Global database instance
db_instance = HomestayDatabase()