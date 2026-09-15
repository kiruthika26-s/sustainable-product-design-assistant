const mongoose = require('mongoose');
const Product = require('../models/Product');
const { calculateRecyclabilityScore } = require('../utils/scoringEngine');

// @desc    Calculate recyclability score for a stored product by ID
// @route   GET /api/products/:id/score
// @access  Public
const getScoreByProductId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID format'
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const scoreData = calculateRecyclabilityScore(product);

    return res.status(200).json({
      success: true,
      data: scoreData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error while calculating product recyclability score'
    });
  }
};

// @desc    Calculate real-time / simulated recyclability score from raw body payload
// @route   POST /api/products/score/calculate
// @access  Public
const calculateSimulatedScore = async (req, res) => {
  try {
    const scoreData = calculateRecyclabilityScore(req.body);

    return res.status(200).json({
      success: true,
      data: scoreData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error while performing recyclability simulation calculation'
    });
  }
};

module.exports = {
  getScoreByProductId,
  calculateSimulatedScore
};
