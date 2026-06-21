import pandas as pd
import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOOKUP_PATH   = os.path.join(BASE_DIR, 'data', 'raw', 'taxi_zone_lookup.csv')
ENRICHED_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'enriched_trips.csv')

# Load ENV
load_dotenv(os.path.join(BASE_DIR, 'UMDE-BE', '.env'))
BATCH_SIZE = 50_000

#  Connect 
def get_connection():
    return psycopg2.connect(
        host=os.getenv('DB_HOST'),
        port=os.getenv('DB_PORT'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        dbname=os.getenv('DB_NAME')
    )