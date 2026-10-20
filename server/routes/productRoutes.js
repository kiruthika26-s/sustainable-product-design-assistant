const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  createProductVersion,
  getProductVersions
} = require('../controllers/productController');
const { generateProductPdfReport } = require('../controllers/pdfController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.route('/')
  .post(optionalAuth, createProduct)
  .get(getProducts);

router.get('/:id/pdf', generateProductPdfReport);

router.route('/:id/versions')
  .get(getProductVersions)
  .post(optionalAuth, createProductVersion);

router.route('/:id')
  .get(getProductById)
  .put(optionalAuth, updateProduct)
  .delete(optionalAuth, deleteProduct);

module.exports = router;
