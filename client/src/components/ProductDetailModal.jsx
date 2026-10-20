import React, { useState, useEffect } from 'react';
import {
  getScoreByProductId,
  getProductVersions,
  downloadProductPdf,
  updateProduct,
  createProductVersion
} from '../services/api';

function ProductDetailModal({ product, onClose, onRefresh }) {
  const [scoreData, setScoreData] = useState(null);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [versions, setVersions] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [currentStage, setCurrentStage] = useState(product?.lifecycleStage || 'Design');

  // Version Branching States
  const [showVersionForm, setShowVersionForm] = useState(false);
  const [versionName, setVersionName] = useState(
    product ? `${product.name} (Iteration)` : ''
  );
  const [versionStage, setVersionStage] = useState('Design');
  const [versionMaterials, setVersionMaterials] = useState(
    product?.materials ? JSON.parse(JSON.stringify(product.materials)) : []
  );
  const [creatingVersion, setCreatingVersion] = useState(false);
  const [versionSuccessMsg, setVersionSuccessMsg] = useState(null);
  const [versionErrorMsg, setVersionErrorMsg] = useState(null);

  const productId = product?._id || product?.id;

  // Function to reload versions
  const fetchVersions = async () => {
    if (!productId) return;
    setVersionsLoading(true);
    try {
      const res = await getProductVersions(productId);
      if (res && res.success) {
        setVersions(res.data || []);
      }
    } catch (e) {
      console.error('Failed to load versions:', e);
    } finally {
      setVersionsLoading(false);
    }
  };

  useEffect(() => {
    if (!productId) return;

    // Load dynamic score for product
    const fetchScore = async () => {
      setScoreLoading(true);
      try {
        const res = await getScoreByProductId(productId);
        if (res && res.success) {
          setScoreData(res.data);
        }
      } catch (e) {
        console.error('Failed to load score:', e);
      } finally {
        setScoreLoading(false);
      }
    };

    fetchScore();
    fetchVersions();
  }, [productId]);

  const handleDownloadPdf = async () => {
    if (!productId) return;
    setPdfLoading(true);
    try {
      await downloadProductPdf(productId, `${product.name.replace(/[^a-z0-9]/gi, '_')}_Report.pdf`);
    } catch (err) {
      alert(err.message || 'Failed to download PDF report.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleStageChange = async (newStage) => {
    if (!productId || newStage === currentStage) return;
    setUpdatingStage(true);
    try {
      const res = await updateProduct(productId, { lifecycleStage: newStage });
      if (res && res.success) {
        setCurrentStage(newStage);
        if (onRefresh) onRefresh();
      }
    } catch (e) {
      alert('Failed to update lifecycle stage');
    } finally {
      setUpdatingStage(false);
    }
  };

  // Version material handlers
  const handleVersionMaterialChange = (index, field, value) => {
    const updated = [...versionMaterials];
    updated[index][field] = value;
    setVersionMaterials(updated);
  };

  const handleAddVersionMaterial = () => {
    setVersionMaterials([
      ...versionMaterials,
      { name: '', weight: '', recyclabilityIndex: '' }
    ]);
  };

  const handleRemoveVersionMaterial = (index) => {
    if (versionMaterials.length > 1) {
      setVersionMaterials(versionMaterials.filter((_, i) => i !== index));
    }
  };

  const handleCreateNewVersion = async (e) => {
    e.preventDefault();
    if (!productId) return;

    setCreatingVersion(true);
    setVersionErrorMsg(null);
    setVersionSuccessMsg(null);

    try {
      const payload = {
        name: versionName.trim() || `${product.name} (Iteration)`,
        category: product.category,
        lifecycleStage: versionStage,
        materials: versionMaterials.map((m) => ({
          name: m.name.trim(),
          weight: Number(m.weight) || 0,
          recyclabilityIndex: Number(m.recyclabilityIndex) || 0
        }))
      };

      const res = await createProductVersion(productId, payload);
      if (res && res.success) {
        setVersionSuccessMsg(`Version v${res.data.version} created successfully!`);
        setShowVersionForm(false);
        fetchVersions();
        if (onRefresh) onRefresh();
      } else {
        setVersionErrorMsg(res.error || 'Failed to create new version');
      }
    } catch (err) {
      setVersionErrorMsg(err.message || 'Server error creating product version');
    } finally {
      setCreatingVersion(false);
    }
  };

  if (!product) return null;

  const totalWeight = product.materials
    ? product.materials.reduce((sum, m) => sum + (Number(m.weight) || 0), 0)
    : 0;

  const stages = ['Design', 'Manufacture', 'Distribution', 'Use', 'End-of-Life'];

  return (
    <div className="modal-backdrop">
      <div className="modal-content card">
        <div className="modal-header">
          <div>
            <h2>{product.name}</h2>
            <span className="category-tag">{product.category}</span>
            <span className="version-tag">Version {product.version || 1}</span>
          </div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Action Bar: PDF Download & Version Creator Toggle */}
          <div className="action-bar-row" style={{ gap: '10px' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '9px 15px', fontSize: '0.88rem' }}
              onClick={() => {
                setShowVersionForm(!showVersionForm);
                setVersionSuccessMsg(null);
                setVersionErrorMsg(null);
              }}
            >
              {showVersionForm ? '✕ Close Iteration Form' : 'Create New Version / Iteration'}
            </button>
            <button
              className="btn-primary btn-pdf"
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              style={{ marginTop: 0 }}
            >
              {pdfLoading ? 'Generating PDF Report...' : 'Download PDF Sustainability Report'}
            </button>
          </div>

          {versionSuccessMsg && (
            <div className="success-banner" style={{ marginBottom: '16px' }}>
              {versionSuccessMsg}
            </div>
          )}

          {/* New Version Creation Form Card */}
          {showVersionForm && (
            <div className="card" style={{ backgroundColor: '#fcfdfc', borderColor: '#a5d6a7', marginBottom: '22px' }}>
              <h4 style={{ color: '#1b4d3e', marginTop: 0 }}>Branch into New Product Iteration</h4>
              <p style={{ fontSize: '0.85rem', color: '#4a5568', margin: '0 0 14px 0' }}>
                Create a linked revision with modified material parameters and lifecycle stage.
              </p>

              <form onSubmit={handleCreateNewVersion}>
                <div className="form-row">
                  <div className="form-group col">
                    <label>Iteration / Version Name *</label>
                    <input
                      type="text"
                      value={versionName}
                      onChange={(e) => setVersionName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group col">
                    <label>Lifecycle Stage</label>
                    <select
                      value={versionStage}
                      onChange={(e) => setVersionStage(e.target.value)}
                    >
                      {stages.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="materials-section" style={{ marginTop: '10px', paddingTop: '10px' }}>
                  <div className="section-header">
                    <h5 style={{ margin: 0, color: '#2d5a27' }}>Iterated Materials</h5>
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={handleAddVersionMaterial}
                    >
                      + Add Material
                    </button>
                  </div>

                  {versionMaterials.map((mat, idx) => (
                    <div key={idx} className="material-item-card" style={{ padding: '10px' }}>
                      <div className="material-item-header">
                        <span>Material #{idx + 1}</span>
                        {versionMaterials.length > 1 && (
                          <button
                            type="button"
                            className="btn-danger-text"
                            onClick={() => handleRemoveVersionMaterial(idx)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="form-row">
                        <div className="form-group col" style={{ flex: 2, marginBottom: '6px' }}>
                          <input
                            type="text"
                            placeholder="Material Name"
                            value={mat.name}
                            onChange={(e) => handleVersionMaterialChange(idx, 'name', e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group col" style={{ marginBottom: '6px' }}>
                          <input
                            type="number"
                            step="0.001"
                            min="0.001"
                            placeholder="Weight (kg)"
                            value={mat.weight}
                            onChange={(e) => handleVersionMaterialChange(idx, 'weight', e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group col" style={{ marginBottom: '6px' }}>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Index (0-100)"
                            value={mat.recyclabilityIndex}
                            onChange={(e) => handleVersionMaterialChange(idx, 'recyclabilityIndex', e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {versionErrorMsg && <div className="error-banner">{versionErrorMsg}</div>}

                <button
                  type="submit"
                  className="btn-success"
                  disabled={creatingVersion}
                  style={{ marginTop: '12px' }}
                >
                  {creatingVersion ? 'Saving New Version...' : 'Save as New Version'}
                </button>
              </form>
            </div>
          )}

          {/* Lifecycle Tracking Bar */}
          <div className="lifecycle-container">
            <h4>Product Lifecycle Tracking</h4>
            <div className="lifecycle-stepper">
              {stages.map((stage, i) => {
                const isActive = stage === currentStage;
                const isPassed = stages.indexOf(currentStage) >= i;
                return (
                  <button
                    key={stage}
                    className={`lifecycle-step ${isActive ? 'active' : ''} ${isPassed ? 'passed' : ''}`}
                    onClick={() => handleStageChange(stage)}
                    disabled={updatingStage}
                  >
                    <span className="step-num">{i + 1}</span>
                    <span className="step-label">{stage}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Basic Info */}
          <div className="detail-section">
            <h4>Specification Details</h4>
            <p className="detail-desc">{product.description || 'No description provided.'}</p>
            <div className="detail-grid">
              <div><strong>Total Weight:</strong> {totalWeight.toFixed(3)} kg</div>
              <div><strong>Created Date:</strong> {new Date(product.createdAt).toLocaleDateString()}</div>
              <div><strong>Last Updated:</strong> {new Date(product.updatedAt).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Materials Table */}
          <div className="detail-section">
            <h4>Materials Composition</h4>
            <table className="material-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Material Name</th>
                  <th>Weight (kg)</th>
                  <th>Recyclability Index</th>
                </tr>
              </thead>
              <tbody>
                {product.materials?.map((mat, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td><strong>{mat.name}</strong></td>
                    <td>{mat.weight} kg</td>
                    <td>{mat.recyclabilityIndex} / 100</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Dynamic Score Report Section */}
          <div className="detail-section">
            <h4>Calculated Recyclability Assessment</h4>
            {scoreLoading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Calculating live recyclability score...</p>
              </div>
            ) : scoreData ? (
              <div className="score-badge-card grade-a">
                <div className="score-number">{scoreData.finalScore}%</div>
                <div className="score-details">
                  <span className="grade-pill">Grade {scoreData.grade}</span>
                  <span className="rating-text">{scoreData.rating}</span>
                </div>
              </div>
            ) : (
              <p>Score unavailable.</p>
            )}
          </div>

          {/* Version History Timeline */}
          {versions.length > 1 && (
            <div className="detail-section">
              <h4>Product Version History</h4>
              <div className="version-timeline">
                {versions.map((ver) => (
                  <div key={ver._id || ver.id} className="version-item">
                    <span className="version-badge">v{ver.version}</span>
                    <div className="version-info">
                      <strong>{ver.name}</strong> ({ver.materials?.length || 0} materials)
                      <span className="version-date">{new Date(ver.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Back to Products</button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailModal;
