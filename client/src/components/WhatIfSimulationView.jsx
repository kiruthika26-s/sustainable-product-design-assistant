import React, { useState, useEffect } from 'react';
import { calculateScore, createProduct, createProductVersion } from '../services/api';
import { MATERIAL_DATABASE } from '../utils/materialDb';

function WhatIfSimulationView({ products, simulationPreset, onProductSaved }) {
  const [selectedProductId, setSelectedProductId] = useState(
    products.length > 0 ? (products[0]._id || products[0].id) : ''
  );
  const [materialIndexToSwap, setMaterialIndexToSwap] = useState(0);
  const [selectedAltMaterialName, setSelectedAltMaterialName] = useState(MATERIAL_DATABASE[0].name);

  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [lastSwappedPayload, setLastSwappedPayload] = useState(null);
  const [error, setError] = useState(null);

  // Persistence States
  const [savingAsProduct, setSavingAsProduct] = useState(false);
  const [savingAsVersion, setSavingAsVersion] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState(null);

  const activeProduct =
    products.find((p) => (p._id || p.id) === selectedProductId) ||
    (products.length > 0 ? products[0] : null);

  // Sync simulation preset if triggered from Recommendations
  useEffect(() => {
    if (simulationPreset && activeProduct?.materials) {
      if (simulationPreset.alternativeMaterialName) {
        setSelectedAltMaterialName(simulationPreset.alternativeMaterialName);
      }
      if (simulationPreset.targetMaterialName) {
        const idx = activeProduct.materials.findIndex(
          (m) => m.name.toLowerCase() === simulationPreset.targetMaterialName.toLowerCase()
        );
        if (idx !== -1) {
          setMaterialIndexToSwap(idx);
        }
      }
    }
  }, [simulationPreset, activeProduct]);

  const handleRunSimulation = async () => {
    if (!activeProduct || !activeProduct.materials || activeProduct.materials.length === 0) {
      setError('Please select a valid product with materials composition.');
      return;
    }

    setSimulating(true);
    setError(null);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    const refMaterial =
      MATERIAL_DATABASE.find((m) => m.name === selectedAltMaterialName) || MATERIAL_DATABASE[0];

    // 1. Calculate Original Score
    const originalPayload = {
      name: activeProduct.name,
      category: activeProduct.category,
      description: activeProduct.description,
      materials: activeProduct.materials.map((m) => ({
        name: m.name,
        weight: Number(m.weight),
        recyclabilityIndex: Number(m.recyclabilityIndex)
      }))
    };

    // 2. Prepare Swapped Payload
    const swappedMaterials = activeProduct.materials.map((m, idx) => {
      if (idx === Number(materialIndexToSwap)) {
        return {
          name: refMaterial.name,
          weight: Number(m.weight),
          recyclabilityIndex: refMaterial.recyclabilityIndex
        };
      }
      return {
        name: m.name,
        weight: Number(m.weight),
        recyclabilityIndex: Number(m.recyclabilityIndex)
      };
    });

    const swappedPayload = {
      ...originalPayload,
      materials: swappedMaterials
    };

    try {
      const origRes = await calculateScore(originalPayload);
      const swapRes = await calculateScore(swappedPayload);

      if (origRes.success && swapRes.success) {
        const origScore = origRes.data.finalScore;
        const swapScore = swapRes.data.finalScore;
        const diff = swapScore - origScore;

        setLastSwappedPayload(swappedPayload);
        setSimulationResult({
          productName: activeProduct.name,
          swappedMaterialOld: activeProduct.materials[materialIndexToSwap]?.name,
          swappedMaterialNew: refMaterial.name,
          originalScore: origScore,
          originalGrade: origRes.data.grade,
          alternativeScore: swapScore,
          alternativeGrade: swapRes.data.grade,
          difference: diff,
          originalReport: origRes.data,
          alternativeReport: swapRes.data
        });
      } else {
        setError('Failed to compute simulation scores.');
      }
    } catch (err) {
      setError(err.message || 'Server error running what-if simulation.');
    } finally {
      setSimulating(false);
    }
  };

  const handleSaveAsNewProduct = async () => {
    if (!lastSwappedPayload) return;
    setSavingAsProduct(true);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);
    try {
      const payload = {
        ...lastSwappedPayload,
        name: `${lastSwappedPayload.name} (Simulated Variant)`
      };
      const res = await createProduct(payload);
      if (res && res.success) {
        setSaveSuccessMsg(`Product variant "${payload.name}" successfully saved to MongoDB Atlas!`);
        if (onProductSaved) onProductSaved();
      } else {
        setSaveErrorMsg(res.error || 'Failed to save product.');
      }
    } catch (err) {
      setSaveErrorMsg(err.message || 'Error saving simulated product.');
    } finally {
      setSavingAsProduct(false);
    }
  };

  const handleSaveAsNewVersion = async () => {
    if (!lastSwappedPayload || !activeProduct) return;
    const parentId = activeProduct._id || activeProduct.id;
    setSavingAsVersion(true);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);
    try {
      const payload = {
        name: `${activeProduct.name} (v${(activeProduct.version || 1) + 1} - Eco Optimized)`,
        category: activeProduct.category,
        lifecycleStage: activeProduct.lifecycleStage || 'Design',
        materials: lastSwappedPayload.materials
      };
      const res = await createProductVersion(parentId, payload);
      if (res && res.success) {
        setSaveSuccessMsg(`Version v${res.data.version} created and linked to ${activeProduct.name}!`);
        if (onProductSaved) onProductSaved();
      } else {
        setSaveErrorMsg(res.error || 'Failed to create new version.');
      }
    } catch (err) {
      setSaveErrorMsg(err.message || 'Error creating new version.');
    } finally {
      setSavingAsVersion(false);
    }
  };

  return (
    <div className="whatif-container">
      <div className="card">
        <h2>What-If Material Alternative Simulation</h2>
        <p className="subtitle">
          Test material substitution scenarios in real time and evaluate the net impact on recyclability scores before manufacturing.
        </p>

        {products.length === 0 ? (
          <div className="placeholder-container">
            <p>No saved products available for simulation. Please save a product first.</p>
          </div>
        ) : (
          <div className="simulation-form">
            <div className="form-group">
              <label>Select Product for Simulation:</label>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setMaterialIndexToSwap(0);
                  setSimulationResult(null);
                  setLastSwappedPayload(null);
                  setSaveSuccessMsg(null);
                }}
              >
                {products.map((p) => (
                  <option key={p._id || p.id} value={p._id || p.id}>
                    {p.name} ({p.category}) — {p.materials?.length || 0} materials
                  </option>
                ))}
              </select>
            </div>

            {activeProduct && activeProduct.materials && (
              <div className="form-row">
                <div className="form-group col">
                  <label>Replace Component Material:</label>
                  <select
                    value={materialIndexToSwap}
                    onChange={(e) => {
                      setMaterialIndexToSwap(e.target.value);
                      setSimulationResult(null);
                    }}
                  >
                    {activeProduct.materials.map((mat, i) => (
                      <option key={i} value={i}>
                        Material #{i + 1}: {mat.name} ({mat.weight} kg, Index: {mat.recyclabilityIndex})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group col">
                  <label>Swap With Eco Alternative:</label>
                  <select
                    value={selectedAltMaterialName}
                    onChange={(e) => {
                      setSelectedAltMaterialName(e.target.value);
                      setSimulationResult(null);
                    }}
                  >
                    {MATERIAL_DATABASE.map((ref, i) => (
                      <option key={i} value={ref.name}>
                        {ref.name} (Index: {ref.recyclabilityIndex}/100)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {error && <div className="error-banner">{error}</div>}

            <button
              className="btn-primary"
              disabled={simulating}
              onClick={handleRunSimulation}
            >
              {simulating ? 'Calculating What-If Simulation...' : '⚡ Run What-If Simulation'}
            </button>
          </div>
        )}
      </div>

      {/* Simulation Results Display */}
      {simulationResult && (
        <div className="card" style={{ marginTop: '25px' }}>
          <h3>Simulation Result Breakdown</h3>

          <div className="simulation-comparison-grid">
            {/* Original Score Box */}
            <div className="score-badge-card grade-b">
              <div className="score-number">{simulationResult.originalScore}%</div>
              <div className="score-details">
                <span className="grade-pill">Grade {simulationResult.originalGrade}</span>
                <span className="rating-text">Original Score</span>
              </div>
            </div>

            {/* Score Difference Indicator */}
            <div className={`diff-pill-card ${simulationResult.difference >= 0 ? 'positive' : 'negative'}`}>
              <span className="diff-label">Expected Net Change</span>
              <span className="diff-value">
                {simulationResult.difference >= 0 ? `+${simulationResult.difference}` : simulationResult.difference} pts
              </span>
            </div>

            {/* Alternative Score Box */}
            <div className="score-badge-card grade-a">
              <div className="score-number">{simulationResult.alternativeScore}%</div>
              <div className="score-details">
                <span className="grade-pill">Grade {simulationResult.alternativeGrade}</span>
                <span className="rating-text">Alternative Score</span>
              </div>
            </div>
          </div>

          <div className="simulation-summary-box">
            <p>
              Replacing <strong>{simulationResult.swappedMaterialOld}</strong> with <strong>{simulationResult.swappedMaterialNew}</strong> results in an expected recyclability score shift of{' '}
              <strong>{simulationResult.difference >= 0 ? `+${simulationResult.difference}` : simulationResult.difference} points</strong> (from {simulationResult.originalScore}% to {simulationResult.alternativeScore}%).
            </p>
          </div>

          {/* Action to Save Simulation */}
          <div className="save-action-section" style={{ marginTop: '20px' }}>
            {saveSuccessMsg && <div className="success-banner">{saveSuccessMsg}</div>}
            {saveErrorMsg && <div className="error-banner">{saveErrorMsg}</div>}

            <div className="form-row">
              <div className="col">
                <button
                  type="button"
                  className="btn-success"
                  disabled={savingAsVersion || savingAsProduct}
                  onClick={handleSaveAsNewVersion}
                >
                  {savingAsVersion ? 'Saving Version...' : '🌿 Save as New Version / Revision'}
                </button>
              </div>
              <div className="col">
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: '100%', padding: '12px 18px', fontSize: '0.95rem' }}
                  disabled={savingAsProduct || savingAsVersion}
                  onClick={handleSaveAsNewProduct}
                >
                  {savingAsProduct ? 'Saving Product...' : '💾 Save as Standalone Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WhatIfSimulationView;
