# BHIV Executive Control Center

> Internship Task — Data Science & AI Intern, **Blackhole Infiverse**
> Sprint Task: *Executive Control Center Foundation (BHIV Executive Control Panel — Test 1)*

A leadership-grade command center UI that brings operational monitoring, runtime intelligence, business KPIs, engineering metrics, and project execution into a single screen — built to answer **"is the company healthy?"** within 30 seconds of login.

---

## 🎯 Objective

BHIV leadership currently has to open multiple tools to understand the organization's real-time status. This project is the foundation of a unified **Executive Control Center**: a centralized, enterprise-grade dashboard inspired by products like Datadog, Linear, Stripe Dashboard, and Vercel — designed for CEOs, CXOs, Operations Heads, and Engineering Leaders.

The deliverable is a fully interactive front-end foundation with realistic mock data, ready to be wired up to live data sources in a later phase.

---

## ✨ Key Features

This build covers all 9 sections defined in the project brief:

| Section | What it shows |
|---|---|
| **Executive Summary** | 8 KPI cards (revenue, MAU, active projects, incidents, uptime, deploy success, open issues, CSAT) with trend %, sparkline, and direction indicator |
| **Operational Health** | Live status grid for 9 services (API, DB, Auth, Payments, Queue, etc.) with green/amber/red status and pulsing indicator on degraded services |
| **Business Intelligence** | Revenue trend vs. target, user growth, retention vs. conversion, top products, regional distribution — all interactive Recharts visualizations |
| **Engineering Dashboard** | Deployment frequency, latency percentiles (P50/P95/P99), code coverage, production error count |
| **Sprint Execution** | Sprint progress bar, completed/pending/blocked task split, burn-down chart, upcoming releases |
| **Critical Alerts** | Severity-filterable incident/alert feed (critical / warning / info) |
| **Team Performance** | Cross-department productivity, completion, and efficiency comparison |
| **Activity Timeline** | Unified audit trail — deployments, incidents, approvals, logins |
| **Quick Actions** | One-click shortcuts for common executive actions (approve deployment, create incident, generate report, etc.) |

Plus a full sidebar navigation shell for all 10 top-level areas (Dashboard, Operations, Engineering, Business, Projects, Analytics, Reports, Alerts, Teams, Settings), dark/light mode, and a live **System Pulse** indicator built into the top bar.

---

## 🎨 Design Approach

Rather than a generic admin template, the visual language was deliberately built around the brief's own reference products (Datadog, Grafana, Linear, Stripe):

- **Theme:** A deep "console-glass" slate background (`#0B0E14`) instead of pure black or a generic light template, evoking a real monitoring/observability tool.
- **Typography:** `Sora` for display headings, `Inter` for body text, and `JetBrains Mono` for every numeric value — KPIs, latencies, timestamps, IDs — so data reads like telemetry rather than marketing copy.
- **Color discipline:** Status colors (green / amber / red) are used **only** for functional health signals, never decoratively, keeping the interface calm and easy to scan under pressure.
- **Signature element:** A live composite health sparkline ("System Pulse") embedded directly in the top bar chrome, tying system health into the navigation itself rather than burying it inside a card.

---

## 🛠️ Tech Stack

- **React** (functional components + hooks)
- **Recharts** — Area, Bar, Line, and Pie/Donut charts
- **lucide-react** — iconography
- **Inline CSS-in-JS** with a centralized design-token system (palette, type scale, spacing)
- **Mock data layer** — seeded pseudo-random generator producing realistic enterprise-style time series (no backend required)

> Built and previewed as a single-file React component; can be dropped into any Next.js / Vite / CRA project as a page or top-level view.

---

## 📁 Project Structure

```
bhiv-executive-control-center.jsx   # Single-file foundation: layout, design tokens,
                                     # mock data, and all 9 dashboard sections
```

The component is intentionally self-contained for this foundation phase. As the project grows, the natural next step is to split it into:

```
src/
├── components/      # KpiCard, ChartCard, ServiceRow, AlertRow, etc.
├── layouts/          # Sidebar, Topbar
├── pages/            # Dashboard, Operations, Engineering, Business...
├── charts/           # Recharts wrappers
├── mockData/         # Generators currently inline in the foundation file
├── hooks/
├── services/
├── types/
└── constants/
```

---

## 🚀 Running Locally

This component has no external data dependencies — everything is mock-generated client-side.

1. Drop `bhiv-executive-control-center.jsx` into a React project (Next.js, Vite, or CRA).
2. Install dependencies:
   ```bash
   npm install recharts lucide-react
   ```
3. Import and render the default export:
   ```jsx
   import ExecutiveControlCenter from "./bhiv-executive-control-center";

   export default function Page() {
     return <ExecutiveControlCenter />;
   }
   ```
4. Run the dev server as usual (`npm run dev`).

---

## 📌 Status

- [x] Executive Summary
- [x] Operational Health
- [x] Business Intelligence
- [x] Engineering Dashboard
- [x] Sprint Execution
- [x] Critical Alerts (with severity filtering)
- [x] Team Performance
- [x] Activity Timeline
- [x] Quick Actions
- [x] Dark / Light mode
- [ ] Live data integration (API / backend wiring)
- [ ] Dedicated detail views for non-Dashboard sidebar tabs

---

## 👤 Author

**Rahil Mulani**
Data Science & AI Intern, Blackhole Infiverse
BE Information Technology, Sinhgad Institutes, Pune

---

*Submitted as part of internship Sprint Task: "Executive Control Center Foundation (BHIV)" — Due July 4, 2026.*
