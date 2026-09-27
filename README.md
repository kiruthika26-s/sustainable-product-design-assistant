# Sustainable Product Design Assistant

A full-stack web application designed for manufacturers and product engineers to evaluate product recyclability in real-time, simulate eco-friendly material alternatives, track lifecycle stages and product versions, and generate downloadable PDF sustainability reports.

---

## 🌟 Key Features

1. **Dynamic Recyclability Scoring Engine**
   - Weighted recyclability index calculation based on mass proportion.
   - Dynamic mixed-material complexity penalties.
   - Contamination deductions for non-recyclable components.
   - Sustainability letter grades (Grade A to F) and descriptive classifications.

2. **Manufacturer Authentication & JWT Security**
   - Secure account registration and login using `bcryptjs` and JSON Web Tokens.
   - Token-based API access with optional guest evaluation mode.

3. **Product Management & MongoDB Atlas Persistence**
   - Full CRUD operations for product specifications.
   - Search, filter by category and lifecycle stage, and detailed inspection views.

4. **Eco-Friendly Material Recommendations**
   - Contextual suggestions for high-impact material substitutions.
   - Standard material reference library with recyclability ratings (PET, HDPE, Aluminum, Bamboo, Glass, PLA, etc.).
   - Instant 1-click bridge to the What-If simulation tool.

5. **What-If Material Simulation & Branching**
   - Live interactive simulation testing component material swaps before production.
   - Side-by-side comparison of original vs. projected scores with net point differentials.
   - Option to save the simulation as a new revision (version) or a standalone variant.

6. **Product Versioning & Lifecycle Tracking**
   - Track product iterations (`v1`, `v2`, etc.) linked to parent designs.
   - Step through circular economy lifecycle stages (*Design*, *Manufacture*, *Distribution*, *Use*, *End-of-Life*).

7. **Side-by-Side Product Comparison**
   - Compare two stored products head-to-head across weight, composition, penalty breakdowns, and final scores.

8. **Automated PDF Sustainability Report Export**
   - One-click server-side PDF generation via `pdfkit` detailing product metadata, score breakdown, material composition, and design recommendations.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Vanilla CSS design system
- **Backend**: Node.js, Express 5, PDFKit, JWT, bcryptjs
- **Database**: MongoDB Atlas with Mongoose ODM

---

## 📁 Project Architecture

```text
sustainable-product-design-assistant/
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── components/         # Modular UI Views & Modals
│   │   │   ├── AuthModal.jsx
│   │   │   ├── DashboardView.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProductComparisonView.jsx
│   │   │   ├── ProductDetailModal.jsx
│   │   │   ├── RecommendationsView.jsx
│   │   │   └── WhatIfSimulationView.jsx
│   │   ├── services/
│   │   │   └── api.js          # API client with token helpers
│   │   ├── utils/
│   │   │   └── materialDb.js   # Reference materials & recommendation rules
│   │   ├── App.jsx             # Main Application shell & tab navigation
│   │   └── App.css             # Unified CSS Design System
│   └── package.json
├── server/                     # Express REST API Server
│   ├── config/
│   ├── controllers/
│   │   ├── authController.js   # Register, Login, Me
│   │   ├── pdfController.js    # PDF Report generation
│   │   ├── productController.js# Product CRUD & Versioning
│   │   └── scoringController.js# Live scoring endpoint
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT protect & optionalAuth
│   ├── models/
│   │   ├── Product.js          # Product & Material schema
│   │   └── User.js             # Manufacturer user schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   └── scoringRoutes.js
│   ├── utils/
│   │   └── scoringEngine.js    # Core mathematical scoring algorithms
│   ├── server.js               # Express application entrypoint
│   └── .env                    # MONGO_URI, JWT_SECRET, PORT
├── PROJECT_CONTEXT.md          # Technical specification & project roadmap
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster connection string

### 1. Backend Setup
```bash
cd server
npm install
# Ensure server/.env has valid MONGO_URI and JWT_SECRET
npm run dev
# Server will run on port 5000
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
# Vite dev server will run on http://localhost:5173
```

---

## 📡 API Reference

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new manufacturer account | Public |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT token | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Required |
| `POST` | `/api/products/score/calculate` | Compute dynamic recyclability score | Public |
| `GET` | `/api/products` | Retrieve all saved products | Public |
| `POST` | `/api/products` | Save a new product specification | Optional |
| `GET` | `/api/products/:id` | Fetch specific product details | Public |
| `PUT` | `/api/products/:id` | Update product or lifecycle stage | Optional |
| `DELETE` | `/api/products/:id` | Remove product entry | Optional |
| `GET` | `/api/products/:id/versions` | List all version iterations of product | Public |
| `POST` | `/api/products/:id/versions` | Create a new linked version revision | Optional |
| `GET` | `/api/products/:id/pdf` | Download PDF sustainability report | Public |
