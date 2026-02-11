import numpy as np
import torch
import torch.nn as nn
from typing import Tuple, Optional, List, Dict, Any
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os
from app.config import settings
from app.models.scan import (
    DetectionResult, 
    ExplainableAIResult,
    FeatureImportance,
    SuspiciousByte
)

class MalwareDetector(nn.Module):
    """Deep Learning Model for Malware Detection"""
    
    def __init__(self, input_size: int = 1000):
        super(MalwareDetector, self).__init__()
        self.input_size = input_size
        
        # CNN layers for local feature extraction
        self.conv1 = nn.Conv1d(1, 64, kernel_size=5, padding=2)
        self.conv2 = nn.Conv1d(64, 128, kernel_size=5, padding=2)
        self.conv3 = nn.Conv1d(128, 256, kernel_size=5, padding=2)
        
        # LSTM for sequential patterns
        self.lstm = nn.LSTM(256, 128, batch_first=True)
        
        # Fully connected layers
        self.fc1 = nn.Linear(128, 64)
        self.fc2 = nn.Linear(64, 32)
        self.fc3 = nn.Linear(32, 2)  # Binary classification: malware/benign
        
        # Dropout for regularization
        self.dropout = nn.Dropout(0.5)
        self.batchnorm1 = nn.BatchNorm1d(64)
        self.batchnorm2 = nn.BatchNorm1d(128)
        
    def forward(self, x):
        # Reshape for CNN
        x = x.unsqueeze(1)  # Add channel dimension
        
        # CNN layers with ReLU
        x = torch.relu(self.conv1(x))
        x = torch.max_pool1d(x, 2)
        x = torch.relu(self.conv2(x))
        x = torch.max_pool1d(x, 2)
        x = torch.relu(self.conv3(x))
        x = torch.max_pool1d(x, 2)
        
        # Reshape for LSTM
        x = x.permute(0, 2, 1)  # (batch, seq_len, features)
        
        # LSTM
        x, _ = self.lstm(x)
        x = x[:, -1, :]  # Take last output
        
        # Fully connected layers
        x = self.dropout(x)
        x = torch.relu(self.fc1(x))
        x = self.dropout(x)
        x = torch.relu(self.fc2(x))
        x = self.fc3(x)
        
        return x

class MalwareDetectionService:
    """Service for malware detection and analysis"""
    
    def __init__(self):
        self.model = MalwareDetector(input_size=settings.FEATURE_SIZE)
        self.anomaly_detector = IsolationForest(contamination=0.1, random_state=42)
        self.scaler = StandardScaler()
        self.model_loaded = False
        self.is_trained = False
        
        # Load model if available
        self._load_model()
    
    def _load_model(self):
        """Load trained model if available"""
        model_path = settings.MODEL_PATH
        if os.path.exists(model_path):
            try:
                checkpoint = torch.load(model_path, map_location='cpu')
                self.model.load_state_dict(checkpoint['model_state_dict'])
                self.model.eval()
                
                # Load anomaly detector
                if 'anomaly_detector' in checkpoint:
                    self.anomaly_detector = checkpoint['anomaly_detector']
                if 'scaler' in checkpoint:
                    self.scaler = checkpoint['scaler']
                
                self.model_loaded = True
                self.is_trained = True
                print("Model loaded successfully")
            except Exception as e:
                print(f"Error loading model: {e}")
                self.model_loaded = False
    
    def extract_features(self, file_path: str) -> np.ndarray:
        """Extract features from binary file"""
        try:
            with open(file_path, 'rb') as f:
                byte_data = f.read()
            
            # Convert to numpy array
            byte_array = np.array(list(byte_data), dtype=np.uint8)
            
            # Extract various features
            features = []
            
            # Byte frequency distribution (256 features)
            byte_freq = np.bincount(byte_array, minlength=256)
            byte_freq = byte_freq / len(byte_array)  # Normalize
            features.extend(byte_freq)
            
            # N-gram statistics (2-grams, 3-grams)
            for n in [2, 3]:
                ngrams = [byte_array[i:i+n].tobytes() for i in range(len(byte_array)-n+1)]
                ngram_freq = {}
                for ng in ngrams:
                    ngram_freq[ng] = ngram_freq.get(ng, 0) + 1
                
                # Take top 200 most common n-grams
                sorted_ngrams = sorted(ngram_freq.items(), key=lambda x: x[1], reverse=True)[:200]
                ngram_features = [freq for _, freq in sorted_ngrams]
                
                # Pad if necessary
                while len(ngram_features) < 200:
                    ngram_features.append(0)
                
                features.extend(ngram_features[:200])
            
            # Entropy features
            entropy = self._calculate_entropy(byte_array)
            features.append(entropy)
            
            # Section-based features (for PE files)
            section_features = self._extract_section_features(byte_array)
            features.extend(section_features)
            
            # Convert to numpy array and pad/truncate to fixed size
            features = np.array(features, dtype=np.float32)
            
            if len(features) > settings.FEATURE_SIZE:
                features = features[:settings.FEATURE_SIZE]
            elif len(features) < settings.FEATURE_SIZE:
                features = np.pad(features, (0, settings.FEATURE_SIZE - len(features)), 'constant')
            
            return features
            
        except Exception as e:
            print(f"Error extracting features: {e}")
            return np.random.rand(settings.FEATURE_SIZE)
    
    def _calculate_entropy(self, byte_array: np.ndarray) -> float:
        """Calculate Shannon entropy of byte array"""
        if len(byte_array) == 0:
            return 0.0
        
        byte_freq = np.bincount(byte_array)
        byte_freq = byte_freq[byte_freq > 0]
        byte_prob = byte_freq / len(byte_array)
        entropy = -np.sum(byte_prob * np.log2(byte_prob))
        return entropy
    
    def _extract_section_features(self, byte_array: np.ndarray) -> List[float]:
        """Extract section-based features for PE files"""
        features = []
        
        try:
            # Simple PE header detection
            pe_signatures = [b'MZ', b'PE\x00\x00']
            has_pe_header = any(sig in byte_array[:1000] for sig in pe_signatures)
            features.append(1.0 if has_pe_header else 0.0)
            
            # Check for suspicious API calls (common in malware)
            suspicious_apis = [
                b'CreateProcess', b'VirtualAlloc', b'WriteProcessMemory',
                b'CreateRemoteThread', b'LoadLibrary', b'GetProcAddress',
                b'WinExec', b'ShellExecute'
            ]
            
            api_count = 0
            for api in suspicious_apis:
                if api in byte_array:
                    api_count += 1
            
            features.append(api_count / len(suspicious_apis))
            
            # Check for suspicious strings
            suspicious_strings = [
                b'http://', b'https://', b'ftp://',
                b'\\x00', b'cmd.exe', b'powershell',
                b'base64', b'shellcode'
            ]
            
            string_count = 0
            for s in suspicious_strings:
                if s in byte_array:
                    string_count += 1
            
            features.append(string_count / len(suspicious_strings))
            
            # Code vs data ratio (heuristic)
            printable_bytes = sum(1 for b in byte_array if 32 <= b <= 126)
            code_ratio = 1.0 - (printable_bytes / len(byte_array))
            features.append(code_ratio)
            
        except Exception as e:
            print(f"Error extracting section features: {e}")
            features = [0.0, 0.0, 0.0, 0.0]
        
        return features
    
    def predict(self, features: np.ndarray) -> Tuple[str, float]:
        """Make prediction using the deep learning model"""
        if not self.is_trained:
            # Use heuristic-based prediction for untrained model
            return self._heuristic_predict(features)
        
        try:
            # Normalize features
            features = self.scaler.transform(features.reshape(1, -1))
            
            # Convert to tensor
            features_tensor = torch.FloatTensor(features)
            
            # Get prediction
            with torch.no_grad():
                outputs = self.model(features_tensor)
                probabilities = torch.softmax(outputs, dim=1)
                confidence, predicted = torch.max(probabilities, 1)
            
            result = "malicious" if predicted.item() == 1 else "benign"
            confidence_score = confidence.item()
            
            return result, confidence_score
            
        except Exception as e:
            print(f"Error in prediction: {e}")
            return self._heuristic_predict(features)
    
    def _heuristic_predict(self, features: np.ndarray) -> Tuple[str, float]:
        """Heuristic-based prediction when model is not trained"""
        # Simple heuristic based on feature analysis
        # High entropy + suspicious API calls = likely malicious
        
        entropy = features[256]  # Entropy is at index 256
        suspicious_api_ratio = features[257]  # API ratio at 257
        code_ratio = features[259]  # Code ratio at 259
        
        # Calculate heuristic score
        score = 0.0
        
        # High entropy (7-8 bits) suggests packed/encrypted code
        if entropy > 7.0:
            score += 0.3
        elif entropy > 6.5:
            score += 0.2
        
        # Many suspicious API calls
        score += suspicious_api_ratio * 0.4
        
        # High code ratio suggests executable
        if code_ratio > 0.8:
            score += 0.3
        
        confidence = min(score, 0.95)
        
        if score > 0.5:
            return "malicious", confidence
        elif score > 0.3:
            return "suspicious", confidence
        else:
            return "benign", 1.0 - confidence
    
    def detect_zero_day(self, features: np.ndarray) -> bool:
        """Detect zero-day threats using anomaly detection"""
        if not self.is_trained:
            return False
        
        try:
            # Normalize features
            features_scaled = self.scaler.transform(features.reshape(1, -1))
            
            # Use isolation forest for anomaly detection
            anomaly_score = self.anomaly_detector.decision_function(features_scaled)[0]
            
            # Lower score means more anomalous
            return anomaly_score < 0
            
        except Exception as e:
            print(f"Error in zero-day detection: {e}")
            return False
    
    def generate_explanation(self, features: np.ndarray, result: str) -> ExplainableAIResult:
        """Generate explainable AI results"""
        
        # Feature importance analysis
        feature_importance = []
        
        # Analyze different feature groups
        byte_freq = features[:256]
        ngram_features = features[256:656]
        entropy = features[656]
        section_features = features[657:661]
        
        # Byte frequency importance
        if entropy > 7.0:
            feature_importance.append(FeatureImportance(
                feature_name="High Entropy",
                importance=0.9,
                description="File has high entropy indicating packed or encrypted code"
            ))
        
        # suspicious API calls
        if section_features[1] > 0.3:
            feature_importance.append(FeatureImportance(
                feature_name="Suspicious API Calls",
                importance=section_features[1],
                description=f"File contains multiple suspicious API calls"
            ))
        
        # Suspicious strings
        if section_features[2] > 0.2:
            feature_importance.append(FeatureImportance(
                feature_name="Suspicious Strings",
                importance=section_features[2],
                description="File contains potentially malicious strings"
            ))
        
        # Code ratio
        if section_features[3] > 0.85:
            feature_importance.append(FeatureImportance(
                feature_name="High Code Ratio",
                importance=0.7,
                description="High ratio of executable code to data"
            ))
        
        # Identify suspicious bytes
        suspicious_bytes = []
        top_byte_indices = np.argsort(byte_freq)[-10:]  # Top 10 most frequent bytes
        
        for idx in top_byte_indices:
            if byte_freq[idx] > 0.01:  # More than 1% frequency
                suspicious_bytes.append(SuspiciousByte(
                    offset=int(idx),
                    byte_sequence=f"0x{idx:02x}",
                    confidence=float(byte_freq[idx]),
                    reason=f"Byte 0x{idx:02x} appears {byte_freq[idx]*100:.1f}% of the time"
                ))
        
        # Confidence breakdown
        confidence_breakdown = {
            "byte_frequency": float(np.mean(byte_freq)),
            "ngram_patterns": float(np.mean(ngram_features)),
            "entropy_score": float(entropy),
            "section_analysis": float(np.mean(section_features))
        }
        
        # Risk factors
        risk_factors = []
        if entropy > 7.0:
            risk_factors.append("High entropy suggests packer/cryptor")
        if section_features[1] > 0.5:
            risk_factors.append("Multiple suspicious API functions detected")
        if section_features[2] > 0.3:
            risk_factors.append("Suspicious network-related strings found")
        if len(suspicious_bytes) > 5:
            risk_factors.append("Unusual byte distribution pattern")
        
        if not risk_factors:
            risk_factors.append("No obvious malicious patterns detected")
        
        return ExplainableAIResult(
            feature_importance=feature_importance,
            suspicious_bytes=suspicious_bytes[:10],  # Limit to 10
            model_decision=f"Classified as {result} based on feature analysis",
            confidence_breakdown=confidence_breakdown,
            risk_factors=risk_factors
        )
    
    def scan_file(self, file_path: str) -> Tuple[str, float, Optional[ExplainableAIResult], bool]:
        """Complete file scanning workflow"""
        # Extract features
        features = self.extract_features(file_path)
        
        # Make prediction
        result, confidence = self.predict(features)
        
        # Detect zero-day threats
        is_zero_day = self.detect_zero_day(features)
        
        # Generate explanation
        explanation = self.generate_explanation(features, result)
        
        return result, confidence, explanation, is_zero_day

# Global instance
detector = MalwareDetectionService()