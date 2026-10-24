import React, { useState, useEffect } from 'react';
import { UserCheck, UserPlus, KeyRound, Power, AlertCircle, CheckCircle2, Shield, X, Loader2 } from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create HR Modal
  const [createHrOpen, setCreateHrOpen] = useState(false);
  const [hrEmail, setHrEmail] = useState('');
  const [hrPassword, setHrPassword] = useState('');
  const [creating, setCreating] = useState(false);

  // Reset Password Modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [tempPassword, setTempPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (err) {
      setError('Failed to fetch user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateHr = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/auth/create-hr', { email: hrEmail, password: hrPassword });
      setCreateHrOpen(false);
      setHrEmail('');
      setHrPassword('');
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create HR account');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'deactivated' : 'active';
    if (!window.confirm(`Are you sure you want to change ${user.email} to ${nextStatus}?`)) return;

    try {
      await api.patch(`/auth/users/${user._id}/status`, { status: nextStatus });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetting(true);
    try {
      await api.post(`/auth/users/${selectedUser._id}/reset-password`, { temporaryPassword: tempPassword });
      setResetModalOpen(false);
      alert('Password has been reset. User must change it upon their next sign-in.');
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Password reset failed');
    } finally {
      setResetting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading user directory..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            User Access & Authentication Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Provision HR operators, deactivate accounts, and trigger mandatory password resets
          </p>
        </div>

        <button
          onClick={() => setCreateHrOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs sm:text-sm shadow-md"
        >
          <UserPlus className="w-4 h-4" /> Provision HR Account
        </button>
      </div>

      {/* Users table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-4">Account Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Linked Employee</th>
                <th className="p-4">Last Login</th>
                <th className="p-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-4 font-semibold text-slate-900 dark:text-white">
                    {u.email}
                    {u.mustChangePassword && (
                      <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        Pending Password Change
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">
                    {u.employeeId ? `${u.employeeId.firstName} ${u.employeeId.lastName} (${u.employeeId.employeeCode})` : 'System User'}
                  </td>
                  <td className="p-4 text-slate-400">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never logged in'}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setTempPassword('Welcome@2026');
                        setResetModalOpen(true);
                      }}
                      className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg"
                      title="Reset Password"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`p-1.5 rounded-lg ${
                          u.status === 'active'
                            ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                            : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                        title={u.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision HR Modal */}
      {createHrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Provision New HR Login
              </h3>
              <button onClick={() => setCreateHrOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHr} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1">HR Email Address</label>
                <input
                  type="email"
                  required
                  value={hrEmail}
                  onChange={(e) => setHrEmail(e.target.value)}
                  placeholder="hr.officer@company.com"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={hrPassword}
                  onChange={(e) => setHrPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateHrOpen(false)}
                  className="px-4 py-2 border rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create HR Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Reset Password for {selectedUser.email}
              </h3>
              <button onClick={() => setResetModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs sm:text-sm">
              <p className="text-xs text-slate-500">
                Setting a temporary password will flag this account with mandatory password change upon next login.
              </p>

              <div>
                <label className="block font-semibold mb-1">New Temporary Password</label>
                <input
                  type="text"
                  required
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="px-4 py-2 border rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl disabled:opacity-50"
                >
                  {resetting ? 'Resetting...' : 'Set Temporary Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
