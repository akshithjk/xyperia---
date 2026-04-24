import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine,
} from 'recharts';

// ── Patient data ──────────────────────────────────────────────────────────────
interface Patient {
  id: string;
  gender: string;
  age: number;
  status: 'AT_RISK' | 'SAFE';
  hrv: number;
  spo2: number;
  hr: number;
  flaggedAgo?: string;
  trendData: { day: string; hrv: number }[];
  riskContext?: string;
}

const PATIENTS: Patient[] = [
  {
    id: 'PT-8091', gender: 'Female', age: 62, status: 'AT_RISK',
    hrv: 24, spo2: 96, hr: 72, flaggedAgo: '14 min ago',
    riskContext: 'Breached FDA threshold (28ms) in Rule v1.3. Would NOT have been flagged under v1.2 (25ms).',
    trendData: [
      { day: '1', hrv: 35 }, { day: '5', hrv: 33 }, { day: '10', hrv: 31 },
      { day: '15', hrv: 30 }, { day: '20', hrv: 29 }, { day: '25', hrv: 27 },
      { day: '28', hrv: 25 }, { day: '29', hrv: 24.5 }, { day: '30', hrv: 24 },
    ],
  },
  {
    id: 'PT-1102', gender: 'Male', age: 58, status: 'AT_RISK',
    hrv: 26, spo2: 97, hr: 76, flaggedAgo: '32 min ago',
    riskContext: 'HRV falling below v1.3 threshold. SpO2 stable. Continuous monitoring advised.',
    trendData: [
      { day: '1', hrv: 38 }, { day: '5', hrv: 36 }, { day: '10', hrv: 34 },
      { day: '15', hrv: 32 }, { day: '20', hrv: 30 }, { day: '25', hrv: 28 },
      { day: '28', hrv: 27 }, { day: '29', hrv: 26.5 }, { day: '30', hrv: 26 },
    ],
  },
  {
    id: 'PT-3319', gender: 'Female', age: 45, status: 'SAFE',
    hrv: 33, spo2: 98, hr: 68,
    trendData: [
      { day: '1', hrv: 34 }, { day: '5', hrv: 34 }, { day: '10', hrv: 33 },
      { day: '15', hrv: 33 }, { day: '20', hrv: 34 }, { day: '25', hrv: 33 },
      { day: '28', hrv: 33 }, { day: '30', hrv: 33 },
    ],
  },
  {
    id: 'PT-3329', gender: 'Male', age: 51, status: 'SAFE',
    hrv: 34, spo2: 98, hr: 71,
    trendData: [
      { day: '1', hrv: 35 }, { day: '5', hrv: 35 }, { day: '10', hrv: 34 },
      { day: '15', hrv: 35 }, { day: '20', hrv: 34 }, { day: '25', hrv: 34 },
      { day: '28', hrv: 34 }, { day: '30', hrv: 34 },
    ],
  },
  {
    id: 'PT-3339', gender: 'Female', age: 39, status: 'SAFE',
    hrv: 35, spo2: 98, hr: 65,
    trendData: [
      { day: '1', hrv: 36 }, { day: '5', hrv: 36 }, { day: '10', hrv: 35 },
      { day: '15', hrv: 36 }, { day: '20', hrv: 35 }, { day: '25', hrv: 35 },
      { day: '28', hrv: 35 }, { day: '30', hrv: 35 },
    ],
  },
  {
    id: 'PT-3349', gender: 'Male', age: 67, status: 'SAFE',
    hrv: 36, spo2: 98, hr: 74,
    trendData: [
      { day: '1', hrv: 37 }, { day: '5', hrv: 37 }, { day: '10', hrv: 36 },
      { day: '15', hrv: 37 }, { day: '20', hrv: 36 }, { day: '25', hrv: 36 },
      { day: '28', hrv: 36 }, { day: '30', hrv: 36 },
    ],
  },
];

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, ComposedChart, Area
} from 'recharts';
import { apiClient } from '../api/client';

export const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const cohortRef = useRef<HTMLDivElement>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);

  useEffect(() => {
    apiClient.get('/patients')
      .then(res => {
        const pts = res.data.data || [];
        setPatients(pts);
        if (pts.length > 0) {
          setSelectedId(pts[0].id);
        }
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (selectedId) {
      apiClient.get(`/patients/${selectedId}/readings`)
        .then(res => {
          const readings = res.data.readings || [];
          const formatted = readings.map((r: any, idx: number) => ({
            day: String(idx + 1),
            hrv: r.value
          }));
          setTrendData(formatted);
        })
        .catch(err => console.error(err));
    }
  }, [selectedId]);

  const selected = patients.find((p) => p.id === selectedId) || patients[0] || {} as any;
  const isRisk = selected.status === 'AT_RISK';
  const visiblePatients = showFlaggedOnly
    ? patients.filter((p) => p.status === 'AT_RISK')
    : patients;

  const handleReviewAll = () => {
    setShowFlaggedOnly(true);
    const firstFlagged = patients.find((p) => p.status === 'AT_RISK');
    if (firstFlagged) setSelectedId(firstFlagged.id);
    cohortRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const yDomain = isRisk ? [20, 40] : [28, 45];

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Top Row */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        {/* Site Context Card */}
        <div className="lg:w-[60%] bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
              <span className="material-symbols-outlined">local_hospital</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Apollo Hospitals, Chennai</h2>
              <p className="text-sm text-slate-500 font-medium">Site 3 of 10 • GlucoZen Phase III Trial</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-500">Active Patients</p>
            <p className="text-2xl font-bold text-slate-800 tabular-nums">45</p>
          </div>
        </div>

        {/* Alert Strip */}
        <div className="lg:w-[40%] bg-red-50 border border-red-200 border-l-4 border-l-red-500 rounded-r-xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500">notification_important</span>
            <div>
              <h3 className="font-bold text-red-800">Action Required</h3>
              <p className="text-sm text-red-600 font-medium">2 patients newly flagged for review.</p>
            </div>
          </div>
          <button
            onClick={handleReviewAll}
            className="btn bg-white text-red-700 border border-red-200 shadow-sm text-sm hover:bg-red-50 transition-colors"
          >
            {showFlaggedOnly ? (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFlaggedOnly(false);
                }}
                className="flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
                Show All
              </span>
            ) : 'Review All'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* Left: Patient Grid */}
        <div className="lg:w-[55%] space-y-6" ref={cohortRef}>
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800">
              Patient Cohort (Site 3)
              {showFlaggedOnly && (
                <span className="ml-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  Flagged Only
                </span>
              )}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFlaggedOnly(false)}
                className={`badge cursor-pointer transition-colors ${!showFlaggedOnly ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                All (45)
              </button>
              <button
                onClick={() => setShowFlaggedOnly(true)}
                className={`badge cursor-pointer transition-colors ${showFlaggedOnly ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
              >
                Flagged (2)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visiblePatients.map((p) => {
              const isSelected = p.id === selectedId;
              const pIsRisk = p.status === 'AT_RISK';
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`bg-white rounded-xl p-4 cursor-pointer relative overflow-hidden transition-all duration-200 ${
                    isSelected
                      ? 'border-2 border-primary shadow-lg shadow-blue-100'
                      : 'border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  {pIsRisk && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                  )}
                  <div className={`flex justify-between items-start mb-4 ${pIsRisk ? 'pl-2' : ''}`}>
                    <div>
                      <span className="font-mono text-lg font-bold text-slate-800">{p.id}</span>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                        {p.gender === 'Female' || p.gender === 'Male' ? `${p.gender} • ${p.age} yrs` : 'Demographic hidden'}
                      </p>
                    </div>
                    <span className={`badge border text-xs ${
                      pIsRisk
                        ? 'bg-red-100 text-red-700 border-red-200 animate-pulse'
                        : 'bg-green-100 text-green-700 border-green-200'
                    }`}>
                      {pIsRisk ? 'AT RISK' : 'SAFE'}
                    </span>
                  </div>
                  <div className={`space-y-2 ${pIsRisk ? 'pl-2' : ''}`}>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500 font-medium">HRV (30d)</span>
                      <span className={`text-xs font-bold ${pIsRisk ? 'text-red-600' : 'text-slate-700'}`}>
                        {p.hrv}ms
                        {pIsRisk && (
                          <span className="material-symbols-outlined text-[12px] align-middle ml-0.5">trending_down</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500 font-medium">SpO2</span>
                      <span className="text-xs font-bold text-slate-700">{p.spo2}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Sticky Detail Panel */}
        <div className="lg:w-[45%]">
          <div className="sticky top-24 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">

            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-mono font-bold text-slate-800">{selected.id}</h2>
                  <span className={`badge text-xs py-1 border ${
                    isRisk
                      ? 'bg-red-100 text-red-700 border-red-200'
                      : 'bg-green-100 text-green-700 border-green-200'
                  }`}>
                    {isRisk ? 'AT RISK' : 'SAFE'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">person</span>
                  {selected.gender} • {selected.age} yrs
                  {selected.flaggedAgo && (
                    <>
                      <span className="mx-1 text-slate-300">•</span>
                      <span className="material-symbols-outlined text-[14px]">history</span>
                      Flagged {selected.flaggedAgo}
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={() => navigate(`/dashboard/doctor/patient/${selected.id}/viz`)}
                className="btn bg-slate-800 text-white hover:bg-slate-700 shadow-lg text-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">view_in_ar</span>
                3D Body Scan
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* Mini Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className={`rounded-lg p-3 text-center border ${isRisk ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                  <div className={`text-xs font-medium mb-1 ${isRisk ? 'text-red-800' : 'text-green-800'}`}>HRV</div>
                  <div className={`text-xl font-bold ${isRisk ? 'text-red-600' : 'text-green-600'}`}>
                    {selected.hrv}<span className={`text-xs ml-1 ${isRisk ? 'text-red-400' : 'text-green-400'}`}>ms</span>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
                  <div className="text-xs font-medium text-slate-500 mb-1">SpO2</div>
                  <div className="text-xl font-bold text-slate-700">{selected.spo2}<span className="text-xs text-slate-400 ml-1">%</span></div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
                  <div className="text-xs font-medium text-slate-500 mb-1">Heart Rate</div>
                  <div className="text-xl font-bold text-slate-700">{selected.hr}<span className="text-xs text-slate-400 ml-1">bpm</span></div>
                </div>
              </div>

              {/* Chart — uses measured pixel width to guarantee rendering */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">monitoring</span>
                  30-Day HRV Trend
                </h3>
                <div
                  ref={chartContainerRef}
                  className="border border-slate-100 rounded-xl bg-slate-50 p-2 overflow-hidden"
                  style={{ height: 180 }}
                >
                  <ResponsiveContainer width="100%" height={156}>
                    <ComposedChart
                      data={trendData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                      <YAxis domain={yDomain} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 12 }}
                        itemStyle={{ color: '#0F172A', fontWeight: 'bold' }}
                        formatter={(v: number) => [`${v} ms`, 'HRV']}
                        labelFormatter={(l) => `Day ${l}`}
                      />
                      <ReferenceLine y={25} stroke="#94A3B8" strokeDasharray="4 4"
                        label={{ position: 'insideTopLeft', value: 'v1.2 (25ms)', fill: '#94A3B8', fontSize: 9 }} />
                      <ReferenceLine y={28} stroke="#EF4444"
                        label={{ position: 'insideBottomLeft', value: 'v1.3 (28ms)', fill: '#EF4444', fontSize: 9, fontWeight: 'bold' }} />
                      <Area type="monotone" dataKey="hrv" fill={isRisk ? '#fef2f2' : '#ecfdf5'} stroke="none" />
                      <Line
                        type="monotone" dataKey="hrv"
                        stroke={isRisk ? '#EF4444' : '#10B981'}
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: isRisk ? '#EF4444' : '#10B981', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 5 }}
                        isAnimationActive={true}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Rule Comparison — only shown for at-risk */}
              {isRisk && selected.riskContext && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-amber-500 mt-0.5">info</span>
                    <div>
                      <h4 className="text-sm font-bold text-amber-900 mb-1">Regulatory Context</h4>
                      <p className="text-xs text-amber-800 leading-relaxed mb-3">{selected.riskContext}</p>
                      <div className="flex gap-4 text-xs font-medium">
                        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-amber-100">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-slate-600">v1.2: SAFE</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-amber-100 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-slate-800 font-bold">v1.3: AT RISK</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="pt-2">
                <button
                  onClick={() => navigate('/dashboard/report/1092')}
                  className="btn w-full justify-center py-3 bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/30"
                >
                  <span className="material-symbols-outlined text-[18px] mr-2">download</span>
                  Download PV Safety Report
                </button>
                <p className="text-center text-[11px] text-slate-400 mt-3 uppercase tracking-wider font-semibold">
                  Scoped to Site 3 Only
                </p>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
