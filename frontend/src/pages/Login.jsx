import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // Import our fixed api service
import { LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFormKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.type !== 'submit') {
      e.preventDefault();
      const form = e.currentTarget;
      const elements = Array.from(form.elements).filter(el => !el.disabled && el.type !== 'hidden');
      const index = elements.indexOf(e.target);
      if (index > -1 && index < elements.length - 1) {
        elements[index + 1].focus();
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);
      
      // Use the 'api' instance which has the correct 127.0.0.1:8000 baseURL
      const response = await api.post(
        '/auth/token',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      localStorage.setItem('token', response.data.access_token);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      if (err.response) {
        setError(err.response.data.detail || 'Invalid username or password');
      } else if (err.request) {
        setError('No response from server. Please check if backend is running.');
      } else {
        setError('An error occurred during sign in.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative overflow-hidden" 
         style={{ backgroundImage: 'url("/assets/login-bg.png")' }}>
      
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"></div>

      <div className="relative z-10 w-full max-w-md px-6 animate-slide-up">
        <div className="glass p-8 md:p-10 rounded-[2rem] border-white/30">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl shadow-xl shadow-primary-600/30 mb-6 rotate-3 hover:rotate-0 transition-transform duration-300">
              <LockClosedIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
              Shop<span className="text-primary-600">Manager</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Welcome back! Please enter your details.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-600 dark:text-rose-400 text-sm font-medium animate-in">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} onKeyDown={handleFormKeyDown} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
                  <UserIcon className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
                  <LockClosedIcon className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between ml-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 transition-all" />
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">Remember me</span>
              </label>
              <a href="#" className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-4 text-base font-bold tracking-wide disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </span>
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <a href="#" className="text-primary-600 font-bold hover:text-primary-700 transition-colors">Contact Administrator</a>
            </p>
          </div>
        </div>
        
        {/* Footer info */}
        <p className="mt-8 text-center text-xs font-semibold text-white/60 tracking-widest uppercase">
          Powered by ShopManager Pro v2.0
        </p>
      </div>
    </div>
  );
}
