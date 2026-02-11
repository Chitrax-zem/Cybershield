// frontend/src/components/ScanHistory.tsx
import React from 'react';
import type { Scan } from '../types';
import { AlertTriangle, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface Props {
  items: Scan[];
}

const iconFor = (result?: string) => {
  switch (result) {
    case 'malicious': return <AlertTriangle className="w-5 h-5 text-red-500" />;
    case 'benign': return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'suspicious': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    default: return <Clock className="w-5 h-5 text-gray-400" />;
  }
};

const ScanHistory: React.FC<Props> = ({ items }) => {
  if (!items.length) {
    return <p className="text-gray-400 text-center py-8">No scan history yet</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((scan) => (
        <div
          key={scan.id}
          className="flex items-center justify-between p-4 rounded-lg bg-cyber-dark border border-gray-700 hover:border-cyber-blue/30 transition-all"
        >
          <div className="flex items-center space-x-4">
            {iconFor(scan.detection_result)}
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
            <span className="text-sm text-gray-300">{scan.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ScanHistory;
