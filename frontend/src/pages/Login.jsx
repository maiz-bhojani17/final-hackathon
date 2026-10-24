import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Shield,
  Briefcase,
  User,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Building
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const DEMO_ROLES = [
  {
    id: 'admin',
    role: 'Admin',
    email: 'admin@hcmlite.com',
    password: 'Admin123!',
    label: 'Administrator',
    desc: 'System governance, org config, salary lock & audit trail',
    icon: Shield
  },
  {
    id: 'hr',
    role: 'HR Officer',
    email: 'hr@hcmlite.com',
    password: 'Hr123456!',
    label: 'HR Manager',
    desc: 'Staff directory, daily attendance, leave approvals & payroll runs',
    icon: Briefcase
  },
  {
    id: 'employee',
    role: 'Employee',
    email: 'ali@hcmlite.com',
    password: 'Ali123456!',
    label: 'Employee',
    desc: 'Attendance clocking, leave requests, AI assistant & payslips',
    icon: User
  }
];

const Login = () => {
  const navigate = useNavigate();
  const { login, systemStatus, checkSystemStatus, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [activeRole, setActiveRole] = useState('admin');
  const [email, setEmail] = useState('admin@hcmlite.com');
  const [password, setPassword] = useState('Admin123!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'hr') navigate('/hr');
      else navigate('/employee');
      return;
    }

    checkSystemStatus();
  }, [user]);

  const handleSelectRole = (r) => {
    setActiveRole(r.id);
    setEmail(r.email);
    setPassword(r.password);
    setError(null);
  };

  const extractErrorMessage = (err, defaultMsg) => {
    if (err.response) {
      if (typeof err.response.data === 'string') {
        if (err.response.data.includes('ECONNREFUSED') || err.response.data.includes('504') || err.response.data.includes('502')) {
          return 'Backend server (Port 5000) is unreachable. Run "cd backend && npm start" in your terminal.';
        }
        const text = err.response.data.replace(/<[^>]*>/g, '').trim().slice(0, 160);
        return text || `Server Error (${err.response.status})`;
      }
      if (err.response.data?.message) {
        return err.response.data.message;
      }
      return `Server Error (${err.response.status})`;
    }
    if (err.request) {
      return 'Cannot connect to backend (Port 5000). Ensure the backend process is running.';
    }
    return err.message || defaultMsg;
  };

  const executeLogin = async (targetEmail, targetPassword) => {
    setError(null);
    setLoading(true);

    try {
      if (['admin@hcmlite.com', 'hr@hcmlite.com', 'ali@hcmlite.com'].includes(targetEmail.toLowerCase().trim())) {
        try {
          await api.post('/auth/seed-demo');
        } catch (ignored) {}
      }

      const loggedUser = await login(targetEmail, targetPassword);
      if (loggedUser.role === 'admin') navigate('/admin');
      else if (loggedUser.role === 'hr') navigate('/hr');
      else navigate('/employee');
    } catch (err) {
      setError(extractErrorMessage(err, 'Invalid credentials. Please verify your email and password.'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (r) => {
    handleSelectRole(r);
    executeLogin(r.email, r.password);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    executeLogin(email, password);
  };

  const activeRoleData = DEMO_ROLES.find(r => r.id === activeRole) || DEMO_ROLES[0];

  return (
    <div className="min-h-screen bg-[#F5F3EB] dark:bg-[#171C18] text-[#252A24] dark:text-[#EEF1E9] flex flex-col justify-between selection:bg-[#A3B18A] selection:text-[#171C18] transition-colors duration-150">
      {/* Minimal Top Header */}
      <header className="w-full max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#29372D] text-[#F5F3EB] dark:bg-[#A3B18A] dark:text-[#171C18] flex items-center justify-center font-bold text-sm tracking-tight shadow-none">
            H
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-[#252A24] dark:text-[#EEF1E9]">HCM Lite</span>
            <span className="text-[11px] text-[#858A80] dark:text-[#929D8D] font-mono">/ enterprise</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-[#E1E4D9] dark:border-[#384238] text-[#697064] dark:text-[#B1B9AC] hover:text-[#252A24] dark:hover:text-[#EEF1E9] hover:bg-[#E8EBE0] dark:hover:bg-[#2C352C] transition-colors"
            title="Toggle color theme"
            aria-label="Toggle color theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-[#A87535]" /> : <Moon className="w-4 h-4 text-[#626F47]" />}
          </button>
        </div>
      </header>

      {/* Main Authentication Card Container */}
      <main className="w-full max-w-md mx-auto px-4 py-8">
        <div className="bg-white dark:bg-[#222922] rounded-xl border border-[#E1E4D9] dark:border-[#384238] shadow-sm p-7 sm:p-8">
          
          {/* Card Header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold tracking-tight text-[#252A24] dark:text-[#EEF1E9]">
              Sign in to workspace
            </h1>
            <p className="text-xs text-[#697064] dark:text-[#B1B9AC] mt-1">
              Select a test account or enter your credentials.
            </p>
          </div>

          {/* Role Segmented Switcher */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-medium text-[#697064] dark:text-[#B1B9AC] uppercase tracking-wider">
                Role Presets
              </label>
              <span className="text-[11px] text-[#858A80] dark:text-[#929D8D] font-mono">1-click switch</span>
            </div>

            <div className="grid grid-cols-3 gap-1 p-1 bg-[#EDEFE6] dark:bg-[#1B211C] rounded-lg border border-[#E1E4D9] dark:border-[#384238]">
              {DEMO_ROLES.map((r) => {
                const Icon = r.icon;
                const isSelected = activeRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelectRole(r)}
                    className={`py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-white dark:bg-[#303A30] text-[#29372D] dark:text-[#EEF1E9] shadow-sm font-semibold'
                        : 'text-[#697064] dark:text-[#B1B9AC] hover:text-[#252A24] dark:hover:text-[#EEF1E9]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{r.role}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Login Bar for selected role */}
            <div className="mt-2.5 p-3 rounded-lg bg-[#EDEFE6] dark:bg-[#293229] border border-[#E1E4D9] dark:border-[#384238] flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <p className="font-medium text-[#252A24] dark:text-[#EEF1E9] truncate">{activeRoleData.label}</p>
                <p className="text-[11px] text-[#697064] dark:text-[#B1B9AC] font-mono truncate">{activeRoleData.email}</p>
              </div>
              <button
                type="button"
                onClick={() => handleQuickLogin(activeRoleData)}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-[#29372D] hover:bg-[#1e2720] text-[#F5F3EB] dark:bg-[#A3B18A] dark:hover:bg-[#8A9A71] dark:text-[#171C18] font-medium text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-none disabled:opacity-50"
              >
                <span>Instant Sign In</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E1E4D9] dark:border-[#384238]" />
            </div>
            <div className="relative flex justify-center text-[11px]">
              <span className="bg-white dark:bg-[#222922] px-2 text-[#858A80] dark:text-[#929D8D]">or sign in with email</span>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[#B64D45]/10 border border-[#B64D45]/30 text-[#B64D45] dark:text-[#D2635B] text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B64D45] dark:text-[#D2635B]" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-[#252A24] dark:text-[#EEF1E9] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#858A80] dark:text-[#929D8D] absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#F5F3EB]/50 dark:bg-[#171C18] border border-[#E1E4D9] dark:border-[#384238] text-xs sm:text-sm text-[#252A24] dark:text-[#EEF1E9] placeholder-[#858A80] dark:placeholder-[#929D8D] focus:outline-none focus:border-[#75866A] focus:ring-1 focus:ring-[#75866A] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#252A24] dark:text-[#EEF1E9] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#858A80] dark:text-[#929D8D] absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 rounded-lg bg-[#F5F3EB]/50 dark:bg-[#171C18] border border-[#E1E4D9] dark:border-[#384238] text-xs sm:text-sm text-[#252A24] dark:text-[#EEF1E9] placeholder-[#858A80] dark:placeholder-[#929D8D] focus:outline-none focus:border-[#75866A] focus:ring-1 focus:ring-[#75866A] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-2.5 text-[#858A80] hover:text-[#252A24] dark:text-[#929D8D] dark:hover:text-[#EEF1E9]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-1 rounded-lg bg-[#29372D] hover:bg-[#1e2720] text-[#F5F3EB] dark:bg-[#A3B18A] dark:hover:bg-[#8A9A71] dark:text-[#171C18] font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* First run link */}
          <div className="mt-5 pt-4 border-t border-[#E1E4D9] dark:border-[#384238] flex items-center justify-between text-[11px] text-[#697064] dark:text-[#B1B9AC]">
            <span>First time setting up?</span>
            <a href="/setup" className="font-medium text-[#626F47] dark:text-[#A3B18A] hover:underline">
              Initial Setup Wizard →
            </a>
          </div>

        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-4 text-center text-xs text-[#858A80] dark:text-[#929D8D]">
        HCM Lite • Human Capital Management System
      </footer>
    </div>
  );
};

export default Login;
