import React, { useState, useEffect, useRef } from 'react';
import { usePipelineStatus, useTriggerPipeline, usePipelineLogs } from '../api/queries';
import { apiClient } from '../api/client';

const AgentNode = ({ agent }: { agent: any }) => (
  <div className={`relative p-4 w-64 rounded-xl border-2 transition-all duration-500 flex-shrink-0 ${
    agent.status === 'RUNNING' ? 'border-blue-500 bg-blue-950 shadow-blue-500/30 shadow-lg' :
    agent.status === 'COMPLETE' ? 'border-green-500 bg-green-950' :
    agent.status === 'ERROR' ? 'border-red-500 bg-red-950' :
    'border-slate-700 bg-slate-900'
  }`}>
    {agent.status === 'RUNNING' && (
      <span className="absolute -top-1 -right-1 w-3 h-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
      </span>
    )}
    <div className="text-xs text-slate-400 font-mono">{agent.id}.</div>
    <div className="font-semibold text-white mt-1">{agent.name}</div>
    <div className="text-xs text-blue-300 font-mono mt-1 bg-slate-800/50 inline-block px-1.5 py-0.5 rounded">{agent.tech}</div>
    {agent.duration_ms && <div className="text-xs text-green-400 mt-2 font-mono">{(agent.duration_ms/1000).toFixed(1)}s</div>}
  </div>
);

const FlowArrow = ({ active }: { active: boolean }) => (
  <div className="flex items-center mx-2 w-12 flex-shrink-0">
    <div className={`h-0.5 w-full relative overflow-hidden ${active ? 'bg-blue-900' : 'bg-slate-800'}`}>
      {active && <div className="absolute inset-y-0 w-4 bg-blue-400 animate-[slide_1s_linear_infinite]" />}
    </div>
    <span className={`material-symbols-outlined text-[14px] -ml-2 ${active ? 'text-blue-400' : 'text-slate-700'}`}>arrow_forward_ios</span>
  </div>
);

export const PipelineLiveView: React.FC = () => {
  const { data: pipelineData } = usePipelineStatus();
  const pipelineState = pipelineData?.overall_status || 'IDLE';
  const pipelineId = pipelineData?.pipeline_id;
  
  const { data: logData } = usePipelineLogs(pipelineId);
  const logs = logData?.logs || [];
  const logsEndRef = useRef<HTMLDivElement>(null);

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        await apiClient.post('/guidelines/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        // Success
      } catch (error) {
        console.error("Upload failed", error);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const agents = pipelineData?.agents || [
    { id: 1, name: 'Regulatory Parser', tech: 'Gemini 2.0 Flash', status: 'IDLE' },
    { id: 2, name: 'Rule Extractor', tech: 'JSON Diff', status: 'IDLE' },
    { id: 3, name: 'Biomarker Sentinel', tech: 'AsyncPG', status: 'IDLE' },
    { id: 4, name: 'PV Reporter', tech: 'Jinja2 + WeasyPrint', status: 'IDLE' }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <style>{`
        @keyframes slide { from { left: -20px } to { left: 100% } }
      `}</style>
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pipeline Live View</h1>
          <p className="text-slate-500">Monitor the end-to-end multi-agent system execution.</p>
        </div>
        <button 
          onClick={handleUploadClick}
          disabled={pipelineState === 'RUNNING' || uploading}
          className={`btn ${pipelineState === 'RUNNING' || uploading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'btn-primary shadow-md shadow-blue-500/20'}`}
        >
          <span className="material-symbols-outlined mr-2">{uploading ? 'hourglass_empty' : 'upload_file'}</span>
          {uploading ? 'Uploading...' : 'Upload PDF & Run Pipeline'}
        </button>
      </div>

      {/* Nodes Flow */}
      <div className="bg-slate-950 rounded-2xl p-8 border border-slate-800 overflow-x-auto shadow-2xl">
        <div className="flex items-center min-w-max">
          {agents.map((agent: any, idx: number) => (
            <React.Fragment key={agent.id}>
              <AgentNode agent={agent} />
              {idx < agents.length - 1 && (
                <FlowArrow active={agent.status === 'COMPLETE' && agents[idx+1].status !== 'COMPLETE'} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Terminal Log */}
        <div className="col-span-2 bg-[#0F172A] rounded-xl p-4 border border-slate-800 shadow-xl overflow-hidden h-96 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-3">
            <h3 className="text-slate-300 font-mono text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">terminal</span>
              System Logs
            </h3>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto font-mono text-xs leading-relaxed space-y-1 custom-scrollbar">
            {logs.length === 0 ? (
              <div className="text-slate-500">Waiting for pipeline trigger...</div>
            ) : (
              logs.map((log: any, i: number) => (
                <div key={i} className={`${
                  log.level === 'SUCCESS' ? 'text-green-400 font-bold mt-2' :
                  log.level === 'ERROR' ? 'text-red-400' :
                  log.level === 'WARN' ? 'text-amber-300' :
                  log.message.includes('STARTED') ? 'text-blue-400 mt-2' :
                  log.message.includes('COMPLETE') ? 'text-green-300' :
                  'text-slate-300'
                }`}>
                  <span className="text-slate-600 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  {log.message}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Run Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Execution Summary</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500 text-sm">Status</span>
              <span className={`badge ${pipelineState === 'COMPLETE' || pipelineState === 'COMPLETED' ? 'badge-primary' : pipelineState === 'RUNNING' ? 'bg-blue-100 text-blue-800 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
                {pipelineState}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500 text-sm">Patients Evaluated</span>
              <span className="font-mono text-sm text-slate-800">{pipelineData?.patients_evaluated || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500 text-sm">Patients Flagged</span>
              <span className="font-mono text-sm text-red-600 font-bold">{pipelineData?.patients_flagged || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500 text-sm">Total Time</span>
              <span className="font-mono text-sm text-slate-800">
                {pipelineData?.total_elapsed_ms ? `${(pipelineData.total_elapsed_ms / 1000).toFixed(3)}s` : '-'}
              </span>
            </div>
          </div>

          {(pipelineState === 'COMPLETE' || pipelineState === 'COMPLETED') && (
            <div className="mt-8 animate-[slideDown_300ms_ease-out]">
              <button onClick={() => window.location.href='/dashboard/regulatory'} className="btn btn-ghost w-full justify-center text-primary hover:bg-blue-50 border border-blue-100">
                Return to Dashboard
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
