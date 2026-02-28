import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Upload, CheckCircle, AlertTriangle, Clock, FileText, Zap, AlertCircle, RefreshCw, X } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { scanApi, analyticsApi } from '../services/api';
import type { Scan, ScanDetail, UserStats } from '../types';

// File type icons mapping
const FILE_TYPE_ICONS: Record<string, string> = {
  '.exe': '📦',
  '.apk': '📱',
  '.pdf': '📄',
  '.zip': '📁',
  '.dll': '⚙️',
  '.docx': '📝',
  '.bin': '💾',
  '.jar': '☕',
};

export const Dashboard: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [currentScan, setCurrentScan] = useState<Scan | null>(null);
  const [scanDetail, setScanDetail] = useState<ScanDetail | null>(null);
  const [scanHistory, setScanHistory] = useState<Scan[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const ALLOWED_EXTENSIONS = ['.exe', '.apk', '.pdf', '.zip', '.dll', '.docx', '.bin', '.jar'];
  const MAX_FILE_SIZE = 50 * 1024 * 1024;
  const acceptString = ALLOWED_EXTENSIONS.join(',');

  useEffect(() => {
    loadScanHistory();
    loadStats();
  }, []);

  const loadScanHistory = useCallback(async () => {
    try {
      const history = await scanApi.getMyHistory(0, 10);
      setScanHistory(history);
    } catch (err) {
      console.error('Error loading scan history:', err);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const userStats = await analyticsApi.getMyStats();
      setStats(userStats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, []);

  const setValidatedFile = useCallback((f: File | null | undefined) => {
    if (!f) return;
    const ext = '.' + (f.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`File type ${ext} not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setError(`File size exceeds ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB`);
      return;
    }
    setFile(f);
    setError('');
    setScanDetail(null);
    setCurrentScan(null);
  }, [ALLOWED_EXTENSIONS, MAX_FILE_SIZE]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValidatedFile(e.target.files?.[0] || null);
  }, [setValidatedFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setValidatedFile(e.dataTransfer.files?.[0] || null);
  }, [setValidatedFile]);

  const clearFile = useCallback(() => {
    setFile(null);
    setError('');
    setScanDetail(null);
    setCurrentScan(null);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const scan = await scanApi.uploadFile(file);
      setUploadProgress(100);
      clearInterval(progressInterval);
      setCurrentScan(scan);
      setFile(null);

      setScanning(true);
      const result = await scanApi.startScan(scan.id);
      setCurrentScan(result);

      const detail = await scanApi.getScan(scan.id);
      setScanDetail(detail);

      await Promise.all([loadScanHistory(), loadStats()]);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Scan failed. Please try again.');
    } finally {
      setUploading(false);
      setScanning(false);
      setUploadProgress(0);
    }
  }, [file, loadScanHistory, loadStats]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'scanning': return 'text-cyber-blue';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  }, []);

  const getResultIcon = useCallback((result?: string) => {
    switch (result) {
      case 'malicious': return <AlertTriangle className="w-6 h-6 text-red-500" aria-hidden="true" />;
      case 'benign': return <CheckCircle className="w-6 h-6 text-green-500" aria-hidden="true" />;
      case 'suspicious': return <AlertCircle className="w-6 h-6 text-yellow-500" aria-hidden="true" />;
      default: return <Clock className="w-6 h-6 text-gray-400" aria-hidden="true" />;
    }
  }, []);

  const getResultColor = useCallback((result?: string) => {
    switch (result) {
      case 'malicious': return 'text-red-500';
      case 'benign': return 'text-green-500';
      case 'suspicious': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  }, []);

  const getFileIcon = useCallback((filename: string) => {
    const ext = '.' + (filename.split('.').pop() || '').toLowerCase();
    return FILE_TYPE_ICONS[ext] || '📄';
  }, []);

  return (
    <Layout title="Dashboard">
      <div className="space-y-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass rounded-xl p-6 cyber-border hover:border-cyber-blue/30 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Scans</p>
                  <p className="text-2xl font-bold text-white">{stats.total_scans}</p>
                </div>
                <Shield className="w-8 h-8 text-cyber-blue opacity-50" aria-hidden="true" />
              </div>
            </div>

            <div className="glass rounded-xl p-6 border border-red-500/20 hover:border-red-500/40 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Malicious</p>
                  <p className="text-2xl font-bold text-red-500">{stats.malicious_count}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500 opacity-50" aria-hidden="true" />
              </div>
            </div>

            <div className="glass rounded-xl p-6 border border-green-500/20 hover:border-green-500/40 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Benign</p>
                  <p className="text-2xl font-bold text-green-500">{stats.benign_count}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500 opacity-50" aria-hidden="true" />
              </div>
            </div>

            <div className="glass rounded-xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Zero-Day</p>
                  <p className="text-2xl font-bold text-purple-500">{stats.zero_day_count}</p>
                </div>
                <Zap className="w-8 h-8 text-purple-500 opacity-50" aria-hidden="true" />
              </div>
            </div>
          </div>
        )}

        {/* Upload Section - with ID for scrolling */}
        <div id="scan-section" className="glass rounded-2xl p-8 cyber-border scroll-mt-20">
          <h2 className="text-xl font-bold text-white mb-6">Scan File</h2>

          {!currentScan && (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-cyber-blue bg-cyber-blue/5'
                    : 'border-gray-700 hover:border-cyber-blue/50'
                }`}
                aria-label="File dropzone"
              >
                <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-cyber-blue' : 'text-gray-500'}`} aria-hidden="true" />
                <p className="text-gray-400 mb-2">
                  {isDragging ? 'Drop your file here' : 'Drag and drop your file here, or click to select'}
                </p>
                <p className="text-sm text-gray-500">
                  Supported: {ALLOWED_EXTENSIONS.join(', ')} (Max {Math.floor(MAX_FILE_SIZE / (1024 * 1024))}MB)
                </p>
                <input
                  id="file-input"
                  type="file"
                  onChange={handleFileSelect}
                  accept={acceptString}
                  className="hidden"
                  aria-label="Choose file to scan"
                />
                <label
                  htmlFor="file-input"
                  className="mt-4 inline-block px-6 py-3 rounded-lg bg-cyber-blue/10 text-cyber-blue hover:bg-cyber-blue/20 transition-all cursor-pointer"
                >
                  Select File
                </label>
              </div>

              {file && (
                <div className="mt-6 p-4 rounded-lg bg-cyber-dark border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl" aria-hidden="true">
                        {getFileIcon(file.name)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{file.name}</p>
                        <p className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={clearFile}
                        className="p-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-all"
                        aria-label="Remove file"
                        type="button"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="px-6 py-2 rounded-lg bg-gradient-to-r from-cyber-blue to-cyber-purple text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Start scan"
                        type="button"
                      >
                        {uploading ? 'Uploading...' : 'Start Scan'}
                      </button>
                    </div>
                  </div>
                  {uploading && (
                    <div className="mt-4">
                      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyber-blue to-cyber-purple transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-400 mt-2 text-center">{uploadProgress}% uploaded</p>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20" role="alert">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}
            </>
          )}

          {scanning && (
            <div className="text-center py-12" aria-live="polite" aria-busy="true">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyber-blue border-t-transparent" aria-hidden="true" />
              <p className="mt-4 text-lg text-gray-300">Scanning file...</p>
              <p className="text-sm text-gray-500">This may take a few moments</p>
            </div>
          )}

          {currentScan && scanDetail && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-6 rounded-xl bg-cyber-dark border border-gray-700">
                <div className="flex items-center space-x-4">
                  <span className="text-3xl" aria-hidden="true">
                    {getFileIcon(scanDetail.filename)}
                  </span>
                  {getResultIcon(scanDetail.detection_result)}
                  <div>
                    <p className="text-lg font-semibold text-white">{scanDetail.filename}</p>
                    <p className={`text-sm ${getResultColor(scanDetail.detection_result)}`}>
                      {scanDetail.detection_result?.toUpperCase()}
                    </p>
                  </div>
                </div>
                {scanDetail.is_zero_day && (
                  <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                    <Zap className="w-5 h-5 text-purple-500" aria-hidden="true" />
                    <span className="text-sm font-medium text-purple-500">Zero-Day Threat</span>
                  </div>
                )}
              </div>

              {typeof scanDetail.confidence_score === 'number' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-xl bg-cyber-dark border border-gray-700">
                    <h3 id="confidence-label" className="text-sm font-medium text-gray-400 mb-4">
                      Confidence Score
                    </h3>
                    <div
                      className="w-full h-2 bg-gray-700 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(scanDetail.confidence_score * 100)}
                      aria-labelledby="confidence-label"
                    >
                      <div
                        className={`h-full transition-all ${
                          scanDetail.confidence_score > 0.7
                            ? 'bg-red-500'
                            : scanDetail.confidence_score > 0.5
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${scanDetail.confidence_score * 100}%` }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-2 text-right text-sm text-gray-400" aria-hidden="true">
                      {(scanDetail.confidence_score * 100).toFixed(1)}%
                    </div>
                  </div>

                  {typeof scanDetail.scan_duration === 'number' && (
                    <div className="p-6 rounded-xl bg-cyber-dark border border-gray-700">
                      <h3 className="text-sm font-medium text-gray-400 mb-4">Scan Duration</h3>
                      <p className="text-3xl font-bold text-white">
                        {scanDetail.scan_duration.toFixed(2)}s
                      </p>
                    </div>
                  )}
                </div>
              )}

              {scanDetail.explanation && (
                <div className="space-y-6">
                  {Array.isArray(scanDetail.explanation.risk_factors) &&
                    scanDetail.explanation.risk_factors.length > 0 && (
                      <div className="p-6 rounded-xl bg-cyber-dark border border-gray-700">
                        <h3 className="text-sm font-medium text-gray-400 mb-4">Risk Factors</h3>
                        <ul className="space-y-2">
                          {scanDetail.explanation.risk_factors.map((factor, idx) => (
                            <li key={idx} className="flex items-center space-x-2">
                              <AlertCircle className="w-4 h-4 text-yellow-500" aria-hidden="true" />
                              <span className="text-sm text-gray-300">{factor}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {Array.isArray(scanDetail.explanation.feature_importance) &&
                    scanDetail.explanation.feature_importance.length > 0 && (
                      <div className="p-6 rounded-xl bg-cyber-dark border border-gray-700">
                        <h3 className="text-sm font-medium text-gray-400 mb-4">Feature Importance</h3>
                        <div className="space-y-3">
                          {scanDetail.explanation.feature_importance.map((feature, idx) => (
                            <div key={idx}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-white">{feature.feature_name}</span>
                                <span className="text-sm text-gray-400">
                                  {(feature.importance * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden" aria-hidden="true">
                                <div
                                  className="h-full bg-gradient-to-r from-cyber-blue to-cyber-purple"
                                  style={{ width: `${feature.importance * 100}%` }}
                                />
                              </div>
                              {feature.description && (
                                <p className="text-xs text-gray-500 mt-1">{feature.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  <div className="p-6 rounded-xl bg-cyber-blue/5 border border-cyber-blue/20">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Model Decision</h3>
                    <p className="text-white">
                      {scanDetail.explanation.model_decision || 'No explanation available.'}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setCurrentScan(null);
                      setScanDetail(null);
                      setFile(null);
                    }}
                    className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-cyber-blue to-cyber-purple text-white font-semibold hover:opacity-90 transition-all"
                    aria-label="Scan another file"
                    type="button"
                  >
                    Scan Another File
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scan History Section - with ID for scrolling */}
        <div id="analytics-section" className="glass rounded-2xl p-8 cyber-border scroll-mt-20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Recent Scans</h2>
            <button
              onClick={loadScanHistory}
              className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg bg-cyber-blue/10 text-cyber-blue hover:bg-cyber-blue/20 transition-all text-sm"
              type="button"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>

          {scanHistory.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No scan history yet</p>
              <p className="text-gray-500 text-sm mt-1">Start scanning files to see your history</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scanHistory.map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-cyber-dark border border-gray-700 hover:border-cyber-blue/30 transition-all"
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl" aria-hidden="true">
                      {getFileIcon(scan.filename)}
                    </span>
                    {getResultIcon(scan.detection_result)}
                    <div>
                      <p className="font-medium text-white">{scan.filename}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(scan.created_at).toLocaleDateString()} • {scan.file_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {scan.is_zero_day && (
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-500 border border-purple-500/30">
                        Zero-Day
                      </span>
                    )}
                    <span className={`text-sm ${getStatusColor(scan.status)}`}>{scan.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};