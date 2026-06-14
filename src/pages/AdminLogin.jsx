import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/admin');
      }
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin');
    } catch (err) {
      console.error("Login failed:", err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (authChecking) {
    return (
      <div className="flex-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <main className="container fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="admin-login-container">
        <h2 className="admin-login-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem' }}>Admin Access</h2>
        
        {error && (
          <div style={{ 
            color: '#cf222e', 
            backgroundColor: '#ffebe9', 
            border: '1px solid #ffc1c0',
            padding: 'var(--spacing-xs) var(--spacing-sm)', 
            fontSize: '0.85rem',
            marginBottom: 'var(--spacing-sm)' 
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="mono" style={{ fontSize: '0.75rem' }}>Email Address</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="admin@example.com"
            />
          </div>
          
          <div className="form-group">
            <label className="mono" style={{ fontSize: '0.75rem' }}>Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            className="admin-btn" 
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}
