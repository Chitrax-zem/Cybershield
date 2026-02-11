export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Scan {
  id: string;
  filename: string;
  file_size: number;
  file_type: string;
  status: 'pending' | 'scanning' | 'completed' | 'failed';
  detection_result?: 'malicious' | 'benign' | 'suspicious';
  confidence_score?: number;
  is_zero_day?: boolean;
  created_at: string;
  completed_at?: string;
}

export interface ScanDetail extends Scan {
  explanation?: {
    feature_importance: Array<{
      feature_name: string;
      importance: number;
      description?: string;
    }>;
    suspicious_bytes: Array<{
      offset: number;
      byte_sequence: string;
      confidence: number;
      reason?: string;
    }>;
    model_decision: string;
    confidence_breakdown: Record<string, number>;
    risk_factors: string[];
  };
  file_hash?: string;
  scan_duration?: number;
}

export interface ScanStats {
  total_scans: number;
  malicious_count: number;
  benign_count: number;
  suspicious_count: number;
  zero_day_count: number;
  avg_confidence: number;
  success_rate: number;
}

export interface UserStats {
  total_scans: number;
  malicious_count: number;
  benign_count: number;
  zero_day_count: number;
  avg_confidence: number;
}