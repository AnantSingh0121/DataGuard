# DataGuard - Data Quality & Governance Dashboard

A comprehensive data quality analysis and governance platform that automatically detects quality issues in your datasets and generates detailed PDF reports with actionable insights.

<div align="center">

![DataGuard Landing Page](https://github.com/user-attachments/assets/af834f4f-47e1-4782-b24a-a478b2f36b03)

</div>

## Features

### Data Quality Checks
- **Missing Values Detection** - Identifies null/empty values with column-wise breakdown
- **Duplicate Detection** - Finds exact and partial duplicate rows
- **Data Type Analysis** - Detects type mismatches and suggests corrections
- **Categorical Consistency** - Identifies inconsistent categories and case variations
- **Date Format Validation** - Validates date columns and flags invalid formats
- **Class Imbalance Analysis** - Detects imbalanced categorical distributions with severity levels
- **Data Health Score** - Weighted algorithm provides overall quality score (0-100%)

### User Features
- **Multi-user Authentication** - Secure signup/login with JWT tokens
- **Drag & Drop Upload** - Support for CSV, Excel (.xlsx, .xls) and JSON files
- **Large Dataset Support** - Chunk-based processing for datasets with millions of rows
- **Sample-based Analysis** - Quick insights for rapid data exploration
- **Rich PDF Reports** - Downloadable reports with charts and visualizations
- **Dataset Management** - View, analyze and delete datasets
- **Interactive Dashboard** - Modern UI with real-time health score display

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Usage Guide](#usage-guide)
- [Configuration](#configuration)
- [Tech Stack](#tech-stack)
- [Contributing](#contributing)
- [License](#license)

## Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB 5.0+
- Yarn package manager

### Backend Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd app
```

2. **Install Python dependencies**
```bash
cd backend
pip install -r requirements.txt
```

3. **Configure environment variables**
```bash
# backend/.env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="data_quality_db"
CORS_ORIGINS="*"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
```

4. **Start MongoDB**
```bash
mongod --dbpath /path/to/data/db
```

5. **Run the backend server**
```bash
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend Setup

1. **Install frontend dependencies**
```bash
cd frontend
yarn install
```

2. **Configure environment variables**
```bash
# frontend/.env
REACT_APP_BACKEND_URL=http://localhost:8001
WDS_SOCKET_PORT=3000
```

3. **Start the development server**
```bash
yarn start
```

The application will be available at `http://localhost:3000`

## Quick Start

1. **Sign Up** - Create a new account with your name, email and password
2. **Upload Dataset** - Drag and drop your CSV, Excel or JSON file
3. **View Analysis** - Get instant health score and detailed quality metrics
4. **Download Report** - Generate and download comprehensive PDF report
5. **Manage Datasets** - View history, re-analyze or delete datasets

## Project Structure

```
DataGuard/
├── backend/
│   ├── server.py                 # FastAPI application & routes
│   ├── utils/
│   │   ├── data_analyzer.py      # Data quality analysis engine
│   │   └── pdf_generator.py      # PDF report generation
│   ├── requirements.txt          # Python dependencies
│   └── .env                      # Backend configuration
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LandingPage.js    # Hero & features page
│   │   │   ├── Login.js          # Authentication
│   │   │   ├── Dashboard.js      # Dataset listing
│   │   │   ├── Upload.js         # File upload interface
│   │   │   └── AnalysisView.js   # Detailed analysis display
│   │   ├── App.js                # Main application
│   │   └── App.css               # Global styles
│   ├── package.json              # Node dependencies
│   └── .env                      # Frontend configuration
│
└── README.md                     # This file
```

## API Documentation

### Authentication Endpoints

#### POST `/api/auth/signup`
Create a new user account.

**Request Body:**
```json
{
  "name": "Anant Kapoor",
  "email": "anant@uook.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-uuid",
    "name": "Anant Kapoor",
    "email": "anant@uook.com",
    "created_at": "2024-01-29T10:00:00Z"
  }
}
```

#### POST `/api/auth/login`
Authenticate existing user.

**Request Body:**
```json
{
  "email": "anant@uook.com",
  "password": "securepassword123"
}
```

**Response:** Same as signup

#### GET `/api/auth/me`
Get current user information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "user-uuid",
  "name": "Anant Kapoor",
  "email": "anant@uook.com",
  "created_at": "2024-01-29T10:00:00Z"
}
```

### Dataset Endpoints

#### POST `/api/datasets/upload`
Upload a dataset for analysis.

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Form Data:**
- `file`: CSV, Excel or JSON file

**Response:**
```json
{
  "message": "File uploaded successfully",
  "dataset": {
    "id": "dataset-uuid",
    "filename": "sample.csv",
    "rows": 1000,
    "columns": 15,
    "health_score": 87.5
  }
}
```

#### GET `/api/datasets`
Get all datasets for current user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": "dataset-uuid",
    "user_id": "user-uuid",
    "filename": "sample.csv",
    "upload_date": "2024-01-29T10:00:00Z",
    "rows": 1000,
    "columns": 15,
    "file_size": 52428,
    "health_score": 87.5,
    "file_path": "/app/uploads/dataset-uuid_sample.csv"
  }
]
```

#### GET `/api/datasets/{dataset_id}/analyze`
Generate comprehensive analysis for a dataset.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "report_id": "report-uuid",
  "report_data": {
    "health_score": 87.5,
    "summary": { ... },
    "missing_values": { ... },
    "duplicates": { ... },
    "class_imbalance": { ... },
    "outliers": { ... },
    "data_types": { ... },
    "date_formats": { ... }
  },
  "pdf_url": "/api/reports/report-uuid/download"
}
```

#### DELETE `/api/datasets/{dataset_id}`
Delete a dataset and its associated reports.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Dataset deleted successfully"
}
```

### Report Endpoints

#### GET `/api/reports/{report_id}/download`
Download PDF report.

**Headers:** `Authorization: Bearer <token>`

**Response:** PDF file download

## Usage Guide

### Uploading Your First Dataset

1. Navigate to the **Upload** page from the dashboard
2. Click "Browse Files" or drag and drop your file
3. Supported formats: CSV, Excel (.xlsx, .xls), JSON
4. Click "Upload & Analyze" to process the dataset

### Understanding the Health Score

The health score (0-100%) is calculated using weighted factors:

- **Missing Values (30%)** - Fewer missing values = higher score
- **Duplicates (25%)** - Fewer duplicates = higher score
- **Type Consistency (20%)** - Consistent data types = higher score
- **Class Balance (15%)** - Balanced categories = higher score
- **Outliers (10%)** - Fewer outliers = higher score

**Score Interpretation:**
- 90–100%: Excellent – Minimal issues
- 75–89%: Good – Some improvements needed
- 60–74%: Fair – Noticeable issues present
- 40–59%: Poor – Major quality problems
- 0–39%: Critical and Needs Attention – Significant data quality issues

### Analyzing Results

The analysis view provides:

- **Overall Health Score** - Visual gauge with color coding
- **Dataset Summary** - Row/column counts, data types
- **Missing Values** - Column-wise breakdown with percentages
- **Duplicates** - Full row and column-level duplicates
- **Class Imbalance** - Imbalance ratios and severity levels
- **Outliers** - Statistical outliers by column
- **Type Issues** - Mismatched data types with suggestions
- **Date Validation** - Invalid date formats detected

### Generating PDF Reports

1. Click **"Download PDF Report"** button in analysis view
2. Report includes:
   - Overall health score with visual gauge
   - Dataset summary statistics
   - Detailed tables for all quality issues
   - Color-coded severity indicators
   - Professional formatting with charts

## ⚙️ Configuration

### Backend Configuration (`backend/.env`)

```env
# MongoDB Connection
MONGO_URL="mongodb://localhost:27017"
DB_NAME="data_quality_db"

# Security
JWT_SECRET="your-secret-key-here"
JWT_ALGORITHM="HS256"

# CORS
CORS_ORIGINS="http://localhost:3000"
```

### Frontend Configuration (`frontend/.env`)

```env
# API Configuration
REACT_APP_BACKEND_URL=http://localhost:8001
```

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database with Motor async driver
- **Pandas** - Data analysis and manipulation
- **NumPy** - Numerical computing
- **Scikit-learn** - Machine learning utilities
- **ReportLab** - PDF generation
- **Matplotlib** - Chart generation
- **Seaborn** - Statistical visualizations
- **Bcrypt** - Password hashing
- **JWT** - Token-based authentication

### Frontend
- **React 19** - UI library
- **React Router** - Navigation
- **Axios** - HTTP client
- **Shadcn UI** - Component library
- **Tailwind CSS** - Utility-first CSS
- **Lucide React** - Icon library
- **Sonner** - Toast notifications

### Design System
- **Typography**: Space Grotesk (headings), Inter (body)
- **Colors**: Ocean blue (#0ea5e9), Cyan (#06b6d4)
- **Effects**: Glass-morphism, smooth animations, gradient accents

## Security Features

- **Password Hashing** - Bcrypt with salt rounds
- **JWT Authentication** - Secure token-based auth
- **Protected Routes** - Backend middleware validation
- **CORS Configuration** - Restricted cross-origin requests
- **Input Validation** - Pydantic models for data validation
- **File Type Validation** - Server-side file format checks

## Data Quality Algorithms

### Missing Values Detection
```python
missing_pct = (df.isnull().sum().sum() / (rows * columns)) * 100
missing_score = max(0, 100 - missing_pct * 2)
```

### Duplicate Detection
```python
duplicate_count = df.duplicated().sum()
duplicate_pct = (duplicate_count / total_rows) * 100
```

### Outliers Detection (IQR Method)
```python
Q1 = df[column].quantile(0.25)
Q3 = df[column].quantile(0.75)
IQR = Q3 - Q1
outliers = ((df[column] < (Q1 - 1.5 * IQR)) | 
            (df[column] > (Q3 + 1.5 * IQR))).sum()
```

### Class Imbalance
```python
value_counts = df[column].value_counts()
imbalance_ratio = value_counts.max() / value_counts.min()
severity = "High" if imbalance_ratio > 10 else "Medium"
```

## Testing

### Backend Testing
```bash
cd backend
pytest backend_test.py -v
```

### Frontend Testing
```bash
cd frontend
yarn test
```

### End-to-End Testing
Comprehensive testing covers:
- Authentication flows
- File upload and processing
- Data analysis accuracy
- PDF generation
- UI component rendering
- API integration

**Latest Test Results:** 98% success rate (see `/app/test_reports (playwright)/iteration_1.json`)

## Deployment

### Production Considerations

1. **Environment Variables**
   - Use strong JWT secrets
   - Configure proper MongoDB credentials
   - Set production CORS origins

2. **Database**
   - Enable MongoDB authentication
   - Set up regular backups
   - Create indexes for performance

3. **File Storage**
   - Consider cloud storage (S3, Google Cloud Storage)
   - Implement cleanup policies for old files
   - Set upload size limits

4. **Security**
   - Enable HTTPS
   - Implement rate limiting
   - Add request validation
   - Set up logging and monitoring

##  Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
