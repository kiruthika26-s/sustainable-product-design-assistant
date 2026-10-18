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

// @desc    Simulate material swap for a stored product by ID without modifying database
// @route   POST /api/products/:id/simulate
// @access  Public
const simulateMaterialSwap = async (req, res) => {
  try {
    const { id } = req.params;
    const { materialIndex, targetMaterialName, alternativeMaterial } = req.body;

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

    if (!product.materials || product.materials.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Product has no materials composition to simulate'
      });
    }

    if (!alternativeMaterial || !alternativeMaterial.name) {
      return res.status(400).json({
        success: false,
        error: 'Alternative material specification is required'
      });
    }

    // Determine target material index to swap
    let targetIdx = -1;
    if (materialIndex !== undefined && materialIndex !== null && materialIndex !== '') {
      const parsedIdx = Number(materialIndex);
      if (isNaN(parsedIdx) || parsedIdx < 0 || parsedIdx >= product.materials.length) {
        return res.status(400).json({
          success: false,
          error: `Invalid material index ${materialIndex}. Product has ${product.materials.length} material(s).`
        });
      }
      targetIdx = parsedIdx;
    } else if (targetMaterialName) {
      targetIdx = product.materials.findIndex(
        (m) => m.name.toLowerCase() === targetMaterialName.toLowerCase()
      );
      if (targetIdx === -1) {
        return res.status(400).json({
          success: false,
          error: `Material "${targetMaterialName}" not found in product composition.`
        });
      }
    } else {
      targetIdx = 0;
    }

    // 1. Calculate Original Score using stored product data
    const originalScoreData = calculateRecyclabilityScore(product);

    // 2. Prepare Swapped Materials payload (pure in-memory simulation, no DB mutation)
    const targetOldMaterial = product.materials[targetIdx];
    const targetAltIndex = Math.min(100, Math.max(0, Number(alternativeMaterial.recyclabilityIndex) || 0));

    const swappedMaterials = product.materials.map((mat, i) => {
      if (i === targetIdx) {
        return {
          name: alternativeMaterial.name.trim(),
          weight: Number(mat.weight),
          recyclabilityIndex: targetAltIndex
        };
      }
      return {
        name: mat.name,
        weight: Number(mat.weight),
        recyclabilityIndex: Number(mat.recyclabilityIndex)
      };
    });

    const swappedPayload = {
      name: product.name,
      category: product.category,
      description: product.description,
      materials: swappedMaterials,
      packaging: product.packaging,
      components: product.components
    };

    // 3. Calculate Simulated Score using existing recyclability formula
    const simulatedScoreData = calculateRecyclabilityScore(swappedPayload);

    // 4. Net Score Difference
    const difference = simulatedScoreData.finalScore - originalScoreData.finalScore;

    return res.status(200).json({
      success: true,
      data: {
        productName: product.name,
        swappedMaterialOld: targetOldMaterial.name,
        swappedMaterialNew: alternativeMaterial.name.trim(),
        originalScore: originalScoreData.finalScore,
        originalGrade: originalScoreData.grade,
        originalReport: originalScoreData,
        simulatedScore: simulatedScoreData.finalScore,
        simulatedGrade: simulatedScoreData.grade,
        simulatedReport: simulatedScoreData,
        alternativeScore: simulatedScoreData.finalScore,
        alternativeGrade: simulatedScoreData.grade,
        alternativeReport: simulatedScoreData,
        difference,
        swappedPayload
      }
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
  calculateSimulatedScore,
  simulateMaterialSwap
};
