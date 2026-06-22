const express = require('express');
const router  = express.Router();
const pool    = require('../db/connection');
const { rankZonesByTripCount } = require('../utils/algorithm');

// GET /api/zones
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM zones ORDER BY borough, zone'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/zones/top-pickup
router.get('/top-pickup', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Fetch all zones with trip counts from DB
    const result = await pool.query(`
      SELECT z.zone, z.borough, COUNT(*) AS trip_count
      FROM trips t
      LEFT JOIN zones z ON t.pu_location_id = z.location_id
      WHERE z.borough IS NOT NULL
      AND z.borough != 'NaN'
      GROUP BY z.zone, z.borough
    `);

    // Rank using custom merge sort — not JS built-in sort
    const ranked = rankZonesByTripCount(result.rows, parseInt(limit));
    res.json(ranked);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/zones/:locationId/summary
router.get('/:locationId/summary', async (req, res) => {
  try {
    const { locationId } = req.params;

    const result = await pool.query(`
      SELECT
        z.zone,
        z.borough,
        COUNT(*) AS trip_count,
        ROUND(AVG(t.fare_amount)::numeric, 2) AS avg_fare,
        ROUND(AVG(t.trip_distance)::numeric, 2) AS avg_distance,
        ROUND(AVG(t.trip_speed)::numeric, 2) AS avg_speed,
        EXTRACT(HOUR FROM t.pickup_datetime) AS peak_hour
      FROM trips t
      LEFT JOIN zones z ON t.pu_location_id = z.location_id
      WHERE t.pu_location_id = $1
      GROUP BY z.zone, z.borough, peak_hour
      ORDER BY COUNT(*) DESC
      LIMIT 1
    `, [parseInt(locationId)]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/zones/:locationId/by-hour
router.get('/:locationId/by-hour', async (req, res) => {
  try {
    const { locationId } = req.params;

    const result = await pool.query(`
      SELECT
        EXTRACT(HOUR FROM pickup_datetime) AS hour,
        COUNT(*) AS trip_count
      FROM trips
      WHERE pu_location_id = $1
      GROUP BY hour
      ORDER BY hour
    `, [parseInt(locationId)]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/zones/activity
router.get('/activity', async (req, res) => {
  try {
    const {
      borough,
      min_fare,
      max_fare,
      min_distance,
      max_distance,
      hour_start,
      hour_end
    } = req.query;

    let query = `
      SELECT
        z.zone,
        z.borough,
        t.pu_location_id,
        COUNT(*) AS trip_count,
        ROUND(AVG(t.fare_amount)::numeric, 2) AS avg_fare,
        ROUND(AVG(t.trip_distance)::numeric, 2) AS avg_distance
      FROM trips t
      LEFT JOIN zones z ON t.pu_location_id = z.location_id
      WHERE 1=1
    `;

    const params = [];
    let i = 1;

    if (borough) {
      query += ` AND z.borough = $${i++}`;
      params.push(borough);
    }
    if (min_fare) {
      query += ` AND t.fare_amount >= $${i++}`;
      params.push(parseFloat(min_fare));
    }
    if (max_fare) {
      query += ` AND t.fare_amount <= $${i++}`;
      params.push(parseFloat(max_fare));
    }
    if (min_distance) {
      query += ` AND t.trip_distance >= $${i++}`;
      params.push(parseFloat(min_distance));
    }
    if (max_distance) {
      query += ` AND t.trip_distance <= $${i++}`;
      params.push(parseFloat(max_distance));
    }
    if (hour_start !== undefined) {
      query += ` AND EXTRACT(HOUR FROM t.pickup_datetime) >= $${i++}`;
      params.push(parseInt(hour_start));
    }
    if (hour_end !== undefined) {
      query += ` AND EXTRACT(HOUR FROM t.pickup_datetime) <= $${i++}`;
      params.push(parseInt(hour_end));
    }

    query += `
      GROUP BY z.zone, z.borough, t.pu_location_id
      ORDER BY trip_count DESC
      LIMIT 20
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;