const XLSX = require('xlsx');
const pool = require('../config/database');
const path = require('path');

/**
 * Import data from Excel file to database
 * 
 * Excel format expected:
 * Column A: Date (format: YYYY-MM-DD or MM/DD/YYYY)
 * Column B: Digit 1 (0-1000)
 * Column C: Digit 2 (0-1000)
 * 
 * Example:
 * Date         | Digit1 | Digit2
 * 2025-01-01   | 45     | 123
 * 2025-01-02   | 78     | 156
 */

const importData = async (filePath) => {
  try {
    console.log(`Reading Excel file: ${filePath}`);
    
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Found ${data.length} rows in Excel file`);
    
    if (data.length === 0) {
      console.log('No data to import');
      return;
    }
    
    // Connect to database
    const client = await pool.connect();
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    try {
      for (const row of data) {
        // Support multiple column name variations
        const date = row.Date || row.date || row.DATE;
        const digit1 = row.Digit1 || row.digit1 || row.DIGIT1 || row['Digit 1'];
        const digit2 = row.Digit2 || row.digit2 || row.DIGIT2 || row['Digit 2'];
        
        if (!date || !digit1 || !digit2) {
          console.log(`Skipping row: Missing data - Date: ${date}, Digit1: ${digit1}, Digit2: ${digit2}`);
          skipped++;
          continue;
        }
        
        // Parse date (handle both Excel serial dates and string dates)
        let dateStr;
        if (typeof date === 'number') {
          // Excel serial date
          const excelDate = XLSX.SSF.parse_date_code(date);
          dateStr = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
        } else {
          // String date - try to parse
          const parsedDate = new Date(date);
          if (isNaN(parsedDate)) {
            console.log(`Skipping row: Invalid date format - ${date}`);
            skipped++;
            continue;
          }
          dateStr = parsedDate.toISOString().split('T')[0];
        }
        
        // Validate digits
        const d1 = parseInt(digit1);
        const d2 = parseInt(digit2);
        
        if (isNaN(d1) || isNaN(d2) || d1 < 0 || d1 > 1000 || d2 < 0 || d2 > 1000) {
          console.log(`Skipping row: Invalid digits - Digit1: ${d1}, Digit2: ${d2}`);
          skipped++;
          continue;
        }
        
        try {
          // Insert or update
          await client.query(
            `INSERT INTO daily_digits (date, digit1, digit2)
             VALUES ($1, $2, $3)
             ON CONFLICT (date) 
             DO UPDATE SET digit1 = $2, digit2 = $3`,
            [dateStr, d1, d2]
          );
          imported++;
          console.log(`✓ Imported: ${dateStr} - Digit1: ${d1}, Digit2: ${d2}`);
        } catch (err) {
          console.error(`✗ Error importing row (${dateStr}):`, err.message);
          errors++;
        }
      }
      
      console.log('\n=== Import Summary ===');
      console.log(`Total rows: ${data.length}`);
      console.log(`Imported: ${imported}`);
      console.log(`Skipped: ${skipped}`);
      console.log(`Errors: ${errors}`);
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Get file path from command line argument
const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node scripts/importFromExcel.js <path-to-excel-file>');
  console.error('Example: node scripts/importFromExcel.js data.xlsx');
  process.exit(1);
}

// Check if file exists
const fs = require('fs');
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

importData(filePath)
  .then(() => {
    console.log('\nImport completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nImport failed:', error);
    process.exit(1);
  });
