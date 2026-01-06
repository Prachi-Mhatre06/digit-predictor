const express = require('express');
const router = express.Router();
const predictionService = require('../services/predictionService');

// Get today's predictions
router.get('/predictions', async (req, res) => {
  try {
    const predictions = await predictionService.getPredictions();
    res.json(predictions);
  } catch (error) {
    console.error('Error getting predictions:', error);
    res.status(500).json({ error: 'Failed to generate predictions' });
  }
});

// Save actual results for a date
router.post('/results', async (req, res) => {
  try {
    const { date, digit1, digit2 } = req.body;
    
    if (!date || !digit1 || !digit2) {
      return res.status(400).json({ error: 'Date, digit1, and digit2 are required' });
    }

    if (digit1 < 1 || digit1 > 200 || digit2 < 1 || digit2 > 200) {
      return res.status(400).json({ error: 'Digits must be between 1 and 200' });
    }

    const result = await predictionService.saveResults(date, digit1, digit2);
    res.json({ message: 'Results saved successfully', data: result });
  } catch (error) {
    console.error('Error saving results:', error);
    res.status(500).json({ error: 'Failed to save results' });
  }
});

// Get historical records
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const records = await predictionService.getAllRecords(limit);
    res.json(records);
  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({ error: 'Failed to retrieve history' });
  }
});

module.exports = router;
