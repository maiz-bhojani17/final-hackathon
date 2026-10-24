import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Eye, Filter, Calendar, X, Code } from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const AuditLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page });
      if (actionFilter) params.append('action', actionFilter);
      if (entityFilter) params.append('entity', entityFilter);

      const res = await api.get(`/comms/audit-logs?${params.toString()}`);
      setLogs(res.data.logs);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter, entityFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              System Audit Trail
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 uppercase tracking-wider">
              Immutable & Append-Only
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete cryptographic audit trail of all company changes, approvals, and user actions
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Filter by action (e.g. CHECK_IN)"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
          />
          <input
            type="text"
            placeholder="Filter by entity (e.g. Employee)"
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Retrieving audit log sequence..." />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No Audit Records"
            description="All administrative, employee, and HR actions will be permanently logged here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-4">Timestamp (Server UTC)</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Entity</th>
                  <th className="p-4">IP Address</th>
                  <th className="p-4 text-right">State Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4 font-mono text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">
                      {log.actorEmail}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {log.action}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      {log.entity}
                    </td>
                    <td className="p-4 text-slate-400 font-mono text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="p-4 text-right">
                      {(log.beforeJson || log.afterJson) && (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 text-xs font-semibold bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 rounded-lg inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View JSON
                        </button>
                      )}
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
            <span>Page {pagination.page} of {pagination.totalPages} ({pagination.total} events)</span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchLogs(pagination.page - 1)}
                className="px-3 py-1.5 rounded-lg border disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchLogs(pagination.page + 1)}
                className="px-3 py-1.5 rounded-lg border disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* JSON Diff Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Audit State Diff: {selectedLog.action} on {selectedLog.entity}
                </h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto font-mono text-xs">
              <div>
                <p className="font-bold text-slate-400 uppercase text-[10px] mb-1">State Before Change</p>
                <pre className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto text-slate-700 dark:text-slate-300">
                  {selectedLog.beforeJson ? JSON.stringify(selectedLog.beforeJson, null, 2) : 'null (Newly Created)'}
                </pre>
              </div>
              <div>
                <p className="font-bold text-emerald-500 uppercase text-[10px] mb-1">State After Change</p>
                <pre className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto text-emerald-600 dark:text-emerald-400">
                  {selectedLog.afterJson ? JSON.stringify(selectedLog.afterJson, null, 2) : 'null (Deleted)'}
                </pre>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogViewer;
