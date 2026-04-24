import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const RoleSwitcher: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    if (newRole === 'login') {
      localStorage.removeItem('jwt');
      localStorage.removeItem('userRole');
      navigate('/login');
      return;
    }
    
    localStorage.setItem('userRole', newRole);
    // Dummy JWT for the demo role switch
    localStorage.setItem('jwt', `dummy_jwt_for_${newRole}`);
    
    if (newRole === 'REGULATORY_AFFAIRS') navigate('/dashboard/regulatory');
    else if (newRole === 'DATA_MANAGER') navigate('/dashboard/datamanager');
    else if (newRole === 'DOCTOR') navigate('/dashboard/doctor');
  };

  if (location.pathname === '/login' || location.pathname === '/') return null;

  const currentRole = localStorage.getItem('userRole') || '';

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 font-medium">DEMO ROLE:</span>
      <select 
        value={currentRole} 
        onChange={handleRoleChange}
        className="text-sm border border-slate-200 rounded px-2 py-1 bg-slate-50 outline-none hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <option value="REGULATORY_AFFAIRS">Priya (Regulatory)</option>
        <option value="DATA_MANAGER">Arjun (Data Mgr)</option>
        <option value="DOCTOR">Dr. Ramesh (PI)</option>
        <option value="login">Logout</option>
      </select>
    </div>
  );
};
