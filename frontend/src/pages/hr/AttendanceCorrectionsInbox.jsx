import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';

const AttendanceCorrectionsInbox = () => {
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCorrection, setSelectedCorrection] = useState(null);
  const [reviewAction, setReviewAction] = useState('approved');
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCorrections = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendance/corrections/pending');
      setCorrections(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrections();
  }, []);

  const openReviewModal = (corr, action) => {
    setSelectedCorrection(corr);
    setReviewAction(action);
    setReviewComment('');
    setModalOpen(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/attendance/corrections/${selectedCorrection._id}/review`, {
        status: reviewAction,
        reviewComment
      });
      setModalOpen(false);
      fetchCorrections();
    } catch (err) {
      alert(err.response?.data?.message || 'Review failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Attendance Correction Requests
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review miss-punches and manual adjustment requests submitted by employees
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading correction requests..." />
        ) : corrections.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No Pending Correction Requests"
            description="All employee attendance adjustment requests have been reviewed."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-4">Employee</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Requested Timings</th>
                  <th className="p-4">Reason Given</th>
                  <th className="p-4">Submitted At</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {corrections.map((corr) => (
                  <tr key={corr._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {corr.employeeId?.firstName} {corr.employeeId?.lastName}
                        </span>
                        <p className="text-[11px] text-slate-400 font-mono">{corr.employeeId?.employeeCode}</p>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-200">
                      {corr.date}
                    </td>
                    <td className="p-4 font-mono">
                      {corr.requestedCheckIn} — {corr.requestedCheckOut}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={corr.reason}>
                      {corr.reason}
                    </td>
                    <td className="p-4 text-slate-400 text-xs">
                      {new Date(corr.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openReviewModal(corr, 'approved')}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-xl text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => openReviewModal(corr, 'rejected')}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 rounded-xl text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Dialog */}
      {modalOpen && selectedCorrection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white capitalize">
                {reviewAction} Attendance Correction
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1 mb-4">
              <p><strong>Employee:</strong> {selectedCorrection.employeeId?.firstName} {selectedCorrection.employeeId?.lastName}</p>
              <p><strong>Date:</strong> {selectedCorrection.date}</p>
              <p><strong>Requested:</strong> {selectedCorrection.requestedCheckIn} to {selectedCorrection.requestedCheckOut}</p>
              <p><strong>Reason:</strong> {selectedCorrection.reason}</p>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  HR Review Remarks
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="e.g. Verified with team lead, timings corrected."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2 text-white font-semibold rounded-xl text-xs flex items-center gap-2 ${
                    reviewAction === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Confirm {reviewAction.toUpperCase()}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceCorrectionsInbox;
