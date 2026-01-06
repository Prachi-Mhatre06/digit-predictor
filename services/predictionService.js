const pool = require('../config/database');

class PredictionService {
  /**
   * Get historical data for the last 6 months
   */
  async getHistoricalData() {
    const query = `
      SELECT date, digit1, digit2 
      FROM daily_digits 
      WHERE date >= CURRENT_DATE - INTERVAL '6 months'
      ORDER BY date DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Calculate frequency of each digit
   */
  calculateFrequency(data, digitField) {
    const frequency = {};
    for (let i = 1; i <= 200; i++) {
      frequency[i] = 0;
    }
    
    data.forEach(row => {
      const digit = row[digitField];
      if (digit >= 1 && digit <= 200) {
        frequency[digit]++;
      }
    });
    
    return frequency;
  }

  /**
   * Predict digit based on multiple strategies
   */
  predictDigit(data, digitField) {
    if (data.length === 0) {
      // No data available, return random number
      return Math.floor(Math.random() * 200) + 1;
    }

    const frequency = this.calculateFrequency(data, digitField);
    
    // Strategy 1: Most frequent digit (hot numbers)
    let maxFreq = 0;
    let mostFrequent = [];
    for (let digit in frequency) {
      if (frequency[digit] > maxFreq) {
        maxFreq = frequency[digit];
        mostFrequent = [parseInt(digit)];
      } else if (frequency[digit] === maxFreq) {
        mostFrequent.push(parseInt(digit));
      }
    }

    // Strategy 2: Least frequent digit (cold numbers)
    let minFreq = Infinity;
    let leastFrequent = [];
    for (let digit in frequency) {
      if (frequency[digit] < minFreq) {
        minFreq = frequency[digit];
        leastFrequent = [parseInt(digit)];
      } else if (frequency[digit] === minFreq) {
        leastFrequent.push(parseInt(digit));
      }
    }

    // Strategy 3: Recent trend (last 10 entries average)
    const recentData = data.slice(0, Math.min(10, data.length));
    const recentAvg = recentData.reduce((sum, row) => sum + row[digitField], 0) / recentData.length;

    // Combine strategies: Use most frequent with slight bias towards recent trend
    const candidates = [...mostFrequent];
    
    // Add numbers close to recent average
    const nearRecent = Math.round(recentAvg);
    if (nearRecent >= 1 && nearRecent <= 200) {
      candidates.push(nearRecent);
      if (nearRecent > 1) candidates.push(nearRecent - 1);
      if (nearRecent < 200) candidates.push(nearRecent + 1);
    }

    // Return random from candidates
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  /**
   * Generate predictions for today
   */
  async getPredictions() {
    try {
      const historicalData = await this.getHistoricalData();
      
      const prediction1 = this.predictDigit(historicalData, 'digit1');
      const prediction2 = this.predictDigit(historicalData, 'digit2');

      return {
        date: new Date().toISOString().split('T')[0],
        digit1: prediction1,
        digit2: prediction2,
        dataPoints: historicalData.length,
        message: historicalData.length === 0 
          ? 'No historical data available. Showing random predictions.' 
          : `Predictions based on ${historicalData.length} days of historical data.`
      };
    } catch (error) {
      console.error('Error generating predictions:', error);
      throw error;
    }
  }

  /**
   * Save actual results for a date
   */
  async saveResults(date, digit1, digit2) {
    const query = `
      INSERT INTO daily_digits (date, digit1, digit2)
      VALUES ($1, $2, $3)
      ON CONFLICT (date) 
      DO UPDATE SET digit1 = $2, digit2 = $3
      RETURNING *
    `;
    const result = await pool.query(query, [date, digit1, digit2]);
    return result.rows[0];
  }

  /**
   * Get all historical records
   */
  async getAllRecords(limit = 100) {
    const query = `
      SELECT date, digit1, digit2, created_at
      FROM daily_digits
      ORDER BY date DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  }
}

module.exports = new PredictionService();
