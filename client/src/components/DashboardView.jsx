import React from 'react';

function DashboardView({ products, onSelectProduct, onNavigate }) {
  const totalProducts = products.length;
  
  // Calculate total materials count
  const totalMaterials = products.reduce((sum, p) => sum + (p.materials?.length || 0), 0);

  // Group by category
  const categoryCounts = products.reduce((acc, p) => {
    const cat = p.category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const recentProducts = products.slice(0, 4);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>System Performance & Sustainability Dashboard</h2>
        <p className="subtitle">Real-time metrics and database summary</p>
      </div>

      {/* Metric Cards Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">📦</div>
          <div className="metric-data">
            <span className="metric-value">{totalProducts}</span>
            <span className="metric-label">Total Saved Products</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🔬</div>
          <div className="metric-data">
            <span className="metric-value">{totalMaterials}</span>
            <span className="metric-label">Materials Tracked</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🏷️</div>
          <div className="metric-data">
            <span className="metric-value">{Object.keys(categoryCounts).length}</span>
            <span className="metric-label">Active Categories</span>
          </div>
        </div>

        <div className="metric-card highlight">
          <div className="metric-icon">⚡</div>
          <div className="metric-data">
            <span className="metric-value">Dynamic</span>
            <span className="metric-label">Engine Active</span>
          </div>
        </div>
      </div>

      <div className="dashboard-row">
        {/* Category Breakdown Panel */}
        <div className="card dashboard-card">
          <h3>Category Distribution</h3>
          {Object.keys(categoryCounts).length === 0 ? (
            <p className="empty-text">No product data available yet.</p>
          ) : (
            <div className="category-list">
              {Object.entries(categoryCounts).map(([cat, count]) => (
                <div key={cat} className="category-row">
                  <span className="cat-name">{cat}</span>
                  <div className="bar-container">
                    <div
                      className="bar-fill"
                      style={{ width: `${(count / totalProducts) * 100}%` }}
                    ></div>
                  </div>
                  <span className="cat-count">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Action Shortcuts Panel */}
        <div className="card dashboard-card">
          <h3>Quick Operations</h3>
          <div className="shortcuts-list">
            <button className="shortcut-btn" onClick={() => onNavigate('create')}>
              <span>➕</span> Evaluate New Product Specification
            </button>
            <button className="shortcut-btn" onClick={() => onNavigate('whatif')}>
              <span>🔄</span> Run What-If Material Simulation
            </button>
            <button className="shortcut-btn" onClick={() => onNavigate('compare')}>
              <span>⚖️</span> Compare 2 Saved Products
            </button>
            <button className="shortcut-btn" onClick={() => onNavigate('recommendations')}>
              <span>💡</span> View Eco Recommendations
            </button>
          </div>
        </div>
      </div>

      {/* Recent Products Panel */}
      <div className="card dashboard-card full-width">
        <h3>Recent Saved Products</h3>
        {recentProducts.length === 0 ? (
          <div className="placeholder-container">
            <p>No products saved in database. Click <strong>Create & Score</strong> to add your first product!</p>
          </div>
        ) : (
          <table className="material-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Materials</th>
                <th>Created Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentProducts.map((p) => (
                <tr key={p._id || p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td><span className="category-tag">{p.category}</span></td>
                  <td>{p.materials?.length || 0} material(s)</td>
                  <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => onSelectProduct(p)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default DashboardView;
