# Excel Import Guide

## How to Import Data from Excel

### Step 1: Prepare Your Excel File

Your Excel file should have the following format:

| Date       | Digit1 | Digit2 |
|------------|--------|--------|
| 2025-01-01 | 45     | 123    |
| 2025-01-02 | 78     | 156    |
| 2025-01-03 | 12     | 89     |

**Requirements:**
- **Column A**: Date (format: YYYY-MM-DD, MM/DD/YYYY, or Excel date)
- **Column B**: Digit1 (number between 1-200)
- **Column C**: Digit2 (number between 1-200)
- **First row**: Should contain headers (Date, Digit1, Digit2)

**Supported column names:**
- Date: `Date`, `date`, `DATE`
- Digit1: `Digit1`, `digit1`, `DIGIT1`, `Digit 1`
- Digit2: `Digit2`, `digit2`, `DIGIT2`, `Digit 2`

### Step 2: Run the Import Script

**Option 1: Using npm script**
```bash
npm run import path/to/your/file.xlsx
```

**Option 2: Using node directly**
```bash
node scripts/importFromExcel.js path/to/your/file.xlsx
```

**Examples:**
```bash
# Import from current directory
npm run import data.xlsx

# Import from specific path
npm run import D:/Downloads/digit_data.xlsx

# Import from relative path
npm run import ../data/historical_data.xlsx
```

### Step 3: Verify Import

The script will show:
- Number of rows processed
- Successfully imported entries
- Skipped rows (with reasons)
- Any errors encountered

**Example output:**
```
Reading Excel file: data.xlsx
Found 100 rows in Excel file
✓ Imported: 2025-01-01 - Digit1: 45, Digit2: 123
✓ Imported: 2025-01-02 - Digit1: 78, Digit2: 156
Skipping row: Invalid date format - invalid-date

=== Import Summary ===
Total rows: 100
Imported: 98
Skipped: 2
Errors: 0
```

## Features

- **Automatic date parsing**: Handles multiple date formats
- **Validation**: Ensures digits are between 1-200
- **Duplicate handling**: Updates existing entries if date already exists
- **Error reporting**: Shows which rows were skipped and why
- **Progress tracking**: Real-time feedback during import

## Troubleshooting

**"File not found" error:**
- Check the file path is correct
- Use absolute path or relative path from project root

**"Invalid date format" warnings:**
- Ensure dates are in a recognized format (YYYY-MM-DD recommended)
- Check that date cells in Excel are formatted as dates, not text

**"Invalid digits" warnings:**
- Verify all digit values are numbers between 1 and 200
- Check for empty cells or non-numeric values

**Database connection errors:**
- Ensure your `.env` file has correct database credentials
- Make sure PostgreSQL is running
