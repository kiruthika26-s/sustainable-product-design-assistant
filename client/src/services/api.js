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
