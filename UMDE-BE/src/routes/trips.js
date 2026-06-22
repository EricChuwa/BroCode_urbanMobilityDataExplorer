const express = require('express');
const router  = express.Router();
const pool    = require('../db/connection');


router.get('/', async (req, res) => {
  try {
    const {
      borough,
      time_of_day,
      min_fare,
      max_fare,
      min_distance,
      max_distance,
      limit = 100
    } = req.query;

    let query  = `
      SELECT t.*, z.borough, z.zone
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
    if (time_of_day) {
      query += ` AND t.time_of_day = $${i++}`;
      params.push(time_of_day);
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

    query += ` LIMIT $${i++}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;