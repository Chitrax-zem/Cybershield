import React, { useState, useEffect } from 'react';
import { Users, Shield, AlertTriangle, CheckCircle, TrendingUp, Activity, FileText } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { analyticsApi } from '../services/api';
import type { ScanStats } from '../types';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#00d4ff', '#10b981', '#ef4444', '#f59e0b'];

export const Analytics: React.FC = () => {
  const [stats, setStats] = useState<ScanStats | null>(null);
  const [trends, setTrends] = useState<any>(null);
  const [users, setUsers] = useState<any>(null);
  const [topMalware, setTopMalware] = useState<any[]>([]);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [statsData, trendsData, usersData, malwareData, scansData] = await Promise.all([
        analyticsApi.getStats(),
        analyticsApi.getTrends(30),
        analyticsApi.getUsers(),
        analyticsApi.getTopMalware(10),
        analyticsApi.getRecentScans(20)
      ]);
      
      setStats(statsData);
      setTrends(trendsData);
      setUsers(usersData);
      setTopMalware(malwareData);
      setRecentScans(scansData);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const pieData = stats ? [
    { name: 'Benign', value: stats.benign_count },
    { name: 'Malicious', value: stats.malicious_count },
    { name: 'Suspicious', value: stats.suspicious_count },
    { name: 'Zero-Day', value: stats.zero_day_count }
  ] : [];

  const barData = topMalware.map(item => ({
    name: item.filename.substring(0, 20) + '...',
    count: item.count
  }));

  const trendData = trends ? Object.entries(trends).map(([date, results]: [string, any]) => ({
    date: date.substring(5), // Show MM-DD
    malicious: results.malicious || 0,
    benign: results.benign || 0,
    suspicious: results.suspicious || 0
  })) : [];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyber-blue border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Analytics">
      <div className="space-y-8">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass rounded-xl p-6 cyber-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Scans</p>
                  <p className="text-2xl font-bold text-white">{stats.total_scans}</p>
                </div>
                <Activity className="w-8 h-8 text-cyber-blue opacity-50" />
              </div>
            </div>

            <div className="glass rounded-xl p-6 border border-red-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Malicious</p>
                  <p className="text-2xl font-bold text-red-500">{stats.malicious_count}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500 opacity-50" />
              </div>
            </div>

            <div className="glass rounded-xl p-6 border border-green-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Benign</p>
                  <p className="text-2xl font-bold text-green-500">{stats.benign_count}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </div>

            <div className="glass rounded-xl p-6 border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Success Rate</p>
                  <p className="text-2xl font-bold text-purple-500">{stats.success_rate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500 opacity-50" />
              </div>
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Detection Distribution */}
          <div className="glass rounded-xl p-6 cyber-border">
            <h3 className="text-lg font-semibold text-white mb-6">Detection Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Malware */}
          <div className="glass rounded-xl p-6 cyber-border">
            <h3 className="text-lg font-semibold text-white mb-6">Top Detected Malware</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trends Chart */}
        <div className="glass rounded-xl p-6 cyber-border">
          <h3 className="text-lg font-semibold text-white mb-6">Detection Trends (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="malicious" stroke="#ef4444" strokeWidth={2} />
              <Line type="monotone" dataKey="benign" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="suspicious" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* User Stats */}
        {users && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-xl p-6 cyber-border">
              <h3 className="text-lg font-semibold text-white mb-6">User Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-cyber-dark border border-gray-700">
                  <div className="flex items-center space-x-3">
                    <Users className="w-8 h-8 text-cyber-blue" />
                    <div>
                      <p className="text-sm text-gray-400">Total Users</p>
                      <p className="text-xl font-bold text-white">{users.total_users}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-cyber-dark border border-gray-700">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-8 h-8 text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-400">Admins</p>
                      <p className="text-xl font-bold text-white">{users.admin_count}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-cyber-dark border border-gray-700 col-span-2">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-cyber-green" />
                    <div>
                      <p className="text-sm text-gray-400">Regular Users</p>
                      <p className="text-xl font-bold text-white">{users.user_count}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Users */}
            <div className="glass rounded-xl p-6 cyber-border">
              <h3 className="text-lg font-semibold text-white mb-6">Recent Users</h3>
              <div className="space-y-3">
                {users.recent_users.map((user: any) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-cyber-dark border border-gray-700"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyber-blue to-cyber-purple flex items-center justify-center text-white font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">{user.username}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.role === 'admin'
                        ? 'bg-purple-500/20 text-purple-500 border border-purple-500/30'
                        : 'bg-blue-500/20 text-blue-500 border border-blue-500/30'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Scans */}
        <div className="glass rounded-xl p-6 cyber-border">
          <h3 className="text-lg font-semibold text-white mb-6">Recent Scans Across All Users</h3>
          <div className="space-y-3">
            {recentScans.map((scan) => (
              <div
                key={scan.id}
                className="flex items-center justify-between p-4 rounded-lg bg-cyber-dark border border-gray-700 hover:border-cyber-blue/30 transition-all"
              >
                <div className="flex items-center space-x-4">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-white">{scan.filename}</p>
                    <p className="text-sm text-gray-400">
                      by {scan.user} • {new Date(scan.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {scan.detection_result === 'malicious' && (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-500 border border-red-500/30">
                      Malicious
                    </span>
                  )}
                  {scan.detection_result === 'benign' && (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-500 border border-green-500/30">
                      Benign
                    </span>
                  )}
                  <span className="text-sm text-gray-400">{scan.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};