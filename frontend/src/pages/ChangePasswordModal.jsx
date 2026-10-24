import React, { useState } from 'react';
import { KeyRound, Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ChangePasswordModal = ({ isOpen }) => {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password. Please check your current password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171C18]/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-[#222922] rounded-xl shadow-modal border border-[#E1E4D9] dark:border-[#384238] p-6 sm:p-7">
        <div className="w-10 h-10 rounded-lg bg-[#EDEFE6] dark:bg-[#303A30] text-[#626F47] dark:text-[#A3B18A] flex items-center justify-center mb-3">
          <KeyRound className="w-5 h-5" />
        </div>

        <h3 className="text-lg font-bold text-[#252A24] dark:text-[#EEF1E9] mb-1">
          Change Temporary Password
        </h3>
        <p className="text-xs text-[#697064] dark:text-[#B1B9AC] mb-5 leading-relaxed">
          For your account security, you must update your temporary initial password before continuing to HCM Lite.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-[#B64D45]/10 border border-[#B64D45]/30 rounded-lg text-xs text-[#B64D45] dark:text-[#D2635B] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#252A24] dark:text-[#EEF1E9] mb-1">
              Current Temporary Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#858A80] dark:text-[#929D8D] absolute left-3.5 top-3" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#F5F3EB]/50 dark:bg-[#1B211C] border border-[#E1E4D9] dark:border-[#384238] text-xs text-[#252A24] dark:text-[#EEF1E9] focus:outline-none focus:ring-1 focus:ring-[#75866A]"
                placeholder="Enter current password"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#252A24] dark:text-[#EEF1E9] mb-1">
              New Password (min 6 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#858A80] dark:text-[#929D8D] absolute left-3.5 top-3" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#F5F3EB]/50 dark:bg-[#1B211C] border border-[#E1E4D9] dark:border-[#384238] text-xs text-[#252A24] dark:text-[#EEF1E9] focus:outline-none focus:ring-1 focus:ring-[#75866A]"
                placeholder="Create new password"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#252A24] dark:text-[#EEF1E9] mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#858A80] dark:text-[#929D8D] absolute left-3.5 top-3" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#F5F3EB]/50 dark:bg-[#1B211C] border border-[#E1E4D9] dark:border-[#384238] text-xs text-[#252A24] dark:text-[#EEF1E9] focus:outline-none focus:ring-1 focus:ring-[#75866A]"
                placeholder="Re-enter new password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-2.5 bg-[#29372D] hover:bg-[#1e2720] text-[#F5F3EB] dark:bg-[#A3B18A] dark:hover:bg-[#8A9A71] dark:text-[#171C18] disabled:opacity-50 rounded-lg text-xs font-semibold shadow-none flex items-center justify-center gap-2 transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Save & Continue to App
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
