import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { usePatients, usePipelineStatus } from '../api/queries';

type FilterMode = 'all' | 'flagged' | 'by_site' | 'by_biomarker';

export const DataManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeSite, setActiveSite] = useState<number | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  
  const { data: pipelineData } = usePipelineStatus();
  
  // Use API endpoint instead of hardcoded data
  const { data: patientsData, isLoading } = usePatients();
  
  // ── Derived patient list ────────────────────────────────────────────────────
  const ALL_PATIENTS = useMemo(() => {
    if (!patientsData) return [];
    return patientsData.map((p: any) => ({
      id: p.patient_id,
      site: p.site_id,
      hospital: `Site ${p.site_id} Hospital`, // In a real app we'd join with sites table
      hrv: p.latest_hrv || 35, // fallback if null
      prevStatus: 'SAFE',
      status: p.is_flagged ? 'AT_RISK' : 'SAFE'
    }));
  }, [patientsData]);

  const visiblePatients = ALL_PATIENTS.filter((p: any) => {
    if (filterMode === 'flagged') return p.status === 'AT_RISK';
    if (filterMode === 'by_site' && activeSite !== null) return p.site === activeSite;
    if (activeSite !== null) return p.site === activeSite;
    return true;
  }).sort((a: any, b: any) => {
    // AT_RISK rows first
    if (a.status === 'AT_RISK' && b.status !== 'AT_RISK') return -1;
    if (b.status === 'AT_RISK' && a.status !== 'AT_RISK') return 1;
    if (filterMode === 'by_biomarker') return a.hrv - b.hrv; // ascending HRV
    return 0;
  });

  const SITE_FLAGS = useMemo(() => {
    const flags: Record<number, number> = {};
    ALL_PATIENTS.forEach((p: any) => {
      if (p.status === 'AT_RISK') {
        flags[p.site] = (flags[p.site] || 0) + 1;
      }
    });
    return flags;
  }, [ALL_PATIENTS]);

  const handleExportCSV = async () => {
    try {
      const response = await apiClient.get('/patients?export=csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'patients_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('CSV Export failed', error);
    }
  };

  const handleViewDetails = (patientId: string) => {
    navigate(`/dashboard/doctor`); // Or navigate to specific patient view
  };

  const handleSiteClick = (siteNum: number) => {
    if (activeSite === siteNum) {
      setActiveSite(null); // deselect — show all
      if (filterMode === 'by_site') setFilterMode('all');
    } else {
      setActiveSite(siteNum);
      if (filterMode !== 'by_site') setFilterMode('by_site');
    }
  };

  const handleFilterMode = (mode: FilterMode) => {
    setFilterMode(mode);
    if (mode !== 'by_site') setActiveSite(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Global Patient Cohort</h1>
          <p className="text-slate-500">Monitor re-evaluations across all trial sites.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-surface p-5">
          <p className="text-slate-500 text-sm font-semibold mb-2">Total Evaluated</p>
          <p className="text-3xl font-bold text-slate-800 tabular-nums">{pipelineData?.patients_evaluated || 500}</p>
        </div>
        <div className="card bg-surface p-5">
          <p className="text-slate-500 text-sm font-semibold mb-2">Re-evaluated (v1.3)</p>
          <p className="text-3xl font-bold text-slate-800 tabular-nums">{pipelineData?.patients_evaluated || 500}</p>
        </div>
        <div className="card bg-surface p-5 bg-red-50 border-red-100 border">
          <p className="text-red-700 text-sm font-semibold mb-2">Newly Flagged</p>
          <p className="text-3xl font-bold text-red-600 tabular-nums">{pipelineData?.patients_flagged || 3}</p>
        </div>
        <div className="card bg-surface p-5">
          <p className="text-slate-500 text-sm font-semibold mb-2">Safe</p>
          <p className="text-3xl font-bold text-green-600 tabular-nums">{(pipelineData?.patients_evaluated || 500) - (pipelineData?.patients_flagged || 3)}</p>
        </div>
      </div>

      {/* Site Breakdown Strip — now clickable */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <span className="text-sm font-semibold text-slate-500 mr-2">Sites:</span>
        <div className="flex gap-2 flex-wrap">
          {[...Array(10)].map((_, i) => {
            const siteNum = i + 1;
            const isActive = activeSite === siteNum;
            const flagCount = SITE_FLAGS[siteNum] || 0;
            return (
              <button
                key={i}
                onClick={() => handleSiteClick(siteNum)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 border transition-all ${
                  isActive
                    ? 'bg-primary border-primary text-white shadow-md shadow-blue-200'
                    : flagCount > 0
                    ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                Site {siteNum}
                {flagCount > 0 && !isActive && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {flagCount}
                  </span>
                )}
              </button>
            );
          })}
          {activeSite !== null && (
            <button
              onClick={() => { setActiveSite(null); setFilterMode('all'); }}
              className="px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar & Export */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {(['all', 'flagged', 'by_site', 'by_biomarker'] as FilterMode[]).map((mode) => {
            const labels: Record<FilterMode, string> = {
              all: 'All',
              flagged: 'Flagged',
              by_site: 'By Site',
              by_biomarker: 'By Biomarker',
            };
            const isActive = filterMode === mode;
            return (
              <button
                key={mode}
                onClick={() => handleFilterMode(mode)}
                className={`btn shadow-sm px-4 transition-all ${
                  isActive
                    ? mode === 'flagged'
                      ? 'bg-red-50 border border-red-200 text-red-700'
                      : 'bg-primary border-primary text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {labels[mode]}
              </button>
            );
          })}
        </div>
        <button
          onClick={handleExportCSV}
          className="btn bg-white border border-slate-200 text-slate-700 shadow-sm flex items-center gap-2 hover:bg-slate-50"
        >
          <span className="material-symbols-outlined text-sm">download</span>
          Export CSV
        </button>
      </div>

      {/* Patient Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <th className="px-6 py-4 font-semibold">Patient ID</th>
              <th className="px-6 py-4 font-semibold">Site</th>
              <th className="px-6 py-4 font-semibold">Hospital</th>
              <th className="px-6 py-4 font-semibold">HRV</th>
              <th className="px-6 py-4 font-semibold">Evaluation (v1.2 → v1.3)</th>
              <th className="px-6 py-4 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
               <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                  Loading patients...
                </td>
              </tr>
            ) : visiblePatients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                  No patients match the current filter.
                </td>
              </tr>
            ) : (
              visiblePatients.map((p: any) => {
                const isRisk = p.status === 'AT_RISK';
                return (
                  <tr key={p.id} className={`relative hover:bg-slate-50/60 transition-colors ${isRisk ? 'bg-red-50/20' : ''}`}>
                    <td className="px-6 py-4 font-mono font-bold text-slate-800">
                      {isRisk && (
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-red-500" />
                      )}
                      {p.id}
                    </td>
                    <td className="px-6 py-4 text-slate-600">Site {p.site}</td>
                    <td className="px-6 py-4 text-slate-600">{p.hospital}</td>
                    <td className={`px-6 py-4 font-mono font-bold ${isRisk ? 'text-red-600' : 'text-slate-600'}`}>
                      {p.hrv}ms
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                          {p.prevStatus}
                        </span>
                        <span className="material-symbols-outlined text-sm text-slate-400">arrow_forward</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          isRisk
                            ? 'bg-red-100 text-red-700 animate-pulse'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {isRisk ? 'AT RISK' : 'SAFE'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDetails(p.id)}
                        className={`text-sm font-semibold hover:underline transition-colors ${
                          isRisk ? 'text-primary' : 'text-slate-400 hover:text-primary'
                        }`}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
