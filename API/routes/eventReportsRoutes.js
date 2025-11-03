const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const db = require('../config/db');

// Summary: totals per item: pending/completed
router.get('/events/:eventId/summary', auth, async (req, res) => {
  try {
    const event_id = Number(req.params.eventId);
    const [rows] = await db.execute(`
      SELECT i.id AS item_id, i.name AS item_name,
             SUM(a.status = 'pending') AS pending,
             SUM(a.status = 'completed') AS completed
      FROM event_items i
      LEFT JOIN event_item_allocations a ON a.item_id = i.id AND a.event_id = i.event_id
      WHERE i.event_id = ?
      GROUP BY i.id, i.name
      ORDER BY i.sequence ASC` , [event_id]);
    res.status(200).json({ status: 'success', data: rows });
  } catch (err) {
    console.error('reports summary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
