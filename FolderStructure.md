# Folder Structure - BHIV Executive Control Center

Test 2: Modular Architecture Reference
Owner: Rahil Mulani, Blackhole Infiverse

---

## Current delivery

Single file for portability and rapid review. Every layer is separated by block comments inside the file so the structure is clear even without splitting.

```
bhiv-ecc-test2.jsx      - full application
README.md               - overview and setup
Architecture.md         - command engine, state design, integration plan
FolderStructure.md      - this file
REVIEW_PACKET.md        - submission notes and reviewer guide
```

---

## Production target structure

When this moves to a full Next.js or Vite project:

```
src/
|
+-- design-system/
|   +-- tokens.js               DS object - colors, fonts, radius, shadows
|   +-- GlobalCss.jsx           keyframes, scrollbar, focus styles
|   +-- index.js
|
+-- mock-data/
|   +-- services.js
|   +-- incidents.js
|   +-- approvals.js
|   +-- operations.js
|   +-- commandHistory.js
|   +-- kpis.js
|   +-- charts.js               revenue, latency, deploy frequency, etc.
|
+-- services/
|   +-- MockService.js          swap this file only when real APIs are ready
|
+-- commands/
|   +-- useCommand.js           state machine hook
|   +-- CommandDialog.jsx       reusable dialog wrapper
|   +-- CommandSearch.jsx       global Cmd+K overlay
|   +-- commandStates.js        CMD enum
|
+-- context/
|   +-- ThemeContext.jsx
|   +-- AuditContext.jsx
|   +-- NotificationContext.jsx
|   +-- PanelContext.jsx
|
+-- components/
|   |
|   +-- primitives/
|   |   +-- Card.jsx
|   |   +-- Btn.jsx
|   |   +-- StatusDot.jsx
|   |   +-- StatusIcon.jsx
|   |   +-- StatusChip.jsx
|   |   +-- PriorityIcon.jsx
|   |   +-- ProgressBar.jsx
|   |   +-- MiniProgress.jsx
|   |   +-- StatPill.jsx
|   |   +-- EmptyState.jsx
|   |
|   +-- charts/
|   |   +-- MonoTooltip.jsx
|   |   +-- ChartCard.jsx
|   |
|   +-- kpi/
|   |   +-- KpiCard.jsx
|   |
|   +-- incidents/
|   |   +-- IncidentConsole.jsx
|   |   +-- IncidentCard.jsx
|   |
|   +-- approvals/
|   |   +-- ApprovalQueue.jsx
|   |   +-- ApprovalCard.jsx
|   |
|   +-- operations/
|   |   +-- RunningOps.jsx
|   |   +-- OpCard.jsx
|   |
|   +-- services/
|   |   +-- ServiceGrid.jsx
|   |   +-- ServiceCard.jsx
|   |
|   +-- alerts/
|   |   +-- AlertRow.jsx
|   |
|   +-- audit/
|   |   +-- AuditLogTable.jsx
|   |
|   +-- timeline/
|   |   +-- ActivityTimeline.jsx
|   |
|   +-- situationbar/
|       +-- SituationBar.jsx
|
+-- layouts/
|   +-- Sidebar.jsx
|   +-- Topbar.jsx
|   +-- CommandPanel.jsx
|
+-- pages/
|   +-- DashboardPage.jsx
|   +-- OperationsPage.jsx
|   +-- EngineeringPage.jsx
|   +-- BusinessPage.jsx
|   +-- AlertsPage.jsx
|   +-- TeamsPage.jsx
|
+-- constants/
|   +-- navigation.js
|
+-- utils/
|   +-- seededRand.js
|   +-- formatters.js
|
+-- App.jsx
```

---

## Component responsibilities

| Component | Does exactly one thing |
|---|---|
| useCommand | Manages command state machine - nothing else |
| CommandDialog | Renders the right UI for each command phase |
| MockService | All external communication - the only file that changes for real backend |
| SituationBar | 6-metric snapshot answering "is everything OK" |
| KpiCard | One KPI with value, trend indicator, and sparkline |
| IncidentCard | One incident with Acknowledge and Escalate commands |
| ApprovalCard | One approval with Approve and Reject commands |
| OpCard | One running operation with Pause and Stop commands |
| ServiceCard | One service health status with optional Restart command |
| AlertRow | One alert with Silence command |
| AuditLogTable | Reads audit context and renders the trail |
| CommandPanel | Right drawer with history, pending, and running tabs |
| CommandSearch | Cmd+K overlay for navigation and command triggers |
| SystemPulse | Composite health sparkline in the top bar |

---

## Rules followed throughout

No component handles more than one responsibility. IncidentCard knows about one incident. CommandDialog knows about command state phases. Neither knows about the other.

The command engine has no JSX. CommandDialog has no service calls. They are separate.

MockService is the only integration boundary. Every function name matches its future REST endpoint.

No hardcoded colors or font values outside the DS token object.

Per-command state lives in the component that owns the command. Shared state lives in context.
