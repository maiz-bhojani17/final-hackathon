import React, { useState, useEffect } from 'react';
import { CalendarCheck, Calendar, Filter, AlertTriangle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';

const DailyAttendanceBoard = () => {
  const [targetDate, setTargetDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [boardData, setBoardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchBoard = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/attendance/board?date=${targetDate}`);
      setBoardData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard();
  }, [targetDate]);

  const summary = boardData?.summary || {};
  const board = boardData?.board || [];
  const filteredBoard = statusFilter
    ? board.filter(b => b.status === statusFilter)
    : board;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Daily Attendance Board
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time daily roster, time stamps, half-day checks, and anomaly flags
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-brand-600" />
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => setStatusFilter('')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === '' ? 'bg-brand-50 border-brand-300 dark:bg-brand-950/40' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{summary.total ?? 0}</p>
        </div>

        <div
          onClick={() => setStatusFilter('present')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'present' ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Present</span>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{summary.present ?? 0}</p>
        </div>

        <div
          onClick={() => setStatusFilter('late')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'late' ? 'bg-amber-50 border-amber-300 dark:bg-amber-950/40' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Late</span>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{summary.late ?? 0}</p>
        </div>

        <div
          onClick={() => setStatusFilter('half_day')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'half_day' ? 'bg-purple-50 border-purple-300 dark:bg-purple-950/40' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Half Day</span>
          <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-0.5">{summary.halfDay ?? 0}</p>
        </div>

        <div
          onClick={() => setStatusFilter('on_leave')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'on_leave' ? 'bg-blue-50 border-blue-300 dark:bg-blue-950/40' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">On Leave</span>
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">{summary.onLeave ?? 0}</p>
        </div>

        <div
          onClick={() => setStatusFilter('absent')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'absent' ? 'bg-rose-50 border-rose-300 dark:bg-rose-950/40' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Absent</span>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">{summary.absent ?? 0}</p>
        </div>
      </div>

      {/* Board Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading daily attendance records..." />
        ) : filteredBoard.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No employee records match the selected status filter for {targetDate}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-4">Employee</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Check In</th>
                  <th className="p-4">Check Out</th>
                  <th className="p-4">Worked Hours</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Anomalies / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredBoard.map((row) => (
                  <tr key={row.employee.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {row.employee.fullName}
                        </span>
                        <p className="text-[11px] font-mono text-slate-400">{row.employee.employeeCode}</p>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      {row.employee.department}
                    </td>
                    <td className="p-4 font-mono">
                      {row.checkInTime ? new Date(row.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="p-4 font-mono">
                      {row.checkOutTime ? new Date(row.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-200">
                      {row.totalHours > 0 ? `${row.totalHours} hrs` : '—'}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="p-4 text-right">
                      {row.anomaly && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Timing Anomaly
                        </span>
                      )}
                      {row.leaveInfo && (
                        <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                          {row.leaveInfo.type} ({row.leaveInfo.reason})
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
    </div>
  );
};

export default DailyAttendanceBoard;
