const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS voters (
      id SERIAL PRIMARY KEY,
      voter_id VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      has_voted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS candidates (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      party VARCHAR(100) NOT NULL,
      symbol VARCHAR(10) NOT NULL,
      vote_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS votes (
      id SERIAL PRIMARY KEY,
      voter_id VARCHAR(50) NOT NULL,
      candidate_id INTEGER NOT NULL,
      voted_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS devices (
      id SERIAL PRIMARY KEY,
      device_id VARCHAR(100) UNIQUE NOT NULL,
      role VARCHAR(20) DEFAULT 'unassigned',
      last_seen TIMESTAMP DEFAULT NOW()
    );
  `);

  // Seed candidates if empty
  const { rows } = await pool.query('SELECT COUNT(*) FROM candidates');
  if (parseInt(rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO candidates (name, party, symbol) VALUES
      ('Candidate A', 'Party Alpha', '🌸'),
      ('Candidate B', 'Party Beta', '⭐'),
      ('Candidate C', 'Party Gamma', '🌿'),
      ('Candidate D', 'Party Delta', '🔥');
    `);
  }

  // Seed test voters if empty
  const { rows: vRows } = await pool.query('SELECT COUNT(*) FROM voters');
  if (parseInt(vRows[0].count) === 0) {
    await pool.query(`
      INSERT INTO voters (voter_id, name) VALUES
      ('VOTER001', 'Hemant Kumar'),
      ('VOTER002', 'Amit Sharma'),
      ('VOTER003', 'Priya Singh'),
      ('VOTER004', 'Rahul Verma'),
      ('VOTER005', 'Neha Gupta');
    `);
  }

  console.log('✅ Database initialized');
};

module.exports = { pool, initDB };
