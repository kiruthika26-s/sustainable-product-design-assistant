/**
 * Centralized API Service for Sustainable Product Lifecycle Management Platform
 * Handles communication between React frontend and Express backend using native fetch().
 */

const API_BASE_URL = '/api/products';

/**
 * Safely parses response body and throws informative error if request fails or response is empty.
 *
 * @param {Response} response - Fetch response object
 * @returns {Promise<Object>} Parsed JSON object
 */
async function parseJsonResponse(response) {
  const rawText = await response.text();

  let data = {};
  if (rawText && rawText.trim().length > 0) {
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error(`Server returned non-JSON response (${response.status} ${response.statusText}): ${rawText.substring(0, 100)}`);
    }
  }

  if (!response.ok) {
    throw new Error(data.error || `Server error (${response.status} ${response.statusText})`);
  }

  return data;
}

/**
 * Calculates real-time recyclability score for a product specification payload.
 * Route: POST /api/products/score/calculate
 *
 * @param {Object} productData - Product payload containing materials array
 * @returns {Promise<Object>} Calculated score breakdown object
 */
export async function calculateScore(productData) {
  const response = await fetch(`${API_BASE_URL}/score/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(productData)
  });

  return await parseJsonResponse(response);
}

/**
 * Creates and saves a new product to MongoDB database.
 * Route: POST /api/products
 *
 * @param {Object} productData - Product details and specifications
 * @returns {Promise<Object>} Created product object
 */
export async function createProduct(productData) {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(productData)
  });

  return await parseJsonResponse(response);
}

/**
 * Retrieves all stored products from MongoDB database.
 * Route: GET /api/products
 *
 * @returns {Promise<Object>} Array of product documents
 */
export async function getProducts() {
  const response = await fetch(API_BASE_URL, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return await parseJsonResponse(response);
}

/**
 * Deletes a product from MongoDB database by ID.
 * Route: DELETE /api/products/:id
 *
 * @param {string} id - MongoDB ObjectId string
 * @returns {Promise<Object>} Deletion confirmation message
 */
export async function deleteProduct(id) {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return await parseJsonResponse(response);
}

/**
 * Updates an existing product in MongoDB database by ID.
 * Route: PUT /api/products/:id
 *
 * @param {string} id - MongoDB ObjectId string
 * @param {Object} productData - Updated product details and specifications
 * @returns {Promise<Object>} Updated product object
 */
export async function updateProduct(id, productData) {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(productData)
  });

  return await parseJsonResponse(response);
}

/**
 * Retrieves a single product by ID from MongoDB database.
 * Route: GET /api/products/:id
 *
 * @param {string} id - MongoDB ObjectId string
 * @returns {Promise<Object>} Product document
 */
export async function getProductById(id) {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return await parseJsonResponse(response);
}

/**
 * Retrieves the recyclability score calculation for a saved product by ID.
 * Route: GET /api/products/:id/score
 *
 * @param {string} id - MongoDB ObjectId string
 * @returns {Promise<Object>} Calculated score breakdown object
 */
export async function getProductScore(id) {
  const response = await fetch(`${API_BASE_URL}/${id}/score`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return await parseJsonResponse(response);
}

const MATERIALS_API_BASE_URL = '/api/materials';

/**
 * Retrieves all materials from the Material Knowledge Base.
 * Route: GET /api/materials
 *
 * @returns {Promise<Object>} Object containing materials array and count
 */
export async function getMaterials() {
  const response = await fetch(MATERIALS_API_BASE_URL, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return await parseJsonResponse(response);
}

/**
 * Retrieves a single material by ID from the Material Knowledge Base.
 * Route: GET /api/materials/:id
 *
 * @param {string} id - MongoDB ObjectId string
 * @returns {Promise<Object>} Material document object
 */
export async function getMaterialById(id) {
  const response = await fetch(`${MATERIALS_API_BASE_URL}/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return await parseJsonResponse(response);
}

/**
 * Retrieves a single material by name from the Material Knowledge Base.
 * Route: GET /api/materials/name/:name
 *
 * @param {string} name - Material name string
 * @returns {Promise<Object>} Material document object
 */
export async function getMaterialByName(name) {
  const response = await fetch(`${MATERIALS_API_BASE_URL}/name/${encodeURIComponent(name)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return await parseJsonResponse(response);
}


