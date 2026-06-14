import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const { user, profile, login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [passToken, setPassToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'super_admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [user, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = passToken.trim();

    if (!cleanEmail || !cleanToken) {
      setError("Please fill in both your email and access pass.");
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const success = await login(cleanEmail, cleanToken);
      if (success) {
        if (cleanEmail === 'rajajeevankumar@gmail.com') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Login failed. Please verify your email and access pass.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-300 dark:bg-indigo-900/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-300 dark:bg-purple-900/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md p-8 rounded-2xl shadow-premium glass-panel border border-slate-200/50 dark:border-slate-800/50 relative z-10 animate-slideUp">
        
        {/* Logo/Icon */}
        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg text-white font-extrabold text-2xl">
          AI
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 text-center font-sans">
          AI Agents Portal
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8 text-center text-sm font-medium">
          Secure private directory of CustomGPTs & Intelligent Agents
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30 rounded-xl text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl outline-none transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Access Pass / Password</label>
            <input
              type="password"
              required
              placeholder="Enter your cryptographic token or passphrase"
              value={passToken}
              onChange={(e) => setPassToken(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl outline-none transition-all text-sm font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-md transition-all duration-200 disabled:opacity-50 text-sm"
          >
            {loading ? 'Verifying access pass...' : 'Access Portal'}
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
          Authorized personnel only. Access is governed by cryptographic passes issued by the administrator.
        </p>
      </div>
    </div>
  );
};

export default Login;
