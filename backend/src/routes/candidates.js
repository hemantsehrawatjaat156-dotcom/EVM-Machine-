const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const demoStore = require('../data/demoStore');

// Get all candidates
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM candidates ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.json(demoStore.candidates);
  }
});

// Cast vote
router.post('/vote', async (req, res) => {
  const { voterId, candidateId } = req.body;

  try {
    // Check already voted
    const { rows: vRows } = await pool.query(
      'SELECT has_voted FROM voters WHERE voter_id = $1',
      [voterId]
    );
    if (!vRows.length || vRows[0].has_voted) {
      return res.status(400).json({ error: 'Invalid voter or already voted' });
    }

    // Record vote
    await pool.query('INSERT INTO votes (voter_id, candidate_id) VALUES ($1, $2)', [voterId, candidateId]);
    await pool.query('UPDATE candidates SET vote_count = vote_count + 1 WHERE id = $1', [candidateId]);
    await pool.query('UPDATE voters SET has_voted = TRUE WHERE voter_id = $1', [voterId]);

    // Get candidate info for receipt
    const { rows: cRows } = await pool.query('SELECT * FROM candidates WHERE id = $1', [candidateId]);

    res.json({ success: true, candidate: cRows[0] });
  } catch (err) {
    const candidate = demoStore.recordVote(voterId, candidateId);
    if (!candidate) {
      return res.status(400).json({ error: 'Invalid voter, candidate, or already voted' });
    }

    res.json({ success: true, candidate });
  }
});

// Get results (supreme only)
router.get('/results', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM candidates ORDER BY vote_count DESC');
    res.json(rows);
  } catch (err) {
    res.json([...demoStore.candidates].sort((a, b) => b.vote_count - a.vote_count));
  }
});

router.post('/reset', async (req, res) => {
  try {
    await pool.query('DELETE FROM votes');
    await pool.query('UPDATE voters SET has_voted = FALSE');
    await pool.query('UPDATE candidates SET vote_count = 0');
    res.json({ success: true });
  } catch (err) {
    demoStore.resetVotes();
    res.json({ success: true });
  }
});

module.exports = router;
