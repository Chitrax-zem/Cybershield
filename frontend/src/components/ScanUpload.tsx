// frontend/src/components/ScanUpload.tsx
import React, { useState } from 'react';
import api from '../services/api';

const ALLOWED_EXTENSIONS = ['.exe', '.apk', '.pdf', '.zip', '.dll', '.docx', '.bin', '.jar'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const acceptString = ALLOWED_EXTENSIONS.join(',');

const ScanUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedScanId, setUploadedScanId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const validateAndSetFile = (selectedFile: File | null | undefined) => {
    if (!selectedFile) return;
    const ext = '.' + (selectedFile.name.split('.').pop() || '').toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`File type ${ext} not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File size exceeds ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB`);
      return;
    }
    setFile(selectedFile);
    setError('');
    setUploadedScanId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndSetFile(e.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/scan/upload', formData, {
        headers: { /* let browser set multipart/form-data */ }
      });
      setUploadedScanId(response.data.id);
      setFile(null);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Upload failed';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="glass rounded-2xl p-6 cyber-border">
        <h2 className="text-xl font-bold text-white mb-4">Upload File for Malware Scanning</h2>

        <div className="mb-4 p-3 rounded-lg bg-cyber-blue/5 border border-cyber-blue/20 text-sm text-gray-300">
          Supported: {ALLOWED_EXTENSIONS.join(', ')} (Max {Math.floor(MAX_FILE_SIZE / (1024 * 1024))}MB)
        </div>

        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-cyber-blue transition-all">
          <svg className="w-12 h-12 text-gray-500 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 15l4 4L21 5" />
          </svg>
          <p className="text-gray-400 mb-2">Click to select a file</p>
          <p className="text-xs text-gray-500">or drag and drop is supported on Dashboard</p>

          <input
            id="file-input"
            type="file"
            accept={acceptString}
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="file-input"
            className="mt-4 inline-block px-6 py-2 rounded-lg bg-cyber-blue/10 text-cyber-blue hover:bg-cyber-blue/20 transition-all cursor-pointer"
          >
            Select File
          </label>
        </div>

        {file && (
          <div className="mt-4 p-4 rounded-lg bg-cyber-dark border border-gray-700 text-sm text-gray-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-white">{file.name}</div>
                <div className="text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyber-blue to-cyber-purple text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        )}

        {uploadedScanId && (
          <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-400">
            ✅ Uploaded. Scan ID: {uploadedScanId}
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanUpload;
