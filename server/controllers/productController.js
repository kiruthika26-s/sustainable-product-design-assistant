const mongoose = require('mongoose');
const Product = require('../models/Product');

// @desc    Create a new product
// @route   POST /api/products
// @access  Public
const createProduct = async (req, res) => {
  try {
    const productPayload = { ...req.body };
    if (req.user) {
      productPayload.user = req.user.id;
    }

    const product = new Product(productPayload);
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

// @desc    Create a new version of a product
// @route   POST /api/products/:id/versions
// @access  Public
const createProductVersion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID format'
      });
    }

    const parentProduct = await Product.findById(id);
    if (!parentProduct) {
      return res.status(404).json({
        success: false,
        error: 'Parent product not found'
      });
    }

    const rootParentId = parentProduct.parentProductId || parentProduct._id;

    // Determine next version number
    const existingVersions = await Product.find({
      $or: [{ _id: rootParentId }, { parentProductId: rootParentId }]
    });

    const nextVersion = existingVersions.length + 1;

    const newVersionPayload = {
      name: req.body.name || parentProduct.name,
      category: req.body.category || parentProduct.category,
      description: req.body.description || parentProduct.description,
      materials: req.body.materials || parentProduct.materials,
      packaging: req.body.packaging || parentProduct.packaging,
      components: req.body.components || parentProduct.components,
      version: nextVersion,
      parentProductId: rootParentId,
      lifecycleStage: req.body.lifecycleStage || parentProduct.lifecycleStage,
      user: req.user ? req.user.id : parentProduct.user
    };

    const newVersion = await Product.create(newVersionPayload);

    return res.status(201).json({
      success: true,
      data: newVersion
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error creating product version'
    });
  }
};

// @desc    Get version history of a product
// @route   GET /api/products/:id/versions
// @access  Public
const getProductVersions = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID format'
      });
    }

    const currentProduct = await Product.findById(id);
    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const rootParentId = currentProduct.parentProductId || currentProduct._id;

    const versions = await Product.find({
      $or: [{ _id: rootParentId }, { parentProductId: rootParentId }]
    }).sort({ version: 1 });

    return res.status(200).json({
      success: true,
      count: versions.length,
      data: versions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error fetching product versions'
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  createProductVersion,
  getProductVersions
};
