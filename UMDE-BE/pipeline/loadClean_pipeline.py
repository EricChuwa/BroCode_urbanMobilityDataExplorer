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

#  Clean a single chunk 
def clean_chunk(chunk):
    local_log = []

    def log(reason, count):
        if count > 0:
            local_log.append({
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'reason': reason,
                'records_removed': count
            })

    # Duplicates
    before = len(chunk)
    chunk = chunk.drop_duplicates()
    log('duplicates_removed', before - len(chunk))

    # Missing values
    before = len(chunk)
    chunk = chunk.dropna(subset=COLUMNS)
    log('missing_values', before - len(chunk))

    # Logical outliers
    before = len(chunk)
    chunk = chunk[chunk['fare_amount'] > 0]
    chunk = chunk[chunk['trip_distance'] > 0]
    chunk = chunk[chunk['total_amount'] > 0]
    chunk = chunk[
        chunk['tpep_dropoff_datetime'] >
        chunk['tpep_pickup_datetime']
    ]
    log('logical_outliers', before - len(chunk))

    # Extreme outliers
    before = len(chunk)
    chunk = chunk[chunk['trip_distance'] < 100]
    chunk = chunk[chunk['fare_amount'] < 500]
    log('extreme_outliers', before - len(chunk))

    # Fix types
    chunk['PULocationID']  = chunk['PULocationID'].astype('int16')
    chunk['DOLocationID']  = chunk['DOLocationID'].astype('int16')
    chunk['payment_type']  = chunk['payment_type'].astype('int8')
    chunk['fare_amount']   = chunk['fare_amount'].astype('float32')
    chunk['trip_distance'] = chunk['trip_distance'].astype('float32')
    chunk['total_amount']  = chunk['total_amount'].astype('float32')

    return chunk, local_log

#  Main 
def run():
    # Detect hardware
    batch_size, n_workers = get_system_profile()

    # find all parquet files
    parquet_files = sorted([
        os.path.join(TRIP_DATA_DIR, f)
        for f in os.listdir(TRIP_DATA_DIR)
        if f.endswith('.parquet')
    ])

    print(f'Found {len(parquet_files)} parquet files:')
    total_raw = 0
    for f in parquet_files:
        pf   = pq.ParquetFile(f)
        rows = pf.metadata.num_rows
        total_raw += rows
        print(f'  {os.path.basename(f)}: {rows:,} rows')
    print(f'\nTotal raw rows: {total_raw:,}\n')

    # Load all files in batches
    print('Loading batches...')
    all_batches = []
    for path in parquet_files:
        print(f'  Loading {os.path.basename(path)}...')
        pf = pq.ParquetFile(path)
        for batch in pf.iter_batches(
            batch_size=batch_size,
            columns=COLUMNS
        ):
            all_batches.append(batch.to_pandas())

    print(f'\n{len(all_batches)} batches loaded across all files')

    # Clean in parallel
    print(f'Cleaning in parallel with {n_workers} workers...')
    os.makedirs(os.path.join(BASE_DIR, 'data', 'processed'), exist_ok=True)

    with multiprocessing.Pool(processes=n_workers) as pool:
        results = pool.map(clean_chunk, all_batches)

    cleaned_batches = [r[0] for r in results]
    all_logs        = [entry for r in results for entry in r[1]]

    # Merge
    print('Merging cleaned batches...')
    cleaned = pd.concat(cleaned_batches, ignore_index=True)

    # join with zone lookup
    print('Joining with zone lookup...')
    lookup = pd.read_csv(LOOKUP_PATH)
    cleaned = cleaned.merge(
        lookup,
        left_on='PULocationID',
        right_on='LocationID',
        how='left'
    )

    # Summary
    removed = total_raw - len(cleaned)
    print(f'\n=== PIPELINE SUMMARY ===')
    print(f'Raw rows:       {total_raw:,}')
    print(f'Clean rows:     {len(cleaned):,}')
    print(f'Removed:        {removed:,} ({removed/total_raw*100:.1f}%)')
    print(f'========================\n')

    # Save cleaned data and logs
    cleaned.to_csv(OUTPUT_PATH, index=False)
    print(f'Saved to {OUTPUT_PATH}')

    with open(LOG_PATH, 'w', newline='') as f:
        writer = csv.DictWriter(
            f,
            fieldnames=['timestamp', 'reason', 'records_removed']
        )
        writer.writeheader()
        writer.writerows(all_logs)

    print(f'Exclusion log saved to {LOG_PATH}')
    print('Done.')

if __name__ == '__main__':
    run()