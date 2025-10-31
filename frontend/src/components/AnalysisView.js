import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { BarChart3, Download, AlertCircle, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AnalysisView = ({ user, onLogout }) => {
  const { datasetId } = useParams();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportId, setReportId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    analyzeDataset();
  }, [datasetId]);

  const analyzeDataset = async () => {
    setAnalyzing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/datasets/${datasetId}/analyze`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setReportData(response.data.report_data);
      setReportId(response.data.report_id);
      toast.success('Analysis completed successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to analyze dataset');
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

const downloadPDF = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API}/reports/${reportId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob', // important for binary files
    });

    // Create download link
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `data_quality_report_${reportId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    toast.success("PDF downloaded successfully!");
  } catch (error) {
    console.error("Download error:", error);
    toast.error(error.response?.data?.detail || "Failed to download report");
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


  if (loading || analyzing) {
    return (
      <div>
        <nav className="navbar">
          <div className="navbar-brand">
            <BarChart3 size={32} />
            DataGuard
          </div>
        </nav>
        <div className="loading-screen">
          <div className="loader"></div>
          <p style={{ marginTop: '1rem', color: '#64748b' }}>
            {analyzing ? 'Analyzing your dataset...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div>
        <nav className="navbar">
          <div className="navbar-brand">
            <BarChart3 size={32} />
            DataGuard
          </div>
        </nav>
        <div className="container">
          <div className="error-state glass-card">
            <AlertCircle size={64} color="#ef4444" />
            <h2>Failed to load analysis</h2>
            <button className="btn-primary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="analysis-view">
      <Toaster position="top-right" />
      
      <nav className="navbar">
        <div className="navbar-brand">
          <BarChart3 size={32} />
          DataGuard
        </div>
        <div className="navbar-menu">
          <button className="navbar-link" onClick={() => navigate('/dashboard')}>
            Dashboard
          </button>
          <button className="navbar-link" onClick={() => navigate('/upload')}>
            Upload
          </button>
          <div className="user-info">
            <span>{user.name}</span>
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container analysis-container">
        <div className="analysis-header">
          <div>
            <h1 data-testid="analysis-title">Data Quality Report</h1>
            <p className="subtitle">Comprehensive analysis results</p>
          </div>
          <button 
            className="btn-primary"
            onClick={downloadPDF}
            data-testid="download-pdf-btn"
          >
            <Download size={20} />
            Download PDF Report
          </button>
        </div>

        {/* Health Score Section */}
        <div className="glass-card health-section" data-testid="health-section">
          <h2>Overall Data Health Score</h2>
          <div className="health-display">
            <div className={`health-circle ${getHealthColor(reportData.health_score)}`} data-testid="health-score-display">
              <div className="health-score-value">{reportData.health_score}%</div>
            </div>
            <div className="health-info">
              <h3 className="health-status">{getHealthLabel(reportData.health_score)}</h3>
              <p>Your dataset's overall quality score based on multiple factors</p>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="glass-card" data-testid="summary-section">
          <h2>Dataset Summary</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value" data-testid="total-rows">{reportData.summary.total_rows.toLocaleString()}</div>
              <div className="stat-label">Total Rows</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" data-testid="total-columns">{reportData.summary.total_columns}</div>
              <div className="stat-label">Total Columns</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" data-testid="numeric-columns">{reportData.summary.numeric_columns}</div>
              <div className="stat-label">Numeric Columns</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" data-testid="categorical-columns">{reportData.summary.categorical_columns}</div>
              <div className="stat-label">Categorical Columns</div>
            </div>
          </div>
        </div>

        {/* Missing Values */}
        <div className="glass-card" data-testid="missing-values-section">
          <div className="section-header">
            <h2>Missing Values Analysis</h2>
            <span className={`badge ${reportData.missing_values.total_missing === 0 ? 'badge-success' : 'badge-warning'}`}>
              {reportData.missing_values.percentage}% Missing
            </span>
          </div>
          <p className="section-description">
            Total Missing: {reportData.missing_values.total_missing.toLocaleString()} cells out of {reportData.missing_values.total_cells.toLocaleString()}
          </p>
          
          {reportData.missing_values.details.length > 0 && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Missing Count</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.missing_values.details.slice(0, 10).map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.column}</td>
                      <td>{item.count.toLocaleString()}</td>
                      <td>
                        <span className={`badge ${item.percentage > 50 ? 'badge-danger' : item.percentage > 20 ? 'badge-warning' : 'badge-success'}`}>
                          {item.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Duplicates */}
        <div className="glass-card" data-testid="duplicates-section">
          <div className="section-header">
            <h2>Duplicate Rows Analysis</h2>
            <span className={`badge ${reportData.duplicates.full_row_duplicates === 0 ? 'badge-success' : 'badge-warning'}`}>
              {reportData.duplicates.percentage}% Duplicates
            </span>
          </div>
          <p className="section-description">
            Full Row Duplicates: {reportData.duplicates.full_row_duplicates.toLocaleString()}
          </p>
        </div>

        {/* Class Imbalance */}
        {reportData.class_imbalance.columns_with_imbalance > 0 && (
          <div className="glass-card" data-testid="imbalance-section">
            <div className="section-header">
              <h2>Class Imbalance Detection</h2>
              <span className="badge badge-warning">
                {reportData.class_imbalance.columns_with_imbalance} Columns Affected
              </span>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Imbalance Ratio</th>
                    <th>Severity</th>
                    <th>Most Common</th>
                    <th>Least Common</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.class_imbalance.details.slice(0, 5).map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.column}</td>
                      <td>{item.imbalance_ratio}:1</td>
                      <td>
                        <span className={`badge ${item.severity === 'High' ? 'badge-danger' : 'badge-warning'}`}>
                          {item.severity}
                        </span>
                      </td>
                      <td>{item.most_common_count.toLocaleString()}</td>
                      <td>{item.least_common_count.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Outliers */}
        {reportData.outliers.columns_with_outliers > 0 && (
          <div className="glass-card" data-testid="outliers-section">
            <div className="section-header">
              <h2>Outliers Detection</h2>
              <span className="badge badge-warning">
                {reportData.outliers.columns_with_outliers} Columns with Outliers
              </span>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Outlier Count</th>
                    <th>Percentage</th>
                    <th>Range</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.outliers.details.slice(0, 5).map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.column}</td>
                      <td>{item.outlier_count.toLocaleString()}</td>
                      <td>
                        <span className={`badge ${item.percentage > 10 ? 'badge-danger' : 'badge-warning'}`}>
                          {item.percentage}%
                        </span>
                      </td>
                      <td>{item.min_value} - {item.max_value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Data Type Issues */}
        {reportData.data_types.type_issues.length > 0 && (
          <div className="glass-card" data-testid="type-issues-section">
            <div className="section-header">
              <h2>Data Type Issues</h2>
              <span className="badge badge-warning">
                {reportData.data_types.type_issues.length} Issues Found
              </span>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Issue</th>
                    <th>Suggested Type</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.data_types.type_issues.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.column}</td>
                      <td>{item.issue}</td>
                      <td>
                        <span className="badge badge-success">{item.suggested_type}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Date Format Issues */}
        {reportData.date_formats.date_columns_found > 0 && (
          <div className="glass-card" data-testid="date-formats-section">
            <div className="section-header">
              <h2>Date Format Analysis</h2>
              <span className="badge badge-success">
                {reportData.date_formats.date_columns_found} Date Columns Found
              </span>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Status</th>
                    <th>Valid Dates</th>
                    <th>Invalid Dates</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.date_formats.details.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.column}</td>
                      <td>
                        <span className={`badge ${item.invalid_dates === 0 ? 'badge-success' : 'badge-danger'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>{item.valid_dates.toLocaleString()}</td>
                      <td>{item.invalid_dates.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .analysis-container {
          padding: 2rem;
        }

        .analysis-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
        }

        .analysis-header h1 {
          font-size: 2.5rem;
          color: #0f172a;
          margin-bottom: 0.5rem;
        }

        .analysis-header button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .health-section {
          margin-bottom: 2rem;
        }

        .health-section h2 {
          margin-bottom: 2rem;
          color: #0f172a;
        }

        .health-display {
          display: flex;
          align-items: center;
          gap: 3rem;
        }

        .health-circle {
          flex-shrink: 0;
        }

        .health-info {
          flex: 1;
        }

        .health-status {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          color: #0f172a;
        }

        .health-info p {
          color: #64748b;
          line-height: 1.6;
        }

        .glass-card {
          margin-bottom: 2rem;
        }

        .glass-card h2 {
          font-size: 1.5rem;
          color: #0f172a;
          margin-bottom: 1rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .section-description {
          color: #64748b;
          margin-bottom: 1.5rem;
        }

        .table-container {
          overflow-x: auto;
          margin-top: 1rem;
        }

        .error-state {
          text-align: center;
          padding: 4rem;
          margin-top: 4rem;
        }

        .error-state h2 {
          margin: 1rem 0 2rem;
          color: #334155;
        }

        @media (max-width: 768px) {
          .analysis-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .health-display {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default AnalysisView;
