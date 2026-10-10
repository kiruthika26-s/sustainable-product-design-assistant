const express = require('express');
const router = express.Router();
const {
  getMaterials,
  getMaterialById,
  getMaterialByName
} = require('../controllers/materialController');

// List all materials
router.get('/', getMaterials);

// Retrieve by name
router.get('/name/:name', getMaterialByName);

// Retrieve by ID
router.get('/:id', getMaterialById);

module.exports = router;
