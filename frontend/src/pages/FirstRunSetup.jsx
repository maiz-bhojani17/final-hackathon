import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Shield, Clock, MapPin, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const FirstRunSetup = () => {
  const navigate = useNavigate();
  const { checkSystemStatus, login } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    companyName: 'HCM Lite Enterprises',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    workStartTime: '09:00',
    workEndTime: '18:00',
    gracePeriodMinutes: 15,
    halfDayHours: 5,
    officeLat: 24.8607,
    officeLng: 67.0011,
    officeRadius: 150,
    officeAddress: 'Zaitoon Ashraf IT Park'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.adminPassword !== formData.confirmPassword) {
      setError('Admin password and confirmation do not match.');
      return;
    }

    if (formData.adminPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        companyName: formData.companyName,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
        officeHours: {
          workStartTime: formData.workStartTime,
          workEndTime: formData.workEndTime
        },
        officeLocation: {
          lat: Number(formData.officeLat),
          lng: Number(formData.officeLng),
          radiusMeters: Number(formData.officeRadius),
          address: formData.officeAddress
        }
      };

      const res = await api.post('/auth/setup', payload);
      // Save credentials in AuthContext
      localStorage.setItem('hcm_token', res.data.token);
      localStorage.setItem('hcm_user', JSON.stringify(res.data.user));

      await checkSystemStatus();
      // Redirect to Admin dashboard
      window.location.href = '/admin';
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete initial system setup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EB] dark:bg-[#171C18] flex items-center justify-center p-4 sm:p-6 transition-colors duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-[#222922] rounded-xl shadow-modal border border-[#E1E4D9] dark:border-[#384238] overflow-hidden">
        {/* Header */}
        <div className="p-6 sm:p-7 bg-[#29372D] dark:bg-[#1B211C] text-[#F5F3EB] border-b border-[#E1E4D9] dark:border-[#384238]">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-[#A3B18A] text-[#171C18]">
              Initial Setup Wizard
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Welcome to HCM Lite Setup
          </h1>
          <p className="text-xs text-[#DCE8D2] dark:text-[#B1B9AC] mt-1 max-w-xl leading-relaxed">
            Initialize your organization profile, configure administrative credentials, and set office geofencing rules.
          </p>
        </div>

        {/* Stepper Tabs */}
        <div className="flex border-b border-[#E1E4D9] dark:border-[#384238] bg-[#EDEFE6] dark:bg-[#293229]">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
              step === 1
                ? 'border-[#29372D] dark:border-[#A3B18A] text-[#29372D] dark:text-[#EEF1E9] bg-white dark:bg-[#222922]'
                : 'border-transparent text-[#697064] dark:text-[#B1B9AC] hover:text-[#252A24]'
            }`}
          >
            <Building2 className="w-4 h-4" /> 1. Company & Admin
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
              step === 2
                ? 'border-[#29372D] dark:border-[#A3B18A] text-[#29372D] dark:text-[#EEF1E9] bg-white dark:bg-[#222922]'
                : 'border-transparent text-[#697064] dark:text-[#B1B9AC] hover:text-[#252A24]'
            }`}
          >
            <Clock className="w-4 h-4" /> 2. Office Rules & Geofence
          </button>
        </div>

        {error && (
          <div className="mx-6 sm:mx-8 mt-5 p-3 rounded-lg bg-[#B64D45]/10 border border-[#B64D45]/30 flex items-start gap-2 text-[#B64D45] dark:text-[#D2635B] text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#252A24] dark:text-[#EEF1E9] mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. HCM Lite Enterprises"
                  className="w-full px-3 py-2 rounded-lg bg-[#F5F3EB]/50 dark:bg-[#1B211C] border border-[#E1E4D9] dark:border-[#384238] text-xs text-[#252A24] dark:text-[#EEF1E9] focus:outline-none focus:ring-1 focus:ring-[#75866A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252A24] dark:text-[#EEF1E9] mb-1">
                  Admin Email Address
                </label>
                <input
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  required
                  placeholder="admin@company.com"
                  className="w-full px-3 py-2 rounded-lg bg-[#F5F3EB]/50 dark:bg-[#1B211C] border border-[#E1E4D9] dark:border-[#384238] text-xs text-[#252A24] dark:text-[#EEF1E9] focus:outline-none focus:ring-1 focus:ring-[#75866A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#252A24] dark:text-[#EEF1E9] mb-1">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    name="adminPassword"
                    value={formData.adminPassword}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-lg bg-[#F5F3EB]/50 dark:bg-[#1B211C] border border-[#E1E4D9] dark:border-[#384238] text-xs text-[#252A24] dark:text-[#EEF1E9] focus:outline-none focus:ring-1 focus:ring-[#75866A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#252A24] dark:text-[#EEF1E9] mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-lg bg-[#F5F3EB]/50 dark:bg-[#1B211C] border border-[#E1E4D9] dark:border-[#384238] text-xs text-[#252A24] dark:text-[#EEF1E9] focus:outline-none focus:ring-1 focus:ring-[#75866A]"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2 rounded-lg bg-[#29372D] hover:bg-[#1e2720] text-[#F5F3EB] dark:bg-[#A3B18A] dark:hover:bg-[#8A9A71] dark:text-[#171C18] font-semibold text-xs transition-colors shadow-none"
                >
                  Continue to Office Rules →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#252A24] dark:text-[#EEF1E9] mb-1">
                    Work Start Time
                  </label>
                  <input
                    type="time"
                    name="workStartTime"
                    value={formData.workStartTime}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-[#F5F3EB]/50 dark:bg-[#1B211C] border border-[#E1E4D9] dark:border-[#384238] text-xs text-[#252A24] dark:text-[#EEF1E9] focus:outline-none focus:ring-1 focus:ring-[#75866A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#252A24] dark:text-[#EEF1E9] mb-1">
                    Work End Time
                  </label>
                  <input
                    type="time"
                    name="workEndTime"
                    value={formData.workEndTime}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-[#F5F3EB]/50 dark:bg-[#1B211C] border border-[#E1E4D9] dark:border-[#384238] text-xs text-[#252A24] dark:text-[#EEF1E9] focus:outline-none focus:ring-1 focus:ring-[#75866A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#252A24] dark:text-[#EEF1E9] mb-1">
                    Grace Period (minutes)
                  </label>
                  <input
                    type="number"
                    name="gracePeriodMinutes"
                    value={formData.gracePeriodMinutes}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-[#F5F3EB]/50 dark:bg-[#1B211C] border border-[#E1E4D9] dark:border-[#384238] text-xs text-[#252A24] dark:text-[#EEF1E9] focus:outline-none focus:ring-1 focus:ring-[#75866A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#252A24] dark:text-[#EEF1E9] mb-1">
                    Half-Day Threshold (hours)
                  </label>
                  <input
                    type="number"
                    name="halfDayHours"
                    value={formData.halfDayHours}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-[#F5F3EB]/50 dark:bg-[#1B211C] border border-[#E1E4D9] dark:border-[#384238] text-xs text-[#252A24] dark:text-[#EEF1E9] focus:outline-none focus:ring-1 focus:ring-[#75866A]"
                  />
                </div>
              </div>

              {/* Office Geofencing */}
              <div className="p-3.5 rounded-xl bg-[#EDEFE6] dark:bg-[#293229] border border-[#E1E4D9] dark:border-[#384238] space-y-2.5">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#626F47] dark:text-[#A3B18A]" />
                  <span className="text-xs font-semibold text-[#252A24] dark:text-[#EEF1E9]">
                    Office Geofence Location (For Attendance GPS)
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-[#697064] dark:text-[#B1B9AC] mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      name="officeLat"
                      value={formData.officeLat}
                      onChange={handleChange}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#1B211C] border border-[#E1E4D9] dark:border-[#384238] text-[#252A24] dark:text-[#EEF1E9]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#697064] dark:text-[#B1B9AC] mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      name="officeLng"
                      value={formData.officeLng}
                      onChange={handleChange}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#1B211C] border border-[#E1E4D9] dark:border-[#384238] text-[#252A24] dark:text-[#EEF1E9]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#697064] dark:text-[#B1B9AC] mb-1">Radius (Meters)</label>
                    <input
                      type="number"
                      name="officeRadius"
                      value={formData.officeRadius}
                      onChange={handleChange}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#1B211C] border border-[#E1E4D9] dark:border-[#384238] text-[#252A24] dark:text-[#EEF1E9]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-lg border border-[#E1E4D9] dark:border-[#384238] text-xs font-semibold text-[#697064] dark:text-[#B1B9AC] hover:bg-[#E8EBE0] dark:hover:bg-[#2C352C] transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-[#29372D] hover:bg-[#1e2720] text-[#F5F3EB] dark:bg-[#A3B18A] dark:hover:bg-[#8A9A71] dark:text-[#171C18] font-semibold text-xs transition-colors shadow-none flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Finish Setup & Launch HCM Lite
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default FirstRunSetup;
