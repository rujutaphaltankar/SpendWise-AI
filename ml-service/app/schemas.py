from pydantic import BaseModel, Field
from typing import List, Optional


class MonthlyDataPoint(BaseModel):
    month: str = Field(..., description="YYYY-MM")
    total: float = Field(..., ge=0)


class PredictionRequest(BaseModel):
    monthly_history: List[MonthlyDataPoint] = Field(
        ..., description="Historical monthly spend totals, oldest first"
    )


class ConfidenceRange(BaseModel):
    lower: float
    upper: float


class PredictionResponse(BaseModel):
    predictedAmount: float
    confidenceRange: ConfidenceRange
    model: str
    dataPointsUsed: int
    method: str


class TransactionPoint(BaseModel):
    id: str
    amount: float = Field(..., gt=0)
    category: str
    date: str


class AnomalyDetectionRequest(BaseModel):
    transactions: List[TransactionPoint]
    method: Optional[str] = Field(default="zscore", description="'zscore' or 'iqr'")


class AnomalyResult(BaseModel):
    id: str
    amount: float
    category: str
    date: str
    reason: str
    score: float


class AnomalyDetectionResponse(BaseModel):
    anomalies: List[AnomalyResult]
    method: str
    transactionsAnalyzed: int
