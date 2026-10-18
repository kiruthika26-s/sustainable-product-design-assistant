const express = require('express');
const router = express.Router();
const {
  getScoreByProductId,
  calculateSimulatedScore,
  simulateMaterialSwap
} = require('../controllers/scoringController');

// Real-time calculation endpoint
router.post('/score/calculate', calculateSimulatedScore);

// Product material swap simulation endpoint
router.post('/:id/simulate', simulateMaterialSwap);

// Saved product calculation endpoint
router.get('/:id/score', getScoreByProductId);

module.exports = router;
