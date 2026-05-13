import React, { useState } from 'react';
import { Button } from '@/components';
import { useAuth } from '../hooks';

export const Login: React.FC<{ onLoginSuccess: () => void }> = ({
  onLoginSuccess,
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { login, register, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      onLoginSuccess();
    } catch (err) {
      console.error('Auth failed:', err);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--bg-0)' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className="w-8 h-8 rounded"
            style={{ background: 'var(--grad-iq)' }}
          />
          <span className="text-xl font-bold">Masco Intel</span>
        </div>

        {/* Card */}
        <div
          className="rounded-lg border border-line-1 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-1)' }}
        >
          {/* Header */}
          <div
            className="p-6 border-b border-line-1"
            style={{ backgroundColor: 'var(--bg-2)' }}
          >
            <h1 className="text-2xl font-bold mb-1">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-sm text-ink-3">
              {isLogin
                ? 'Sign in to your account'
                : 'Join the platform today'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Error Message */}
            {error && (
              <div
                className="p-3 rounded-lg border border-bad text-sm text-bad"
                style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--bad)' }}
              >
                {error.message}
              </div>
            )}

            {/* Name (Register only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 rounded-lg border border-line-2 text-sm"
                  style={{
                    backgroundColor: 'var(--bg-2)',
                    borderColor: 'var(--line-2)',
                    color: 'var(--ink-0)',
                  }}
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-4 py-2 rounded-lg border border-line-2 text-sm"
                style={{
                  backgroundColor: 'var(--bg-2)',
                  borderColor: 'var(--line-2)',
                  color: 'var(--ink-0)',
                }}
                required
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded-lg border border-line-2 text-sm"
                style={{
                  backgroundColor: 'var(--bg-2)',
                  borderColor: 'var(--line-2)',
                  color: 'var(--ink-0)',
                }}
                required
                disabled={isLoading}
              />
            </div>

            {/* Submit Button */}
            <Button
              variant="primary"
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
            </Button>

            {/* Toggle */}
            <div className="text-center text-sm">
              <span className="text-ink-3">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setEmail('');
                  setPassword('');
                  setName('');
                }}
                className="text-cyan font-medium hover:underline"
                disabled={isLoading}
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div
            className="p-4 border-t border-line-1 text-center text-xs text-ink-3"
            style={{ backgroundColor: 'var(--bg-2)' }}
          >
            Protected by industry-standard security. Your data is encrypted.
          </div>
        </div>

        {/* Demo Info */}
        <div className="mt-6 p-4 rounded-lg border border-line-2" style={{ backgroundColor: 'var(--bg-2)' }}>
          <p className="text-xs text-ink-3 mb-2 font-medium">Demo Credentials:</p>
          <p className="text-xs text-ink-3">Email: demo@example.com</p>
          <p className="text-xs text-ink-3">Password: password123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
