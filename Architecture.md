# Architecture - BHIV Executive Control Center

Test 2: Command Layer
Owner: Rahil Mulani, Blackhole Infiverse

---

## How the layers fit together

```
Pages / Views
  Dashboard - Operations - Engineering - Business - Alerts - Teams

Operational Components
  ApprovalQueue - IncidentConsole - ServiceGrid
  RunningOps - AlertConsole - AuditLogTable - ActivityTimeline

Command Layer
  useCommand (hook) - CommandDialog (component)
  CommandPanel (drawer) - CommandSearch (Cmd+K)

Service Layer
  MockService - Promise-based, maps to future REST APIs

State / Context
  ThemeCtx - AuditCtx - PanelCtx - NotifCtx

Design Tokens
  DS object - colors, fonts, spacing, radius, shadows
```

---

## Command engine

Every action in the application goes through the same state machine. There is one implementation, used by all eight command types.

```
IDLE
  |
  | confirm(target)
  v
CONFIRM  --cancel-->  IDLE
  |
  | execute()
  v
EXECUTING
  |         |
success   failure
  |         |
  v         v
SUCCESS   FAILURE
  |         |
rollback() retry -> EXECUTING
  |
ROLLING_BACK
  |
ROLLED_BACK
```

The hook interface:

```js
const cmd = useCommand({
  label: "Approve APR-0101",
  serviceCall: () => MockService.approveRequest("APR-0101"),
  canRollback: false,
  onAudit: (entry) => addAudit(entry),
});

// Returns:
// cmd.confirm(target)  - open the dialog
// cmd.execute()        - run the service call
// cmd.cancel()         - go back to idle
// cmd.rollback()       - reverse the operation
// cmd.reset()          - close from any terminal state
// cmd.phase            - current state
// cmd.state            - { target, error, result, auditId }
```

`CommandDialog` wraps any `useCommand` result and renders the right UI for every phase. No command implements its own dialog.

```jsx
<CommandDialog
  cmd={cmd}
  label="Approve budget request"
  description="This will approve the Q3 budget increase from Priya N."
  canRollback={false}
  trigger={({ onClick }) => <button onClick={onClick}>Approve</button>}
/>
```

---

## Service layer

`MockService` is the only file that changes when real APIs are available. Each method has a comment showing the future endpoint.

```js
MockService.approveRequest(id)    // PUT  /api/v1/approvals/:id/approve
MockService.rejectRequest(id)     // PUT  /api/v1/approvals/:id/reject
MockService.acknowledgeAlert(id)  // PATCH /api/v1/alerts/:id/acknowledge
MockService.restartService(id)    // POST  /api/v1/services/:id/restart
MockService.createIncident(data)  // POST  /api/v1/incidents
MockService.generateReport(type)  // POST  /api/v1/reports/generate
MockService.pauseOperation(id)    // POST  /api/v1/operations/:id/pause
MockService.stopOperation(id)     // POST  /api/v1/operations/:id/stop
MockService.escalateIncident(id)  // POST  /api/v1/incidents/:id/escalate
MockService.rollbackCommand(id)   // POST  /api/v1/audit/:id/rollback
MockService.silenceAlert(id)      // POST  /api/v1/alerts/:id/silence
```

All methods include realistic latency (700-1600ms). `restartService("pay")` throws an error intentionally to demonstrate the failure path.

---

## State management

Four React contexts, no prop drilling beyond one level.

| Context | What it holds | Who uses it |
|---|---|---|
| ThemeCtx | theme, token object, setTheme | All components |
| AuditCtx | auditLog array, addAudit function | useCommand callbacks, AuditLogTable, CommandPanel |
| NotifCtx | notifs array, addNotif, markRead | Topbar, useCommand callbacks |
| PanelCtx | panelOpen, cmdSearch booleans | Sidebar, Topbar, panels |

For production the contexts would move to Zustand stores. The interface would not change.

---

## Design system

All visual values come from the `DS` object. No hardcoded hex values outside it.

```
DS.color.dark / DS.color.light   - full theme palettes
DS.accent.primary                - #2E7CF6
DS.accent.gradient               - used on progress bars and active elements
DS.status.healthy / warning / critical / info - functional status colors only
DS.font.display / body / mono    - Sora / Inter / JetBrains Mono
DS.radius.sm / md / lg / xl      - 6 / 10 / 14 / 18
DS.shadow.card / overlay / glow
```

Status colors are only used for functional health signals. They are never used decoratively.

---

## Audit system

Every command produces an audit entry on success, failure, or rollback.

```js
{
  label: "Restart Payment Service",
  target: { id: "pay" },
  status: "success" | "failure" | "rollback",
  auditId: "AUD-1720000000000",
  ts: "2026-07-02T08:14:22.000Z"
}
```

Entries appear in the AuditLogTable on the Dashboard and Engineering page, and in the Command Panel history tab. In production these would be persisted to a backend audit service.

---

## Future integration points

| Feature | What is needed |
|---|---|
| Real commands | Replace MockService methods with fetch or axios calls |
| Auth and actor identity | Replace hardcoded "Raghav S." with auth context user |
| Persistent audit log | POST entries to /api/v1/audit on each command completion |
| Real-time incidents | WebSocket or SSE feed into NotifCtx and IncidentConsole |
| Approval workflows | Connect to Jira, ServiceNow, or internal approval service |
| Command authorization | Add canExecute guard to useCommand based on user role |
| Data fetching | Wrap MockService calls in TanStack Query for caching |
