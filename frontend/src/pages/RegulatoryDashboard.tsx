import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePipelineStatus, useApproveRule, useRejectRule } from '../api/queries';

// Demo pending rule (hardcoded for this phase)
const DEMO_PENDING_RULE_ID = 1;

export const RegulatoryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: pipelineData } = usePipelineStatus();
  const [showAlert, setShowAlert] = useState(false);
  const [pendingDismissed, setPendingDismissed] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const approveRule = useApproveRule();
  const rejectRule = useRejectRule();

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleApprove = async () => {
    try {
      await approveRule.mutateAsync(DEMO_PENDING_RULE_ID);
      setPendingDismissed(true);
      showToast('✓ Rule approved and activated successfully.', 'success');
    } catch {
      showToast('Failed to approve rule. Please try again.', 'error');
    }
  };

  const handleReject = async () => {
    try {
      await rejectRule.mutateAsync(DEMO_PENDING_RULE_ID);
      setPendingDismissed(true);
      showToast('Rule rejected and sent back for revision.', 'success');
    } catch {
      showToast('Failed to reject rule. Please try again.', 'error');
    }
  };

  useEffect(() => {
    if (pipelineData?.status === 'COMPLETED') {
      setShowAlert(true);
    }
  }, [pipelineData?.status]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl border text-sm font-semibold transition-all animate-[slideDown_300ms_ease-out] ${
            toast.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {toast.message}
        </div>
      )}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Regulatory Command Center</h1>
          <p className="text-slate-500">Monitor guidelines and automate monitoring rules.</p>
        </div>
        <button 
          onClick={() => navigate('/dashboard/pipeline')}
          className="btn btn-primary shadow-md shadow-blue-500/20"
        >
          <span className="material-symbols-outlined text-sm mr-2">speed</span>
          Open Pipeline View
        </button>
      </div>

      {/* Alert Banner */}
      {showAlert && (
        <div className="bg-white border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm flex justify-between items-start animate-[slideDown_350ms_ease-out]">
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-red-500">warning</span>
            <div>
              <h3 className="font-bold text-slate-800">New FDA guideline detected.</h3>
              <p className="text-slate-600 text-sm mt-1">HRV threshold updated. Rule v1.3 is now active across all clinical trial sites.</p>
            </div>
          </div>
          <button onClick={() => setShowAlert(false)} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-surface p-5">
          <p className="text-slate-500 text-sm font-semibold mb-2">Guidelines Processed</p>
          <p className="text-3xl font-bold text-slate-800 tabular-nums">1,204</p>
        </div>
        <div className="card bg-surface p-5">
          <p className="text-slate-500 text-sm font-semibold mb-2">Rules Updated</p>
          <p className="text-3xl font-bold text-slate-800 tabular-nums">18</p>
        </div>
        <div className="card bg-surface p-5">
          <p className="text-slate-500 text-sm font-semibold mb-2">Time Saved</p>
          <p className="text-3xl font-bold text-primary tabular-nums">480 hrs</p>
        </div>
        <div className="card bg-surface p-5 border-l-4 border-amber-500 relative overflow-hidden">
          <p className="text-amber-700 text-sm font-semibold mb-2">Pending Approvals</p>
          <p className="text-3xl font-bold text-amber-600 tabular-nums">1</p>
          <span className="absolute -right-4 -bottom-4 text-amber-100 material-symbols-outlined text-7xl opacity-50">pending_actions</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Rule Diff & Approvals */}
        <div className="col-span-2 space-y-8">
          {/* Rule Diff Cards */}
          <div className="card bg-surface p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">rule</span>
                Latest Rule Update
              </h2>
              <span className="badge badge-primary">v1.3 ACTIVE</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Old Rule */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Previous Rule (v1.2)</span>
                  <span className="text-xs font-semibold text-slate-400">SUPERSEDED</span>
                </div>
                <div className="text-sm font-mono text-slate-600 line-through decoration-red-400 decoration-2">
                  IF HRV_SDNN &lt; 25ms
                </div>
                <div className="text-sm font-mono text-slate-600 mt-1">
                  THEN FLAG "AT RISK"
                </div>
              </div>

              {/* New Rule */}
              <div className="p-4 rounded-xl border-2 border-primary/20 bg-blue-50/50 relative">
                <div className="absolute top-4 right-4 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-bold text-primary uppercase tracking-wide">New Rule (v1.3)</span>
                </div>
                <div className="text-sm font-mono text-slate-800 bg-green-100/50 inline-block px-1 py-0.5 rounded">
                  IF HRV_SDNN &lt; 28ms
                </div>
                <div className="text-sm font-mono text-slate-800 mt-1">
                  THEN FLAG "AT RISK"
                </div>
                <div className="mt-4 text-xs text-slate-500 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                  Extracted via Gemini 2.0
                </div>
              </div>
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="card bg-surface p-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-amber-500">assignment_late</span>
              Pending Approvals
            </h2>
            {pendingDismissed ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2">check_circle</span>
                <p className="text-sm font-medium">No pending approvals</p>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="badge bg-amber-200 text-amber-800 mb-2">Low Confidence (68%)</span>
                    <h4 className="font-bold text-slate-800">EMA SpO2 Guideline update</h4>
                  </div>
                  <span className="text-sm text-slate-500">10 mins ago</span>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  "SpO2 levels dropping below 93% for more than 4 consecutive hours..."
                </p>
                <div className="flex gap-2">
                  <button
                    className="btn btn-primary py-1.5 px-4 text-sm disabled:opacity-60"
                    onClick={handleApprove}
                    disabled={approveRule.isPending || rejectRule.isPending}
                  >
                    {approveRule.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Approving...
                      </span>
                    ) : 'Approve Rule'}
                  </button>
                  <button
                    className="btn bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 py-1.5 px-4 text-sm disabled:opacity-60"
                    onClick={handleReject}
                    disabled={approveRule.isPending || rejectRule.isPending}
                  >
                    {rejectRule.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                        Rejecting...
                      </span>
                    ) : 'Reject / Modify'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Pipeline Status Bar & History */}
        <div className="space-y-8">
          {/* Pipeline Status */}
          <div className="card bg-surface p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-6">Last Pipeline Run</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm">check</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">1. Parse PDF</span>
                </div>
                <span className="text-xs font-mono text-slate-400">12ms</span>
              </div>
              
              <div className="w-0.5 h-4 bg-slate-200 ml-4"></div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm">check</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">2. Extract Rules</span>
                </div>
                <span className="text-xs font-mono text-slate-400">4s</span>
              </div>

              <div className="w-0.5 h-4 bg-slate-200 ml-4"></div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm">check</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">3. Re-evaluate Cohort</span>
                </div>
                <span className="text-xs font-mono text-slate-400">45s</span>
              </div>

              <div className="w-0.5 h-4 bg-slate-200 ml-4"></div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm">check</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">4. Generate Report</span>
                </div>
                <span className="text-xs font-mono text-slate-400">15s</span>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Total Run Time</span>
                <span className="font-mono font-bold text-slate-800">64.012s</span>
              </div>
            </div>
          </div>

          <div className="card bg-surface p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">Version History</h2>
              <button onClick={() => navigate('/dashboard/rules/history')} className="text-primary text-sm font-semibold hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <div>
                  <div className="text-sm font-bold text-slate-800">v1.3</div>
                  <div className="text-xs text-slate-500">HRV &lt; 28ms</div>
                </div>
                <span className="badge badge-primary">ACTIVE</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 opacity-60">
                <div>
                  <div className="text-sm font-bold text-slate-800">v1.2</div>
                  <div className="text-xs text-slate-500">HRV &lt; 25ms</div>
                </div>
                <span className="text-xs font-semibold text-slate-400">SUPERSEDED</span>
              </div>
              <div className="flex justify-between items-center py-2 opacity-60">
                <div>
                  <div className="text-sm font-bold text-slate-800">v1.1</div>
                  <div className="text-xs text-slate-500">HRV &lt; 20ms</div>
                </div>
                <span className="text-xs font-semibold text-slate-400">SUPERSEDED</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
