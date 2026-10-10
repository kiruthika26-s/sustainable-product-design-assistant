const mongoose = require('mongoose');
const Product = require('../models/Product');
const { validateAndNormalizeMaterials } = require('../utils/materialValidator');

// @desc    Create a new product
// @route   POST /api/products
// @access  Public
const createProduct = async (req, res) => {
  try {
    if (!req.body || !req.body.materials || !Array.isArray(req.body.materials) || req.body.materials.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Product must include at least one valid material from the Material Knowledge Base.'
      });
    }

    const validation = await validateAndNormalizeMaterials(req.body.materials);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }
    req.body.materials = validation.materials;

    const product = new Product(req.body);
    const savedProduct = await product.save();
    return res.status(201).json({
      success: true,
      data: savedProduct
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Server error while creating product'
    });
  }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error while fetching products'
    });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
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

    return res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error while fetching product'
    });
  }
};

// @desc    Update product by ID
// @route   PUT /api/products/:id
// @access  Public
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID format'
      });
    }

    const materialsIncluded =
      req.body && Object.hasOwn(req.body, 'materials');
    if (materialsIncluded) {
      if (!req.body.materials || !Array.isArray(req.body.materials) || req.body.materials.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Product update materials field must be a non-empty array.'
        });
      }

      const validation = await validateAndNormalizeMaterials(req.body.materials);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }
      req.body.materials = validation.materials;
    }

    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Server error while updating product'
    });
  }
};

// @desc    Delete product by ID
// @route   DELETE /api/products/:id
// @access  Public
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID format'
      });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error while deleting product'
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
};
