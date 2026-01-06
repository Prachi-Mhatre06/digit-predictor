const pool = require('../config/database');

const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create table for storing daily digit results
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS daily_digits (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        digit1 INTEGER NOT NULL CHECK (digit1 >= 1 AND digit1 <= 200),
        digit2 INTEGER NOT NULL CHECK (digit2 >= 1 AND digit2 <= 200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_daily_digits_date ON daily_digits(date);
    `;
    
    await client.query(createTableQuery);
    await client.query('COMMIT');
    console.log('Database tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { createTables };
