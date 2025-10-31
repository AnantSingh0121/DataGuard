import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { BarChart3, Upload, LogOut, Plus, Trash2, Eye } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ user, onLogout }) => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/datasets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDatasets(response.data);
    } catch (error) {
      toast.error('Failed to fetch datasets');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (datasetId) => {
    if (!window.confirm('Are you sure you want to delete this dataset?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/datasets/${datasetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Dataset deleted successfully');
      fetchDatasets();
    } catch (error) {
      toast.error('Failed to delete dataset');
    }
  };

  const getHealthColor = (score) => {
  if (score >= 90) return 'health-excellent';     
  if (score >= 75) return 'health-good';          
  if (score >= 60) return 'health-fair';          
  if (score >= 40) return 'health-poor';        
  return 'health-critical';                       
};

const getHealthLabel = (score) => {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Poor';
  return 'Need Attention';
};


  return (
    <div data-testid="dashboard">
      <Toaster position="top-right" />
      
      <nav className="navbar">
        <div className="navbar-brand">
          <BarChart3 size={32} />
          DataGuard
        </div>
        <div className="navbar-menu">
          <button 
            className="navbar-link" 
            onClick={() => navigate('/dashboard')}
            data-testid="nav-dashboard-btn"
          >
            Dashboard
          </button>
          <button 
            className="navbar-link" 
            onClick={() => navigate('/upload')}
            data-testid="nav-upload-btn"
          >
            Upload
          </button>
          <div className="user-info" data-testid="user-info">
            <span>{user.name}</span>
            <button 
              className="logout-btn" 
              onClick={onLogout}
              data-testid="logout-btn"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1 data-testid="dashboard-title">Your Datasets</h1>
            <p className="subtitle">Manage and analyze your data quality</p>
          </div>
          <button 
            className="btn-primary"
            onClick={() => navigate('/upload')}
            data-testid="upload-new-btn"
          >
            <Plus size={20} />
            Upload New Dataset
          </button>
        </div>

        {loading ? (
          <div className="loading-container" data-testid="loading">
            <div className="loader"></div>
          </div>
        ) : datasets.length === 0 ? (
          <div className="empty-state glass-card" data-testid="empty-state">
            <Upload size={64} className="empty-icon" />
            <h2>No datasets yet</h2>
            <p>Upload your first dataset to get started with data quality analysis</p>
            <button 
              className="btn-primary"
              onClick={() => navigate('/upload')}
              data-testid="empty-upload-btn"
            >
              Upload Dataset
            </button>
          </div>
        ) : (
          <div className="datasets-grid" data-testid="datasets-grid">
            {datasets.map((dataset) => (
              <div key={dataset.id} className="dataset-card glass-card" data-testid={`dataset-card-${dataset.id}`}>
                <div className="dataset-header">
                  <h3 data-testid={`dataset-filename-${dataset.id}`}>{dataset.filename}</h3>
                  <div className="dataset-actions">
                    <button
                      className="icon-btn"
                      onClick={() => navigate(`/analysis/${dataset.id}`)}
                      title="View Analysis"
                      data-testid={`view-btn-${dataset.id}`}
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      className="icon-btn delete-btn"
                      onClick={() => handleDelete(dataset.id)}
                      title="Delete"
                      data-testid={`delete-btn-${dataset.id}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="dataset-stats">
                  <div className="stat-item">
                    <span className="stat-label">Rows</span>
                    <span className="stat-value" data-testid={`dataset-rows-${dataset.id}`}>{dataset.rows.toLocaleString()}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Columns</span>
                    <span className="stat-value" data-testid={`dataset-cols-${dataset.id}`}>{dataset.columns}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Size</span>
                    <span className="stat-value">{(dataset.file_size / 1024).toFixed(2)} KB</span>
                  </div>
                </div>

                <div className="health-score-mini">
                  <div className={`health-badge ${getHealthColor(dataset.health_score)}`} data-testid={`health-score-${dataset.id}`}>
                    {dataset.health_score}%
                  </div>
                  <span className="health-status">{getHealthLabel(dataset.health_score)}</span>
                </div>

                <button
                  className="btn-secondary full-width"
                  onClick={() => navigate(`/analysis/${dataset.id}`)}
                  data-testid={`analyze-btn-${dataset.id}`}
                >
                  View Analysis
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
        }

        .dashboard-header h1 {
          font-size: 2.5rem;
          color: #0f172a;
          margin-bottom: 0.5rem;
        }

        .subtitle {
          color: #64748b;
          font-size: 1.125rem;
        }

        .dashboard-header button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .loading-container {
          display: flex;
          justify-content: center;
          padding: 4rem;
        }

        .empty-state {
          text-align: center;
          padding: 4rem;
        }

        .empty-icon {
          color: #cbd5e1;
          margin-bottom: 1rem;
        }

        .empty-state h2 {
          font-size: 1.5rem;
          color: #334155;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: #64748b;
          margin-bottom: 2rem;
        }

        .datasets-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 2rem;
        }

        .dataset-card {
          padding: 1.5rem;
          position: relative;
        }

        .dataset-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .dataset-header h3 {
          font-size: 1.25rem;
          color: #0f172a;
          word-break: break-word;
          flex: 1;
          margin-right: 1rem;
        }

        .dataset-actions {
          display: flex;
          gap: 0.5rem;
        }

        .icon-btn {
          background: #e0f2fe;
          border: none;
          padding: 0.5rem;
          border-radius: 8px;
          cursor: pointer;
          color: #0369a1;
          transition: all 0.3s ease;
        }

        .icon-btn:hover {
          background: #0ea5e9;
          color: white;
          transform: scale(1.1);
        }

        .delete-btn {
          background: #fee2e2;
          color: #991b1b;
        }

        .delete-btn:hover {
          background: #ef4444;
          color: white;
        }

        .dataset-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #64748b;
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 600;
          color: #0ea5e9;
        }

        .health-score-mini {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .health-badge {
          padding: 0.5rem 1rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1.25rem;
          color: white;
        }

        .health-status {
          color: #64748b;
          font-weight: 500;
        }

        .full-width {
          width: 100%;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .datasets-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;