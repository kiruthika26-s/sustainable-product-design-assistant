const express = require('express');
const router = express.Router();
const {
  getScoreByProductId,
  calculateSimulatedScore
} = require('../controllers/scoringController');

// Real-time calculation endpoint
router.post('/score/calculate', calculateSimulatedScore);

// Saved product calculation endpoint
router.get('/:id/score', getScoreByProductId);

module.exports = router;
