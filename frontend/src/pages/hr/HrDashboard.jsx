import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Clock,
  PlaneTakeoff,
  AlertCircle,
  TrendingUp,
  Sparkles,
  BarChart2,
  Calendar,
  Filter
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';

const COLORS = ['#29372D', '#A3B18A', '#626F47', '#75866A', '#A87535'];

const HrDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [loading, setLoading] = useState(true);

  // AI Summary
  const [aiSummary, setAiSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const url = selectedDept
        ? `/dashboard/hr?departmentId=${selectedDept}`
        : '/dashboard/hr';
      const res = await api.get(url);
      setMetrics(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/org/departments').then(res => setDepartments(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [selectedDept]);

  const handleGenerateAiSummary = async () => {
    if (!metrics?.kpi) return;
    setSummarizing(true);
    try {
      const res = await api.post('/ai/summarize', { kpis: metrics.kpi });
      setAiSummary(res.data.bullets);
    } catch (err) {
      console.error(err);
    } finally {
      setSummarizing(false);
    }
  };

  if (loading && !metrics) return <LoadingSpinner text="Computing operational HR metrics..." />;

  const kpi = metrics?.kpi || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E1E4D9] dark:border-[#384238]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#252A24] dark:text-[#EEF1E9]">
            People Operations
          </h1>
          <p className="text-xs text-[#697064] dark:text-[#B1B9AC] mt-0.5">
            Daily attendance status, leave utilization, absenteeism, and operational approvals
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#222922] border border-[#E1E4D9] dark:border-[#384238] rounded-lg px-2.5 py-1.5 shadow-none text-xs">
            <Filter className="w-3.5 h-3.5 text-[#858A80] dark:text-[#929D8D]" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent text-xs font-medium text-[#252A24] dark:text-[#EEF1E9] focus:outline-none"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerateAiSummary}
            disabled={summarizing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#29372D] hover:bg-[#1e2720] text-[#F5F3EB] dark:bg-[#A3B18A] dark:hover:bg-[#8A9A71] dark:text-[#171C18] text-xs font-medium transition-colors disabled:opacity-50 shadow-none"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{summarizing ? 'Analyzing...' : 'AI Summary'}</span>
          </button>
        </div>
      </div>

      {/* AI HR Summary */}
      {aiSummary && (
        <div className="p-4 rounded-xl bg-[#EDEFE6] dark:bg-[#222922] border-l-4 border-[#626F47] dark:border-[#A3B18A] border-y border-r border-[#E1E4D9] dark:border-[#384238]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#626F47] dark:text-[#A3B18A]" />
              <h2 className="font-semibold text-xs text-[#252A24] dark:text-[#EEF1E9]">
                HR Intelligence (Gemini AI)
              </h2>
            </div>
            <span className="text-[10px] text-[#626F47] dark:text-[#A3B18A] font-mono">
              Live Insights
            </span>
          </div>

          <ul className="space-y-1.5 text-xs text-[#252A24] dark:text-[#EEF1E9]">
            {aiSummary.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-[#626F47] dark:text-[#A3B18A] font-bold leading-none mt-1">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Headcount */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#222922] border border-[#E1E4D9] dark:border-[#384238] shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-[#697064] dark:text-[#B1B9AC]">Headcount</span>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#252A24] dark:text-[#EEF1E9]">
              {kpi.headcount ?? 0}
            </span>
            <p className="text-[11px] text-[#858A80] dark:text-[#929D8D] mt-0.5">Active Staff</p>
          </div>
        </div>

        {/* Present Today */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#222922] border border-[#E1E4D9] dark:border-[#384238] shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-[#697064] dark:text-[#B1B9AC]">Present Today</span>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#477A57] dark:text-[#5E9E72]">
              {kpi.presentToday ?? 0}
            </span>
            <p className="text-[11px] text-[#858A80] dark:text-[#929D8D] mt-0.5">On Time</p>
          </div>
        </div>

        {/* Late Today */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#222922] border border-[#E1E4D9] dark:border-[#384238] shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-[#697064] dark:text-[#B1B9AC]">Late Today</span>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#A87535] dark:text-[#C68E48]">
              {kpi.lateToday ?? 0}
            </span>
            <p className="text-[11px] text-[#858A80] dark:text-[#929D8D] mt-0.5">After 09:15 AM</p>
          </div>
        </div>

        {/* On Leave Today */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#222922] border border-[#E1E4D9] dark:border-[#384238] shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-[#697064] dark:text-[#B1B9AC]">On Leave</span>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#597C91] dark:text-[#6F96AE]">
              {kpi.onLeaveToday ?? 0}
            </span>
            <p className="text-[11px] text-[#858A80] dark:text-[#929D8D] mt-0.5">Approved</p>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#222922] border border-[#E1E4D9] dark:border-[#384238] shadow-sm col-span-2 lg:col-span-1 flex flex-col justify-between">
          <span className="text-xs font-medium text-[#697064] dark:text-[#B1B9AC]">Pending Actions</span>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#626F47] dark:text-[#A3B18A]">
              {kpi.pendingApprovals ?? 0}
            </span>
            <p className="text-[11px] text-[#858A80] dark:text-[#929D8D] mt-0.5">Leaves & Clock</p>
          </div>
        </div>
      </div>

      {/* Attendance Trend & Leave Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attendance Trend (Last 7 Days) */}
        <div className="lg:col-span-2 p-4 rounded-xl bg-white dark:bg-[#222922] border border-[#E1E4D9] dark:border-[#384238] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-xs text-[#252A24] dark:text-[#EEF1E9]">
                7-Day Attendance Trend
              </h2>
              <p className="text-[11px] text-[#858A80] dark:text-[#929D8D] mt-0.5">
                Current month attendance rate: <strong className="text-[#477A57] dark:text-[#5E9E72]">{kpi.attendanceRate}%</strong>
              </p>
            </div>
            <TrendingUp className="w-3.5 h-3.5 text-[#858A80] dark:text-[#929D8D]" />
          </div>

          <div className="h-56">
            {metrics?.attendanceTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#858A80" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#858A80" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#222922', borderRadius: '8px', border: '1px solid #384238', color: '#EEF1E9', fontSize: '11px' }} />
                  <Line type="monotone" dataKey="present" stroke="#29372D" strokeWidth={2.5} dot={{ r: 3 }} name="Present" />
                  <Line type="monotone" dataKey="late" stroke="#A87535" strokeWidth={2} dot={{ r: 2.5 }} name="Late" />
                  <Line type="monotone" dataKey="halfDay" stroke="#75866A" strokeWidth={2} dot={{ r: 2.5 }} name="Half Day" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#858A80] dark:text-[#929D8D]">
                No attendance trend available yet.
              </div>
            )}
          </div>
        </div>

        {/* Leave Breakdown by Type */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#222922] border border-[#E1E4D9] dark:border-[#384238] shadow-sm">
          <h2 className="font-semibold text-xs text-[#252A24] dark:text-[#EEF1E9] mb-1">
            Leave Utilization
          </h2>
          <p className="text-[11px] text-[#858A80] dark:text-[#929D8D] mb-4">Days approved by leave quota category</p>

          <div className="h-48 flex items-center justify-center">
            {metrics?.leaveByType?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.leaveByType}
                    dataKey="days"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={4}
                  >
                    {metrics.leaveByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#222922', borderRadius: '8px', border: '1px solid #384238', color: '#EEF1E9', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-[#858A80] dark:text-[#929D8D]">No leaves taken this month.</span>
            )}
          </div>
        </div>
      </div>

      {/* Top 5 Late-Comers ranking */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#222922] border border-[#E1E4D9] dark:border-[#384238] shadow-sm">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E1E4D9] dark:border-[#384238]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#A87535]" />
            <h2 className="font-semibold text-xs text-[#252A24] dark:text-[#EEF1E9]">
              Late Arrivals (Current Month)
            </h2>
          </div>
          <span className="text-[11px] text-[#858A80] dark:text-[#929D8D]">Check-ins after 09:15 AM</span>
        </div>

        {metrics?.topLateComers?.length > 0 ? (
          <div className="divide-y divide-[#E1E4D9] dark:divide-[#384238]">
            {metrics.topLateComers.map((emp, index) => (
              <div key={emp.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                    index === 0 ? 'bg-[#EDEFE6] text-[#29372D] dark:bg-[#303A30] dark:text-[#DCE8D2]' : 'bg-[#EDEFE6] dark:bg-[#293229] text-[#697064] dark:text-[#B1B9AC]'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="font-medium text-[#252A24] dark:text-[#EEF1E9]">{emp.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#A87535]/10 text-[#A87535] dark:text-[#C68E48] border border-[#A87535]/30">
                    {emp.lateCount} Late Check-in{emp.lateCount > 1 ? 's' : ''}
                  </span>
                  {emp.lateCount >= 3 && (
                    <span className="text-[10px] font-medium text-[#B64D45] dark:text-[#D2635B] font-mono">
                      (0.5 Day Deduction)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#858A80] dark:text-[#929D8D] py-4 text-center">No late check-ins recorded this month.</p>
        )}
      </div>
    </div>
  );
};

export default HrDashboard;
