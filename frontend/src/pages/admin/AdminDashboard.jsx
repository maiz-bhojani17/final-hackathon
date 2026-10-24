import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingDown,
  Banknote,
  DollarSign,
  Sparkles,
  Filter,
  ShieldCheck,
  Layers,
  PieChart as PieIcon,
  RefreshCw,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import {
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

const COLORS = ['#29372D', '#A3B18A', '#626F47', '#75866A', '#A87535', '#597C91'];

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [loading, setLoading] = useState(true);

  // AI Summary
  const [aiSummary, setAiSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const url = selectedDept
        ? `/dashboard/admin?departmentId=${selectedDept}`
        : '/dashboard/admin';
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
    fetchDashboard();
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

  if (loading && !metrics) {
    return <LoadingSpinner text="Computing organizational metrics..." />;
  }

  const kpi = metrics?.kpi || {};

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E1E4D9] dark:border-[#384238]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#252A24] dark:text-[#EEF1E9]">
            Company Overview
          </h1>
          <p className="text-xs text-[#697064] dark:text-[#B1B9AC] mt-0.5">
            Aggregated workforce metrics, active liability, and tamper-proof audit trail
          </p>
        </div>

        {/* Filter bar & AI summary trigger */}
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

      {/* AI Executive Summary Card */}
      {aiSummary && (
        <div className="p-4 rounded-xl bg-[#EDEFE6] dark:bg-[#222922] border-l-4 border-[#626F47] dark:border-[#A3B18A] border-y border-r border-[#E1E4D9] dark:border-[#384238]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#626F47] dark:text-[#A3B18A]" />
              <h2 className="font-semibold text-xs text-[#252A24] dark:text-[#EEF1E9]">
                Executive Insights (Gemini AI)
              </h2>
            </div>
            <span className="text-[10px] text-[#626F47] dark:text-[#A3B18A] font-mono">
              Live Analysis
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Headcount */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#222922] border border-[#E1E4D9] dark:border-[#384238] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#697064] dark:text-[#B1B9AC]">Total Headcount</span>
            <Users className="w-4 h-4 text-[#858A80] dark:text-[#929D8D]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-[#252A24] dark:text-[#EEF1E9]">
              {kpi.headcount ?? 0}
            </span>
            <p className="text-[11px] text-[#477A57] dark:text-[#5E9E72] font-medium mt-0.5">
              Active employees
            </p>
          </div>
        </div>

        {/* Attrition YTD */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#222922] border border-[#E1E4D9] dark:border-[#384238] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#697064] dark:text-[#B1B9AC]">Attrition Rate (YTD)</span>
            <TrendingDown className="w-4 h-4 text-[#858A80] dark:text-[#929D8D]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-[#252A24] dark:text-[#EEF1E9]">
              {kpi.attritionYTD ?? 0}%
            </span>
            <p className="text-[11px] text-[#858A80] dark:text-[#929D8D] mt-0.5">
              Exits / average headcount
            </p>
          </div>
        </div>

        {/* Monthly Payroll Cost */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#222922] border border-[#E1E4D9] dark:border-[#384238] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#697064] dark:text-[#B1B9AC]">Monthly Payroll</span>
            <Banknote className="w-4 h-4 text-[#858A80] dark:text-[#929D8D]" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#252A24] dark:text-[#EEF1E9]">
              PKR {(kpi.totalPayrollNet || 0).toLocaleString()}
            </span>
            <p className="text-[11px] text-[#858A80] dark:text-[#929D8D] mt-0.5">
              Month: {kpi.targetMonth}
            </p>
          </div>
        </div>

        {/* Average Salary */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#222922] border border-[#E1E4D9] dark:border-[#384238] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#697064] dark:text-[#B1B9AC]">Average Gross Pay</span>
            <DollarSign className="w-4 h-4 text-[#858A80] dark:text-[#929D8D]" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#252A24] dark:text-[#EEF1E9]">
              PKR {(kpi.avgSalary || 0).toLocaleString()}
            </span>
            <p className="text-[11px] text-[#858A80] dark:text-[#929D8D] mt-0.5">
              Per active employee
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Headcount by Department */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#222922] border border-[#E1E4D9] dark:border-[#384238] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-xs text-[#252A24] dark:text-[#EEF1E9]">
              Headcount by Department
            </h2>
            <Layers className="w-3.5 h-3.5 text-[#858A80] dark:text-[#929D8D]" />
          </div>
          <div className="h-56">
            {metrics?.headcountByDept?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.headcountByDept} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#858A80" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#858A80" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#222922', borderRadius: '8px', border: '1px solid #384238', color: '#EEF1E9', fontSize: '11px' }}
                  />
                  <Bar dataKey="count" fill="#29372D" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#858A80] dark:text-[#929D8D]">
                No department records available yet.
              </div>
            )}
          </div>
        </div>

        {/* Payroll Cost by Department */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#222922] border border-[#E1E4D9] dark:border-[#384238] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-xs text-[#252A24] dark:text-[#EEF1E9]">
              Payroll Liability by Department
            </h2>
            <Banknote className="w-3.5 h-3.5 text-[#858A80] dark:text-[#929D8D]" />
          </div>
          <div className="h-56">
            {metrics?.payrollByDept?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.payrollByDept} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#858A80" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#858A80" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(val) => `PKR ${val.toLocaleString()}`}
                    contentStyle={{ backgroundColor: '#222922', borderRadius: '8px', border: '1px solid #384238', color: '#EEF1E9', fontSize: '11px' }}
                  />
                  <Bar dataKey="cost" fill="#75866A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#858A80] dark:text-[#929D8D]">
                No payroll runs executed yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gender & Tenure Distributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gender Breakdown */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#222922] border border-[#E1E4D9] dark:border-[#384238] shadow-sm">
          <h2 className="font-semibold text-xs text-[#252A24] dark:text-[#EEF1E9] mb-3">
            Demographic Breakdown
          </h2>
          <div className="h-48 flex items-center justify-center">
            {metrics?.genderData?.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.genderData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                  >
                    {metrics.genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#222922', borderRadius: '8px', border: '1px solid #384238', color: '#EEF1E9', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-[#858A80] dark:text-[#929D8D]">No demographic data yet.</span>
            )}
          </div>
        </div>

        {/* Tenure Breakdown */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#222922] border border-[#E1E4D9] dark:border-[#384238] shadow-sm">
          <h2 className="font-semibold text-xs text-[#252A24] dark:text-[#EEF1E9] mb-3">
            Tenure Distribution
          </h2>
          <div className="h-48 flex items-center justify-center">
            {metrics?.tenureData?.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.tenureData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="range" stroke="#858A80" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#858A80" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#222922', borderRadius: '8px', border: '1px solid #384238', color: '#EEF1E9', fontSize: '11px' }} />
                  <Bar dataKey="count" fill="#626F47" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-[#858A80] dark:text-[#929D8D]">No tenure data yet.</span>
            )}
          </div>
        </div>
      </div>

      {/* Append-Only Audit Feed */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#222922] border border-[#E1E4D9] dark:border-[#384238] shadow-sm">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E1E4D9] dark:border-[#384238]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#626F47] dark:text-[#A3B18A]" />
            <h2 className="font-semibold text-xs text-[#252A24] dark:text-[#EEF1E9]">
              Recent System Audit Events
            </h2>
          </div>
          <span className="text-[11px] text-[#858A80] dark:text-[#929D8D] font-mono">Immutable Log</span>
        </div>

        <div className="divide-y divide-[#E1E4D9] dark:divide-[#384238]">
          {metrics?.auditFeed?.length > 0 ? (
            metrics.auditFeed.map((log) => (
              <div key={log._id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#252A24] dark:text-[#EEF1E9] font-mono text-[11px]">{log.action}</span>
                  <span className="text-[#D5D9CB] dark:text-[#384238]">•</span>
                  <span className="text-[#697064] dark:text-[#B1B9AC]">{log.entity}</span>
                </div>
                <div className="flex items-center gap-3 text-[#858A80] dark:text-[#929D8D] text-[11px] font-mono">
                  <span>{log.actorEmail}</span>
                  <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-[#858A80] dark:text-[#929D8D] py-3 text-center">No audit activity logged yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
