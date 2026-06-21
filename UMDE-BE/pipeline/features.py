import pandas as pd
import os

# Paths
BASE_DIR    = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
INPUT_PATH  = os.path.join(BASE_DIR, 'data', 'processed', 'cleaned_trips.csv')
OUTPUT_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'enriched_trips.csv')

def calculated_features(df):
    print('Engineering features...')

    # Convert timestamps
    df['tpep_pickup_datetime']  = pd.to_datetime(df['tpep_pickup_datetime'])
    df['tpep_dropoff_datetime'] = pd.to_datetime(df['tpep_dropoff_datetime'])

    # Feature 1 — duration in minutes
    df['duration_mins'] = (
        df['tpep_dropoff_datetime'] - df['tpep_pickup_datetime']
    ).dt.total_seconds() / 60

    # Feature 2 — trip speed in mph
    df['trip_speed'] = (
        df['trip_distance'] / (df['duration_mins'] / 60)
    ).round(2)

    # Feature 3 — fare per mile
    df['fare_per_mile'] = (
        df['fare_amount'] / df['trip_distance']
    ).round(2)

    # Feature 4 — time of day category
    df['hour'] = df['tpep_pickup_datetime'].dt.hour

    def categorise_hour(h):
        if 5 <= h < 12:
            return 'morning'
        elif 12 <= h < 17:
            return 'afternoon'
        elif 17 <= h < 21:
            return 'evening'
        else:
            return 'night'

    df['time_of_day'] = df['hour'].apply(categorise_hour)

    # Feature 5 — rush hour flag
    df['is_rush_hour'] = df['hour'].apply(
        lambda h: 1 if (7 <= h <= 9 or 17 <= h <= 19) else 0
    )

    # Remove impossible speeds and fares
    before = len(df)
    df = df[df['duration_mins'] > 0]
    df = df[df['trip_speed'] > 0]
    df = df[df['trip_speed'] < 150]
    df = df[df['fare_per_mile'] > 0]
    print(f'Removed {before - len(df):,} records with invalid derived values')

    return df

def run():
    print(f'Loading cleaned data...')
    df = pd.read_csv(INPUT_PATH)
    print(f'Loaded {len(df):,} records')

    df = calculated_features(df)

    print(f'Enriched records: {len(df):,}')
    df.to_csv(OUTPUT_PATH, index=False)
    print(f'Saved to {OUTPUT_PATH}')
    print('Done.')

if __name__ == '__main__':
    run()