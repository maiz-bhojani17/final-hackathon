import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Upload,
  Download,
  Filter,
  Eye,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  DollarSign
} from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import Employee360View from './Employee360View';

const EmployeeDirectory = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // 360 View Drawer
  const [selectedEmpId, setSelectedEmpId] = useState(null);

  // Register Employee Modal
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    employeeCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    gender: 'Male',
    departmentId: '',
    designationId: '',
    basicSalary: 60000,
    otherAllowances: 0,
    status: 'probation',
    joiningDate: new Date().toISOString().split('T')[0]
  });
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState(null);
  const [tempPasswordGenerated, setTempPasswordGenerated] = useState(null);

  // CSV Import Modal
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [dryRunReport, setDryRunReport] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvSuccessMsg, setCsvSuccessMsg] = useState(null);

  const fetchEmployees = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page });
      if (search) params.append('search', search);
      if (selectedDept) params.append('departmentId', selectedDept);
      if (selectedStatus) params.append('status', selectedStatus);

      const res = await api.get(`/employees?${params.toString()}`);
      setEmployees(res.data.employees);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      api.get('/org/departments'),
      api.get('/org/designations')
    ]).then(([dRes, desRes]) => {
      setDepartments(dRes.data);
      setDesignations(desRes.data);
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedDept, selectedStatus]);

  // Salary calculations live in form
  const numBasic = Number(registerForm.basicSalary) || 0;
  const numAllowances = Number(registerForm.otherAllowances) || 0;
  const computedHra = numBasic * 0.40;
  const computedMedical = numBasic * 0.10;
  const computedGross = (numBasic * 1.5) + numAllowances;

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegistering(true);
    setRegisterError(null);
    setTempPasswordGenerated(null);

    try {
      const res = await api.post('/employees', registerForm);
      setTempPasswordGenerated(res.data.temporaryPassword);
      fetchEmployees(1);
    } catch (err) {
      setRegisterError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setRegistering(false);
    }
  };

  const handleDryRunUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFile(file);
    setCsvLoading(true);
    setDryRunReport(null);
    setCsvSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/employees/csv/dry-run', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDryRunReport(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'CSV dry run failed');
    } finally {
      setCsvLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!csvFile) return;
    setCsvLoading(true);

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const res = await api.post('/employees/csv/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCsvSuccessMsg(res.data.message);
      setDryRunReport(null);
      fetchEmployees(1);
    } catch (err) {
      alert(err.response?.data?.message || 'Import execution failed');
    } finally {
      setCsvLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await api.get('/employees/csv/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `employees_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('CSV export failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Employee Directory & Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Register employees, configure salary structures, import CSV batches, and view 360 profiles
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={() => {
              setCsvModalOpen(true);
              setDryRunReport(null);
              setCsvFile(null);
              setCsvSuccessMsg(null);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm"
          >
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <button
            onClick={() => {
              setRegisterForm({
                employeeCode: `EMP${Math.floor(1000 + Math.random() * 9000)}`,
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                address: '',
                gender: 'Male',
                departmentId: departments[0]?._id || '',
                designationId: designations[0]?._id || '',
                basicSalary: 60000,
                otherAllowances: 0,
                status: 'probation',
                joiningDate: new Date().toISOString().split('T')[0]
              });
              setTempPasswordGenerated(null);
              setRegisterError(null);
              setRegisterOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm shadow-md"
          >
            <Plus className="w-4 h-4" /> Register Employee
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by employee name, code, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="probation">Probation</option>
            <option value="resigned">Resigned</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Searching employee records..." />
        ) : employees.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Employees Found"
            description="Register employees manually or upload a CSV roster."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-4">Employee</th>
                  <th className="p-4">Code</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Designation</th>
                  <th className="p-4">Gross Salary</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {emp.firstName} {emp.lastName}
                        </span>
                        <p className="text-[11px] text-slate-400">{emp.email}</p>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {emp.employeeCode}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      {emp.departmentId?.name || '—'}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      {emp.designationId?.title || '—'}
                    </td>
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">
                      PKR {emp.grossSalary?.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={emp.status} />
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedEmpId(emp._id)}
                        className="px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 font-semibold text-xs inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" /> 360 View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Page {pagination.page} of {pagination.totalPages} ({pagination.total} employees)</span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchEmployees(pagination.page - 1)}
                className="px-3 py-1.5 rounded-lg border disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchEmployees(pagination.page + 1)}
                className="px-3 py-1.5 rounded-lg border disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Register Employee Modal */}
      {registerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 my-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  Register New Employee
                </h3>
                <p className="text-xs text-slate-400">
                  Creates employee profile, links User login with temporary credentials, and sets salary breakdown.
                </p>
              </div>
              <button onClick={() => setRegisterOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {registerError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{registerError}</span>
              </div>
            )}

            {tempPasswordGenerated ? (
              <div className="space-y-4 text-center py-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Employee Successfully Registered!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  A login account has been created for <strong className="text-slate-800 dark:text-slate-200">{registerForm.email}</strong>.
                  Please share their temporary password below. They will be forced to change it upon first sign-in.
                </p>

                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 font-mono text-sm font-bold text-brand-600 dark:text-brand-400 inline-block px-8">
                  {tempPasswordGenerated}
                </div>

                <div>
                  <button
                    onClick={() => {
                      setTempPasswordGenerated(null);
                      setRegisterOpen(false);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold"
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Employee Code</label>
                    <input
                      type="text"
                      required
                      value={registerForm.employeeCode}
                      onChange={(e) => setRegisterForm({ ...registerForm, employeeCode: e.target.value.toUpperCase() })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={registerForm.firstName}
                      onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={registerForm.lastName}
                      onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Phone</label>
                    <input
                      type="text"
                      value={registerForm.phone}
                      onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                      placeholder="+92 300 1234567"
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Department</label>
                    <select
                      value={registerForm.departmentId}
                      onChange={(e) => setRegisterForm({ ...registerForm, departmentId: e.target.value })}
                      required
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="">Select Dept</option>
                      {departments.map(d => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Designation</label>
                    <select
                      value={registerForm.designationId}
                      onChange={(e) => setRegisterForm({ ...registerForm, designationId: e.target.value })}
                      required
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="">Select Designation</option>
                      {designations.map(des => (
                        <option key={des._id} value={des._id}>{des.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Joining Date</label>
                    <input
                      type="date"
                      required
                      value={registerForm.joiningDate}
                      onChange={(e) => setRegisterForm({ ...registerForm, joiningDate: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>

                {/* Salary Structure Card */}
                <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-brand-600" />
                    <span className="font-bold text-xs text-brand-900 dark:text-brand-300 uppercase tracking-wider">
                      Salary Structure (Gross = 1.5 × Basic)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Basic Salary (PKR)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={registerForm.basicSalary}
                        onChange={(e) => setRegisterForm({ ...registerForm, basicSalary: Number(e.target.value) })}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Other Allowances (PKR)</label>
                      <input
                        type="number"
                        value={registerForm.otherAllowances}
                        onChange={(e) => setRegisterForm({ ...registerForm, otherAllowances: Number(e.target.value) })}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-brand-100 dark:border-brand-900 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">HRA (40%):</span>
                      <strong className="text-slate-700 dark:text-slate-300">PKR {computedHra.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Medical (10%):</span>
                      <strong className="text-slate-700 dark:text-slate-300">PKR {computedMedical.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Total Gross Salary:</span>
                      <strong className="text-brand-600 dark:text-brand-400 font-bold">PKR {computedGross.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setRegisterOpen(false)}
                    className="px-4 py-2 border rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={registering}
                    className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl flex items-center gap-2 disabled:opacity-50"
                  >
                    {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Register & Create Login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CSV Import Modal with Dry-Run Error Table */}
      {csvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  CSV Bulk Employee Import
                </h3>
              </div>
              <button onClick={() => setCsvModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Upload a CSV file containing employee details. The system performs a server-side dry run verifying unique codes, email formats, department existence, and salary constraints before any records are committed.
            </p>

            <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center mb-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleDryRunUpload}
                id="csvUpload"
                className="hidden"
              />
              <label htmlFor="csvUpload" className="cursor-pointer flex flex-col items-center">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                  {csvFile ? csvFile.name : 'Click to select CSV file'}
                </span>
                <span className="text-[10px] text-slate-400 mt-1">.csv files only</span>
              </label>
            </div>

            {csvLoading && (
              <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                <span>Validating CSV data with server rules...</span>
              </div>
            )}

            {csvSuccessMsg && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{csvSuccessMsg}</span>
              </div>
            )}

            {/* Dry Run Report */}
            {dryRunReport && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      Dry Run Results: {dryRunReport.totalRows} row(s) analyzed
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      {dryRunReport.validCount} valid, {dryRunReport.errorCount} error(s)
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${
                    dryRunReport.canImport
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {dryRunReport.canImport ? 'Ready to Import' : 'Errors Found'}
                  </span>
                </div>

                {/* Errors table */}
                {dryRunReport.errors.length > 0 && (
                  <div className="max-h-56 overflow-y-auto rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 p-2">
                    <table className="w-full text-left text-xs text-rose-900 dark:text-rose-200">
                      <thead>
                        <tr className="border-b border-rose-200 dark:border-rose-800 font-bold">
                          <th className="p-2">Row</th>
                          <th className="p-2">Field</th>
                          <th className="p-2">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dryRunReport.errors.map((err, i) => (
                          <tr key={i} className="border-b border-rose-100 dark:border-rose-900/50">
                            <td className="p-2 font-mono">{err.row}</td>
                            <td className="p-2 font-semibold">{err.field}</td>
                            <td className="p-2">{err.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCsvModalOpen(false)}
                    className="px-4 py-2 border rounded-xl text-xs"
                  >
                    Close
                  </button>
                  {dryRunReport.canImport && (
                    <button
                      type="button"
                      onClick={handleExecuteImport}
                      disabled={csvLoading}
                      className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md"
                    >
                      Confirm & Import {dryRunReport.validCount} Employees
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Employee 360 View Modal */}
      {selectedEmpId && (
        <Employee360View employeeId={selectedEmpId} onClose={() => setSelectedEmpId(null)} />
      )}
    </div>
  );
};

export default EmployeeDirectory;
