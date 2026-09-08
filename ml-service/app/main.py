from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os

from app.schemas import (
    PredictionRequest,
    PredictionResponse,
    AnomalyDetectionRequest,
    AnomalyDetectionResponse,
)
from app.prediction import predict_monthly_spending
from app.anomaly import detect_anomalies

app = FastAPI(
    title="SpendWise AI — ML Service",
    description="Interpretable spending prediction and anomaly detection for SpendWise AI.",
    version="1.0.0",
)

allowed_origin = os.environ.get("BACKEND_URL", "http://localhost:5000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[allowed_origin],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"success": True, "message": "SpendWise AI ML service is running"}


@app.post("/predict/monthly-spending", response_model=PredictionResponse)
def predict_monthly_spending_endpoint(payload: PredictionRequest):
    if not payload.monthly_history:
        raise HTTPException(status_code=400, detail="monthly_history must not be empty")
    try:
        return predict_monthly_spending(payload.monthly_history)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/detect/anomalies", response_model=AnomalyDetectionResponse)
def detect_anomalies_endpoint(payload: AnomalyDetectionRequest):
    return detect_anomalies(payload.transactions, payload.method or "zscore")
