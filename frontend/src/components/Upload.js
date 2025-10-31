import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { BarChart3, Upload as UploadIcon, File, X, CheckCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Upload = ({ user, onLogout }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await axios.post(`${API}/datasets/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success('Dataset uploaded successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload file');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div data-testid="upload-page">
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
          <button className="navbar-link active">Upload</button>
          <div className="user-info">
            <span>{user.name}</span>
            <button className="logout-btn" onClick={onLogout} data-testid="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="upload-container">
          <h1 data-testid="upload-title">Upload Dataset</h1>
          <p className="subtitle">Upload your CSV, Excel or JSON file for quality analysis</p>

          <div className="upload-card glass-card">
            <div
              className={`dropzone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              data-testid="dropzone"
            >
              {file ? (
                <div className="file-preview" data-testid="file-preview">
                  <div className="file-icon-wrapper">
                    <CheckCircle size={64} className="success-icon" />
                  </div>
                  <div className="file-info">
                    <h3 data-testid="file-name">{file.name}</h3>
                    <p>{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <button
                    className="remove-file-btn"
                    onClick={() => setFile(null)}
                    data-testid="remove-file-btn"
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <>
                  <UploadIcon size={64} className="upload-icon" />
                  <h3>Drag & drop your file here</h3>
                  <p>or</p>
                  <label className="file-input-label">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".csv,.xlsx,.xls,.json"
                      className="file-input"
                      data-testid="file-input"
                    />
                    Browse Files
                  </label>
                  <p className="file-types">Supported: CSV, Excel (.xlsx, .xls), JSON</p>
                </>
              )}
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="upload-progress" data-testid="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p>Uploading... {uploadProgress}%</p>
              </div>
            )}

            {file && !uploading && (
              <button
                className="btn-primary upload-btn"
                onClick={handleUpload}
                data-testid="upload-submit-btn"
              >
                Upload & Analyze
              </button>
            )}
          </div>

          <div className="info-section">
            <h2>What happens next?</h2>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-number">1</div>
                <div>
                  <h3>Upload</h3>
                  <p>Your dataset is securely uploaded and stored</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-number">2</div>
                <div>
                  <h3>Analysis</h3>
                  <p>Our system analyzes data quality metrics</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-number">3</div>
                <div>
                  <h3>Report</h3>
                  <p>Get detailed insights and downloadable PDF reports</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .upload-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem 0;
        }

        .upload-container h1 {
          font-size: 2.5rem;
          text-align: center;
          margin-bottom: 0.5rem;
          color: #0f172a;
        }

        .subtitle {
          text-align: center;
          color: #64748b;
          margin-bottom: 3rem;
          font-size: 1.125rem;
        }

        .upload-card {
          padding: 3rem;
        }

        .dropzone {
          border: 3px dashed #cbd5e1;
          border-radius: 20px;
          padding: 4rem 2rem;
          text-align: center;
          transition: all 0.3s ease;
          background: rgba(240, 249, 255, 0.5);
        }

        .dropzone.active {
          border-color: #0ea5e9;
          background: rgba(14, 165, 233, 0.1);
          transform: scale(1.02);
        }

        .dropzone.has-file {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.05);
        }

        .upload-icon {
          color: #0ea5e9;
          margin-bottom: 1rem;
        }

        .success-icon {
          color: #10b981;
        }

        .dropzone h3 {
          color: #334155;
          margin-bottom: 1rem;
        }

        .dropzone p {
          color: #64748b;
          margin-bottom: 1rem;
        }

        .file-input {
          display: none;
        }

        .file-input-label {
          display: inline-block;
          padding: 0.75rem 2rem;
          background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
          color: white;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .file-input-label:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(14, 165, 233, 0.4);
        }

        .file-types {
          font-size: 0.875rem;
          color: #94a3b8;
          margin-top: 1rem;
        }

        .file-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          position: relative;
        }

        .file-icon-wrapper {
          padding: 1rem;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 50%;
        }

        .file-info h3 {
          color: #0f172a;
          margin-bottom: 0.25rem;
        }

        .file-info p {
          color: #64748b;
          font-size: 0.875rem;
        }

        .remove-file-btn {
          position: absolute;
          top: 0;
          right: 0;
          background: #fee2e2;
          border: none;
          padding: 0.5rem;
          border-radius: 50%;
          cursor: pointer;
          color: #991b1b;
          transition: all 0.3s ease;
        }

        .remove-file-btn:hover {
          background: #ef4444;
          color: white;
          transform: rotate(90deg);
        }

        .upload-progress {
          margin: 2rem 0;
          text-align: center;
        }

        .upload-progress p {
          margin-top: 0.5rem;
          color: #0ea5e9;
          font-weight: 600;
        }

        .upload-btn {
          width: 100%;
          margin-top: 2rem;
          padding: 1rem;
          font-size: 1.125rem;
        }

        .info-section {
          margin-top: 4rem;
        }

        .info-section h2 {
          text-align: center;
          margin-bottom: 2rem;
          color: #0f172a;
        }

        .info-grid {
          display: grid;
          gap: 2rem;
        }

        .info-item {
          display: flex;
          gap: 1.5rem;
          align-items: flex-start;
        }

        .info-number {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
          color: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .info-item h3 {
          color: #0f172a;
          margin-bottom: 0.5rem;
        }

        .info-item p {
          color: #64748b;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
};

export default Upload;