import React from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    if (onMenuToggle) {
      onMenuToggle();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-800 bg-cyber-dark/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyber-blue to-cyber-purple">
            <span className="text-sm font-bold text-white">🛡️</span>
          </div>
          <span className="hidden text-xl font-bold text-white sm:inline">
            CyberShield
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center space-x-1 md:flex">
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-900 hover:text-white transition-all"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate('/analytics')}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-900 hover:text-white transition-all"
          >
            Analytics
          </button>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center space-x-4 md:flex">
          <button
            onClick={handleLogout}
            className="inline-flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:bg-gray-900 hover:text-white transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-900 md:hidden"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-800 bg-cyber-dark px-4 py-4 md:hidden">
          <nav className="space-y-2">
            <button
              onClick={() => {
                navigate('/dashboard');
                setMobileMenuOpen(false);
              }}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-400 hover:bg-gray-900 hover:text-white transition-all"
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                navigate('/analytics');
                setMobileMenuOpen(false);
              }}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-400 hover:bg-gray-900 hover:text-white transition-all"
            >
              Analytics
            </button>
            <button
              onClick={handleLogout}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-400 hover:bg-gray-900 hover:text-white transition-all"
            >
              Logout
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
