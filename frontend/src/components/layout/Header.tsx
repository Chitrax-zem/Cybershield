import React from 'react';
import { Shield, User, LogOut, BarChart3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn.ts';

interface HeaderProps {
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ title = 'CyberShield' }) => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="glass sticky top-0 z-50 border-b border-cyber-blue/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyber-blue/10 rounded-lg">
              <Shield className="w-8 h-8 text-cyber-blue" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyber-blue to-cyber-purple bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="text-xs text-gray-400">AI-Powered Security</p>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user && (
              <>
                {isAdmin && (
                  <a
                    href="/dashboard"
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-cyber-blue/10 transition-all"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Analytics</span>
                  </a>
                )}
                
                <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-cyber-dark/50">
                  <User className="w-5 h-5 text-cyber-blue" />
                  <span className="text-sm font-medium text-gray-200">{user.username}</span>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/30">
                    {user.role}
                  </span>
                </div>

                <button
                  onClick={logout}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};