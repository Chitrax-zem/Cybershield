import React, { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Shield, AlertCircle, CheckCircle, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/layout/Layout';

// Password strength levels
type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number;
  feedback: string[];
}

const checkPasswordStrength = (password: string): PasswordStrengthResult => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push('At least 8 characters');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Lowercase letter');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Uppercase letter');

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Number');

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push('Special character');

  let strength: PasswordStrength = 'weak';
  if (score >= 4) strength = 'strong';
  else if (score >= 3) strength = 'good';
  else if (score >= 2) strength = 'fair';

  return { strength, score, feedback };
};

const STYLES: Record<PasswordStrength, { color: string; bg: string; width: string }> = {
  weak: { color: 'text-red-500', bg: 'bg-red-500', width: '25%' },
  fair: { color: 'text-yellow-500', bg: 'bg-yellow-500', width: '50%' },
  good: { color: 'text-blue-500', bg: 'bg-blue-500', width: '75%' },
  strong: { color: 'text-green-500', bg: 'bg-green-500', width: '100%' },
};

export const Signup: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

  const passwordStrength = useMemo(() => checkPasswordStrength(password), [password]);

  const validateForm = useCallback((): boolean => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }
    return true;
  }, [password, confirmPassword, email, username]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await signup(username, email, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [username, email, password, signup, validateForm]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword((prev) => !prev);
  }, []);

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <div className="glass rounded-2xl p-8 cyber-border">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyber-green/10 mb-4">
              <Shield className="w-8 h-8 text-cyber-green" />
            </div>
            <h2 className="text-2xl font-bold text-white">Create Account</h2>
            <p className="text-gray-400 mt-2">Join our AI-powered security platform</p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20" role="alert">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <p className="text-sm text-green-500">Account created successfully!</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20" role="alert">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-500">{error}</p>
              </div>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 pl-11 rounded-lg bg-cyber-dark border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyber-green focus:border-transparent transition-all"
                  placeholder="Choose a username"
                  required
                  minLength={3}
                  maxLength={50}
                  autoComplete="username"
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 pl-11 rounded-lg bg-cyber-dark border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyber-green focus:border-transparent transition-all"
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-11 pr-11 rounded-lg bg-cyber-dark border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyber-green focus:border-transparent transition-all"
                  placeholder="Create a password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Password strength</span>
                    <span className={`text-xs font-medium ${STYLES[passwordStrength.strength].color}`}>
                      {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${STYLES[passwordStrength.strength].bg} transition-all duration-300`}
                      style={{ width: STYLES[passwordStrength.strength].width }}
                    />
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {passwordStrength.feedback.map((item, idx) => (
                        <li key={idx} className="text-xs text-gray-500 flex items-center space-x-1">
                          <span className="text-yellow-500">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-11 pr-11 rounded-lg bg-cyber-dark border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyber-green focus:border-transparent transition-all"
                  placeholder="Confirm your password"
                  required
                  autoComplete="new-password"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-1 w-4 h-4 rounded border-gray-700 bg-cyber-dark text-cyber-green focus:ring-cyber-green focus:ring-offset-0"
              />
              <label htmlFor="terms" className="text-sm text-gray-400">
                I agree to the{' '}
                <Link to="/terms" className="text-cyber-green hover:text-cyber-blue transition-colors">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-cyber-green hover:text-cyber-blue transition-colors">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-cyber-green to-cyber-blue text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed cyber-glow"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating account...</span>
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-cyber-green hover:text-cyber-blue transition-colors font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};