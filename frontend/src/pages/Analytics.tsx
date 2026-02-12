import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Layout } from '../components/layout/Layout';
import { analyticsApi } from '../services/api';
import type { UserStats } from '../types';

export const Analytics: React.FC = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const userStats = await analyticsApi.getMyStats();
      setStats(userStats);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyber-blue border-t-transparent" />
            <p className="text-gray-400">Loading analytics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400">
          {error}
        </div>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout>
        <div className="text-center py-12 text-gray-400">
          No data available
        </div>
      </Layout>
    );
  }

  // Prepare chart data
  const chartData = [
    {
      name: 'Malicious',
      value: stats.malicious_count,
      fill: '#ef4444'
    },
    {
      name: 'Benign',
      value: stats.benign_count,
      fill: '#22c55e'
    },
    {
      name: 'Suspicious',
      value: (stats.total_scans - stats.malicious_count - stats.benign_count),
      fill: '#eab308'
    }
  ];

  const lineChartData = [
    { name: 'Total Scans', value: stats.total_scans },
    { name: 'Malicious', value: stats.malicious_count },
    { name: 'Benign', value: stats.benign_count },
    { name: 'Zero-Day', value: stats.zero_day_count }
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass rounded-xl p-6 cyber-border">
            <p className="text-sm text-gray-400">Total Scans</p>
            <p className="mt-2 text-3xl font-bold text-white">{stats.total_scans}</p>
          </div>
          <div className="glass rounded-xl p-6 border border-red-500/20">
            <p className="text-sm text-gray-400">Malicious</p>
            <p className="mt-2 text-3xl font-bold text-red-500">{stats.malicious_count}</p>
          </div>
          <div className="glass rounded-xl p-6 border border-green-500/20">
            <p className="text-sm text-gray-400">Benign</p>
            <p className="mt-2 text-3xl font-bold text-green-500">{stats.benign_count}</p>
          </div>
          <div className="glass rounded-xl p-6 border border-purple-500/20">
            <p className="text-sm text-gray-400">Zero-Day</p>
            <p className="mt-2 text-3xl font-bold text-purple-500">{stats.zero_day_count}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie Chart */}
          <div className="glass rounded-2xl p-6 cyber-border">
            <h2 className="mb-6 text-lg font-bold text-white">Detection Results</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #00d4ff' }}
                  labelStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Line Chart */}
          <div className="glass rounded-2xl p-6 cyber-border">
            <h2 className="mb-6 text-lg font-bold text-white">Scan Statistics</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #00d4ff' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#00d4ff" 
                  dot={{ fill: '#00d4ff', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="glass rounded-2xl p-6 cyber-border">
          <h2 className="mb-6 text-lg font-bold text-white">Threat Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #00d4ff' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="value" fill="#00d4ff" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Refresh Button */}
        <button
          onClick={loadStats}
          className="w-full rounded-lg bg-gradient-to-r from-cyber-blue to-cyber-purple px-6 py-3 font-semibold text-white hover:opacity-90 transition-all"
        >
          Refresh Analytics
        </button>
      </div>
    </Layout>
  );
};
