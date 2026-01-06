const pool = require('../config/database');

/**
 * Advanced Pattern Analysis for Digit Prediction
 * Analyzes historical data to find meaningful patterns
 */

class PatternAnalyzer {
  
  async analyzeAllPatterns() {
    console.log('=== DIGIT PATTERN ANALYSIS ===\n');
    
    const data = await this.getAllData();
    console.log(`Analyzing ${data.length} records from ${data[data.length-1].date.toISOString().split('T')[0]} to ${data[0].date.toISOString().split('T')[0]}\n`);
    
    // Run all analyses
    await this.analyzeFrequencyDistribution(data);
    await this.analyzeDayOfWeekPattern(data);
    await this.analyzeDatePatterns(data);
    await this.analyzeSequentialPatterns(data);
    await this.analyzeGapAnalysis(data);
    await this.analyzeRangePatterns(data);
    await this.analyzeSumPatterns(data);
    await this.analyzeMonthlyTrends(data);
    
    await pool.end();
  }
  
  async getAllData() {
    const result = await pool.query(`
      SELECT date, digit1, digit2 
      FROM daily_digits 
      ORDER BY date DESC
    `);
    return result.rows;
  }
  
  // 1. Frequency Distribution Analysis
  async analyzeFrequencyDistribution(data) {
    console.log('📊 FREQUENCY DISTRIBUTION ANALYSIS');
    console.log('='.repeat(50));
    
    const freq1 = {};
    const freq2 = {};
    
    data.forEach(row => {
      freq1[row.digit1] = (freq1[row.digit1] || 0) + 1;
      freq2[row.digit2] = (freq2[row.digit2] || 0) + 1;
    });
    
    const sorted1 = Object.entries(freq1).sort((a, b) => b[1] - a[1]);
    const sorted2 = Object.entries(freq2).sort((a, b) => b[1] - a[1]);
    
    console.log('\nMost Frequent Digit1:');
    sorted1.slice(0, 10).forEach(([digit, count]) => {
      console.log(`  ${digit}: ${count} times (${(count/data.length*100).toFixed(1)}%)`);
    });
    
    console.log('\nMost Frequent Digit2:');
    sorted2.slice(0, 10).forEach(([digit, count]) => {
      console.log(`  ${digit}: ${count} times (${(count/data.length*100).toFixed(1)}%)`);
    });
    
    console.log('\nLeast Frequent (Cold Numbers) Digit1:');
    sorted1.slice(-10).reverse().forEach(([digit, count]) => {
      console.log(`  ${digit}: ${count} times`);
    });
    
    console.log('\n');
  }
  
  // 2. Day of Week Pattern
  async analyzeDayOfWeekPattern(data) {
    console.log('📅 DAY OF WEEK PATTERN ANALYSIS');
    console.log('='.repeat(50));
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayStats = Array(7).fill(null).map(() => ({ digit1: [], digit2: [], count: 0 }));
    
    data.forEach(row => {
      const dayOfWeek = new Date(row.date).getDay();
      dayStats[dayOfWeek].digit1.push(row.digit1);
      dayStats[dayOfWeek].digit2.push(row.digit2);
      dayStats[dayOfWeek].count++;
    });
    
    console.log('\nAverage digits by day of week:');
    dayStats.forEach((stats, idx) => {
      if (stats.count === 0) return;
      const avg1 = stats.digit1.reduce((a, b) => a + b, 0) / stats.count;
      const avg2 = stats.digit2.reduce((a, b) => a + b, 0) / stats.count;
      console.log(`  ${days[idx]}: Digit1 avg=${avg1.toFixed(1)}, Digit2 avg=${avg2.toFixed(1)} (${stats.count} days)`);
    });
    
    console.log('\n');
  }
  
  // 3. Date-based Patterns (day of month)
  async analyzeDatePatterns(data) {
    console.log('📆 DATE PATTERNS (Day of Month)');
    console.log('='.repeat(50));
    
    const dateStats = {};
    
    data.forEach(row => {
      const day = new Date(row.date).getDate();
      if (!dateStats[day]) dateStats[day] = { digit1: [], digit2: [] };
      dateStats[day].digit1.push(row.digit1);
      dateStats[day].digit2.push(row.digit2);
    });
    
    const significantDates = [];
    for (let day in dateStats) {
      const avg1 = dateStats[day].digit1.reduce((a, b) => a + b, 0) / dateStats[day].digit1.length;
      const avg2 = dateStats[day].digit2.reduce((a, b) => a + b, 0) / dateStats[day].digit2.length;
      const variance = this.calculateVariance(dateStats[day].digit1);
      
      if (variance < 5000) { // Low variance = consistent pattern
        significantDates.push({ day, avg1, avg2, variance, count: dateStats[day].digit1.length });
      }
    }
    
    if (significantDates.length > 0) {
      console.log('\nDates with consistent patterns (low variance):');
      significantDates.sort((a, b) => a.variance - b.variance).slice(0, 5).forEach(d => {
        console.log(`  Day ${d.day}: Avg Digit1=${d.avg1.toFixed(1)}, Avg Digit2=${d.avg2.toFixed(1)} (${d.count} occurrences)`);
      });
    }
    
    console.log('\n');
  }
  
  // 4. Sequential Pattern Analysis
  async analyzeSequentialPatterns(data) {
    console.log('🔄 SEQUENTIAL PATTERN ANALYSIS');
    console.log('='.repeat(50));
    
    const diffs1 = [];
    const diffs2 = [];
    
    for (let i = 0; i < data.length - 1; i++) {
      diffs1.push(data[i].digit1 - data[i+1].digit1);
      diffs2.push(data[i].digit2 - data[i+1].digit2);
    }
    
    const avgDiff1 = diffs1.reduce((a, b) => a + b, 0) / diffs1.length;
    const avgDiff2 = diffs2.reduce((a, b) => a + b, 0) / diffs2.length;
    
    console.log(`\nAverage day-to-day change:`);
    console.log(`  Digit1: ${avgDiff1.toFixed(2)}`);
    console.log(`  Digit2: ${avgDiff2.toFixed(2)}`);
    
    // Check for repeating numbers
    let repeats1 = 0, repeats2 = 0;
    for (let i = 0; i < data.length - 1; i++) {
      if (data[i].digit1 === data[i+1].digit1) repeats1++;
      if (data[i].digit2 === data[i+1].digit2) repeats2++;
    }
    
    console.log(`\nConsecutive day repeats:`);
    console.log(`  Digit1: ${repeats1} times (${(repeats1/data.length*100).toFixed(1)}%)`);
    console.log(`  Digit2: ${repeats2} times (${(repeats2/data.length*100).toFixed(1)}%)`);
    
    console.log('\n');
  }
  
  // 5. Gap Analysis (numbers that haven't appeared recently)
  async analyzeGapAnalysis(data) {
    console.log('⏳ GAP ANALYSIS (Overdue Numbers)');
    console.log('='.repeat(50));
    
    const lastSeen1 = {};
    const lastSeen2 = {};
    
    data.forEach((row, idx) => {
      if (!lastSeen1[row.digit1]) lastSeen1[row.digit1] = idx;
      if (!lastSeen2[row.digit2]) lastSeen2[row.digit2] = idx;
    });
    
    const overdue1 = Object.entries(lastSeen1).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const overdue2 = Object.entries(lastSeen2).sort((a, b) => b[1] - a[1]).slice(0, 10);
    
    console.log('\nDigit1 - Numbers not seen recently (overdue):');
    overdue1.forEach(([digit, daysAgo]) => {
      console.log(`  ${digit}: Last seen ${daysAgo} days ago`);
    });
    
    console.log('\nDigit2 - Numbers not seen recently (overdue):');
    overdue2.forEach(([digit, daysAgo]) => {
      console.log(`  ${digit}: Last seen ${daysAgo} days ago`);
    });
    
    console.log('\n');
  }
  
  // 6. Range Pattern Analysis
  async analyzeRangePatterns(data) {
    console.log('📏 RANGE PATTERN ANALYSIS');
    console.log('='.repeat(50));
    
    const ranges = {
      '0-200': 0, '201-400': 0, '401-600': 0, '601-800': 0, '801-1000': 0
    };
    
    data.forEach(row => {
      [row.digit1, row.digit2].forEach(d => {
        if (d <= 200) ranges['0-200']++;
        else if (d <= 400) ranges['201-400']++;
        else if (d <= 600) ranges['401-600']++;
        else if (d <= 800) ranges['601-800']++;
        else ranges['801-1000']++;
      });
    });
    
    console.log('\nDigit distribution by range:');
    Object.entries(ranges).forEach(([range, count]) => {
      console.log(`  ${range}: ${count} times (${(count/(data.length*2)*100).toFixed(1)}%)`);
    });
    
    console.log('\n');
  }
  
  // 7. Sum Pattern Analysis
  async analyzeSumPatterns(data) {
    console.log('➕ SUM PATTERN ANALYSIS');
    console.log('='.repeat(50));
    
    const sums = data.map(row => row.digit1 + row.digit2);
    const avgSum = sums.reduce((a, b) => a + b, 0) / sums.length;
    const minSum = Math.min(...sums);
    const maxSum = Math.max(...sums);
    
    console.log(`\nSum of Digit1 + Digit2:`);
    console.log(`  Average: ${avgSum.toFixed(1)}`);
    console.log(`  Min: ${minSum}`);
    console.log(`  Max: ${maxSum}`);
    console.log(`  Median: ${this.calculateMedian(sums).toFixed(1)}`);
    
    console.log('\n');
  }
  
  // 8. Monthly Trends
  async analyzeMonthlyTrends(data) {
    console.log('📈 MONTHLY TRENDS');
    console.log('='.repeat(50));
    
    const monthStats = {};
    
    data.forEach(row => {
      const month = new Date(row.date).toISOString().slice(0, 7); // YYYY-MM
      if (!monthStats[month]) monthStats[month] = { digit1: [], digit2: [] };
      monthStats[month].digit1.push(row.digit1);
      monthStats[month].digit2.push(row.digit2);
    });
    
    console.log('\nMonthly averages:');
    Object.entries(monthStats).sort().slice(-12).forEach(([month, stats]) => {
      const avg1 = stats.digit1.reduce((a, b) => a + b, 0) / stats.digit1.length;
      const avg2 = stats.digit2.reduce((a, b) => a + b, 0) / stats.digit2.length;
      console.log(`  ${month}: Digit1=${avg1.toFixed(1)}, Digit2=${avg2.toFixed(1)}`);
    });
    
    console.log('\n');
  }
  
  // Helper functions
  calculateVariance(arr) {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
  }
  
  calculateMedian(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }
}

// Run analysis
const analyzer = new PatternAnalyzer();
analyzer.analyzeAllPatterns().catch(console.error);
