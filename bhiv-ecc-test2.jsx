/**
 * BHIV Executive Control Center - Test 2
 * Built on top of Test 1 foundation.
 *
 * What changed in Test 2:
 * - Primary view is live operational state (NOW), not historical charts
 * - Command engine added: every action has confirm -> execute -> success/failure -> audit
 * - Command Panel drawer, global search (cmd+K), Situation Bar
 * - Audit log, notification system, per-command rollback where applicable
 * - Operations, Engineering, Alerts, Teams pages wired up
 * - Charts moved to Business tab (secondary, not primary)
 *
 * Command lifecycle: idle -> confirm -> executing -> success | failure -> (rollback) -> audited
 */

import { useState, useEffect, useCallback, useReducer, useRef, createContext, useContext } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  LayoutGrid, Activity, Cpu, BarChart3, Briefcase, PieChart as PieIcon,
  FileText, AlertTriangle, Users, Settings, Search, Bell, ChevronDown,
  Sun, Moon, TrendingUp, ArrowUpRight, ArrowDownRight, CheckCircle2,
  XCircle, AlertCircle, Server, Database, Wifi, Shield, CreditCard,
  Mail, Layers, GitBranch, Gauge, Zap, PlusCircle, Download,
  UserPlus, SlidersHorizontal, ChevronRight, Rocket, RotateCcw,
  Pause, StopCircle, AlertOctagon, MessageSquare, Terminal,
  Command, History, CheckSquare, X, Loader2, ShieldAlert, LogIn, GitCommit,
  RefreshCw, Eye, Ban, Siren, ClipboardCheck, Inbox, Radio,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS - single source inherited from Test 1
// ─────────────────────────────────────────────────────────────
const DS = {
  color: {
    dark: {
      bg:           "#090C12",
      bgElevated:   "#0C1018",
      surface:      "#101520",
      surfaceHover: "#141A24",
      surfaceActive:"#182030",
      border:       "#1C2230",
      borderStrong: "#263040",
      text:         "#DDE2EC",
      textSub:      "#8892A6",
      textMuted:    "#546070",
    },
    light: {
      bg:           "#F0F2F6",
      bgElevated:   "#FAFBFD",
      surface:      "#FFFFFF",
      surfaceHover: "#F4F6FA",
      surfaceActive:"#EAF0FC",
      border:       "#E0E4EE",
      borderStrong: "#C8CEDC",
      text:         "#111520",
      textSub:      "#505C72",
      textMuted:    "#8892A6",
    },
  },
  accent: {
    primary:  "#2E7CF6",
    glow:     "rgba(46,124,246,0.18)",
    gradient: "linear-gradient(135deg,#2E7CF6,#06B8D0)",
  },
  status: {
    healthy:  "#22C55E",
    warning:  "#F59E0B",
    critical: "#EF4444",
    info:     "#6366F1",
    neutral:  "#64748B",
  },
  font: {
    display: "'Sora','Inter',system-ui,sans-serif",
    body:    "'Inter',system-ui,sans-serif",
    mono:    "'JetBrains Mono','IBM Plex Mono',monospace",
  },
  radius: { sm:6, md:10, lg:14, xl:18 },
  shadow: {
    card:    "0 1px 3px rgba(0,0,0,0.08)",
    overlay: "0 8px 32px rgba(0,0,0,0.32)",
    glow:    "0 0 24px rgba(46,124,246,0.22)",
  },
};

// ─────────────────────────────────────────────────────────────
// MOCK DATA - live-state focused (what is happening NOW)
// ─────────────────────────────────────────────────────────────
function seededRand(seed=42){let s=seed;return()=>{s=(s*9301+49297)%233280;return s/233280;};}
const r=seededRand();
const days=(n)=>Array.from({length:n},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(n-1-i));return d.toLocaleDateString("en-US",{month:"short",day:"numeric"});});

const MOCK = {
  // Live service states - what is healthy RIGHT NOW
  services: [
    {id:"api",  name:"API Gateway",          icon:Server,    status:"healthy",  latency:"42ms",   uptime:"99.98%", rpm:8420},
    {id:"app",  name:"App Servers",           icon:Cpu,       status:"healthy",  latency:"61ms",   uptime:"99.95%", rpm:6100},
    {id:"db",   name:"Primary Database",      icon:Database,  status:"healthy",  latency:"8ms",    uptime:"99.99%", rpm:3200},
    {id:"net",  name:"Network / CDN",         icon:Wifi,      status:"healthy",  latency:"12ms",   uptime:"100%",   rpm:12000},
    {id:"mesh", name:"Microservices Mesh",    icon:Layers,    status:"warning",  latency:"210ms",  uptime:"99.61%", rpm:2400},
    {id:"queue",name:"Job Queue",             icon:GitBranch, status:"healthy",  latency:"18ms",   uptime:"99.97%", rpm:940},
    {id:"auth", name:"Auth Service",          icon:Shield,    status:"healthy",  latency:"33ms",   uptime:"99.99%", rpm:5500},
    {id:"pay",  name:"Payment Service",       icon:CreditCard,status:"critical", latency:"1240ms", uptime:"97.42%", rpm:310},
    {id:"notif",name:"Notification Service",  icon:Mail,      status:"healthy",  latency:"55ms",   uptime:"99.93%", rpm:780},
  ],

  // Open incidents requiring action now
  activeIncidents: [
    {id:"INC-2291",title:"Payment Service P99 latency breach (>1200ms)", severity:"critical", status:"investigating", age:"6 min",  owner:"Platform", assignee:"Kunal S."},
    {id:"INC-2287",title:"Microservices mesh elevated error rate (4.2%)", severity:"warning",  status:"monitoring",    age:"41 min", owner:"Platform", assignee:"Ananya R."},
    {id:"INC-2280",title:"Auth service elevated 401 rate - now resolved", severity:"warning",  status:"resolved",      age:"3 hr",   owner:"Security", assignee:"Priya N."},
  ],

  // Approvals waiting on Raghav right now
  pendingApprovals: [
    {id:"APR-0101",title:"Deploy v4.2.0 to Production",   requester:"Ananya R.",  dept:"Platform",  priority:"high",   age:"18 min", type:"deployment"},
    {id:"APR-0100",title:"Q3 Marketing Budget +18%",      requester:"Priya N.",   dept:"Marketing", priority:"medium", age:"2 hr",   type:"budget"},
    {id:"APR-0099",title:"Incident Escalation: INC-2291", requester:"Kunal S.",   dept:"Platform",  priority:"high",   age:"6 min",  type:"incident"},
    {id:"APR-0098",title:"New Vendor Onboarding - AWS",   requester:"Ravi M.",    dept:"Infra",     priority:"low",    age:"1 day",  type:"vendor"},
  ],

  // Operations running right now
  runningOps: [
    {id:"OP-0044",title:"Data lake sync - Q2 export",  progress:62, startedBy:"Scheduled", elapsed:"14 min"},
    {id:"OP-0043",title:"User cohort re-indexing",      progress:31, startedBy:"Rahul M.",  elapsed:"8 min"},
    {id:"OP-0042",title:"Security audit scan - prod",   progress:88, startedBy:"Scheduled", elapsed:"22 min"},
  ],

  // Recent command history / audit
  commandHistory: [
    {id:"CMD-0091",cmd:"Acknowledge Alert",  target:"INC-2287",   status:"success",  actor:"Raghav S.", time:"8 min ago"},
    {id:"CMD-0090",cmd:"Rollback Deployment",target:"v4.1.8-rc",  status:"success",  actor:"Ananya R.", time:"32 min ago"},
    {id:"CMD-0089",cmd:"Approve Budget",     target:"APR-0097",   status:"success",  actor:"Raghav S.", time:"2 hr ago"},
    {id:"CMD-0088",cmd:"Create Incident",    target:"INC-2291",   status:"success",  actor:"Kunal S.",  time:"6 min ago"},
    {id:"CMD-0087",cmd:"Escalate Incident",  target:"INC-2280",   status:"failure",  actor:"Priya N.",  time:"3 hr ago"},
    {id:"CMD-0086",cmd:"Pause Job Queue",    target:"queue-2",    status:"rollback", actor:"Ananya R.", time:"5 hr ago"},
  ],

  // KPIs - current snapshot values
  kpis: [
    {id:"rev",  label:"Revenue (MTD)",         value:"2.94Cr",  unit:"INR", change:8.4,  up:true,  icon:TrendingUp,    spark:[182,188,191,187,195,201,210,218,224,232,239,248,260,270]},
    {id:"mau",  label:"Active Users (now)",     value:"26,840",  unit:"",    change:5.1,  up:true,  icon:Users,         spark:[24.5,24.7,24.9,25.1,25.3,25.6,25.8,26.0,26.2,26.4,26.6,26.7,26.8,26.8]},
    {id:"proj", label:"Active Projects",        value:"23",      unit:"",    change:2.0,  up:true,  icon:Briefcase,     spark:[18,19,20,19,21,22,22,22,23,23,23,23,23,23]},
    {id:"inc",  label:"Open Incidents",         value:"2",       unit:"",    change:100,  up:false, icon:AlertTriangle,  spark:[0,0,1,0,0,0,1,1,1,2,2,2,2,2]},
    {id:"up",   label:"System Uptime",          value:"99.94%",  unit:"",    change:0.03, up:false, icon:Activity,      spark:[99.99,99.98,99.97,99.96,99.95,99.95,99.94,99.94,99.94,99.94,99.94,99.94,99.94,99.94]},
    {id:"dep",  label:"Deploy Success Rate",    value:"96.2%",   unit:"",    change:1.8,  up:true,  icon:GitBranch,     spark:[91,92,93,94,94,95,95,95,96,96,96,96.2,96.2,96.2]},
    {id:"iss",  label:"Open Issues",            value:"47",      unit:"",    change:6.3,  up:false, icon:AlertCircle,   spark:[38,40,41,44,45,45,46,46,47,47,47,47,47,47]},
    {id:"csat", label:"CSAT Score",             value:"4.6/5",   unit:"",    change:1.1,  up:true,  icon:CheckCircle2,  spark:[4.3,4.4,4.4,4.4,4.5,4.5,4.5,4.5,4.6,4.6,4.6,4.6,4.6,4.6]},
  ],

  // Business charts - moved to secondary Business tab
  revenueTrend: days(14).map((d,i)=>({day:d,revenue:Math.round(182000+i*4200+r()*18000-9000),target:190000+i*4000})),
  deployFreq:   days(10).map(d=>({day:d,ok:Math.round(3+r()*9),fail:Math.round(r()*2)})),
  latency:      days(12).map(d=>({day:d,p50:Math.round(80+r()*30),p95:Math.round(180+r()*70),p99:Math.round(310+r()*120)})),
  burndown:     Array.from({length:10},(_,i)=>({day:`D${i+1}`,ideal:120-i*12,actual:Math.max(8,Math.round(120-i*11.2-r()*8))})),
  teamPerf:     [
    {dept:"Engineering",prod:87,comp:91,eff:84},
    {dept:"Product",    prod:79,comp:88,eff:81},
    {dept:"Operations", prod:92,comp:95,eff:89},
    {dept:"Support",    prod:74,comp:82,eff:77},
    {dept:"Sales",      prod:81,comp:86,eff:79},
    {dept:"Marketing",  prod:76,comp:84,eff:80},
  ],
  topProducts:[
    {name:"BHIV Core Platform",value:38,color:"#2E7CF6"},
    {name:"Analytics Suite",   value:26,color:"#8B5CF6"},
    {name:"Workflow Engine",   value:19,color:"#06B8D0"},
    {name:"Mobile SDK",        value:11,color:"#F59E0B"},
    {name:"Other",             value:6, color:"#546070"},
  ],
  userGrowth: days(14).map((d,i)=>({day:d,users:Math.round(24500+i*310+r()*600),newUsers:Math.round(180+r()*90)})),

  // Activity feed - what just happened
  activityFeed: [
    {icon:ShieldAlert, text:"INC-2291 opened - Payment Service P99 breach",  time:"6 min ago",  type:"incident"},
    {icon:Rocket,      text:"v4.1.9 deployed to production by Ananya R.",     time:"12 min ago", type:"deploy"},
    {icon:LogIn,       text:"Raghav Shah logged in from Pune office",         time:"34 min ago", type:"login"},
    {icon:CheckCircle2,text:"INC-2287 acknowledged by Raghav S.",             time:"8 min ago",  type:"approval"},
    {icon:GitCommit,   text:"142 commits merged to release/4.2.0",            time:"2 hr ago",   type:"system"},
    {icon:Rocket,      text:"mobile-sdk-v2 deployment failed - auto-rollback triggered", time:"5 hr ago", type:"deploy"},
  ],
};

// ─────────────────────────────────────────────────────────────
// MOCK SERVICE LAYER - Promise-based, maps to future REST APIs
// ─────────────────────────────────────────────────────────────
const MockService = {
  // PUT /api/v1/approvals/:id/approve
  approveRequest:   (id)   => new Promise((res)   => setTimeout(()=>res({id,approved:true}),    1200)),
  // PUT /api/v1/approvals/:id/reject
  rejectRequest:    (id)   => new Promise((res)   => setTimeout(()=>res({id,rejected:true}),    800)),
  // PATCH /api/v1/alerts/:id/acknowledge
  acknowledgeAlert: (id)   => new Promise((res)   => setTimeout(()=>res({id,acknowledged:true}),800)),
  // POST /api/v1/services/:id/restart - payment service intentionally fails to demo failure path
  restartService:   (id)   => new Promise((res,rej)=> setTimeout(()=> id==="pay" ? rej(new Error("Service locked - requires Platform Lead approval")) : res({restarted:id}), 1400)),
  // POST /api/v1/incidents
  createIncident:   (data) => new Promise((res)   => setTimeout(()=>res({id:`INC-${Date.now()}`,...data}),1000)),
  // POST /api/v1/reports/generate
  generateReport:   (type) => new Promise((res)   => setTimeout(()=>res({type,url:`/reports/${type}-${Date.now()}.pdf`}),1600)),
  // POST /api/v1/operations/:id/pause
  pauseOperation:   (id)   => new Promise((res)   => setTimeout(()=>res({id,paused:true}),      1000)),
  // POST /api/v1/operations/:id/stop
  stopOperation:    (id)   => new Promise((res)   => setTimeout(()=>res({id,stopped:true}),     800)),
  // POST /api/v1/incidents/:id/escalate
  escalateIncident: (id)   => new Promise((res)   => setTimeout(()=>res({id,escalated:true}),   1200)),
  // POST /api/v1/audit/:id/rollback
  rollbackCommand:  (id)   => new Promise((res)   => setTimeout(()=>res({rolledBack:id}),        900)),
  // POST /api/v1/alerts/:id/silence
  silenceAlert:     (id)   => new Promise((res)   => setTimeout(()=>res({id,silenced:true}),    700)),
};

// ─────────────────────────────────────────────────────────────
// COMMAND ENGINE - useCommand hook + state machine
// ─────────────────────────────────────────────────────────────
const CMD = {IDLE:"idle",CONFIRM:"confirm",EXECUTING:"executing",SUCCESS:"success",FAILURE:"failure",ROLLING_BACK:"rolling_back",ROLLED_BACK:"rolled_back"};

function cmdReducer(state,action){
  switch(action.type){
    case "OPEN":        return{...state,phase:CMD.CONFIRM,target:action.target};
    case "START":       return{...state,phase:CMD.EXECUTING,error:null};
    case "SUCCESS":     return{...state,phase:CMD.SUCCESS,result:action.result,auditId:action.auditId};
    case "FAILURE":     return{...state,phase:CMD.FAILURE,error:action.error};
    case "ROLLBACK_START":return{...state,phase:CMD.ROLLING_BACK};
    case "ROLLBACK_END":  return{...state,phase:CMD.ROLLED_BACK};
    case "RESET":       return{phase:CMD.IDLE,target:null,error:null,result:null,auditId:null};
    default:            return state;
  }
}

function useCommand({label,serviceCall,canRollback=false,onAudit}){
  const [state,dispatch]=useReducer(cmdReducer,{phase:CMD.IDLE,target:null,error:null,result:null,auditId:null});

  const confirm  = useCallback((target)=>dispatch({type:"OPEN",target}),[]);
  const cancel   = useCallback(()=>dispatch({type:"RESET"}),[]);
  const reset    = useCallback(()=>dispatch({type:"RESET"}),[]);

  const execute  = useCallback(async(payload)=>{
    dispatch({type:"START"});
    try{
      const result=await serviceCall(payload??state.target);
      const auditId=`AUD-${Date.now()}`;
      dispatch({type:"SUCCESS",result,auditId});
      onAudit?.({label,target:state.target,status:"success",auditId,ts:new Date().toISOString()});
    }catch(err){
      dispatch({type:"FAILURE",error:err.message});
      onAudit?.({label,target:state.target,status:"failure",error:err.message,ts:new Date().toISOString()});
    }
  },[label,serviceCall,state.target,onAudit]);

  const rollback = useCallback(async()=>{
    if(!canRollback||!state.auditId)return;
    dispatch({type:"ROLLBACK_START"});
    await MockService.rollbackCommand(state.auditId);
    dispatch({type:"ROLLBACK_END"});
    onAudit?.({label:`ROLLBACK: ${label}`,target:state.auditId,status:"rollback",ts:new Date().toISOString()});
  },[canRollback,state.auditId,label,onAudit]);

  return{state,confirm,cancel,execute,reset,rollback,phase:state.phase};
}

// ─────────────────────────────────────────────────────────────
// CONTEXTS
// ─────────────────────────────────────────────────────────────
const ThemeCtx = createContext(null);
const AuditCtx = createContext(null);
const PanelCtx = createContext(null);
const NotifCtx = createContext(null);

const useTheme = ()=>useContext(ThemeCtx);
const useAudit = ()=>useContext(AuditCtx);
const usePanel = ()=>useContext(PanelCtx);
const useNotif = ()=>useContext(NotifCtx);

// ─────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────
const NAV=[
  {id:"dashboard",  label:"Dashboard",  icon:LayoutGrid,    badge:null},
  {id:"operations", label:"Operations", icon:Activity,      badge:null},
  {id:"engineering",label:"Engineering",icon:Cpu,           badge:null},
  {id:"business",   label:"Business",   icon:BarChart3,     badge:null},
  {id:"projects",   label:"Projects",   icon:Briefcase,     badge:null},
  {id:"alerts",     label:"Alerts",     icon:AlertTriangle, badge:2},
  {id:"teams",      label:"Teams",      icon:Users,         badge:null},
  {id:"reports",    label:"Reports",    icon:FileText,      badge:null},
  {id:"settings",   label:"Settings",   icon:Settings,      badge:null},
];

export default function App(){
  const [theme,setTheme]         = useState("dark");
  const [activePage,setActivePage] = useState("dashboard");
  const [auditLog,setAuditLog]   = useState(MOCK.commandHistory);
  const [panelOpen,setPanelOpen] = useState(false);
  const [cmdSearch,setCmdSearch] = useState(false);
  const [notifs,setNotifs]       = useState([
    {id:1,text:"Payment Service critical - P99 breach",       severity:"critical",read:false,time:"6 min ago"},
    {id:2,text:"Microservices mesh warning elevated",          severity:"warning", read:false,time:"42 min ago"},
    {id:3,text:"v4.1.9 deployed to production",               severity:"info",    read:true, time:"1 hr ago"},
    {id:4,text:"Approval pending: APR-0101 (deploy v4.2.0)",  severity:"info",    read:false,time:"18 min ago"},
  ]);

  const t=DS.color[theme];

  const addAudit=useCallback((entry)=>{
    setAuditLog(prev=>[{
      id:`AUD-${Date.now()}`,
      cmd:entry.label,
      target:String(entry.target?.id||entry.target||"-"),
      status:entry.status,
      actor:"Raghav S.",
      time:"just now"
    },...prev]);
  },[]);

  const addNotif =useCallback((n)=>setNotifs(p=>[{id:Date.now(),...n,read:false,time:"just now"},...p]),[]);
  const markRead =useCallback((id)=>setNotifs(p=>p.map(n=>n.id===id?{...n,read:true}:n)),[]);

  useEffect(()=>{
    if(!document.getElementById("bhiv-fonts")){
      const l=document.createElement("link");
      l.id="bhiv-fonts";l.rel="stylesheet";
      l.href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap";
      document.head.appendChild(l);
    }
  },[]);

  return(
    <ThemeCtx.Provider value={{theme,t,setTheme}}>
    <AuditCtx.Provider value={{auditLog,addAudit}}>
    <PanelCtx.Provider value={{panelOpen,setPanelOpen,cmdSearch,setCmdSearch}}>
    <NotifCtx.Provider value={{notifs,addNotif,markRead}}>
      <div style={{fontFamily:DS.font.body,background:t.bg,color:t.text,minHeight:"100vh",display:"flex",transition:"background .22s,color .22s"}}>
        <GlobalCss t={t}/>
        <Sidebar activePage={activePage} setActivePage={setActivePage}/>
        <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column"}}>
          <Topbar activePage={activePage}/>
          <main style={{flex:1,overflowY:"auto",padding:"18px 22px 56px"}}>
            {activePage==="dashboard"   &&<DashboardPage   addAudit={addAudit} addNotif={addNotif}/>}
            {activePage==="operations"  &&<OperationsPage  addAudit={addAudit} addNotif={addNotif}/>}
            {activePage==="engineering" &&<EngineeringPage addAudit={addAudit}/>}
            {activePage==="business"    &&<BusinessPage/>}
            {activePage==="alerts"      &&<AlertsPage      addAudit={addAudit} addNotif={addNotif}/>}
            {activePage==="teams"       &&<TeamsPage/>}
            {!["dashboard","operations","engineering","business","alerts","teams"].includes(activePage)&&<ComingSoon label={NAV.find(n=>n.id===activePage)?.label} t={t}/>}
          </main>
        </div>
        {panelOpen&&<CommandPanel/>}
        {cmdSearch&&<CommandSearch setActivePage={setActivePage}/>}
      </div>
    </NotifCtx.Provider>
    </PanelCtx.Provider>
    </AuditCtx.Provider>
    </ThemeCtx.Provider>
  );
}

// ─────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────
function Sidebar({activePage,setActivePage}){
  const {t,theme}=useTheme();
  const {panelOpen,setPanelOpen}=usePanel();
  return(
    <aside style={{width:216,flexShrink:0,background:t.bgElevated,borderRight:`1px solid ${t.border}`,display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh"}}>
      <div style={{padding:"16px 14px 12px",display:"flex",alignItems:"center",gap:9,borderBottom:`1px solid ${t.border}`}}>
        <div style={{width:30,height:30,borderRadius:8,background:DS.accent.gradient,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:DS.shadow.glow,flexShrink:0}}>
          <Gauge size={16} color="#fff" strokeWidth={2.4}/>
        </div>
        <div>
          <div style={{fontFamily:DS.font.display,fontWeight:700,fontSize:14.5,letterSpacing:"-0.01em"}}>BHIV<span style={{color:DS.accent.primary}}>-ECC</span></div>
          <div style={{fontSize:9,color:t.textMuted,letterSpacing:"0.06em",fontFamily:DS.font.mono}}>CONTROL CENTER</div>
        </div>
      </div>

      <div style={{padding:"8px 8px 2px"}}>
        <button onClick={()=>setPanelOpen(!panelOpen)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:DS.radius.md,border:`1px solid ${panelOpen?DS.accent.primary:t.border}`,background:panelOpen?DS.accent.glow:"transparent",color:panelOpen?DS.accent.primary:t.textSub,fontSize:12,cursor:"pointer",fontFamily:DS.font.body,fontWeight:500,transition:"all .14s"}}>
          <Terminal size={13} strokeWidth={2}/>
          <span style={{flex:1,textAlign:"left"}}>Command Panel</span>
          <Radio size={11} color={panelOpen?DS.status.healthy:t.textMuted}/>
        </button>
      </div>

      <nav style={{flex:1,padding:"4px 8px",overflowY:"auto"}}>
        {NAV.map(item=>{
          const isA=activePage===item.id;
          return(
            <button key={item.id} onClick={()=>setActivePage(item.id)}
              style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"7px 10px",marginBottom:1,borderRadius:DS.radius.md,border:"none",background:isA?(theme==="dark"?"#1A2436":"#E8F0FE"):"transparent",color:isA?DS.accent.primary:t.textSub,fontWeight:isA?600:500,fontSize:12.5,cursor:"pointer",fontFamily:DS.font.body,textAlign:"left",transition:"all .14s"}}
              onMouseEnter={e=>{if(!isA)e.currentTarget.style.background=t.surfaceHover;}}
              onMouseLeave={e=>{if(!isA)e.currentTarget.style.background="transparent";}}>
              <item.icon size={14} strokeWidth={2}/>
              <span style={{flex:1}}>{item.label}</span>
              {item.badge&&<span style={{fontSize:9,fontWeight:700,background:DS.status.critical,color:"#fff",borderRadius:99,minWidth:15,height:15,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:DS.font.mono,padding:"0 3px"}}>{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      <div style={{padding:"8px 8px 12px",borderTop:`1px solid ${t.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:DS.radius.md,background:t.surface,border:`1px solid ${t.border}`}}>
          <div style={{width:26,height:26,borderRadius:99,background:"linear-gradient(135deg,#8B5CF6,#06B8D0)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:10.5,fontFamily:DS.font.display,flexShrink:0}}>RS</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:11.5,fontWeight:600,whiteSpace:"nowrap"}}>Raghav Shah</div>
            <div style={{fontSize:9.5,color:t.textMuted}}>CFO - BHIV</div>
          </div>
          <ChevronDown size={12} color={t.textMuted}/>
        </div>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────
// TOPBAR
// ─────────────────────────────────────────────────────────────
function Topbar({activePage}){
  const {t,theme,setTheme}=useTheme();
  const {setCmdSearch}=usePanel();
  const {notifs,markRead}=useNotif();
  const [notifOpen,setNotifOpen]=useState(false);
  const unread=notifs.filter(n=>!n.read).length;
  const label=NAV.find(n=>n.id===activePage)?.label||"Dashboard";

  return(
    <header style={{height:54,flexShrink:0,display:"flex",alignItems:"center",gap:10,padding:"0 20px",borderBottom:`1px solid ${t.border}`,background:t.bgElevated,position:"sticky",top:0,zIndex:20}}>
      <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12}}>
        <span style={{fontFamily:DS.font.display,fontWeight:700,fontSize:13.5,color:t.text}}>{label}</span>
        <ChevronRight size={11} color={t.textMuted}/>
        <span style={{fontFamily:DS.font.mono,fontSize:10,color:t.textMuted}}>
          {new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})} - {new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})} IST
        </span>
      </div>

      <SystemPulse t={t}/>
      <div style={{flex:1}}/>

      <button onClick={()=>setCmdSearch(true)} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",width:230,borderRadius:DS.radius.md,border:`1px solid ${t.border}`,background:t.surface,color:t.textSub,cursor:"pointer",fontFamily:DS.font.body,fontSize:11.5}}>
        <Search size={12} color={t.textMuted}/>
        <span style={{flex:1,textAlign:"left"}}>Search commands, pages...</span>
        <span style={{fontSize:9.5,fontFamily:DS.font.mono,border:`1px solid ${t.border}`,borderRadius:4,padding:"1px 5px",color:t.textMuted}}>Cmd+K</span>
      </button>

      <button onClick={()=>setTheme(theme==="dark"?"light":"dark")} style={iconBtnS(t)} aria-label="Toggle theme">
        {theme==="dark"?<Sun size={14}/>:<Moon size={14}/>}
      </button>

      <div style={{position:"relative"}}>
        <button onClick={()=>setNotifOpen(!notifOpen)} style={{...iconBtnS(t),position:"relative"}} aria-label="Notifications">
          <Bell size={14}/>
          {unread>0&&<span style={{position:"absolute",top:7,right:8,width:6,height:6,borderRadius:99,background:DS.status.critical}}/>}
        </button>
        {notifOpen&&(
          <div style={{position:"absolute",right:0,top:42,width:310,background:t.surface,border:`1px solid ${t.border}`,borderRadius:DS.radius.lg,boxShadow:DS.shadow.overlay,zIndex:99,overflow:"hidden"}}>
            <div style={{padding:"10px 12px 7px",borderBottom:`1px solid ${t.border}`,fontSize:12,fontWeight:600}}>Notifications <span style={{color:t.textMuted,fontWeight:400}}>({unread} unread)</span></div>
            {notifs.map(n=>(
              <div key={n.id} onClick={()=>{markRead(n.id);setNotifOpen(false);}}
                style={{display:"flex",gap:8,padding:"9px 12px",borderBottom:`1px solid ${t.border}`,cursor:"pointer",background:n.read?undefined:t.surfaceActive}}
                onMouseEnter={e=>e.currentTarget.style.background=t.surfaceHover}
                onMouseLeave={e=>e.currentTarget.style.background=n.read?undefined:t.surfaceActive}>
                <StatusDot s={n.severity} pulse={!n.read}/>
                <div style={{flex:1,fontSize:11}}>{n.text}</div>
                <div style={{fontSize:9.5,color:t.textMuted,fontFamily:DS.font.mono,flexShrink:0}}>{n.time}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
// COMMAND PANEL - right drawer
// ─────────────────────────────────────────────────────────────
function CommandPanel(){
  const {t}=useTheme();
  const {setPanelOpen}=usePanel();
  const {auditLog}=useAudit();
  const [tab,setTab]=useState("history");

  return(
    <aside style={{width:320,flexShrink:0,background:t.bgElevated,borderLeft:`1px solid ${t.border}`,display:"flex",flexDirection:"column",height:"100vh",position:"sticky",top:0,overflowY:"auto"}}>
      <div style={{padding:"12px 14px",borderBottom:`1px solid ${t.border}`,display:"flex",alignItems:"center",gap:8}}>
        <Terminal size={14} color={DS.accent.primary}/>
        <span style={{fontWeight:700,fontSize:13,flex:1}}>Command Panel</span>
        <button onClick={()=>setPanelOpen(false)} style={iconBtnS(t)}><X size={14}/></button>
      </div>

      <div style={{display:"flex",borderBottom:`1px solid ${t.border}`}}>
        {[{id:"history",label:"History",icon:History},{id:"pending",label:"Pending",icon:Inbox},{id:"ops",label:"Running",icon:Activity}].map(tb=>(
          <button key={tb.id} onClick={()=>setTab(tb.id)} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:4,padding:"8px 0",border:"none",background:"transparent",borderBottom:`2px solid ${tab===tb.id?DS.accent.primary:"transparent"}`,color:tab===tb.id?DS.accent.primary:t.textSub,fontSize:11,fontWeight:tab===tb.id?600:500,cursor:"pointer",fontFamily:DS.font.body}}>
            <tb.icon size={11}/>{tb.label}
          </button>
        ))}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:10}}>
        {tab==="history"&&auditLog.map((e,i)=>(
          <div key={i} style={{display:"flex",gap:9,padding:"8px 10px",borderRadius:DS.radius.md,marginBottom:3,background:t.surface,border:`1px solid ${t.border}`}}>
            <StatusIcon s={e.status}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11,fontWeight:600}}>{e.cmd}</div>
              <div style={{fontSize:10,color:t.textMuted,fontFamily:DS.font.mono}}>{e.target}</div>
            </div>
            <div style={{fontSize:9.5,color:t.textMuted,fontFamily:DS.font.mono,textAlign:"right",flexShrink:0}}>
              <div>{e.actor}</div><div>{e.time}</div>
            </div>
          </div>
        ))}
        {tab==="pending"&&MOCK.pendingApprovals.map(a=>(
          <div key={a.id} style={{padding:"8px 10px",borderRadius:DS.radius.md,marginBottom:3,background:t.surface,border:`1px solid ${t.border}`}}>
            <div style={{fontSize:10,color:t.textMuted,fontFamily:DS.font.mono,marginBottom:2}}>{a.id}</div>
            <div style={{fontSize:11,fontWeight:600,marginBottom:2}}>{a.title}</div>
            <div style={{fontSize:10,color:t.textMuted}}>{a.requester} - {a.dept} - {a.age}</div>
          </div>
        ))}
        {tab==="ops"&&MOCK.runningOps.map(op=>(
          <div key={op.id} style={{padding:"8px 10px",borderRadius:DS.radius.md,marginBottom:3,background:t.surface,border:`1px solid ${t.border}`}}>
            <div style={{fontSize:10,color:t.textMuted,fontFamily:DS.font.mono,marginBottom:2}}>{op.id}</div>
            <div style={{fontSize:11,fontWeight:600,marginBottom:4}}>{op.title}</div>
            <MiniProgress val={op.progress} t={t}/>
            <div style={{fontSize:10,color:t.textMuted,marginTop:4}}>{op.startedBy} - {op.elapsed}</div>
          </div>
        ))}
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────
// COMMAND SEARCH (Cmd+K)
// ─────────────────────────────────────────────────────────────
const GLOBAL_CMDS=[
  {label:"Go to Dashboard",    action:"page:dashboard",  icon:LayoutGrid},
  {label:"Go to Operations",   action:"page:operations", icon:Activity},
  {label:"Go to Engineering",  action:"page:engineering",icon:Cpu},
  {label:"Go to Business",     action:"page:business",   icon:BarChart3},
  {label:"Go to Alerts",       action:"page:alerts",     icon:AlertTriangle},
  {label:"Open Command Panel", action:"panel:open",      icon:Terminal},
  {label:"Toggle Theme",       action:"theme:toggle",    icon:Sun},
  {label:"Generate Report",    action:"cmd:report",      icon:Download},
  {label:"Create Incident",    action:"cmd:incident",    icon:PlusCircle},
  {label:"View Audit Log",     action:"panel:history",   icon:History},
];

function CommandSearch({setActivePage}){
  const {t,setTheme,theme}=useTheme();
  const {setCmdSearch,setPanelOpen}=usePanel();
  const [q,setQ]=useState("");
  const inp=useRef(null);
  useEffect(()=>{inp.current?.focus();},[]);

  const filtered=GLOBAL_CMDS.filter(c=>c.label.toLowerCase().includes(q.toLowerCase()));
  const run=(c)=>{
    if(c.action.startsWith("page:"))setActivePage(c.action.split(":")[1]);
    else if(c.action==="panel:open")setPanelOpen(true);
    else if(c.action==="theme:toggle")setTheme(theme==="dark"?"light":"dark");
    setCmdSearch(false);
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:"13vh"}} onClick={()=>setCmdSearch(false)}>
      <div style={{width:500,background:t.surface,borderRadius:DS.radius.xl,border:`1px solid ${t.border}`,boxShadow:DS.shadow.overlay,overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",gap:9,padding:"11px 14px",borderBottom:`1px solid ${t.border}`}}>
          <Command size={15} color={DS.accent.primary}/>
          <input ref={inp} value={q} onChange={e=>setQ(e.target.value)} placeholder="Search commands, pages, actions..."
            style={{flex:1,border:"none",outline:"none",background:"transparent",color:t.text,fontFamily:DS.font.body,fontSize:13.5}}/>
          <kbd style={{fontSize:9.5,fontFamily:DS.font.mono,border:`1px solid ${t.border}`,borderRadius:4,padding:"2px 5px",color:t.textMuted}}>ESC</kbd>
        </div>
        <div style={{maxHeight:340,overflowY:"auto",padding:6}}>
          {filtered.map((c,i)=>(
            <button key={i} onClick={()=>run(c)} style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"8px 11px",borderRadius:DS.radius.md,border:"none",background:"transparent",color:t.text,cursor:"pointer",fontFamily:DS.font.body,textAlign:"left",fontSize:12.5}}
              onMouseEnter={e=>e.currentTarget.style.background=t.surfaceHover}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <c.icon size={14} color={t.textSub}/>{c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMMAND DIALOG - wraps every command, handles all phases
// ─────────────────────────────────────────────────────────────
function CommandDialog({cmd,label,description,canRollback,children,trigger}){
  const {t}=useTheme();
  const {phase,cancel,execute,rollback,reset,state}=cmd;
  const open=phase!==CMD.IDLE;

  if(!open)return<>{trigger({onClick:()=>cmd.confirm(null)})}</>;

  const phaseUI={
    [CMD.CONFIRM]:     {icon:<AlertCircle size={20} color={DS.status.warning}/>,  title:"Confirm action",  color:DS.status.warning},
    [CMD.EXECUTING]:   {icon:<Loader2 size={20} color={DS.accent.primary} style={{animation:"spin 1s linear infinite"}}/>, title:"Executing...", color:DS.accent.primary},
    [CMD.SUCCESS]:     {icon:<CheckCircle2 size={20} color={DS.status.healthy}/>, title:"Success",         color:DS.status.healthy},
    [CMD.FAILURE]:     {icon:<XCircle size={20} color={DS.status.critical}/>,     title:"Failed",          color:DS.status.critical},
    [CMD.ROLLING_BACK]:{icon:<Loader2 size={20} color={DS.status.warning} style={{animation:"spin 1s linear infinite"}}/>, title:"Rolling back...", color:DS.status.warning},
    [CMD.ROLLED_BACK]: {icon:<RotateCcw size={20} color={DS.status.neutral}/>,    title:"Rolled back",     color:DS.status.neutral},
  };
  const ui=phaseUI[phase]||phaseUI[CMD.CONFIRM];

  return(
    <>
      {trigger({onClick:()=>{}})}
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={phase===CMD.CONFIRM?cancel:undefined}>
        <div style={{width:420,background:t.surface,borderRadius:DS.radius.xl,border:`1px solid ${t.borderStrong}`,boxShadow:DS.shadow.overlay,overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
          <div style={{padding:"16px 18px 12px",borderBottom:`1px solid ${t.border}`,display:"flex",gap:10,alignItems:"flex-start"}}>
            {ui.icon}
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:1}}>{label}</div>
              <div style={{fontSize:11.5,color:t.textSub}}>{ui.title}</div>
            </div>
            {[CMD.SUCCESS,CMD.FAILURE,CMD.ROLLED_BACK].includes(phase)&&(
              <button onClick={reset} style={iconBtnS(t)}><X size={14}/></button>
            )}
          </div>

          <div style={{padding:"14px 18px"}}>
            {phase===CMD.CONFIRM&&(
              <><p style={{margin:"0 0 12px",fontSize:12.5,color:t.textSub,lineHeight:1.6}}>{description}</p>{children}</>
            )}
            {phase===CMD.EXECUTING&&(
              <div style={{textAlign:"center",padding:"10px 0 2px",color:t.textSub,fontSize:12.5}}>
                <div style={{height:3,borderRadius:99,background:t.border,overflow:"hidden",marginBottom:12}}>
                  <div style={{height:"100%",background:DS.accent.gradient,animation:"progress 1.4s ease-in-out infinite",borderRadius:99}}/>
                </div>
                Processing - do not close this dialog.
              </div>
            )}
            {phase===CMD.SUCCESS&&(
              <div style={{fontSize:12.5,color:DS.status.healthy}}>
                Command completed successfully.
                {state.auditId&&<div style={{fontSize:10.5,fontFamily:DS.font.mono,color:t.textMuted,marginTop:5}}>Audit ID: {state.auditId}</div>}
              </div>
            )}
            {phase===CMD.FAILURE&&(
              <div style={{fontSize:12.5,color:DS.status.critical}}>
                {state.error}
                <div style={{fontSize:11,color:t.textMuted,marginTop:4}}>Check the audit log for details.</div>
              </div>
            )}
            {[CMD.ROLLING_BACK,CMD.ROLLED_BACK].includes(phase)&&(
              <div style={{fontSize:12.5,color:t.textSub}}>{phase===CMD.ROLLING_BACK?"Rolling back operation...":"Rollback complete."}</div>
            )}
          </div>

          <div style={{padding:"10px 18px 16px",display:"flex",gap:7,justifyContent:"flex-end",borderTop:`1px solid ${t.border}`}}>
            {phase===CMD.CONFIRM&&<><Btn variant="ghost" t={t} onClick={cancel}>Cancel</Btn><Btn variant="primary" t={t} onClick={()=>execute()}>Confirm</Btn></>}
            {phase===CMD.SUCCESS&&canRollback&&<><Btn variant="ghost" t={t} onClick={reset}>Close</Btn><Btn variant="danger" t={t} onClick={rollback}>Rollback</Btn></>}
            {phase===CMD.SUCCESS&&!canRollback&&<Btn variant="primary" t={t} onClick={reset}>Done</Btn>}
            {phase===CMD.FAILURE&&<><Btn variant="ghost" t={t} onClick={reset}>Close</Btn><Btn variant="primary" t={t} onClick={()=>execute()}>Retry</Btn></>}
            {phase===CMD.ROLLED_BACK&&<Btn variant="ghost" t={t} onClick={reset}>Close</Btn>}
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGES
// ─────────────────────────────────────────────────────────────

// DASHBOARD - live state first, charts moved to Business tab
function DashboardPage({addAudit,addNotif}){
  const {t}=useTheme();
  return(
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <SituationBar t={t}/>

      <SH t={t} title="What needs attention right now" sub="Pending approvals and open incidents - act on these first"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div>
          <div style={{fontSize:11.5,color:t.textMuted,fontWeight:600,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Pending Approvals</div>
          <ApprovalQueue addAudit={addAudit} addNotif={addNotif}/>
        </div>
        <div>
          <div style={{fontSize:11.5,color:t.textMuted,fontWeight:600,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Active Incidents</div>
          <IncidentConsole addAudit={addAudit} addNotif={addNotif}/>
        </div>
      </div>

      <SH t={t} title="What is running right now" sub="In-progress operations - pause or stop if needed"/>
      <RunningOps addAudit={addAudit}/>

      <SH t={t} title="System health right now" sub="Live service status across all monitored services"/>
      <ServiceGrid addAudit={addAudit} addNotif={addNotif}/>

      <SH t={t} title="Current numbers" sub="Snapshot values - not trends"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {MOCK.kpis.map(k=><KpiCard key={k.id} k={k} t={t}/>)}
      </div>

      <SH t={t} title="What just happened" sub="Last 6 hours - deployments, incidents, logins, approvals"/>
      <ActivityTimeline t={t}/>

      <SH t={t} title="Quick actions" sub="Common executive commands"/>
      <QuickActionsGrid addAudit={addAudit} addNotif={addNotif}/>
    </div>
  );
}

// OPERATIONS - live service state + incident management
function OperationsPage({addAudit,addNotif}){
  const {t}=useTheme();
  return(
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <SH t={t} title="Live service status" sub="All 9 monitored services - current health"/>
      <ServiceGrid addAudit={addAudit} addNotif={addNotif}/>
      <SH t={t} title="Open incidents" sub="Requiring action now"/>
      <IncidentConsole addAudit={addAudit} addNotif={addNotif}/>
      <SH t={t} title="Running operations" sub="Background jobs in progress"/>
      <RunningOps addAudit={addAudit}/>
      <SH t={t} title="Activity" sub="Recent events"/>
      <ActivityTimeline t={t}/>
    </div>
  );
}

// ENGINEERING - build and deploy state
function EngineeringPage({addAudit}){
  const {t}=useTheme();
  return(
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <SH t={t} title="Current build and deploy state" sub="Live engineering status"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        <MetricCard t={t} label="Current Release" value="v4.1.9" icon={GitBranch} note="Deployed 12 min ago"/>
        <MetricCard t={t} label="Code Coverage"   value="84.2%"  icon={CheckCircle2} note="+1.3% this week" color={DS.status.healthy}/>
        <MetricCard t={t} label="P50 Latency"      value="96ms"   icon={Zap} note="P95 at 248ms"/>
        <MetricCard t={t} label="Prod Errors (24h)"value="14"     icon={XCircle} note="3 more than yesterday" color={DS.status.warning}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <ChartCard t={t} title="Deployment frequency" sub="Last 10 days - successful vs failed">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MOCK.deployFreq}>
              <CartesianGrid stroke={t.border} strokeDasharray="3 3" vertical={false}/>
              <XAxis dataKey="day" tick={{fontSize:9,fill:t.textMuted}} axisLine={{stroke:t.border}} tickLine={false}/>
              <YAxis tick={{fontSize:9,fill:t.textMuted}} axisLine={false} tickLine={false} width={22}/>
              <Tooltip content={<MonoTip t={t}/>}/>
              <Bar dataKey="ok"   stackId="d" fill={DS.status.healthy} radius={[4,4,0,0]} name="Success"/>
              <Bar dataKey="fail" stackId="d" fill={DS.status.critical} radius={[4,4,0,0]} name="Failed"/>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} title="Latency percentiles" sub="P50 / P95 / P99 in ms">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={MOCK.latency}>
              <CartesianGrid stroke={t.border} strokeDasharray="3 3" vertical={false}/>
              <XAxis dataKey="day" tick={{fontSize:9,fill:t.textMuted}} axisLine={{stroke:t.border}} tickLine={false}/>
              <YAxis tick={{fontSize:9,fill:t.textMuted}} axisLine={false} tickLine={false} width={30}/>
              <Tooltip content={<MonoTip t={t}/>}/>
              <Line type="monotone" dataKey="p50" stroke={DS.status.healthy} strokeWidth={2} dot={false} name="P50"/>
              <Line type="monotone" dataKey="p95" stroke={DS.status.warning} strokeWidth={2} dot={false} name="P95"/>
              <Line type="monotone" dataKey="p99" stroke={DS.status.critical} strokeWidth={2} dot={false} name="P99"/>
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <SH t={t} title="Sprint 24 - current state" sub="Jul 1-14"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
        <Card t={t} p={14}>
          <div style={{fontSize:11.5,color:t.textSub,marginBottom:9}}>Sprint progress</div>
          <ProgressBar val={69} t={t}/>
          <div style={{display:"flex",justifyContent:"space-around",marginTop:12}}>
            <StatPill label="Done" val={38} color={DS.status.healthy}/>
            <StatPill label="Pending" val={14} color={DS.status.warning}/>
            <StatPill label="Blocked" val={3}  color={DS.status.critical}/>
          </div>
        </Card>
        <ChartCard t={t} title="Burn-down" sub="Remaining story points">
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={MOCK.burndown}>
              <CartesianGrid stroke={t.border} strokeDasharray="3 3" vertical={false}/>
              <XAxis dataKey="day" tick={{fontSize:8.5,fill:t.textMuted}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:8.5,fill:t.textMuted}} axisLine={false} tickLine={false} width={20}/>
              <Tooltip content={<MonoTip t={t}/>}/>
              <Line type="monotone" dataKey="ideal"  stroke={t.textMuted} strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="Ideal"/>
              <Line type="monotone" dataKey="actual" stroke={DS.accent.primary} strokeWidth={2} dot={false} name="Actual"/>
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <Card t={t} p={14}>
          <div style={{fontSize:11.5,color:t.textSub,marginBottom:9}}>Upcoming releases</div>
          {[{v:"v4.2.0",d:"Jul 4",s:"ECC GA"},{v:"v4.2.1",d:"Jul 11",s:"Payment hardening"},{v:"v4.3.0",d:"Jul 28",s:"Mobile SDK v2"}].map(rel=>(
            <div key={rel.v} style={{display:"flex",alignItems:"center",gap:7,marginBottom:9}}>
              <Rocket size={12} color={DS.accent.primary}/>
              <div style={{flex:1}}>
                <div style={{fontSize:11.5,fontWeight:600,fontFamily:DS.font.mono}}>{rel.v}</div>
                <div style={{fontSize:10,color:t.textMuted}}>{rel.s}</div>
              </div>
              <div style={{fontSize:10,fontFamily:DS.font.mono,color:t.textSub}}>{rel.d}</div>
            </div>
          ))}
        </Card>
      </div>
      <SH t={t} title="Command history" sub="Recent engineering commands"/>
      <AuditLogTable/>
    </div>
  );
}

// BUSINESS - charts live here now, not on Dashboard
function BusinessPage(){
  const {t}=useTheme();
  return(
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <SH t={t} title="Business metrics" sub="Revenue, users, products, and regional breakdown"/>
      <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:14}}>
        <ChartCard t={t} title="Revenue trend vs target" sub="Last 14 days">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MOCK.revenueTrend}>
              <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={DS.accent.primary} stopOpacity={0.4}/><stop offset="100%" stopColor={DS.accent.primary} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid stroke={t.border} strokeDasharray="3 3" vertical={false}/>
              <XAxis dataKey="day" tick={{fontSize:9,fill:t.textMuted}} axisLine={{stroke:t.border}} tickLine={false}/>
              <YAxis tick={{fontSize:9,fill:t.textMuted}} axisLine={false} tickLine={false} width={42} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={<MonoTip t={t}/>}/>
              <Area type="monotone" dataKey="revenue" stroke={DS.accent.primary} strokeWidth={2} fill="url(#rg)" name="Revenue"/>
              <Line type="monotone" dataKey="target"  stroke={t.textMuted} strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Target"/>
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} title="Product mix" sub="Revenue share %">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={MOCK.topProducts} dataKey="value" nameKey="name" innerRadius={46} outerRadius={74} paddingAngle={2}>
                {MOCK.topProducts.map((p,i)=><Cell key={i} fill={p.color} stroke={t.surface} strokeWidth={2}/>)}
              </Pie>
              <Tooltip content={<MonoTip t={t}/>}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:4}}>
            {MOCK.topProducts.map(p=><div key={p.name} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:t.textSub}}><span style={{width:6,height:6,borderRadius:99,background:p.color}}/>{p.name} <span style={{fontFamily:DS.font.mono,color:t.text}}>{p.value}%</span></div>)}
          </div>
        </ChartCard>
        <ChartCard t={t} title="User growth" sub="MAU over 14 days">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={MOCK.userGrowth}>
              <defs><linearGradient id="ug" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={DS.status.healthy} stopOpacity={0.35}/><stop offset="100%" stopColor={DS.status.healthy} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid stroke={t.border} strokeDasharray="3 3" vertical={false}/>
              <XAxis dataKey="day" tick={{fontSize:9,fill:t.textMuted}} axisLine={{stroke:t.border}} tickLine={false}/>
              <YAxis tick={{fontSize:9,fill:t.textMuted}} axisLine={false} tickLine={false} width={38}/>
              <Tooltip content={<MonoTip t={t}/>}/>
              <Area type="monotone" dataKey="users" stroke={DS.status.healthy} strokeWidth={2} fill="url(#ug)" name="MAU"/>
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard t={t} title="New signups per day" sub="Last 14 days">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MOCK.userGrowth}>
              <CartesianGrid stroke={t.border} strokeDasharray="3 3" vertical={false}/>
              <XAxis dataKey="day" tick={{fontSize:9,fill:t.textMuted}} axisLine={{stroke:t.border}} tickLine={false}/>
              <YAxis tick={{fontSize:9,fill:t.textMuted}} axisLine={false} tickLine={false} width={30}/>
              <Tooltip content={<MonoTip t={t}/>}/>
              <Bar dataKey="newUsers" fill={DS.accent.primary} radius={[4,4,0,0]} name="New Users"/>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

// ALERTS - filterable console with Silence command
function AlertsPage({addAudit,addNotif}){
  const {t}=useTheme();
  const [filter,setFilter]=useState("all");
  const allAlerts=[
    {id:"INC-2291",title:"Payment Service P99 latency breach (>1200ms)",  severity:"critical",status:"investigating",age:"6 min",  owner:"Platform"},
    {id:"INC-2287",title:"Microservices mesh elevated error rate (4.2%)",  severity:"warning", status:"monitoring",   age:"41 min", owner:"Platform"},
    {id:"BUG-1820",title:"Checkout double-charge on retry (3 confirmed)",  severity:"critical",status:"open",         age:"2 hr",   owner:"Payments"},
    {id:"APR-0098",title:"Pending approval: Q3 budget increase +18%",      severity:"info",    status:"pending",      age:"3 hr",   owner:"Finance"},
    {id:"DEP-0654",title:"Failed deployment: mobile-sdk-v2 (rollback OK)", severity:"warning", status:"resolved",     age:"5 hr",   owner:"Mobile"},
    {id:"SEC-0033",title:"Unusual login pattern flagged - APAC region",    severity:"warning", status:"open",         age:"7 hr",   owner:"Security"},
  ];
  const filtered=filter==="all"?allAlerts:allAlerts.filter(a=>a.severity===filter);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <SH t={t} title="Alert console" sub="Filter by severity - use Silence to mute non-actionable alerts"/>
      <Card t={t} p={12}>
        <div style={{display:"flex",gap:7,marginBottom:12}}>
          {["all","critical","warning","info"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{fontSize:11,padding:"4px 10px",borderRadius:99,border:`1px solid ${filter===f?DS.accent.primary:t.border}`,background:filter===f?`${DS.accent.primary}1A`:"transparent",color:filter===f?DS.accent.primary:t.textSub,cursor:"pointer",fontWeight:600,textTransform:"capitalize",fontFamily:DS.font.body}}>
              {f}
            </button>
          ))}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {filtered.map(a=><AlertRow key={a.id} a={a} addAudit={addAudit} addNotif={addNotif} t={t}/>)}
        </div>
      </Card>
    </div>
  );
}

// TEAMS
function TeamsPage(){
  const {t}=useTheme();
  return(
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <SH t={t} title="Team performance" sub="Productivity, completion and efficiency by department"/>
      <Card t={t} p={14}>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={MOCK.teamPerf}>
            <CartesianGrid stroke={t.border} strokeDasharray="3 3" vertical={false}/>
            <XAxis dataKey="dept" tick={{fontSize:10,fill:t.textMuted}} axisLine={{stroke:t.border}} tickLine={false}/>
            <YAxis tick={{fontSize:10,fill:t.textMuted}} axisLine={false} tickLine={false} width={28}/>
            <Tooltip content={<MonoTip t={t}/>}/>
            <Legend wrapperStyle={{fontSize:10.5}}/>
            <Bar dataKey="prod" fill={DS.accent.primary} radius={[4,4,0,0]} name="Productivity %"/>
            <Bar dataKey="comp" fill={DS.status.healthy} radius={[4,4,0,0]} name="Completion %"/>
            <Bar dataKey="eff"  fill="#8B5CF6"           radius={[4,4,0,0]} name="Efficiency %"/>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// OPERATIONAL COMPONENTS (single responsibility each)
// ─────────────────────────────────────────────────────────────

// SituationBar - answers "is everything OK?" in under 5 seconds
function SituationBar({t}){
  const items=[
    {label:"Need attention",  val:2,       color:DS.status.critical, icon:AlertOctagon},
    {label:"Awaiting approval",val:4,      color:DS.status.warning,  icon:ClipboardCheck},
    {label:"Running ops",     val:3,       color:DS.accent.primary,  icon:Activity},
    {label:"Services degraded",val:2,      color:DS.status.critical, icon:Server},
    {label:"System uptime",   val:"99.94%",color:DS.status.healthy,  icon:CheckCircle2},
    {label:"Deploy pipeline", val:"OK",    color:DS.status.healthy,  icon:GitBranch},
  ];
  return(
    <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,padding:"12px 14px",borderRadius:DS.radius.lg,border:`1px solid ${t.border}`,background:t.bgElevated}}>
      {items.map((item,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:7}}>
          <item.icon size={15} color={item.color}/>
          <div>
            <div style={{fontFamily:DS.font.mono,fontSize:15,fontWeight:700,color:item.color,lineHeight:1}}>{item.val}</div>
            <div style={{fontSize:9.5,color:t.textMuted,marginTop:1}}>{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ApprovalQueue({addAudit,addNotif}){
  const [dismissed,setDismissed]=useState([]);
  const {t}=useTheme();
  const visible=MOCK.pendingApprovals.filter(a=>!dismissed.includes(a.id));
  if(!visible.length)return<EmptyState t={t} icon={CheckCircle2} msg="All approvals handled."/>;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:7}}>
      {visible.map(a=><ApprovalCard key={a.id} a={a} t={t} addAudit={addAudit} addNotif={addNotif} onDismiss={()=>setDismissed(p=>[...p,a.id])}/>)}
    </div>
  );
}

function ApprovalCard({a,t,addAudit,addNotif,onDismiss}){
  const approveCmd=useCommand({label:`Approve ${a.id}`,serviceCall:()=>MockService.approveRequest(a.id),onAudit:e=>{addAudit(e);addNotif({text:`${a.id} approved`,severity:"info"});onDismiss();}});
  const rejectCmd =useCommand({label:`Reject ${a.id}`, serviceCall:()=>MockService.rejectRequest(a.id), onAudit:e=>{addAudit(e);addNotif({text:`${a.id} rejected`,severity:"warning"});onDismiss();}});
  return(
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:DS.radius.md,border:`1px solid ${t.border}`,background:t.surface}}>
      <PriorityIcon p={a.priority}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:9.5,fontFamily:DS.font.mono,color:t.textMuted}}>{a.id} - {a.type}</div>
        <div style={{fontSize:12,fontWeight:600}}>{a.title}</div>
        <div style={{fontSize:10.5,color:t.textSub}}>{a.requester} - {a.dept} - {a.age}</div>
      </div>
      <div style={{display:"flex",gap:5}}>
        <CommandDialog cmd={rejectCmd}  label={`Reject: ${a.id}`}  description={`Reject "${a.title}" requested by ${a.requester}. This is logged.`}
          trigger={({onClick})=><Btn variant="ghost" t={t} small onClick={onClick}><Ban size={11}/> Reject</Btn>}/>
        <CommandDialog cmd={approveCmd} label={`Approve: ${a.id}`} description={`Approve "${a.title}" from ${a.requester} (${a.dept}). Confirm budget and policy compliance.`}
          trigger={({onClick})=><Btn variant="success" t={t} small onClick={onClick}><CheckSquare size={11}/> Approve</Btn>}/>
      </div>
    </div>
  );
}

function IncidentConsole({addAudit,addNotif}){
  const {t}=useTheme();
  return(
    <div style={{display:"flex",flexDirection:"column",gap:7}}>
      {MOCK.activeIncidents.map(inc=><IncidentCard key={inc.id} inc={inc} t={t} addAudit={addAudit} addNotif={addNotif}/>)}
    </div>
  );
}

function IncidentCard({inc,t,addAudit,addNotif}){
  const ackCmd=useCommand({label:`Acknowledge ${inc.id}`,serviceCall:()=>MockService.acknowledgeAlert(inc.id),onAudit:e=>{addAudit(e);addNotif({text:`${inc.id} acknowledged`,severity:"info"});}});
  const escCmd=useCommand({label:`Escalate ${inc.id}`,   serviceCall:()=>MockService.escalateIncident(inc.id), canRollback:true,onAudit:e=>{addAudit(e);addNotif({text:`${inc.id} escalated`,severity:"warning"});}});
  return(
    <div style={{padding:"10px 12px",borderRadius:DS.radius.md,border:`1px solid ${inc.severity==="critical"?`${DS.status.critical}44`:t.border}`,background:inc.severity==="critical"?`${DS.status.critical}07`:t.surface}}>
      <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:4}}>
        <StatusDot s={inc.severity} pulse={inc.severity==="critical"}/>
        <div style={{fontSize:9.5,fontFamily:DS.font.mono,color:t.textMuted,flex:1}}>{inc.id} - {inc.owner} - {inc.age}</div>
        <StatusChip s={inc.status}/>
      </div>
      <div style={{fontSize:12.5,fontWeight:600,marginBottom:7}}>{inc.title}</div>
      <div style={{display:"flex",gap:5}}>
        <CommandDialog cmd={escCmd} label={`Escalate ${inc.id}`} description={`Escalate "${inc.title}" to leadership. All on-call engineers will be paged.`}
          trigger={({onClick})=><Btn variant="ghost" t={t} small onClick={onClick}><Siren size={11}/> Escalate</Btn>}/>
        {inc.status!=="resolved"&&(
          <CommandDialog cmd={ackCmd} label={`Acknowledge ${inc.id}`} description={`Acknowledge "${inc.title}". You are taking ownership of monitoring this incident.`}
            trigger={({onClick})=><Btn variant="primary" t={t} small onClick={onClick}><Eye size={11}/> Acknowledge</Btn>}/>
        )}
      </div>
    </div>
  );
}

function RunningOps({addAudit}){
  const {t}=useTheme();
  return(
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
      {MOCK.runningOps.map(op=><OpCard key={op.id} op={op} t={t} addAudit={addAudit}/>)}
    </div>
  );
}

function OpCard({op,t,addAudit}){
  const pauseCmd=useCommand({label:`Pause ${op.id}`,serviceCall:()=>MockService.pauseOperation(op.id),canRollback:true,onAudit:addAudit});
  const stopCmd= useCommand({label:`Stop ${op.id}`, serviceCall:()=>MockService.stopOperation(op.id),              onAudit:addAudit});
  return(
    <div style={{padding:"12px 12px",borderRadius:DS.radius.md,border:`1px solid ${t.border}`,background:t.surface}}>
      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:7}}>
        <div style={{width:6,height:6,borderRadius:99,background:DS.status.healthy,animation:"blink 1.4s ease infinite",flexShrink:0}}/>
        <div style={{fontSize:9.5,fontFamily:DS.font.mono,color:t.textMuted}}>{op.id}</div>
        <div style={{fontSize:9.5,color:t.textMuted,marginLeft:"auto",fontFamily:DS.font.mono}}>{op.elapsed}</div>
      </div>
      <div style={{fontSize:12,fontWeight:600,marginBottom:8}}>{op.title}</div>
      <MiniProgress val={op.progress} t={t}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
        <div style={{fontSize:10,color:t.textMuted}}>{op.startedBy}</div>
        <div style={{display:"flex",gap:5}}>
          <CommandDialog cmd={pauseCmd} label={`Pause ${op.id}`} description={`Pause "${op.title}". Can be resumed from the Operations panel.`}
            trigger={({onClick})=><Btn variant="ghost" t={t} small onClick={onClick}><Pause size={10}/></Btn>}/>
          <CommandDialog cmd={stopCmd}  label={`Stop ${op.id}`}  description={`Stop "${op.title}" permanently. Progress will be lost.`}
            trigger={({onClick})=><Btn variant="danger" t={t} small onClick={onClick}><StopCircle size={10}/></Btn>}/>
        </div>
      </div>
    </div>
  );
}

function ServiceGrid({addAudit,addNotif}){
  const {t}=useTheme();
  return(
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
      {MOCK.services.map(s=><ServiceCard key={s.id} s={s} t={t} addAudit={addAudit} addNotif={addNotif}/>)}
    </div>
  );
}

function ServiceCard({s,t,addAudit,addNotif}){
  const restartCmd=useCommand({
    label:`Restart ${s.name}`,
    serviceCall:()=>MockService.restartService(s.id),
    onAudit:e=>{addAudit(e);addNotif({text:`${s.name} restart ${e.status==="success"?"complete":"failed"}`,severity:e.status==="success"?"info":"critical"});}
  });
  return(
    <div style={{padding:"10px 12px",borderRadius:DS.radius.md,border:`1px solid ${s.status==="critical"?`${DS.status.critical}55`:t.border}`,background:t.surface}}>
      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
        <s.icon size={13} color={t.textSub}/>
        <span style={{fontSize:12,fontWeight:600,flex:1}}>{s.name}</span>
        <StatusDot s={s.status} pulse={s.status!=="healthy"}/>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:s.status!=="healthy"?8:0}}>
        <div style={{fontSize:10,fontFamily:DS.font.mono}}><span style={{color:t.textMuted}}>LAT </span>{s.latency}</div>
        <div style={{fontSize:10,fontFamily:DS.font.mono}}><span style={{color:t.textMuted}}>UP </span>{s.uptime}</div>
        <div style={{fontSize:10,fontFamily:DS.font.mono}}><span style={{color:t.textMuted}}>RPM </span>{s.rpm.toLocaleString()}</div>
      </div>
      {s.status!=="healthy"&&(
        <CommandDialog cmd={restartCmd} label={`Restart: ${s.name}`}
          description={`Restart "${s.name}". There will be a brief interruption. Dependent services will be notified.`}
          trigger={({onClick})=><Btn variant="danger" t={t} small onClick={onClick} style={{width:"100%",justifyContent:"center"}}><RefreshCw size={11}/> Restart service</Btn>}/>
      )}
    </div>
  );
}

function AlertRow({a,addAudit,addNotif,t}){
  const silenceCmd=useCommand({label:`Silence ${a.id}`,serviceCall:()=>MockService.silenceAlert(a.id),onAudit:e=>{addAudit(e);addNotif({text:`${a.id} silenced for 30 min`,severity:"info"});}});
  return(
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:DS.radius.md,border:`1px solid ${a.severity==="critical"?`${DS.status.critical}44`:t.border}`,background:t.bgElevated}}>
      <StatusDot s={a.severity} pulse={a.severity==="critical"}/>
      <span style={{fontSize:10,fontFamily:DS.font.mono,color:t.textMuted,width:70,flexShrink:0}}>{a.id}</span>
      <span style={{fontSize:12,flex:1}}>{a.title}</span>
      <span style={{fontSize:10,background:t.surfaceHover,padding:"2px 6px",borderRadius:99,color:t.textSub,flexShrink:0}}>{a.owner}</span>
      <span style={{fontSize:10,fontFamily:DS.font.mono,color:t.textMuted,width:60,textAlign:"right",flexShrink:0}}>{a.age}</span>
      <CommandDialog cmd={silenceCmd} label={`Silence ${a.id}`} description={`Silence notifications for "${a.title}" for 30 minutes. Alert stays visible but no further pages are sent.`}
        trigger={({onClick})=><Btn variant="ghost" t={t} small onClick={onClick}><Ban size={10}/></Btn>}/>
    </div>
  );
}

function AuditLogTable(){
  const {t}=useTheme();
  const {auditLog}=useAudit();
  return(
    <Card t={t} p={0}>
      <div style={{display:"flex",alignItems:"center",padding:"10px 12px",borderBottom:`1px solid ${t.border}`}}>
        <History size={13} color={t.textSub} style={{marginRight:5}}/>
        <span style={{fontSize:12,fontWeight:600}}>Audit log</span>
        <span style={{marginLeft:7,fontSize:10.5,color:t.textMuted}}>({auditLog.length} entries)</span>
      </div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead>
            <tr style={{borderBottom:`1px solid ${t.border}`}}>
              {["Command","Target","Status","Actor","Time"].map(h=>(
                <th key={h} style={{textAlign:"left",padding:"7px 12px",fontSize:10,fontWeight:600,color:t.textMuted,fontFamily:DS.font.mono,letterSpacing:"0.04em"}}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {auditLog.slice(0,8).map((e,i)=>(
              <tr key={i} style={{borderBottom:`1px solid ${t.border}`}}
                onMouseEnter={ev=>ev.currentTarget.style.background=t.surfaceHover}
                onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
                <td style={{padding:"8px 12px",fontWeight:500}}>{e.cmd}</td>
                <td style={{padding:"8px 12px",fontFamily:DS.font.mono,color:t.textSub}}>{e.target}</td>
                <td style={{padding:"8px 12px"}}><StatusIcon s={e.status} withLabel/></td>
                <td style={{padding:"8px 12px",color:t.textSub}}>{e.actor}</td>
                <td style={{padding:"8px 12px",fontFamily:DS.font.mono,color:t.textMuted}}>{e.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function QuickActionsGrid({addAudit,addNotif}){
  const {t}=useTheme();
  const reportCmd=useCommand({label:"Generate Executive Report",serviceCall:()=>MockService.generateReport("executive"),onAudit:e=>{addAudit(e);addNotif({text:"Executive report generated",severity:"info"});}});
  const incidentCmd=useCommand({label:"Create Incident",serviceCall:()=>MockService.createIncident({title:"Manual incident",severity:"warning"}),onAudit:e=>{addAudit(e);addNotif({text:"New incident created",severity:"warning"});}});
  return(
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
      <CommandDialog cmd={reportCmd} label="Generate executive report" description="Generate a PDF summary for the last 7 days. Emailed to all C-suite stakeholders."
        trigger={({onClick})=><QABtn t={t} icon={Download} label="Generate report" desc="Last 7 days - PDF" onClick={onClick}/>}/>
      <CommandDialog cmd={incidentCmd} label="Create incident" description="Open a new incident. Select severity and assign an owner. A war room channel is created automatically."
        trigger={({onClick})=><QABtn t={t} icon={PlusCircle} label="Create incident" desc="Opens war room channel" onClick={onClick}/>}/>
      <QABtn t={t} icon={BarChart3}       label="View reports"    desc="Saved and scheduled"    onClick={()=>{}}/>
      <QABtn t={t} icon={UserPlus}        label="Manage users"    desc="14 pending invites"     onClick={()=>{}}/>
      <QABtn t={t} icon={SlidersHorizontal} label="System settings" desc="Roles, integrations" onClick={()=>{}}/>
      <QABtn t={t} icon={MessageSquare}   label="Send broadcast"  desc="Notify all teams"       onClick={()=>{}}/>
    </div>
  );
}

function ActivityTimeline({t}){
  return(
    <Card t={t} p={14}>
      {MOCK.activityFeed.map((e,i)=>(
        <div key={i} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:i<MOCK.activityFeed.length-1?`1px solid ${t.border}`:"none"}}>
          <div style={{width:24,height:24,borderRadius:6,background:t.surfaceHover,border:`1px solid ${t.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <e.icon size={12} color={t.textSub}/>
          </div>
          <div style={{flex:1,fontSize:12}}>{e.text}</div>
          <div style={{fontSize:9.5,color:t.textMuted,fontFamily:DS.font.mono,whiteSpace:"nowrap"}}>{e.time}</div>
        </div>
      ))}
    </Card>
  );
}

function SystemPulse({t}){
  const score=73;
  const vals=[62,66,70,64,58,61,67,72,69,73].map((v,i)=>({i,v}));
  const s=score>85?"healthy":score>65?"warning":"critical";
  return(
    <div style={{display:"flex",alignItems:"center",gap:7,padding:"4px 10px",borderRadius:99,background:t.surface,border:`1px solid ${t.border}`}}>
      <StatusDot s={s} pulse/>
      <span style={{fontSize:9.5,color:t.textMuted,fontFamily:DS.font.mono}}>SYS PULSE</span>
      <div style={{width:56,height:16}}>
        <ResponsiveContainer width="100%" height={16}>
          <AreaChart data={vals} margin={{top:0,right:0,bottom:0,left:0}}>
            <defs><linearGradient id="spg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={DS.status[s]} stopOpacity={0.35}/><stop offset="100%" stopColor={DS.status[s]} stopOpacity={0}/></linearGradient></defs>
            <Area type="monotone" dataKey="v" stroke={DS.status[s]} strokeWidth={1.5} fill="url(#spg)" dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <span style={{fontSize:10.5,fontFamily:DS.font.mono,fontWeight:700,color:DS.status[s]}}>{score}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PRIMITIVE COMPONENTS
// ─────────────────────────────────────────────────────────────
function KpiCard({k,t}){
  const c=k.up?DS.status.healthy:DS.status.critical;
  const pts=k.spark.map((v,i)=>({i,v}));
  return(
    <Card t={t} p={12}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:11,color:t.textSub,fontWeight:500}}>{k.label}</div>
        <k.icon size={13} color={t.textMuted}/>
      </div>
      <div style={{fontFamily:DS.font.mono,fontSize:20,fontWeight:700,margin:"4px 0 2px"}}>{k.value}</div>
      <div style={{display:"flex",alignItems:"center",gap:3,marginBottom:6}}>
        {k.up?<ArrowUpRight size={11} color={c}/>:<ArrowDownRight size={11} color={c}/>}
        <span style={{fontSize:10.5,color:c,fontFamily:DS.font.mono,fontWeight:600}}>{k.change}%</span>
        <span style={{fontSize:9.5,color:t.textMuted}}>vs last period</span>
      </div>
      <ResponsiveContainer width="100%" height={26}>
        <AreaChart data={pts} margin={{top:0,right:0,bottom:0,left:0}}>
          <defs><linearGradient id={`kg${k.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c} stopOpacity={0.3}/><stop offset="100%" stopColor={c} stopOpacity={0}/></linearGradient></defs>
          <Area type="monotone" dataKey="v" stroke={c} strokeWidth={1.5} fill={`url(#kg${k.id})`} dot={false}/>
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

function MetricCard({t,label,value,icon:Icon,note,color}){
  return(
    <Card t={t} p={12}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:11,color:t.textSub}}>{label}</div>
        <Icon size={13} color={color||t.textMuted}/>
      </div>
      <div style={{fontFamily:DS.font.mono,fontSize:19,fontWeight:700,margin:"4px 0 2px",color:color||t.text}}>{value}</div>
      <div style={{fontSize:10.5,color:t.textMuted}}>{note}</div>
    </Card>
  );
}

function Card({t,children,p=14}){
  return<div style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:DS.radius.lg,padding:p,boxShadow:DS.shadow.card}}>{children}</div>;
}

function ChartCard({t,title,sub,children}){
  return(
    <Card t={t} p={12}>
      <div style={{marginBottom:8}}>
        <div style={{fontSize:12,fontWeight:600}}>{title}</div>
        <div style={{fontSize:10,color:t.textMuted}}>{sub}</div>
      </div>
      {children}
    </Card>
  );
}

function SH({t,title,sub}){
  return(
    <div style={{marginTop:2}}>
      <h2 style={{fontFamily:DS.font.display,fontSize:14.5,fontWeight:700,margin:0,letterSpacing:"-0.01em"}}>{title}</h2>
      <p style={{fontSize:11,color:t.textMuted,margin:"2px 0 0"}}>{sub}</p>
    </div>
  );
}

function Btn({variant="primary",t,children,onClick,small,style}){
  const base={display:"flex",alignItems:"center",gap:4,border:"none",borderRadius:DS.radius.sm,cursor:"pointer",fontFamily:DS.font.body,fontWeight:600,fontSize:small?11:12,padding:small?"4px 9px":"6px 12px",transition:"opacity .14s",...style};
  const variants={
    primary:{background:DS.accent.primary,color:"#fff"},
    ghost:{background:t.surfaceHover,border:`1px solid ${t.border}`,color:t.text},
    danger:{background:`${DS.status.critical}15`,border:`1px solid ${DS.status.critical}44`,color:DS.status.critical},
    success:{background:`${DS.status.healthy}15`,border:`1px solid ${DS.status.healthy}44`,color:DS.status.healthy},
  };
  return<button onClick={onClick} style={{...base,...variants[variant]}}>{children}</button>;
}

function QABtn({t,icon:Icon,label,desc,onClick}){
  return(
    <button onClick={onClick} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 12px",borderRadius:DS.radius.lg,border:`1px solid ${t.border}`,background:t.surface,cursor:"pointer",textAlign:"left",fontFamily:DS.font.body,transition:"border-color .14s"}}
      onMouseEnter={e=>e.currentTarget.style.borderColor=DS.accent.primary}
      onMouseLeave={e=>e.currentTarget.style.borderColor=t.border}>
      <div style={{width:30,height:30,borderRadius:8,flexShrink:0,background:`${DS.accent.primary}15`,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Icon size={14} color={DS.accent.primary}/>
      </div>
      <div>
        <div style={{fontSize:12,fontWeight:600,color:t.text}}>{label}</div>
        <div style={{fontSize:10,color:t.textMuted}}>{desc}</div>
      </div>
    </button>
  );
}

function StatusDot({s,pulse}){
  const c=DS.status[s]||DS.status.info;
  return(
    <span style={{position:"relative",display:"inline-flex",width:7,height:7,flexShrink:0}}>
      <span style={{width:7,height:7,borderRadius:99,background:c,display:"block"}}/>
      {pulse&&<span style={{position:"absolute",inset:0,borderRadius:99,background:c,animation:"pulseRing 1.8s ease-out infinite"}}/>}
    </span>
  );
}

function StatusIcon({s,withLabel}){
  const map={success:{icon:CheckCircle2,color:DS.status.healthy},failure:{icon:XCircle,color:DS.status.critical},rollback:{icon:RotateCcw,color:DS.status.warning}};
  const m=map[s]||map.success;
  return(
    <span style={{display:"flex",alignItems:"center",gap:4,color:m.color,fontSize:11}}>
      <m.icon size={12} color={m.color}/>
      {withLabel&&<span style={{fontFamily:DS.font.mono,fontWeight:600}}>{s}</span>}
    </span>
  );
}

function StatusChip({s}){
  const c={investigating:DS.status.critical,monitoring:DS.status.warning,resolved:DS.status.healthy,open:DS.status.critical,pending:DS.status.info}[s]||DS.status.neutral;
  return<span style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:9.5,fontFamily:DS.font.mono,fontWeight:600,color:c,background:`${c}18`,padding:"1px 6px",borderRadius:99}}><span style={{width:4,height:4,borderRadius:99,background:c}}/>{s.toUpperCase()}</span>;
}

function PriorityIcon({p}){
  const c={high:DS.status.critical,medium:DS.status.warning,low:DS.status.neutral}[p];
  return<AlertOctagon size={14} color={c}/>;
}

function ProgressBar({val,t}){
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:11}}>
        <span style={{color:t.textSub}}>Progress</span>
        <span style={{fontFamily:DS.font.mono,fontWeight:700}}>{val}%</span>
      </div>
      <div style={{height:5,borderRadius:99,background:t.surfaceHover,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${val}%`,borderRadius:99,background:DS.accent.gradient,transition:"width .4s"}}/>
      </div>
    </div>
  );
}

function MiniProgress({val,t}){
  return(
    <div style={{height:4,borderRadius:99,background:t.border,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${val}%`,borderRadius:99,background:DS.accent.gradient}}/>
    </div>
  );
}

function StatPill({label,val,color}){
  return<div style={{textAlign:"center"}}><div style={{fontFamily:DS.font.mono,fontSize:17,fontWeight:700,color}}>{val}</div><div style={{fontSize:10,color:"#8892A6"}}>{label}</div></div>;
}

function MonoTip({active,payload,label,t}){
  if(!active||!payload?.length)return null;
  return(
    <div style={{background:t.surface,border:`1px solid ${t.borderStrong}`,borderRadius:7,padding:"6px 9px",fontSize:10.5,fontFamily:DS.font.mono,color:t.text,boxShadow:DS.shadow.overlay}}>
      <div style={{color:t.textMuted,marginBottom:3}}>{label}</div>
      {payload.map((p,i)=><div key={i} style={{color:p.color||p.stroke||p.fill}}>{p.name}: <strong>{typeof p.value==="number"?p.value.toLocaleString():p.value}</strong></div>)}
    </div>
  );
}

function EmptyState({t,icon:Icon,msg}){
  return<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"20px 0",color:t.textMuted,fontSize:12.5}}><Icon size={15}/>{msg}</div>;
}

function ComingSoon({label,t}){
  return<div style={{height:"70vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:t.textMuted,gap:9}}><Layers size={24}/><div style={{fontSize:12.5}}>{label} - connect data sources here. Command framework is ready.</div></div>;
}

function iconBtnS(t){return{width:30,height:30,borderRadius:7,border:`1px solid ${t.border}`,background:t.surface,color:t.textSub,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative"};}

function GlobalCss({t}){
  return(
    <style>{`
      *{box-sizing:border-box;}
      body{margin:0;}
      ::-webkit-scrollbar{width:5px;height:5px;}
      ::-webkit-scrollbar-thumb{background:${t.borderStrong};border-radius:99px;}
      ::-webkit-scrollbar-track{background:transparent;}
      @keyframes pulseRing{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.8);opacity:0}}
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
      @keyframes progress{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
      button:focus-visible{outline:2px solid ${DS.accent.primary};outline-offset:1px;}
      @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;}}
    `}</style>
  );
}
