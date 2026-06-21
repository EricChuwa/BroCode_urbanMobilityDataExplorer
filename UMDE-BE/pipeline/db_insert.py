import pandas as pd
import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv

# Load env 
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(BASE_DIR, '.env'))

# Paths 
LOOKUP_PATH   = os.path.join(BASE_DIR, 'data', 'raw', 'taxi_zone_lookup.csv')
ENRICHED_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'enriched_trips.csv')

BATCH_SIZE = 50_000 #Setting batch size to about 50K entries to avoid memory issues during data insertion

#  Connect 
def get_connection():
    return psycopg2.connect(
        host=os.getenv('DB_HOST'),
        port=os.getenv('DB_PORT'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        dbname=os.getenv('DB_NAME')
    )

#  Drop indexes 
def drop_indexes(conn):
    print('Dropping indexes for faster insert...')
    cursor = conn.cursor()
    cursor.execute('''
        DROP INDEX IF EXISTS idx_pickup_datetime;
        DROP INDEX IF EXISTS idx_pu_location;
        DROP INDEX IF EXISTS idx_do_location;
        DROP INDEX IF EXISTS idx_time_of_day;
        DROP INDEX IF EXISTS idx_fare_amount;
    ''')
    conn.commit()
    cursor.close()
    print('Indexes dropped.')

#  Rebuild indexes 
def rebuild_indexes(conn):
    print('Rebuilding indexes...')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_pickup_datetime 
            ON trips(pickup_datetime);
        CREATE INDEX IF NOT EXISTS idx_pu_location 
            ON trips(pu_location_id);
        CREATE INDEX IF NOT EXISTS idx_do_location 
            ON trips(do_location_id);
        CREATE INDEX IF NOT EXISTS idx_time_of_day 
            ON trips(time_of_day);
        CREATE INDEX IF NOT EXISTS idx_fare_amount 
            ON trips(fare_amount);
    ''')
    conn.commit()
    cursor.close()
    print('Indexes rebuilt.')

# Insert zones 
def insert_zones(conn):
    print('Inserting zones...')
    df = pd.read_csv(LOOKUP_PATH)
    df.columns = ['location_id', 'borough', 'zone', 'service_zone']

    cursor = conn.cursor()
    cursor.execute('TRUNCATE zones CASCADE')

    records = list(df.itertuples(index=False, name=None))
    psycopg2.extras.execute_values(
        cursor,
        '''
        INSERT INTO zones (location_id, borough, zone, service_zone)
        VALUES %s
        ON CONFLICT (location_id) DO NOTHING
        ''',
        records
    )
    conn.commit()
    cursor.close()
    print(f'Inserted {len(records)} zones')

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

#  Main 
def run():
    print('Connecting to PostgreSQL...')
    conn = get_connection()
    print('Connected')

    drop_indexes(conn)
    insert_zones(conn)
    insert_trips(conn)
    rebuild_indexes(conn)

    conn.close()
    print('Done.')

if __name__ == '__main__':
    run()