const mongoose = require('mongoose');
const Material = require('../models/Material');

// Helper to escape regex special characters
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// @desc    Get all materials in knowledge base
// @route   GET /api/materials
// @access  Public
const getMaterials = async (req, res) => {
  try {
    const materials = await Material.find().sort({ name: 1 });
    return res.status(200).json({
      success: true,
      count: materials.length,
      data: materials
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error while fetching materials'
    });
  }
};

// @desc    Get single material by ID
// @route   GET /api/materials/:id
// @access  Public
const getMaterialById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid material ID format'
      });
    }

    const material = await Material.findById(id);

    if (!material) {
      return res.status(404).json({
        success: false,
        error: 'Material not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: material
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error while fetching material by ID'
    });
  }
};

// @desc    Get single material by Name (case-insensitive)
// @route   GET /api/materials/name/:name
// @access  Public
const getMaterialByName = async (req, res) => {
  try {
    const { name } = req.params;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Material name parameter is required'
      });
    }

    const decodedName = decodeURIComponent(name).trim();
    const material = await Material.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(decodedName)}$`, 'i') }
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        error: `Material '${decodedName}' not found`
      });
    }

    return res.status(200).json({
      success: true,
      data: material
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error while fetching material by name'
    });
  }
};

module.exports = {
  getMaterials,
  getMaterialById,
  getMaterialByName
};
