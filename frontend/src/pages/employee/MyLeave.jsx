import React, { useState, useEffect } from 'react';
import { PlaneTakeoff, Plus, Sparkles, X, AlertCircle, CheckCircle2, Loader2, Ban } from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import SmartLeaveModal from '../../components/SmartLeaveModal';

const MyLeave = () => {
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Manual Apply Modal
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: ''
  });
  const [calculatedDays, setCalculatedDays] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Smart Leave Modal
  const [smartLeaveOpen, setSmartLeaveOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bRes, rRes, ltRes] = await Promise.all([
        api.get('/leave/balances'),
        api.get('/leave'),
        api.get('/org/leave-types')
      ]);
      setBalances(bRes.data);
      setRequests(rRes.data);
      setLeaveTypes(ltRes.data);
      if (ltRes.data.length > 0 && !formData.leaveTypeId) {
        setFormData(prev => ({ ...prev, leaveTypeId: ltRes.data[0]._id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDateChange = async (start, end) => {
    setFormData(prev => ({ ...prev, startDate: start, endDate: end }));
    if (start && end && start <= end) {
      try {
        const res = await api.get(`/leave/calculate-days?startDate=${start}&endDate=${end}`);
        setCalculatedDays(res.data.workingDays);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.post('/leave/apply', formData);
      setApplyModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit leave application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this leave application?')) return;
    try {
      await api.patch(`/leave/${id}/cancel`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Cancellation failed');
    }
  };

  if (loading) return <LoadingSpinner text="Loading leave balances and history..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Leave Requests & Balances
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Apply for annual, sick, or casual leave, track approvals, and use the natural language Smart Leave Assistant
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSmartLeaveOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md"
          >
            <Sparkles className="w-4 h-4 text-amber-300" /> Smart Leave (AI)
          </button>
          <button
            onClick={() => {
              setError(null);
              setApplyModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white font-semibold text-xs sm:text-sm shadow-md"
          >
            <Plus className="w-4 h-4" /> Standard Form
          </button>
        </div>
      </div>

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {balances.map((b) => (
          <div key={b.leaveTypeId} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {b.leaveTypeName}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-3xl font-extrabold text-brand-600 dark:text-brand-400">
                {b.remainingDays}
              </h3>
              <span className="text-xs text-slate-400">/ {b.yearlyQuota} days</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between">
              <span>Used: {b.usedDays}d</span>
              <span>Pending: {b.pendingDays}d</span>
            </div>
          </div>
        ))}
      </div>

      {/* Requests History */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-500">
            My Application History
          </h2>
        </div>

        {requests.length === 0 ? (
          <EmptyState
            icon={PlaneTakeoff}
            title="No Leave History"
            description="You have not submitted any leave requests this year."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-4">Leave Type</th>
                  <th className="p-4">Period</th>
                  <th className="p-4">Working Days</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Cancel Application</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {requests.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">
                      {r.leaveTypeId?.name}
                    </td>
                    <td className="p-4 font-mono text-xs">
                      {r.startDate} → {r.endDate}
                    </td>
                    <td className="p-4 font-bold text-brand-600 dark:text-brand-400">
                      {r.workingDaysCount} working day{r.workingDaysCount > 1 ? 's' : ''}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={r.reason}>
                      {r.reason}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="p-4 text-right">
                      {(r.status === 'pending' || r.status === 'approved') && (
                        <button
                          onClick={() => handleCancelLeave(r._id)}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg inline-flex items-center gap-1"
                        >
                          <Ban className="w-3.5 h-3.5" /> Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Standard Apply Modal */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Apply for Time-Off
              </h3>
              <button onClick={() => setApplyModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleApplySubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1">Leave Policy Category</label>
                <select
                  value={formData.leaveTypeId}
                  onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                  required
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  {leaveTypes.map(lt => (
                    <option key={lt._id} value={lt._id}>{lt.name} (Quota: {lt.yearlyQuota < 0 ? 'Unlimited' : `${lt.yearlyQuota}d`})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => handleDateChange(e.target.value, formData.endDate)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => handleDateChange(formData.startDate, e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
                Deducted Working Days (excluding weekends & holidays): <strong className="text-brand-600 font-bold">{calculatedDays} day(s)</strong>
              </div>

              <div>
                <label className="block font-semibold mb-1">Reason for Leave</label>
                <textarea
                  rows={3}
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g. Attending family wedding"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
                  className="px-4 py-2 border rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Smart Leave Natural Language Modal */}
      <SmartLeaveModal
        isOpen={smartLeaveOpen}
        onClose={() => setSmartLeaveOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default MyLeave;
