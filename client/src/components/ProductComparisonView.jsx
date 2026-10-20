import React, { useState, useEffect } from 'react';
import { calculateScore } from '../services/api';

function ProductComparisonView({ products }) {
  const [prodIdA, setProdIdA] = useState(products.length > 0 ? (products[0]._id || products[0].id) : '');
  const [prodIdB, setProdIdB] = useState(products.length > 1 ? (products[1]._id || products[1].id) : (products.length > 0 ? (products[0]._id || products[0].id) : ''));

  const [scoreA, setScoreA] = useState(null);
  const [scoreB, setScoreB] = useState(null);
  const [loading, setLoading] = useState(false);

  const productA = products.find((p) => (p._id || p.id) === prodIdA);
  const productB = products.find((p) => (p._id || p.id) === prodIdB);

  useEffect(() => {
    if (!productA || !productB) return;

    const fetchScores = async () => {
      setLoading(true);
      try {
        const payloadA = {
          name: productA.name,
          category: productA.category,
          materials: productA.materials.map((m) => ({ name: m.name, weight: Number(m.weight), recyclabilityIndex: Number(m.recyclabilityIndex) }))
        };
        const payloadB = {
          name: productB.name,
          category: productB.category,
          materials: productB.materials.map((m) => ({ name: m.name, weight: Number(m.weight), recyclabilityIndex: Number(m.recyclabilityIndex) }))
        };

        const [resA, resB] = await Promise.all([
          calculateScore(payloadA),
          calculateScore(payloadB)
        ]);

        if (resA.success) setScoreA(resA.data);
        if (resB.success) setScoreB(resB.data);
      } catch (e) {
        console.error('Error fetching comparison scores:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, [prodIdA, prodIdB]);

  const totalWeightA = productA?.materials?.reduce((sum, m) => sum + (Number(m.weight) || 0), 0) || 0;
  const totalWeightB = productB?.materials?.reduce((sum, m) => sum + (Number(m.weight) || 0), 0) || 0;

  return (
    <div className="comparison-container">
      <div className="card">
        <h2>Objective Product Comparison</h2>
        <p className="subtitle">
          Compare specifications, total weight, material composition, and dynamic recyclability scores side-by-side.
        </p>

        {products.length < 2 ? (
          <div className="placeholder-container">
            <p>Please save at least 2 products in the database to run side-by-side product comparisons.</p>
          </div>
        ) : (
          <div>
            <div className="form-row" style={{ marginBottom: '20px' }}>
              <div className="form-group col">
                <label>Select Product A:</label>
                <select value={prodIdA} onChange={(e) => setProdIdA(e.target.value)}>
                  {products.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>{p.name} ({p.category})</option>
                  ))}
                </select>
              </div>

              <div className="form-group col">
                <label>Select Product B:</label>
                <select value={prodIdB} onChange={(e) => setProdIdB(e.target.value)}>
                  {products.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>{p.name} ({p.category})</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Computing objective score metrics...</p>
              </div>
            ) : productA && productB ? (
              <table className="material-table compare-table">
                <thead>
                  <tr>
                    <th>Specification Metric</th>
                    <th>Product A: {productA.name}</th>
                    <th>Product B: {productB.name}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Category</strong></td>
                    <td><span className="category-tag">{productA.category}</span></td>
                    <td><span className="category-tag">{productB.category}</span></td>
                  </tr>
                  <tr>
                    <td><strong>Version</strong></td>
                    <td>v{productA.version || 1}</td>
                    <td>v{productB.version || 1}</td>
                  </tr>
                  <tr>
                    <td><strong>Lifecycle Stage</strong></td>
                    <td>{productA.lifecycleStage || 'Design'}</td>
                    <td>{productB.lifecycleStage || 'Design'}</td>
                  </tr>
                  <tr>
                    <td><strong>Total Material Weight</strong></td>
                    <td><strong>{totalWeightA.toFixed(3)} kg</strong></td>
                    <td><strong>{totalWeightB.toFixed(3)} kg</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Materials Count</strong></td>
                    <td>{productA.materials?.length || 0} material(s)</td>
                    <td>{productB.materials?.length || 0} material(s)</td>
                  </tr>
                  <tr>
                    <td><strong>Materials List & Indices</strong></td>
                    <td>
                      <ul className="material-tags-list">
                        {productA.materials?.map((m, i) => (
                          <li key={i}>{m.name} ({m.weight}kg, Index: {m.recyclabilityIndex})</li>
                        ))}
                      </ul>
                    </td>
                    <td>
                      <ul className="material-tags-list">
                        {productB.materials?.map((m, i) => (
                          <li key={i}>{m.name} ({m.weight}kg, Index: {m.recyclabilityIndex})</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                  {scoreA && scoreB && (
                    <>
                      <tr>
                        <td><strong>Base Weighted Score</strong></td>
                        <td>{scoreA.baseWeightedScore}%</td>
                        <td>{scoreB.baseWeightedScore}%</td>
                      </tr>
                      <tr>
                        <td><strong>Mixed Material Penalty</strong></td>
                        <td>-{scoreA.penalties.mixedMaterialPenalty} pts</td>
                        <td>-{scoreB.penalties.mixedMaterialPenalty} pts</td>
                      </tr>
                      <tr>
                        <td><strong>Contamination Penalty</strong></td>
                        <td>-{scoreA.penalties.contaminationPenalty} pts</td>
                        <td>-{scoreB.penalties.contaminationPenalty} pts</td>
                      </tr>
                      <tr className="highlight-row">
                        <td><strong>Final Recyclability Score</strong></td>
                        <td><strong className="score-text">{scoreA.finalScore}% (Grade {scoreA.grade})</strong></td>
                        <td><strong className="score-text">{scoreB.finalScore}% (Grade {scoreB.grade})</strong></td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductComparisonView;
