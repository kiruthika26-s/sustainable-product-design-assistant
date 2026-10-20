import React from 'react';
import { generateMaterialRecommendations, MATERIAL_DATABASE } from '../utils/materialDb';

function RecommendationsView({ products, currentScoreResult, onApplyAlternative }) {
  // If user has calculated a current product in the session, use its materials, otherwise pick first saved product
  const targetMaterials = currentScoreResult?.materialBreakdown
    ? currentScoreResult.materialBreakdown
    : products.length > 0 && products[0].materials
    ? products[0].materials
    : [];

  const recommendations = generateMaterialRecommendations(targetMaterials);

  return (
    <div className="recommendations-container">
      <div className="card">
        <h2>Eco-Friendly Material Recommendations</h2>
        <p className="subtitle">
          Automated material substitution suggestions to reduce penalty points and boost product recyclability ratings.
        </p>

        {recommendations.length === 0 ? (
          <div className="placeholder-container">
            <p>
              {targetMaterials.length === 0
                ? 'Create or select a product to generate material substitution recommendations.'
                : 'Great job! Your current product materials already feature high recyclability indices.'}
            </p>
          </div>
        ) : (
          <div className="recommendations-grid">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="recommendation-card">
                <div className="rec-header">
                  <span className="rec-badge">Optimization #{idx + 1}</span>
                  <span className="gain-pill">+{rec.indexGain} Index Points</span>
                </div>

                <div className="rec-comparison">
                  <div className="rec-box current">
                    <span className="box-label">Current Material</span>
                    <strong>{rec.currentMaterial}</strong>
                    <span className="index-val">Index: {rec.currentIndex}/100</span>
                    <span className="weight-val">Weight: {rec.currentWeight} kg</span>
                  </div>

                  <div className="arrow-divider">➔</div>

                  <div className="rec-box alternative">
                    <span className="box-label">Suggested Alternative</span>
                    <strong>{rec.alternativeMaterial}</strong>
                    <span className="index-val">Index: {rec.alternativeIndex}/100</span>
                    <span className="category-val">Category: {rec.alternativeCategory}</span>
                  </div>
                </div>

                <p className="rec-reason">{rec.reason}</p>

                <button
                  type="button"
                  className="btn-secondary"
                  style={{ marginTop: '12px', width: '100%', fontSize: '0.85rem' }}
                  onClick={() => onApplyAlternative && onApplyAlternative(rec)}
                >
                  Test in What-If Simulation
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reference Library Section */}
      <div className="card" style={{ marginTop: '25px' }}>
        <h3>Standard Material Recyclability Reference Library</h3>
        <table className="material-table">
          <thead>
            <tr>
              <th>Material Name</th>
              <th>Category</th>
              <th>Recyclability Index</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {MATERIAL_DATABASE.map((mat, i) => (
              <tr key={i}>
                <td><strong>{mat.name}</strong></td>
                <td><span className="category-tag">{mat.category}</span></td>
                <td><strong>{mat.recyclabilityIndex} / 100</strong></td>
                <td>{mat.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RecommendationsView;
