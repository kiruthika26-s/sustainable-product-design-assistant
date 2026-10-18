/**
 * Centralized API Service for Sustainable Product Lifecycle Management Platform
 * Handles communication between React frontend and Express backend using native fetch().
 */

const API_BASE_URL = '/api/products';
const AUTH_BASE_URL = '/api/auth';

// Token Management Helpers
export function getAuthToken() {
  return localStorage.getItem('sustainability_app_token') || '';
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('sustainability_app_token', token);
  } else {
    localStorage.removeItem('sustainability_app_token');
  }
}

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Safely parses response body and throws informative error if request fails or response is empty.
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

/* ==========================================================================
   AUTHENTICATION ENDPOINTS
   ========================================================================== */

export async function registerUser(userData) {
  const response = await fetch(`${AUTH_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  const data = await parseJsonResponse(response);
  if (data?.data?.token) {
    setAuthToken(data.data.token);
  }
  return data;
}

export async function loginUser(userData) {
  const response = await fetch(`${AUTH_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  const data = await parseJsonResponse(response);
  if (data?.data?.token) {
    setAuthToken(data.data.token);
  }
  return data;
}

export async function getMe() {
  const response = await fetch(`${AUTH_BASE_URL}/me`, {
    method: 'GET',
    headers: getHeaders()
  });
  return await parseJsonResponse(response);
}

/* ==========================================================================
   PRODUCT & SCORING ENDPOINTS
   ========================================================================== */

export async function calculateScore(productData) {
  const response = await fetch(`${API_BASE_URL}/score/calculate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(productData)
  });
  return await parseJsonResponse(response);
}

export async function simulateProductSwap(id, simulationData) {
  const response = await fetch(`${API_BASE_URL}/${id}/simulate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(simulationData)
  });
  return await parseJsonResponse(response);
}

export async function getScoreByProductId(id) {
  const response = await fetch(`${API_BASE_URL}/${id}/score`, {
    method: 'GET',
    headers: getHeaders()
  });
  return await parseJsonResponse(response);
}

export async function createProduct(productData) {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(productData)
  });
  return await parseJsonResponse(response);
}

export async function getProducts() {
  const response = await fetch(API_BASE_URL, {
    method: 'GET',
    headers: getHeaders()
  });
  return await parseJsonResponse(response);
}

export async function getProductById(id) {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'GET',
    headers: getHeaders()
  });
  return await parseJsonResponse(response);
}

export async function updateProduct(id, productData) {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(productData)
  });
  return await parseJsonResponse(response);
}

export async function deleteProduct(id) {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return await parseJsonResponse(response);
}

/* ==========================================================================
   VERSIONING & PDF REPORT ENDPOINTS
   ========================================================================== */

export async function getProductVersions(id) {
  const response = await fetch(`${API_BASE_URL}/${id}/versions`, {
    method: 'GET',
    headers: getHeaders()
  });
  return await parseJsonResponse(response);
}

export async function createProductVersion(id, versionData) {
  const response = await fetch(`${API_BASE_URL}/${id}/versions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(versionData)
  });
  return await parseJsonResponse(response);
}

export async function downloadProductPdf(id, filename = 'sustainability_report.pdf') {
  const token = getAuthToken();
  const url = `${API_BASE_URL}/${id}/pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to generate PDF report (${response.status})`);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
