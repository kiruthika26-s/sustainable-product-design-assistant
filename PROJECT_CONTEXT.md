# Sustainable Product Design Assistant with Real-Time Recyclability Analysis and Material Recommendation

## Project Overview

### Purpose
The Sustainable Product Design Assistant helps manufacturers and product designers evaluate the recyclability of a product by entering material, weight, packaging, and component information. The system calculates a recyclability score and provides alternative material recommendations to improve product sustainability.

### Core Workflow
1. **Manufacturer Authentication**: User logs into the platform.
2. **Product Management**: User creates or edits a product entry.
3. **Specification Entry**: User enters material, weight, packaging, and component details.
4. **Recyclability Analysis**: System calculates a recyclability score based on input specifications.
5. **Material Recommendation**: User views alternative material suggestions along with estimated score improvements.
6. **What-If Simulation**: User interactively tests material changes in real time.
7. **Storage & Versioning**: Product specifications and versions can be saved to the database.

---

## Technology Stack

- **Frontend**: React (Vite, React 19)
- **Backend**: Node.js, Express (Express 5)
- **Database**: MongoDB Atlas
- **ODM**: Mongoose

---

## Current Project Status

### Completed Setup
- **Repository Structure**: Monorepo-style setup with separate `client/` and `server/` root folders.
- **Frontend Initialized**:
  - React + Vite app set up in `client/`.
  - Dependencies installed (`react`, `react-dom`, `@vitejs/plugin-react`, `oxlint`).
  - Starter UI form built in `client/src/App.jsx` with input fields (Product Name, Material, Weight, Category) and a static score display.
- **Backend Initialized**:
  - Node.js project set up in `server/` with `package.json`.
  - Core dependencies installed (`express`, `mongoose`, `cors`, `dotenv`, `jsonwebtoken`, `bcryptjs`, `pdfkit`, `nodemon`).
  - Environment variables set up in `server/.env` (`MONGO_URI` MongoDB Atlas connection string & `JWT_SECRET`).
  - Basic Express server set up in `server/server.js` with root GET `/` health check route.
  - Modular backend folder structure prepared (`config/`, `controllers/`, `middleware/`, `models/`, `routes/`).

### In-Progress
- **API & UI Integration**: Connecting front-end form inputs to back-end endpoints.

### Completed Core Modules
- [x] **Authentication Module**: User registration, login, and JWT middleware (`server/controllers/authController.js`, `server/middleware/authMiddleware.js`, `client/src/components/AuthModal.jsx`).
- [x] **Product Creation & Editing Module**: CRUD operations for managing product specifications (`/api/products`, `server/controllers/productController.js`).
- [x] **Recyclability Score Calculation Engine**: Dynamic algorithm evaluating material, weight, packaging metrics, mixed material penalties, and contamination penalties (`server/utils/scoringEngine.js`).
- [x] **Material Recommendation System**: Automated suggestions for eco-friendly material alternatives with expected recyclability index gains and standard material reference library (`client/src/utils/materialDb.js`, `client/src/components/RecommendationsView.jsx`).
- [x] **Real-Time / What-If Simulation**: Interactive frontend tool allowing users to live-simulate material swaps and evaluate expected score shifts with 1-click test integration from recommendations (`client/src/components/WhatIfSimulationView.jsx`).
- [x] **MongoDB Data Persistence**: Schemas and models created with Atlas connection (`Product` model in `server/models/Product.js`, `User` model in `server/models/User.js`).
- [x] **Product Version History & Lifecycle Tracking**: Tracking version iterations (v1, v2, etc.) and lifecycle stages (Design, Manufacture, Distribution, Use, End-of-Life) (`server/controllers/productController.js`, `client/src/components/ProductDetailModal.jsx`).
- [x] **PDF Sustainability Report Generator**: Automated generation and download of detailed PDF lifecycle assessment reports using `pdfkit` (`server/controllers/pdfController.js`).
- [x] **Side-by-Side Product Comparison**: Compare specifications, total weight, material composition, and dynamic recyclability scores between products (`client/src/components/ProductComparisonView.jsx`).
- [x] **Analytics Dashboard**: High-level metrics, category distribution breakdown, and quick action shortcuts (`client/src/components/DashboardView.jsx`).
