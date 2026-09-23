import React, { useEffect, useState } from "react";
import MaterialRowInput from "../components/scoring/MaterialRowInput";
import {
  calculateScore,
  createProduct,
  getProducts,
  deleteProduct,
  updateProduct,
  getProductScore,
} from "../services/api";

function ProductAnalysisPage({
  onNavigateToSimulation,
  appliedMaterial,
  clearAppliedMaterial,
}) {
  // General Product Details State
  const [productInfo, setProductInfo] = useState({
    name: "",
    category: "Packaging & Containers",
    packaging: "",
    description: "",
  });

  // Dynamic Materials List State
  const [materials, setMaterials] = useState([
    {
      id: 1,
      name: "",
      type: "PET (Plastic)",
      weight: "",
      recyclabilityIndex: 85,
    },
  ]);

  // Edit Product state
  const [editingProduct, setEditingProduct] = useState(null);

  // Notification for simulated material applied from What-If
  const [appliedNotification, setAppliedNotification] = useState("");

  // Handle applied alternative material from What-If Simulation
  useEffect(() => {
    if (appliedMaterial) {
      const { componentName, material, recyclabilityIndex, materialIndex } =
        appliedMaterial;

      setMaterials((prev) => {
        if (
          materialIndex !== undefined &&
          materialIndex !== null &&
          prev[materialIndex]
        ) {
          return prev.map((item, idx) =>
            idx === materialIndex
              ? {
                  ...item,
                  name: componentName || item.name,
                  type: material,
                  recyclabilityIndex: recyclabilityIndex,
                }
              : item,
          );
        }

        const matchIdx = prev.findIndex(
          (m) =>
            (m.name || "").trim().toLowerCase() ===
            (componentName || "").trim().toLowerCase(),
        );

        if (matchIdx !== -1) {
          return prev.map((item, idx) =>
            idx === matchIdx
              ? {
                  ...item,
                  type: material,
                  recyclabilityIndex: recyclabilityIndex,
                }
              : item,
          );
        }

        return prev.map((item, idx) =>
          idx === 0
            ? {
                ...item,
                name: componentName || item.name,
                type: material,
                recyclabilityIndex: recyclabilityIndex,
              }
            : item,
        );
      });

      setAppliedNotification(
        `Applied simulated material "${material}" (Index: ${recyclabilityIndex}) to component "${componentName || "Component"}"!`,
      );

      if (clearAppliedMaterial) {
        clearAppliedMaterial();
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [appliedMaterial, clearAppliedMaterial]);

  // API interaction states for Calculation
  const [scoreResult, setScoreResult] = useState(null);
  const [lastCalculatedPayload, setLastCalculatedPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingScoreId, setLoadingScoreId] = useState(null);
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

  // Load saved products when component mounts
  useEffect(() => {
    loadProducts();
  }, []);

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
      id: Date.now(),
      name: "",
      type: "PET (Plastic)",
      weight: "",
      recyclabilityIndex: 85,
    };
    setMaterials((prev) => [...prev, newMaterial]);
  };

  // Update a specific field of a material row
  const handleMaterialChange = (id, field, value) => {
    setMaterials((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  // Remove a material row (keeps at least one)
  const handleRemoveMaterial = (id) => {
    if (materials.length > 1) {
      setMaterials((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Form validation logic
  const validateForm = () => {
    const errors = [];

    if (!productInfo.name.trim()) {
      errors.push("Product Name is required.");
    }

    if (!productInfo.category.trim()) {
      errors.push("Category is required.");
    }

    if (!materials || materials.length === 0) {
      errors.push("At least one material is required.");
    } else {
      materials.forEach((mat, idx) => {
        const itemNum = idx + 1;
        if (!mat.name.trim() && !mat.type) {
          errors.push(`Material #${itemNum}: Name is required.`);
        }
        const w = Number(mat.weight);
        if (mat.weight === "" || isNaN(w) || w <= 0) {
          errors.push(
            `Material #${itemNum}: Weight must be greater than 0 kg.`,
          );
        }
        const indexVal = Number(mat.recyclabilityIndex);
        if (
          mat.recyclabilityIndex === "" ||
          isNaN(indexVal) ||
          indexVal < 0 ||
          indexVal > 100
        ) {
          errors.push(
            `Material #${itemNum}: Recyclability Index must be between 0 and 100.`,
          );
        }
      });
    }

    return errors;
  };

  // Helper to compile structured product payload from form state
  const buildPayload = () => {
    const payload = {
      name: productInfo.name.trim(),
      category: productInfo.category.trim(),
      description: productInfo.description.trim(),
      materials: materials.map((m) => ({
        name: m.name.trim() || m.type,
        weight: Number(m.weight),
        recyclabilityIndex: Number(m.recyclabilityIndex),
      })),
    };

    if (productInfo.packaging?.trim()) {
      payload.packaging = {
        type: productInfo.packaging.trim(),
        material: productInfo.packaging.trim(),
      };
    }

    return payload;
  };

  // Submit handler calling score calculation API
  const handleCalculateScore = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
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

    const payload = buildPayload();

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
        err.message ||
          "Server error while calculating score. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Save handler calling Product creation API
  const handleSaveProduct = async () => {
    const payload = lastCalculatedPayload || buildPayload();
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    if (isSaved) return;

    setSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const response = await createProduct(payload);
      if (response && response.success) {
        const savedId = response.data?._id || response.data?.id;
        setIsSaved(true);
        setSaveSuccess(
          `Product saved successfully! ${savedId ? `(ID: ${savedId})` : ""}`,
        );
        // Refresh product history list automatically
        loadProducts();
      } else {
        setSaveError(response.error || "Failed to save product.");
      }
    } catch (err) {
      setSaveError(
        err.message || "Server error while saving product. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  // Update handler calling Product update API
  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    const id = editingProduct._id || editingProduct.id;

    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    setSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    const payload = buildPayload();

    try {
      const response = await updateProduct(id, payload);
      if (response && response.success) {
        setIsSaved(true);
        setSaveSuccess(`Product "${payload.name}" updated successfully!`);
        setEditingProduct(null);
        setLastCalculatedPayload(payload);

        // Recalculate score for updated product
        try {
          const scoreRes = await calculateScore(payload);
          if (scoreRes && scoreRes.success) {
            setScoreResult(scoreRes.data);
          }
        } catch {
          // ignore score recalculation error
        }

        await loadProducts();
      } else {
        setSaveError(response.error || "Failed to update product.");
      }
    } catch (err) {
      setSaveError(
        err.message || "Server error while updating product. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  // Main form submit dispatcher: updates if in edit mode, otherwise calculates score
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (editingProduct) {
      await handleUpdateProduct();
    } else {
      await handleCalculateScore(e);
    }
  };

  // Switch to edit mode and populate form with product's existing data
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setValidationErrors([]);
    setError(null);
    setSaveSuccess(null);
    setSaveError(null);
    setIsSaved(false);

    setProductInfo({
      name: product.name || "",
      category: product.category || "Packaging & Containers",
      packaging:
        product.packaging?.type ||
        product.packaging?.material ||
        (typeof product.packaging === "string" ? product.packaging : ""),
      description: product.description || "",
    });

    if (Array.isArray(product.materials) && product.materials.length > 0) {
      setMaterials(
        product.materials.map((m, idx) => ({
          id: m._id || Date.now() + idx,
          name: m.name || "",
          type: m.material || m.type || "PET (Plastic)",
          weight: m.weight !== undefined && m.weight !== null ? m.weight : "",
          recyclabilityIndex:
            m.recyclabilityIndex !== undefined && m.recyclabilityIndex !== null
              ? m.recyclabilityIndex
              : 85,
        })),
      );
    } else {
      setMaterials([
        {
          id: Date.now(),
          name: "",
          type: "PET (Plastic)",
          weight: "",
          recyclabilityIndex: 85,
        },
      ]);
    }

    // Auto-fetch current score for edited product
    const id = product._id || product.id;
    if (id) {
      handleViewScore(product);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Cancel edit mode and reset
  const handleCancelEdit = () => {
    setEditingProduct(null);
    setValidationErrors([]);
    setSaveError(null);
  };

  // Clear product inputs and reset materials to initial single-material row
  const handleClearForm = () => {
    setProductInfo({
      name: "",
      category: "Packaging & Containers",
      packaging: "",
      description: "",
    });
    setMaterials([
      {
        id: Date.now(),
        name: "",
        type: "PET (Plastic)",
        weight: "",
        recyclabilityIndex: 85,
      },
    ]);
    setScoreResult(null);
    setLastCalculatedPayload(null);
    setError(null);
    setValidationErrors([]);
    setSaving(false);
    setIsSaved(false);
    setSaveSuccess(null);
    setSaveError(null);
    setEditingProduct(null);
  };

  // Load and display calculated recyclability score for a stored product
  const handleViewScore = async (product) => {
    const id = product._id || product.id;
    if (!id) return;
    setLoadingScoreId(id);
    setError(null);
    setLoading(true);

    try {
      const response = await getProductScore(id);
      if (response && response.success) {
        setScoreResult(response.data);
        setIsSaved(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setError(response.error || "Failed to fetch product score.");
      }
    } catch (err) {
      setError(err.message || "Server error while fetching product score.");
    } finally {
      setLoading(false);
      setLoadingScoreId(null);
    }
  };

  // Delete handler calling Product deletion API
  const handleDeleteProduct = async (id) => {
    setDeletingProductId(id);
    try {
      const response = await deleteProduct(id);
      if (response && response.success) {
        setProducts((prev) => prev.filter((p) => (p._id || p.id) !== id));
        if (
          editingProduct &&
          (editingProduct._id === id || editingProduct.id === id)
        ) {
          handleClearForm();
        }
      } else {
        alert(response.error || "Failed to delete product.");
      }
    } catch (err) {
      alert(err.message || "Failed to delete product. Please try again.");
    } finally {
      setDeletingProductId(null);
    }
  };

  const categoryOptions = [
    "Packaging & Containers",
    "Plastic",
    "Paper & Cardboard",
    "Glass",
    "Metal",
    "Consumer Electronics",
    "Fashion & Textiles",
    "Home & Furniture",
    "Automotive Parts",
    "Other",
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <header className="page-header">
        <h1>Sustainable Product Design Assistant</h1>
        <p className="page-subtitle">
          Real-time Recyclability Score & Material Sustainability Assessment
        </p>
      </header>

      {/* Main 2-column Analysis Layout */}
      <div className="analysis-layout">
        {/* Left Side: Product Input Form */}
        <form className="analysis-form" onSubmit={handleFormSubmit}>
          {editingProduct && (
            <div
              style={{
                backgroundColor: "#e8f5e9",
                border: "1px solid #a5d6a7",
                borderRadius: "8px",
                padding: "12px 16px",
                marginBottom: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div>
                <strong style={{ color: "#1b5e20" }}>✏️ Edit Mode:</strong>{" "}
                <span style={{ color: "#2e7d32", fontWeight: 600 }}>
                  {editingProduct.name}
                </span>
              </div>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={handleCancelEdit}
              >
                Cancel Edit
              </button>
            </div>
          )}

          {/* Applied Simulation Banner */}
          {appliedNotification && (
            <div
              className="success-banner"
              style={{
                marginBottom: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>✓ {appliedNotification}</span>
              <button
                type="button"
                onClick={() => setAppliedNotification("")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#166534",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "1rem",
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Section 1: General Product Specifications */}
          <section className="form-section card">
            <div className="section-header-row">
              <h2 className="section-title">1. Product Specifications</h2>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={handleClearForm}
                title="Clear all fields and start a new product"
              >
                + New Product / Clear
              </button>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="productName">Product Name *</label>
                <input
                  id="productName"
                  name="name"
                  type="text"
                  placeholder="e.g. Eco Friendly Water Bottle"
                  value={productInfo.name}
                  onChange={handleProductInfoChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category *</label>
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

              <div className="form-group">
                <label htmlFor="productDescription">
                  Description (Optional)
                </label>
                <textarea
                  id="productDescription"
                  name="description"
                  placeholder="Brief description of product features..."
                  rows="2"
                  value={productInfo.description}
                  onChange={handleProductInfoChange}
                />
              </div>
            </div>
          </section>

          {/* Section 2: Materials & Components Breakdown */}
          <section className="form-section card">
            <div className="section-header-row">
              <div>
                <h2 className="section-title">
                  2. Materials & Components Breakdown
                </h2>
                <p className="section-description">
                  List each component part, its primary material, weight (kg),
                  and recyclability index (0–100).
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

          {/* Submit Action Button */}
          <div
            className="form-actions"
            style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
          >
            {editingProduct ? (
              <>
                <button
                  type="submit"
                  className="btn-success"
                  style={{ flex: 1, minWidth: "160px" }}
                  disabled={saving}
                >
                  {saving ? "Updating..." : "Update Product"}
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ flex: 1, minWidth: "160px" }}
                  disabled={loading}
                  onClick={handleCalculateScore}
                >
                  {loading ? "Calculating..." : "Recalculate Score"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCancelEdit}
                >
                  Cancel Edit
                </button>
              </>
            ) : (
              <>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, minWidth: "180px" }}
                  disabled={loading}
                >
                  {loading ? "Calculating..." : "Calculate Recyclability Score"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleClearForm}
                >
                  Clear Form
                </button>
              </>
            )}
          </div>
        </form>

        {/* Right Side: Recyclability Assessment Results */}
        <aside className="score-panel card">
          <h2 className="section-title">Recyclability Assessment</h2>

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
                    <strong>
                      -{scoreResult.penalties?.mixedMaterialPenalty} pts
                    </strong>
                  </div>
                  <div className="breakdown-item penalty">
                    <span>Contamination Penalty</span>
                    <strong>
                      -{scoreResult.penalties?.contaminationPenalty} pts
                    </strong>
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

              {/* Sustainable Design Recommendations */}
              {scoreResult.recommendations &&
                scoreResult.recommendations.length > 0 && (
                  <div className="breakdown-section">
                    <h3>🌱 Sustainable Design Recommendations</h3>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      {scoreResult.recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: "12px",
                            border: "1px solid #c8e6c9",
                            borderRadius: "8px",
                            backgroundColor: "#f1f8e9",
                          }}
                        >
                          <strong>
                            Current Material: {rec.currentMaterial}
                          </strong>

                          {rec.suggestedMaterial && (
                            <p style={{ margin: "6px 0" }}>
                              <strong>Suggested Alternative:</strong>{" "}
                              {rec.suggestedMaterial}
                            </p>
                          )}

                          <p style={{ margin: "6px 0 0" }}>
                            <strong>Reason:</strong> {rec.reason}
                          </p>

                          {rec.suggestedMaterial && onNavigateToSimulation && (
                            <div style={{ marginTop: "10px" }}>
                              <button
                                type="button"
                                className="btn-secondary btn-sm"
                                onClick={() => {
                                  const rawAlt = rec.suggestedMaterial
                                    .split(" or ")[0]
                                    .trim();
                                  onNavigateToSimulation({
                                    productId:
                                      editingProduct?._id ||
                                      editingProduct?.id ||
                                      null,
                                    currentMaterial: rec.currentMaterial,
                                    alternativeMaterial: rawAlt,
                                  });
                                }}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  color: "#166534",
                                  backgroundColor: "#ffffff",
                                  borderColor: "#86efac",
                                  fontWeight: 600,
                                }}
                                title="Open this recommendation in What-If Simulation"
                              >
                                <span>⚡ Test in What-If Simulation</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {scoreResult.recommendations &&
                scoreResult.recommendations.length === 0 && (
                  <div className="breakdown-section">
                    <h3>🌱 Sustainable Design Recommendations</h3>
                    <p>
                      Your current material selection has no major
                      recommendation issues. Keep using recyclable and
                      compatible materials.
                    </p>
                  </div>
                )}

              {/* Save Product Action Section */}
              <div className="save-action-section">
                {saveSuccess && (
                  <div className="success-banner">{saveSuccess}</div>
                )}
                {saveError && <div className="error-banner">{saveError}</div>}

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <button
                    type="button"
                    className="btn-success btn-save"
                    style={{ flex: 1 }}
                    disabled={saving || (isSaved && !editingProduct)}
                    onClick={
                      editingProduct ? handleUpdateProduct : handleSaveProduct
                    }
                  >
                    {saving
                      ? editingProduct
                        ? "Updating..."
                        : "Saving..."
                      : editingProduct
                        ? "Update Product"
                        : isSaved
                          ? "Product Saved ✓"
                          : "Save Product"}
                  </button>
                  {editingProduct && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleCancelEdit}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="score-placeholder-empty">
              <div className="placeholder-icon">🌱</div>
              <h3>No Score Calculated Yet</h3>
              <p>
                Fill out the product specifications and materials breakdown,
                then click <strong>"Calculate Recyclability Score"</strong> to
                view your sustainability report.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Bottom Section: Saved Products History */}
      <section className="saved-products-section">
        <div className="section-header-row">
          <div>
            <h2 className="section-title">
              Saved Products ({products.length})
            </h2>
            <p className="section-description">
              View and manage products saved to your MongoDB database.
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={loadProducts}
            disabled={productsLoading}
          >
            {productsLoading ? "Refreshing..." : "Refresh Products"}
          </button>
        </div>

        {productsError && <div className="error-banner">{productsError}</div>}

        {productsLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading saved products from database...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="placeholder-container">
            <p>No saved products yet.</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => {
              const id = product._id || product.id;
              const totalWeight = product.materials
                ? product.materials.reduce(
                    (sum, m) => sum + (Number(m.weight) || 0),
                    0,
                  )
                : 0;

              return (
                <div key={id} className="card product-card">
                  <div className="product-card-header">
                    <div>
                      <h3 className="product-name">{product.name}</h3>
                      <span className="category-tag">{product.category}</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        disabled={loadingScoreId === id}
                        onClick={() => handleViewScore(product)}
                        title="View calculated recyclability score"
                      >
                        {loadingScoreId === id ? "Loading..." : "View Score"}
                      </button>
                      {onNavigateToSimulation && (
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          onClick={() =>
                            onNavigateToSimulation({
                              productId: id,
                            })
                          }
                          title="Simulate alternative materials for this product"
                          style={{
                            color: "#166534",
                            backgroundColor: "#f0fdf4",
                            borderColor: "#86efac",
                            fontWeight: 600,
                          }}
                        >
                          ⚡ Simulate
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => handleEditProduct(product)}
                        title="Edit product details"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-danger-text"
                        disabled={deletingProductId === id}
                        onClick={() => handleDeleteProduct(id)}
                      >
                        {deletingProductId === id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>

                  {product.description && (
                    <p className="product-desc">{product.description}</p>
                  )}

                  <div className="materials-summary">
                    <strong>
                      Materials ({product.materials?.length || 0}):
                    </strong>
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
                    <span>Total Material Weight:</span>
                    <strong>{totalWeight.toFixed(3)} kg</strong>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default ProductAnalysisPage;
