import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { useAuth } from '../context/AuthContext';

const Register: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (profile && profile.status === 'approved') {
      navigate('/');
    }
  }, [user, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    try {
      setLoading(true);
      setError(null);
      
      const redeemFn = httpsCallable(functions, 'redeemAccessCode');
      const result = await redeemFn({ code: cleanCode });
      const data = result.data as { success: boolean; role: string; status: string };

      if (data.success) {
        if (data.status === 'approved') {
          navigate('/');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-300 dark:bg-purple-900/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-blue-300 dark:bg-blue-900/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md p-8 rounded-2xl shadow-premium glass-panel border border-slate-200/50 dark:border-slate-800/50 text-center relative z-10 animate-slideUp">
        
        {profile && profile.status === 'pending_approval' ? (
          // Pending Approval View
          <div className="space-y-6">
            <div className="w-16 h-16 mx-auto bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center text-amber-500 shadow-inner">
              <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 2 0 002-2v-6a2 2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Registration Complete</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Your account has been registered and is now <span className="font-semibold text-amber-600 dark:text-amber-400">pending approval</span> by the administrator.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/30">
              💡 This page will refresh automatically and unlock access as soon as your account is approved.
            </p>

            <button
              onClick={handleLogout}
              className="mt-4 text-xs font-semibold text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              Sign out of Google
            </button>
          </div>
        ) : (
          // Redeem Code View
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 font-sans">
              Enter Invitation Code
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
              To request access to this private portal, please enter the one-time registration code issued by the portal owner.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30 rounded-xl text-sm text-red-600 dark:text-red-400 text-left">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  placeholder="e.g. ABCDEFGH"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full text-center tracking-widest uppercase font-mono font-bold text-xl px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-md transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'Redeeming...' : 'Verify & Continue'}
              </button>
            </form>

            <div className="mt-8 pt-4 border-t border-slate-200/30 flex justify-between items-center text-xs">
              <span className="text-slate-400 dark:text-slate-500">
                Logged in as {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
