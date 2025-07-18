// backend/routes/tours.js or similar
const express = require('express');
const router = express.Router();
const db = require('../db'); // assuming you already have db connection

// GET tour by slug
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const [rows] = await db.execute(
      'SELECT * FROM tours WHERE slug = ? LIMIT 1',
      [slug]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Tour not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('❌ MySQL error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

