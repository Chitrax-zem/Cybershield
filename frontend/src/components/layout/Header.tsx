import React, { useEffect, useCallback, useState } from 'react';
import { LogOut, Menu, X, Shield } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  }, [navigate]);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const handleNavigation = useCallback(
    (path: string, section?: string) => {
      if (path === '/dashboard' && section) {
        if (location.pathname === '/dashboard') {
          const element = document.getElementById(section);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else {
          navigate(`${path}#${section}`);
        }
      } else {
        navigate(path);
      }
      setMobileMenuOpen(false);
    },
    [navigate, location.pathname]
  );

  const isAuthPage = ['/login', '/signup'].includes(location.pathname);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      section: 'scan-section',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      path: '/dashboard',
      section: 'analytics-section',
    },
  ];

  const isActive = (section?: string) => {
    if (location.pathname !== '/dashboard') return false;
    if (!section) return false;
    return location.hash === `#${section}`;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-800 bg-cyber-dark/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center px-4 py-4 sm:px-6 lg:px-8">

        {/* LEFT - Logo */}
        <div className="flex flex-1 items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-cyber-blue rounded-lg"
            type="button"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyber-blue to-cyber-purple shadow-md">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-wide">
              CyberShield
            </span>
          </button>
        </div>

        {/* CENTER - Desktop Nav */}
        {!isAuthPage && (
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path, item.section)}
                className={`text-sm font-medium transition-all ${
                  isActive(item.section)
                    ? 'text-cyber-blue'
                    : 'text-gray-400 hover:text-white'
                }`}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}

        {/* RIGHT - Logout + Mobile */}
        {!isAuthPage && (
          <div className="flex flex-1 justify-end items-center space-x-4">

            {/* Logout Desktop */}
            <div className="hidden md:flex">
              <button
                onClick={handleLogout}
                className="inline-flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:bg-gray-900 hover:text-white transition-all"
                type="button"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={toggleMobileMenu}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-900 md:hidden"
              type="button"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {!isAuthPage && mobileMenuOpen && (
        <nav className="border-t border-gray-800 bg-cyber-dark px-4 py-4 md:hidden">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigation(item.path, item.section)}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-all ${
                    isActive(item.section)
                      ? 'bg-cyber-blue/20 text-cyber-blue'
                      : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                  }`}
                  type="button"
                >
                  {item.label}
                </button>
              </li>
            ))}

            <li>
              <button
                onClick={handleLogout}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-400 hover:bg-gray-900 hover:text-white transition-all"
                type="button"
              >
                Logout
              </button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
};
