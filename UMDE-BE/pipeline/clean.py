import pandas as pd
import pyarrow.parquet as pq
import multiprocessing
import os
import csv
from datetime import datetime

#  Absolute paths 
BASE_DIR     = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PARQUET_PATH = os.path.join(BASE_DIR, 'data', 'raw', 'yellow_tripdata_2026-01.parquet')
LOOKUP_PATH  = os.path.join(BASE_DIR, 'data', 'raw', 'taxi_zone_lookup.csv')
OUTPUT_PATH  = os.path.join(BASE_DIR, 'data', 'processed', 'cleaned_trips.csv')
LOG_PATH     = os.path.join(BASE_DIR, 'data', 'processed', 'exclusion_log.csv')

#  Columns we need 
COLUMNS = [
    'tpep_pickup_datetime',
    'tpep_dropoff_datetime',
    'trip_distance',
    'fare_amount',
    'total_amount',
    'PULocationID',
    'DOLocationID',
    'payment_type',
    'RatecodeID',
    'Airport_fee'
]

#  Exclusion log 
os.makedirs(os.path.join(BASE_DIR, 'data', 'processed'), exist_ok=True)
exclusion_log = []

def log_exclusion(reason, count):
    if count > 0:
        exclusion_log.append({
            'timestamp': datetime.now().isoformat(),
            'reason': reason,
            'records_removed': count
        })

#  Clean a single chunk 
def clean_chunk(chunk):
    # Duplicates
    before = len(chunk)
    chunk = chunk.drop_duplicates()
    log_exclusion('duplicates', before - len(chunk))

    # Missing values
    before = len(chunk)
    chunk = chunk.dropna(subset=COLUMNS)
    log_exclusion('missing_values', before - len(chunk))

    # Logical outliers
    before = len(chunk)
    chunk = chunk[chunk['fare_amount'] > 0]
    chunk = chunk[chunk['trip_distance'] > 0]
    chunk = chunk[chunk['total_amount'] > 0]
    chunk = chunk[
        chunk['tpep_dropoff_datetime'] > 
        chunk['tpep_pickup_datetime']
    ]
    log_exclusion('logical_outliers', before - len(chunk))

    # Extreme outliers
    before = len(chunk)
    chunk = chunk[chunk['trip_distance'] < 100]
    chunk = chunk[chunk['fare_amount'] < 500]
    log_exclusion('extreme_outliers', before - len(chunk))

    chunk['PULocationID'] = chunk['PULocationID'].astype('int16')
    chunk['DOLocationID'] = chunk['DOLocationID'].astype('int16')
    chunk['payment_type'] = chunk['payment_type'].astype('int8')
    chunk['fare_amount']  = chunk['fare_amount'].astype('float32')
    chunk['trip_distance']= chunk['trip_distance'].astype('float32')
    chunk['total_amount'] = chunk['total_amount'].astype('float32')

    return chunk
