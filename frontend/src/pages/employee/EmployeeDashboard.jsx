import React, { useState, useEffect } from 'react';
import {
  Clock,
  CalendarCheck,
  PlaneTakeoff,
  Banknote,
  Sparkles,
  Camera,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  Megaphone,
  Loader2
} from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import CameraAttendanceModal from '../../components/CameraAttendanceModal';
import SmartLeaveModal from '../../components/SmartLeaveModal';
import { useAuth } from '../../context/AuthContext';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [clockMsg, setClockMsg] = useState(null);

  // Modals
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [smartLeaveOpen, setSmartLeaveOpen] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [mRes, aRes] = await Promise.all([
        api.get('/dashboard/employee'),
        api.get('/comms/announcements')
      ]);
      setMetrics(mRes.data);
      setAnnouncements(aRes.data.slice(0, 3));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleWebCheckIn = async () => {
    setActionLoading(true);
    setClockMsg(null);
    try {
      const res = await api.post('/attendance/check-in', { checkInSource: 'web' });
      setClockMsg({ type: 'success', text: `Checked in successfully! Status: ${res.data.status.toUpperCase()}` });
      fetchDashboard();
    } catch (err) {
      setClockMsg({ type: 'error', text: err.response?.data?.message || 'Check-in failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleWebCheckOut = async () => {
    setActionLoading(true);
    setClockMsg(null);
    try {
      const res = await api.post('/attendance/check-out');
      setClockMsg({ type: 'success', text: `Checked out successfully! Total Hours: ${res.data.totalHours} hrs` });
      fetchDashboard();
    } catch (err) {
      setClockMsg({ type: 'error', text: err.response?.data?.message || 'Check-out failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadLastPayslip = async (payslipId, month) => {
    try {
      const res = await api.get(`/payroll/payslips/${payslipId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip_${month}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download payslip PDF');
    }
  };

  if (loading && !metrics) return <LoadingSpinner text="Loading self-service workspace..." />;

  const isCheckedIn = metrics?.todayStatus && metrics.todayStatus !== 'not_checked_in' && metrics.todayStatus !== 'absent';
  const isCheckedOut = metrics?.checkOutTime != null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E1E4D9] dark:border-[#384238]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#252A24] dark:text-[#EEF1E9]">
            Welcome back, {user?.employee?.firstName || 'Colleague'}
          </h1>
          <p className="text-xs text-[#697064] dark:text-[#B1B9AC] mt-0.5">
            Today is {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <button
          onClick={() => setSmartLeaveOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#29372D] hover:bg-[#1e2720] text-[#F5F3EB] dark:bg-[#A3B18A] dark:hover:bg-[#8A9A71] dark:text-[#171C18] font-medium text-xs shadow-none transition-colors shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Apply Leave (AI)</span>
        </button>
      </div>

      {clockMsg && (
        <div className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
          clockMsg.type === 'success'
            ? 'bg-[#477A57]/10 text-[#477A57] dark:text-[#5E9E72] border-[#477A57]/30'
            : 'bg-[#B64D45]/10 text-[#B64D45] dark:text-[#D2635B] border-[#B64D45]/30'
        }`}>
          {clockMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-[#477A57]" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-[#B64D45]" />}
          <span>{clockMsg.text}</span>
        </div>
      )}

      {/* Main Grid: Clock In Widget & Weekly Progress & Payslip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Clock In / Out Card */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#222922] border border-[#E1E4D9] dark:border-[#384238] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#697064] dark:text-[#B1B9AC]">
                Today's Attendance
              </span>
              <StatusBadge status={metrics?.todayStatus || 'not_checked_in'} />
            </div>

            <div className="py-2 space-y-1.5 text-xs text-[#697064] dark:text-[#B1B9AC] border-t border-[#E1E4D9] dark:border-[#384238]">
              <div className="flex justify-between">
                <span>Check In:</span>
                <span className="font-mono font-medium text-[#252A24] dark:text-[#EEF1E9]">
                  {metrics?.checkInTime ? new Date(metrics.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Check Out:</span>
                <span className="font-mono font-medium text-[#252A24] dark:text-[#EEF1E9]">
                  {metrics?.checkOutTime ? new Date(metrics.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E1E4D9] dark:border-[#384238]">
            {!isCheckedIn ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleWebCheckIn}
                  disabled={actionLoading}
                  className="w-full py-2 rounded-lg bg-[#29372D] hover:bg-[#1e2720] text-[#F5F3EB] dark:bg-[#A3B18A] dark:hover:bg-[#8A9A71] dark:text-[#171C18] font-medium text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors shadow-none"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                  Web Check-In
                </button>
                <button
                  onClick={() => setCameraModalOpen(true)}
                  className="w-full py-2 rounded-lg bg-[#EDEFE6] hover:bg-[#E1E7D8] text-[#29372D] dark:bg-[#303A30] dark:hover:bg-[#394539] dark:text-[#EEF1E9] border border-[#E1E4D9] dark:border-[#384238] font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-none"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Camera Clock
                </button>
              </div>
            ) : !isCheckedOut ? (
              <button
                onClick={handleWebCheckOut}
                disabled={actionLoading}
                className="w-full py-2 rounded-lg bg-[#A87535] hover:bg-[#8f632b] text-white font-medium text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors shadow-none"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                Check Out
              </button>
            ) : (
              <div className="p-2 rounded-lg bg-[#477A57]/10 text-[#477A57] dark:text-[#5E9E72] text-xs text-center border border-[#477A57]/30 font-medium">
                Day completed. Check-out recorded.
              </div>
            )}
          </div>
        </div>

        {/* Weekly Hours Progress */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#222922] border border-[#E1E4D9] dark:border-[#384238] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#697064] dark:text-[#B1B9AC]">
                Hours This Week
              </span>
              <span className="text-xs text-[#858A80] dark:text-[#929D8D] font-mono">Target: 40h</span>
            </div>

            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold font-mono tracking-tight text-[#252A24] dark:text-[#EEF1E9]">
                {metrics?.hoursThisWeek ?? 0}
              </span>
              <span className="text-xs text-[#858A80] dark:text-[#929D8D]">hours</span>
            </div>

            {/* Clean Progress bar */}
            <div className="w-full h-2 bg-[#EDEFE6] dark:bg-[#1B211C] rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-[#626F47] dark:bg-[#A3B18A] rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, ((metrics?.hoursThisWeek || 0) / 40) * 100)}%` }}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#E1E4D9] dark:border-[#384238] flex items-center justify-between text-xs text-[#697064] dark:text-[#B1B9AC]">
            <span>Late check-ins this month:</span>
            <span className={`font-mono font-medium ${metrics?.lateCountThisMonth > 0 ? 'text-[#A87535] dark:text-[#C68E48]' : 'text-[#252A24] dark:text-[#EEF1E9]'}`}>
              {metrics?.lateCountThisMonth ?? 0}
            </span>
          </div>
        </div>

        {/* Last Payslip Card */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#222922] border border-[#E1E4D9] dark:border-[#384238] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#697064] dark:text-[#B1B9AC]">
                Latest Finalized Salary
              </span>
              <Banknote className="w-4 h-4 text-[#858A80] dark:text-[#929D8D]" />
            </div>

            {metrics?.lastPayslip ? (
              <div className="mt-1">
                <span className="text-xs text-[#858A80] dark:text-[#929D8D]">Period: {metrics.lastPayslip.month}</span>
                <div className="text-xl font-bold font-mono text-[#477A57] dark:text-[#5E9E72] mt-0.5">
                  PKR {metrics.lastPayslip.netSalary?.toLocaleString()}
                </div>
                <span className="text-[11px] text-[#697064] dark:text-[#B1B9AC]">Gross: PKR {metrics.lastPayslip.grossSalary?.toLocaleString()}</span>
              </div>
            ) : (
              <p className="text-xs text-[#858A80] dark:text-[#929D8D] mt-2">No finalized payslip available yet.</p>
            )}
          </div>

          {metrics?.lastPayslip && (
            <div className="pt-3 border-t border-[#E1E4D9] dark:border-[#384238]">
              <button
                onClick={() => handleDownloadLastPayslip(metrics.lastPayslip.id, metrics.lastPayslip.month)}
                className="w-full py-1.5 rounded-lg border border-[#E1E4D9] dark:border-[#384238] hover:bg-[#E8EBE0] dark:hover:bg-[#2C352C] text-[#252A24] dark:text-[#EEF1E9] font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Payslip PDF</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Leave Balances Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#697064] dark:text-[#B1B9AC]">
          Leave Quotas & Balances
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {metrics?.leaveSummary?.map((l) => (
            <div key={l.code} className="p-3.5 rounded-xl bg-white dark:bg-[#222922] border border-[#E1E4D9] dark:border-[#384238] shadow-sm">
              <span className="text-xs font-medium text-[#697064] dark:text-[#B1B9AC] block truncate">
                {l.name}
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold font-mono text-[#29372D] dark:text-[#A3B18A]">
                  {l.remaining}
                </span>
                <span className="text-xs text-[#858A80] dark:text-[#929D8D]">/ {l.quota} days</span>
              </div>
              <span className="text-[11px] text-[#858A80] dark:text-[#929D8D] mt-1 block">Used: {l.used}d</span>
            </div>
          ))}
        </div>
      </div>

      {/* Announcements Stream */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#222922] border border-[#E1E4D9] dark:border-[#384238] shadow-sm">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#E1E4D9] dark:border-[#384238]">
          <Megaphone className="w-4 h-4 text-[#858A80] dark:text-[#929D8D]" />
          <h2 className="font-semibold text-xs text-[#252A24] dark:text-[#EEF1E9]">
            Company Bulletins
          </h2>
        </div>

        {announcements.length === 0 ? (
          <p className="text-xs text-[#858A80] dark:text-[#929D8D] py-3 text-center">No company broadcasts at this time.</p>
        ) : (
          <div className="divide-y divide-[#E1E4D9] dark:divide-[#384238]">
            {announcements.map((item) => (
              <div key={item._id} className="py-2.5 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-[#252A24] dark:text-[#EEF1E9]">{item.title}</span>
                  <span className="text-[10px] text-[#858A80] dark:text-[#929D8D] font-mono">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-[#697064] dark:text-[#B1B9AC] leading-relaxed text-xs">{item.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Camera Attendance Modal */}
      <CameraAttendanceModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onSuccess={() => {
          fetchDashboard();
          setClockMsg({ type: 'success', text: 'Biometric face and GPS geofence verified! Checked in successfully.' });
        }}
      />

      {/* Smart Leave Modal */}
      <SmartLeaveModal
        isOpen={smartLeaveOpen}
        onClose={() => setSmartLeaveOpen(false)}
        onSuccess={() => {
          fetchDashboard();
          setClockMsg({ type: 'success', text: 'Smart leave application submitted for HR review!' });
        }}
      />
    </div>
  );
};

export default EmployeeDashboard;
