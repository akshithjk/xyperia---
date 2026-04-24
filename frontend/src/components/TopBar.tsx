import React from 'react';
import { RoleSwitcher } from './RoleSwitcher';

export const TopBar: React.FC = () => {
  return (
    <header className="topbar flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-bold shadow-sm">
          <span className="material-symbols-outlined text-[20px]">shield</span>
        </div>
        <span className="font-bold text-lg tracking-tight text-slate-800">ReguVigil</span>
        <Badge />
      </div>
      
      <div className="flex items-center gap-4">
        <RoleSwitcher />
      </div>
    </header>
  );
};

const Badge = () => (
  <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-widest">
    Demo
  </span>
);
