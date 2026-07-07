# BHIV Executive Control Center

Internship task - Data Science & AI Intern, Blackhole Infiverse
Sprint: Test 2 - Executive Control Center Command Layer
Owner: Rahil Mulani

---

## Background

This is built on top of Test 1. The repo is the same, the design system is the same, and the component structure carries forward. Test 2 adds a command layer on top of the visual foundation from Test 1.

The brief was pasted into Claude before any code was written. The execution plan it produced:

1. Shift the primary view to live operational state - what is happening right now, not what happened last week. Charts move to the Business tab. The dashboard opens with incidents, approvals, and running operations front and center.
2. Build a reusable command engine so every action in the system goes through the same lifecycle: confirm, execute, succeed or fail, audit. No action fires immediately without confirmation.
3. Add a Command Panel (drawer), global search (Cmd+K), and a Situation Bar at the top of the dashboard so leadership can orient themselves in under 5 seconds.
4. Wire up the Operations, Engineering, Business, Alerts, and Teams pages as real views, not placeholders.
5. Write README, Architecture.md, FolderStructure.md, and REVIEW_PACKET.md.

The clarifying questions it asked before building: single-file vs full Next.js app, and how much of the brief to cover in this pass. Both were answered in full scope, single-file for rapid preview.

---

## What changed from Test 1

The main change is the primary view. Test 1 opened with revenue trend charts and KPI cards. That is a reporting dashboard - it shows what happened. Test 2 opens with what needs attention right now: open incidents, pending approvals, running operations, and live service health. Charts still exist but they live on the Business tab, which is where historical data belongs.

The second change is every interactive element now has a real command lifecycle. Clicking Approve does not just dismiss a card. It opens a confirmation dialog, runs a mock service call, shows a progress state, records success or failure, writes an audit entry, and fires a notification. The same framework handles Reject, Acknowledge, Escalate, Pause, Stop, Restart, Silence, Generate Report, and Create Incident.

---

## Pages

| Page | What it shows |
|---|---|
| Dashboard | Situation Bar, open incidents, pending approvals, running ops, live service health, KPI snapshot, activity feed, quick actions |
| Operations | Full service grid with Restart command, incident console, running ops, activity feed |
| Engineering | Build state, latency charts, deployment frequency, sprint progress, burn-down, release schedule |
| Business | Revenue trend, product mix, user growth, new signups - historical charts live here |
| Alerts | Filterable alert console (critical / warning / info) with Silence command |
| Teams | Department productivity, completion, and efficiency |

---

## Command surfaces

| Surface | Commands |
|---|---|
| Pending Approvals | Approve, Reject |
| Active Incidents | Acknowledge, Escalate (with rollback option) |
| Running Operations | Pause (with rollback), Stop |
| Service Health | Restart Service (fails intentionally on Payment Service to show failure path) |
| Alert Console | Silence (30 min) |
| Quick Actions | Generate Report, Create Incident |

---

## Tech stack

- React with hooks and context
- Recharts for all charts
- lucide-react for icons
- No external state library - four React contexts (Theme, Audit, Notifications, Panel)
- Mock service layer with realistic latency, maps directly to future REST endpoints

---

## Running locally

1. Copy `bhiv-ecc-test2.jsx` into a React project (Next.js, Vite, or CRA).
2. Install dependencies:
   ```
   npm install recharts lucide-react
   ```
3. Import and render:
   ```jsx
   import ExecutiveControlCenter from "./bhiv-ecc-test2";
   export default function Page() { return <ExecutiveControlCenter />; }
   ```
4. Run the dev server.

---

## Note on Payment Service restart

The Payment Service restart command intentionally returns an error. This is to demonstrate the failure path in the command lifecycle - the dialog shows the error message, and a Retry button appears. This is not a bug.

---

## Author

Rahil Mulani
Data Science & AI Intern, Blackhole Infiverse
BE Information Technology, Sinhgad Institutes, Pune
