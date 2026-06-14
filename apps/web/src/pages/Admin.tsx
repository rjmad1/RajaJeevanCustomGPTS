import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc,
  deleteDoc 
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { UserProfile, AccessCode, AuditLog } from '../types';
import Navbar from '../components/Navbar';

type AdminTab = 'users' | 'codes' | 'audit' | 'database';

const Admin: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  // Invitation Form State
  const [inviteName, setInviteName] = useState('');
  const [inviteDays, setInviteDays] = useState(7);
  const [inviteDuration, setInviteDuration] = useState<'1_month' | '3_months' | '1_year'>('1_month');
  const [newCode, setNewCode] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  // General loading states
  const [usersLoading, setUsersLoading] = useState(true);
  const [codesLoading, setCodesLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(true);

  // Role modification status
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const isSuperAdmin = profile?.role === 'super_admin';

  useEffect(() => {
    if (!user || !profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      navigate('/');
    }
  }, [user, profile, navigate]);

  // 1. Fetch Users List
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('status', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const uList: UserProfile[] = [];
      snapshot.forEach((doc) => {
        uList.push(doc.data() as UserProfile);
      });
      setUsers(uList);
      setUsersLoading(false);
    }, (err) => {
      console.error(err);
      setUsersLoading(false);
    });
  }, []);

  // 2. Fetch Access Codes List
  useEffect(() => {
    const q = query(collection(db, 'access_codes'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const cList: AccessCode[] = [];
      snapshot.forEach((doc) => {
        cList.push(doc.data() as AccessCode);
      });
      setCodes(cList);
      setCodesLoading(false);
    }, (err) => {
      console.error(err);
      setCodesLoading(false);
    });
  }, []);

  // 3. Fetch Audit Logs
  useEffect(() => {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(100));
    return onSnapshot(q, (snapshot) => {
      const lList: AuditLog[] = [];
      snapshot.forEach((doc) => {
        lList.push(doc.data() as AuditLog);
      });
      setAuditLogs(lList);
      setAuditLoading(false);
    }, (err) => {
      console.error(err);
      setAuditLoading(false);
    });
  }, []);

  // Handle User approval / suspension / reactivation
  const handleUpdateStatus = async (targetUserId: string, newRole: string | null, newStatus: string | null) => {
    try {
      setUpdatingUserId(targetUserId);
      const updateFn = httpsCallable(functions, 'updateUserRoleAndStatus');
      await updateFn({
        targetUserId,
        newRole,
        newStatus
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update user profile.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Generate Invite / Access code
  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteDays <= 0) return;

    try {
      setInviteLoading(true);
      setNewCode(null);
      const generateFn = httpsCallable(functions, 'generateAccessCode');
      const result = await generateFn({
        issuedTo: inviteName.trim(),
        daysValid: inviteDays,
        accessDuration: inviteDuration
      });
      const data = result.data as { success: boolean; code: string };
      if (data.success) {
        setNewCode(data.code);
        setInviteName('');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to generate invitation code.");
    } finally {
      setInviteLoading(false);
    }
  };

  // Delete expired / unused code
  const handleDeleteCode = async (codeId: string) => {
    if (!window.confirm(`Delete invitation code ${codeId}?`)) return;
    try {
      await deleteDoc(doc(db, 'access_codes', codeId));
    } catch (err) {
      console.error("Failed to delete code:", err);
    }
  };

  // Helper format timestamps
  const formatTime = (ts: any) => {
    if (!ts) return 'N/A';
    if (ts.toDate) return ts.toDate().toLocaleString();
    if (typeof ts === 'string') return new Date(ts).toLocaleString();
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    return 'N/A';
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
              Manage users, track invitations, and view real-time audit activity.
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
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto">
          {(['users', 'codes', 'audit'] as AdminTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 border-b-2 font-bold text-sm tracking-wide capitalize whitespace-nowrap transition-colors outline-none ${
                activeTab === tab 
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              {tab === 'users' ? 'User Management' : tab === 'codes' ? 'Invite Codes' : 'Audit Logs'}
            </button>
          ))}
        </div>

        {/* TAB 1: User Management */}
        {activeTab === 'users' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Seeding instructions if no users are approved */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/30 rounded-2xl p-6 shadow-premium">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-4">User Directory</h2>

              {usersLoading ? (
                <div className="py-8 text-center text-slate-400">Loading directory...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Access Expires</th>
                        <th className="py-3 px-4">Joined</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {users.map((u) => {
                        const isSelf = u.id === user?.uid;
                        
                        return (
                          <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                            <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{u.name || 'Unknown'}</td>
                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono text-xs">{u.email}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                u.role === 'super_admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' :
                                u.role === 'admin' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' :
                                'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                u.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' :
                                u.status === 'pending_approval' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 animate-pulse' :
                                'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                              }`}>
                                {u.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {u.role === 'super_admin' || u.role === 'admin' ? (
                                <span className="text-slate-400 italic">Never (Admin)</span>
                              ) : u.accessExpiresAt ? (
                                formatTime(u.accessExpiresAt)
                              ) : (
                                <span className="text-red-500 italic">No pass</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 dark:text-slate-500 text-xs">{formatTime(u.createdAt)}</td>
                            <td className="py-3.5 px-4 text-right">
                              {isSelf ? (
                                <span className="text-xs text-slate-400 italic">Current User</span>
                              ) : (
                                <div className="flex justify-end gap-1.5">
                                  {u.status === 'pending_approval' && (
                                    <button
                                      disabled={updatingUserId === u.id}
                                      onClick={() => handleUpdateStatus(u.id, null, 'approved')}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                                    >
                                      Approve
                                    </button>
                                  )}
                                  
                                  {u.status === 'approved' && (
                                    <button
                                      disabled={updatingUserId === u.id || (u.role === 'super_admin' && !isSuperAdmin)}
                                      onClick={() => handleUpdateStatus(u.id, null, 'suspended')}
                                      className="px-2.5 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold transition-colors"
                                    >
                                      Suspend
                                    </button>
                                  )}

                                  {u.status === 'suspended' && (
                                    <button
                                      disabled={updatingUserId === u.id}
                                      onClick={() => handleUpdateStatus(u.id, null, 'approved')}
                                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold transition-colors"
                                    >
                                      Reactivate
                                    </button>
                                  )}

                                  {/* Role Promotion (Super Admin Only) */}
                                  {isSuperAdmin && u.role === 'authorized_user' && u.status === 'approved' && (
                                    <button
                                      disabled={updatingUserId === u.id}
                                      onClick={() => handleUpdateStatus(u.id, 'admin', null)}
                                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-semibold transition-colors"
                                    >
                                      Make Admin
                                    </button>
                                  )}

                                  {isSuperAdmin && u.role === 'admin' && (
                                    <button
                                      disabled={updatingUserId === u.id}
                                      onClick={() => handleUpdateStatus(u.id, 'authorized_user', null)}
                                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                                    >
                                      Demote
                                    </button>
                                  )}
                                </div>
                              )}
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

        {/* TAB 2: Access Codes */}
        {activeTab === 'codes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fadeIn">
            {/* Generate Code Form */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/30 rounded-2xl p-6 shadow-premium">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-4">Generate Invitation Code</h2>
              
              <form onSubmit={handleGenerateCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Issued To (Name / Email)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Validity Duration</label>
                  <select
                    value={inviteDays}
                    onChange={(e) => setInviteDays(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm transition-all"
                  >
                    <option value={1}>1 Day</option>
                    <option value={3}>3 Days</option>
                    <option value={7}>7 Days (Default)</option>
                    <option value={30}>30 Days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Access Pass Duration</label>
                  <select
                    value={inviteDuration}
                    onChange={(e) => setInviteDuration(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm transition-all"
                  >
                    <option value="1_month">1 Month Pass</option>
                    <option value="3_months">3 Months Pass</option>
                    <option value="1_year">1 Year Pass</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-sm"
                >
                  {inviteLoading ? 'Generating...' : 'Create Invite Code'}
                </button>
              </form>

              {newCode && (
                <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 rounded-xl text-center">
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">Invitation Code Generated</div>
                  <div className="text-2xl font-mono font-extrabold text-emerald-800 dark:text-emerald-300 tracking-wider mb-2">{newCode}</div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(newCode);
                      alert('Code copied to clipboard!');
                    }}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 underline"
                  >
                    Copy Code
                  </button>
                </div>
              )}
            </div>

            {/* Codes Listing */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/30 rounded-2xl p-6 shadow-premium">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-4">Active Invite Codes</h2>

              {codesLoading ? (
                <div className="py-8 text-center text-slate-400">Loading codes...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4">Issued To</th>
                        <th className="py-3 px-4">Access Pass</th>
                        <th className="py-3 px-4">Created</th>
                        <th className="py-3 px-4">Expires</th>
                        <th className="py-3 px-4">Redeemed By</th>
                        <th className="py-3 px-4 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {codes.map((c) => {
                        const now = Date.now();
                        const expires = c.expiresAt?.toDate ? c.expiresAt.toDate().getTime() : new Date(c.expiresAt).getTime();
                        const isExpired = expires < now;

                        return (
                          <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                            <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{c.code}</td>
                            <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{c.issuedTo || 'Any'}</td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 capitalize whitespace-nowrap">
                                {(c.accessDuration || '1_month').replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 dark:text-slate-500 text-xs">{formatTime(c.createdAt)}</td>
                            <td className="py-3.5 px-4 text-xs">
                              {c.used ? (
                                <span className="text-slate-400 font-semibold">Redeemed</span>
                              ) : isExpired ? (
                                <span className="text-red-500 font-semibold">Expired</span>
                              ) : (
                                <span className="text-slate-600 dark:text-slate-400">{formatTime(c.expiresAt)}</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                              {c.used ? c.redeemedEmail || c.redeemedBy : '-'}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleDeleteCode(c.id)}
                                className="text-xs font-bold text-red-500 hover:text-red-600 dark:hover:text-red-400"
                              >
                                Delete
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

        {/* TAB 3: Audit Logs */}
        {activeTab === 'audit' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/30 rounded-2xl p-6 shadow-premium animate-fadeIn">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-4">Audit Activity Logs</h2>

            {auditLoading ? (
              <div className="py-8 text-center text-slate-400">Loading activity...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Actor</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Target Entity</th>
                      <th className="py-3 px-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-sans text-xs">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-500 font-mono whitespace-nowrap">{formatTime(log.timestamp)}</td>
                        <td className="py-3.5 px-4 text-slate-800 dark:text-slate-300 font-semibold">{log.userEmail || log.userId}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                            log.action === 'redeem_code' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
                            log.action === 'generate_code' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400' :
                            'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">{log.entity} ({log.entityId})</td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 max-w-sm overflow-hidden text-ellipsis whitespace-nowrap">
                          {log.details ? JSON.stringify(log.details) : '-'}
                        </td>
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
