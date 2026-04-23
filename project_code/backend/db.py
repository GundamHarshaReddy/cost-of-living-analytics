import os
import logging
from azure.cosmos import CosmosClient, PartitionKey
import pandas as pd
from typing import List, Dict, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
# Support both separate Endpoint/Key and full Connection String
COSMOS_CONNECTION_STRING = os.environ.get("AZURE_COSMOS_CONNECTION_STRING")
COSMOS_ENDPOINT = os.environ.get("COSMOS_ENDPOINT")
COSMOS_KEY = os.environ.get("COSMOS_KEY")
DATABASE_NAME = "LivingCostDB"
CONTAINER_NAME = "Cities"

class Database:
    def __init__(self):
        self.client = None
        self.container = None
        
        try:
            if COSMOS_CONNECTION_STRING:
                self.client = CosmosClient.from_connection_string(COSMOS_CONNECTION_STRING)
            elif COSMOS_ENDPOINT and COSMOS_KEY:
                self.client = CosmosClient(COSMOS_ENDPOINT, credential=COSMOS_KEY)
            
            if self.client:
                self.database = self.client.create_database_if_not_exists(id=DATABASE_NAME)
                self.container = self.database.create_container_if_not_exists(
                    id=CONTAINER_NAME,
                    partition_key=PartitionKey(path="/city"),
                    offer_throughput=400
                )
                logger.info("Connected to Cosmos DB")
            else:
                logger.warning("No Cosmos DB credentials found. Running in offline/CSV mode.")
        except Exception as e:
            logger.error(f"Failed to connect to Cosmos DB: {e}")
            self.client = None

    def get_city(self, city_name: str) -> Optional[Dict]:
        """Fetch city data from Cosmos DB"""
        if not self.container:
            return None
        
        try:
            query = "SELECT * FROM c WHERE c.city = @city"
            parameters = [{"name": "@city", "value": city_name}]
            items = list(self.container.query_items(
                query=query,
                parameters=parameters,
                enable_cross_partition_query=True
            ))
            return items[0] if items else None
        except Exception as e:
            logger.error(f"Error querying city {city_name}: {e}")
            return None

    def get_all_cities(self) -> List[str]:
        """Fetch all city names from Cosmos DB"""
        if not self.container:
            return []

        try:
            query = "SELECT c.city FROM c"
            items = list(self.container.query_items(
                query=query,
                enable_cross_partition_query=True
            ))
            return [item['city'] for item in items]
        except Exception as e:
            logger.error(f"Error fetching all cities: {e}")
            return []

    def seed_data(self, df: pd.DataFrame):
        """Seed data from DataFrame to Cosmos DB if empty"""
        if not self.container:
            return

        # Always sync data from CSV on startup to ensure latest data is present
        try:
            logger.info("Syncing data to Cosmos DB...")
            for _, row in df.iterrows():
                item = row.to_dict()
                # Ensure partition key is set (using 'city' as PK)
                if 'city' not in item:
                    logger.warning(f"Skipping row without city: {row}")
                    continue
                
                # Cosmos DB requires 'id' property
                item['id'] = item['city']
                
                self.container.upsert_item(item)
            logger.info("Data seeding completed.")
            
        except Exception as e:
            logger.error(f"Error seeding data: {e}")

db = Database()
