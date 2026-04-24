# ReguVigil — Full Fix & Enhancement Prompt for Antigravity

Paste this entire prompt into Antigravity. It covers every broken feature, missing data, animation upgrade, and pipeline fix needed before the hackathon demo.

---

## CONTEXT

You are working on **ReguVigil** — a pharmacovigilance automation platform for clinical trials. Tech stack:
- **Frontend**: React 18 + Vite + TailwindCSS + React Query + Recharts + react-router-dom v6
- **Backend**: FastAPI + SQLAlchemy 2.0 (async) + PostgreSQL 15 + asyncpg
- **AI**: Google Gemini 2.0 Flash via google-generativeai Python SDK
- **PDF**: PyMuPDF (fitz)
- **Reports**: Jinja2 + WeasyPrint
- **Auth**: Custom JWT HS256 via python-jose
- **Agent Orchestration**: Python asyncio (sequential 4-agent pipeline)
- **Deployment**: Docker + Docker Compose

The app has 3 demo personas:
- **Priya S.** → REGULATORY_AFFAIRS role → `/dashboard/regulatory`
- **Arjun M.** → DATA_MANAGER role → `/dashboard/datamanager`
- **Dr. Ramesh K.** → DOCTOR role (site_id=3) → `/dashboard/doctor`

---

## PART 1 — BROKEN THINGS TO FIX

### FIX 1: Login Page — Missing "Login as Arjun" Button
The middle card for **Arjun M. (Data Manager)** on the login page at `/login` is missing its login button. Add:
```jsx
<button onClick={() => loginAs('arjun')} className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
  Login as Arjun <ArrowRight size={16} />
</button>
```
It should issue a pre-seeded JWT for DATA_MANAGER role identical to the other persona cards.

---

### FIX 2: Manual PDF Upload — Pipeline Must Actually Trigger

The "Upload PDF & Run Pipeline" button on `/dashboard/pipeline` is broken. Fix the full flow:

**Backend** — `POST /guidelines/upload`:
- Accept `multipart/form-data` with a PDF file
- Save the file to `/tmp/uploads/` with a UUID filename
- Extract text using PyMuPDF: `fitz.open(filepath)`
- Immediately insert a row into `guidelines` table: `{ source: 'MANUAL_UPLOAD', status: 'PENDING', pdf_hash: sha256(bytes), uploaded_by: user_id }`
- Trigger the 4-agent pipeline asynchronously using `asyncio.create_task(run_pipeline(guideline_id))`
- Return immediately with `{ guideline_id, status: 'PIPELINE_STARTED' }` — do NOT wait for pipeline to complete

**Frontend** — Upload button on Pipeline Live View:
- Show file picker (accept=".pdf" only)
- On file select: POST to `/guidelines/upload` with FormData
- On success: immediately switch pipeline status to RUNNING state and start polling `/pipeline/status` every 1500ms
- Show toast: "PDF uploaded. Pipeline triggered."
- Do NOT reload the page

---

### FIX 3: Doctor Dashboard — HRV 30-Day Chart is Empty

The "30-Day HRV Trend" section on `/dashboard/doctor` when a patient is selected is blank. Fix it:

**Backend** — `GET /patients/:id/readings?days=30&biomarker=HRV`:
- Return 30 days of HRV readings for the patient from `biomarker_readings` table
- Format: `[{ date: "2026-03-25", value: 24.5 }, ...]`

**Frontend** — Render a Recharts `ComposedChart`:
```jsx
<ComposedChart data={readings}>
  <XAxis dataKey="date" />
  <YAxis domain={[15, 45]} />
  <Line type="monotone" dataKey="value" stroke="#3b82f6" dot={false} strokeWidth={2} name="HRV" />
  {/* Old rule threshold — dashed red line */}
  <ReferenceLine y={25} stroke="#ef4444" strokeDasharray="5 5" label="v1.2 (25ms)" />
  {/* New rule threshold — solid orange line */}
  <ReferenceLine y={28} stroke="#f97316" label="v1.3 (28ms)" />
  <Tooltip />
  <Legend />
</ComposedChart>
```
The chart MUST show the dual threshold lines (old rule dashed, new rule solid). This is a core demo feature.

---

### FIX 4: Pipeline Live View — Make It Animated and Real-Time

Currently the pipeline page shows static agent cards and says "Waiting for pipeline trigger...". Make it fully live:

**Backend** — `GET /pipeline/status`:
Return per-agent status:
```json
{
  "pipeline_id": "uuid",
  "overall_status": "RUNNING | IDLE | COMPLETE | ERROR",
  "started_at": "ISO timestamp",
  "agents": [
    { "id": 1, "name": "Regulatory Parser", "tech": "Gemini 2.0 Flash", "status": "COMPLETE | RUNNING | IDLE | ERROR", "started_at": "...", "completed_at": "...", "duration_ms": 12000 },
    { "id": 2, "name": "Rule Extractor", "tech": "JSON Diff + SQLAlchemy", "status": "RUNNING", "started_at": "...", "completed_at": null, "duration_ms": null },
    { "id": 3, "name": "Biomarker Sentinel", "tech": "AsyncPG", "status": "IDLE", ... },
    { "id": 4, "name": "PV Reporter", "tech": "Jinja2 + Gemini", "status": "IDLE", ... }
  ],
  "patients_evaluated": 312,
  "patients_flagged": 3,
  "total_elapsed_ms": 45000
}
```

**Frontend animations**:
- Each agent node has a pulsing green ring animation when status=RUNNING (use Tailwind `animate-ping`)
- Connector arrows between agents animate with a traveling dot (CSS keyframe) when data is passing between them
- Status dot colors: IDLE=gray, RUNNING=blue+pulse, COMPLETE=green, ERROR=red
- Live run timer counts up in real time (show `mm:ss.ms`)
- System log terminal streams log lines one by one as they arrive (append lines, auto-scroll to bottom)
- Patients evaluated counter animates up (count-up animation) as Agent 3 runs
- When pipeline COMPLETE: confetti or a subtle "✓ Pipeline Complete in 64.2s" banner

---

### FIX 5: PDF Download Button

The "Download PDF" button on the Safety Report page must work. Fix:

**Backend** — `GET /reports/:id/pdf`:
- Render the PV report HTML via Jinja2 template
- Convert to PDF using WeasyPrint: `HTML(string=html).write_pdf()`
- Return as `StreamingResponse` with `media_type="application/pdf"` and header `Content-Disposition: attachment; filename=PV_Report_{case_id}.pdf`

**Frontend**:
```js
const response = await axios.get(`/reports/${reportId}/pdf`, { responseType: 'blob' });
const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
const a = document.createElement('a'); a.href = url; a.download = `PV_Report_${caseId}.pdf`; a.click();
```

---

### FIX 6: CSV Export Button on Data Manager Dashboard

The "Export CSV" button must work. Fix:

**Backend** — `GET /patients/export?format=csv&trial_id=`:
```python
import csv, io
output = io.StringIO()
writer = csv.DictWriter(output, fieldnames=['patient_id','site','hospital','hrv','old_status','new_status','flagged'])
writer.writeheader()
writer.writerows(patient_data)
return StreamingResponse(io.BytesIO(output.getvalue().encode()), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=patients_export.csv"})
```

---

### FIX 7: "Approve Rule" Button on Regulatory Dashboard

When Priya clicks "Approve Rule" on the pending EMA SpO2 guideline:

**Backend** — `POST /rules/:id/approve`:
- Move rule from `pending_reviews` to `monitoring_rules` with status=ACTIVE
- Set confidence_score to manually_approved=true
- Trigger Agent 2 → 3 → 4 pipeline for that rule
- Return updated rule object

**Frontend**:
- Show loading spinner on button during API call
- On success: remove the pending card with a fade-out animation, show green toast "Rule approved and activated"
- Re-fetch pipeline status

---

## PART 2 — SYNTHETIC DATA (Make It Real and Credible)

Replace all hardcoded/fake data with realistic seeded data stored in PostgreSQL. The seed script must generate this on `docker-compose up`.

### Seed Script Requirements (`seed.py`):

```python
# Run this on startup: python seed.py

import random, datetime

# TRIAL
trial = { "id": "trial-glucozen-001", "name": "GlucoZen Phase III", "sponsor": "IQVIA", "phase": "III", "start_date": "2025-09-01" }

# 10 SITES with real Indian + international hospital names
sites = [
    { "id": 1, "name": "MGH Boston", "city": "Boston", "country": "USA", "pi": "Dr. Sarah Chen" },
    { "id": 2, "name": "AIIMS New Delhi", "city": "New Delhi", "country": "India", "pi": "Dr. Vikram Nair" },
    { "id": 3, "name": "Apollo Hospitals", "city": "Chennai", "country": "India", "pi": "Dr. Ramesh K." },
    { "id": 4, "name": "Fortis Mumbai", "city": "Mumbai", "country": "India", "pi": "Dr. Priya Iyer" },
    { "id": 5, "name": "Cleveland Clinic", "city": "Cleveland", "country": "USA", "pi": "Dr. James Okafor" },
    { "id": 6, "name": "NIMHANS Bangalore", "city": "Bangalore", "country": "India", "pi": "Dr. Anjali Rao" },
    { "id": 7, "name": "KEM Hospital", "city": "Pune", "country": "India", "pi": "Dr. Suresh Patil" },
    { "id": 8, "name": "Mayo Clinic", "city": "Rochester", "country": "USA", "pi": "Dr. Laura Kim" },
    { "id": 9, "name": "CMC Vellore", "city": "Vellore", "country": "India", "pi": "Dr. Thomas George" },
    { "id": 10, "name": "Johns Hopkins", "city": "Baltimore", "country": "USA", "pi": "Dr. Michael Torres" }
]

# 500 PATIENTS — 45-55 per site, ages 40-75, Phase III cardiac trial
# For Site 3 (Apollo Chennai): 2 patients must have HRV between 25-27ms (SAFE under v1.2, AT RISK under v1.3)
# Specifically: PT-8091 (Female, 62yrs, HRV=24ms), PT-1102 (Male, 58yrs, HRV=26ms)
# For Site 8 (Mayo Clinic): 1 patient PT-4399 (Male, 67yrs, HRV=27.5ms) — MODERATE risk

# 30 DAYS OF HRV READINGS per patient
# HRV range: 20-42ms, with realistic variability (±2-4ms day to day)
# AT RISK patients: trend downward over last 7 days, crossing 28ms threshold

# 3 MONITORING RULES
rules = [
    { "version": "v1.1", "biomarker": "HRV_SDNN", "operator": "LT", "threshold": 22, "status": "SUPERSEDED" },
    { "version": "v1.2", "biomarker": "HRV_SDNN", "operator": "LT", "threshold": 25, "status": "SUPERSEDED" },
    { "version": "v1.3", "biomarker": "HRV_SDNN", "operator": "LT", "threshold": 28, "status": "ACTIVE",
      "source": "FDA Cardiac Safety Guidance Update, March 2026", "diff": "Threshold raised from 25ms to 28ms for Phase III trials" }
]

# 2 GUIDELINES
guidelines = [
    { "source": "FDA", "title": "FDA Cardiac Safety Monitoring Guidance Update Q1 2026",
      "url": "https://fda.gov/guidance/cardiac-safety-2026", "status": "PROCESSED", "confidence": 0.94 },
    { "source": "EMA", "title": "EMA SpO2 Monitoring Protocol Revision",
      "url": "https://ema.europa.eu/spO2-2026", "status": "HUMAN_REVIEW", "confidence": 0.68 }
]

# 1 PV REPORT (pre-generated, ready to display)
# Case: PV-1092, Trial: GlucoZen Phase III, Triggered by Rule v1.3
# 3 flagged patients, 2 HIGH risk (PT-8091, PT-1102), 1 MODERATE (PT-4399)
```

**HRV readings must look realistic**:
- Normal patients: HRV 30-42ms, slight daily variation
- AT RISK patients: HRV trending down from ~32ms (30 days ago) to 24ms (today) — gradual decline
- Generate readings with: `base + sin(day/7)*2 + random.gauss(0, 1.5)` for natural wave pattern

---

## PART 3 — AGENT PIPELINE WITH LANGGRAPH

Refactor the 4-agent pipeline to use **LangGraph** for proper agent state passing, visibility, and hackathon impressiveness. Keep Gemini 2.0 Flash as the LLM.

### Install:
```
pip install langgraph langchain-google-genai
```

### Pipeline State Schema:
```python
from typing import TypedDict, Optional, List
from langgraph.graph import StateGraph, END

class PipelineState(TypedDict):
    guideline_id: str
    pdf_path: str
    pdf_text: str                    # Agent 1 writes
    extracted_rule: dict             # Agent 1 writes
    confidence_score: float          # Agent 1 writes
    new_rule_id: str                 # Agent 2 writes
    rule_diff: dict                  # Agent 2 writes
    evaluated_patients: List[dict]   # Agent 3 writes
    flagged_patients: List[dict]     # Agent 3 writes
    report_id: str                   # Agent 4 writes
    report_html: str                 # Agent 4 writes
    pipeline_status: str             # Updated by each agent
    agent_timings: dict              # { "agent1_ms": 12000, ... }
    error: Optional[str]
```

### LangGraph Node Functions:
```python
def agent1_parse_pdf(state: PipelineState) -> PipelineState:
    """Extract rule from PDF using Gemini 2.0 Flash"""
    # Update DB: agents[0].status = RUNNING
    start = time.time()
    text = extract_pdf_text(state['pdf_path'])  # PyMuPDF
    rule_json = gemini_extract_rule(text)        # Gemini structured JSON
    elapsed = int((time.time() - start) * 1000)
    # Update DB: agents[0].status = COMPLETE, duration_ms = elapsed
    return { **state, "pdf_text": text, "extracted_rule": rule_json,
             "confidence_score": rule_json['confidence_score'],
             "agent_timings": { **state.get('agent_timings',{}), "agent1_ms": elapsed } }

def agent2_extract_rule(state: PipelineState) -> PipelineState: ...
def agent3_evaluate_patients(state: PipelineState) -> PipelineState: ...
def agent4_generate_report(state: PipelineState) -> PipelineState: ...

def route_after_agent1(state: PipelineState) -> str:
    """Route to human review if confidence < 0.70"""
    if state['confidence_score'] < 0.70:
        return "human_review"
    return "agent2"

# Build graph
graph = StateGraph(PipelineState)
graph.add_node("agent1", agent1_parse_pdf)
graph.add_node("agent2", agent2_extract_rule)
graph.add_node("agent3", agent3_evaluate_patients)
graph.add_node("agent4", agent4_generate_report)
graph.add_node("human_review", route_to_human_review)

graph.set_entry_point("agent1")
graph.add_conditional_edges("agent1", route_after_agent1, { "agent2": "agent2", "human_review": "human_review" })
graph.add_edge("agent2", "agent3")
graph.add_edge("agent3", "agent4")
graph.add_edge("agent4", END)
graph.add_edge("human_review", END)

pipeline = graph.compile()

# Run:
async def run_pipeline(guideline_id: str, pdf_path: str):
    result = await pipeline.ainvoke({ "guideline_id": guideline_id, "pdf_path": pdf_path })
    return result
```

Each agent node must write its status to the `pipeline_runs` table in PostgreSQL immediately on start and completion so the frontend polling can pick it up in real time.

---

## PART 4 — REALISTIC SAMPLE FDA PDF

Create a file `sample_fda_guideline.pdf` that the demo uses. Content should be:

```
FDA GUIDANCE DOCUMENT
Cardiac Safety Monitoring in Phase III Clinical Trials
Document Number: FDA-2026-D-0412
Issue Date: March 15, 2026

SECTION 4.2 — HRV SDNN THRESHOLD REVISION

Following post-market surveillance data from 12 Phase III cardiac trials (n=4,847),
the FDA has revised the Heart Rate Variability Standard Deviation of Normal-to-Normal
(HRV SDNN) alert threshold for Phase III cardiac trials.

Effective immediately:
- Previous threshold: HRV SDNN < 25ms → FLAG AS AT RISK
- Revised threshold: HRV SDNN < 28ms → FLAG AS AT RISK

Rationale: Analysis revealed that patients with HRV SDNN between 25-28ms showed
a 34% elevated risk of adverse cardiac events within 90 days. The revised threshold
ensures earlier detection and intervention.

Trial phases affected: Phase II, Phase III
Biomarker: HRV_SDNN
Operator: LESS_THAN
New threshold value: 28
Unit: ms
Duration window: 30 days
Effective date: 2026-03-15
```

Generate this as an actual PDF using Python's `reportlab` library and save it as `sample_fda_guideline.pdf` in the project root. When Priya uploads this PDF, Agent 1 must extract `{ biomarker: HRV_SDNN, operator: LT, new_value: 28, confidence: 0.94 }`.

---

## PART 5 — UI POLISH FIXES

### 5.1 Pipeline View — Animated Agent Nodes
Replace static agent boxes with this animated component:
```jsx
const AgentNode = ({ agent, isActive, isPrev }) => (
  <div className={`relative p-4 rounded-xl border-2 transition-all duration-500 ${
    agent.status === 'RUNNING' ? 'border-blue-500 bg-blue-950 shadow-blue-500/30 shadow-lg' :
    agent.status === 'COMPLETE' ? 'border-green-500 bg-green-950' :
    agent.status === 'ERROR' ? 'border-red-500 bg-red-950' :
    'border-gray-700 bg-gray-900'
  }`}>
    {agent.status === 'RUNNING' && (
      <span className="absolute -top-1 -right-1 w-3 h-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
      </span>
    )}
    <div className="text-xs text-gray-400 font-mono">{agent.id}.</div>
    <div className="font-semibold text-white mt-1">{agent.name}</div>
    <div className="text-xs text-blue-300 font-mono mt-1">{agent.tech}</div>
    {agent.duration_ms && <div className="text-xs text-green-400 mt-2">{(agent.duration_ms/1000).toFixed(1)}s</div>}
  </div>
);
```

### 5.2 Connector Arrows — Animated Data Flow
Between each agent node, show an animated arrow:
```jsx
const FlowArrow = ({ active }) => (
  <div className="flex items-center mx-2">
    <div className={`h-0.5 w-12 relative overflow-hidden ${active ? 'bg-blue-900' : 'bg-gray-800'}`}>
      {active && <div className="absolute inset-y-0 w-4 bg-blue-400 animate-[slide_1s_linear_infinite]" />}
    </div>
    <ChevronRight className={active ? 'text-blue-400' : 'text-gray-700'} size={16} />
  </div>
);
```
Add to CSS: `@keyframes slide { from { left: -20px } to { left: 100% } }`

### 5.3 System Log Terminal — Real Streaming
The log terminal should show messages as each agent runs:
```
[12:25:01] Pipeline triggered — guideline_id: fda-2026-d-0412
[12:25:01] Agent 1 STARTED — Regulatory Parser (Gemini 2.0 Flash)
[12:25:03] Agent 1 — PDF text extracted: 1,247 tokens
[12:25:11] Agent 1 — Gemini extraction complete. Confidence: 0.94
[12:25:11] Agent 1 COMPLETE — 10.2s
[12:25:11] Agent 2 STARTED — Rule Extractor
[12:25:12] Agent 2 — Rule diff computed: HRV threshold 25ms → 28ms
[12:25:15] Agent 2 — Rule v1.3 created. v1.2 → SUPERSEDED
[12:25:15] Agent 2 COMPLETE — 4.1s
[12:25:15] Agent 3 STARTED — Biomarker Sentinel (500 patients, 10 batches)
[12:25:18] Agent 3 — Batch 1/10 complete (50 patients)
...
[12:25:57] Agent 3 — 3 patients newly flagged (SAFE → AT RISK)
[12:25:57] Agent 3 COMPLETE — 41.8s
[12:25:57] Agent 4 STARTED — PV Reporter (Gemini 2.0 Flash)
[12:26:10] Agent 4 — Report PV-1092 generated. Notifying 1 PI.
[12:26:12] Agent 4 COMPLETE — 15.3s
[12:26:12] ✓ PIPELINE COMPLETE — Total: 71.4s | 500 patients evaluated | 3 flagged
```

Store these log lines in a `pipeline_logs` table and stream via polling: `GET /pipeline/:id/logs?after=timestamp`

### 5.4 Doctor Dashboard — 3D Body Scan Page Fixes
On `/dashboard/doctor/patient/:id/viz`:
- The bottom input box is empty and has no label — add: `placeholder="Ask about this patient's condition..."` and wire it to a Gemini API call that returns clinical context about the patient's HRV status
- The SCAN SYNC "LIVE" badge should pulse with `animate-pulse`
- Add a small animated heartbeat line (SVG path animation) next to the HRV value

### 5.5 Regulatory Affairs Login Card — Stats Must Be Real
On `/login/regulatory` (Priya's pre-login screen):
- "Guidelines Processed: 1,204" — keep this number but wire it to `GET /stats/guidelines-count`
- "Time Saved (YTD): 480 hrs" — calculated as: guidelines_processed × 24hrs average manual processing time / 60
- "Regulators Monitored: 4" — FDA, EMA, CDSCO, ICH — update the display to show all 4 names

---

## PART 6 — BACKEND PIPELINE STATUS TABLE

Add this table to PostgreSQL for real-time pipeline tracking:

```sql
CREATE TABLE pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guideline_id UUID REFERENCES guidelines(id),
  overall_status VARCHAR(20) DEFAULT 'IDLE',  -- IDLE|RUNNING|COMPLETE|ERROR
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  patients_evaluated INT DEFAULT 0,
  patients_flagged INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pipeline_agent_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES pipeline_runs(id),
  agent_number INT,  -- 1,2,3,4
  agent_name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'IDLE',  -- IDLE|RUNNING|COMPLETE|ERROR
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INT,
  error_message TEXT
);

CREATE TABLE pipeline_logs (
  id BIGSERIAL PRIMARY KEY,
  run_id UUID REFERENCES pipeline_runs(id),
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  log_level VARCHAR(10) DEFAULT 'INFO',  -- INFO|WARN|ERROR|SUCCESS
  message TEXT
);
```

Each agent writes to these tables at start and end. Frontend polls `GET /pipeline/latest` every 1500ms.

---

## PART 7 — WHAT TO KEEP UNCHANGED

- The 3D body scan visualization — it looks great, keep it
- The PV Safety Report layout (Image 8) — it's production-quality already
- The role-based JWT auth architecture
- The overall color scheme and typography
- The Regulatory Affairs diff card (old rule vs new rule) — it's your strongest UI element
- Docker Compose setup

---

## SUMMARY OF ALL CHANGES

| # | What | Where | Priority |
|---|------|--------|----------|
| 1 | Add Arjun login button | `/login` | CRITICAL |
| 2 | Fix PDF upload → pipeline trigger | `/dashboard/pipeline` + backend | CRITICAL |
| 3 | Fill HRV 30-day chart with dual threshold lines | `/dashboard/doctor` | CRITICAL |
| 4 | Animate pipeline agent nodes + connector arrows | `/dashboard/pipeline` | HIGH |
| 5 | Fix PDF download button | `/reports/:id` | HIGH |
| 6 | Fix CSV export | `/dashboard/datamanager` | HIGH |
| 7 | Fix Approve Rule button | `/dashboard/regulatory` | HIGH |
| 8 | Refactor pipeline to LangGraph | `backend/pipeline/` | HIGH |
| 9 | Realistic seed data (500 patients + 30-day HRV) | `seed.py` | CRITICAL |
| 10 | Generate sample FDA PDF | project root | CRITICAL |
| 11 | Streaming log terminal | Pipeline Live View | MEDIUM |
| 12 | Doctor 3D scan — fix input + pulse animations | `/dashboard/doctor/patient/:id/viz` | MEDIUM |
| 13 | Pipeline run + agent status tables in DB | `migrations/` | HIGH |
| 14 | Stats API wired to real DB counts | `/login/regulatory` | LOW |
