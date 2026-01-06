const XLSX = require('xlsx');

// Create sample data
const sampleData = [
  { Date: '2025-01-01', Digit1: 45, Digit2: 123 },
  { Date: '2025-01-02', Digit1: 78, Digit2: 156 },
  { Date: '2025-01-03', Digit1: 12, Digit2: 89 },
  { Date: '2025-01-04', Digit1: 167, Digit2: 34 },
  { Date: '2025-01-05', Digit1: 99, Digit2: 145 },
];

// Create workbook and worksheet
const ws = XLSX.utils.json_to_sheet(sampleData);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Digit Data');

// Set column widths for better readability
ws['!cols'] = [
  { wch: 12 }, // Date column
  { wch: 10 }, // Digit1 column
  { wch: 10 }, // Digit2 column
];

// Write file
const filename = 'sample_data_template.xlsx';
XLSX.writeFile(wb, filename);

console.log(`✓ Sample template created: ${filename}`);
console.log('\nYou can now:');
console.log('1. Open the file in Excel');
console.log('2. Add your historical data (following the same format)');
console.log('3. Run: npm run import sample_data_template.xlsx');
