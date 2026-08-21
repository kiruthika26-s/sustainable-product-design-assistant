import React, { useState } from "react";
import MaterialRowInput from "../components/scoring/MaterialRowInput";

function ProductAnalysisPage() {
  // General Product Details State
  const [productInfo, setProductInfo] = useState({
    name: "",
    category: "Packaging & Containers",
    totalWeight: "",
    packaging: "",
  });

  // Dynamic Materials List State (starts with at least one row)
  const [materials, setMaterials] = useState([
    {
      id: 1,
      name: "",
      type: "PET (Plastic)",
      weight: "",
    },
  ]);

  // Placeholder state for score calculation area
  const [isCalculated, setIsCalculated] = useState(false);

  // Handle changes to general product info inputs
  const handleProductInfoChange = (e) => {
    const { name, value } = e.target;
    setProductInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Add a new material row
  const handleAddMaterial = () => {
    const newMaterial = {
      id: Date.now(), // unique timestamp ID
      name: "",
      type: "PET (Plastic)",
      weight: "",
    };
    setMaterials((prev) => [...prev, newMaterial]);
  };

  // Update a specific field of a material row
  const handleMaterialChange = (id, field, value) => {
    setMaterials((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Remove a material row (keeps at least one)
  const handleRemoveMaterial = (id) => {
    if (materials.length > 1) {
      setMaterials((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Handle Calculate button click
  const handleCalculateScore = (e) => {
    e.preventDefault();
    // Placeholder trigger: calculation logic will be integrated in subsequent phase
    setIsCalculated(true);
  };

  const categoryOptions = [
    "Packaging & Containers",
    "Consumer Electronics",
    "Fashion & Textiles",
    "Home & Furniture",
    "Automotive Parts",
    "Toys & Recreation",
    "Other",
  ];

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Sustainable Product Design Assistant</h1>
        <p className="page-subtitle">
          Enter your product specifications and materials to analyze recyclability and discover eco-friendly alternatives.
        </p>
      </header>

      <div className="analysis-layout">
        {/* Main Specification Form */}
        <form className="analysis-form" onSubmit={handleCalculateScore}>
          {/* Section 1: General Product Specifications */}
          <section className="form-section card">
            <h2 className="section-title">1. Product Specifications</h2>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="productName">Product Name *</label>
                <input
                  id="productName"
                  name="name"
                  type="text"
                  placeholder="e.g., Eco Water Bottle, Wireless Mouse"
                  value={productInfo.name}
                  onChange={handleProductInfoChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={productInfo.category}
                  onChange={handleProductInfoChange}
                >
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="totalWeight">Total Estimated Weight (g)</label>
                <input
                  id="totalWeight"
                  name="totalWeight"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Total weight in grams"
                  value={productInfo.totalWeight}
                  onChange={handleProductInfoChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="packaging">Packaging Material / Type</label>
                <input
                  id="packaging"
                  name="packaging"
                  type="text"
                  placeholder="e.g., Recycled Cardboard Box, Bio-film Wrap"
                  value={productInfo.packaging}
                  onChange={handleProductInfoChange}
                />
              </div>
            </div>
          </section>

          {/* Section 2: Materials & Components Breakdown */}
          <section className="form-section card">
            <div className="section-header-row">
              <div>
                <h2 className="section-title">2. Materials & Components Breakdown</h2>
                <p className="section-description">
                  List each component part and its primary material to evaluate total recyclability.
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleAddMaterial}
              >
                + Add Material
              </button>
            </div>

            <div className="materials-list">
              {materials.map((mat, index) => (
                <MaterialRowInput
                  key={mat.id}
                  material={mat}
                  index={index}
                  onChange={handleMaterialChange}
                  onRemove={handleRemoveMaterial}
                  canRemove={materials.length > 1}
                />
              ))}
            </div>
          </section>

          {/* Form Actions */}
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              Calculate Recyclability Score
            </button>
          </div>
        </form>

        {/* Section 3: Reserved Area for Recyclability Score & Recommendations */}
        <aside className="score-panel card">
          <h2 className="section-title">Recyclability Analysis</h2>
          
          {isCalculated ? (
            <div className="score-placeholder-active">
              <div className="score-badge-placeholder">
                <span className="score-number">--</span>
                <span className="score-unit">/ 100</span>
              </div>
              <p className="score-status-text">
                Calculation engine ready to be connected.
              </p>
              <div className="placeholder-info-box">
                <h4>Calculation Insights Area</h4>
                <p>
                  In the next phase, the calculated recyclability score, material breakdown breakdown chart, and eco-friendly recommendations will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="score-placeholder-empty">
              <div className="placeholder-icon">🌱</div>
              <h3>No Score Calculated Yet</h3>
              <p>
                Fill out the product specifications and materials breakdown, then click <strong>"Calculate Recyclability Score"</strong> to view your sustainability report.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default ProductAnalysisPage;
