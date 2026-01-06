# Digit Predictor

A Node.js Express application that predicts two separate digits (1-200) for each day based on historical data stored in PostgreSQL.

## Features

- 📊 Predicts two digits based on 6 months of historical data
- 🎯 Uses multiple prediction strategies (frequency analysis, trend detection)
- 💾 PostgreSQL database for storing historical results
- 🌐 Clean web interface to view predictions and add results
- 📅 Displays predictions with today's date
- 📈 View recent history of digits

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. **Clone or download the project**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL database**
   
   Create a new database:
   ```sql
   CREATE DATABASE digit_predictor;
   ```

4. **Configure environment variables**
   
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your database credentials:
   ```
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=digit_predictor
   DB_USER=postgres
   DB_PASSWORD=yourpassword
   ```

## Running the Application

1. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

2. **Access the application**
   
   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Usage

### Viewing Predictions

The home page displays:
- Today's date
- Two predicted digits (1-200)
- Analysis information showing how many data points were used
- Recent history of actual results

### Adding Historical Data

1. Scroll to the "Add Actual Results" section
2. Enter the date and the two digits that actually occurred
3. Click "Save Results"
4. The predictions will automatically update to include the new data

### Prediction Algorithm

The application uses multiple strategies:

1. **Frequency Analysis**: Identifies hot numbers (most frequent)
2. **Cold Numbers**: Considers least frequent digits
3. **Trend Detection**: Analyzes recent patterns (last 10 entries)
4. **Weighted Combination**: Combines strategies for final prediction

## API Endpoints

### GET `/api/predictions`
Get today's predictions
```json
{
  "date": "2026-01-05",
  "digit1": 45,
  "digit2": 123,
  "dataPoints": 180,
  "message": "Predictions based on 180 days of historical data."
}
```

### POST `/api/results`
Save actual results for a date
```json
{
  "date": "2026-01-05",
  "digit1": 45,
  "digit2": 123
}
```

### GET `/api/history?limit=10`
Get historical records (default limit: 100)

## Database Schema

```sql
CREATE TABLE daily_digits (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  digit1 INTEGER NOT NULL CHECK (digit1 >= 1 AND digit1 <= 200),
  digit2 INTEGER NOT NULL CHECK (digit2 >= 1 AND digit2 <= 200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Project Structure

```
digit-predictor/
├── config/
│   └── database.js          # PostgreSQL connection
├── routes/
│   └── api.js              # API endpoints
├── scripts/
│   └── initDb.js           # Database initialization
├── services/
│   └── predictionService.js # Prediction logic
├── views/
│   └── index.html          # Frontend interface
├── .env.example            # Environment variables template
├── .gitignore
├── package.json
├── README.md
└── server.js               # Main application file
```

## Development

To add sample data for testing:

```javascript
// You can use the API or directly insert into PostgreSQL:
INSERT INTO daily_digits (date, digit1, digit2) VALUES
  ('2025-12-01', 45, 123),
  ('2025-12-02', 67, 89),
  ('2025-12-03', 123, 156);
```

## Troubleshooting

**Database connection error:**
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists

**No predictions shown:**
- Check browser console for errors
- Verify API endpoints are accessible
- Check server logs

## License

ISC
