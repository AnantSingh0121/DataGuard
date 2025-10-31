import { useNavigate } from 'react-router-dom';
import { BarChart3, FileCheck, Shield, Zap } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <nav className="navbar">
        <div className="navbar-brand">
          <BarChart3 size={32} />
          DataGuard
        </div>
        <div className="navbar-menu">
          <button 
            className="btn-primary"
            onClick={() => navigate('/login')}
            data-testid="nav-login-btn"
          >
            Login
          </button>
        </div>
      </nav>

      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title" data-testid="hero-title">
            Ensure Data Quality
            <span className="gradient-text"> with Confidence</span>
          </h1>
          <p className="hero-subtitle" data-testid="hero-subtitle">
            Comprehensive data quality analysis, governance and reporting for your datasets.
            Upload, analyze and get actionable insights instantly.
          </p>
          <div className="hero-actions">
            <button 
              className="btn-primary btn-large"
              onClick={() => navigate('/login')}
              data-testid="get-started-btn"
            >
              Get Started
            </button>
          </div>
        </div>
        
        <div className="hero-image">
          <div className="floating-card">
            <div className="metric-display">
              <div className="metric-value">98.5%</div>
              <div className="metric-label">Data Health Score</div>
            </div>
          </div>
        </div>
      </div>

      <div className="features-section">
        <h2 className="section-title" data-testid="features-title">Powerful Features</h2>
        <div className="features-grid">
          <div className="feature-card" data-testid="feature-missing-values">
            <div className="feature-icon">
              <FileCheck size={40} />
            </div>
            <h3>Missing Values Detection</h3>
            <p>Identify and quantify missing data across all columns with detailed reports</p>
          </div>
          
          <div className="feature-card" data-testid="feature-duplicates">
            <div className="feature-icon">
              <Shield size={40} />
            </div>
            <h3>Duplicate Detection</h3>
            <p>Find exact and partial duplicates to ensure data integrity</p>
          </div>
          
          <div className="feature-card" data-testid="feature-type-analysis">
            <div className="feature-icon">
              <Zap size={40} />
            </div>
            <h3>Type Analysis</h3>
            <p>Detect data type mismatches and inconsistencies automatically</p>
          </div>
          
          <div className="feature-card" data-testid="feature-pdf-reports">
            <div className="feature-icon">
              <BarChart3 size={40} />
            </div>
            <h3>PDF Reports</h3>
            <p>Generate comprehensive visual reports with charts and insights</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .landing-page {
          min-height: 100vh;
        }

        .hero-section {
          max-width: 1400px;
          margin: 0 auto;
          padding: 6rem 2rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }

        .hero-content {
          animation: fadeInUp 0.8s ease;
        }

        .hero-title {
          font-size: 3.5rem;
          font-weight: 700;
          line-height: 1.2;
          margin-bottom: 1.5rem;
          color: #0f172a;
        }

        .gradient-text {
          background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: #475569;
          line-height: 1.8;
          margin-bottom: 2rem;
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
        }

        .btn-large {
          padding: 1rem 2.5rem;
          font-size: 1.125rem;
        }

        .hero-image {
          display: flex;
          justify-content: center;
          align-items: center;
          animation: fadeIn 1s ease;
        }

        .floating-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 3rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          animation: float 3s ease-in-out infinite;
        }

        .metric-display {
          text-align: center;
        }

        .metric-value {
          font-size: 4rem;
          font-weight: 700;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-family: 'Space Grotesk', sans-serif;
        }

        .metric-label {
          color: #64748b;
          font-size: 1.125rem;
          margin-top: 0.5rem;
        }

        .features-section {
          max-width: 1400px;
          margin: 0 auto;
          padding: 4rem 2rem;
        }

        .section-title {
          text-align: center;
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 3rem;
          color: #0f172a;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
        }

        .feature-card {
          background: white;
          padding: 2rem;
          border-radius: 20px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }

        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
          border-color: #0ea5e9;
        }

        .feature-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0ea5e9;
          margin-bottom: 1.5rem;
        }

        .feature-card h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: #0f172a;
        }

        .feature-card p {
          color: #64748b;
          line-height: 1.7;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @media (max-width: 768px) {
          .hero-section {
            grid-template-columns: 1fr;
            padding: 3rem 1rem;
          }

          .hero-title {
            font-size: 2.5rem;
          }

          .hero-subtitle {
            font-size: 1.125rem;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;