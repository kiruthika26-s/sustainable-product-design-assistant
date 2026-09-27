import React, { useState } from 'react';
import { registerUser, loginUser } from '../services/api';

function AuthModal({ onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please fill out all required fields.');
      return;
    }

    if (!isLogin && !name.trim()) {
      setError('Name is required for registration.');
      return;
    }

    setLoading(true);

    try {
      let res;
      if (isLogin) {
        res = await loginUser({ email: email.trim(), password });
      } else {
        res = await registerUser({ name: name.trim(), email: email.trim(), password });
      }

      if (res && res.success) {
        onAuthSuccess(res.data);
        onClose();
      } else {
        setError(res.error || 'Authentication failed');
      }
    } catch (err) {
      setError(err.message || 'Server error during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content auth-modal-card card">
        <div className="modal-header">
          <h2>{isLogin ? '🔑 Account Login' : '📝 Register Manufacturer Account'}</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {!isLogin && (
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              placeholder="e.g. designer@manufacturer.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              placeholder="Enter password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="error-banner">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Log In' : 'Register Account'}
          </button>
        </form>

        <div className="auth-toggle-footer">
          {isLogin ? (
            <p>
              Don't have an account?{' '}
              <button className="btn-link" onClick={() => { setIsLogin(false); setError(null); }}>
                Register here
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button className="btn-link" onClick={() => { setIsLogin(true); setError(null); }}>
                Log in here
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
