import React, { useState, useEffect } from 'react';
import { Building2, Briefcase, Calendar, Shield, Plus, Trash2, Edit3, X, Check, AlertCircle } from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const OrgSetup = () => {
  const [tab, setTab] = useState('departments');
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal forms state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedItem, setSelectedItem] = useState(null);
  const [formState, setFormState] = useState({});

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [deptRes, desigRes, ltRes, holRes] = await Promise.all([
        api.get('/org/departments'),
        api.get('/org/designations'),
        api.get('/org/leave-types'),
        api.get('/org/holidays')
      ]);
      setDepartments(deptRes.data);
      setDesignations(desigRes.data);
      setLeaveTypes(ltRes.data);
      setHolidays(holRes.data);
    } catch (err) {
      setError('Failed to fetch organization setup data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedItem(null);
    if (tab === 'departments') {
      setFormState({ name: '', code: '', description: '' });
    } else if (tab === 'designations') {
      setFormState({ title: '', departmentId: departments[0]?._id || '', level: 'Associate' });
    } else if (tab === 'leave-types') {
      setFormState({ name: '', code: '', yearlyQuota: 10, isPaid: true, description: '' });
    } else if (tab === 'holidays') {
      setFormState({ name: '', date: new Date().toISOString().split('T')[0], description: '' });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (tab === 'departments') {
        if (modalMode === 'create') await api.post('/org/departments', formState);
        else await api.put(`/org/departments/${selectedItem._id}`, formState);
      } else if (tab === 'designations') {
        if (modalMode === 'create') await api.post('/org/designations', formState);
        else await api.put(`/org/designations/${selectedItem._id}`, formState);
      } else if (tab === 'leave-types') {
        if (modalMode === 'create') await api.post('/org/leave-types', formState);
        else await api.put(`/org/leave-types/${selectedItem._id}`, formState);
      } else if (tab === 'holidays') {
        if (modalMode === 'create') await api.post('/org/holidays', formState);
        else await api.put(`/org/holidays/${selectedItem._id}`, formState);
      }
      setModalOpen(false);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      if (tab === 'departments') await api.delete(`/org/departments/${id}`);
      else if (tab === 'designations') await api.delete(`/org/designations/${id}`);
      else if (tab === 'leave-types') await api.delete(`/org/leave-types/${id}`);
      else if (tab === 'holidays') await api.delete(`/org/holidays/${id}`);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Deletion failed');
    }
  };

  if (loading) return <LoadingSpinner text="Loading organization records..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Organization Structure & Parameters
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure departments, designations, annual leave quotas, and official holidays
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm shadow-md"
        >
          <Plus className="w-4 h-4" /> Add Record
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 sm:gap-6 overflow-x-auto no-scrollbar">
        {[
          { key: 'departments', label: 'Departments', icon: Building2, count: departments.length },
          { key: 'designations', label: 'Designations', icon: Briefcase, count: designations.length },
          { key: 'leave-types', label: 'Leave Types & Quotas', icon: Shield, count: leaveTypes.length },
          { key: 'holidays', label: 'Public Holidays', icon: Calendar, count: holidays.length }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-xs sm:text-sm whitespace-nowrap transition-all ${
                isActive
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Tables */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
        {tab === 'departments' && (
          departments.length === 0 ? (
            <EmptyState
              title="No Departments Created"
              description="Create your first department (e.g., Engineering, HR, Sales)."
              action={<button onClick={openCreateModal} className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold">Add Department</button>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Department Name</th>
                    <th className="p-4">Code</th>
                    <th className="p-4">Description</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {departments.map((d) => (
                    <tr key={d._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-4 font-semibold text-slate-900 dark:text-white">{d.name}</td>
                      <td className="p-4 font-mono font-bold text-brand-600 dark:text-brand-400">{d.code}</td>
                      <td className="p-4 text-slate-500">{d.description || '—'}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(d._id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === 'designations' && (
          designations.length === 0 ? (
            <EmptyState
              title="No Designations Configured"
              description="Define job titles linked to departments (e.g. Lead Software Engineer, HR Specialist)."
              action={<button onClick={openCreateModal} className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold">Add Designation</button>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Designation Title</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Level</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {designations.map((desig) => (
                    <tr key={desig._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-4 font-semibold text-slate-900 dark:text-white">{desig.title}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">{desig.departmentId?.name || '—'}</td>
                      <td className="p-4"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800">{desig.level}</span></td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(desig._id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === 'leave-types' && (
          leaveTypes.length === 0 ? (
            <EmptyState
              title="No Leave Types Configured"
              description="Setup annual, sick, and casual leave quotas according to company policy."
              action={<button onClick={openCreateModal} className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold">Add Leave Type</button>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Leave Policy Name</th>
                    <th className="p-4">Code</th>
                    <th className="p-4">Annual Quota</th>
                    <th className="p-4">Paid / Unpaid</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {leaveTypes.map((lt) => (
                    <tr key={lt._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-4 font-semibold text-slate-900 dark:text-white">{lt.name}</td>
                      <td className="p-4 font-mono font-bold text-brand-600">{lt.code}</td>
                      <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                        {lt.yearlyQuota < 0 ? 'Unlimited' : `${lt.yearlyQuota} days`}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          lt.isPaid ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {lt.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(lt._id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === 'holidays' && (
          holidays.length === 0 ? (
            <EmptyState
              title="No Public Holidays"
              description="Register public holidays so they are automatically skipped when counting leave working days."
              action={<button onClick={openCreateModal} className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold">Add Holiday</button>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Holiday Title</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Description</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {holidays.map((h) => (
                    <tr key={h._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-4 font-semibold text-slate-900 dark:text-white">{h.name}</td>
                      <td className="p-4 font-mono font-medium text-slate-600 dark:text-slate-300">{h.date}</td>
                      <td className="p-4 text-slate-500">{h.description || '—'}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(h._id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white capitalize">
                Add New {tab.replace('-', ' ')}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
              {tab === 'departments' && (
                <>
                  <div>
                    <label className="block font-semibold mb-1">Department Name</label>
                    <input
                      type="text"
                      required
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      placeholder="e.g. Engineering"
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Code</label>
                    <input
                      type="text"
                      required
                      value={formState.code}
                      onChange={(e) => setFormState({ ...formState, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. ENG"
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Description</label>
                    <textarea
                      value={formState.description}
                      onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                      rows={2}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </>
              )}

              {tab === 'designations' && (
                <>
                  <div>
                    <label className="block font-semibold mb-1">Designation Title</label>
                    <input
                      type="text"
                      required
                      value={formState.title}
                      onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                      placeholder="e.g. Senior Software Engineer"
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Department</label>
                    <select
                      value={formState.departmentId}
                      onChange={(e) => setFormState({ ...formState, departmentId: e.target.value })}
                      required
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      {departments.map(d => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Level / Grade</label>
                    <input
                      type="text"
                      value={formState.level}
                      onChange={(e) => setFormState({ ...formState, level: e.target.value })}
                      placeholder="e.g. Senior, Lead, Executive"
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </>
              )}

              {tab === 'leave-types' && (
                <>
                  <div>
                    <label className="block font-semibold mb-1">Leave Policy Name</label>
                    <input
                      type="text"
                      required
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      placeholder="e.g. Annual Leave, Sick Leave, Casual Leave"
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Code</label>
                      <input
                        type="text"
                        required
                        value={formState.code}
                        onChange={(e) => setFormState({ ...formState, code: e.target.value.toUpperCase() })}
                        placeholder="ANNUAL"
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Yearly Quota (Days)</label>
                      <input
                        type="number"
                        required
                        value={formState.yearlyQuota}
                        onChange={(e) => setFormState({ ...formState, yearlyQuota: Number(e.target.value) })}
                        placeholder="14 (-1 for unlimited)"
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="isPaid"
                      checked={formState.isPaid}
                      onChange={(e) => setFormState({ ...formState, isPaid: e.target.checked })}
                      className="w-4 h-4 rounded text-brand-600"
                    />
                    <label htmlFor="isPaid" className="font-semibold text-xs">Paid Leave (Deducted from quota without salary penalty)</label>
                  </div>
                </>
              )}

              {tab === 'holidays' && (
                <>
                  <div>
                    <label className="block font-semibold mb-1">Holiday Name</label>
                    <input
                      type="text"
                      required
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      placeholder="e.g. Independence Day"
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={formState.date}
                      onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </>
              )}

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 text-white font-semibold rounded-xl"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgSetup;
