const express = require('express');
const cors    = require('cors');
const { Pool } = require('pg');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Create table on startup
async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kudos (
      id         SERIAL PRIMARY KEY,
      name       TEXT,
      msg        TEXT,
      emoji      TEXT,
      color      TEXT,
      tilt       NUMERIC,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `);
  console.log('Database ready');
}

// GET /api/kudos
app.get('/api/kudos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM kudos ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch kudos' });
  }
});

// POST /api/kudos
app.post('/api/kudos', async (req, res) => {
  const { name, msg, emoji, color, tilt } = req.body;
  if (!name || !msg) {
    return res.status(400).json({ error: 'name and msg are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO kudos (name, msg, emoji, color, tilt) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, msg, emoji || '💜', color || '#fff9c4', tilt ?? 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save kudo' });
  }
});

init()
  .then(() => {
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch(err => {
    console.error('Failed to initialise database:', err);
    process.exit(1);
  });
