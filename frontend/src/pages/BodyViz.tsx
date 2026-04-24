import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const mockData = [
  { day: '1', hrv: 35 }, { day: '10', hrv: 31 }, 
  { day: '20', hrv: 29 }, { day: '28', hrv: 25 }, { day: '30', hrv: 24 }
];

export const BodyViz: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  return (
    <div className="h-[calc(100vh-64px)] w-full bg-[#0F172A] flex overflow-hidden">
      
      {/* Left Data Panel (420px Fixed) */}
      <div className="w-[420px] bg-[#1E293B] border-r border-slate-700/50 flex flex-col h-full shadow-2xl z-10 relative">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => navigate('/dashboard/doctor')}
              className="w-8 h-8 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center hover:bg-slate-600 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <h1 className="text-xl font-bold text-white tracking-wide">Patient Scan</h1>
          </div>
          
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-mono font-bold text-white">{id || 'PT-8091'}</h2>
              <p className="text-slate-400 text-sm mt-1">Female • 62 yrs • Site 3</p>
            </div>
            <span className="badge bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">AT RISK</span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Biomarkers */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Live Vitals</h3>
            <div className="space-y-3">
              <div className="bg-slate-800/50 rounded-lg p-3 border border-red-500/20 flex justify-between items-center relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                <div>
                  <div className="text-sm text-slate-400">HRV (SDNN)</div>
                  <div className="text-2xl font-bold text-white tracking-tight">24<span className="text-xs text-red-400 ml-1">ms</span></div>
                </div>
                <div className="h-10 w-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockData}>
                      <Line type="monotone" dataKey="hrv" stroke="#EF4444" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 flex justify-between items-center">
                <div>
                  <div className="text-sm text-slate-400">SpO2</div>
                  <div className="text-xl font-bold text-slate-200 tracking-tight">96<span className="text-xs text-slate-500 ml-1">%</span></div>
                </div>
                <span className="material-symbols-outlined text-green-400 text-2xl">favorite</span>
              </div>
            </div>
          </div>

          {/* Regulatory Context */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Rule Violation</h3>
            <div className="bg-[#0F172A] rounded-xl p-4 border border-slate-700 shadow-inner">
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-700/50">
                <span className="text-sm font-bold text-primary">v1.3 Active</span>
                <span className="text-xs font-mono text-slate-400">HRV &lt; 28ms</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Patient HRV of <span className="text-red-400 font-bold">24ms</span> breaches the active threshold. 
                They would have been considered SAFE under the superseded v1.2 rule (25ms).
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-700/50">
            <button 
              onClick={() => navigate('/dashboard/report/1092')}
              className="w-full bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border border-teal-500/30 rounded-lg py-3 flex items-center justify-center gap-2 font-bold transition-all"
            >
              <span className="material-symbols-outlined">download</span>
              View PV Safety Report
            </button>
          </div>
        </div>
      </div>

      {/* Right Body Viz (3D Simulation) */}
      <div className="flex-1 relative flex justify-center items-center overflow-hidden">
        
        {/* Abstract Tech Background Elements */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-[#0F172A] to-[#0F172A]"></div>
          {/* A grid background */}
          <div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(#1E293B 1px, transparent 1px), linear-gradient(90deg, #1E293B 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        </div>

        {/* 3D Model Placeholder / Video Fallback */}
        <div className="relative z-10 w-full h-full flex justify-center items-center">
          
          {/* We would use a <video> here, but since the asset is missing, we use a CSS abstract figure */}
          <div className="relative h-[80vh] aspect-[1/2] opacity-80 mix-blend-screen flex justify-center items-center">
            {/* Abstract Human Silhouette using borders/gradients */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-400/20 via-teal-400/10 to-transparent blur-3xl rounded-full scale-50"></div>
            
            {/* Outline */}
            <svg viewBox="0 0 200 500" className="w-full h-full drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]">
              <path d="M100,20 C120,20 130,35 130,55 C130,80 110,85 100,90 C90,85 70,80 70,55 C70,35 80,20 100,20 Z" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" />
              <path d="M70,95 C40,95 20,110 20,150 L30,280 C30,300 50,300 50,280 L60,180 L60,300 L40,480 C40,490 60,490 65,480 L85,320 L100,340 L115,320 L135,480 C140,490 160,490 160,480 L140,300 L140,180 L150,280 C150,300 170,300 170,280 L180,150 C180,110 160,95 130,95 L70,95 Z" fill="none" stroke="#38bdf8" strokeWidth="2" opacity="0.6"/>
              
              {/* Spine nodes */}
              {[120, 160, 200, 240, 280].map(y => (
                <circle key={y} cx="100" cy={y} r="3" fill="#38bdf8" opacity="0.8" />
              ))}
              
              {/* Connections */}
              <line x1="100" y1="120" x2="60" y2="180" stroke="#38bdf8" strokeWidth="1" opacity="0.3" />
              <line x1="100" y1="120" x2="140" y2="180" stroke="#38bdf8" strokeWidth="1" opacity="0.3" />
            </svg>

            {/* Heart Node (Pulsing Red) */}
            <div className="absolute top-[28%] left-1/2 -translate-x-[20px] -translate-y-1/2 z-20">
              <div className="relative flex justify-center items-center w-4 h-4">
                <span className="absolute inline-flex h-20 w-20 rounded-full bg-red-500 opacity-20 animate-[ping_2s_ease-in-out_infinite]"></span>
                <span className="absolute inline-flex h-12 w-12 rounded-full bg-red-500 opacity-40 animate-[ping_2s_ease-in-out_infinite_0.5s]"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 shadow-[0_0_20px_rgba(239,68,68,1)]"></span>
                
                {/* Pointer Line */}
                <div className="absolute left-4 top-1/2 w-32 h-[1px] bg-red-500/50 origin-left -rotate-12"></div>
                
                {/* Label Overlay */}
                <div className="absolute left-32 -top-8 bg-slate-900/80 border border-red-500/50 backdrop-blur px-3 py-2 rounded shadow-2xl whitespace-nowrap z-30">
                  <div className="text-red-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">warning</span>
                    Cardiac Anomaly
                  </div>
                  <div className="flex items-center gap-2 text-white font-mono text-sm">
                    HRV SDNN: 24ms
                    {/* Animated Heartbeat Line */}
                    <svg className="w-8 h-4 text-red-500" viewBox="0 0 50 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M0,10 L10,10 L15,0 L25,20 L30,10 L50,10" strokeDasharray="60" strokeDashoffset="60" className="animate-[dash_2s_linear_infinite]" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Wrist Nodes (Teal Glow) */}
            <div className="absolute top-[52%] left-[12%] z-20">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,1)]"></span>
            </div>
            <div className="absolute top-[52%] right-[12%] z-20">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,1)]"></span>
            </div>

          </div>
        </div>

        {/* Floating Metrics HUD */}
        <div className="absolute top-8 right-8 flex gap-4 z-20">
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700 rounded-lg p-3 text-center w-24">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Status</div>
            <div className="text-sm font-bold text-red-400 animate-pulse">AT RISK</div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700 rounded-lg p-3 text-center w-24">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Scan Sync</div>
            <div className="text-sm font-mono text-green-400 animate-pulse">LIVE</div>
          </div>
        </div>

        {/* Input Box for AI Copilot */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg z-20">
          <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-2 flex items-center shadow-2xl">
            <span className="material-symbols-outlined text-slate-400 ml-3 mr-2">smart_toy</span>
            <input 
              type="text" 
              placeholder="Ask about this patient's condition..." 
              className="flex-1 bg-transparent border-none text-white focus:outline-none focus:ring-0 text-sm py-2 px-2 placeholder-slate-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = e.currentTarget.value;
                  if (val) {
                    alert(`AI Copilot Context for PT-8091:\nPatient shows 30-day HRV decline. Secondary diagnostics recommended.`);
                    e.currentTarget.value = '';
                  }
                }
              }}
            />
            <button className="bg-primary hover:bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-sm">send</span>
            </button>
          </div>
        </div>

      </div>
      <style>{`
        @keyframes dash {
          0% { stroke-dashoffset: 60; }
          50% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -60; }
        }
      `}</style>
    </div>
  );
};
