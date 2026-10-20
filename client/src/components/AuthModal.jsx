import React, { useState, useEffect, useRef, useCallback } from 'react';
import { registerUser, loginUser, loginWithGoogle } from '../services/api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function AuthModal({ onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const googleButtonRef = useRef(null);

  const handleGoogleCredentialResponse = useCallback(
    async (response) => {
      if (!response || !response.credential) {
        setError('Failed to obtain Google authentication credentials.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await loginWithGoogle(response.credential);
        if (res && res.success) {
          onAuthSuccess(res.data);
          onClose();
        } else {
          setError(res?.error || 'Google authentication failed');
        }
      } catch (err) {
        setError(err.message || 'Server error during Google authentication');
      } finally {
        setLoading(false);
      }
    },
    [onAuthSuccess, onClose]
  );

  useEffect(() => {
    if (!isLogin || !GOOGLE_CLIENT_ID) return;

    let intervalId = null;

    const renderGoogleBtn = () => {
      if (window.google?.accounts?.id && googleButtonRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            auto_select: false
          });
          googleButtonRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: 'outline',
            size: 'large',
            width: 380,
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left'
          });
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        } catch (err) {
          console.error('Google Sign-In render error:', err);
        }
      }
    };

    if (window.google?.accounts?.id) {
      renderGoogleBtn();
    } else {
      intervalId = setInterval(() => {
        if (window.google?.accounts?.id) {
          renderGoogleBtn();
        }
      }, 200);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLogin, handleGoogleCredentialResponse]);

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
          <h2>{isLogin ? 'Account Login' : 'Register Manufacturer Account'}</h2>
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

        {isLogin && (
          <div className="google-auth-container">
            <div className="auth-divider">
              <span>or</span>
            </div>
            {GOOGLE_CLIENT_ID ? (
              <div ref={googleButtonRef} className="google-btn-wrapper" />
            ) : (
              <button
                type="button"
                className="btn-google-disabled"
                disabled
                title="Google Sign-In is not configured"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.347 2.825.957 4.039l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
                </svg>
                Sign in with Google (Configure VITE_GOOGLE_CLIENT_ID)
              </button>
            )}
          </div>
        )}

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
