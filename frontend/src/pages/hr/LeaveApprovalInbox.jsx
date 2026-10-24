import React, { useState, useEffect } from 'react';
import { PlaneTakeoff, CheckCircle2, XCircle, Calendar, MessageSquare, AlertCircle, X, Loader2 } from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';

const LeaveApprovalInbox = () => {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [reviewAction, setReviewAction] = useState('approved');
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/leave?status=${statusFilter}`);
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleOpenReview = (req, action) => {
    setSelectedReq(req);
    setReviewAction(action);
    setReviewComment('');
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/leave/${selectedReq._id}/review`, {
        status: reviewAction,
        reviewComment
      });
      setReviewModalOpen(false);
      fetchRequests();
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
            Leave Requests & Approvals
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review employee time-off applications, verify working day deductions, and approve or reject with comments
          </p>
        </div>

        <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {['pending', 'approved', 'rejected', ''].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                statusFilter === st
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {st || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Fetching leave applications..." />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={PlaneTakeoff}
            title={`No ${statusFilter} leave requests`}
            description="When employees submit leave applications, they will appear here for management approval."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-4">Employee</th>
                  <th className="p-4">Leave Policy</th>
                  <th className="p-4">Dates</th>
                  <th className="p-4">Working Days</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {req.employeeId?.firstName} {req.employeeId?.lastName}
                        </span>
                        <p className="text-[11px] text-slate-400">{req.employeeId?.departmentId?.name}</p>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                      {req.leaveTypeId?.name}
                    </td>
                    <td className="p-4 font-mono text-xs">
                      {req.startDate} → {req.endDate}
                    </td>
                    <td className="p-4 font-bold text-brand-600 dark:text-brand-400">
                      {req.workingDaysCount} working day{req.workingDaysCount > 1 ? 's' : ''}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={req.reason}>
                      {req.reason}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="p-4 text-right">
                      {req.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenReview(req, 'approved')}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-xl text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleOpenReview(req, 'rejected')}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 rounded-xl text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          {req.reviewComment ? `"${req.reviewComment}"` : 'Decided'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Dialog Modal */}
      {reviewModalOpen && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white capitalize">
                {reviewAction} Leave Request
              </h3>
              <button onClick={() => setReviewModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1 mb-4">
              <p><strong>Employee:</strong> {selectedReq.employeeId?.firstName} {selectedReq.employeeId?.lastName}</p>
              <p><strong>Period:</strong> {selectedReq.startDate} to {selectedReq.endDate} ({selectedReq.workingDaysCount} days)</p>
              <p><strong>Reason:</strong> {selectedReq.reason}</p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Review Comment / Remarks
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="e.g. Approved. Please ensure handoff of open tasks."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
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

export default LeaveApprovalInbox;
