const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const demoStore = require('../data/demoStore');

// Verify voter by ID
router.post('/verify', async (req, res) => {
  const { voterId } = req.body;
  if (!voterId) return res.status(400).json({ error: 'Voter ID required' });

  try {
    const { rows } = await pool.query(
      'SELECT * FROM voters WHERE voter_id = $1',
      [voterId.toUpperCase()]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Voter not found' });

    const voter = rows[0];
    if (voter.has_voted) return res.status(400).json({ error: 'Voter has already voted' });

    res.json({ success: true, voter: { id: voter.voter_id, name: voter.name } });
  } catch (err) {
    const voter = demoStore.findVoter(voterId);
    if (!voter) return res.status(404).json({ error: 'Voter not found' });
    if (voter.has_voted) return res.status(400).json({ error: 'Voter has already voted' });

    res.json({ success: true, voter: { id: voter.voter_id, name: voter.name } });
  }
});

// Get all voters (supreme only)
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT voter_id, name, has_voted FROM voters ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.json(demoStore.voters);
  }
});

module.exports = router;
