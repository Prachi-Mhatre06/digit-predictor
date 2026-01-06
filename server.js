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

// Temporary endpoint to import data - DELETE AFTER USE
app.get('/import-data-from-excel-temp', async (req, res) => {
  const XLSX = require('xlsx');
  const pool = require('./config/database');
  const fs = require('fs');
  const filePath = path.join(__dirname, 'data.xlsx');
  
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'data.xlsx not found in project root' });
    }
    
    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    const client = await pool.connect();
    let imported = 0;
    let skipped = 0;
    const errors = [];
    
    try {
      for (const row of data) {
        const date = row.Date || row.date || row.DATE;
        const digit1 = row.Digit1 || row.digit1 || row.DIGIT1 || row['Digit 1'];
        const digit2 = row.Digit2 || row.digit2 || row.DIGIT2 || row['Digit 2'];
        
        if (!date || !digit1 || !digit2) {
          skipped++;
          continue;
        }
        
        // Parse date
        let dateStr;
        if (typeof date === 'number') {
          const excelDate = XLSX.SSF.parse_date_code(date);
          dateStr = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
        } else {
          const parsedDate = new Date(date);
          if (isNaN(parsedDate)) {
            skipped++;
            continue;
          }
          dateStr = parsedDate.toISOString().split('T')[0];
        }
        
        const d1 = parseInt(digit1);
        const d2 = parseInt(digit2);
        
        if (isNaN(d1) || isNaN(d2) || d1 < 0 || d1 > 1000 || d2 < 0 || d2 > 1000) {
          skipped++;
          continue;
        }
        
        try {
          await client.query(
            `INSERT INTO daily_digits (date, digit1, digit2)
             VALUES ($1, $2, $3)
             ON CONFLICT (date) 
             DO UPDATE SET digit1 = $2, digit2 = $3`,
            [dateStr, d1, d2]
          );
          imported++;
        } catch (err) {
          errors.push(`${dateStr}: ${err.message}`);
        }
      }
      
      res.json({
        success: true,
        message: 'Import completed! REMOVE THIS ENDPOINT NOW!',
        stats: {
          total: data.length,
          imported,
          skipped,
          errors: errors.length,
          errorDetails: errors.slice(0, 5)
        }
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
