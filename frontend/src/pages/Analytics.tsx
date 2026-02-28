import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RefreshCw, AlertCircle, TrendingUp, Shield, Activity } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { analyticsApi } from '../services/api';
import type { UserStats } from '../types';

// Chart colors
const CHART_COLORS = {
  malicious: '#ef4444',
  benign: '#22c55e',
  suspicious: '#eab308',
  primary: '#00d4ff',
  grid: '#333',
  text: '#999',
};

export const Analytics: React.FC = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      setError('');
      const userStats = await analyticsApi.getMyStats();
      setStats(userStats);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadStats();
  }, [loadStats]);

  // Loading state
  if (loading) {
    return (
      <Layout title="Analytics">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyber-blue border-t-transparent" />
            <p className="text-gray-400">Loading analytics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout title="Analytics">
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 font-medium">Error loading analytics</p>
              <p className="text-red-400/80 text-sm mt-1">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-3 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all text-sm font-medium"
                type="button"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Empty state
  if (!stats) {
    return (
      <Layout title="Analytics">
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No data available</p>
          <p className="text-gray-500 text-sm mt-2">Start scanning files to see analytics</p>
        </div>
      </Layout>
    );
  }

  // Prepare chart data
  const chartData = [
    {
      name: 'Malicious',
      value: stats.malicious_count,
      fill: CHART_COLORS.malicious,
    },
    {
      name: 'Benign',
      value: stats.benign_count,
      fill: CHART_COLORS.benign,
    },
    {
      name: 'Suspicious',
      value: Math.max(0, stats.total_scans - stats.malicious_count - stats.benign_count),
      fill: CHART_COLORS.suspicious,
    },
  ];

  const lineChartData = [
    { name: 'Total Scans', value: stats.total_scans, icon: Activity },
    { name: 'Malicious', value: stats.malicious_count, icon: AlertCircle },
    { name: 'Benign', value: stats.benign_count, icon: Shield },
    { name: 'Zero-Day', value: stats.zero_day_count, icon: TrendingUp },
  ];

  return (
    <Layout title="Analytics">
      <div className="space-y-8">
        {/* Header with refresh button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Overview</h2>
            <p className="text-sm text-gray-400 mt-1">Your scanning statistics and insights</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-cyber-blue/10 text-cyber-blue hover:bg-cyber-blue/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass rounded-xl p-6 cyber-border hover:border-cyber-blue/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Scans</p>
                <p className="mt-2 text-3xl font-bold text-white">{stats.total_scans}</p>
              </div>
              <Activity className="w-8 h-8 text-cyber-blue opacity-50" />
            </div>
          </div>

          <div className="glass rounded-xl p-6 border border-red-500/20 hover:border-red-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Malicious</p>
                <p className="mt-2 text-3xl font-bold text-red-500">{stats.malicious_count}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500 opacity-50" />
            </div>
          </div>

          <div className="glass rounded-xl p-6 border border-green-500/20 hover:border-green-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Benign</p>
                <p className="mt-2 text-3xl font-bold text-green-500">{stats.benign_count}</p>
              </div>
              <Shield className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>

          <div className="glass rounded-xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Zero-Day</p>
                <p className="mt-2 text-3xl font-bold text-purple-500">{stats.zero_day_count}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie Chart */}
          <div className="glass rounded-2xl p-6 cyber-border">
            <h3 className="mb-6 text-lg font-bold text-white">Detection Results</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #00d4ff', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Line Chart */}
          <div className="glass rounded-2xl p-6 cyber-border">
            <h3 className="mb-6 text-lg font-bold text-white">Scan Statistics</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="name" stroke={CHART_COLORS.text} />
                <YAxis stroke={CHART_COLORS.text} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #00d4ff', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={CHART_COLORS.primary} 
                  dot={{ fill: CHART_COLORS.primary, r: 4 }}
                  activeDot={{ r: 6 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="glass rounded-2xl p-6 cyber-border">
          <h3 className="mb-6 text-lg font-bold text-white">Threat Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis dataKey="name" stroke={CHART_COLORS.text} />
              <YAxis stroke={CHART_COLORS.text} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #00d4ff', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="value" fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  );
};