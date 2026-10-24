import React, { useState, useEffect } from 'react';
import {
  User,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  DollarSign,
  Clock,
  PlaneTakeoff,
  FileText,
  Download,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';

const Employee360View = ({ employeeId, onClose }) => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  // Edit State
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ phone: '', address: '', basicSalary: 0 });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/employees/${employeeId}/profile360`);
      setProfileData(res.data);
      setEditForm({
        phone: res.data.employee.phone || '',
        address: res.data.employee.address || '',
        basicSalary: res.data.employee.basicSalary || 0
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) fetchProfile();
  }, [employeeId]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await api.put(`/employees/${employeeId}`, editForm);
      setMsg({ type: 'success', text: 'Profile successfully updated!' });
      setEditing(false);
      fetchProfile();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async (payslipId, month) => {
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

  if (!employeeId) return null;

  const emp = profileData?.employee;
  const isSelf = user?.employee?._id?.toString() === employeeId.toString();
  const canEditAny = user?.role === 'hr' || user?.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-black shadow-inner">
              {emp?.firstName?.[0] || 'E'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight">
                  {emp ? `${emp.firstName} ${emp.lastName}` : 'Employee 360'}
                </h3>
                {emp && <StatusBadge status={emp.status} className="bg-white/20 text-white border-white/30" />}
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                {emp?.designationId?.title || 'Team Member'} • {emp?.departmentId?.name || 'Department'} • {emp?.employeeCode}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-6 bg-slate-50 dark:bg-slate-900/50">
          {[
            { key: 'overview', label: 'Profile Overview' },
            { key: 'attendance', label: 'Attendance History' },
            { key: 'leaves', label: 'Leave History' },
            { key: 'payslips', label: 'Payslips & Salary' }
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`py-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                tab === t.key
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <LoadingSpinner text="Compiling Employee 360 data..." />
          ) : (
            <>
              {msg && (
                <div className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  msg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 border border-rose-200'
                }`}>
                  {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{msg.text}</span>
                </div>
              )}

              {/* Tab 1: Overview */}
              {tab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Personal Information</h4>
                      <div className="text-xs space-y-2">
                        <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <Mail className="w-4 h-4 text-slate-400" /> {emp?.email}
                        </p>
                        <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <Phone className="w-4 h-4 text-slate-400" /> {emp?.phone || 'No phone entered'}
                        </p>
                        <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <MapPin className="w-4 h-4 text-slate-400" /> {emp?.address || 'No address entered'}
                        </p>
                        <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <Calendar className="w-4 h-4 text-slate-400" /> Joined on {new Date(emp?.joiningDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Job & Compensation</h4>
                      <div className="text-xs space-y-2">
                        <p className="text-slate-600 dark:text-slate-300">
                          Department: <strong className="text-slate-900 dark:text-white">{emp?.departmentId?.name}</strong>
                        </p>
                        <p className="text-slate-600 dark:text-slate-300">
                          Designation: <strong className="text-slate-900 dark:text-white">{emp?.designationId?.title}</strong>
                        </p>
                        <p className="text-slate-600 dark:text-slate-300">
                          Basic Salary: <strong className="text-slate-900 dark:text-white">PKR {emp?.basicSalary?.toLocaleString()}</strong>
                        </p>
                        <p className="text-slate-600 dark:text-slate-300">
                          Total Gross: <strong className="text-brand-600 dark:text-brand-400 font-bold">PKR {emp?.grossSalary?.toLocaleString()}</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Profile Edit Trigger */}
                  {(isSelf || canEditAny) && (
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      {!editing ? (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            {isSelf ? 'Employees can edit their phone and address.' : 'HR can update details.'}
                          </span>
                          <button
                            onClick={() => setEditing(true)}
                            className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
                          >
                            Edit Details
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleUpdate} className="space-y-3 text-xs">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block font-semibold mb-1">Phone Number</label>
                              <input
                                type="text"
                                value={editForm.phone}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold mb-1">Address</label>
                              <input
                                type="text"
                                value={editForm.address}
                                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                              />
                            </div>
                          </div>

                          {canEditAny && (
                            <div>
                              <label className="block font-semibold mb-1">Basic Salary (PKR)</label>
                              <input
                                type="number"
                                value={editForm.basicSalary}
                                onChange={(e) => setEditForm({ ...editForm, basicSalary: Number(e.target.value) })}
                                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                              />
                            </div>
                          )}

                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setEditing(false)}
                              className="px-3 py-1.5 border rounded-lg"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={saving}
                              className="px-4 py-1.5 bg-brand-600 text-white font-semibold rounded-lg flex items-center gap-1.5"
                            >
                              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              Save Changes
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Attendance History */}
              {tab === 'attendance' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Recent 30-Day Attendance</h4>
                  {profileData?.recentAttendance?.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No attendance records found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b text-slate-400 font-semibold">
                          <tr>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Check In</th>
                            <th className="p-2.5">Check Out</th>
                            <th className="p-2.5">Total Hours</th>
                            <th className="p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {profileData.recentAttendance.map((a) => (
                            <tr key={a._id}>
                              <td className="p-2.5 font-mono">{a.date}</td>
                              <td className="p-2.5">{a.checkInTime ? new Date(a.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                              <td className="p-2.5">{a.checkOutTime ? new Date(a.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                              <td className="p-2.5 font-semibold">{a.totalHours} hrs</td>
                              <td className="p-2.5"><StatusBadge status={a.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Leaves */}
              {tab === 'leaves' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Leave History</h4>
                  {profileData?.leaveHistory?.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No leave applications found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b text-slate-400 font-semibold">
                          <tr>
                            <th className="p-2.5">Type</th>
                            <th className="p-2.5">Start Date</th>
                            <th className="p-2.5">End Date</th>
                            <th className="p-2.5">Working Days</th>
                            <th className="p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {profileData.leaveHistory.map((l) => (
                            <tr key={l._id}>
                              <td className="p-2.5 font-semibold">{l.leaveTypeId?.name}</td>
                              <td className="p-2.5 font-mono">{l.startDate}</td>
                              <td className="p-2.5 font-mono">{l.endDate}</td>
                              <td className="p-2.5">{l.workingDaysCount} days</td>
                              <td className="p-2.5"><StatusBadge status={l.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Payslips */}
              {tab === 'payslips' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Generated Monthly Payslips</h4>
                  {profileData?.recentPayslips?.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No finalized payslips available.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b text-slate-400 font-semibold">
                          <tr>
                            <th className="p-2.5">Period</th>
                            <th className="p-2.5">Gross Pay</th>
                            <th className="p-2.5">Deductions</th>
                            <th className="p-2.5">Net Salary</th>
                            <th className="p-2.5 text-right">PDF Download</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {profileData.recentPayslips.map((ps) => (
                            <tr key={ps._id}>
                              <td className="p-2.5 font-bold">{ps.month}</td>
                              <td className="p-2.5 font-semibold">PKR {ps.grossSalary?.toLocaleString()}</td>
                              <td className="p-2.5 text-rose-500">PKR {ps.totalDeductions?.toLocaleString()}</td>
                              <td className="p-2.5 font-extrabold text-emerald-600">PKR {ps.netSalary?.toLocaleString()}</td>
                              <td className="p-2.5 text-right">
                                <button
                                  onClick={() => handleDownloadPdf(ps._id, ps.month)}
                                  className="px-3 py-1 bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
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
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Employee360View;
