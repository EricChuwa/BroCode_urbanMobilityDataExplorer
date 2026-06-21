import pandas as pd
import pyarrow.parquet as pq
import os

BASE_DIR     = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PARQUET_PATH = os.path.join(BASE_DIR, 'data', 'raw', 'yellow_tripdata_2026-01.parquet')
LOOKUP_PATH  = os.path.join(BASE_DIR, 'data', 'raw', 'taxi_zone_lookup.csv')

def inspect():
    print('=== INSPECTING PARQUET FILE ===')
    print(f'Looking in: {PARQUET_PATH}')
    
    parquet_file = pq.ParquetFile(PARQUET_PATH)
    first_batch  = next(parquet_file.iter_batches(batch_size=5))
    df           = first_batch.to_pandas()

    print(f'Columns: {list(df.columns)}')
    print(f'\nFirst 5 rows:')
    print(df.head())
    print(f'\nData types:')
    print(df.dtypes)
    print(f'\nTotal rows: {parquet_file.metadata.num_rows:,}')

    print('\n=== INSPECTING ZONE LOOKUP ===')
    lookup = pd.read_csv(LOOKUP_PATH)
    print(f'Columns: {list(lookup.columns)}')
    print(f'Rows: {len(lookup)}')
    print(lookup.head())

if __name__ == '__main__':
    inspect()