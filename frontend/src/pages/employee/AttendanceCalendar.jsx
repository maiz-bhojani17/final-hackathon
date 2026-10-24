import React, { useState, useEffect } from 'react';
import { CalendarCheck, ChevronLeft, ChevronRight, Clock, Plus, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';

const AttendanceCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [records, setRecords] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Correction Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reqCheckIn, setReqCheckIn] = useState('09:00');
  const [reqCheckOut, setReqCheckOut] = useState('18:00');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  const fetchCalendar = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/attendance/calendar?month=${currentMonth}`);
      setRecords(res.data.records);
      setLeaves(res.data.leaves);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [currentMonth]);

  const handlePrevMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    setCurrentMonth(d.toISOString().substring(0, 7));
  };

  const handleNextMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const d = new Date(y, m, 1);
    setCurrentMonth(d.toISOString().substring(0, 7));
  };

  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);
    try {
      await api.post('/attendance/corrections', {
        date: formDate,
        requestedCheckIn: reqCheckIn,
        requestedCheckOut: reqCheckOut,
        reason
      });
      setMsg({ type: 'success', text: 'Correction request submitted for HR approval!' });
      setReason('');
      setTimeout(() => setModalOpen(false), 1500);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit correction request' });
    } finally {
      setSubmitting(false);
    }
  };

  // Generate calendar days
  const [yearNum, monthNum] = currentMonth.split('-').map(Number);
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const firstDayOfWeek = new Date(yearNum, monthNum - 1, 1).getDay(); // 0 = Sun

  const attendanceMap = new Map();
  records.forEach(r => attendanceMap.set(r.date, r));

  const leaveMap = new Map();
  leaves.forEach(l => {
    const cur = new Date(l.startDate);
    const end = new Date(l.endDate);
    while (cur <= end) {
      leaveMap.set(cur.toISOString().split('T')[0], l);
      cur.setDate(cur.getDate() + 1);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Attendance Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review daily check-in times, worked hours, and submit attendance correction requests
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-700 dark:text-slate-200">
              {new Date(yearNum, monthNum - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={handleNextMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <button
            onClick={() => {
              setMsg(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm shadow-md"
          >
            <Plus className="w-4 h-4" /> Request Correction
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Rendering calendar events..." />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-4 sm:p-6 overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty offset padding cells */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`offset-${i}`} className="min-h-24 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 opacity-50" />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
              const att = attendanceMap.get(dateStr);
              const leave = leaveMap.get(dateStr);
              const isWeekend = new Date(yearNum, monthNum - 1, day).getDay() === 0 || new Date(yearNum, monthNum - 1, day).getDay() === 6;

              return (
                <div
                  key={dateStr}
                  className={`min-h-24 p-2 sm:p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                    att
                      ? 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                      : isWeekend
                      ? 'bg-slate-50 dark:bg-slate-950/40 border-slate-100 dark:border-slate-800/50'
                      : 'bg-slate-50/70 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isWeekend ? 'text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {day}
                    </span>
                    {att && <StatusBadge status={att.status} className="scale-90 origin-right" />}
                    {leave && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">Leave</span>}
                  </div>

                  <div className="text-[10px] space-y-0.5 mt-2">
                    {att?.checkInTime && (
                      <p className="text-slate-500 font-mono">
                        In: {new Date(att.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                    {att?.checkOutTime && (
                      <p className="text-slate-500 font-mono">
                        Out: {new Date(att.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                    {att?.totalHours > 0 && (
                      <p className="font-semibold text-brand-600 dark:text-brand-400">
                        {att.totalHours} hrs
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Correction Request Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Request Attendance Correction
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {msg && (
              <div className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{msg.text}</span>
              </div>
            )}

            <form onSubmit={handleCorrectionSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1">Target Date</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Correct Check-In</label>
                  <input
                    type="time"
                    required
                    value={reqCheckIn}
                    onChange={(e) => setReqCheckIn(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Correct Check-Out</label>
                  <input
                    type="time"
                    required
                    value={reqCheckOut}
                    onChange={(e) => setReqCheckOut(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Reason for Adjustment</label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Forgot to punch out due to on-site client visit"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
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
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceCalendar;
