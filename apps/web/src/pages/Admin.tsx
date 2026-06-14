import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { generateToken } from '../utils/tokenManager';

interface IssuedPass {
  id: string;
  email: string;
  duration: '1_month' | '3_months' | '1_year';
  token: string;
  createdAt: string;
  expiresAt: string;
}

interface LocalAuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}

const Admin: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'passes' | 'audit'>('passes');
  const [issuedPasses, setIssuedPasses] = useState<IssuedPass[]>([]);
  const [auditLogs, setAuditLogs] = useState<LocalAuditLog[]>([]);

  // Form State
  const [guestEmail, setGuestEmail] = useState('');
  const [passDuration, setPassDuration] = useState<'1_month' | '3_months' | '1_year'>('1_month');
  const [generatedPass, setGeneratedPass] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Restrict to super_admin only (rajajeevankumar@gmail.com)
    if (!user || !profile || profile.role !== 'super_admin') {
      navigate('/');
    }
  }, [user, profile, navigate]);

  // Load passes and audit logs from localStorage
  const loadData = () => {
    const passesStr = localStorage.getItem('issued_passes');
    setIssuedPasses(passesStr ? JSON.parse(passesStr) : []);

    const logsStr = localStorage.getItem('local_audit_logs');
    setAuditLogs(logsStr ? JSON.parse(logsStr) : []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGeneratePass = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = guestEmail.trim().toLowerCase();
    if (!cleanEmail) return;

    try {
      setLoading(true);
      setGeneratedPass(null);

      // Generate the cryptographic token
      const token = await generateToken(cleanEmail, passDuration);

      const now = new Date();
      let expiry = new Date();
      if (passDuration === '1_month') expiry.setMonth(now.getMonth() + 1);
      else if (passDuration === '3_months') expiry.setMonth(now.getMonth() + 3);
      else if (passDuration === '1_year') expiry.setFullYear(now.getFullYear() + 1);

      const newPass: IssuedPass = {
        id: `pass_${Date.now()}`,
        email: cleanEmail,
        duration: passDuration,
        token,
        createdAt: now.toISOString(),
        expiresAt: expiry.toISOString()
      };

      // Save to localStorage
      const currentPassesStr = localStorage.getItem('issued_passes');
      const currentPasses: IssuedPass[] = currentPassesStr ? JSON.parse(currentPassesStr) : [];
      currentPasses.unshift(newPass);
      localStorage.setItem('issued_passes', JSON.stringify(currentPasses));

      // Write local audit log
      const newAudit: LocalAuditLog = {
        id: `audit_${Date.now()}`,
        timestamp: now.toISOString(),
        action: 'generate_pass',
        details: `Issued ${passDuration.replace('_', ' ')} Access Pass for ${cleanEmail}`
      };
      const currentLogsStr = localStorage.getItem('local_audit_logs');
      const currentLogs: LocalAuditLog[] = currentLogsStr ? JSON.parse(currentLogsStr) : [];
      currentLogs.unshift(newAudit);
      localStorage.setItem('local_audit_logs', JSON.stringify(currentLogs));

      setGeneratedPass(token);
      setGuestEmail('');
      loadData();
    } catch (err: any) {
      console.error(err);
      alert("Failed to generate pass.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePass = (passId: string, email: string) => {
    if (!window.confirm(`Revoke Access Pass for ${email}?`)) return;

    try {
      const currentPassesStr = localStorage.getItem('issued_passes');
      let currentPasses: IssuedPass[] = currentPassesStr ? JSON.parse(currentPassesStr) : [];
      currentPasses = currentPasses.filter((p) => p.id !== passId);
      localStorage.setItem('issued_passes', JSON.stringify(currentPasses));

      // Audit Log
      const newAudit: LocalAuditLog = {
        id: `audit_${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'revoke_pass',
        details: `Revoked Access Pass for ${email}`
      };
      const currentLogsStr = localStorage.getItem('local_audit_logs');
      const currentLogs: LocalAuditLog[] = currentLogsStr ? JSON.parse(currentLogsStr) : [];
      currentLogs.unshift(newAudit);
      localStorage.setItem('local_audit_logs', JSON.stringify(currentLogs));

      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brand-950 transition-colors duration-200 pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Title */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
              Administration Portal
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              Issue cryptographic access passes and audit local generation activity.
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-md hover:bg-indigo-500 transition-colors"
            >
              Back to Catalog
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8">
          <button
            onClick={() => setActiveTab('passes')}
            className={`px-5 py-3 border-b-2 font-bold text-sm tracking-wide capitalize whitespace-nowrap transition-colors outline-none ${
              activeTab === 'passes' 
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Access Passes
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-5 py-3 border-b-2 font-bold text-sm tracking-wide capitalize whitespace-nowrap transition-colors outline-none ${
              activeTab === 'audit' 
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Audit Logs
          </button>
        </div>

        {/* TAB 1: Access Passes */}
        {activeTab === 'passes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fadeIn">
            
            {/* Generate Pass Form */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/30 rounded-2xl p-6 shadow-premium">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-4">Issue Access Pass</h2>
              
              <form onSubmit={handleGeneratePass} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Guest Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. guest@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Pass Duration</label>
                  <select
                    value={passDuration}
                    onChange={(e) => setPassDuration(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm transition-all"
                  >
                    <option value="1_month">1 Month</option>
                    <option value="3_months">3 Months</option>
                    <option value="1_year">1 Year</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-sm"
                >
                  {loading ? 'Generating...' : 'Create Access Pass'}
                </button>
              </form>

              {generatedPass && (
                <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 rounded-xl">
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2 text-center">Cryptographic Pass Token</div>
                  <textarea
                    readOnly
                    value={generatedPass}
                    rows={4}
                    className="w-full p-2 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-slate-700 dark:text-slate-300 resize-none break-all"
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPass);
                      alert('Access pass copied to clipboard!');
                    }}
                    className="w-full mt-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                  >
                    Copy Pass Token
                  </button>
                  <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                    Provide the guest with this token. They can use it alongside their email to log in from the login screen.
                  </p>
                </div>
              )}
            </div>

            {/* Issued Passes Listing */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/30 rounded-2xl p-6 shadow-premium">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-4">Issued Access Passes</h2>

              {issuedPasses.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm italic">No active access passes have been issued yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                        <th className="py-3 px-4">Guest Email</th>
                        <th className="py-3 px-4">Pass Type</th>
                        <th className="py-3 px-4">Issued On</th>
                        <th className="py-3 px-4">Expires On</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {issuedPasses.map((p) => {
                        const isExpired = new Date(p.expiresAt).getTime() < Date.now();
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                            <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{p.email}</td>
                            <td className="py-3.5 px-4 capitalize">
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
                                {p.duration.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                            <td className="py-3.5 px-4 text-xs font-semibold">
                              {isExpired ? (
                                <span className="text-red-500">Expired</span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  {new Date(p.expiresAt).toLocaleDateString()}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleDeletePass(p.id, p.email)}
                                className="text-xs font-bold text-red-500 hover:text-red-600 dark:hover:text-red-400"
                              >
                                Revoke
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Audit Logs */}
        {activeTab === 'audit' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/30 rounded-2xl p-6 shadow-premium animate-fadeIn">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-4">Local Audit Logs</h2>

            {auditLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm italic">No generation logs present.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-sans text-xs">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="py-3.5 px-4 text-slate-500 font-mono whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                            log.action === 'generate_pass' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' :
                            'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {log.action.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default Admin;
