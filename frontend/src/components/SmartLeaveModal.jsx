import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, FileText, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import api from '../api/client';

const SmartLeaveModal = ({ isOpen, onClose, onSuccess }) => {
  const [sentence, setSentence] = useState('');
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Pre-filled form state
  const [extracted, setExtracted] = useState(null);
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [workingDays, setWorkingDays] = useState(0);

  useEffect(() => {
    if (isOpen) {
      api.get('/org/leave-types')
        .then(res => setLeaveTypes(res.data))
        .catch(err => console.error(err));
      setSentence('');
      setExtracted(null);
      setError(null);
    }
  }, [isOpen]);

  const handleAnalyze = async () => {
    if (!sentence.trim()) return;
    setAnalyzing(true);
    setError(null);

    try {
      const res = await api.post('/ai/smart-leave', { sentence });
      const data = res.data;

      setExtracted(data);
      setFormData({
        leaveTypeId: data.leaveTypeId || (leaveTypes[0]?._id || ''),
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason
      });

      // Calculate working days
      if (data.startDate && data.endDate) {
        const daysRes = await api.get(`/leave/calculate-days?startDate=${data.startDate}&endDate=${data.endDate}`);
        setWorkingDays(daysRes.data.workingDays);
      }
    } catch (err) {
      setError('Could not automatically parse the sentence. Please fill out the form manually below.');
      setExtracted({
        leaveTypeId: leaveTypes[0]?._id || '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: sentence
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDateChange = async (startDate, endDate) => {
    setFormData(prev => ({ ...prev, startDate, endDate }));
    if (startDate && endDate && startDate <= endDate) {
      try {
        const daysRes = await api.get(`/leave/calculate-days?startDate=${startDate}&endDate=${endDate}`);
        setWorkingDays(daysRes.data.workingDays);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.post('/leave/apply', formData);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171C18]/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-[#222922] rounded-xl shadow-modal border border-[#E1E4D9] dark:border-[#384238] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#E1E4D9] dark:border-[#384238] flex items-center justify-between bg-[#29372D] dark:bg-[#1B211C] text-[#F5F3EB]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#A3B18A]" />
            <h3 className="font-semibold text-xs tracking-tight">Smart Leave Assistant</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-[#A3B18A] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[#B64D45]/10 border border-[#B64D45]/30 flex items-start gap-2 text-[#B64D45] dark:text-[#D2635B] text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Natural language input */}
          {!extracted ? (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#252A24] dark:text-[#EEF1E9] uppercase tracking-wider mb-2">
                  Describe your leave request
                </label>
                <textarea
                  value={sentence}
                  onChange={(e) => setSentence(e.target.value)}
                  rows={4}
                  placeholder="e.g. Need next Monday and Tuesday off for my sister's wedding, or Kal doctor ke pas jana hai is liye sick leave chahiye"
                  className="w-full p-3 rounded-lg bg-[#F5F3EB]/50 dark:bg-[#1B211C] border border-[#E1E4D9] dark:border-[#384238] text-xs focus:ring-1 focus:ring-[#75866A] focus:outline-none text-[#252A24] dark:text-[#EEF1E9] placeholder:text-[#858A80] dark:placeholder:text-[#929D8D]"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSentence("Need next Monday and Tuesday off for my sister's wedding")}
                  className="text-xs bg-[#EDEFE6] dark:bg-[#293229] hover:bg-[#E1E7D8] dark:hover:bg-[#303C30] p-2 rounded-lg text-[#252A24] dark:text-[#EEF1E9] transition-colors"
                >
                  ⚡ Try: "Need next Monday and Tuesday off for sister's wedding"
                </button>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-[#E1E4D9] dark:border-[#384238] text-xs font-medium hover:bg-[#E8EBE0] dark:hover:bg-[#2C352C] text-[#697064] dark:text-[#B1B9AC] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!sentence.trim() || analyzing}
                  className="px-4 py-2 rounded-lg bg-[#29372D] hover:bg-[#1e2720] text-[#F5F3EB] dark:bg-[#A3B18A] dark:hover:bg-[#8A9A71] dark:text-[#171C18] text-xs font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors shadow-none"
                >
                  {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Extract & Pre-Fill Form
                </button>
              </div>
            </div>
          ) : (
            /* Pre-filled form confirmation */
            <form onSubmit={handleConfirmSubmit} className="space-y-3.5">
              <div className="p-3 bg-[#477A57]/10 border border-[#477A57]/30 rounded-lg flex items-center gap-2 text-xs text-[#477A57] dark:text-[#5E9E72] font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>AI extracted leave parameters from your text. Please verify and confirm.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252A24] dark:text-[#EEF1E9] mb-1">
                  Leave Type
                </label>
                <select
                  value={formData.leaveTypeId}
                  onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                  required
                  className="w-full p-2 rounded-lg bg-[#F5F3EB]/50 dark:bg-[#1B211C] border border-[#E1E4D9] dark:border-[#384238] text-xs text-[#252A24] dark:text-[#EEF1E9] focus:outline-none focus:ring-1 focus:ring-[#75866A]"
                >
                  {leaveTypes.map(lt => (
                    <option key={lt._id} value={lt._id}>
                      {lt.name} ({lt.yearlyQuota < 0 ? 'Unlimited' : `${lt.yearlyQuota} days`})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#252A24] dark:text-[#EEF1E9] mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleDateChange(e.target.value, formData.endDate)}
                    required
                    className="w-full p-2 rounded-lg bg-[#F5F3EB]/50 dark:bg-[#1B211C] border border-[#E1E4D9] dark:border-[#384238] text-xs text-[#252A24] dark:text-[#EEF1E9] focus:outline-none focus:ring-1 focus:ring-[#75866A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#252A24] dark:text-[#EEF1E9] mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleDateChange(formData.startDate, e.target.value)}
                    required
                    className="w-full p-2 rounded-lg bg-[#F5F3EB]/50 dark:bg-[#1B211C] border border-[#E1E4D9] dark:border-[#384238] text-xs text-[#252A24] dark:text-[#EEF1E9] focus:outline-none focus:ring-1 focus:ring-[#75866A]"
                  />
                </div>
              </div>

              {workingDays > 0 && (
                <div className="text-xs text-[#252A24] dark:text-[#EEF1E9] font-medium bg-[#EDEFE6] dark:bg-[#293229] border border-[#E1E4D9] dark:border-[#384238] p-2.5 rounded-lg">
                  Total working days requested (excluding weekends & holidays): <strong className="text-[#477A57] dark:text-[#5E9E72]">{workingDays} day(s)</strong>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#252A24] dark:text-[#EEF1E9] mb-1">
                  Reason
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={2}
                  required
                  className="w-full p-2 rounded-lg bg-[#F5F3EB]/50 dark:bg-[#1B211C] border border-[#E1E4D9] dark:border-[#384238] text-xs text-[#252A24] dark:text-[#EEF1E9] focus:outline-none focus:ring-1 focus:ring-[#75866A]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setExtracted(null)}
                  className="px-4 py-2 rounded-lg border border-[#E1E4D9] dark:border-[#384238] text-xs font-medium hover:bg-[#E8EBE0] dark:hover:bg-[#2C352C] text-[#697064] dark:text-[#B1B9AC] transition-colors"
                >
                  Back to Prompt
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-[#29372D] hover:bg-[#1e2720] text-[#F5F3EB] dark:bg-[#A3B18A] dark:hover:bg-[#8A9A71] dark:text-[#171C18] text-xs font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors shadow-none"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Confirm & Submit Leave
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartLeaveModal;
