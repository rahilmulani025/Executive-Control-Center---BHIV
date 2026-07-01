import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  LayoutGrid, Activity, Cpu, BarChart3, Briefcase, PieChart as PieIcon,
  FileText, AlertTriangle, Users, Settings, Search, Bell, ChevronDown,
  Sun, Moon, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  CheckCircle2, XCircle, AlertCircle, Clock, Server, Database, Wifi,
  Shield, CreditCard, Mail, Layers, GitBranch, Gauge, Zap, Play,
  PlusCircle, Download, UserPlus, SlidersHorizontal, ChevronRight,
  CircleDot, GitCommit, LogIn, ShieldAlert, Rocket, Filter,
} from "lucide-react";

/* ============================================================
   DESIGN TOKENS
   Console-glass dark slate, telemetry-mono numerals,
   strictly functional status color (no decorative use).
============================================================ */
const palette = {
  dark: {
    bg: "#0B0E14",
    bgElevated: "#0E1118",
    surface: "#12161F",
    surfaceHover: "#161B26",
    border: "#1E2430",
    borderStrong: "#2A3140",
    text: "#E6E9F0",
    textMuted: "#8B93A5",
    textFaint: "#5B6479",
  },
  light: {
    bg: "#F3F4F7",
    bgElevated: "#FAFAFC",
    surface: "#FFFFFF",
    surfaceHover: "#F6F7FA",
    border: "#E3E5EB",
    borderStrong: "#CDD1DC",
    text: "#15171F",
    textMuted: "#5B6479",
    textFaint: "#9498A5",
  },
};
const accent = { from: "#3B82F6", to: "#06B6D4", solid: "#2F8FF0" };
const status = {
  healthy: "#22C55E",
  warning: "#F59E0B",
  critical: "#EF4444",
  info: "#6366F1",
};

const fontStack = {
  display: "'Sora', 'Inter', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', 'IBM Plex Mono', monospace",
};

const FONT_LINK_ID = "bhiv-ecc-fonts";

/* ============================================================
   MOCK DATA GENERATORS
============================================================ */
function seedRand(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
const rnd = seedRand(42);

const days = (n) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

const revenueTrend = days(14).map((d, i) => ({
  day: d,
  revenue: Math.round(182000 + i * 4200 + rnd() * 18000 - 9000),
  target: 190000 + i * 4000,
}));

const userGrowth = days(14).map((d, i) => ({
  day: d,
  users: Math.round(24500 + i * 310 + rnd() * 600),
  newUsers: Math.round(180 + rnd() * 90),
}));

const acquisitionFunnel = [
  { stage: "Visitors", value: 48200 },
  { stage: "Signups", value: 12400 },
  { stage: "Activated", value: 6800 },
  { stage: "Paying", value: 2150 },
];

const retentionConversion = days(8).map((d) => ({
  day: d,
  retention: Math.round(78 + rnd() * 6),
  conversion: Math.round(18 + rnd() * 5),
}));

const monthlyPerf = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((m, i) => ({
  month: m,
  revenue: Math.round(1450000 + i * 62000 + rnd() * 40000),
  expense: Math.round(980000 + i * 38000 + rnd() * 25000),
}));

const topProducts = [
  { name: "BHIV Core Platform", value: 38, color: accent.solid },
  { name: "Analytics Suite", value: 26, color: "#8B5CF6" },
  { name: "Workflow Engine", value: 19, color: "#06B6D4" },
  { name: "Mobile SDK", value: 11, color: "#F59E0B" },
  { name: "Other", value: 6, color: "#5B6479" },
];

const regionalDist = [
  { region: "North America", value: 34 },
  { region: "India", value: 29 },
  { region: "Europe", value: 21 },
  { region: "APAC", value: 11 },
  { region: "Other", value: 5 },
];

const deploymentFreq = days(10).map((d) => ({
  day: d,
  deployments: Math.round(3 + rnd() * 9),
  failed: Math.round(rnd() * 2),
}));

const latencyTrend = days(12).map((d) => ({
  day: d,
  p50: Math.round(80 + rnd() * 30),
  p95: Math.round(180 + rnd() * 70),
  p99: Math.round(310 + rnd() * 120),
}));

const burndown = Array.from({ length: 10 }, (_, i) => ({
  day: `D${i + 1}`,
  ideal: 120 - i * 12,
  actual: Math.max(8, Math.round(120 - i * 11.2 - rnd() * 8)),
}));

const services = [
  { name: "API Gateway", icon: Server, status: "healthy", latency: "42ms", uptime: "99.98%" },
  { name: "App Servers", icon: Cpu, status: "healthy", latency: "61ms", uptime: "99.95%" },
  { name: "Primary Database", icon: Database, status: "healthy", latency: "8ms", uptime: "99.99%" },
  { name: "Network / CDN", icon: Wifi, status: "healthy", latency: "12ms", uptime: "100%" },
  { name: "Microservices Mesh", icon: Layers, status: "warning", latency: "210ms", uptime: "99.61%" },
  { name: "Job Queue", icon: GitBranch, status: "healthy", latency: "18ms", uptime: "99.97%" },
  { name: "Auth Service", icon: Shield, status: "healthy", latency: "33ms", uptime: "99.99%" },
  { name: "Payment Service", icon: CreditCard, status: "critical", latency: "1240ms", uptime: "97.42%" },
  { name: "Notification Service", icon: Mail, status: "healthy", latency: "55ms", uptime: "99.93%" },
];

const sprintTasks = {
  completed: 38, pending: 14, blocked: 3, total: 55,
};

const upcomingReleases = [
  { version: "v4.2.0", date: "Jul 4, 2026", scope: "Executive Control Center GA" },
  { version: "v4.2.1", date: "Jul 11, 2026", scope: "Payment service hardening" },
  { version: "v4.3.0", date: "Jul 28, 2026", scope: "Mobile SDK v2" },
];

const criticalAlerts = [
  { id: "INC-2291", title: "Payment Service latency breach (P99 > 1200ms)", severity: "critical", time: "6 min ago", owner: "Platform" },
  { id: "INC-2287", title: "Microservices mesh elevated error rate", severity: "warning", time: "41 min ago", owner: "Platform" },
  { id: "BUG-1820", title: "Checkout double-charge on retry (3 reports)", severity: "critical", time: "2 hr ago", owner: "Payments" },
  { id: "APR-0098", title: "Pending approval: Q3 marketing budget +18%", severity: "info", time: "3 hr ago", owner: "Finance" },
  { id: "DEP-0654", title: "Failed deployment: mobile-sdk-v2 (rollback complete)", severity: "warning", time: "5 hr ago", owner: "Mobile" },
  { id: "SEC-0033", title: "Unusual login pattern flagged — APAC region", severity: "warning", time: "7 hr ago", owner: "Security" },
];

const teamPerformance = [
  { dept: "Engineering", productivity: 87, completion: 91, efficiency: 84, pending: 22 },
  { dept: "Product", productivity: 79, completion: 88, efficiency: 81, pending: 9 },
  { dept: "Operations", productivity: 92, completion: 95, efficiency: 89, pending: 4 },
  { dept: "Support", productivity: 74, completion: 82, efficiency: 77, pending: 31 },
  { dept: "Sales", productivity: 81, completion: 86, efficiency: 79, pending: 16 },
  { dept: "Marketing", productivity: 76, completion: 84, efficiency: 80, pending: 11 },
];

const activityTimeline = [
  { icon: Rocket, text: "v4.1.9 deployed to production by Ananya R.", time: "12 min ago", type: "deploy" },
  { icon: ShieldAlert, text: "Critical incident INC-2291 opened — Payment Service", time: "6 min ago", type: "incident" },
  { icon: LogIn, text: "Raghav Shah (CFO) logged in from Pune office", time: "34 min ago", type: "login" },
  { icon: CheckCircle2, text: "Approval granted: Marketing budget +18% by CFO", time: "1 hr ago", type: "approval" },
  { icon: GitCommit, text: "142 commits merged to release/4.2.0", time: "2 hr ago", type: "system" },
  { icon: Rocket, text: "mobile-sdk-v2 deployment failed, auto-rollback triggered", time: "5 hr ago", type: "deploy" },
  { icon: LogIn, text: "Priya Nair (COO) logged in from Bangalore office", time: "6 hr ago", type: "login" },
  { icon: FileText, text: "Weekly executive report generated and emailed", time: "9 hr ago", type: "system" },
];

const kpis = [
  { label: "Total Revenue", value: "₹2.94Cr", change: 8.4, up: true, icon: TrendingUp, spark: revenueTrend.map(r => r.revenue) },
  { label: "Monthly Active Users", value: "26,840", change: 5.1, up: true, icon: Users, spark: userGrowth.map(u => u.users) },
  { label: "Active Projects", value: "23", change: 2.0, up: true, icon: Briefcase, spark: [18,19,20,19,21,22,22,23] },
  { label: "Critical Incidents", value: "2", change: 100, up: false, icon: AlertTriangle, spark: [0,0,1,0,0,1,1,2] },
  { label: "System Uptime", value: "99.94%", change: 0.03, up: false, icon: Activity, spark: [99.99,99.98,99.97,99.96,99.95,99.94,99.94,99.94] },
  { label: "Deploy Success Rate", value: "96.2%", change: 1.8, up: true, icon: GitBranch, spark: [91,93,94,95,94,96,96,96.2] },
  { label: "Open Issues", value: "47", change: 6.3, up: false, icon: AlertCircle, spark: [38,40,41,44,45,46,47,47] },
  { label: "CSAT Score", value: "4.6/5", change: 1.1, up: true, icon: CheckCircle2, spark: [4.3,4.4,4.4,4.5,4.5,4.6,4.6,4.6] },
];

/* ============================================================
   SMALL HELPERS / PRIMITIVES
============================================================ */
const sevColor = (s) => status[s] || status.info;

function StatusDot({ s, pulse }) {
  const c = sevColor(s);
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8 }}>
      <span style={{ width: 8, height: 8, borderRadius: 99, background: c, display: "block" }} />
      {pulse && (
        <span
          style={{
            position: "absolute", inset: 0, borderRadius: 99, background: c,
            animation: "pulseRing 1.8s ease-out infinite",
          }}
        />
      )}
    </span>
  );
}

function Sparkline({ data, color, height = 32 }) {
  const points = useMemo(() => data.map((v, i) => ({ i, v })), [data]);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={points} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.75} fill={`url(#spark-${color.replace("#", "")})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ============================================================
   MAIN APP
============================================================ */
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "operations", label: "Operations", icon: Activity },
  { id: "engineering", label: "Engineering", icon: Cpu },
  { id: "business", label: "Business", icon: BarChart3 },
  { id: "projects", label: "Projects", icon: Briefcase },
  { id: "analytics", label: "Analytics", icon: PieIcon },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "alerts", label: "Alerts", icon: AlertTriangle, badge: 2 },
  { id: "teams", label: "Teams", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function ExecutiveControlCenter() {
  const [theme, setTheme] = useState("dark");
  const [active, setActive] = useState("dashboard");
  const [alertFilter, setAlertFilter] = useState("all");
  const [now, setNow] = useState(new Date());
  const t = palette[theme];

  useEffect(() => {
    if (!document.getElementById(FONT_LINK_ID)) {
      const link = document.createElement("link");
      link.id = FONT_LINK_ID;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const filteredAlerts =
    alertFilter === "all" ? criticalAlerts : criticalAlerts.filter((a) => a.severity === alertFilter);

  return (
    <div
      style={{
        fontFamily: fontStack.body,
        background: t.bg,
        color: t.text,
        minHeight: "100vh",
        display: "flex",
        transition: "background 0.25s ease, color 0.25s ease",
      }}
    >
      <style>{globalCss(t)}</style>

      {/* SIDEBAR */}
      <aside
        style={{
          width: 232, flexShrink: 0, background: t.bgElevated,
          borderRight: `1px solid ${t.border}`, display: "flex",
          flexDirection: "column", position: "sticky", top: 0, height: "100vh",
        }}
      >
        <div style={{ padding: "22px 20px 18px", display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: 9,
              background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 18px ${accent.solid}55`,
            }}
          >
            <Gauge size={18} color="#fff" strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ fontFamily: fontStack.display, fontWeight: 700, fontSize: 15.5, letterSpacing: "-0.01em" }}>
              BHIV<span style={{ color: accent.solid }}>·ECC</span>
            </div>
            <div style={{ fontSize: 10.5, color: t.textFaint, letterSpacing: "0.04em", fontFamily: fontStack.mono }}>
              CONTROL CENTER
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "6px 12px", overflowY: "auto" }}>
          {NAV.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 11,
                  padding: "9px 12px", marginBottom: 2, borderRadius: 8, border: "none",
                  background: isActive ? (theme === "dark" ? "#1A2230" : "#EAF1FE") : "transparent",
                  color: isActive ? accent.solid : t.textMuted,
                  fontWeight: isActive ? 600 : 500, fontSize: 13.5, cursor: "pointer",
                  fontFamily: fontStack.body, textAlign: "left", transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = t.surfaceHover; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <item.icon size={16.5} strokeWidth={2} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span
                    style={{
                      fontSize: 10.5, fontWeight: 700, background: status.critical, color: "#fff",
                      borderRadius: 99, minWidth: 18, height: 18, display: "flex",
                      alignItems: "center", justifyContent: "center", fontFamily: fontStack.mono, padding: "0 5px",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: 14, borderTop: `1px solid ${t.border}` }}>
          <div
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: 10,
              borderRadius: 10, background: t.surface, border: `1px solid ${t.border}`,
            }}
          >
            <div
              style={{
                width: 30, height: 30, borderRadius: 99, background: `linear-gradient(135deg,#8B5CF6,${accent.to})`,
                display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
                fontWeight: 700, fontSize: 12.5, fontFamily: fontStack.display, flexShrink: 0,
              }}
            >
              RS
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap" }}>Raghav Shah</div>
              <div style={{ fontSize: 10.5, color: t.textFaint }}>CFO · BHIV</div>
            </div>
            <ChevronDown size={14} color={t.textFaint} />
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* TOP BAR */}
        <header
          style={{
            height: 64, flexShrink: 0, display: "flex", alignItems: "center", gap: 16,
            padding: "0 24px", borderBottom: `1px solid ${t.border}`, background: t.bgElevated,
            position: "sticky", top: 0, zIndex: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: t.textMuted }}>
            <span style={{ fontFamily: fontStack.display, fontWeight: 600, color: t.text }}>
              {NAV.find((n) => n.id === active)?.label}
            </span>
            <ChevronRight size={13} color={t.textFaint} />
            <span style={{ fontFamily: fontStack.mono, fontSize: 11.5 }}>
              {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} ·{" "}
              {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} IST
            </span>
          </div>

          {/* System Pulse — signature element */}
          <div
            title="System Pulse — live composite health signal"
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "6px 12px",
              borderRadius: 99, background: t.surface, border: `1px solid ${t.border}`, marginLeft: 6,
            }}
          >
            <StatusDot s="warning" pulse />
            <span style={{ fontSize: 11, color: t.textMuted, fontFamily: fontStack.mono, letterSpacing: "0.02em" }}>
              SYSTEM PULSE
            </span>
            <div style={{ width: 64, height: 20 }}>
              <Sparkline data={[62, 66, 70, 64, 58, 61, 67, 72, 69, 73]} color={status.warning} height={20} />
            </div>
            <span style={{ fontSize: 11.5, fontFamily: fontStack.mono, fontWeight: 600, color: status.warning }}>
              73
            </span>
          </div>

          <div style={{ flex: 1 }} />

          <div
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", width: 280,
              borderRadius: 9, background: t.surface, border: `1px solid ${t.border}`,
            }}
          >
            <Search size={15} color={t.textFaint} />
            <input
              placeholder="Search projects, incidents, people…"
              style={{
                border: "none", outline: "none", background: "transparent", color: t.text,
                fontSize: 12.5, width: "100%", fontFamily: fontStack.body,
              }}
            />
            <span style={{ fontSize: 10.5, color: t.textFaint, fontFamily: fontStack.mono, border: `1px solid ${t.border}`, borderRadius: 4, padding: "1px 5px" }}>
              ⌘K
            </span>
          </div>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            style={iconBtnStyle(t)}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button style={{ ...iconBtnStyle(t), position: "relative" }} aria-label="Notifications">
            <Bell size={16} />
            <span style={{ position: "absolute", top: 6, right: 7, width: 7, height: 7, borderRadius: 99, background: status.critical }} />
          </button>
        </header>

        {/* SCROLLABLE CONTENT */}
        <main style={{ flex: 1, overflowY: "auto", padding: "22px 24px 48px" }}>
          {active === "dashboard" && <DashboardView t={t} theme={theme} alertFilter={alertFilter} setAlertFilter={setAlertFilter} filteredAlerts={filteredAlerts} />}
          {active !== "dashboard" && <PlaceholderSection t={t} sectionId={active} />}
        </main>
      </div>
    </div>
  );
}

/* ============================================================
   DASHBOARD VIEW — all 9 sections, single scroll-light canvas
============================================================ */
function DashboardView({ t, theme, alertFilter, setAlertFilter, filteredAlerts }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHeader t={t} title="Executive Summary" subtitle="Is the company healthy? — top-line view" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {kpis.map((k) => <KpiCard key={k.label} k={k} t={t} />)}
      </div>

      <SectionHeader t={t} title="Operational Health" subtitle="Are our systems healthy? — live service status" />
      <Card t={t} pad={16}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {services.map((s) => <ServiceRow key={s.name} s={s} t={t} />)}
        </div>
      </Card>

      <SectionHeader t={t} title="Business Intelligence" subtitle="What are the important business metrics?" />
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
        <ChartCard t={t} title="Revenue Trend vs Target" subtitle="Last 14 days · ₹">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent.solid} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={accent.solid} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={t.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10.5, fill: t.textFaint }} axisLine={{ stroke: t.border }} tickLine={false} />
              <YAxis tick={{ fontSize: 10.5, fill: t.textFaint }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<MonoTooltip t={t} />} />
              <Area type="monotone" dataKey="revenue" stroke={accent.solid} strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
              <Line type="monotone" dataKey="target" stroke={t.textFaint} strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Target" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard t={t} title="Top Products" subtitle="Revenue share %">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={topProducts} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={2}>
                {topProducts.map((p, i) => <Cell key={i} fill={p.color} stroke={t.surface} strokeWidth={2} />)}
              </Pie>
              <Tooltip content={<MonoTooltip t={t} />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {topProducts.map((p) => (
              <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: t.textMuted }}>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: p.color }} />
                {p.name} <span style={{ fontFamily: fontStack.mono, color: t.text }}>{p.value}%</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard t={t} title="User Growth" subtitle="MAU + new signups, 14d">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={userGrowth}>
              <CartesianGrid stroke={t.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: t.textFaint }} axisLine={{ stroke: t.border }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.textFaint }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<MonoTooltip t={t} />} />
              <Bar dataKey="newUsers" fill={accent.to} radius={[4, 4, 0, 0]} name="New Users" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard t={t} title="Retention vs Conversion" subtitle="% over 8 days">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={retentionConversion}>
              <CartesianGrid stroke={t.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: t.textFaint }} axisLine={{ stroke: t.border }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.textFaint }} axisLine={false} tickLine={false} width={32} domain={[0, 100]} />
              <Tooltip content={<MonoTooltip t={t} />} />
              <Line type="monotone" dataKey="retention" stroke={status.healthy} strokeWidth={2} dot={false} name="Retention" />
              <Line type="monotone" dataKey="conversion" stroke="#8B5CF6" strokeWidth={2} dot={false} name="Conversion" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard t={t} title="Regional Distribution" subtitle="Revenue share by region" span={2}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={regionalDist} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid stroke={t.border} strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: t.textFaint }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="region" tick={{ fontSize: 11, fill: t.textMuted }} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<MonoTooltip t={t} />} />
              <Bar dataKey="value" fill={accent.solid} radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <SectionHeader t={t} title="Engineering Dashboard" subtitle="Build, deploy, and runtime performance" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <MetricCard t={t} label="Current Release" value="v4.1.9" icon={GitBranch} note="Deployed 12 min ago" />
        <MetricCard t={t} label="Code Coverage" value="84.2%" icon={CheckCircle2} note="+1.3% this week" color={status.healthy} />
        <MetricCard t={t} label="Avg Response Time" value="96ms" icon={Zap} note="P50 latency" />
        <MetricCard t={t} label="Production Errors" value="14" icon={XCircle} note="Last 24h" color={status.warning} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <ChartCard t={t} title="Deployment Frequency" subtitle="Deploys/day, failed in red">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deploymentFreq}>
              <CartesianGrid stroke={t.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: t.textFaint }} axisLine={{ stroke: t.border }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.textFaint }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<MonoTooltip t={t} />} />
              <Bar dataKey="deployments" stackId="d" fill={status.healthy} radius={[4, 4, 0, 0]} name="Successful" />
              <Bar dataKey="failed" stackId="d" fill={status.critical} radius={[4, 4, 0, 0]} name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} title="Latency Distribution" subtitle="P50 / P95 / P99 (ms)">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={latencyTrend}>
              <CartesianGrid stroke={t.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: t.textFaint }} axisLine={{ stroke: t.border }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: t.textFaint }} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<MonoTooltip t={t} />} />
              <Line type="monotone" dataKey="p50" stroke={status.healthy} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="p95" stroke={status.warning} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="p99" stroke={status.critical} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <SectionHeader t={t} title="Sprint Execution" subtitle="Are projects progressing?" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <Card t={t} pad={18}>
          <div style={{ fontSize: 12.5, color: t.textMuted, marginBottom: 10 }}>Current Sprint — Sprint 24</div>
          <ProgressBar t={t} value={Math.round((sprintTasks.completed / sprintTasks.total) * 100)} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 12 }}>
            <StatPill t={t} label="Completed" value={sprintTasks.completed} color={status.healthy} />
            <StatPill t={t} label="Pending" value={sprintTasks.pending} color={status.warning} />
            <StatPill t={t} label="Blocked" value={sprintTasks.blocked} color={status.critical} />
          </div>
        </Card>
        <ChartCard t={t} title="Burn-down" subtitle="Story points remaining">
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={burndown}>
              <CartesianGrid stroke={t.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 9.5, fill: t.textFaint }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9.5, fill: t.textFaint }} axisLine={false} tickLine={false} width={24} />
              <Tooltip content={<MonoTooltip t={t} />} />
              <Line type="monotone" dataKey="ideal" stroke={t.textFaint} strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="Ideal" />
              <Line type="monotone" dataKey="actual" stroke={accent.solid} strokeWidth={2} dot={false} name="Actual" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <Card t={t} pad={18}>
          <div style={{ fontSize: 12.5, color: t.textMuted, marginBottom: 10 }}>Upcoming Releases</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {upcomingReleases.map((r) => (
              <div key={r.version} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Rocket size={14} color={accent.solid} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, fontFamily: fontStack.mono }}>{r.version}</div>
                  <div style={{ fontSize: 10.5, color: t.textFaint }}>{r.scope}</div>
                </div>
                <div style={{ fontSize: 10.5, color: t.textMuted, fontFamily: fontStack.mono }}>{r.date}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <SectionHeader t={t} title="Critical Alerts" subtitle="Are there any critical issues?" />
      <Card t={t} pad={16}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {["all", "critical", "warning", "info"].map((f) => (
            <button
              key={f}
              onClick={() => setAlertFilter(f)}
              style={{
                fontSize: 11.5, padding: "5px 12px", borderRadius: 99, fontFamily: fontStack.body,
                border: `1px solid ${alertFilter === f ? accent.solid : t.border}`,
                background: alertFilter === f ? `${accent.solid}1A` : "transparent",
                color: alertFilter === f ? accent.solid : t.textMuted,
                cursor: "pointer", fontWeight: 600, textTransform: "capitalize",
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredAlerts.map((a) => <AlertRow key={a.id} a={a} t={t} />)}
        </div>
      </Card>

      <SectionHeader t={t} title="Team Performance" subtitle="Department productivity and load" />
      <Card t={t} pad={16}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={teamPerformance}>
            <CartesianGrid stroke={t.border} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="dept" tick={{ fontSize: 10.5, fill: t.textFaint }} axisLine={{ stroke: t.border }} tickLine={false} />
            <YAxis tick={{ fontSize: 10.5, fill: t.textFaint }} axisLine={false} tickLine={false} width={32} />
            <Tooltip content={<MonoTooltip t={t} />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="productivity" fill={accent.solid} radius={[4, 4, 0, 0]} name="Productivity %" />
            <Bar dataKey="completion" fill={status.healthy} radius={[4, 4, 0, 0]} name="Completion %" />
            <Bar dataKey="efficiency" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Efficiency %" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <SectionHeader t={t} title="Activity Timeline" subtitle="Latest deployments, incidents, approvals, logins" />
      <Card t={t} pad={16}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {activityTimeline.map((e, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < activityTimeline.length - 1 ? `1px solid ${t.border}` : "none" }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, background: t.surfaceHover, border: `1px solid ${t.border}`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <e.icon size={14} color={t.textMuted} />
              </div>
              <div style={{ flex: 1, fontSize: 12.5 }}>{e.text}</div>
              <div style={{ fontSize: 11, color: t.textFaint, fontFamily: fontStack.mono, whiteSpace: "nowrap" }}>{e.time}</div>
            </div>
          ))}
        </div>
      </Card>

      <SectionHeader t={t} title="Quick Actions" subtitle="What should leadership focus on today?" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <QuickAction t={t} icon={CheckCircle2} label="Approve Deployment" desc="1 pending in review" />
        <QuickAction t={t} icon={PlusCircle} label="Create Incident" desc="Log a new issue" />
        <QuickAction t={t} icon={Download} label="Generate Executive Report" desc="PDF, last 7 days" />
        <QuickAction t={t} icon={BarChart3} label="View Reports" desc="Saved & scheduled" />
        <QuickAction t={t} icon={UserPlus} label="Manage Users" desc="14 pending invites" />
        <QuickAction t={t} icon={SlidersHorizontal} label="System Settings" desc="Roles, integrations" />
      </div>
    </div>
  );
}

/* ============================================================
   REUSABLE COMPONENTS
============================================================ */
function SectionHeader({ t, title, subtitle }) {
  return (
    <div style={{ marginTop: 4 }}>
      <h2 style={{ fontFamily: fontStack.display, fontSize: 16.5, fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>
        {title}
      </h2>
      <p style={{ fontSize: 12, color: t.textFaint, margin: "3px 0 0" }}>{subtitle}</p>
    </div>
  );
}

function Card({ t, children, pad = 16, span }) {
  return (
    <div
      style={{
        background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14,
        padding: pad, gridColumn: span ? `span ${span}` : undefined,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      {children}
    </div>
  );
}

function ChartCard({ t, title, subtitle, children, span }) {
  return (
    <Card t={t} pad={16} span={span}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 11, color: t.textFaint }}>{subtitle}</div>
      </div>
      {children}
    </Card>
  );
}

function KpiCard({ k, t }) {
  const color = k.up ? status.healthy : status.critical;
  return (
    <Card t={t} pad={16}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 12, color: t.textMuted, fontWeight: 500 }}>{k.label}</div>
        <k.icon size={15} color={t.textFaint} />
      </div>
      <div style={{ fontFamily: fontStack.mono, fontSize: 23, fontWeight: 700, margin: "6px 0 2px" }}>{k.value}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
        {k.up ? <ArrowUpRight size={13} color={color} /> : <ArrowDownRight size={13} color={color} />}
        <span style={{ fontSize: 11.5, color, fontFamily: fontStack.mono, fontWeight: 600 }}>{k.change}%</span>
        <span style={{ fontSize: 10.5, color: t.textFaint }}>vs last period</span>
      </div>
      <Sparkline data={k.spark} color={color} />
    </Card>
  );
}

function ServiceRow({ s, t }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
        borderRadius: 10, border: `1px solid ${t.border}`, background: t.bgElevated,
      }}
    >
      <s.icon size={16} color={t.textMuted} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{s.name}</div>
        <div style={{ fontSize: 10.5, color: t.textFaint, fontFamily: fontStack.mono }}>
          {s.latency} · {s.uptime}
        </div>
      </div>
      <StatusDot s={s.status} pulse={s.status !== "healthy"} />
    </div>
  );
}

function MetricCard({ t, label, value, icon: Icon, note, color }) {
  return (
    <Card t={t} pad={16}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: t.textMuted }}>{label}</span>
        <Icon size={15} color={color || t.textFaint} />
      </div>
      <div style={{ fontFamily: fontStack.mono, fontSize: 21, fontWeight: 700, margin: "6px 0 2px", color: color || t.text }}>{value}</div>
      <div style={{ fontSize: 11, color: t.textFaint }}>{note}</div>
    </Card>
  );
}

function ProgressBar({ t, value }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11.5 }}>
        <span style={{ color: t.textMuted }}>Progress</span>
        <span style={{ fontFamily: fontStack.mono, fontWeight: 700 }}>{value}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 99, background: t.surfaceHover, border: `1px solid ${t.border}`, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, borderRadius: 99, background: `linear-gradient(90deg, ${accent.from}, ${accent.to})` }} />
      </div>
    </div>
  );
}

function StatPill({ t, label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: fontStack.mono, fontSize: 17, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 10.5, color: t.textFaint }}>{label}</div>
    </div>
  );
}

function AlertRow({ a, t }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "11px 12px",
        borderRadius: 10, border: `1px solid ${t.border}`, background: t.bgElevated,
      }}
    >
      <StatusDot s={a.severity} pulse={a.severity === "critical"} />
      <span style={{ fontSize: 10.5, fontFamily: fontStack.mono, color: t.textFaint, width: 76, flexShrink: 0 }}>{a.id}</span>
      <span style={{ fontSize: 12.5, flex: 1 }}>{a.title}</span>
      <span style={{ fontSize: 10.5, color: t.textFaint, background: t.surfaceHover, padding: "2px 8px", borderRadius: 99 }}>{a.owner}</span>
      <span style={{ fontSize: 11, color: t.textFaint, fontFamily: fontStack.mono, width: 80, textAlign: "right" }}>{a.time}</span>
    </div>
  );
}

function QuickAction({ t, icon: Icon, label, desc }) {
  return (
    <button
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
        borderRadius: 12, border: `1px solid ${t.border}`, background: t.surface,
        cursor: "pointer", textAlign: "left", fontFamily: fontStack.body,
        transition: "border-color 0.15s ease, transform 0.1s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent.solid; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
        background: `linear-gradient(135deg, ${accent.from}22, ${accent.to}22)`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={17} color={accent.solid} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{label}</div>
        <div style={{ fontSize: 11, color: t.textFaint }}>{desc}</div>
      </div>
    </button>
  );
}

function MonoTooltip({ active, payload, label, t }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.borderStrong}`, borderRadius: 8,
      padding: "8px 10px", fontSize: 11.5, fontFamily: fontStack.mono, color: t.text,
      boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
    }}>
      <div style={{ color: t.textFaint, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || p.stroke || p.fill }}>
          {p.name}: <strong>{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</strong>
        </div>
      ))}
    </div>
  );
}

function iconBtnStyle(t) {
  return {
    width: 36, height: 36, borderRadius: 9, border: `1px solid ${t.border}`,
    background: t.surface, color: t.textMuted, display: "flex",
    alignItems: "center", justifyContent: "center", cursor: "pointer",
  };
}

function PlaceholderSection({ t, sectionId }) {
  const label = NAV.find((n) => n.id === sectionId)?.label;
  return (
    <div style={{
      height: "70vh", display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", color: t.textFaint, gap: 10,
    }}>
      <Layers size={28} />
      <div style={{ fontSize: 13.5 }}>
        {label} detail view — wire up data sources here. Foundation is shared with the Dashboard tab.
      </div>
    </div>
  );
}

/* ============================================================
   GLOBAL CSS
============================================================ */
function globalCss(t) {
  return `
    * { box-sizing: border-box; }
    body { margin: 0; }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-thumb { background: ${t.borderStrong}; border-radius: 99px; }
    ::-webkit-scrollbar-track { background: transparent; }
    button:focus-visible, input:focus-visible { outline: 2px solid ${accent.solid}; outline-offset: 1px; }
    @keyframes pulseRing {
      0% { transform: scale(1); opacity: 0.6; }
      100% { transform: scale(2.4); opacity: 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      * { animation: none !important; transition: none !important; }
    }
  `;
}
