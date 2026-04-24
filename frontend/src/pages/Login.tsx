import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const navigate = useNavigate();

  const handleRoleSelect = (role: 'REGULATORY_AFFAIRS' | 'DATA_MANAGER' | 'DOCTOR', path: string) => {
    // We will navigate to the sub-login screens as per plan, or directly login.
    // The plan specifies: Screen 2A: /login/regulatory etc.
    navigate(path);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background py-10 px-4">
      {/* Logo & Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center text-white mx-auto shadow-md mb-4">
          <span className="material-symbols-outlined text-[40px]">shield</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">ReguVigil</h1>
        <p className="text-slate-500 mt-2">Regulatory Intelligence. In Real Time.</p>
      </div>

      <div className="w-full max-w-4xl">
        <h2 className="text-xl font-semibold text-center mb-8 text-slate-700">Select your role to continue</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Priya */}
          <div className="card role-card bg-surface p-6 flex flex-col h-full" onClick={() => handleRoleSelect('REGULATORY_AFFAIRS', '/login/regulatory')}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-primary font-bold text-xl">PS</div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Priya S.</h3>
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">Regulatory Affairs</span>
              </div>
            </div>
            <div className="flex-1 space-y-3 mb-6 font-medium text-sm text-slate-600">
              <div className="flex items-start gap-2"><span className="text-green-500">✓</span> Manages Guidelines & Rules</div>
              <div className="flex items-start gap-2"><span className="text-green-500">✓</span> Triggers AI Pipeline</div>
              <div className="flex items-start gap-2 text-slate-400"><span className="text-red-400">✗</span> No access to Patient PHI</div>
            </div>
            <button className="btn btn-primary w-full justify-center mt-auto">
              Login as Priya <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          {/* Arjun (Featured) */}
          <div className="card role-card bg-surface p-6 flex flex-col h-full featured ring-2 ring-primary ring-opacity-50" onClick={() => handleRoleSelect('DATA_MANAGER', '/login/datamanager')}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-xl">AM</div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Arjun M.</h3>
                <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Data Manager</span>
              </div>
            </div>
            <div className="flex-1 space-y-3 mb-6 font-medium text-sm text-slate-600">
              <div className="flex items-start gap-2"><span className="text-green-500">✓</span> Re-evaluates Patient Cohorts</div>
              <div className="flex items-start gap-2"><span className="text-green-500">✓</span> CSV Reporting & Auditing</div>
              <div className="flex items-start gap-2 text-slate-400"><span className="text-red-400">✗</span> No access to Doctor Profiles</div>
            </div>
            <button className="btn w-full justify-center mt-auto bg-amber-600 text-white hover:bg-amber-700">
              Login as Arjun <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          {/* Dr. Ramesh */}
          <div className="card role-card bg-surface p-6 flex flex-col h-full" onClick={() => handleRoleSelect('DOCTOR', '/login/doctor')}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-xl">DR</div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Dr. Ramesh K.</h3>
                <span className="text-xs font-semibold text-teal-600 uppercase tracking-wide">Principal Investigator</span>
              </div>
            </div>
            <div className="flex-1 space-y-3 mb-6 font-medium text-sm text-slate-600">
              <div className="flex items-start gap-2"><span className="text-green-500">✓</span> Site 3 Patient Monitoring</div>
              <div className="flex items-start gap-2"><span className="text-green-500">✓</span> PV Safety Reports & Vitals</div>
              <div className="flex items-start gap-2 text-slate-400"><span className="text-red-400">✗</span> Scoped to Site 3 only</div>
            </div>
            <button className="btn btn-teal w-full justify-center mt-auto">
              Login as Dr. Ramesh <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
        DEMO MODE
      </div>
    </div>
  );
};
