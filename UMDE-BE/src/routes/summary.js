const express = require('express');
const router  = express.Router();
const pool    = require('../db/connection');

// GET /api/summary/by-hour
router.get('/by-hour', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        EXTRACT(HOUR FROM pickup_datetime) AS hour,
        COUNT(*) AS trip_count,
        ROUND(AVG(fare_amount)::numeric, 2) AS avg_fare,
        ROUND(AVG(trip_speed)::numeric, 2) AS avg_speed
      FROM trips
      GROUP BY hour
      ORDER BY hour
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/summary/by-borough
router.get('/by-borough', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        z.borough,
        COUNT(*) AS trip_count,
        ROUND(AVG(t.fare_amount)::numeric, 2) AS avg_fare,
        ROUND(AVG(t.trip_distance)::numeric, 2) AS avg_distance,
        ROUND(AVG(t.fare_per_mile)::numeric, 2) AS avg_fare_per_mile,
        ROUND(AVG(t.trip_speed)::numeric, 2) AS avg_speed
      FROM trips t
      LEFT JOIN zones z ON t.pu_location_id = z.location_id
      WHERE z.borough IS NOT NULL
      GROUP BY z.borough
      ORDER BY COUNT(*) DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/summary/by-time-of-day
router.get('/by-time-of-day', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        time_of_day,
        COUNT(*) AS trip_count,
        ROUND(AVG(fare_amount)::numeric, 2) AS avg_fare,
        ROUND(AVG(trip_speed)::numeric, 2) AS avg_speed
      FROM trips
      GROUP BY time_of_day
      ORDER BY trip_count DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;