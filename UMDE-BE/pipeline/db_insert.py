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
    
#  Insert trips 
def insert_trips(conn):
    print('Inserting trips in batches...')
    df = pd.read_csv(ENRICHED_PATH)
    print(f'Loaded {len(df):,} enriched records')

    # Select only columns that match schema
    df = df[[
        'tpep_pickup_datetime',
        'tpep_dropoff_datetime',
        'PULocationID',
        'DOLocationID',
        'trip_distance',
        'fare_amount',
        'total_amount',
        'payment_type',
        'RatecodeID',
        'duration_mins',
        'trip_speed',
        'fare_per_mile',
        'time_of_day'
    ]]

    df.columns = [
        'pickup_datetime',
        'dropoff_datetime',
        'pu_location_id',
        'do_location_id',
        'trip_distance',
        'fare_amount',
        'total_amount',
        'payment_type',
        'rate_code_id',
        'duration_mins',
        'trip_speed',
        'fare_per_mile',
        'time_of_day'
    ]

    # Replace NaN with None for PostgreSQL
    df = df.where(pd.notnull(df), None)

    cursor = conn.cursor()

    # Speed optimizations
    cursor.execute('TRUNCATE trips')
    cursor.execute('ALTER TABLE trips SET UNLOGGED')
    conn.commit()

    total    = len(df)
    inserted = 0

    for i in range(0, total, BATCH_SIZE):
        batch   = df.iloc[i:i + BATCH_SIZE]
        records = [tuple(row) for row in batch.itertuples(index=False)]
        psycopg2.extras.execute_values(
            cursor,
            '''
            INSERT INTO trips (
                pickup_datetime, dropoff_datetime,
                pu_location_id, do_location_id,
                trip_distance, fare_amount, total_amount,
                payment_type, rate_code_id,
                duration_mins, trip_speed, fare_per_mile,
                time_of_day
            ) VALUES %s
            ''',
            records
        )
        conn.commit()
        inserted += len(batch)
        print(f'Inserted {inserted:,} / {total:,}', end='\r')

    # Restore logging
    cursor.execute('ALTER TABLE trips SET LOGGED')
    conn.commit()
    cursor.close()
    print(f'\nAll {inserted:,} trips inserted successfully')