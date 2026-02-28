import React, { useEffect, useCallback } from 'react';
import { X, Home, BarChart3, Upload, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Close sidebar on route change
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  const handleNavigation = useCallback((path: string) => {
    navigate(path);
    onClose();
  }, [navigate, onClose]);

  // Check if route is active
  const isActive = useCallback((path: string) => {
    return location.pathname === path;
  }, [location.pathname]);

  const menuItems = [
    { label: 'Dashboard', icon: Home, href: '/dashboard' },
    { label: 'Scan File', icon: Upload, href: '/dashboard' },
    { label: 'Analytics', icon: BarChart3, href: '/analytics' },
    { label: 'Settings', icon: Settings, href: '/settings' },
  ];

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } z-40 border-r border-gray-800 bg-cyber-dark/50 backdrop-blur-sm`}
        aria-label="Sidebar"
      >
        {/* Close Button (Mobile) */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-cyber-blue md:hidden"
          aria-label="Close sidebar"
          type="button"
        >
          <X className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* Sidebar Content */}
        <div className="flex flex-col h-full pt-20 md:pt-0">
          {/* Logo (Desktop Only) */}
          <div className="hidden md:flex items-center space-x-3 px-6 py-4 border-b border-gray-800">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyber-blue to-cyber-purple"
              aria-hidden="true"
            >
              <span className="text-sm font-bold text-white">🛡️</span>
            </div>
            <span className="text-lg font-bold text-white">CyberShield</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 px-4 py-6" aria-label="Sidebar Navigation">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavigation(item.href)}
                className={`flex w-full items-center space-x-3 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  isActive(item.href)
                    ? 'bg-cyber-blue/20 text-cyber-blue'
                    : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                }`}
                aria-label={item.label}
                aria-current={isActive(item.href) ? 'page' : undefined}
                type="button"
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-800 px-4 py-4 text-xs text-gray-500">
            <p>© 2026 CyberShield</p>
            <p className="mt-1">v1.0.0</p>
          </div>
        </div>
      </aside>
    </>
  );
};