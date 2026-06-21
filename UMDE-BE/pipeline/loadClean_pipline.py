import pandas as pd
import pyarrow.parquet as pq
import multiprocessing
import psutil
import os
import csv
from datetime import datetime

#  Absolute paths 
BASE_DIR      = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TRIP_DATA_DIR = os.path.join(BASE_DIR, 'data', 'raw', 'tripData')
LOOKUP_PATH   = os.path.join(BASE_DIR, 'data', 'raw', 'taxi_zone_lookup.csv')
OUTPUT_PATH   = os.path.join(BASE_DIR, 'data', 'processed', 'cleaned_trips.csv')
LOG_PATH      = os.path.join(BASE_DIR, 'data', 'processed', 'exclusion_log.csv')

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

#  Hardware detection 
def get_system_profile():
    total_ram_gb    = psutil.virtual_memory().total / (1024 ** 3)
    available_ram_gb = psutil.virtual_memory().available / (1024 ** 3)
    cpu_cores       = multiprocessing.cpu_count()

    # Use 50% of available RAM safely
    usable_ram_gb = available_ram_gb * 0.5

    # Batch size based on usable RAM
    if usable_ram_gb < 2:
        batch_size = 100_000
    elif usable_ram_gb < 4:
        batch_size = 250_000
    elif usable_ram_gb < 8:
        batch_size = 500_000
    else:
        batch_size = 1_000_000

    # Worker count — 50% of cores, min 1, max all cores
    n_workers = max(1, cpu_cores // 2)

    print('=== SYSTEM PROFILE ===')
    print(f'Total RAM:      {total_ram_gb:.1f} GB')
    print(f'Available RAM:  {available_ram_gb:.1f} GB')
    print(f'Usable RAM:     {usable_ram_gb:.1f} GB (50% of available)')
    print(f'CPU Cores:      {cpu_cores}')
    print(f'Batch size:     {batch_size:,} rows')
    print(f'Workers:        {n_workers}')
    print('======================\n')

    return batch_size, n_workers