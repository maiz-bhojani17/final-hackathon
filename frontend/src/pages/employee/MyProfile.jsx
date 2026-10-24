import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Mail, Calendar, Briefcase, DollarSign, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';

const MyProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const empId = user?.employee?._id || user?.employee?.id;
      if (!empId) return;

      const res = await api.get(`/employees/${empId}/profile360`);
      const emp = res.data.employee;
      setProfile(emp);
      setPhone(emp.phone || '');
      setAddress(emp.address || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const empId = user?.employee?._id || user?.employee?.id;
      await api.put(`/employees/${empId}`, { phone, address });
      setMsg({ type: 'success', text: 'Personal contact details successfully updated!' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading employee profile..." />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          My Employee Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review your employment contract parameters and maintain your direct contact coordinates
        </p>
      </div>

      {msg && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
          msg.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
            : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Overview Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-5">
        <div className="w-16 h-16 rounded-3xl bg-brand-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
          {profile?.firstName?.[0] || 'E'}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {profile?.firstName} {profile?.lastName}
            </h2>
            <StatusBadge status={profile?.status} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {profile?.designationId?.title} • {profile?.departmentId?.name} • Code: <strong className="font-mono text-brand-600">{profile?.employeeCode}</strong>
          </p>
        </div>
      </div>

      {/* Read-Only Employment & Salary Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Briefcase className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Employment Details & Salary Structure (Managed by HR)
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Joining Date:</span>
            <strong className="text-slate-800 dark:text-slate-200">{new Date(profile?.joiningDate).toLocaleDateString()}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Department:</span>
            <strong className="text-slate-800 dark:text-slate-200">{profile?.departmentId?.name}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Designation:</span>
            <strong className="text-slate-800 dark:text-slate-200">{profile?.designationId?.title}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Basic Salary:</span>
            <strong className="text-slate-800 dark:text-slate-200">PKR {profile?.basicSalary?.toLocaleString()}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">HRA (40%):</span>
            <strong className="text-slate-800 dark:text-slate-200">PKR {profile?.hra?.toLocaleString()}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Total Gross Salary:</span>
            <strong className="text-brand-600 dark:text-brand-400 font-extrabold">PKR {profile?.grossSalary?.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* Editable Contact Information Form */}
      <form onSubmit={handleSave} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <User className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Editable Contact Coordinates (Self-Service)
          </h3>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Email Address (Company ID - Read Only)
          </label>
          <input
            type="email"
            disabled
            value={profile?.email || ''}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs sm:text-sm cursor-not-allowed"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+92 300 1234567"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Residential Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House, Street, City"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="pt-3 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Update Contact Info
          </button>
        </div>
      </form>
    </div>
  );
};

export default MyProfile;
