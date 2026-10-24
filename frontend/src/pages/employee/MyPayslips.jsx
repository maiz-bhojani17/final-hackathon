import React, { useState, useEffect } from 'react';
import { Banknote, Download, FileText, CheckCircle2, Shield } from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';

const MyPayslips = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payroll/my-payslips');
      setPayslips(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, []);

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

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Salary Payslips
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 uppercase tracking-wider">
            Confidential
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Access and download official system-generated salary payslips with complete tax and deduction breakdowns
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Retrieving payslip records..." />
        ) : payslips.length === 0 ? (
          <EmptyState
            icon={Banknote}
            title="No Finalized Payslips"
            description="Your monthly payslips will be available here once finalized by organization administration."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-4">Pay Period</th>
                  <th className="p-4">Gross Earnings</th>
                  <th className="p-4">Total Deductions</th>
                  <th className="p-4">Income Tax</th>
                  <th className="p-4">Net Take-Home Pay</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">PDF Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payslips.map((ps) => (
                  <tr key={ps._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {ps.month}
                    </td>
                    <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                      PKR {ps.grossSalary?.toLocaleString()}
                    </td>
                    <td className="p-4 text-rose-500 font-medium">
                      PKR {ps.totalDeductions?.toLocaleString()}
                    </td>
                    <td className="p-4 font-mono text-purple-600 dark:text-purple-400">
                      PKR {ps.deductions?.incomeTax?.toLocaleString()}
                    </td>
                    <td className="p-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      PKR {ps.netSalary?.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={ps.status} />
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDownloadPdf(ps._id, ps.month)}
                        className="px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 font-semibold text-xs inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" /> Download PDF
                      </button>
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

export default MyPayslips;
