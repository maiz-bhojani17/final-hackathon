import React, { useState, useEffect } from 'react';
import { Banknote, Lock, Plus, Download, Eye, CheckCircle2, AlertCircle, FileText, Loader2, Sparkles } from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';

const PayrollManagement = () => {
  const { user } = useAuth();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loadingPayslips, setLoadingPayslips] = useState(false);

  // New Draft Modal
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [targetMonth, setTargetMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [generating, setGenerating] = useState(false);
  const [draftError, setDraftError] = useState(null);

  // Finalizing State
  const [finalizing, setFinalizing] = useState(false);

  const fetchRuns = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payroll/runs');
      setRuns(res.data);
      if (res.data.length > 0 && !selectedRun) {
        selectRun(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const selectRun = async (run) => {
    setSelectedRun(run);
    try {
      setLoadingPayslips(true);
      const res = await api.get(`/payroll/runs/${run._id}/payslips`);
      setPayslips(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPayslips(false);
    }
  };

  const handleGenerateDraft = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setDraftError(null);
    try {
      const res = await api.post('/payroll/draft', { month: targetMonth });
      setDraftModalOpen(false);
      await fetchRuns();
      if (res.data.payrollRun) {
        selectRun(res.data.payrollRun);
      }
    } catch (err) {
      setDraftError(err.response?.data?.message || 'Failed to generate payroll draft');
    } finally {
      setGenerating(false);
    }
  };

  const handleFinalize = async (runId) => {
    if (!window.confirm('Are you sure you want to finalize this payroll run? This will PERMANENTLY LOCK all salaries and generate confidential payslips for employees.')) {
      return;
    }

    setFinalizing(true);
    try {
      const res = await api.patch(`/payroll/runs/${runId}/finalize`);
      setSelectedRun(res.data);
      fetchRuns();
      selectRun(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Finalization failed');
    } finally {
      setFinalizing(false);
    }
  };

  const handleDownloadPdf = async (payslipId, empCode, month) => {
    try {
      const res = await api.get(`/payroll/payslips/${payslipId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip_${empCode}_${month}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download PDF payslip');
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Payroll Processing & Monthly Runs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            HR drafts monthly runs with automatic tax slab and attendance deductions. Admin locks and finalizes.
          </p>
        </div>

        <button
          onClick={() => setDraftModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm shadow-md"
        >
          <Plus className="w-4 h-4" /> Generate Monthly Draft
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading payroll history..." />
      ) : runs.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title="No Payroll Runs Created"
          description="Click 'Generate Monthly Draft' to compute attendance, tax slabs, and salaries for any month."
          action={
            <button
              onClick={() => setDraftModalOpen(true)}
              className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
            >
              Generate First Draft
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Runs Sidebar List */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-2">
              Monthly Run Batches
            </h3>
            {runs.map((r) => {
              const isSelected = selectedRun?._id === r._id;
              return (
                <div
                  key={r._id}
                  onClick={() => selectRun(r)}
                  className={`p-3.5 rounded-2xl cursor-pointer border transition-all ${
                    isSelected
                      ? 'bg-brand-50 border-brand-300 dark:bg-brand-950/40 dark:border-brand-800'
                      : 'bg-slate-50/50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {r.month}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{r.totalEmployees} employees</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      PKR {r.totalNet?.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Run Details & Payslips Table */}
          <div className="lg:col-span-3 space-y-6">
            {selectedRun && (
              <>
                {/* Summary Banner */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                          Payroll Breakdown: {selectedRun.month}
                        </h2>
                        <StatusBadge status={selectedRun.status} />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Total working days in month (skipping weekends & holidays): <strong className="text-slate-700 dark:text-slate-300">{selectedRun.workingDays} days</strong>
                      </p>
                    </div>

                    {/* Finalize Button (Admin Only) */}
                    {selectedRun.status === 'draft' ? (
                      isAdmin ? (
                        <button
                          onClick={() => handleFinalize(selectedRun._id)}
                          disabled={finalizing}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md disabled:opacity-50"
                        >
                          <Lock className="w-4 h-4" />
                          {finalizing ? 'Finalizing...' : 'Admin: Finalize & Lock Month'}
                        </button>
                      ) : (
                        <span className="text-xs px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
                          HR Draft • Awaiting Admin Finalization
                        </span>
                      )
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <Lock className="w-4 h-4" /> Finalized & Locked
                      </span>
                    )}
                  </div>

                  {/* Summary Metric Counters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Gross</span>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">PKR {selectedRun.totalGross?.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Deductions</span>
                      <p className="text-lg font-bold text-rose-500">PKR {selectedRun.totalDeductions?.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Income Tax</span>
                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400">PKR {selectedRun.totalTax?.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Net Payout</span>
                      <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">PKR {selectedRun.totalNet?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Payslips Table */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                      Employee Calculated Payslips ({payslips.length})
                    </h3>
                  </div>

                  {loadingPayslips ? (
                    <LoadingSpinner text="Loading employee calculations..." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                          <tr>
                            <th className="p-3">Employee</th>
                            <th className="p-3">Basic</th>
                            <th className="p-3">Gross</th>
                            <th className="p-3">Abs / Unpaid</th>
                            <th className="p-3">Half / Lates</th>
                            <th className="p-3">Tax</th>
                            <th className="p-3">Net Pay</th>
                            <th className="p-3 text-right">PDF</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {payslips.map((ps) => (
                            <tr key={ps._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                              <td className="p-3 font-semibold text-slate-900 dark:text-white">
                                {ps.employeeId?.firstName} {ps.employeeId?.lastName}
                                <span className="block text-[10px] text-slate-400 font-mono">{ps.employeeId?.employeeCode}</span>
                              </td>
                              <td className="p-3">PKR {ps.basicSalary?.toLocaleString()}</td>
                              <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                                PKR {ps.grossSalary?.toLocaleString()}
                              </td>
                              <td className="p-3 text-rose-500">
                                {ps.absentDays + ps.unpaidLeaveDays} days
                                <span className="block text-[10px] text-slate-400">(-PKR {(ps.deductions?.absentDeduction + ps.deductions?.unpaidLeaveDeduction)?.toLocaleString()})</span>
                              </td>
                              <td className="p-3 text-amber-600">
                                {ps.halfDays} half / {ps.lateCount} lates
                                {ps.deductions?.latePenaltyDeduction > 0 && (
                                  <span className="block text-[10px] text-rose-500 font-semibold">Late pen: -PKR {ps.deductions.latePenaltyDeduction}</span>
                                )}
                              </td>
                              <td className="p-3 font-mono text-purple-600 dark:text-purple-400">
                                PKR {ps.deductions?.incomeTax?.toLocaleString()}
                              </td>
                              <td className="p-3 font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                                PKR {ps.netSalary?.toLocaleString()}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => handleDownloadPdf(ps._id, ps.employeeId?.employeeCode, ps.month)}
                                  className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-sm"
                                  title="Download confidential payslip PDF"
                                >
                                  <Download className="w-3.5 h-3.5" /> PDF
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Generate Draft Modal */}
      {draftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Generate Monthly Payroll Draft
              </h3>
              <button onClick={() => setDraftModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                X
              </button>
            </div>

            {draftError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{draftError}</span>
              </div>
            )}

            <form onSubmit={handleGenerateDraft} className="space-y-4 text-xs sm:text-sm">
              <p className="text-xs text-slate-500 leading-relaxed">
                Computes working days excluding weekends and public holidays, checks absent days and unpaid leave deductions, applies tax slabs, and prorates mid-month joiners.
              </p>

              <div>
                <label className="block font-semibold mb-1">Target Pay Period (YYYY-MM)</label>
                <input
                  type="month"
                  required
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-sm"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDraftModalOpen(false)}
                  className="px-4 py-2 border rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl flex items-center gap-2 disabled:opacity-50"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Calculate & Generate Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollManagement;
