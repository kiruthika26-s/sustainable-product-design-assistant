import React, { useEffect, useState } from "react";
import {
  calculateScore,
  createProduct,
  getProducts,
  deleteProduct,
  getMaterials,
  getMe,
  setAuthToken
} from "./services/api";
import Navbar from "./components/Navbar";
import DashboardView from "./components/DashboardView";
import ProductDetailModal from "./components/ProductDetailModal";
import RecommendationsView from "./components/RecommendationsView";
import WhatIfSimulationView from "./components/WhatIfSimulationView";
import ProductComparisonView from "./components/ProductComparisonView";
import AuthModal from "./components/AuthModal";
import "./App.css";

const FALLBACK_MATERIALS = [
  { name: "PET", category: "Plastics", recyclabilityIndex: 85 },
  { name: "HDPE", category: "Plastics", recyclabilityIndex: 80 },
  { name: "PVC", category: "Plastics", recyclabilityIndex: 30 },
  { name: "Aluminium", category: "Metals", recyclabilityIndex: 98 },
  { name: "Glass", category: "Glass", recyclabilityIndex: 95 },
  { name: "Paper", category: "Paper & Cardboard", recyclabilityIndex: 90 },
  { name: "LDPE", category: "Plastics", recyclabilityIndex: null },
  { name: "PP", category: "Plastics", recyclabilityIndex: null },
  { name: "PS", category: "Plastics", recyclabilityIndex: null },
  { name: "ABS", category: "Plastics", recyclabilityIndex: null },
  { name: "Steel", category: "Metals", recyclabilityIndex: null },
  { name: "Stainless Steel", category: "Metals", recyclabilityIndex: null },
  { name: "Copper", category: "Metals", recyclabilityIndex: null },
  { name: "Cardboard", category: "Paper & Cardboard", recyclabilityIndex: null },
  { name: "Wood", category: "Bio-Based & Wood", recyclabilityIndex: null }
];

function App() {
  // Navigation tab state: 'dashboard' | 'create' | 'saved' | 'recommendations' | 'whatif' | 'compare'
  const [activeTab, setActiveTab] = useState("dashboard");

  // Auth State
  const [currentUser, setCurrentUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Selected Product for Details Modal
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Material Knowledge Base State
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialsError, setMaterialsError] = useState(null);

  const activeMaterialsList =
    availableMaterials.length > 0 ? availableMaterials : FALLBACK_MATERIALS;

  // Product details state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Plastic");
  const [description, setDescription] = useState("");

  // Optional Packaging Specification state
  const [showPackaging, setShowPackaging] = useState(false);
  const [packagingMaterial, setPackagingMaterial] = useState("");
  const [packagingWeight, setPackagingWeight] = useState("");
  const [packagingIndex, setPackagingIndex] = useState("");

  // Materials array state (initialized with first canonical material)
  const [materials, setMaterials] = useState([
    { name: "PET", weight: "", recyclabilityIndex: 85 }
  ]);

  // Simulation Preset for bridge from Recommendations or Saved Products to What-If
  const [simulationPreset, setSimulationPreset] = useState(null);

  // Search and Filter states for Saved Products List
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStage, setFilterStage] = useState("All");

  // API interaction states for Calculation
  const [scoreResult, setScoreResult] = useState(null);
  const [lastCalculatedPayload, setLastCalculatedPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  // API interaction states for Saving
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [saveError, setSaveError] = useState(null);

  // API interaction states for Saved Products List
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);

  // Load Material Knowledge Base on startup
  useEffect(() => {
    const fetchKbMaterials = async () => {
      setMaterialsLoading(true);
      setMaterialsError(null);
      try {
        const res = await getMaterials();
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setAvailableMaterials(res.data);
        }
      } catch (_err) {
        setMaterialsError("Could not fetch materials from server. Using offline dataset.");
      } finally {
        setMaterialsLoading(false);
      }
    };
    fetchKbMaterials();
  }, []);

  // Load current logged-in user on startup if token exists
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getMe();
        if (res && res.success) {
          setCurrentUser(res.data);
        }
      } catch (_e) {
        // Token expired or invalid
      }
    };
    fetchUser();
  }, []);

  // Load saved products from MongoDB Atlas
  const loadProducts = async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const response = await getProducts();
      if (response && response.success) {
        setProducts(response.data || []);
      } else {
        setProductsError(response.error || "Failed to load saved products.");
      }
    } catch (err) {
      setProductsError(err.message || "Failed to load saved products.");
    } finally {
      setProductsLoading(false);
    }
  };

  // Load saved products when App mounts
  useEffect(() => {
    loadProducts();
  }, []);

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
  };

  // Material list handlers
  const handleAddMaterial = () => {
    const defaultMat = activeMaterialsList[0] || { name: "PET", recyclabilityIndex: 85 };
    setMaterials([
      ...materials,
      {
        name: defaultMat.name,
        weight: "",
        recyclabilityIndex:
          defaultMat.recyclabilityIndex !== null && defaultMat.recyclabilityIndex !== undefined
            ? defaultMat.recyclabilityIndex
            : ""
      }
    ]);
  };

  const handleRemoveMaterial = (index) => {
    if (materials.length > 1) {
      setMaterials(materials.filter((_, i) => i !== index));
    }
  };

  const handleMaterialSelect = (index, selectedName) => {
    const matched = activeMaterialsList.find(
      (m) => m.name.toLowerCase() === selectedName.toLowerCase()
    );
    const updated = [...materials];
    updated[index].name = matched ? matched.name : selectedName;
    updated[index].recyclabilityIndex =
      matched && matched.recyclabilityIndex !== null && matched.recyclabilityIndex !== undefined
        ? matched.recyclabilityIndex
        : "";
    setMaterials(updated);
  };

  const handleMaterialWeightChange = (index, weight) => {
    const updated = [...materials];
    updated[index].weight = weight;
    setMaterials(updated);
  };

  // Form validation logic
  const validateForm = () => {
    const errors = [];

    if (!name.trim()) {
      errors.push("Product Name is required.");
    }

    if (!category.trim()) {
      errors.push("Category is required.");
    }

    if (!materials || materials.length === 0) {
      errors.push("At least one material is required.");
    } else {
      materials.forEach((mat, idx) => {
        const itemNum = idx + 1;
        if (!mat.name || !mat.name.trim()) {
          errors.push(`Material #${itemNum}: Name is required.`);
        }
        const w = Number(mat.weight);
        if (mat.weight === "" || isNaN(w) || w <= 0) {
          errors.push(`Material #${itemNum}: Weight must be greater than 0.`);
        }
        const indexVal = Number(mat.recyclabilityIndex);
        if (
          mat.recyclabilityIndex === "" ||
          mat.recyclabilityIndex === null ||
          mat.recyclabilityIndex === undefined ||
          isNaN(indexVal) ||
          indexVal < 0 ||
          indexVal > 100
        ) {
          errors.push(
            `Material #${itemNum} (${mat.name}): Recyclability index is unavailable in the Material Knowledge Base and cannot be evaluated.`
          );
        }
      });
    }

    return errors;
  };

  // Submit handler calling score calculation API
  const handleCalculateScore = async (e) => {
    e.preventDefault();
    setScoreResult(null);
    setLastCalculatedPayload(null);
    setError(null);
    setIsSaved(false);
    setSaveSuccess(null);
    setSaveError(null);

    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    setLoading(true);

    const payloadMaterials = materials.map((m) => ({
      name: m.name.trim(),
      weight: Number(m.weight),
      recyclabilityIndex: Number(m.recyclabilityIndex)
    }));

    let packagingData = null;
    if (showPackaging && packagingMaterial.trim() && Number(packagingWeight) > 0) {
      packagingData = {
        material: packagingMaterial.trim(),
        weight: Number(packagingWeight),
        recyclabilityIndex: Number(packagingIndex) || 0
      };
      // Include packaging material in recyclability evaluation
      payloadMaterials.push({
        name: `Packaging: ${packagingMaterial.trim()}`,
        weight: Number(packagingWeight),
        recyclabilityIndex: Number(packagingIndex) || 0
      });
    }

    const payload = {
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
      materials: payloadMaterials,
      packaging: packagingData
    };

    try {
      const response = await calculateScore(payload);
      if (response && response.success) {
        setScoreResult(response.data);
        setLastCalculatedPayload(payload);
      } else {
        setError(response.error || "Failed to calculate recyclability score.");
      }
    } catch (err) {
      setError(
        err.message || "Server error while calculating score. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Save handler calling Product creation API
  const handleSaveProduct = async () => {
    if (!lastCalculatedPayload || isSaved) return;

    setSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const response = await createProduct(lastCalculatedPayload);
      if (response && response.success) {
        const savedId = response.data?._id || response.data?.id;
        setIsSaved(true);
        setSaveSuccess(
          `Product saved successfully! ${
            savedId ? `(ID: ${savedId})` : ""
          }`
        );
        // Refresh product history list automatically
        loadProducts();
      } else {
        setSaveError(response.error || "Failed to save product.");
      }
    } catch (err) {
      setSaveError(
        err.message || "Server error while saving product. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete handler calling Product deletion API
  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    setDeletingProductId(id);
    try {
      const response = await deleteProduct(id);
      if (response && response.success) {
        setProducts((prev) => prev.filter((p) => (p._id || p.id) !== id));
      } else {
        alert(response.error || "Failed to delete product.");
      }
    } catch (err) {
      alert(err.message || "Failed to delete product. Please try again.");
    } finally {
      setDeletingProductId(null);
    }
  };

  return (
    <div className="container">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      <header className="header" style={{ marginTop: "15px" }}>
        <h1>Sustainable Product Lifecycle Management Platform</h1>
        <p className="subtitle">
          Real-time Recyclability Score & Material Sustainability Assessment
        </p>
      </header>

      {/* Main Content Rendered According to Active Tab */}
      {activeTab === "dashboard" && (
        <DashboardView
          products={products}
          onSelectProduct={(p) => setSelectedProduct(p)}
          onNavigate={(tab) => setActiveTab(tab)}
        />
      )}

      {activeTab === "create" && (
        <main className="main-content">
          {/* Left Side: Product Input Form */}
          <section className="card form-card">
            <h2>Product Specification</h2>

            <form onSubmit={handleCalculateScore}>
              <div className="form-group">
                <label htmlFor="productName">Product Name *</label>
                <input
                  id="productName"
                  type="text"
                  placeholder="e.g. Eco Friendly Water Bottle"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="productCategory">Category *</label>
                <select
                  id="productCategory"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Plastic">Plastic</option>
                  <option value="Paper">Paper</option>
                  <option value="Glass">Glass</option>
                  <option value="Metal">Metal</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="productDescription">Description (Optional)</label>
                <textarea
                  id="productDescription"
                  placeholder="Brief description of product features..."
                  rows="2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Materials List Section */}
              <div className="materials-section">
                <div className="section-header">
                  <div>
                    <h3>Materials Composition</h3>
                    {materialsLoading && (
                      <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                        Loading Knowledge Base materials...
                      </span>
                    )}
                    {materialsError && (
                      <span style={{ fontSize: "0.8rem", color: "#c2410c" }}>
                        {materialsError}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={handleAddMaterial}
                  >
                    + Add Material
                  </button>
                </div>

                {materials.map((mat, index) => {
                  const matched = activeMaterialsList.find(
                    (m) => m.name.toLowerCase() === mat.name.toLowerCase()
                  );
                  const isConfigured =
                    mat.recyclabilityIndex !== "" &&
                    mat.recyclabilityIndex !== null &&
                    mat.recyclabilityIndex !== undefined;

                  return (
                    <div key={index} className="material-item-card">
                      <div className="material-item-header">
                        <span>Material #{index + 1}</span>
                        {materials.length > 1 && (
                          <button
                            type="button"
                            className="btn-danger-text"
                            onClick={() => handleRemoveMaterial(index)}
                            title="Remove Material"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Material (Knowledge Base) *</label>
                        <select
                          value={matched ? matched.name : mat.name}
                          onChange={(e) =>
                            handleMaterialSelect(index, e.target.value)
                          }
                        >
                          {activeMaterialsList.map((m) => {
                            const hasIdx =
                              m.recyclabilityIndex !== null &&
                              m.recyclabilityIndex !== undefined;
                            return (
                              <option key={m.name || m._id} value={m.name}>
                                {m.name} ({m.category || "General"}){" "}
                                {hasIdx
                                  ? `— Index: ${m.recyclabilityIndex}`
                                  : "— [Index Unavailable]"}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="form-row">
                        <div className="form-group col">
                          <label>Weight (kg) *</label>
                          <input
                            type="number"
                            min="0.001"
                            step="0.001"
                            placeholder="e.g. 0.25"
                            value={mat.weight}
                            onChange={(e) =>
                              handleMaterialWeightChange(index, e.target.value)
                            }
                          />
                        </div>

                        <div className="form-group col">
                          <label>Recyclability Index (Read-Only) *</label>
                          <input
                            type="text"
                            readOnly
                            value={
                              isConfigured
                                ? `${mat.recyclabilityIndex} / 100`
                                : "Unavailable"
                            }
                            style={{
                              backgroundColor: isConfigured ? "#f1f5f9" : "#fff3e0",
                              color: isConfigured ? "#1e293b" : "#c2410c",
                              fontWeight: 600,
                              cursor: "not-allowed"
                            }}
                            title="Recyclability index is automatically populated from the Material Knowledge Base"
                          />
                        </div>
                      </div>

                      {!isConfigured && (
                        <div
                          style={{
                            marginTop: "6px",
                            padding: "6px 10px",
                            backgroundColor: "#fff7ed",
                            border: "1px solid #fed7aa",
                            borderRadius: "4px",
                            color: "#c2410c",
                            fontSize: "0.85rem"
                          }}
                        >
                          ⚠️ Recyclability index is unconfigured in Knowledge Base. This material cannot be evaluated for scoring until configured.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Validation Errors Banner */}
              {validationErrors.length > 0 && (
                <div className="error-banner">
                  <strong>Please fix the following errors:</strong>
                  <ul>
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* API Calculation Error Alert */}
              {error && <div className="error-banner">{error}</div>}

              <button
                type="submit"
                className="btn-primary btn-submit"
                disabled={loading}
              >
                {loading ? "Calculating..." : "Calculate Recyclability Score"}
              </button>
            </form>
          </section>

          {/* Right Side: Score Results Display & Save Section */}
          <section className="card result-card">
            <h2>Recyclability Assessment</h2>

            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Calculating sustainability score from backend engine...</p>
              </div>
            ) : scoreResult ? (
              <div className="results-container">
                {/* Overall Score Badge */}
                <div
                  className={`score-badge-card grade-${scoreResult.grade?.toLowerCase()}`}
                >
                  <div className="score-number">{scoreResult.finalScore}%</div>
                  <div className="score-details">
                    <span className="grade-pill">Grade {scoreResult.grade}</span>
                    <span className="rating-text">{scoreResult.rating}</span>
                  </div>
                </div>

                {/* Score Breakdown Table */}
                <div className="breakdown-section">
                  <h3>Score Breakdown</h3>
                  <div className="breakdown-list">
                    <div className="breakdown-item">
                      <span>Base Weighted Score</span>
                      <strong>{scoreResult.baseWeightedScore}%</strong>
                    </div>
                    <div className="breakdown-item penalty">
                      <span>Mixed Material Penalty</span>
                      <strong>-{scoreResult.penalties?.mixedMaterialPenalty} pts</strong>
                    </div>
                    <div className="breakdown-item penalty">
                      <span>Contamination Penalty</span>
                      <strong>-{scoreResult.penalties?.contaminationPenalty} pts</strong>
                    </div>
                    <div className="breakdown-item total-penalty">
                      <span>Total Penalty Deductions</span>
                      <strong>-{scoreResult.penalties?.totalPenalty} pts</strong>
                    </div>
                  </div>
                </div>

                {/* Material Percentages Table */}
                {scoreResult.materialBreakdown &&
                  scoreResult.materialBreakdown.length > 0 && (
                    <div className="breakdown-section">
                      <h3>Material Contribution Analysis</h3>
                      <table className="material-table">
                        <thead>
                          <tr>
                            <th>Material</th>
                            <th>Weight</th>
                            <th>Share</th>
                            <th>Index</th>
                            <th>Points</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scoreResult.materialBreakdown.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.name}</td>
                              <td>{item.weight} kg</td>
                              <td>{item.weightPercentage}%</td>
                              <td>{item.recyclabilityIndex}/100</td>
                              <td>+{item.contribution}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                {/* Save Product Action Section */}
                <div className="save-action-section">
                  {saveSuccess && (
                    <div className="success-banner">{saveSuccess}</div>
                  )}
                  {saveError && <div className="error-banner">{saveError}</div>}

                  <button
                    type="button"
                    className="btn-success btn-save"
                    disabled={saving || isSaved}
                    onClick={handleSaveProduct}
                  >
                    {saving
                      ? "Saving..."
                      : isSaved
                      ? "Product Saved ✓"
                      : "Save Product"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="placeholder-container">
                <div className="placeholder-icon">🌱</div>
                <p>
                  Fill out the product specifications and materials form, then
                  click <strong>"Calculate Recyclability Score"</strong> to view
                  the dynamic sustainability report.
                </p>
              </div>
            )}
          </section>
        </main>
      )}

      {activeTab === "saved" && (
        <section className="saved-products-section" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
          <div className="section-header">
            <h2>Saved Products ({products.length})</h2>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={loadProducts}
              disabled={productsLoading}
            >
              {productsLoading ? "Refreshing..." : "Refresh Products"}
            </button>
          </div>

          {productsError && (
            <div className="error-banner">{productsError}</div>
          )}

          {productsLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading saved products from database...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="placeholder-container card">
              <p>No saved products yet. Click <strong>Create & Score</strong> to evaluate and save a product!</p>
            </div>
          ) : (
            <div className="products-grid">
              {products.map((product) => {
                const id = product._id || product.id;
                const totalWeight = product.materials
                  ? product.materials.reduce(
                      (sum, m) => sum + (Number(m.weight) || 0),
                      0
                    )
                  : 0;

                return (
                  <div key={id} className="card product-card">
                    <div className="product-card-header">
                      <div>
                        <h3 className="product-name">{product.name}</h3>
                        <span className="category-tag">{product.category}</span>
                        <span className="version-tag">v{product.version || 1}</span>
                      </div>
                      <button
                        type="button"
                        className="btn-danger-text"
                        disabled={deletingProductId === id}
                        onClick={() => handleDeleteProduct(id)}
                      >
                        {deletingProductId === id ? "Deleting..." : "Delete"}
                      </button>
                    </div>

                    {product.description && (
                      <p className="product-desc">{product.description}</p>
                    )}

                    <div className="materials-summary">
                      <strong>Materials ({product.materials?.length || 0}):</strong>
                      <ul className="material-tags-list">
                        {product.materials?.map((mat, i) => (
                          <li key={i}>
                            <span>{mat.name}</span>
                            <span className="mat-weight">{mat.weight} kg</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="product-card-footer">
                      <span>Total Weight: <strong>{totalWeight.toFixed(3)} kg</strong></span>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          className="btn-secondary btn-sm"
                          onClick={() => setSelectedProduct(product)}
                        >
                          View Details
                        </button>
                        <button
                          className="btn-primary btn-sm"
                          onClick={() => {
                            setSimulationPreset({
                              targetMaterialName: product.materials?.[0]?.name || "",
                              alternativeMaterialName: ""
                            });
                            setActiveTab("whatif");
                          }}
                        >
                          ⚡ Simulate
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === "recommendations" && (
        <RecommendationsView
          products={products}
          currentScoreResult={scoreResult}
          onApplyAlternative={(rec) => {
            setSimulationPreset({
              targetMaterialName: rec.currentMaterial,
              alternativeMaterialName: rec.alternativeMaterial
            });
            setActiveTab("whatif");
          }}
        />
      )}

      {activeTab === "whatif" && (
        <WhatIfSimulationView
          products={products}
          simulationPreset={simulationPreset}
          onProductSaved={loadProducts}
        />
      )}

      {activeTab === "compare" && (
        <ProductComparisonView products={products} />
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onRefresh={loadProducts}
        />
      )}

      {/* Auth Modal */}
      {authModalOpen && (
        <AuthModal
          onClose={() => setAuthModalOpen(false)}
          onAuthSuccess={(user) => setCurrentUser(user)}
        />
      )}
    </div>
  );
}

export default App;