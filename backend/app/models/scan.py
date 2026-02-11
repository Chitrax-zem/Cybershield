from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class ScanStatus(str, Enum):
    PENDING = 'pending'
    SCANNING = 'scanning'
    COMPLETED = 'completed'
    FAILED = 'failed'

class DetectionResult(str, Enum):
    MALICIOUS = 'malicious'
    BENIGN = 'benign'
    SUSPICIOUS = 'suspicious'

class FeatureImportance(BaseModel):
    feature_name: str
    importance: float
    description: Optional[str] = None

class SuspiciousByte(BaseModel):
    offset: int
    byte_sequence: str
    confidence: float
    reason: Optional[str] = None

class ExplainableAIResult(BaseModel):
    feature_importance: List[FeatureImportance]
    suspicious_bytes: List[SuspiciousByte]
    model_decision: str
    confidence_breakdown: Dict[str, float]
    risk_factors: List[str]

class ScanBase(BaseModel):
    filename: str
    file_size: int
    file_type: str

class ScanCreate(ScanBase):
    user_id: str

class ScanInDB(ScanBase):
    id: str
    user_id: str
    status: ScanStatus
    detection_result: Optional[DetectionResult] = None
    confidence_score: Optional[float] = None
    is_zero_day: Optional[bool] = False
    explanation: Optional[ExplainableAIResult] = None
    file_hash: Optional[str] = None
    scan_duration: Optional[float] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ScanResponse(BaseModel):
    id: str
    filename: str
    file_size: int
    file_type: str
    status: ScanStatus
    detection_result: Optional[DetectionResult] = None
    confidence_score: Optional[float] = None
    is_zero_day: Optional[bool] = False
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ScanDetailResponse(ScanResponse):
    explanation: Optional[ExplainableAIResult] = None
    file_hash: Optional[str] = None
    scan_duration: Optional[float] = None

class ScanRequest(BaseModel):
    file_id: str

class ScanStats(BaseModel):
    total_scans: int
    malicious_count: int
    benign_count: int
    suspicious_count: int
    zero_day_count: int
    avg_confidence: float
    success_rate: float