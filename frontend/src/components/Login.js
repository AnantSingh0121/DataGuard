import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { BarChart3 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Login = ({ onLogin }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isSignup ? '/auth/signup' : '/auth/login';
      const payload = isSignup 
        ? { name: formData.name, email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password };

      const response = await axios.post(`${API}${endpoint}`, payload);
      
      toast.success(isSignup ? 'Account created successfully!' : 'Login successful!');
      onLogin(response.data.user, response.data.token);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" data-testid="login-container">
      <Toaster position="top-right" />
      
      <div className="login-card glass-card">
        <div className="login-header">
          <div className="brand-logo">
            <BarChart3 size={40} />
          </div>
          <h1 data-testid="auth-title">{isSignup ? 'Create Account' : 'Welcome Back'}</h1>
          <p>{isSignup ? 'Start analyzing your data quality' : 'Sign in to continue'}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form" data-testid="auth-form">
          {isSignup && (
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                className="input-field"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required={isSignup}
                placeholder="Enter your name"
                data-testid="input-name"
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="input-field"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="Enter your email"
              data-testid="input-email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="input-field"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Enter your password"
              data-testid="input-password"
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            data-testid="submit-btn"
          >
            {loading ? 'Please wait...' : (isSignup ? 'Sign Up' : 'Login')}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {isSignup ? 'Already have an account?' : "Don't have an account?"}
            <button 
              onClick={() => setIsSignup(!isSignup)}
              className="toggle-link"
              data-testid="toggle-auth-btn"
            >
              {isSignup ? 'Login' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .login-card {
          width: 100%;
          max-width: 450px;
          padding: 3rem;
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .brand-logo {
          display: inline-flex;
          padding: 1rem;
          background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
          border-radius: 16px;
          color: white;
          margin-bottom: 1rem;
        }

        .login-header h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          color: #0f172a;
        }

        .login-header p {
          color: #64748b;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 600;
          color: #334155;
        }

        .login-footer {
          text-align: center;
          margin-top: 2rem;
          color: #64748b;
        }

        .toggle-link {
          background: none;
          border: none;
          color: #0ea5e9;
          font-weight: 600;
          cursor: pointer;
          margin-left: 0.5rem;
          text-decoration: underline;
        }

        .toggle-link:hover {
          color: #0284c7;
        }
      `}</style>
    </div>
  );
};

export default Login;