import React from 'react';

function Navbar({ activeTab, setActiveTab, currentUser, onOpenAuth, onLogout }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'create', label: 'Create & Score', icon: '➕' },
    { id: 'saved', label: 'Saved Products', icon: '📁' },
    { id: 'recommendations', label: 'Recommendations', icon: '💡' },
    { id: 'whatif', label: 'What-If Simulation', icon: '🔄' },
    { id: 'compare', label: 'Product Compare', icon: '⚖️' }
  ];

  return (
    <nav className="top-navbar">
      <div className="nav-brand">
        <span className="brand-logo">🌱</span>
        <span className="brand-name">Eco Design Assistant</span>
      </div>

      <div className="nav-menu">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-tab ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-text">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="nav-user">
        {currentUser ? (
          <div className="user-profile-badge">
            <span className="user-name">👤 {currentUser.name}</span>
            <button className="btn-logout-sm" onClick={onLogout} title="Log Out">
              Log Out
            </button>
          </div>
        ) : (
          <button className="btn-login-sm" onClick={onOpenAuth}>
            🔑 Login / Register
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
