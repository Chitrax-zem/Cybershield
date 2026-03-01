import React, { useEffect } from 'react';

import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {


  // Update document title
  useEffect(() => {
    if (title) {
      document.title = `${title} - CyberShield`;
    } else {
      document.title = 'CyberShield - AI-Powered Malware Detection';
    }
  }, [title]);

  return (
    <div className="min-h-screen bg-cyber-dark flex flex-col">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {title && (
            <div className="mb-8 animate-fade-in">
              <h1 className="text-3xl font-bold text-white">{title}</h1>
            </div>
          )}
          <div className="animate-fade-in-up">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-cyber-dark/50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
            <p className="text-sm text-gray-500">
              © 2026 CyberShield. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <a href="#" className="hover:text-cyber-blue transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-cyber-blue transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-cyber-blue transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};