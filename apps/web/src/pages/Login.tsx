import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const { user, profile, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (profile) {
        if (profile.status === 'approved') {
          navigate('/');
        } else {
          navigate('/register');
        }
      } else {
        navigate('/register');
      }
    }
  }, [user, profile, navigate]);

  const handleLogin = async () => {
    try {
      setError(null);
      setLoading(true);
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-300 dark:bg-indigo-900/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-300 dark:bg-purple-900/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md p-8 rounded-2xl shadow-premium glass-panel border border-slate-200/50 dark:border-slate-800/50 text-center relative z-10 animate-slideUp">
        
        {/* Logo/Icon */}
        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg text-white font-extrabold text-2xl">
          AI
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
          AI Agents Portal
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8 font-medium">
          Secure private directory of CustomGPTs & Intelligent Agents
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30 rounded-xl text-sm text-red-600 dark:text-red-400 text-left">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl shadow-sm transition-all duration-200 disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-600"></div>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.137 4.114-3.415 0-6.19-2.77-6.19-6.19s2.776-6.19 6.19-6.19c1.558 0 2.973.576 4.07 1.527l3.078-3.078C19.3 2.115 15.996 1 12.24 1 5.48 1 0 6.48 0 13.24s5.48 12.24 12.24 12.24c6.88 0 12.24-5.48 12.24-12.24 0-.82-.073-1.63-.223-2.428H12.24z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        <p className="mt-8 text-xs text-slate-400 dark:text-slate-500">
          Authorized personnel only. Access is governed by invitation codes.
        </p>
      </div>
    </div>
  );
};

export default Login;
