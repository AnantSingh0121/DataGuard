from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, status
from fastapi.responses import FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
from fastapi.responses import StreamingResponse
import io
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import pandas as pd
import json
import io
from utils.data_analyzer import DataQualityAnalyzer
from utils.pdf_generator import generate_pdf_report

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', '544432a0ca897caa197ceb8d58c014920118b0dbf18d640b605e27428c75a17c')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: str

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class DatasetResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    filename: str
    upload_date: str
    rows: int
    columns: int
    file_size: int
    health_score: float
    file_path: str

class ReportResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    dataset_id: str
    user_id: str
    report_data: Dict[str, Any]
    pdf_path: str
    created_at: str

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user = await db.users.find_one({"id": payload['user_id']}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@api_router.post("/auth/signup", response_model=TokenResponse)
async def signup(user_data: UserSignup):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    token = create_token(user_id, user_data.email)
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": user_data.name,
            "email": user_data.email,
            "created_at": user_doc["created_at"]
        }
    }

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user['id'], user['email'])
    
    return {
        "token": token,
        "user": {
            "id": user['id'],
            "name": user['name'],
            "email": user['email'],
            "created_at": user['created_at']
        }
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user['id'],
        "name": current_user['name'],
        "email": current_user['email'],
        "created_at": current_user['created_at']
    }

@api_router.post("/datasets/upload")
async def upload_dataset(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    try:
        content = await file.read()
        file_size = len(content)
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(content))
        elif file.filename.endswith('.json'):
            df = pd.read_json(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Use CSV, Excel or JSON")
        
        dataset_id = str(uuid.uuid4())
        file_path = UPLOAD_DIR / f"{dataset_id}_{file.filename}"
        with open(file_path, 'wb') as f:
            f.write(content)
        
        analyzer = DataQualityAnalyzer(df)
        health_score = analyzer.calculate_health_score()
        
        dataset_doc = {
            "id": dataset_id,
            "user_id": current_user['id'],
            "filename": file.filename,
            "upload_date": datetime.now(timezone.utc).isoformat(),
            "rows": len(df),
            "columns": len(df.columns),
            "file_size": file_size,
            "health_score": health_score,
            "file_path": str(file_path)
        }
        
        await db.datasets.insert_one(dataset_doc)
        
        return {
            "message": "File uploaded successfully",
            "dataset": {
                "id": dataset_id,
                "filename": file.filename,
                "rows": len(df),
                "columns": len(df.columns),
                "health_score": health_score
            }
        }
    
    except Exception as e:
        logging.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@api_router.get("/datasets", response_model=List[DatasetResponse])
async def get_datasets(current_user: dict = Depends(get_current_user)):
    datasets = await db.datasets.find({"user_id": current_user['id']}, {"_id": 0}).sort("upload_date", -1).to_list(100)
    return datasets



@api_router.get("/datasets/{dataset_id}/analyze")
async def analyze_dataset(dataset_id: str, current_user: dict = Depends(get_current_user)):
    dataset = await db.datasets.find_one({"id": dataset_id, "user_id": current_user['id']}, {"_id": 0})
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        file_path = Path(dataset['file_path'])
        if dataset['filename'].endswith('.csv'):
            df = pd.read_csv(file_path)
        elif dataset['filename'].endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file_path)
        else:
            df = pd.read_json(file_path)

        analyzer = DataQualityAnalyzer(df)
        report_data = analyzer.generate_full_report()

        report_id = str(uuid.uuid4())
        report_doc = {
            "id": report_id,
            "dataset_id": dataset_id,
            "user_id": current_user['id'],
            "report_data": report_data,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        def stringify_keys(obj):
            if isinstance(obj, dict):
                return {str(k): stringify_keys(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [stringify_keys(i) for i in obj]
            else:
                return obj

        report_doc["report_data"] = stringify_keys(report_data)

        await db.reports.insert_one(report_doc)

        pdf_buffer = io.BytesIO()
        generate_pdf_report(report_data, dataset['filename'], pdf_buffer)
        pdf_buffer.seek(0)
        return {
            "report_id": report_id,
            "dataset_name": dataset['filename'],
            "report_data": report_data,
            "pdf_download_url": f"/api/reports/{report_id}/download",
            "message": "Analysis completed successfully"}

        # # REPORT_DIR = Path(__file__).resolve().parent / "reports"
        # # REPORT_DIR.mkdir(exist_ok=True)
        # # pdf_path = REPORT_DIR / f"{report_id}.pdf"
        # # with open(pdf_path, "wb") as f:
        # #     f.write(pdf_buffer.read())
        # # await db.reports.update_one({"id": report_id}, {"$set": {"pdf_path": str(pdf_path)}})

        # return {
        #     "report_id": report_id,
        #     "dataset_name": dataset['filename'],
        #     "report_data": report_data,
        #     "pdf_download_url": f"/api/reports/{report_id}/download",
        #     "message": "Analysis completed successfully"
        # }

    except Exception as e:
        logging.error(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing dataset: {str(e)}")

@api_router.get("/reports/{report_id}/download")
async def download_report(report_id: str, current_user: dict = Depends(get_current_user)):
    report_doc = await db.reports.find_one({"id": report_id, "user_id": current_user['id']}, {"_id": 0})
    if not report_doc:
        raise HTTPException(status_code=404, detail="Report not found")

    pdf_buffer = io.BytesIO()
    dataset = await db.datasets.find_one(
    {"id": report_doc["dataset_id"], "user_id": current_user["id"]},
    {"_id": 0, "filename": 1})

    if not dataset:
        raise HTTPException(status_code=404, detail="Related dataset not found")

    dataset_name = dataset["filename"]
    generate_pdf_report(report_doc["report_data"], dataset_name, pdf_buffer)
    pdf_buffer.seek(0)
    download_filename = f"Quality of {Path(dataset_name).stem}.pdf"

    headers = {"Content-Disposition": f'attachment; filename="{download_filename}"'}
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers=headers)


@api_router.delete("/datasets/{dataset_id}")
async def delete_dataset(dataset_id: str, current_user: dict = Depends(get_current_user)):
    dataset = await db.datasets.find_one({"id": dataset_id, "user_id": current_user['id']}, {"_id": 0})
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    file_path = Path(dataset['file_path'])
    if file_path.exists():
        file_path.unlink()
    
    await db.datasets.delete_one({"id": dataset_id})
    await db.reports.delete_many({"dataset_id": dataset_id})
    
    return {"message": "Dataset deleted successfully"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()