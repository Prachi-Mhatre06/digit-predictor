const pool = require('../config/database');

/**
 * Update database to allow digits from 0 to 1000
 * This script drops the old constraints and adds new ones
 */

const updateDigitRange = async () => {
  const client = await pool.connect();
  try {
    console.log('Updating digit range constraints...');
    
    await client.query('BEGIN');
    
    // Drop old constraints
    await client.query(`
      ALTER TABLE daily_digits 
      DROP CONSTRAINT IF EXISTS daily_digits_digit1_check;
    `);
    
    await client.query(`
      ALTER TABLE daily_digits 
      DROP CONSTRAINT IF EXISTS daily_digits_digit2_check;
    `);
    
    // Add new constraints (0-1000)
    await client.query(`
      ALTER TABLE daily_digits 
      ADD CONSTRAINT daily_digits_digit1_check 
      CHECK (digit1 >= 0 AND digit1 <= 1000);
    `);
    
    await client.query(`
      ALTER TABLE daily_digits 
      ADD CONSTRAINT daily_digits_digit2_check 
      CHECK (digit2 >= 0 AND digit2 <= 1000);
    `);
    
    await client.query('COMMIT');
    console.log('✓ Digit range updated successfully (0-1000)');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating digit range:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

updateDigitRange()
  .then(() => {
    console.log('\nDatabase update completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nDatabase update failed:', error);
    process.exit(1);
  });
