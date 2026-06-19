-- Zones dimension table
CREATE TABLE IF NOT EXISTS zones (
    location_id INTEGER PRIMARY KEY,
    borough VARCHAR(50),
    zone VARCHAR(100),
    service_zone VARCHAR(50)
);

-- Trips fact table
CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    pickup_datetime TIMESTAMP,
    dropoff_datetime TIMESTAMP,
    pu_location_id INTEGER REFERENCES zones(location_id),
    do_location_id INTEGER REFERENCES zones(location_id),
    trip_distance FLOAT,
    fare_amount FLOAT,
    total_amount FLOAT,
    payment_type INTEGER,
    rate_code_id INTEGER,
    duration_mins FLOAT,
    trip_speed FLOAT,
    fare_per_mile FLOAT,
    time_of_day VARCHAR(20)
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_pickup_datetime ON trips(pickup_datetime);
CREATE INDEX IF NOT EXISTS idx_pu_location ON trips(pu_location_id);
CREATE INDEX IF NOT EXISTS idx_do_location ON trips(do_location_id);
CREATE INDEX IF NOT EXISTS idx_time_of_day ON trips(time_of_day);
CREATE INDEX IF NOT EXISTS idx_fare_amount ON trips(fare_amount);