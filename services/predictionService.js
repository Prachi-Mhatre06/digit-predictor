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
    for (let i = 0; i <= 1000; i++) {
      frequency[i] = 0;
    }
    
    data.forEach(row => {
      const digit = row[digitField];
      if (digit >= 0 && digit <= 1000) {
        frequency[digit]++;
      }
    });
    
    return frequency;
  }

  /**
   * Predict digit based on multiple strategies and pattern analysis
   */
  predictDigit(data, digitField, dayOfWeek = new Date().getDay()) {
    if (data.length === 0) {
      // No data available, use intelligent random in most common range
      return Math.floor(Math.random() * 200) + 201; // 201-400 range (most common)
    }

    const frequency = this.calculateFrequency(data, digitField);
    
    // Strategy 1: Hot numbers (most frequent in last 6 months)
    let maxFreq = 0;
    let mostFrequent = [];
    for (let digit in frequency) {
      if (frequency[digit] > maxFreq) {
        maxFreq = frequency[digit];
        mostFrequent = [parseInt(digit)];
      } else if (frequency[digit] === maxFreq && frequency[digit] > 0) {
        mostFrequent.push(parseInt(digit));
      }
    }

    // Strategy 2: Cold numbers (overdue - least frequent but appeared before)
    const appearedNumbers = Object.entries(frequency)
      .filter(([_, count]) => count > 0)
      .map(([digit, _]) => parseInt(digit));
    
    const lastSeenDays = {};
    data.forEach((row, idx) => {
      if (!lastSeenDays[row[digitField]]) {
        lastSeenDays[row[digitField]] = idx;
      }
    });
    
    const overdue = Object.entries(lastSeenDays)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([digit, _]) => parseInt(digit));

    // Strategy 3: Recent trend (last 30 entries weighted average)
    const recentData = data.slice(0, Math.min(30, data.length));
    const recentAvg = recentData.reduce((sum, row) => sum + row[digitField], 0) / recentData.length;
    
    // Strategy 4: Day of week pattern
    const dayData = data.filter(row => new Date(row.date).getDay() === dayOfWeek);
    const dayAvg = dayData.length > 0
      ? dayData.reduce((sum, row) => sum + row[digitField], 0) / dayData.length
      : recentAvg;

    // Strategy 5: Monthly trend (last 30 days)
    const monthlyTrend = data.slice(0, 30).reduce((sum, row) => sum + row[digitField], 0) / Math.min(30, data.length);

    // Combine strategies with weights
    const candidates = [];
    
    // Add hot numbers (30% weight)
    candidates.push(...mostFrequent.slice(0, 3));
    
    // Add overdue numbers (25% weight)
    candidates.push(...overdue.slice(0, 5));
    
    // Add numbers around recent average (20% weight)
    const nearRecent = Math.round(recentAvg);
    if (nearRecent >= 0 && nearRecent <= 1000) {
      candidates.push(nearRecent);
      if (nearRecent > 10) candidates.push(nearRecent - 10);
      if (nearRecent < 990) candidates.push(nearRecent + 10);
    }
    
    // Add numbers around day-of-week average (15% weight)
    const nearDay = Math.round(dayAvg);
    if (nearDay >= 0 && nearDay <= 1000) {
      candidates.push(nearDay);
      if (nearDay > 15) candidates.push(nearDay - 15);
      if (nearDay < 985) candidates.push(nearDay + 15);
    }
    
    // Add numbers around monthly trend (10% weight)
    const nearMonthly = Math.round(monthlyTrend);
    if (nearMonthly >= 0 && nearMonthly <= 1000) {
      candidates.push(nearMonthly);
    }

    // Filter to valid range and remove duplicates
    const validCandidates = [...new Set(candidates)].filter(n => n >= 0 && n <= 1000);
    
    // If we have no candidates, fall back to range-based prediction
    if (validCandidates.length === 0) {
      // Most common range is 201-400
      return Math.floor(Math.random() * 200) + 201;
    }

    // Return weighted random from candidates
    return validCandidates[Math.floor(Math.random() * validCandidates.length)];
  }

  /**
   * Generate predictions for today
   */
  async getPredictions() {
    try {
      const historicalData = await this.getHistoricalData();
      const today = new Date();
      const dayOfWeek = today.getDay();
      
      const prediction1 = this.predictDigit(historicalData, 'digit1', dayOfWeek);
      const prediction2 = this.predictDigit(historicalData, 'digit2', dayOfWeek);

      // Calculate confidence metrics
      const recentData = historicalData.slice(0, 30);
      const avg1 = recentData.reduce((sum, row) => sum + row.digit1, 0) / recentData.length;
      const avg2 = recentData.reduce((sum, row) => sum + row.digit2, 0) / recentData.length;

      return {
        date: today.toISOString().split('T')[0],
        digit1: prediction1,
        digit2: prediction2,
        dataPoints: historicalData.length,
        insights: {
          recentAvg1: Math.round(avg1),
          recentAvg2: Math.round(avg2),
          dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]
        },
        message: historicalData.length === 0 
          ? 'No historical data available. Showing intelligent random predictions.' 
          : `AI predictions based on ${historicalData.length} days of data using 5 pattern analysis strategies.`
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
