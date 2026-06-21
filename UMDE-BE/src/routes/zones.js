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

module.exports = router;