const express = require('express');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const { createTables } = require('./scripts/initDb');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.use('/api', apiRoutes);

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Temporary migration endpoint - DELETE AFTER RUNNING ONCE
app.get('/run-migration-update-range', async (req, res) => {
  const pool = require('./config/database');
  const client = await pool.connect();
  
  try {
    await client.query('ALTER TABLE daily_digits DROP CONSTRAINT IF EXISTS daily_digits_digit1_check');
    await client.query('ALTER TABLE daily_digits DROP CONSTRAINT IF EXISTS daily_digits_digit2_check');
    await client.query('ALTER TABLE daily_digits ADD CONSTRAINT daily_digits_digit1_check CHECK (digit1 >= 0 AND digit1 <= 1000)');
    await client.query('ALTER TABLE daily_digits ADD CONSTRAINT daily_digits_digit2_check CHECK (digit2 >= 0 AND digit2 <= 1000)');
    
    res.json({ 
      success: true, 
      message: 'Migration completed! Database now accepts digits 0-1000. REMOVE THIS ENDPOINT NOW!' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('Initializing database...');
    await createTables();
    
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Database: ${process.env.DB_NAME}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
