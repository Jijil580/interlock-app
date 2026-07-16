import { useState, useEffect } from "react";

const API = "https://interlock-backend.onrender.com/api";
const COMPANY = { name: "PK Interlock", logo: "🏭" };
const POWERED_BY = "Powered by LUMIER TECHNOLOGIES";
const COPYRIGHT_TEXT = `© ${new Date().getFullYear()} LUMIER TECHNOLOGIES. All rights reserved.`;
const CURRENCY = "₹";
const fmt = (n) => (+(n)||0).toLocaleString("en-IN");
const today = () => new Date().toISOString().split("T")[0];
const findMasterItem = (row, masters = []) => masters.find(m => (
  (row?.itemId && m._id === row.itemId) ||
  ((m.name || "").toLowerCase() === String(row?.itemName || row?.product || row?.name || row?.item || "").toLowerCase() &&
   (!row?.color || !m.color || String(m.color).toLowerCase() === String(row.color).toLowerCase()))
));
const itemSqftPerPiece = (row, masters = []) => +(row?.sqftPerPiece || findMasterItem(row, masters)?.sqftPerPiece || 0);
const itemCount = (row) => +(row?.producedQty ?? row?.quantity ?? row?.qty ?? 0) || 0;
const itemSqft = (row, masters = []) => +(row?.sqftQty ?? row?.sqftQuantity ?? 0) || (itemCount(row) * itemSqftPerPiece(row, masters));
const qtyWithSqft = (row, masters = [], unitFallback = "piece") => {
  const unit = row?.unit || row?.unitType || unitFallback;
  const sqft = itemSqft(row, masters);
  return `${fmt(itemCount(row))} ${unit}${sqft ? ` / ${fmt(sqft)} sqft` : ""}`;
};
const directSitePaymentRows = (site, dailyReceived = 0) => {
  const payments = (site?.payments || []).map(p => ({ ...p, date: p.date || site?.startDate, source: "Site Work" }));
  if (payments.length) return payments;
  const legacy = Math.max(0, (+(site?.totalReceived ?? site?.paidAmount ?? 0) || 0) - (+(dailyReceived) || 0));
  return legacy > 0 ? [{ date: site?.startDate || today(), amount: legacy, mode: site?.paymentMode || "Cash", source: "Initial Site Work" }] : [];
};
const workerTypeOf = (w) => {
  const raw = String(w?.workerType || w?.workerCategory || "").toLowerCase();
  if (raw.includes("production")) return "Production Worker";
  return "Site Worker";
};
const isActiveWorker = (w) => String(w?.status || "Active").toLowerCase() !== "inactive";
const isAdminLike = (role) => role === "admin" || role === "user";
const effectiveRoleOf = (role) => role === "user" ? "admin" : role;

const mergeDailyReportsByDate = (reports = []) => {
  const map = new Map();
  reports.forEach((r) => {
    const key = r.date || "";
    const current = map.get(key) || {
      ...r,
      _ids: [], reportCount: 0, workerEntries: [], payments: [], completedToday: 0,
      totalCompleted: r.totalCompleted || "", totalPayments: 0, totalReceived: 0,
      materials: [], extraWorks: [], complaintsList: [], notesList: [], sourceReports: [],
    };
    current._ids.push(r._id);
    current.reportCount += 1;
    current.sourceReports.push(r);
    current.workerEntries = [...(current.workerEntries || []), ...(r.workerEntries || [])];
    current.payments = [...(current.payments || []), ...(r.payments || [])];
    current.completedToday = (+(current.completedToday) || 0) + (+(r.completedToday) || 0);
    current.totalPayments = (+(current.totalPayments) || 0) + (+(r.totalPayments) || 0);
    current.totalReceived = (+(current.totalReceived) || 0) + (+(r.totalReceived) || 0);
    if (r.totalCompleted) current.totalCompleted = r.totalCompleted;
    if (r.materialsUnloaded) current.materials.push(r);
    if (r.extraWorkDesc) current.extraWorks.push(r);
    if (r.complaints) current.complaintsList.push(r);
    if (r.dayNotes) current.notesList.push(r);
    current.workersCount = current.workerEntries.length;
    map.set(key, current);
  });
  return Array.from(map.values()).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
};

async function api(method, path, body) {
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  } catch { return {}; }
}

// ─── UI COMPONENTS ─────────────────────────────────────────────────────────────
function Badge({ children, color = "gray" }) {
  const c = { green:"bg-green-100 text-green-700 border-green-200", red:"bg-red-100 text-red-700 border-red-200", yellow:"bg-yellow-100 text-yellow-700 border-yellow-200", blue:"bg-blue-100 text-blue-700 border-blue-200", gray:"bg-gray-100 text-gray-600 border-gray-200", orange:"bg-orange-100 text-orange-700 border-orange-200", purple:"bg-purple-100 text-purple-700 border-purple-200", teal:"bg-teal-100 text-teal-700 border-teal-200", amber:"bg-amber-100 text-amber-700 border-amber-200" };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${c[color]||c.gray}`}>{children}</span>;
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-sm p-3">
      <div className={`bg-white rounded-xl shadow-xl border border-slate-200 w-full ${wide?"max-w-2xl":"max-w-lg"} max-h-[92vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h3 className="font-black text-gray-900 text-base">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      {label && <label className="block text-xs font-bold text-slate-600 mb-1">{label}</label>}
      <input className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white shadow-sm" {...props} />
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div>
      {label && <label className="block text-xs font-bold text-slate-600 mb-1">{label}</label>}
      <textarea className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white shadow-sm resize-none" rows={3} {...props} />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div>
      {label && <label className="block text-xs font-bold text-slate-600 mb-1">{label}</label>}
      <select className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white shadow-sm" {...props}>
        {options.map((o) => <option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}
      </select>
    </div>
  );
}

function SiteWorkDetailsPanel({ site, dailyReceived = 0 }) {
  if (!site) return null;
  const baseCost = (+(site.workSize || 0)) * (+(site.ratePerUnit || 0));
  const siteCost = +(site.totalCost || site.totalAmount || 0);
  const directPayments = directSitePaymentRows(site, dailyReceived);
  const received = dailyReceived + directPayments.reduce((a,p)=>a+(+(p.amount)||0),0);
  const pending = Math.max(0, siteCost - received);
  return (
    <SectionBox title="Site Work Details" icon="Site" color="amber">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div><div className="text-xs text-gray-400">Customer</div><div className="font-bold">{site.customerName||"-"}</div></div>
        <div><div className="text-xs text-gray-400">Phone</div><div className="font-bold">{site.phone||"-"}</div></div>
        <div className="col-span-2"><div className="text-xs text-gray-400">Location</div><div className="font-bold">{site.siteLocation||site.location||"-"}</div></div>
        <div><div className="text-xs text-gray-400">Interlock Type</div><div className="font-bold">{site.interlockType||"-"}</div></div>
        <div><div className="text-xs text-gray-400">Color / Spec</div><div className="font-bold">{site.interlockColor||"-"}</div></div>
        <div><div className="text-xs text-gray-400">Work Size</div><div className="font-bold">{site.workSize||0} {site.workUnit||"sqft"}</div></div>
        <div><div className="text-xs text-gray-400">Rate</div><div className="font-bold">{CURRENCY}{fmt(site.ratePerUnit||0)}/{site.workUnit||"sqft"}</div></div>
        <div><div className="text-xs text-gray-400">Start Date</div><div className="font-bold">{site.startDate||"-"}</div></div>
        <div><div className="text-xs text-gray-400">End Date</div><div className="font-bold">{site.endDate||"-"}</div></div>
        <div><div className="text-xs text-gray-400">Status</div><div className="font-bold">{site.status||"-"}</div></div>
        <div><div className="text-xs text-gray-400">Added By</div><div className="font-bold">{site.addedBy||"-"}</div></div>
      </div>
      {(site.selectedWorkers||[]).length>0&&<div className="mt-2"><div className="text-xs text-gray-400 mb-1">Assigned Workers</div><div className="flex flex-wrap gap-1">{(site.selectedWorkers||[]).map(w=><Badge key={w} color="teal">{w}</Badge>)}</div></div>}
      <div className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between"><span>Base Cost</span><span className="font-bold">{CURRENCY}{fmt(baseCost)}</span></div>
        {(site.extraWork||[]).map((e,i)=><div key={`ew-${i}`} className="flex justify-between text-xs pl-2"><span>Extra Work: {e.name} ({e.qty||1} x {CURRENCY}{fmt(e.rate||0)})</span><span className="font-bold text-orange-700">{CURRENCY}{fmt(e.total||0)}</span></div>)}
        {(site.extraMaterials||[]).map((e,i)=><div key={`em-${i}`} className="flex justify-between text-xs pl-2"><span>Extra Material: {e.name} ({e.qty||0} {e.unit||""} x {CURRENCY}{fmt(e.rate||0)})</span><span className="font-bold text-purple-700">{CURRENCY}{fmt(e.total||0)}</span></div>)}
        {+(site.materialCost||0)>0&&<div className="flex justify-between"><span>Material Cost</span><span className="font-bold">{CURRENCY}{fmt(site.materialCost)}</span></div>}
        {+(site.laborCost||0)>0&&<div className="flex justify-between"><span>Labour Cost</span><span className="font-bold">{CURRENCY}{fmt(site.laborCost)}</span></div>}
        <div className="flex justify-between border-t pt-1"><span className="font-black">Total Site Cost</span><span className="font-black text-green-700">{CURRENCY}{fmt(siteCost)}</span></div>
        <div className="flex justify-between"><span>Total Received</span><span className="font-bold text-blue-700">{CURRENCY}{fmt(received)}</span></div>
        <div className="flex justify-between"><span className="font-black text-red-600">Pending</span><span className="font-black text-red-600">{CURRENCY}{fmt(pending)}</span></div>
      </div>
      {directPayments.length>0&&<div className="mt-2 text-xs"><div className="font-bold text-blue-700 mb-1">Site Work Payments</div>{directPayments.map((p,i)=><div key={i} className="flex justify-between border-t py-1"><span>{p.date||"-"} ? {p.mode||p.paymentMode||"-"}</span><span className="font-bold">{CURRENCY}{fmt(p.amount)}</span></div>)}</div>}
      {site.note&&<div className="mt-2 text-sm"><div className="text-xs text-gray-400">Note</div><div>{site.note}</div></div>}
    </SectionBox>
  );
}

function StatCard({ label, value, sub, icon, color }) {
  const c = {
    amber:"bg-amber-50 text-amber-700 border-amber-200",
    blue:"bg-blue-50 text-blue-700 border-blue-200",
    green:"bg-emerald-50 text-emerald-700 border-emerald-200",
    red:"bg-red-50 text-red-700 border-red-200",
    purple:"bg-violet-50 text-violet-700 border-violet-200",
    teal:"bg-teal-50 text-teal-700 border-teal-200",
    gray:"bg-slate-50 text-slate-600 border-slate-200"
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-lg border ${c[color]||c.amber} flex items-center justify-center text-sm font-black shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-xl font-black text-slate-950 truncate">{value}</div>
        <div className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function Loader() {
  return <div className="flex items-center justify-center py-16"><div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;
}

function EmptyState({ icon, text }) {
  return <div className="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-sm"><div className="text-3xl mb-2 opacity-70">{icon}</div><div className="text-slate-400 font-semibold">{text}</div></div>;
}

function SectionBox({ title, icon, color = "gray", children }) {
  const c = { gray:"border-slate-300 text-slate-700", blue:"border-blue-400 text-blue-700", green:"border-emerald-400 text-emerald-700", amber:"border-amber-400 text-amber-700", red:"border-red-400 text-red-700", purple:"border-violet-400 text-violet-700", teal:"border-teal-400 text-teal-700", orange:"border-orange-400 text-orange-700" };
  return (
    <div className={`bg-white border border-slate-200 border-l-4 ${c[color]} rounded-xl p-4 space-y-3 shadow-sm`}>
      <div className={`text-xs font-black uppercase tracking-wider ${c[color].split(" ")[1]}`}>{icon} {title}</div>
      {children}
    </div>
  );
}


// ─── DEVICE FINGERPRINT ───────────────────────────────────────────────────────
function getDeviceId() {
  let id = localStorage.getItem("pk_device_id");
  if (!id) {
    id = "dev_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("pk_device_id", id);
  }
  return id;
}

function getDeviceInfo() {
  const ua = navigator.userAgent;
  const deviceId = getDeviceId();
  let deviceName = "Unknown Device";
  let browser = "Unknown Browser";

  // Detect device
  if (/iPhone/.test(ua)) deviceName = "iPhone";
  else if (/iPad/.test(ua)) deviceName = "iPad";
  else if (/Samsung|SM-/.test(ua)) deviceName = "Samsung Galaxy";
  else if (/Redmi|Mi /.test(ua)) deviceName = "Xiaomi/Redmi";
  else if (/OnePlus/.test(ua)) deviceName = "OnePlus";
  else if (/Pixel/.test(ua)) deviceName = "Google Pixel";
  else if (/Android/.test(ua)) deviceName = "Android Phone";
  else if (/Windows/.test(ua)) deviceName = "Windows PC";
  else if (/Mac/.test(ua)) deviceName = "Mac";

  // Detect browser
  if (/Chrome\//.test(ua) && !/Chromium|Edge/.test(ua)) browser = "Chrome";
  else if (/Firefox/.test(ua)) browser = "Firefox";
  else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = "Safari";
  else if (/Edge/.test(ua)) browser = "Edge";

  const isMobile = /Mobi|Android|iPhone|iPad/.test(ua);

  return { deviceId, deviceName, browser, isMobile, userAgent: ua.slice(0, 100), loginTime: new Date().toLocaleString("en-IN") };
}

// ─── DEVICE PENDING SCREEN ────────────────────────────────────────────────────
function DevicePendingScreen({ username, deviceInfo, onRetry }) {
  const [status, setStatus] = useState("pending"); // pending | approved | rejected
  const [checking, setChecking] = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    const devices = await api("GET", "/devices");
    const myDevice = Array.isArray(devices) && devices.find(d => d.deviceId === deviceInfo.deviceId && d.username === username);
    if (myDevice?.status === "approved") setStatus("approved");
    else if (myDevice?.status === "rejected") setStatus("rejected");
    else setStatus("pending");
    setChecking(false);
    if (myDevice?.status === "approved") setTimeout(onRetry, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-8 text-center">
        {status === "approved" ? (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-black text-green-700 mb-2">Device Approved!</h2>
            <p className="text-gray-500 text-sm">Logging you in...</p>
          </>
        ) : status === "rejected" ? (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-xl font-black text-red-600 mb-2">Access Denied</h2>
            <p className="text-gray-500 text-sm mb-4">Admin has rejected this device. Contact your admin.</p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">📱</div>
            <h2 className="text-xl font-black text-gray-900 mb-2">New Device Detected</h2>
            <p className="text-gray-500 text-sm mb-6">Waiting for admin approval to access the app.</p>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left mb-6 space-y-1">
              <div className="text-xs font-bold text-amber-700 mb-2">📋 Device Details</div>
              <div className="text-xs text-gray-600"><span className="font-bold">Device:</span> {deviceInfo.deviceName}</div>
              <div className="text-xs text-gray-600"><span className="font-bold">Browser:</span> {deviceInfo.browser}</div>
              <div className="text-xs text-gray-600"><span className="font-bold">Type:</span> {deviceInfo.isMobile ? "Mobile" : "Desktop"}</div>
              <div className="text-xs text-gray-600"><span className="font-bold">Time:</span> {deviceInfo.loginTime}</div>
            </div>
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{animationDelay:"0ms"}}/>
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{animationDelay:"150ms"}}/>
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{animationDelay:"300ms"}}/>
            </div>
          </>
        )}
        <button onClick={checkStatus} disabled={checking} className="w-full bg-amber-500 text-white py-3 rounded-lg font-bold hover:bg-amber-600 disabled:opacity-60 mt-2">
          {checking ? "Checking..." : "🔄 Check Approval Status"}
        </button>
      </div>
    </div>
  );
}

// ─── DEVICE MANAGEMENT (Admin) ────────────────────────────────────────────────
function DeviceManagement({ user }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  useEffect(() => {
    api("GET", "/devices").then(d => {
      setDevices(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, []);

  const updateDevice = async (id, status) => {
    await api("PUT", `/devices/${id}`, { status });
    setDevices(p => p.map(d => d._id === id ? { ...d, status } : d));
  };

  const deleteDevice = async (id) => {
    if (!window.confirm("Remove this device?")) return;
    await api("DELETE", `/devices/${id}`);
    setDevices(p => p.filter(d => d._id !== id));
  };

  const pending = devices.filter(d => d.status === "pending");
  const approved = devices.filter(d => d.status === "approved");
  const rejected = devices.filter(d => d.status === "rejected");

  const filtered = filter === "pending" ? pending : filter === "approved" ? approved : rejected;

  if (loading) return <Loader />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-gray-900">📱 Device Management</h2>

      {pending.length > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>
            <div className="font-black text-red-700">🔔 {pending.length} Pending Approval{pending.length > 1 ? "s" : ""}</div>
          </div>
          <div className="text-xs text-red-600">New devices waiting for your approval!</div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-center"><div className="font-black text-amber-700">{pending.length}</div><div className="text-xs text-gray-400">Pending</div></div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-2 text-center"><div className="font-black text-green-700">{approved.length}</div><div className="text-xs text-gray-400">Approved</div></div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-2 text-center"><div className="font-black text-red-600">{rejected.length}</div><div className="text-xs text-gray-400">Rejected</div></div>
      </div>

      <div className="flex gap-1">
        {["pending","approved","rejected"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} className={`flex-1 py-2 rounded-xl text-xs font-bold ${filter===f?"bg-amber-500 text-white":"bg-white border border-gray-200 text-gray-600"}`}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && <EmptyState icon="📱" text={`No ${filter} devices`} />}
        {filtered.map(d => (
          <div key={d._id} className={`bg-white rounded-2xl border shadow-sm p-4 ${d.status==="pending"?"border-amber-300":d.status==="approved"?"border-green-200":"border-red-200"}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-gray-900">{d.name}</span>
                  <Badge color={d.status==="approved"?"green":d.status==="pending"?"amber":"red"}>{d.status}</Badge>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">👤 {d.username} · {d.role}</div>
                <div className="text-xs text-gray-400">📱 {d.deviceName} · {d.browser}</div>
                <div className="text-xs text-gray-400">🕐 {d.loginTime}</div>
                <div className="text-xs text-gray-300 mt-0.5 font-mono">{d.deviceId?.slice(0,20)}...</div>
              </div>
            </div>
            <div className="mt-3 flex gap-1">
              {d.status !== "approved" && (
                <button onClick={() => updateDevice(d._id, "approved")} className="flex-1 bg-green-500 text-white py-2 rounded-xl text-xs font-bold hover:bg-green-600">✅ Approve</button>
              )}
              {d.status !== "rejected" && (
                <button onClick={() => updateDevice(d._id, "rejected")} className="flex-1 bg-red-500 text-white py-2 rounded-xl text-xs font-bold hover:bg-red-600">❌ Reject</button>
              )}
              <button onClick={() => deleteDevice(d._id)} className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-gray-200">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!username || !password) return setError("Enter username and password");
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.role) {
        // Check device approval (skip for admin)
        if (!isAdminLike(data.role)) {
          const deviceInfo = getDeviceInfo();
          // Register device if not exists
          const devRes = await api("POST", "/devices/check", {
            deviceId: deviceInfo.deviceId,
            username: data.username,
            name: data.name,
            role: data.role,
            deviceName: deviceInfo.deviceName,
            browser: deviceInfo.browser,
            loginTime: deviceInfo.loginTime,
          });
          if (devRes.status === "approved") {
            onLogin(data);
          } else if (devRes.status === "pending") {
            onLogin({ ...data, devicePending: true, deviceInfo });
          } else {
            onLogin(data); // new device registered, pending
          }
        } else {
          onLogin(data);
        }
      } else setError(data.message || "Invalid credentials");
    } catch {
      setError("Server error, please try again");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl">{COMPANY.logo}</div>
          <h1 className="text-2xl font-black text-gray-900">{COMPANY.name}</h1>
          <p className="text-slate-500 text-sm mt-1">Management System</p>
        </div>
        <div className="space-y-4">
          <Input label="Username" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Enter username" onKeyDown={e=>e.key==="Enter"&&login()} />
          <Input label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter password" onKeyDown={e=>e.key==="Enter"&&login()} />
          {error && <div className="text-red-600 text-xs font-semibold bg-red-50 rounded-xl p-3">{error}</div>}
          <button onClick={login} disabled={loading} className="w-full bg-amber-500 text-white py-3 rounded-lg font-black text-base hover:bg-amber-600 shadow-sm disabled:opacity-60">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <div className="text-[11px] font-bold text-gray-500">{POWERED_BY}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">{COPYRIGHT_TEXT}</div>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ stock, raw, production, sales, siteWorks, user }) {
  const isAdmin = user.role === "admin";
  const fixedToday = today();
  const [view, setView] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(fixedToday);
  const [selectedMonth, setSelectedMonth] = useState(fixedToday.slice(0, 7));
  const [fromDate, setFromDate] = useState(fixedToday);
  const [toDate, setToDate] = useState(fixedToday);
  const [summary, setSummary] = useState({ totals: {}, productionItemSummary: [], recentSales: [], recentPurchases: [], recentProduction: [], recentSites: [] });
  const [loading, setLoading] = useState(true);

  const range = () => {
    if (!isAdmin) return { from: fixedToday, to: fixedToday, label: "Today" };
    if (view === "all") return { from: "", to: "", label: "All Time" };
    if (view === "monthly") {
      const [year, month] = selectedMonth.split("-");
      const last = new Date(+year, +month, 0).getDate();
      return { from: `${selectedMonth}-01`, to: `${selectedMonth}-${String(last).padStart(2, "0")}`, label: selectedMonth };
    }
    if (view === "range") return { from: fromDate, to: toDate, label: `${fromDate} to ${toDate}` };
    return { from: selectedDate, to: selectedDate, label: selectedDate };
  };

  useEffect(() => {
    let active = true;
    const r = range();
    const params = new URLSearchParams({ role: effectiveRoleOf(user.role), fromDate: r.from, toDate: r.to });
    setLoading(true);
    api("GET", `/dashboard-summary?${params.toString()}`).then(data => {
      if (!active) return;
      setSummary(data?.totals ? data : { totals: {}, productionItemSummary: [], recentSales: [], recentPurchases: [], recentProduction: [], recentSites: [] });
      setLoading(false);
    });
    return () => { active = false; };
  }, [user.role, view, selectedDate, selectedMonth, fromDate, toDate]);

  const total = summary.totals || {};
  const money = value => `${CURRENCY}${fmt(value)}`;
  const currentRange = range();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-gray-900">Good day, {user.name.split(" ")[0]}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{isAdmin ? `Dashboard period: ${currentRange.label}` : "Today's office dashboard"}</p>
        </div>
        {isAdmin && (
          <div className="bg-white border rounded-2xl shadow-sm p-3 grid grid-cols-2 sm:flex gap-2 items-end">
            <Select label="View" value={view} options={[{value:"daily",label:"Daily"},{value:"monthly",label:"Monthly"},{value:"range",label:"Date Range"},{value:"all",label:"All Time"}]} onChange={e=>setView(e.target.value)} />
            {view==="daily"&&<Input label="Date" type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} />}
            {view==="monthly"&&<Input label="Month" type="month" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} />}
            {view==="range"&&<><Input label="From" type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} /><Input label="To" type="date" value={toDate} onChange={e=>setToDate(e.target.value)} /></>}
          </div>
        )}
      </div>

      {loading ? <Loader /> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Cash In" value={money(total.cashIn)} icon="IN" color="green" sub={`Sales ${money(total.salesReceived)} | Site ${money(total.siteReceived)}`} />
            <StatCard label="Cash Out" value={money(total.cashOut)} icon="OUT" color="red" sub={`Purchase ${money(total.purchasePaid)} | Worker ${money(total.productionPaid)}`} />
            <StatCard label="Net Cash" value={money(total.netCash)} icon="=" color={+(total.netCash)>=0?"green":"red"} />
            <StatCard label="Sales Amount" value={money(total.salesAmount)} icon="S" color="blue" sub={`${total.salesCount||0} invoices`} />
            <StatCard label="Purchases" value={money(total.purchaseAmount)} icon="P" color="amber" sub={`Pending ${money(total.purchasePending)}`} />
            <StatCard label="Production Qty" value={fmt(total.productionQuantity)} icon="Q" color="teal" sub={`${fmt(total.productionSqft)} sqft | Value ${money(total.productionValue)}`} />
            <StatCard label="Running Sites" value={total.runningSites||0} icon="SITE" color="purple" sub={`Completed ${total.completedSites||0}`} />
            <StatCard label="Site Pending" value={money(total.sitePending)} icon="DUE" color="red" sub={`Site value ${money(total.siteValue)}`} />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <SectionBox title="Production Item-wise" icon="P" color="teal">
              {(summary.productionItemSummary||[]).length===0 ? <div className="text-xs text-gray-400">No production in this period</div> : (
                <div className="space-y-2">
                  {summary.productionItemSummary.map((item,i)=>(
                    <div key={i} className="flex justify-between gap-3 text-xs border-b border-teal-100 pb-1">
                      <span><b>{item.item}</b>{item.color?` / ${item.color}`:""}</span>
                      <span className="font-black text-teal-700">{qtyWithSqft(item)}</span>
                    </div>
                  ))}
                </div>
              )}
            </SectionBox>

            <SectionBox title="Stock Position" icon="ST" color="blue">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-blue-50 rounded-xl p-2"><div className="font-black text-blue-700">{total.stockItems||stock.length}</div><div className="text-xs text-gray-400">Items</div></div>
                <div className="bg-green-50 rounded-xl p-2"><div className="font-black text-green-700">{fmt(total.stockQuantity)}</div><div className="text-xs text-gray-400">Qty</div></div>
                <div className="bg-red-50 rounded-xl p-2"><div className="font-black text-red-600">{total.lowStockItems||0}</div><div className="text-xs text-gray-400">Low</div></div>
              </div>
            </SectionBox>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <SectionBox title="Recent Sales" icon="S" color="green">
              {(summary.recentSales||[]).length===0 ? <div className="text-xs text-gray-400">No sales</div> : summary.recentSales.map(s=>(
                <div key={s._id} className="flex justify-between gap-2 text-xs border-b border-green-100 py-1"><span><b>{s.customer||"-"}</b><br />{s.product||s.interlockDetails||"-"}</span><span className="text-right font-black">{money(s.amountPaid)}<br /><span className="text-gray-400">{s.date}</span></span></div>
              ))}
            </SectionBox>
            <SectionBox title="Recent Purchases" icon="P" color="amber">
              {(summary.recentPurchases||[]).length===0 ? <div className="text-xs text-gray-400">No purchases</div> : summary.recentPurchases.map(p=>(
                <div key={p._id} className="flex justify-between gap-2 text-xs border-b border-amber-100 py-1"><span><b>{p.supplierName||"-"}</b><br />{p.itemName||p.itemType||"-"}</span><span className="text-right font-black">{money(p.amountPaid)}<br /><span className="text-gray-400">{p.date}</span></span></div>
              ))}
            </SectionBox>
            <SectionBox title="Recent Production" icon="PR" color="purple">
              {(summary.recentProduction||[]).length===0 ? <div className="text-xs text-gray-400">No production</div> : summary.recentProduction.map(p=>(
                <div key={p._id} className="flex justify-between gap-2 text-xs border-b border-purple-100 py-1"><span><b>{p.workerName||"-"}</b><br />{p.itemName||p.category||"-"}</span><span className="text-right font-black">{qtyWithSqft(p)}<br /><span className="text-gray-400">{p.date}</span></span></div>
              ))}
            </SectionBox>
          </div>
        </>
      )}
    </div>
  );
}
function MasterData() {
  const [tab, setTab] = useState("interlock");
  const [data, setData] = useState({ interlock:[], hollowbricks:[], materials:[], labor:[], extrawork:[], customers:[], suppliers:[] });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saveError, setSaveError] = useState("");

  const loadAll = () => Promise.all([
    api("GET","/masterdata/interlock"),
    api("GET","/masterdata/hollowbricks"),
    api("GET","/masterdata/materials"),
    api("GET","/masterdata/labor"),
    api("GET","/masterdata/extrawork"),
    api("GET","/customers"),
    api("GET","/suppliers"),
  ]).then(([i,h,m,l,e,c,s])=>{
    setData({
      interlock:Array.isArray(i)?i:[], hollowbricks:Array.isArray(h)?h:[], materials:Array.isArray(m)?m:[],
      labor:Array.isArray(l)?l:[], extrawork:Array.isArray(e)?e:[],
      customers:Array.isArray(c)?c:[], suppliers:Array.isArray(s)?s:[],
    });
    setLoading(false);
  });

  useEffect(() => { loadAll(); }, []);

  const save = async () => {
    setSaveError("");
    const type = modal.type;
    let ok = true;
    if (type === "customers") {
      if (!form.name || !form.mobile) { setSaveError("Name and mobile required"); return; }
      if (modal.item?._id) {
        const updated = await api("PUT", `/customers/${modal.item._id}`, form);
        if (updated._id) setData(d=>({...d,customers:d.customers.map(x=>x._id===modal.item._id?updated:x)}));
        else { setSaveError(updated.message||"Failed"); ok = false; }
      } else {
        const created = await api("POST", "/customers", form);
        if (created._id) setData(d=>({...d,customers:[...d.customers,created]}));
        else { setSaveError(created.message||"Failed"); ok = false; }
      }
    } else if (type === "suppliers") {
      if (!form.name) { setSaveError("Supplier name required"); return; }
      const payload = { ...form, address: form.address || form.location, phone: form.mobile || form.phone };
      if (modal.item?._id) {
        const updated = await api("PUT", `/suppliers/${modal.item._id}`, payload);
        if (updated._id) setData(d=>({...d,suppliers:d.suppliers.map(x=>x._id===modal.item._id?updated:x)}));
        else ok = false;
      } else {
        const created = await api("POST", "/suppliers", payload);
        if (created._id) setData(d=>({...d,suppliers:[...d.suppliers,created]}));
        else ok = false;
      }
    } else if (modal.item?._id) {
      await api("PUT", `/masterdata/${type}/${modal.item._id}`, form);
      setData(d=>({...d,[type]:d[type].map(x=>x._id===modal.item._id?{...x,...form}:x)}));
    } else {
      const created = await api("POST", `/masterdata/${type}`, form);
      if (created._id) setData(d=>({...d,[type]:[...d[type],created]}));
    }
    if (ok) { setModal(null); setForm({}); }
  };

  const del = async (type, id) => {
    if (!window.confirm("Delete this item?")) return;
    if (type === "customers") await api("DELETE", `/customers/${id}`);
    else if (type === "suppliers") await api("DELETE", `/suppliers/${id}`);
    else await api("DELETE", `/masterdata/${type}/${id}`);
    setData(d=>({...d,[type]:d[type].filter(x=>x._id!==id)}));
  };

  const openAdd = (type) => { setSaveError(""); setForm({}); setModal({type, item:null}); };
  const openEdit = (type, item) => { setSaveError(""); setForm({...item, mobile: item.mobile || item.phone || ""}); setModal({type, item}); };

  const tabs = [
    { id:"interlock", label:"Interlock Types", icon:"🧱" },
    { id:"materials", label:"Raw Materials", icon:"⚙️" },
    { id:"labor", label:"Labor Rates", icon:"👷" },
    { id:"extrawork", label:"Extra Work", icon:"➕" },
    { id:"customers", label:"Customer Master", icon:"👤" },
    { id:"suppliers", label:"Supplier Master", icon:"🏪" },
  ];
  tabs.splice(1, 0, { id:"hollowbricks", label:"Hollow Bricks", icon:"HB" });

  const renderForm = () => {
    const t = modal?.type;
    if (t==="interlock") return <>
      <Input label="Name *" value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Paving Block" />
      <div className="grid grid-cols-2 gap-2">
        <Input label="Category" value={form.category||""} onChange={e=>setForm({...form,category:e.target.value})} placeholder="e.g. Paver, Kerb, Tile" />
        <Input label="Shape" value={form.shape||""} onChange={e=>setForm({...form,shape:e.target.value})} placeholder="e.g. Rectangular" />
        <Input label="Color" value={form.color||""} onChange={e=>setForm({...form,color:e.target.value})} placeholder="e.g. Grey" />
        <Input label="Size (inch)" value={form.size||""} onChange={e=>setForm({...form,size:e.target.value})} placeholder="e.g. 8x4" />
        <Input label="Thickness (inch)" value={form.thickness||""} onChange={e=>setForm({...form,thickness:e.target.value})} placeholder="e.g. 2.5" />
        <Input label="1 Piece Sqft" type="number" step="any" value={form.sqftPerPiece||""} onChange={e=>setForm({...form,sqftPerPiece:+e.target.value})} placeholder="e.g. 0.22" />
        <Input label={`Default Rate (${CURRENCY})`} type="number" value={form.pricePerSqft||""} onChange={e=>setForm({...form,pricePerSqft:+e.target.value})} />
        <Input label={`Price/sqm (${CURRENCY})`} type="number" value={form.pricePerSqm||""} onChange={e=>setForm({...form,pricePerSqm:+e.target.value})} />
      </div>
      <Textarea label="Description" value={form.description||""} onChange={e=>setForm({...form,description:e.target.value})} />
    </>;
    if (t==="hollowbricks") return <>
      <Input label="Name *" value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Hollow Brick" />
      <div className="grid grid-cols-2 gap-2">
        <Input label="Category" value={form.category||"Hollow Brick"} onChange={e=>setForm({...form,category:e.target.value})} placeholder="Hollow Brick" />
        <Input label="Size (inch)" value={form.size||""} onChange={e=>setForm({...form,size:e.target.value})} placeholder="e.g. 4 inch / 6 inch / 8 inch" />
        <Input label={`Price / Piece (${CURRENCY})`} type="number" value={form.price||""} onChange={e=>setForm({...form,price:+e.target.value})} />
        <Input label="Stock Qty" type="number" value={form.stock||""} onChange={e=>setForm({...form,stock:+e.target.value})} />
      </div>
      <Textarea label="Description" value={form.description||""} onChange={e=>setForm({...form,description:e.target.value})} />
    </>;
    if (t==="materials") return <>
      <Input label="Material Name *" value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Cement" />
      <div className="grid grid-cols-2 gap-2">
        <Select label="Category" value={form.category||"Cement"} options={["Cement","Sand","Blocks","Kerb Stones","Chips","Transport","Other"]} onChange={e=>setForm({...form,category:e.target.value})} />
        <Select label="Unit" value={form.unit||"bag"} options={["bag","kg","ton","litre","m³","load","nos","sqft","sqm"]} onChange={e=>setForm({...form,unit:e.target.value})} />
        <Input label={`Price per unit (${CURRENCY})`} type="number" value={form.price||""} onChange={e=>setForm({...form,price:+e.target.value})} />
        <Input label="Stock Qty" type="number" value={form.stock||""} onChange={e=>setForm({...form,stock:+e.target.value})} />
      </div>
      <Textarea label="Notes" value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})} />
    </>;
    if (t==="labor") return <>
      <Input label="Labor Type *" value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Mason" />
      <div className="grid grid-cols-2 gap-2">
        <Select label="Rate Type" value={form.rateType||"day"} options={["day","sqft","sqm","hour","fixed"]} onChange={e=>setForm({...form,rateType:e.target.value})} />
        <Input label={`Rate (${CURRENCY})`} type="number" value={form.rate||""} onChange={e=>setForm({...form,rate:+e.target.value})} />
      </div>
      <Textarea label="Description" value={form.description||""} onChange={e=>setForm({...form,description:e.target.value})} />
    </>;
    if (t==="extrawork") return <>
      <Input label="Work Type *" value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Excavation" />
      <div className="grid grid-cols-2 gap-2">
        <Select label="Unit" value={form.unit||"sqft"} options={["sqft","sqm","m","load","fixed","day"]} onChange={e=>setForm({...form,unit:e.target.value})} />
        <Input label={`Rate (${CURRENCY})`} type="number" value={form.rate||""} onChange={e=>setForm({...form,rate:+e.target.value})} />
      </div>
      <Textarea label="Description" value={form.description||""} onChange={e=>setForm({...form,description:e.target.value})} />
    </>;
    if (t==="customers") return <>
      <Input label="Customer Name *" value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Full name" />
      <Input label="Mobile Number *" type="tel" value={form.mobile||""} onChange={e=>setForm({...form,mobile:e.target.value})} placeholder="10-digit mobile" />
      <Input label="Address" value={form.address||""} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Address" />
      <Input label="GST Number (optional)" value={form.gstNumber||""} onChange={e=>setForm({...form,gstNumber:e.target.value})} placeholder="GSTIN" />
      <Textarea label="Notes" value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})} />
    </>;
    if (t==="suppliers") return <>
      <Input label="Supplier Name *" value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Supplier name" />
      <Input label="Mobile Number" type="tel" value={form.mobile||form.phone||""} onChange={e=>setForm({...form,mobile:e.target.value})} placeholder="10-digit mobile" />
      <Input label="Address" value={form.address||form.location||""} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Address" />
      <Input label="Material Type" value={form.materialType||""} onChange={e=>setForm({...form,materialType:e.target.value})} placeholder="e.g. Cement, Sand" />
      <Input label="GST Number (optional)" value={form.gstNumber||""} onChange={e=>setForm({...form,gstNumber:e.target.value})} placeholder="GSTIN" />
      <Textarea label="Notes" value={form.notes||form.note||""} onChange={e=>setForm({...form,notes:e.target.value})} />
    </>;
  };

  if (loading) return <Loader />;

  const current = data[tab] || [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-gray-900">⚙️ Master Data</h2>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${tab===t.id?"bg-amber-500 text-white shadow":"bg-white border border-gray-200 text-gray-600"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm font-bold text-gray-700">{current.length} items</div>
        <button onClick={()=>openAdd(tab)} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ Add</button>
      </div>

      <div className="space-y-2">
        {current.length===0 && <EmptyState icon="📋" text={`No ${tabs.find(t=>t.id===tab)?.label} yet`} />}
        {current.map(item=>(
          <div key={item._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="font-black text-gray-900">{item.name}</div>
                {tab==="interlock" && <div className="text-xs text-gray-500 mt-0.5">{[item.shape,item.color,item.size&&`${item.size} inch`,item.thickness&&`${item.thickness} inch thick`].filter(Boolean).join(" / ")}</div>}
                {tab==="interlock" && <div className="text-xs text-amber-700 font-semibold mt-0.5">{item.sqftPerPiece&&`1 piece = ${fmt(item.sqftPerPiece)} sqft`} {item.pricePerSqft&&`· Rate: ${CURRENCY}${fmt(item.pricePerSqft)}`} {item.pricePerSqm&&`· ${CURRENCY}${fmt(item.pricePerSqm)}/sqm`}</div>}
                {tab==="materials" && <div className="text-xs text-gray-500 mt-0.5">{item.category} · {CURRENCY}{fmt(item.price)}/{item.unit} {item.stock>0&&`· Stock: ${item.stock}`}</div>}
                {tab==="hollowbricks" && <div className="text-xs text-gray-500 mt-0.5">{[item.category,item.size&&`${item.size} inch`].filter(Boolean).join(" / ")}</div>}
                {tab==="hollowbricks" && <div className="text-xs text-amber-700 font-semibold mt-0.5">Rate: {CURRENCY}{fmt(item.price||0)} / piece {item.stock>0&&` / Stock: ${fmt(item.stock)}`}</div>}
                {tab==="labor" && <div className="text-xs text-gray-500 mt-0.5">{CURRENCY}{fmt(item.rate)} per {item.rateType}</div>}
                {tab==="extrawork" && <div className="text-xs text-gray-500 mt-0.5">{CURRENCY}{fmt(item.rate)} per {item.unit}</div>}
                {tab==="customers" && <div className="text-xs text-gray-500 mt-0.5">📱 {item.mobile} · {item.address||"—"}</div>}
                {tab==="customers" && <div className="text-xs text-amber-700 mt-0.5">Paid: {CURRENCY}{fmt(item.totalPaid||0)} · Pending: {CURRENCY}{fmt(item.totalPending||0)}</div>}
                {tab==="suppliers" && <div className="text-xs text-gray-500 mt-0.5">📱 {item.mobile||item.phone||"—"} · {item.address||item.location||"—"}</div>}
                {tab==="suppliers" && <div className="text-xs text-teal-700 mt-0.5">{item.materialType||""} · Paid: {CURRENCY}{fmt(item.totalPaid||0)} · Pending: {CURRENCY}{fmt(item.totalPending||0)}</div>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={()=>openEdit(tab,item)} className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1.5 rounded-lg text-xs font-bold">✏️</button>
                <button onClick={()=>del(tab,item._id)} className="bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1.5 rounded-lg text-xs font-bold">🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={`${modal.item?"Edit":"Add"} ${tabs.find(t=>t.id===modal.type)?.label}`} onClose={()=>{setModal(null);setForm({});setSaveError("");}}>
          <div className="space-y-3">
            {renderForm()}
            {saveError && <div className="text-xs text-red-600 font-bold bg-red-50 border border-red-200 rounded-xl p-2">{saveError}</div>}
            <button onClick={save} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600">{modal.item?"Save Changes":"Add"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── SITE WORK (Enhanced) ─────────────────────────────────────────────────────
function SiteWork({ siteWorks, setSiteWorks, user }) {
  const [interlockTypes, setInterlockTypes] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [extraWorkTypes, setExtraWorkTypes] = useState([]);
  const [materialTypes, setMaterialTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(()=>{
    Promise.all([
      api("GET","/masterdata/interlock"),
      api("GET","/workers"),
      api("GET","/masterdata/extrawork"),
      api("GET","/masterdata/materials"),
    ]).then(([i,w,e,m])=>{
      setInterlockTypes(Array.isArray(i)?i:[]);
      setWorkers(Array.isArray(w)?w:[]);
      setExtraWorkTypes(Array.isArray(e)?e:[]);
      setMaterialTypes(Array.isArray(m)?m:[]);
      setLoading(false);
    });
  },[]);

  const calcTotal = (f) => {
    const base = +(f.workSize||0) * +(f.ratePerUnit||0);
    const ew = (f.extraWork||[]).reduce((a,e)=>a+(+(e.total)||0),0);
    const em = (f.extraMaterials||[]).reduce((a,e)=>a+(+(e.total)||0),0);
    const mat = +(f.materialCost||0);
    const lab = +(f.laborCost||0);
    return base + ew + em + mat + lab;
  };

  const emptyForm = {
    customerName:"", phone:"", siteLocation:"", interlockType:"", interlockColor:"",
    selectedWorkers:[], startDate:today(), endDate:"", status:"running",
    workUnit:"sqft", workSize:"", ratePerUnit:"", baseWorkCost:"",
    extraWork:[], extraMaterials:[],
    materialCost:"", laborCost:"", totalCost:"",
    payments:[], totalReceived:0, pendingAmount:"", paymentStatus:"pending", paymentMode:"Cash", note:"",
  };

  const save = async (f) => {
    if (!f.customerName) return;
    const item = await api("POST", "/sitework", {...f, advancePaid:undefined, addedBy:user.name});
    if (item._id) { setSiteWorks(p=>[item,...p]); setShowAdd(false); }
  };

  const saveEdit = async (f) => {
    const item = await api("PUT", `/sitework/${f._id}`, {...f, advancePaid:undefined});
    setSiteWorks(p=>p.map(x=>x._id===f._id?item:x));
    setEditItem(null);
  };

  const del = async (id) => {
    if (!window.confirm("Delete this site?")) return;
    await api("DELETE", `/sitework/${id}`);
    setSiteWorks(p=>p.filter(x=>x._id!==id));
  };

  const filtered = siteWorks.filter(s=>{
    const matchFilter = filter==="all" || s.status===filter;
    const matchSearch = !search || (s.customerName||"").toLowerCase().includes(search.toLowerCase()) || (s.siteLocation||"").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const statusColor = {running:"amber",completed:"green",pending:"gray",cancelled:"red"};

  const generateInvoice = (s) => {
    const ewTotal = (s.extraWork||[]).reduce((a,e)=>a+(+(e.total)||0),0);
    const emTotal = (s.extraMaterials||[]).reduce((a,e)=>a+(+(e.total)||0),0);
    const lines = [
      "════════════════════════════════",
      "         PK INTERLOCK          ",
      "          INVOICE / BILL        ",
      "════════════════════════════════",
      `Date     : ${today()}`,
      `Customer : ${s.customerName||"—"}`,
      `Phone    : ${s.phone||"—"}`,
      `Location : ${s.siteLocation||"—"}`,
      "────────────────────────────────",
      `Type     : ${s.interlockType||"—"} ${s.interlockColor||""}`,
      `Size     : ${s.workSize} ${s.workUnit}`,
      `Rate     : ${CURRENCY}${s.ratePerUnit}/${s.workUnit}`,
      `Base Cost: ${CURRENCY}${fmt(+(s.workSize||0)*(+(s.ratePerUnit||0)))}`,
      "────────────────────────────────",
      ...(s.extraWork||[]).length>0?["EXTRA WORK:",...(s.extraWork||[]).map(e=>`  ${e.name}: ${e.qty||1} x ${CURRENCY}${e.rate} = ${CURRENCY}${fmt(e.total)}`),`  Subtotal: ${CURRENCY}${fmt(ewTotal)}`,"────────────────────────────────"]:[],
      ...(s.extraMaterials||[]).length>0?["EXTRA MATERIALS:",...(s.extraMaterials||[]).map(e=>`  ${e.name}: ${e.qty} ${e.unit} x ${CURRENCY}${e.rate} = ${CURRENCY}${fmt(e.total)}`),`  Subtotal: ${CURRENCY}${fmt(emTotal)}`,"────────────────────────────────"]:[],
      +(s.materialCost||0)>0?`Material : ${CURRENCY}${fmt(s.materialCost)}`:"",
      +(s.laborCost||0)>0?`Labour   : ${CURRENCY}${fmt(s.laborCost)}`:"",
      `TOTAL    : ${CURRENCY}${fmt(+(s.totalCost||s.totalAmount||0))}`,
      `Received : ${CURRENCY}${fmt(s.totalReceived||s.paidAmount||0)}`,
      `PENDING  : ${CURRENCY}${fmt(s.pendingAmount||0)}`,
      "────────────────────────────────",
      `Payment  : ${s.paymentMode||"—"} | ${s.paymentStatus||"—"}`,
      `Start    : ${s.startDate||"—"} | End: ${s.endDate||"—"}`,
      s.note?`Note     : ${s.note}`:"",
      "════════════════════════════════",
      "Thank you for choosing PK Interlock",
    ].filter(l=>l!=="");
    const blob = new Blob([lines.join("\n")],{type:"text/plain"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url; a.download=`Invoice_${s.customerName}_${today()}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">🏗️ Site Work</h2>
        {(isAdminLike(user.role)||user.role==="supervisor")&&(
          <button onClick={()=>setShowAdd(true)} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ New Site</button>
        )}
      </div>

      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search customer / location..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" />

      <div className="flex gap-1 overflow-x-auto pb-1">
        {["all","running","pending","completed","cancelled"].map(s=>(
          <button key={s} onClick={()=>setFilter(s)} className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${filter===s?"bg-amber-500 text-white":"bg-white border border-gray-200 text-gray-600"}`}>
            {s.charAt(0).toUpperCase()+s.slice(1)} ({s==="all"?siteWorks.length:siteWorks.filter(x=>x.status===s).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-center"><div className="font-black text-amber-700">{siteWorks.filter(s=>s.status==="running").length}</div><div className="text-xs text-gray-400">Running</div></div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-2 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt(siteWorks.reduce((a,s)=>a+(+(s.totalCost||s.totalAmount)||0),0))}</div><div className="text-xs text-gray-400">Total</div></div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-2 text-center"><div className="font-black text-red-600">{CURRENCY}{fmt(siteWorks.reduce((a,s)=>a+(+(s.pendingAmount)||0),0))}</div><div className="text-xs text-gray-400">Pending</div></div>
      </div>

      <div className="space-y-3">
        {filtered.length===0&&<EmptyState icon="🏗️" text="No sites found" />}
        {filtered.map(s=>(
          <div key={s._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 cursor-pointer" onClick={()=>setViewItem(s)}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-gray-900">{s.customerName}</span>
                  <Badge color={statusColor[s.status]||"gray"}>{s.status||"pending"}</Badge>
                  <Badge color={s.paymentStatus==="paid"?"green":s.paymentStatus==="partial"?"amber":"red"}>{s.paymentStatus||"pending"}</Badge>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">📍 {s.siteLocation||"—"} · 📅 {s.startDate}</div>
                <div className="text-xs text-gray-400">🧱 {s.interlockType||"—"} · {s.workSize} {s.workUnit}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-black text-green-700">{CURRENCY}{fmt(+(s.totalCost||s.totalAmount)||0)}</div>
                {+(s.pendingAmount||0)>0&&<div className="text-xs text-red-500 font-semibold">Pending: {CURRENCY}{fmt(s.pendingAmount)}</div>}
              </div>
            </div>
            {(s.selectedWorkers||[]).length>0&&(
              <div className="mt-1 flex gap-1 flex-wrap">
                {(s.selectedWorkers||[]).map(w=><Badge key={w} color="teal">👷 {w}</Badge>)}
              </div>
            )}
            <div className="mt-2 flex gap-1">
              <button onClick={()=>setViewItem(s)} className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-1.5 rounded-xl text-xs font-bold">👁️ View</button>
              {(isAdminLike(user.role)||user.role==="supervisor")&&<button onClick={()=>setEditItem({...s})} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-1.5 rounded-xl text-xs font-bold">✏️ Edit</button>}
              <button onClick={()=>generateInvoice(s)} className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 py-1.5 rounded-xl text-xs font-bold">🧾 Invoice</button>
              {isAdminLike(user.role)&&<button onClick={()=>del(s._id)} className="bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1.5 rounded-xl text-xs font-bold">🗑️</button>}
            </div>
          </div>
        ))}
      </div>

      {showAdd&&<SiteWorkForm title="New Site" initData={emptyForm} onSave={save} onClose={()=>setShowAdd(false)} interlockTypes={interlockTypes} workers={workers} extraWorkTypes={extraWorkTypes} materialTypes={materialTypes} calcTotal={calcTotal} />}
      {editItem&&<SiteWorkForm title="Edit Site" initData={editItem} onSave={saveEdit} onClose={()=>setEditItem(null)} interlockTypes={interlockTypes} workers={workers} extraWorkTypes={extraWorkTypes} materialTypes={materialTypes} calcTotal={calcTotal} />}

      {viewItem&&(
        <Modal title="Site Details" onClose={()=>setViewItem(null)} wide>
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <Badge color={statusColor[viewItem.status]||"gray"}>{viewItem.status}</Badge>
              <Badge color={viewItem.paymentStatus==="paid"?"green":viewItem.paymentStatus==="partial"?"amber":"red"}>{viewItem.paymentStatus||"pending"}</Badge>
              <button onClick={()=>generateInvoice(viewItem)} className="ml-auto bg-amber-50 text-amber-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-amber-100">🧾 Download Invoice</button>
            </div>
            <SectionBox title="Customer" icon="👤" color="blue">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><div className="text-xs text-gray-400">Name</div><div className="font-bold">{viewItem.customerName||"—"}</div></div>
                <div><div className="text-xs text-gray-400">Phone</div><div className="font-bold">{viewItem.phone||"—"}</div></div>
                <div className="col-span-2"><div className="text-xs text-gray-400">Location</div><div className="font-bold">{viewItem.siteLocation||"—"}</div></div>
              </div>
            </SectionBox>
            <SectionBox title="Work" icon="🧱" color="amber">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><div className="text-xs text-gray-400">Type</div><div className="font-bold">{viewItem.interlockType||"—"}</div></div>
                <div><div className="text-xs text-gray-400">Color</div><div className="font-bold">{viewItem.interlockColor||"—"}</div></div>
                <div><div className="text-xs text-gray-400">Size</div><div className="font-bold">{viewItem.workSize} {viewItem.workUnit}</div></div>
                <div><div className="text-xs text-gray-400">Rate</div><div className="font-bold">{CURRENCY}{viewItem.ratePerUnit}/{viewItem.workUnit}</div></div>
                <div><div className="text-xs text-gray-400">Start</div><div className="font-bold">{viewItem.startDate||"—"}</div></div>
                <div><div className="text-xs text-gray-400">End</div><div className="font-bold">{viewItem.endDate||"—"}</div></div>
              </div>
            </SectionBox>
            {(viewItem.selectedWorkers||[]).length>0&&(
              <SectionBox title="Workers" icon="👷" color="teal">
                <div className="flex flex-wrap gap-1">{(viewItem.selectedWorkers||[]).map(w=><Badge key={w} color="teal">👷 {w}</Badge>)}</div>
              </SectionBox>
            )}
            <SectionBox title="Costing Breakdown" icon="💰" color="green">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Base Cost ({viewItem.workSize} {viewItem.workUnit} x {CURRENCY}{viewItem.ratePerUnit})</span><span className="font-bold">{CURRENCY}{fmt(+(viewItem.workSize||0)*(+(viewItem.ratePerUnit||0)))}</span></div>
                {(viewItem.extraWork||[]).length>0&&<>
                  <div className="text-xs font-bold text-orange-600 mt-1">Extra Work:</div>
                  {(viewItem.extraWork||[]).map((e,i)=><div key={i} className="flex justify-between pl-2 text-xs"><span>{e.name} ({e.qty||1} x {CURRENCY}{e.rate})</span><span className="font-bold text-orange-700">{CURRENCY}{fmt(e.total)}</span></div>)}
                </>}
                {(viewItem.extraMaterials||[]).length>0&&<>
                  <div className="text-xs font-bold text-purple-600 mt-1">Extra Materials:</div>
                  {(viewItem.extraMaterials||[]).map((e,i)=><div key={i} className="flex justify-between pl-2 text-xs"><span>{e.name} ({e.qty} {e.unit} x {CURRENCY}{e.rate})</span><span className="font-bold text-purple-700">{CURRENCY}{fmt(e.total)}</span></div>)}
                </>}
                {+(viewItem.materialCost||0)>0&&<div className="flex justify-between"><span>Material Cost</span><span className="font-bold">{CURRENCY}{fmt(viewItem.materialCost)}</span></div>}
                {+(viewItem.laborCost||0)>0&&<div className="flex justify-between"><span>Labour Cost</span><span className="font-bold">{CURRENCY}{fmt(viewItem.laborCost)}</span></div>}
                <div className="flex justify-between border-t pt-1 mt-1"><span className="font-black">TOTAL</span><span className="font-black text-green-700 text-lg">{CURRENCY}{fmt(+(viewItem.totalCost||viewItem.totalAmount||0))}</span></div>
                <div className="flex justify-between"><span>Total Amount Received</span><span className="font-bold text-green-600">{CURRENCY}{fmt(viewItem.totalReceived||viewItem.paidAmount||0)}</span></div>
                <div className="flex justify-between"><span className="font-black text-red-600">Pending</span><span className="font-black text-red-600">{CURRENCY}{fmt(viewItem.pendingAmount||0)}</span></div>
              </div>
            </SectionBox>
            {(viewItem.payments||[]).length>0&&(
              <SectionBox title="Payment History" icon="💳" color="blue">
                <table className="w-full text-xs">
                  <thead><tr className="text-gray-400"><th className="text-left p-1">Date</th><th className="text-left p-1">Source</th><th className="text-left p-1">Mode</th><th className="text-right p-1">Amount</th></tr></thead>
                  <tbody>{(viewItem.payments||[]).map((p,i)=><tr key={i} className="border-t"><td className="p-1">{p.date||"—"}</td><td className="p-1">Site Work</td><td className="p-1">{p.mode||viewItem.paymentMode||"—"}</td><td className="p-1 text-right font-bold text-green-700">{CURRENCY}{fmt(p.amount)}</td></tr>)}</tbody>
                </table>
              </SectionBox>
            )}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-50 rounded-xl p-2"><div className="text-xs text-gray-400">Payment Mode</div><div className="font-bold">{viewItem.paymentMode||"—"}</div></div>
              <div className="bg-gray-50 rounded-xl p-2"><div className="text-xs text-gray-400">Added By</div><div className="font-bold">{viewItem.addedBy||"—"}</div></div>
            </div>
            {viewItem.note&&<SectionBox title="Note" icon="📝" color="gray"><div className="text-sm">{viewItem.note}</div></SectionBox>}
          </div>
        </Modal>
      )}
    </div>
  );
}

function SiteWorkForm({ title, initData, onSave, onClose, interlockTypes, workers, extraWorkTypes, materialTypes, calcTotal }) {
  const [f, setF] = useState({...initData});
  const [ewForm, setEwForm] = useState({name:"",qty:"1",rate:""});
  const [emForm, setEmForm] = useState({name:"",qty:"",unit:"nos",rate:""});
  const [payEntry, setPayEntry] = useState({date:today(), amount:"", mode:"Cash", remarks:""});
  const [saving, setSaving] = useState(false);
  const receivedTotal = (items = f.payments || []) => items.reduce((a,p)=>a+(+(p.amount)||0),0);
  const paymentStatusFor = (total, received) => Math.max(0,total-received)===0&&total>0 ? "paid" : received>0 ? "partial" : "pending";

  const updateCalc = (updates) => {
    const nf = {...f,...updates};
    const total = calcTotal(nf);
    const received = receivedTotal(nf.payments || []);
    const pending = Math.max(0, total-received);
    setF({...nf, baseWorkCost:String(+(nf.workSize||0)*(+(nf.ratePerUnit||0))), totalCost:String(total), totalReceived:received, pendingAmount:String(pending), paymentStatus:paymentStatusFor(total, received)});
  };

  const addEW = () => {
    if (!ewForm.name||!ewForm.rate) return;
    const total = +(ewForm.qty||1)*(+(ewForm.rate)||0);
    const updated = [...(f.extraWork||[]), {...ewForm,total}];
    const totalCost = calcTotal({...f,extraWork:updated});
    const received = receivedTotal();
    const pending = Math.max(0, totalCost-received);
    setF(p=>({...p, extraWork:updated, totalCost:String(totalCost), totalReceived:received, pendingAmount:String(pending), paymentStatus:paymentStatusFor(totalCost, received)}));
    setEwForm({name:"",qty:"1",rate:""});
  };

  const removeEW = (i) => {
    const updated = f.extraWork.filter((_,j)=>j!==i);
    const totalCost = calcTotal({...f,extraWork:updated});
    const received = receivedTotal();
    const pending = Math.max(0, totalCost-received);
    setF(p=>({...p, extraWork:updated, totalCost:String(totalCost), totalReceived:received, pendingAmount:String(pending), paymentStatus:paymentStatusFor(totalCost, received)}));
  };

  const addEM = () => {
    if (!emForm.name||!emForm.qty) return;
    const total = +(emForm.qty||0)*(+(emForm.rate)||0);
    const updated = [...(f.extraMaterials||[]), {...emForm,total}];
    const totalCost = calcTotal({...f,extraMaterials:updated});
    const received = receivedTotal();
    const pending = Math.max(0, totalCost-received);
    setF(p=>({...p, extraMaterials:updated, totalCost:String(totalCost), totalReceived:received, pendingAmount:String(pending), paymentStatus:paymentStatusFor(totalCost, received)}));
    setEmForm({name:"",qty:"",unit:"nos",rate:""});
  };

  const removeEM = (i) => {
    const updated = f.extraMaterials.filter((_,j)=>j!==i);
    const totalCost = calcTotal({...f,extraMaterials:updated});
    const received = receivedTotal();
    const pending = Math.max(0, totalCost-received);
    setF(p=>({...p, extraMaterials:updated, totalCost:String(totalCost), totalReceived:received, pendingAmount:String(pending), paymentStatus:paymentStatusFor(totalCost, received)}));
  };

  const addPayment = () => {
    if (!+(payEntry.amount || 0)) return;
    const payments = [...(f.payments||[]), {...payEntry, amount:+payEntry.amount, source:"Site Work"}];
    const total = calcTotal(f);
    const received = receivedTotal(payments);
    setF({...f, payments, totalReceived:received, pendingAmount:String(Math.max(0,total-received)), paymentStatus:paymentStatusFor(total, received)});
    setPayEntry({date:today(), amount:"", mode:"Cash", remarks:""});
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(f);
    setSaving(false);
  };

  return (
    <Modal title={title} onClose={onClose} wide>
      <div className="space-y-3">

        <SectionBox title="Customer Details" icon="👤" color="blue">
          <div className="grid grid-cols-2 gap-2">
            <Input label="Customer Name *" value={f.customerName||""} onChange={e=>setF({...f,customerName:e.target.value})} placeholder="Full name" />
            <Input label="Phone" type="tel" value={f.phone||""} onChange={e=>setF({...f,phone:e.target.value})} placeholder="Number" />
          </div>
          <Input label="Site Location" value={f.siteLocation||""} onChange={e=>setF({...f,siteLocation:e.target.value})} placeholder="Address / area" />
        </SectionBox>

        <SectionBox title="Work Details" icon="🧱" color="amber">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Interlock Type</label>
            <input list="il-list" value={f.interlockType||""} onChange={e=>{
              const it=interlockTypes.find(x=>x.name===e.target.value);
              const rate=f.workUnit==="sqm"?(it?.pricePerSqm||""):(it?.pricePerSqft||"");
              updateCalc({interlockType:e.target.value, ratePerUnit:rate?String(rate):f.ratePerUnit});
            }} placeholder="Select or type interlock type..." className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50" />
            <datalist id="il-list">{interlockTypes.map(i=><option key={i._id} value={i.name}/>)}</datalist>
          </div>
          <Input label="Color / Specification" value={f.interlockColor||""} onChange={e=>setF({...f,interlockColor:e.target.value})} placeholder="e.g. Grey, Natural" />
          <div className="grid grid-cols-3 gap-2">
            <Select label="Unit" value={f.workUnit||"sqft"} options={["sqft","sqm"]} onChange={e=>updateCalc({workUnit:e.target.value})} />
            <Input label="Work Size" type="number" value={f.workSize||""} onChange={e=>updateCalc({workSize:e.target.value})} placeholder="0" />
            <Input label={`Rate(${CURRENCY})`} type="number" value={f.ratePerUnit||""} onChange={e=>updateCalc({ratePerUnit:e.target.value})} placeholder="0" />
          </div>
          <div className="bg-white rounded-xl p-2 text-center border border-amber-200">
            <div className="text-xs text-gray-400">Base Cost</div>
            <div className="font-black text-amber-700 text-lg">{CURRENCY}{fmt(+(f.workSize||0)*(+(f.ratePerUnit||0)))}</div>
          </div>
        </SectionBox>

        <SectionBox title="Select Workers" icon="👷" color="teal">
          <div className="flex flex-wrap gap-1">
            {workers.filter(w=>workerTypeOf(w)==="Site Worker"&&isActiveWorker(w)).map(w=>(
              <button key={w._id} type="button" onClick={()=>{
                const sel=f.selectedWorkers||[];
                setF({...f,selectedWorkers:sel.includes(w.name)?sel.filter(x=>x!==w.name):[...sel,w.name]});
              }} className={`px-2 py-1 rounded-lg text-xs font-bold border transition-colors ${(f.selectedWorkers||[]).includes(w.name)?"bg-teal-500 text-white border-teal-500":"bg-white text-gray-600 border-gray-200"}`}>
                {w.name}
              </button>
            ))}
            {workers.filter(w=>workerTypeOf(w)==="Site Worker"&&isActiveWorker(w)).length===0&&<div className="text-xs text-gray-400">No active site workers — add from Workers menu first</div>}
          </div>
        </SectionBox>

        <SectionBox title="Extra Work" icon="➕" color="orange">
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Work Type (select or type)</label>
              <input list="ew-list" value={ewForm.name} onChange={e=>{
                const et=extraWorkTypes.find(x=>x.name===e.target.value);
                setEwForm({...ewForm,name:e.target.value,rate:et?String(et.rate):ewForm.rate});
              }} placeholder="e.g. Excavation, Leveling, Cutting..." className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
              <datalist id="ew-list">{extraWorkTypes.map(e=><option key={e._id} value={e.name}/>)}</datalist>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input label="Qty" type="number" value={ewForm.qty} onChange={e=>setEwForm({...ewForm,qty:e.target.value})} placeholder="1" />
              <Input label={`Rate (${CURRENCY})`} type="number" value={ewForm.rate} onChange={e=>setEwForm({...ewForm,rate:e.target.value})} placeholder="0" />
            </div>
            {ewForm.name&&ewForm.rate&&(
              <div className="flex justify-between bg-orange-50 rounded-xl px-3 py-2 text-xs">
                <span className="text-gray-500">Preview cost:</span>
                <span className="font-black text-orange-700">{CURRENCY}{fmt(+(ewForm.qty||1)*(+(ewForm.rate)||0))}</span>
              </div>
            )}
            <button type="button" onClick={addEW} className="w-full bg-orange-500 text-white py-2 rounded-xl text-xs font-bold hover:bg-orange-600">+ Add Extra Work to Total</button>
          </div>
          {(f.extraWork||[]).length>0&&(
            <div className="mt-2 space-y-1">
              {(f.extraWork||[]).map((e,i)=>(
                <div key={i} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-orange-200 text-xs">
                  <span className="font-bold flex-1">{e.name}</span>
                  <span className="mx-2 text-gray-500">{e.qty||1} x {CURRENCY}{e.rate}</span>
                  <span className="font-black text-orange-700">{CURRENCY}{fmt(e.total)}</span>
                  <button type="button" onClick={()=>removeEW(i)} className="text-red-400 hover:text-red-600 font-black ml-2 text-base leading-none">×</button>
                </div>
              ))}
              <div className="text-xs font-black text-orange-700 text-right pr-1">
                Extra Work Total: {CURRENCY}{fmt((f.extraWork||[]).reduce((a,e)=>a+(+(e.total)||0),0))}
              </div>
            </div>
          )}
        </SectionBox>

        <SectionBox title="Extra Materials" icon="🧱" color="purple">
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Material (select or type)</label>
              <input list="em-list" value={emForm.name} onChange={e=>{
                const mt=materialTypes.find(x=>x.name===e.target.value);
                setEmForm({...emForm,name:e.target.value,unit:mt?mt.unit:emForm.unit,rate:mt?String(mt.price):emForm.rate});
              }} placeholder="e.g. Cement, Sand, Chips..." className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50" />
              <datalist id="em-list">{materialTypes.map(m=><option key={m._id} value={m.name}/>)}</datalist>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input label="Qty" type="number" value={emForm.qty} onChange={e=>setEmForm({...emForm,qty:e.target.value})} placeholder="0" />
              <Select label="Unit" value={emForm.unit||"nos"} options={["nos","bag","kg","ton","litre","sqft","sqm","load"]} onChange={e=>setEmForm({...emForm,unit:e.target.value})} />
              <Input label={`Rate (${CURRENCY})`} type="number" value={emForm.rate} onChange={e=>setEmForm({...emForm,rate:e.target.value})} placeholder="0" />
            </div>
            {emForm.name&&emForm.qty&&(
              <div className="flex justify-between bg-purple-50 rounded-xl px-3 py-2 text-xs">
                <span className="text-gray-500">Preview cost:</span>
                <span className="font-black text-purple-700">{CURRENCY}{fmt(+(emForm.qty||0)*(+(emForm.rate)||0))}</span>
              </div>
            )}
            <button type="button" onClick={addEM} className="w-full bg-purple-500 text-white py-2 rounded-xl text-xs font-bold hover:bg-purple-600">+ Add Material to Total</button>
          </div>
          {(f.extraMaterials||[]).length>0&&(
            <div className="mt-2 space-y-1">
              {(f.extraMaterials||[]).map((e,i)=>(
                <div key={i} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-purple-200 text-xs">
                  <span className="font-bold flex-1">{e.name}</span>
                  <span className="mx-2 text-gray-500">{e.qty} {e.unit} x {CURRENCY}{e.rate}</span>
                  <span className="font-black text-purple-700">{CURRENCY}{fmt(e.total)}</span>
                  <button type="button" onClick={()=>removeEM(i)} className="text-red-400 hover:text-red-600 font-black ml-2 text-base leading-none">×</button>
                </div>
              ))}
              <div className="text-xs font-black text-purple-700 text-right pr-1">
                Materials Total: {CURRENCY}{fmt((f.extraMaterials||[]).reduce((a,e)=>a+(+(e.total)||0),0))}
              </div>
            </div>
          )}
        </SectionBox>

        <SectionBox title="Costing Summary" icon="💰" color="green">
          <div className="grid grid-cols-2 gap-2">
            <Input label="Other Material Cost" type="number" value={f.materialCost||""} onChange={e=>updateCalc({materialCost:e.target.value})} placeholder="0" />
            <Input label="Labour Cost" type="number" value={f.laborCost||""} onChange={e=>updateCalc({laborCost:e.target.value})} placeholder="0" />
          </div>
          <div className="bg-white rounded-xl border border-green-200 p-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-500"><span>Base Cost</span><span>{CURRENCY}{fmt(+(f.workSize||0)*(+(f.ratePerUnit||0)))}</span></div>
            {(f.extraWork||[]).length>0&&<div className="flex justify-between text-orange-600"><span>Extra Work</span><span>{CURRENCY}{fmt((f.extraWork||[]).reduce((a,e)=>a+(+(e.total)||0),0))}</span></div>}
            {(f.extraMaterials||[]).length>0&&<div className="flex justify-between text-purple-600"><span>Extra Materials</span><span>{CURRENCY}{fmt((f.extraMaterials||[]).reduce((a,e)=>a+(+(e.total)||0),0))}</span></div>}
            {+(f.materialCost||0)>0&&<div className="flex justify-between text-gray-500"><span>Material Cost</span><span>{CURRENCY}{fmt(f.materialCost)}</span></div>}
            {+(f.laborCost||0)>0&&<div className="flex justify-between text-gray-500"><span>Labour Cost</span><span>{CURRENCY}{fmt(f.laborCost)}</span></div>}
            <div className="flex justify-between border-t pt-1 font-black text-green-700 text-base"><span>TOTAL</span><span>{CURRENCY}{fmt(+(f.totalCost||0))}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-green-50 rounded-xl p-2 border border-green-200 text-center">
              <div className="text-xs text-gray-400">Total Amount Received</div>
              <div className="font-black text-green-700">{CURRENCY}{fmt(+(f.totalReceived||receivedTotal())||0)}</div>
            </div>
            <div className="bg-red-50 rounded-xl p-2 border border-red-200 text-center">
              <div className="text-xs text-gray-400">Pending</div>
              <div className="font-black text-red-600">{CURRENCY}{fmt(+(f.pendingAmount||0))}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-green-200 p-3 space-y-2">
            <div className="text-xs font-black text-green-700">Site Payment Received</div>
            <div className="grid grid-cols-2 gap-2">
              <Input label="Date" type="date" value={payEntry.date} onChange={e=>setPayEntry({...payEntry,date:e.target.value})} />
              <Input label={`Amount (${CURRENCY})`} type="number" value={payEntry.amount} onChange={e=>setPayEntry({...payEntry,amount:e.target.value})} />
              <Select label="Payment Mode" value={payEntry.mode} options={["Cash","UPI","Bank Transfer","Cheque"]} onChange={e=>setPayEntry({...payEntry,mode:e.target.value})} />
              <Input label="Remarks" value={payEntry.remarks} onChange={e=>setPayEntry({...payEntry,remarks:e.target.value})} />
            </div>
            <button type="button" onClick={addPayment} className="w-full bg-green-500 text-white py-2 rounded-xl text-xs font-bold">+ Add Site Payment</button>
            {(f.payments||[]).map((p,i)=><div key={i} className="flex justify-between text-xs border-t pt-1"><span>{p.date} · {p.mode}</span><span className="font-bold text-green-700">{CURRENCY}{fmt(p.amount)}</span></div>)}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select label="Payment Mode" value={f.paymentMode||"Cash"} options={["Cash","Bank","GPay","UPI","Credit"]} onChange={e=>setF({...f,paymentMode:e.target.value})} />
            <Select label="Payment Status" value={f.paymentStatus||"pending"} options={["pending","partial","paid"]} onChange={e=>setF({...f,paymentStatus:e.target.value})} />
          </div>
        </SectionBox>

        <SectionBox title="Timeline & Status" icon="📅" color="gray">
          <div className="grid grid-cols-2 gap-2">
            <Input label="Start Date" type="date" value={f.startDate||""} onChange={e=>setF({...f,startDate:e.target.value})} />
            <Input label="End Date" type="date" value={f.endDate||""} onChange={e=>setF({...f,endDate:e.target.value})} />
          </div>
          <Select label="Status" value={f.status||"running"} options={["pending","running","completed","cancelled"]} onChange={e=>setF({...f,status:e.target.value})} />
          <Textarea label="Note" value={f.note||""} onChange={e=>setF({...f,note:e.target.value})} placeholder="Any additional notes..." />
        </SectionBox>

        <button type="button" onClick={handleSave} disabled={saving} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 text-base disabled:opacity-60">
          {saving?"Saving...":title==="New Site"?"Create Site":"Save Changes"}
        </button>
      </div>
    </Modal>
  );
}


// ─── SITE REPORT (WorkerReport) ───────────────────────────────────────────────
function WorkerReport({ user }) {
  const [reports, setReports] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const MATERIAL_TYPES = ["Interlock Paving","Kerbstone","Hollow Block","Solid Block","Coping Stone","Retaining Wall Block","Grass Block","Other"];
  const emptyForm = { startingDate:today(), siteName:"", phoneNo:"", workerName:"", totalArea:"", workingCost:"", extraWorkItems:[], extraMaterialItems:[], totalWorkingArea:"", totalAmount:"", note:"", paymentMode:"Cash", upiId:"", bankName:"", bankBranch:"", bankAccount:"", amountReceivedBy:"", materialSupply:"", materialType:"", signatures:{supervisor:false,office:false,admin:false} };
  const [form, setForm] = useState(emptyForm);

  useEffect(()=>{
    Promise.all([api("GET","/workerreport"),api("GET","/workers")]).then(([d,w])=>{
      setReports(Array.isArray(d)?d:[]);
      setWorkers(Array.isArray(w)?w:[]);
      setLoading(false);
    });
  },[]);

  const save = async () => {
    if (!form.workerName) return;
    const item = await api("POST","/workerreport",{...form,addedBy:user.name});
    if (item._id) { setReports(p=>[item,...p]); setModal(false); setForm(emptyForm); }
  };

  const saveEdit = async () => {
    await api("PUT",`/workerreport/${editModal._id}`,editModal);
    setReports(p=>p.map(r=>r._id===editModal._id?{...r,...editModal}:r));
    if (viewModal?._id===editModal._id) setViewModal({...viewModal,...editModal});
    setEditModal(null);
  };

  const signReport = async (id, role) => {
    const report = reports.find(r=>r._id===id);
    const updatedSigs = {...(report.signatures||{}),[role]:true};
    await api("PUT",`/workerreport/${id}`,{signatures:updatedSigs});
    setReports(p=>p.map(r=>r._id===id?{...r,signatures:updatedSigs}:r));
    if (viewModal?._id===id) setViewModal(v=>({...v,signatures:updatedSigs}));
  };

  const downloadReport = (r) => {
    const payInfo = r.paymentMode==="GPay"||r.paymentMode==="UPI"?`UPI ID: ${r.upiId||"—"}`:r.paymentMode==="Bank"?`Bank: ${r.bankName||"—"} / Branch: ${r.bankBranch||"—"} / Acc: ${r.bankAccount||"—"}`:"";
    const lines = ["PK INTERLOCK — SITE REPORT","════════════════════════",`Site: ${r.siteName||"—"}`,`Phone: ${r.phoneNo||"—"}`,`Date: ${r.startingDate}`,`Worker: ${r.workerName}`,"────────────────────────",`Total Area: ${r.totalArea} sqft`,`Working Cost: ${CURRENCY}${r.workingCost||0}`,`Extra Work: ${r.extraWork||"—"}`,`Extra Material: ${r.extraMaterial||"—"}`,`Total Working Area: ${r.totalWorkingArea} sqft`,`Total Amount: ${CURRENCY}${r.totalAmount||0}`,"────────────────────────",`Note: ${r.note||"—"}`,"────────────────────────","PAYMENTS",`Mode: ${r.paymentMode}`,payInfo,`Received By: ${r.amountReceivedBy||"—"}`,"────────────────────────",`Material Type: ${r.materialType||"—"}`,`Material Supply: ${r.materialSupply||"—"}`,"────────────────────────","SIGNATURES",`Supervisor: ${r.signatures?.supervisor?"✓ Signed":"Pending"}`,`Office: ${r.signatures?.office?"✓ Signed":"Pending"}`,`Admin: ${r.signatures?.admin?"✓ Signed":"Pending"}`,"════════════════════════"].filter(l=>l!=="");
    const blob = new Blob([lines.join("\n")],{type:"text/plain"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`SiteReport_${r.workerName}_${r.startingDate}.txt`; a.click(); URL.revokeObjectURL(url);
  };

  const PaymentFields = ({f,setF})=><>
    <Select label="Payment Mode" value={f.paymentMode} options={["Cash","Bank","GPay","UPI"]} onChange={e=>setF({...f,paymentMode:e.target.value,upiId:"",bankName:"",bankBranch:"",bankAccount:""})} />
    {(f.paymentMode==="GPay"||f.paymentMode==="UPI")&&<Input label="UPI ID" value={f.upiId||""} onChange={e=>setF({...f,upiId:e.target.value})} placeholder="example@upi" />}
    {f.paymentMode==="Bank"&&<><Input label="Bank Name" value={f.bankName||""} onChange={e=>setF({...f,bankName:e.target.value})} /><Input label="Branch" value={f.bankBranch||""} onChange={e=>setF({...f,bankBranch:e.target.value})} /><Input label="Account Number" value={f.bankAccount||""} onChange={e=>setF({...f,bankAccount:e.target.value})} /></>}
    <Input label="Amount Received By" value={f.amountReceivedBy||""} onChange={e=>setF({...f,amountReceivedBy:e.target.value})} placeholder="Name" />
  </>;

  const calcWRTotal = (f) => {
    const base = +(f.totalArea||0) * +(f.workingCost||0);
    const ew = (f.extraWorkItems||[]).reduce((a,e)=>a+(+(e.total)||0),0);
    const em = (f.extraMaterialItems||[]).reduce((a,e)=>a+(+(e.total)||0),0);
    return base + ew + em;
  };

  const [ewItem, setEwItem] = useState({name:"",cost:""});
  const [emItem, setEmItem] = useState({name:"",qty:"",unit:"nos",rate:""});

  const addEWItem = (f, setF) => {
    if (!ewItem.name||!ewItem.cost) return;
    const updated = [...(f.extraWorkItems||[]), {name:ewItem.name, cost:+ewItem.cost}];
    const total = calcWRTotal({...f, extraWorkItems:updated});
    setF({...f, extraWorkItems:updated, totalAmount:String(total)});
    setEwItem({name:"",cost:""});
  };

  const addEMItem = (f, setF) => {
    if (!emItem.name||!emItem.qty) return;
    const itemTotal = +(emItem.qty||0)*(+(emItem.rate)||0);
    const updated = [...(f.extraMaterialItems||[]), {...emItem, total:itemTotal}];
    const total = calcWRTotal({...f, extraMaterialItems:updated});
    setF({...f, extraMaterialItems:updated, totalAmount:String(total)});
    setEmItem({name:"",qty:"",unit:"nos",rate:""});
  };

  const FormBody = ({f,setF})=>(
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Input label="Site Name" value={f.siteName} onChange={e=>setF({...f,siteName:e.target.value})} placeholder="Site name" />
        <Input label="Phone No" type="tel" value={f.phoneNo} onChange={e=>setF({...f,phoneNo:e.target.value})} placeholder="Contact" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input label="Starting Date" type="date" value={f.startingDate} onChange={e=>setF({...f,startingDate:e.target.value})} />
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Worker Name</label>
          <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50" value={f.workerName} onChange={e=>setF({...f,workerName:e.target.value})}>
            <option value="">Select worker</option>
            {workers.map(w=><option key={w._id} value={w.name}>{w.name}</option>)}
          </select>
        </div>
      </div>

      <SectionBox title="Area & Cost" icon="📐" color="blue">
        <div className="grid grid-cols-2 gap-2">
          <Input label="Total Area (sqft)" type="number" value={f.totalArea||""} onChange={e=>{
            const base=+(e.target.value||0)*(+(f.workingCost||0));
            const ew=(f.extraWorkItems||[]).reduce((a,x)=>a+(+(x.cost)||0),0);
            const em=(f.extraMaterialItems||[]).reduce((a,x)=>a+(+(x.total)||0),0);
            setF({...f,totalArea:e.target.value,totalWorkingArea:e.target.value,totalAmount:String(base+ew+em)});
          }} />
          <Input label={`Rate per sqft (${CURRENCY})`} type="number" value={f.workingCost||""} onChange={e=>{
            const base=+(f.totalArea||0)*(+(e.target.value||0));
            const ew=(f.extraWorkItems||[]).reduce((a,x)=>a+(+(x.cost)||0),0);
            const em=(f.extraMaterialItems||[]).reduce((a,x)=>a+(+(x.total)||0),0);
            setF({...f,workingCost:e.target.value,totalAmount:String(base+ew+em)});
          }} />
        </div>
        <div className="bg-white rounded-xl p-2 border border-blue-200 text-center">
          <div className="text-xs text-gray-400">Base Cost ({f.totalArea||0} sqft × {CURRENCY}{f.workingCost||0})</div>
          <div className="font-black text-blue-700 text-lg">{CURRENCY}{fmt(+(f.totalArea||0)*(+(f.workingCost||0)))}</div>
        </div>
      </SectionBox>

      <SectionBox title="Extra Work" icon="➕" color="orange">
        <div className="grid grid-cols-2 gap-2">
          <Input label="Work Name" value={ewItem.name} onChange={e=>setEwItem({...ewItem,name:e.target.value})} placeholder="e.g. Excavation" />
          <Input label={`Cost (${CURRENCY})`} type="number" value={ewItem.cost} onChange={e=>setEwItem({...ewItem,cost:e.target.value})} placeholder="0" />
        </div>
        <button onClick={()=>addEWItem(f,setF)} className="w-full bg-orange-500 text-white py-2 rounded-xl text-xs font-bold hover:bg-orange-600">+ Add Extra Work</button>
        {(f.extraWorkItems||[]).map((e,i)=>(
          <div key={i} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-orange-200 text-xs">
            <span className="font-bold flex-1">{e.name}</span>
            <span className="font-black text-orange-700">{CURRENCY}{fmt(e.cost)}</span>
            <button onClick={()=>{
              const updated=(f.extraWorkItems||[]).filter((_,j)=>j!==i);
              const total=calcWRTotal({...f,extraWorkItems:updated});
              setF({...f,extraWorkItems:updated,totalAmount:String(total)});
            }} className="text-red-400 hover:text-red-600 font-black ml-2 text-base">×</button>
          </div>
        ))}
        {(f.extraWorkItems||[]).length>0&&<div className="text-xs font-black text-orange-700 text-right">Extra Work: {CURRENCY}{fmt((f.extraWorkItems||[]).reduce((a,e)=>a+(+(e.cost)||0),0))}</div>}
      </SectionBox>

      <SectionBox title="Extra Material" icon="🧱" color="purple">
        <div className="grid grid-cols-2 gap-2">
          <Input label="Material Name" value={emItem.name} onChange={e=>setEmItem({...emItem,name:e.target.value})} placeholder="e.g. Cement" />
          <Select label="Unit" value={emItem.unit} options={["nos","bag","kg","ton","litre","load","sqft"]} onChange={e=>setEmItem({...emItem,unit:e.target.value})} />
          <Input label="Qty" type="number" value={emItem.qty} onChange={e=>setEmItem({...emItem,qty:e.target.value})} placeholder="0" />
          <Input label={`Rate (${CURRENCY})`} type="number" value={emItem.rate} onChange={e=>setEmItem({...emItem,rate:e.target.value})} placeholder="0" />
        </div>
        {emItem.name&&emItem.qty&&<div className="bg-purple-50 rounded-xl px-3 py-2 text-xs flex justify-between"><span>Preview:</span><span className="font-black text-purple-700">{CURRENCY}{fmt(+(emItem.qty||0)*(+(emItem.rate)||0))}</span></div>}
        <button onClick={()=>addEMItem(f,setF)} className="w-full bg-purple-500 text-white py-2 rounded-xl text-xs font-bold hover:bg-purple-600">+ Add Extra Material</button>
        {(f.extraMaterialItems||[]).map((e,i)=>(
          <div key={i} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-purple-200 text-xs">
            <span className="font-bold flex-1">{e.name} ({e.qty} {e.unit})</span>
            <span className="font-black text-purple-700">{CURRENCY}{fmt(e.total)}</span>
            <button onClick={()=>{
              const updated=(f.extraMaterialItems||[]).filter((_,j)=>j!==i);
              const total=calcWRTotal({...f,extraMaterialItems:updated});
              setF({...f,extraMaterialItems:updated,totalAmount:String(total)});
            }} className="text-red-400 hover:text-red-600 font-black ml-2 text-base">×</button>
          </div>
        ))}
        {(f.extraMaterialItems||[]).length>0&&<div className="text-xs font-black text-purple-700 text-right">Materials: {CURRENCY}{fmt((f.extraMaterialItems||[]).reduce((a,e)=>a+(+(e.total)||0),0))}</div>}
      </SectionBox>

      <SectionBox title="Total Summary" icon="💰" color="green">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Base ({f.totalArea||0} sqft × {CURRENCY}{f.workingCost||0})</span><span className="font-bold">{CURRENCY}{fmt(+(f.totalArea||0)*(+(f.workingCost||0)))}</span></div>
          {(f.extraWorkItems||[]).length>0&&<div className="flex justify-between text-orange-600"><span>Extra Work</span><span className="font-bold">{CURRENCY}{fmt((f.extraWorkItems||[]).reduce((a,e)=>a+(+(e.cost)||0),0))}</span></div>}
          {(f.extraMaterialItems||[]).length>0&&<div className="flex justify-between text-purple-600"><span>Extra Materials</span><span className="font-bold">{CURRENCY}{fmt((f.extraMaterialItems||[]).reduce((a,e)=>a+(+(e.total)||0),0))}</span></div>}
          <div className="flex justify-between border-t pt-1 font-black text-green-700 text-lg"><span>TOTAL</span><span>{CURRENCY}{fmt(+(f.totalAmount||0))}</span></div>
        </div>
      </SectionBox>

      <Textarea label="📝 Note" value={f.note} onChange={e=>setF({...f,note:e.target.value})} placeholder="Any notes..." />
      <SectionBox title="Payments" icon="💳" color="purple">
        <PaymentFields f={f} setF={setF} />
      </SectionBox>
      <SectionBox title="Material Supply" icon="🧱" color="teal">
        <Select label="Material Type" value={f.materialType||""} options={["",...MATERIAL_TYPES]} onChange={e=>setF({...f,materialType:e.target.value})} />
        <Textarea label="Material Supply Details" value={f.materialSupply} onChange={e=>setF({...f,materialSupply:e.target.value})} placeholder="Materials supplied..." />
      </SectionBox>
    </div>
  );

  if (loading) return <Loader />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">🏗️ Site Report</h2>
        {(user.role==="supervisor"||isAdminLike(user.role))&&<button onClick={()=>{setForm(emptyForm);setModal(true);}} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ Add</button>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white border rounded-xl p-2 text-center"><div className="font-black">{reports.length}</div><div className="text-xs text-gray-400">Total</div></div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-2 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt(reports.reduce((a,r)=>a+(+(r.totalAmount)||0),0))}</div><div className="text-xs text-gray-400">Amount</div></div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-center"><div className="font-black text-amber-700">{reports.filter(r=>r.signatures?.supervisor&&r.signatures?.office&&r.signatures?.admin).length}</div><div className="text-xs text-gray-400">Signed</div></div>
      </div>
      <div className="space-y-3">
        {reports.length===0&&<EmptyState icon="📋" text="No site reports yet" />}
        {reports.map(r=>{
          const allSigned=r.signatures?.supervisor&&r.signatures?.office&&r.signatures?.admin;
          return (
            <div key={r._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 cursor-pointer" onClick={()=>setViewModal(r)}>
                  <div className="flex items-center gap-2 flex-wrap"><span className="font-black text-gray-900">{r.workerName}</span><Badge color={r.paymentMode==="Cash"?"green":r.paymentMode==="Bank"?"blue":"purple"}>{r.paymentMode}</Badge>{allSigned&&<Badge color="green">✅ Signed</Badge>}</div>
                  <div className="text-xs text-gray-400 mt-0.5">🏗️ {r.siteName||"—"} · 📅 {r.startingDate}</div>
                  <div className="text-xs text-gray-400">📞 {r.phoneNo||"—"}{r.materialType?` · 🧱 ${r.materialType}`:""}</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {(user.role==="supervisor"||isAdminLike(user.role))&&<button onClick={()=>setEditModal({...r})} className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1.5 rounded-lg text-xs font-bold">✏️</button>}
                  <button onClick={()=>downloadReport(r)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1.5 rounded-lg text-xs font-bold">⬇️</button>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1 text-xs">
                <div className="bg-gray-50 rounded-lg p-1.5 text-center"><div className="font-black">{r.totalWorkingArea||"0"} sqft</div><div className="text-gray-400">Area</div></div>
                <div className="bg-amber-50 rounded-lg p-1.5 text-center"><div className="font-black text-amber-700">{CURRENCY}{fmt(+(r.workingCost)||0)}</div><div className="text-gray-400">Cost</div></div>
                <div className="bg-green-50 rounded-lg p-1.5 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt(+(r.totalAmount)||0)}</div><div className="text-gray-400">Total</div></div>
              </div>
              <div className="mt-2 flex gap-1">
                {["supervisor","office","admin"].map(role=>(
                  <div key={role} className={`flex-1 text-center py-1 rounded-lg text-xs font-bold border ${r.signatures?.[role]?"bg-green-50 border-green-300 text-green-700":"bg-gray-50 border-gray-200 text-gray-400"}`}>
                    {r.signatures?.[role]?"✓":"○"} {role.charAt(0).toUpperCase()+role.slice(1)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {modal&&<Modal title="Add Site Report" onClose={()=>setModal(false)}><FormBody f={form} setF={setForm} /><div className="mt-3"><button onClick={save} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600">Submit Report</button></div></Modal>}
      {editModal&&<Modal title="Edit Site Report" onClose={()=>setEditModal(null)}><FormBody f={editModal} setF={setEditModal} /><div className="mt-3"><button onClick={saveEdit} className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600">Save Changes</button></div></Modal>}
      {viewModal&&(
        <Modal title="Site Report Details" onClose={()=>setViewModal(null)}>
          <div className="space-y-3">
            <div className="flex justify-between items-center"><div className="text-xs text-gray-400">By: {viewModal.addedBy}</div><button onClick={()=>downloadReport(viewModal)} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold">Download</button></div>
            <div className="grid grid-cols-2 gap-2">
              {[["Site Name",viewModal.siteName],["Phone No",viewModal.phoneNo],["Starting Date",viewModal.startingDate],["Worker Name",viewModal.workerName],["Payment Mode",viewModal.paymentMode],["Received By",viewModal.amountReceivedBy]].map(([l,v])=>(
                <div key={l} className="bg-gray-50 rounded-xl p-2"><div className="text-xs text-gray-400">{l}</div><div className="font-bold text-sm">{v||"—"}</div></div>
              ))}
              {(viewModal.paymentMode==="GPay"||viewModal.paymentMode==="UPI")&&viewModal.upiId&&<div className="col-span-2 bg-purple-50 rounded-xl p-2"><div className="text-xs text-gray-400">UPI ID</div><div className="font-bold">{viewModal.upiId}</div></div>}
              {viewModal.paymentMode==="Bank"&&<div className="col-span-2 bg-blue-50 rounded-xl p-2 grid grid-cols-3 gap-1"><div><div className="text-xs text-gray-400">Bank</div><div className="font-bold text-xs">{viewModal.bankName||"—"}</div></div><div><div className="text-xs text-gray-400">Branch</div><div className="font-bold text-xs">{viewModal.bankBranch||"—"}</div></div><div><div className="text-xs text-gray-400">Account</div><div className="font-bold text-xs">{viewModal.bankAccount||"—"}</div></div></div>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-2 text-center"><div className="font-black text-blue-700">{viewModal.totalArea||"0"} sqft</div><div className="text-xs text-gray-400">Total Area</div></div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-center"><div className="font-black text-amber-700">{CURRENCY}{fmt(+(viewModal.workingCost)||0)}</div><div className="text-xs text-gray-400">Working Cost</div></div>
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-2 text-center"><div className="font-black text-teal-700">{viewModal.totalWorkingArea||"0"} sqft</div><div className="text-xs text-gray-400">Total Area</div></div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-2 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt(+(viewModal.totalAmount)||0)}</div><div className="text-xs text-gray-400">Total Amount</div></div>
            </div>
            {viewModal.materialType&&<div className="bg-teal-50 border border-teal-200 rounded-xl p-2"><div className="text-xs font-bold text-teal-600 mb-1">🧱 Material Type</div><div className="text-sm font-bold">{viewModal.materialType}</div></div>}
            {viewModal.extraWork&&<div className="bg-orange-50 border border-orange-200 rounded-xl p-2"><div className="text-xs font-bold text-orange-600 mb-1">➕ Extra Work</div><div className="text-sm">{viewModal.extraWork}</div></div>}
            {viewModal.extraMaterial&&<div className="bg-orange-50 border border-orange-200 rounded-xl p-2"><div className="text-xs font-bold text-orange-600 mb-1">🧱 Extra Material</div><div className="text-sm">{viewModal.extraMaterial}</div></div>}
            {viewModal.note&&<div className="bg-gray-50 rounded-xl p-2"><div className="text-xs font-bold text-gray-500 mb-1">📝 Note</div><div className="text-sm">{viewModal.note}</div></div>}
            {viewModal.materialSupply&&<div className="bg-teal-50 rounded-xl p-2"><div className="text-xs font-bold text-teal-600 mb-1">📦 Material Supply</div><div className="text-sm">{viewModal.materialSupply}</div></div>}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
              <div className="text-xs font-bold text-gray-600 uppercase mb-3">✍️ Signatures</div>
              <div className="grid grid-cols-3 gap-2">
                {["supervisor","office","admin"].map(role=>(
                  <div key={role} className={`rounded-xl border p-2 text-center ${viewModal.signatures?.[role]?"bg-green-50 border-green-300":"bg-white border-gray-200"}`}>
                    <div className="text-xl mb-1">{viewModal.signatures?.[role]?"✅":"⭕"}</div>
                    <div className="text-xs font-bold capitalize">{role}</div>
                    {!viewModal.signatures?.[role]&&(user.role===role||isAdminLike(user.role))&&<button onClick={()=>signReport(viewModal._id,role)} className="mt-1 bg-green-500 text-white px-2 py-0.5 rounded-lg text-xs font-bold w-full">Sign</button>}
                    {viewModal.signatures?.[role]&&<div className="text-xs text-green-600 font-semibold mt-1">Signed ✓</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── SUPERVISOR DAILY REPORT ───────────────────────────────────────────────────

// ─── DAILY REPORT (Supervisor) ────────────────────────────────────────────────
function DailyReport({ user }) {
  const [siteWorks, setSiteWorks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("running");
  const [selectedSite, setSelectedSite] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [siteSearch, setSiteSearch] = useState("");

  const emptyForm = {
    siteName:"", siteId:"", date:today(), siteStatus:"running",
    completedToday:"", totalCompleted:"", interlockType:"", dayNotes:"",
    materialsUnloaded:"", materialQty:"", equipment:"", supplierName:"",
    extraWorkDesc:"", extraWorkQty:"", extraWorkCost:"",
    complaints:"", actionTaken:"",
    workerEntries:[], // [{workerName, attendance, workDone, salary, paymentGiven, pending, remarks, workCategory, workArea, unit, rate, paymentMode}]
    payments:[], // [{type, siteName, date, mode, amount, pending, remarks, materialName, supplierName, equipmentName, receivedFrom}]
  };
  const [form, setForm] = useState(emptyForm);
  const [workerEntry, setWorkerEntry] = useState({
    workerName:"", attendance:"present", dutyArea:"", workDone:"",
    workCategory:"", workArea:"", unit:"Sqft", rate:"", salary:"",
    paymentGiven:"", pending:"", remarks:"", paymentMode:"Cash"
  });
  const emptyPayForm = {type:"Site Payment Received",workerName:"",siteName:"",date:today(),mode:"Cash",amount:"",pending:"",remarks:"",materialName:"",supplierName:"",equipmentName:"",receivedFrom:"",expenseName:""};
  const [payForm, setPayForm] = useState(emptyPayForm);

  useEffect(()=>{
    Promise.all([api("GET","/sitework"),api("GET","/workers"),api("GET","/dailyreport")]).then(([sw,w,dr])=>{
      setSiteWorks(Array.isArray(sw)?sw:[]);
      setWorkers(Array.isArray(w)?w:[]);
      setReports(Array.isArray(dr)?dr:[]);
      setLoading(false);
    });
  },[]);

  const mySites = siteWorks.filter(s=>isAdminLike(user.role)||s.addedBy===user.name);
  const planned = mySites.filter(s=>s.status==="pending");
  const running = mySites.filter(s=>s.status==="running");
  const completed = mySites.filter(s=>s.status==="completed");
  const getSiteReports = (site) => reports.filter(r=>r.siteName===site.customerName||r.siteId===site._id).sort((a,b)=>b.date.localeCompare(a.date));

  const addWorkerEntry = () => {
    if (!workerEntry.workerName) return;
    const normalize = (v) => String(v || "").trim().toLowerCase();
    const duplicateInFormIndex = (form.workerEntries || []).findIndex(w =>
      normalize(w.workerName) === normalize(workerEntry.workerName) &&
      normalize(w.workCategory) === normalize(workerEntry.workCategory)
    );
    if (duplicateInFormIndex >= 0) {
      const editExisting = window.confirm("Worker work entry already exists for this date and site.\nDo you want to edit the existing entry?");
      if (editExisting) {
        const existing = form.workerEntries[duplicateInFormIndex];
        setWorkerEntry({
          ...existing,
          workArea: String(existing.workArea || ""),
          rate: String(existing.rate || ""),
          salary: String(existing.salary || existing.amountEarned || ""),
          paymentGiven: String(existing.paymentGiven || ""),
          pending: String(existing.pending || "")
        });
        setForm(f => ({ ...f, workerEntries: f.workerEntries.filter((_, i) => i !== duplicateInFormIndex) }));
      }
      return;
    }
    const area = parseFloat(workerEntry.workArea) || 0;
    const rate = parseFloat(workerEntry.rate) || 0;
    const totalAmount = area * rate;
    const paid = parseFloat(workerEntry.paymentGiven) || 0;
    const pending = Math.max(0, totalAmount - paid);

    setForm(f=>({
      ...f,
      workerEntries:[
        ...(f.workerEntries||[]),
        {
          ...workerEntry,
          salary: totalAmount,
          amountEarned: totalAmount,
          paymentGiven: paid,
          pending,
          workArea: area,
          rate
        }
      ]
    }));

    setWorkerEntry({
      workerName:"", attendance:"present", dutyArea:"", workDone:"",
      workCategory:"", workArea:"", unit:"Sqft", rate:"", salary:"",
      paymentGiven:"", pending:"", remarks:"", paymentMode:"Cash"
    });
  };

  const addPayment = () => {
    if (!payForm.amount) return;
    if (payForm.type === "Worker Payment") return;
    setForm(f=>({...f, payments:[...(f.payments||[]),{...payForm,amount:+payForm.amount,pending:+payForm.pending||0,siteName:payForm.siteName||f.siteName}]}));
    setPayForm(emptyPayForm);
  };

  const save = async () => {
    if (!form.siteName||!form.date) return;

    const cleanPayments = (form.payments||[]).filter(p=>p.type!=="Worker Payment");
    const workerPaidTotal = (form.workerEntries||[]).reduce((a,w)=>a+(+(w.paymentGiven)||0),0);
    const totalPayments = cleanPayments.reduce((a,p)=>a+(+(p.amount)||0),0) + workerPaidTotal;

    // 3. Calculate site payment received & AUTO-UPDATE sitework
    const sitePayments = cleanPayments.filter(p=>p.type==="Site Payment Received");
    const totalReceived = sitePayments.reduce((a,p)=>a+(+(p.amount)||0),0);
    const item = await api("POST","/dailyreport",{...form,payments:cleanPayments,totalPayments,totalReceived,addedBy:user.name});
    if(item._id){
      setReports(p=>[item,...p]);
      if (form.siteId) api("GET","/sitework").then(sw=>setSiteWorks(Array.isArray(sw)?sw:[]));
      setAddModal(false); setForm(emptyForm); setPayForm(emptyPayForm); setSiteSearch("");
    }
    else if (item.message) window.alert(item.message);
  };;

  const openAdd = (site) => {
    setForm({...emptyForm,siteName:site.customerName,siteId:site._id,interlockType:site.interlockType||"",siteStatus:site.status||"running"});
    setSiteSearch(site.customerName);
    setWorkerEntry({
      workerName:"", attendance:"present", dutyArea:"", workDone:"",
      workCategory:"", workArea:"", unit:"Sqft", rate:"", salary:"",
      paymentGiven:"", pending:"", remarks:"", paymentMode:"Cash"
    });
    setAddModal(true);
  };

  if (loading) return <Loader />;

  if (selectedSite) {
    const sr = getSiteReports(selectedSite);
    const groupedReports = mergeDailyReportsByDate(sr);
    const dateReport = selectedDate?groupedReports.find(r=>r.date===selectedDate):null;
    const totalComp = sr.reduce((a,r)=>a+(+(r.completedToday||0)),0);
    const totalPaid = sr.reduce((a,r)=>a+(+(r.totalPayments||0)),0);
    const totalReceived = sr.reduce((a,r)=>a+(+(r.totalReceived||0)),0);
    const allPayments = sr.flatMap(r=>(r.payments||[]).filter(p=>p.type!=="Worker Payment").map(p=>({...p,date:r.date})));
    const allMats = sr.filter(r=>r.materialsUnloaded).map(r=>({name:r.materialsUnloaded,qty:r.materialQty,supplier:r.supplierName,date:r.date}));
    const allExtra = sr.filter(r=>r.extraWorkDesc).map(r=>({desc:r.extraWorkDesc,qty:r.extraWorkQty,cost:r.extraWorkCost,date:r.date}));
    const allWorkers = sr.flatMap(r=>(r.workerEntries||[]).map(w=>({...w,date:r.date})));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={()=>{setSelectedSite(null);setSelectedDate(null);}} className="text-amber-600 font-bold text-sm">← Back</button>
          <button onClick={()=>openAdd(selectedSite)} className="bg-amber-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold">+ Daily Entry</button>
        </div>
        <div className="bg-white rounded-2xl border shadow-sm p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-black text-xl">{selectedSite.customerName}</div>
              <div className="text-xs text-gray-400">📍 {selectedSite.siteLocation||"—"} · 📞 {selectedSite.phone||"—"}</div>
              <div className="text-xs text-gray-400">🧱 {selectedSite.interlockType||"—"} · By: {selectedSite.addedBy||"—"}</div>
            </div>
            <Badge color={selectedSite.status==="completed"?"green":selectedSite.status==="running"?"amber":"gray"}>{selectedSite.status}</Badge>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1 text-xs">
            <div className="bg-blue-50 rounded-xl p-2 text-center"><div className="font-black text-blue-700">{selectedSite.workSize||"—"}</div><div className="text-gray-400">Total sqft</div></div>
            <div className="bg-teal-50 rounded-xl p-2 text-center"><div className="font-black text-teal-700">{totalComp}</div><div className="text-gray-400">Done</div></div>
            <div className="bg-green-50 rounded-xl p-2 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt(totalReceived)}</div><div className="text-gray-400">Received</div></div>
            <div className="bg-red-50 rounded-xl p-2 text-center"><div className="font-black text-red-600">{CURRENCY}{fmt(+(selectedSite.pendingAmount||0))}</div><div className="text-gray-400">Pending</div></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-3">
          <div className="text-xs font-bold text-gray-500 mb-2">📅 View by Date</div>
          <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50" value={selectedDate||""} onChange={e=>setSelectedDate(e.target.value||null)}>
            <option value="">All Dates ({groupedReports.length} days / {sr.length} reports)</option>
            {groupedReports.map(r=><option key={r.date} value={r.date}>{r.date} - {r.reportCount} report(s), {r.completedToday||0} sqft, {CURRENCY}{fmt(r.totalPayments||0)} paid</option>)}
          </select>
        </div>

        {dateReport?(
          <div className="space-y-3">
            <div className="text-xs font-black text-gray-600 uppercase">📅 {selectedDate}</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-teal-50 rounded-xl p-2 text-center"><div className="font-black text-teal-700">{dateReport.completedToday||0} sqft</div><div className="text-gray-400">Done</div></div>
              <div className="bg-green-50 rounded-xl p-2 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt(dateReport.totalReceived||0)}</div><div className="text-gray-400">Received</div></div>
              <div className="bg-amber-50 rounded-xl p-2 text-center"><div className="font-black text-amber-700">{CURRENCY}{fmt(dateReport.totalPayments||0)}</div><div className="text-gray-400">Paid Out</div></div>
            </div>
            {(dateReport.sourceReports||[]).length>0&&(
              <SectionBox title="Reports Submitted This Date" icon="Report" color="blue">
                {(dateReport.sourceReports||[]).map((r,i)=>(
                  <div key={r._id||i} className="flex items-center justify-between text-xs py-1 border-b border-blue-100">
                    <span>Report {i+1} ? {r.workerEntries?.length||0} workers ? {CURRENCY}{fmt(r.totalPayments||0)} paid</span>
                    <button onClick={()=>editDailyReport(r)} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-bold">Edit</button>
                  </div>
                ))}
              </SectionBox>
            )}
            {dateReport.dayNotes&&<SectionBox title="Day Notes" icon="📝" color="gray"><div className="text-sm">{dateReport.dayNotes}</div></SectionBox>}
            {(dateReport.workerEntries||[]).length>0&&(
              <SectionBox title="Worker Details" icon="👷" color="teal">
                {dateReport.workerEntries.map((w,i)=>(
                  <div key={i} className="bg-white rounded-xl p-2 border border-teal-100 text-xs">
                    <div className="flex justify-between"><span className="font-bold">{w.workerName}</span><Badge color={w.attendance==="present"?"green":"red"}>{w.attendance}</Badge></div>
                    {w.workDone&&<div className="text-gray-500">Work: {w.workDone}</div>}
                    <div className="flex gap-3 mt-0.5">
                      {w.salary&&<span>Salary: {CURRENCY}{fmt(w.salary)}</span>}
                      {w.paymentGiven&&<span className="text-green-700 font-bold">Paid: {CURRENCY}{fmt(w.paymentGiven)}</span>}
                      {w.pending>0&&<span className="text-red-600">Pending: {CURRENCY}{fmt(w.pending)}</span>}
                    </div>
                  </div>
                ))}
              </SectionBox>
            )}
            {(dateReport.payments||[]).filter(p=>p.type!=="Worker Payment").length>0&&(
              <SectionBox title="Payments" icon="💰" color="green">
                {(dateReport.payments||[]).filter(p=>p.type!=="Worker Payment").map((p,i)=>(
                  <div key={i} className="flex justify-between text-xs bg-white rounded-lg px-3 py-2 mb-1 border border-green-100">
                    <div><span className="font-bold">{p.type}</span>{p.workerName?` → ${p.workerName}`:""}{p.receivedFrom?` from ${p.receivedFrom}`:""}<div className="text-gray-400">{p.mode}{p.remarks?` · ${p.remarks}`:""}</div></div>
                    <span className={`font-black ${p.type==="Site Payment Received"?"text-blue-700":"text-green-700"}`}>{CURRENCY}{fmt(p.amount)}</span>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                  <div className="bg-blue-50 rounded-lg p-1.5 text-center"><div className="font-black text-blue-700">{CURRENCY}{fmt((dateReport.payments||[]).filter(p=>p.type==="Site Payment Received").reduce((a,p)=>a+(+(p.amount)||0),0))}</div><div className="text-gray-400">Received</div></div>
                  <div className="bg-green-50 rounded-lg p-1.5 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt((dateReport.payments||[]).filter(p=>p.type!=="Site Payment Received"&&p.type!=="Worker Payment").reduce((a,p)=>a+(+(p.amount)||0),0))}</div><div className="text-gray-400">Paid Out</div></div>
                </div>
              </SectionBox>
            )}
            {dateReport.materialsUnloaded&&<SectionBox title="Materials" icon="🧱" color="teal"><div className="text-sm">{dateReport.materialsUnloaded} · {dateReport.materialQty}</div><div className="text-xs text-gray-400">Supplier: {dateReport.supplierName||"—"}</div></SectionBox>}
            {dateReport.extraWorkDesc&&<SectionBox title="Extra Work" icon="➕" color="orange"><div className="text-sm">{dateReport.extraWorkDesc} · {dateReport.extraWorkQty}</div><div className="font-bold text-xs text-orange-700">{CURRENCY}{fmt(dateReport.extraWorkCost||0)}</div></SectionBox>}
            {dateReport.complaints&&<SectionBox title="Complaints" icon="⚠️" color="red"><div className="text-sm">{dateReport.complaints}</div>{dateReport.actionTaken&&<div className="text-xs text-gray-400 mt-1">Action: {dateReport.actionTaken}</div>}</SectionBox>}
          </div>
        ):(
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white border rounded-xl p-2 text-center"><div className="font-black">{sr.length}</div><div className="text-xs text-gray-400">Reports</div></div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-2 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt(totalReceived)}</div><div className="text-xs text-gray-400">Total Received</div></div>
            </div>
            {allWorkers.length>0&&(
              <SectionBox title="Worker Summary" icon="👷" color="teal">
                {Object.entries(allWorkers.reduce((acc,w)=>{
                  if (!acc[w.workerName]) acc[w.workerName]={days:0,paid:0,pending:0};
                  acc[w.workerName].days++;
                  acc[w.workerName].paid+=+(w.paymentGiven||0);
                  acc[w.workerName].pending+=+(w.pending||0);
                  return acc;
                },{})).map(([name,d])=>(
                  <div key={name} className="flex justify-between text-xs py-1 border-b border-teal-100">
                    <span className="font-bold">{name} ({d.days} days)</span>
                    <span>Paid: {CURRENCY}{fmt(d.paid)} {d.pending>0?`· Pending: ${CURRENCY}${fmt(d.pending)}`:""}</span>
                  </div>
                ))}
              </SectionBox>
            )}
            {allPayments.filter(p=>p.type==="Site Payment Received").length>0&&(
              <SectionBox title="Payments Received from Site" icon="💰" color="blue">
                {allPayments.filter(p=>p.type==="Site Payment Received").map((p,i)=>(
                  <div key={i} className="text-xs flex justify-between py-1 border-b border-blue-100">
                    <span>{p.date} · {p.receivedFrom||"—"} · {p.mode}</span>
                    <span className="font-black text-blue-700">{CURRENCY}{fmt(p.amount)}</span>
                  </div>
                ))}
                <div className="text-xs font-black text-blue-700 text-right mt-1">Total: {CURRENCY}{fmt(allPayments.filter(p=>p.type==="Site Payment Received").reduce((a,p)=>a+(+(p.amount)||0),0))}</div>
              </SectionBox>
            )}
            {allPayments.filter(p=>p.type!=="Site Payment Received").length>0&&(
              <SectionBox title="Payments Made" icon="💸" color="green">
                {allPayments.filter(p=>p.type!=="Site Payment Received").map((p,i)=>(
                  <div key={i} className="text-xs flex justify-between py-1 border-b border-green-100">
                    <span>{p.date} · {p.type}{p.workerName?` → ${p.workerName}`:""}</span>
                    <span className="font-black text-green-700">{CURRENCY}{fmt(p.amount)}</span>
                  </div>
                ))}
              </SectionBox>
            )}
            {allMats.length>0&&<SectionBox title="Material History" icon="🧱" color="teal">{allMats.map((m,i)=><div key={i} className="text-xs flex justify-between py-1 border-b border-teal-100"><span>{m.date} · {m.name} ({m.qty})</span><span className="text-gray-400">{m.supplier||"—"}</span></div>)}</SectionBox>}
            {allExtra.length>0&&<SectionBox title="Extra Work" icon="➕" color="orange">{allExtra.map((e,i)=><div key={i} className="text-xs flex justify-between py-1 border-b border-orange-100"><span>{e.date} · {e.desc}</span><span className="font-black text-orange-700">{CURRENCY}{fmt(e.cost||0)}</span></div>)}</SectionBox>}
            <div className="text-xs font-black text-gray-500 uppercase">All Daily Reports ({groupedReports.length} days / {sr.length} reports)</div>
            {groupedReports.length===0&&<EmptyState icon="Report" text="No reports yet" />}
            {groupedReports.map(r=>(
              <div key={r.date} onClick={()=>setSelectedDate(r.date)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 cursor-pointer hover:border-amber-300 transition-all">
                <div className="flex items-center justify-between">
                  <div><div className="font-black">📅 {r.date}</div><div className="text-xs text-gray-400">{(r.workerEntries||[]).length} workers · {r.completedToday||0} sqft</div></div>
                  <div className="text-right"><div className="font-black text-blue-700">{CURRENCY}{fmt(r.totalReceived||0)} recv</div><div className="text-xs text-green-600">{CURRENCY}{fmt(r.totalPayments||0)} paid</div></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">📋 Daily Report</h2>
        <button onClick={()=>{setForm(emptyForm);setSiteSearch("");setAddModal(true);}} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ Add</button>
      </div>
      <div className="flex gap-1">
        {[{id:"running",label:"🔄 Running",c:running.length},{id:"planned",label:"📋 Planned",c:planned.length},{id:"completed",label:"✅ Done",c:completed.length}].map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} className={`flex-1 py-2 rounded-xl text-xs font-bold ${activeTab===t.id?"bg-amber-500 text-white":"bg-white border border-gray-200 text-gray-600"}`}>{t.label} ({t.c})</button>
        ))}
      </div>
      <div className="space-y-3">
        {activeTab==="running"&&(running.length===0?<EmptyState icon="🔄" text="No running sites"/>:running.map(s=>{
          const sr=getSiteReports(s); const comp=sr.reduce((a,r)=>a+(+(r.completedToday||0)),0);
          return (<div key={s._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"><div className="flex items-start justify-between"><div className="flex-1 cursor-pointer" onClick={()=>setSelectedSite(s)}><div className="font-black">{s.customerName}</div><div className="text-xs text-gray-400">📍 {s.siteLocation||"—"} · {comp}/{s.workSize||"-"} sqft</div></div><button onClick={()=>openAdd(s)} className="bg-amber-500 text-white px-2 py-1.5 rounded-lg text-xs font-bold shrink-0 ml-2">+ Entry</button></div></div>);
        }))}
        {activeTab==="planned"&&(planned.length===0?<EmptyState icon="📋" text="No planned sites"/>:planned.map(s=>(
          <div key={s._id} onClick={()=>setSelectedSite(s)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:border-amber-300"><div className="font-black">{s.customerName}</div><div className="text-xs text-gray-400">📍 {s.siteLocation||"—"} · 📅 {s.startDate||"—"}</div></div>
        )))}
        {activeTab==="completed"&&(completed.length===0?<EmptyState icon="✅" text="No completed sites"/>:completed.map(s=>(
          <div key={s._id} onClick={()=>setSelectedSite(s)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:border-amber-300"><div className="font-black">{s.customerName}</div><div className="text-xs text-gray-400">📍 {s.siteLocation||"—"} · ✅ {s.endDate||"—"}</div></div>
        )))}
      </div>

      {addModal&&(
        <Modal title={`Daily Entry — ${form.siteName||"Select Site"}`} onClose={()=>setAddModal(false)} wide>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Site Name * (search or type)</label>
              <input list="site-list" value={siteSearch} onChange={e=>{
                setSiteSearch(e.target.value);
                const found=mySites.find(s=>s.customerName===e.target.value);
                if(found) {
                  setForm(f=>({...f,siteName:found.customerName,siteId:found._id,interlockType:found.interlockType||f.interlockType,siteStatus:found.status||"running"}));
                  setWorkerEntry(w=>({...w,workerName:""}));
                }
                else setForm(f=>({...f,siteName:e.target.value,siteId:""}));
              }} placeholder="Search or type site name..." className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50" />
              <datalist id="site-list">{mySites.map(s=><option key={s._id} value={s.customerName}/>)}</datalist>
              {form.siteId&&<div className="text-xs text-green-600 font-semibold mt-1">✓ Linked to existing site</div>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input label="Date" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} />
              <Select label="Site Status" value={form.siteStatus} options={["pending","running","completed"]} onChange={e=>setForm({...form,siteStatus:e.target.value})} />
            </div>

            <SectionBox title="Work Progress" icon="📐" color="blue">
              <div className="grid grid-cols-2 gap-2">
                <Input label="Completed Today (sqft)" type="number" value={form.completedToday||""} onChange={e=>setForm({...form,completedToday:e.target.value})} placeholder="0" />
                <Input label="Total Done Till Date" type="number" value={form.totalCompleted||""} onChange={e=>setForm({...form,totalCompleted:e.target.value})} placeholder="0" />
              </div>
              <Input label="Interlock Type" value={form.interlockType||""} onChange={e=>setForm({...form,interlockType:e.target.value})} />
              <Textarea label="Day Notes" value={form.dayNotes||""} onChange={e=>setForm({...form,dayNotes:e.target.value})} placeholder="What happened today..." />
            </SectionBox>

            <SectionBox title="Worker Details" icon="👷" color="teal">
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Worker Name</label>
                  <select value={workerEntry.workerName} onChange={e=>setWorkerEntry({...workerEntry,workerName:e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50">
                    <option value="">Select assigned worker</option>
                    {workers.filter(w=>workerTypeOf(w)==="Site Worker"&&isActiveWorker(w)&&(mySites.find(s=>s._id===form.siteId)?.selectedWorkers||[]).includes(w.name)).map(w=><option key={w._id} value={w.name}>{w.name}</option>)}
                  </select>
                  {form.siteId&&workers.filter(w=>workerTypeOf(w)==="Site Worker"&&isActiveWorker(w)&&(mySites.find(s=>s._id===form.siteId)?.selectedWorkers||[]).includes(w.name)).length===0&&<div className="text-xs text-red-500 mt-1">No site workers assigned to this site.</div>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select label="Work Category" value={workerEntry.workCategory} options={["Fitting","Polish","Levelling","Cutting","Loading","Unloading","Other"]} onChange={e=>setWorkerEntry({...workerEntry,workCategory:e.target.value})} />
                  <Select label="Attendance" value={workerEntry.attendance} options={["present","absent","half-day"]} onChange={e=>setWorkerEntry({...workerEntry,attendance:e.target.value})} />
                  <Input label="Duty Area" value={workerEntry.dutyArea} onChange={e=>setWorkerEntry({...workerEntry,dutyArea:e.target.value})} placeholder="e.g. Front yard" />
                  <Input label="Work Done Description" value={workerEntry.workDone} onChange={e=>setWorkerEntry({...workerEntry,workDone:e.target.value})} placeholder="e.g. Completed fitting" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input label="Work Area" type="number" value={workerEntry.workArea} onChange={e=>{
                    const area = e.target.value;
                    const tot = (parseFloat(area) || 0) * (parseFloat(workerEntry.rate) || 0);
                    const pend = Math.max(0, tot - (parseFloat(workerEntry.paymentGiven) || 0));
                    setWorkerEntry({...workerEntry,workArea:area,salary:String(tot),pending:String(pend)});
                  }} placeholder="0" />
                  <Select label="Unit" value={workerEntry.unit} options={["Sqft","Sqm","Piece","Meter"]} onChange={e=>setWorkerEntry({...workerEntry,unit:e.target.value})} />
                  <Input label="Rate" type="number" value={workerEntry.rate} onChange={e=>{
                    const rate = e.target.value;
                    const tot = (parseFloat(workerEntry.workArea) || 0) * (parseFloat(rate) || 0);
                    const pend = Math.max(0, tot - (parseFloat(workerEntry.paymentGiven) || 0));
                    setWorkerEntry({...workerEntry,rate:rate,salary:String(tot),pending:String(pend)});
                  }} placeholder="₹" />
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-center text-sm font-bold text-amber-800">
                  Total Amount: {CURRENCY}{fmt((parseFloat(workerEntry.workArea)||0) * (parseFloat(workerEntry.rate)||0))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input label="Payment Given Today" type="number" value={workerEntry.paymentGiven} onChange={e=>{
                    const paid = e.target.value;
                    const tot = (parseFloat(workerEntry.workArea)||0) * (parseFloat(workerEntry.rate)||0);
                    const pend = Math.max(0, tot - (parseFloat(paid) || 0));
                    setWorkerEntry({...workerEntry,paymentGiven:paid,pending:String(pend)});
                  }} placeholder="0" />
                  <Select label="Payment Mode" value={workerEntry.paymentMode} options={["Cash","UPI","Bank Transfer"]} onChange={e=>setWorkerEntry({...workerEntry,paymentMode:e.target.value})} />
                </div>

                {Math.max(0, ((parseFloat(workerEntry.workArea)||0) * (parseFloat(workerEntry.rate)||0)) - (parseFloat(workerEntry.paymentGiven)||0)) > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-2 flex justify-between text-xs font-bold text-red-700">
                    <span>Pending Amount:</span>
                    <span>{CURRENCY}{fmt(Math.max(0, ((parseFloat(workerEntry.workArea)||0) * (parseFloat(workerEntry.rate)||0)) - (parseFloat(workerEntry.paymentGiven)||0)))}</span>
                  </div>
                )}

                <Input label="Remarks" value={workerEntry.remarks} onChange={e=>setWorkerEntry({...workerEntry,remarks:e.target.value})} placeholder="Optional remarks..." />
                <button onClick={addWorkerEntry} className="w-full bg-teal-500 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-teal-600">+ Add Worker Entry</button>
              </div>
              {(form.workerEntries||[]).map((w,i)=>(
                <div key={i} className="bg-white rounded-xl p-3 border border-teal-200 text-xs mt-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-gray-800">{w.workerName}</span>
                    <div className="flex items-center gap-1">
                      <Badge color={w.attendance==="present"?"green":"red"}>{w.attendance}</Badge>
                      <button onClick={()=>setForm(f=>({...f,workerEntries:f.workerEntries.filter((_,j)=>j!==i)}))} className="text-red-500 font-bold text-base hover:text-red-700 ml-2">×</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-gray-600">
                    <div>Category: <span className="font-semibold text-gray-900">{w.workCategory || "—"}</span></div>
                    <div>Area: <span className="font-semibold text-gray-900">{w.workArea} {w.unit}</span></div>
                    <div>Rate: <span className="font-semibold text-gray-900">{CURRENCY}{w.rate}</span></div>
                    <div>Earned: <span className="font-semibold text-green-700">{CURRENCY}{w.salary}</span></div>
                    <div>Paid: <span className="font-semibold text-blue-700">{CURRENCY}{w.paymentGiven || 0} ({w.paymentMode})</span></div>
                    <div>Pending: <span className="font-semibold text-red-600">{CURRENCY}{w.pending}</span></div>
                  </div>
                  {w.remarks && <div className="text-gray-400 italic">Notes: {w.remarks}</div>}
                </div>
              ))}
            </SectionBox>

            <SectionBox title="Payments & Expenses" icon="💰" color="green">
              <Select label="Payment Type" value={payForm.type} options={["Site Payment Received","Vehicle Charge","Material Payment","Equipment Payment","Other Expense"]} onChange={e=>setPayForm({...payForm,type:e.target.value,workerName:"",materialName:"",supplierName:"",equipmentName:"",receivedFrom:"",expenseName:""})} />
              {payForm.type==="Material Payment"&&(
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Material Name" value={payForm.materialName||""} onChange={e=>setPayForm({...payForm,materialName:e.target.value})} placeholder="Material" />
                  <Input label="Supplier" value={payForm.supplierName||""} onChange={e=>setPayForm({...payForm,supplierName:e.target.value})} placeholder="Supplier" />
                </div>
              )}
              {payForm.type==="Equipment Payment"&&(
                <Input label="Equipment Name" value={payForm.equipmentName||""} onChange={e=>setPayForm({...payForm,equipmentName:e.target.value})} placeholder="Equipment" />
              )}
              {payForm.type==="Vehicle Charge"&&(
                <Input label="Vehicle / Charge Name" value={payForm.expenseName||""} onChange={e=>setPayForm({...payForm,expenseName:e.target.value})} placeholder="Vehicle number or charge" />
              )}
              {payForm.type==="Other Expense"&&(
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Expense Name</label>
                  <input list="other-expense-names" value={payForm.expenseName||""} onChange={e=>setPayForm({...payForm,expenseName:e.target.value})} placeholder="Select or type expense name" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50" />
                  <datalist id="other-expense-names">
                    {["Tea Expense","Generator Fuel","Accommodation","Food","Miscellaneous"].map(name=><option key={name} value={name} />)}
                  </datalist>
                </div>
              )}
              {payForm.type==="Site Payment Received"&&(
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Received From" value={payForm.receivedFrom||""} onChange={e=>setPayForm({...payForm,receivedFrom:e.target.value})} placeholder="Client name" />
                  <Input label="Pending Amount" type="number" value={payForm.pending||""} onChange={e=>setPayForm({...payForm,pending:e.target.value})} placeholder="0" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Select label="Mode" value={payForm.mode} options={["Cash","UPI","Bank Transfer","Cheque"]} onChange={e=>setPayForm({...payForm,mode:e.target.value})} />
                <Input label={`Amount (${CURRENCY})`} type="number" value={payForm.amount} onChange={e=>setPayForm({...payForm,amount:e.target.value})} placeholder="0" />
              </div>
              <Input label="Remarks" value={payForm.remarks} onChange={e=>setPayForm({...payForm,remarks:e.target.value})} placeholder="Optional" />
              <button onClick={addPayment} className="w-full bg-green-500 text-white py-2 rounded-xl text-xs font-bold hover:bg-green-600">+ Add Payment</button>
              {(form.payments||[]).filter(p=>p.type!=="Worker Payment").map((p,i)=>(
                <div key={i} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-green-200 text-xs mt-1">
                  <div><span className="font-bold">{p.type}</span>{p.workerName?` → ${p.workerName}`:""}{p.receivedFrom?` from ${p.receivedFrom}`:""}<div className="text-gray-400">{p.mode}</div></div>
                  <div className="flex items-center gap-1">
                    <span className={`font-black ${p.type==="Site Payment Received"?"text-blue-700":"text-green-700"}`}>{CURRENCY}{fmt(p.amount)}</span>
                    <button onClick={()=>setForm(f=>({...f,payments:f.payments.filter((_,j)=>j!==i)}))} className="text-red-400 font-black ml-1">×</button>
                  </div>
                </div>
              ))}
              {(form.payments||[]).length>0&&(
                <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                  <div className="bg-blue-50 rounded-lg p-1.5 text-center"><div className="font-black text-blue-700">{CURRENCY}{fmt((form.payments||[]).filter(p=>p.type==="Site Payment Received").reduce((a,p)=>a+(+(p.amount)||0),0))}</div><div className="text-gray-400">Received</div></div>
                  <div className="bg-green-50 rounded-lg p-1.5 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt((form.payments||[]).filter(p=>p.type!=="Site Payment Received"&&p.type!=="Worker Payment").reduce((a,p)=>a+(+(p.amount)||0),0))}</div><div className="text-gray-400">Paid Out</div></div>
                </div>
              )}
            </SectionBox>

            <SectionBox title="Materials & Equipment" icon="🧱" color="teal">
              <div className="grid grid-cols-2 gap-2">
                <Input label="Materials" value={form.materialsUnloaded||""} onChange={e=>setForm({...form,materialsUnloaded:e.target.value})} placeholder="e.g. Cement, Sand" />
                <Input label="Quantity" value={form.materialQty||""} onChange={e=>setForm({...form,materialQty:e.target.value})} placeholder="e.g. 50 bags" />
                <Input label="Equipment" value={form.equipment||""} onChange={e=>setForm({...form,equipment:e.target.value})} placeholder="e.g. Mixer" />
                <Input label="Supplier" value={form.supplierName||""} onChange={e=>setForm({...form,supplierName:e.target.value})} placeholder="Supplier name" />
              </div>
            </SectionBox>

            <SectionBox title="Extra Work" icon="➕" color="orange">
              <div className="grid grid-cols-2 gap-2">
                <Input label="Description" value={form.extraWorkDesc||""} onChange={e=>setForm({...form,extraWorkDesc:e.target.value})} placeholder="Extra work done" />
                <Input label="Qty / Sqft" value={form.extraWorkQty||""} onChange={e=>setForm({...form,extraWorkQty:e.target.value})} />
                <Input label={`Cost (${CURRENCY})`} type="number" value={form.extraWorkCost||""} onChange={e=>setForm({...form,extraWorkCost:e.target.value})} placeholder="0" />
              </div>
            </SectionBox>

            <SectionBox title="Complaints" icon="⚠️" color="red">
              <Textarea label="Complaint" value={form.complaints||""} onChange={e=>setForm({...form,complaints:e.target.value})} placeholder="Any issues..." />
              <Textarea label="Action Taken" value={form.actionTaken||""} onChange={e=>setForm({...form,actionTaken:e.target.value})} placeholder="Action taken..." />
            </SectionBox>

            <button onClick={save} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600">{form._id?"Resubmit Daily Report":"Submit Daily Report"}</button>
          </div>
        </Modal>
      )}
      {viewModal&&(
        <Modal title={`${viewModal.siteName} — ${viewModal.date}`} onClose={()=>setViewModal(null)}>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2"><div className="text-xs text-gray-400">By: {viewModal.addedBy}</div><button onClick={()=>editDailyReport(viewModal)} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-blue-100">Edit & Resubmit</button></div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-teal-50 rounded-xl p-2 text-center"><div className="font-black text-teal-700">{viewModal.completedToday||0} sqft</div><div className="text-gray-400">Done</div></div>
              <div className="bg-blue-50 rounded-xl p-2 text-center"><div className="font-black text-blue-700">{CURRENCY}{fmt(viewModal.totalReceived||0)}</div><div className="text-gray-400">Received</div></div>
              <div className="bg-green-50 rounded-xl p-2 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt(viewModal.totalPayments||0)}</div><div className="text-gray-400">Paid Out</div></div>
            </div>
            {viewModal.dayNotes&&<SectionBox title="Notes" icon="📝" color="gray"><div className="text-sm">{viewModal.dayNotes}</div></SectionBox>}
            {(viewModal.workerEntries||[]).length>0&&(
              <SectionBox title="Workers" icon="👷" color="teal">
                {viewModal.workerEntries.map((w,i)=>(
                  <div key={i} className="text-xs flex justify-between py-1 border-b border-teal-100">
                    <span><span className="font-bold">{w.workerName}</span> · <Badge color={w.attendance==="present"?"green":"red"}>{w.attendance}</Badge></span>
                    <span>{w.paymentGiven?`Paid: ${CURRENCY}${fmt(w.paymentGiven)}`:""} {+w.pending>0?`Pending: ${CURRENCY}${fmt(w.pending)}`:""}</span>
                  </div>
                ))}
              </SectionBox>
            )}
            {(viewModal.payments||[]).filter(p=>p.type!=="Worker Payment").length>0&&(
              <SectionBox title="Payments" icon="💰" color="green">
                {(viewModal.payments||[]).filter(p=>p.type!=="Worker Payment").map((p,i)=>(
                  <div key={i} className="flex justify-between text-xs bg-white rounded-lg px-3 py-2 mb-1 border border-green-100">
                    <span><span className="font-bold">{p.type}</span>{p.workerName?` → ${p.workerName}`:""}{p.receivedFrom?` from ${p.receivedFrom}`:""}</span>
                    <span className={`font-black ${p.type==="Site Payment Received"?"text-blue-700":"text-green-700"}`}>{CURRENCY}{fmt(p.amount)}</span>
                  </div>
                ))}
              </SectionBox>
            )}
            {viewModal.materialsUnloaded&&<SectionBox title="Materials" icon="🧱" color="teal"><div className="text-sm">{viewModal.materialsUnloaded} · {viewModal.materialQty}</div></SectionBox>}
            {viewModal.extraWorkDesc&&<SectionBox title="Extra Work" icon="➕" color="orange"><div className="text-sm">{viewModal.extraWorkDesc} · {CURRENCY}{fmt(viewModal.extraWorkCost||0)}</div></SectionBox>}
            {viewModal.complaints&&<SectionBox title="Complaints" icon="⚠️" color="red"><div className="text-sm">{viewModal.complaints}</div></SectionBox>}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── SUPERVISOR OVERVIEW (Admin) ───────────────────────────────────────────────
function SupervisorReports({ allUsers }) {
  const [selectedSupervisor, setSelectedSupervisor] = useState("");
  const [siteWorks, setSiteWorks] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("running");
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchSite, setSearchSite] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [reportView, setReportView] = useState("daily"); // daily | monthly

  const supervisors = (allUsers||[]).filter(u=>u.role==="supervisor");

  useEffect(()=>{
    if (!selectedSupervisor) return;
    setLoading(true);
    Promise.all([api("GET","/sitework"),api("GET","/dailyreport")]).then(([sw,dr])=>{
      setSiteWorks((Array.isArray(sw)?sw:[]).filter(x=>x.addedBy===selectedSupervisor));
      setReports((Array.isArray(dr)?dr:[]).filter(x=>x.addedBy===selectedSupervisor));
      setLoading(false);
    });
  },[selectedSupervisor]);

  const getSiteReports = (site) => {
    let r = reports.filter(r=>r.siteName===site.customerName||r.siteId===site._id);
    if (searchDate) r = r.filter(x=>x.date===searchDate);
    return r.sort((a,b)=>b.date.localeCompare(a.date));
  };

  const filterSites = (list) => list.filter(s=>!searchSite||(s.customerName||"").toLowerCase().includes(searchSite.toLowerCase())||(s.siteLocation||"").toLowerCase().includes(searchSite.toLowerCase()));
  const planned = filterSites(siteWorks.filter(s=>s.status==="pending"));
  const running = filterSites(siteWorks.filter(s=>s.status==="running"));
  const completed = filterSites(siteWorks.filter(s=>s.status==="completed"));

  const approveSite = async (id) => {
    await api("PUT",`/sitework/${id}`,{status:"completed"});
    setSiteWorks(p=>p.map(x=>x._id===id?{...x,status:"completed"}:x));
    if (selectedSite?._id===id) setSelectedSite(s=>({...s,status:"completed"}));
  };

  if (selectedSite) {
    const sr = getSiteReports(selectedSite);
    const allReports = reports.filter(r=>r.siteName===selectedSite.customerName||r.siteId===selectedSite._id).sort((a,b)=>b.date.localeCompare(a.date));
    const dateReport = selectedDate?allReports.find(r=>r.date===selectedDate):null;
    const totalComp = allReports.reduce((a,r)=>a+(+(r.completedToday||0)),0);
    const totalReceived = allReports.reduce((a,r)=>a+(+(r.totalReceived||0)),0);
    const totalPaid = allReports.reduce((a,r)=>a+(+(r.totalPayments||0)),0);
    const allPayments = allReports.flatMap(r=>(r.payments||[]).filter(p=>p.type!=="Worker Payment").map(p=>({...p,date:r.date})));
    const allWorkers = allReports.flatMap(r=>(r.workerEntries||[]).map(w=>({...w,date:r.date})));
    const allMats = allReports.filter(r=>r.materialsUnloaded).map(r=>({name:r.materialsUnloaded,qty:r.materialQty,supplier:r.supplierName,date:r.date}));
    const allExtra = allReports.filter(r=>r.extraWorkDesc).map(r=>({desc:r.extraWorkDesc,qty:r.extraWorkQty,cost:r.extraWorkCost,date:r.date}));

    // Monthly grouping
    const byMonth = allReports.reduce((acc,r)=>{
      const m = r.date?.slice(0,7)||"unknown";
      if (!acc[m]) acc[m]={reports:[],received:0,paid:0,completed:0};
      acc[m].reports.push(r);
      acc[m].received+=+(r.totalReceived||0);
      acc[m].paid+=+(r.totalPayments||0);
      acc[m].completed+=+(r.completedToday||0);
      return acc;
    },{});

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={()=>{setSelectedSite(null);setSelectedDate(null);}} className="text-amber-600 font-bold text-sm">← Back</button>
          {selectedSite.status!=="completed"&&<button onClick={()=>approveSite(selectedSite._id)} className="bg-green-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold">✅ Approve</button>}
        </div>
        <div className="bg-white rounded-2xl border shadow-sm p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-black text-xl">{selectedSite.customerName}</div>
              <div className="text-xs text-gray-400">📍 {selectedSite.siteLocation||"—"} · By: {selectedSite.addedBy}</div>
              <div className="text-xs text-gray-400">🧱 {selectedSite.interlockType||"—"} · {selectedSite.workSize||"—"} sqft</div>
            </div>
            <Badge color={selectedSite.status==="completed"?"green":"amber"}>{selectedSite.status}</Badge>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-blue-50 rounded-xl p-2 text-center"><div className="font-black text-blue-700">{CURRENCY}{fmt(totalReceived)}</div><div className="text-gray-400">Total Received</div></div>
            <div className="bg-red-50 rounded-xl p-2 text-center"><div className="font-black text-red-600">{CURRENCY}{fmt(+(selectedSite.pendingAmount||0))}</div><div className="text-gray-400">Pending</div></div>
            <div className="bg-teal-50 rounded-xl p-2 text-center"><div className="font-black text-teal-700">{totalComp} sqft</div><div className="text-gray-400">Work Done</div></div>
            <div className="bg-green-50 rounded-xl p-2 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt(totalPaid)}</div><div className="text-gray-400">Total Paid Out</div></div>
          </div>
        </div>

        <div className="flex gap-1">
          {["daily","monthly","workers","payments"].map(v=>(
            <button key={v} onClick={()=>setReportView(v)} className={`flex-1 py-1.5 rounded-xl text-xs font-bold ${reportView===v?"bg-amber-500 text-white":"bg-white border border-gray-200 text-gray-600"}`}>
              {v==="daily"?"📅 Daily":v==="monthly"?"📆 Monthly":v==="workers"?"👷 Workers":"💰 Payments"}
            </button>
          ))}
        </div>

        {reportView==="daily"&&(
          <div className="space-y-2">
            <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50" value={selectedDate||""} onChange={e=>setSelectedDate(e.target.value||null)}>
              <option value="">All Dates ({allReports.length} reports)</option>
              {allReports.map(r=><option key={r._id} value={r.date}>{r.date} — {r.completedToday||0} sqft, {CURRENCY}{fmt(r.totalReceived||0)} recd</option>)}
            </select>
            {dateReport?(
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-teal-50 rounded-xl p-2 text-center"><div className="font-black text-teal-700">{dateReport.completedToday||0} sqft</div><div className="text-gray-400">Done</div></div>
                  <div className="bg-blue-50 rounded-xl p-2 text-center"><div className="font-black text-blue-700">{CURRENCY}{fmt(dateReport.totalReceived||0)}</div><div className="text-gray-400">Received</div></div>
                  <div className="bg-green-50 rounded-xl p-2 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt(dateReport.totalPayments||0)}</div><div className="text-gray-400">Paid Out</div></div>
                </div>
                {dateReport.dayNotes&&<SectionBox title="Day Notes" icon="📝" color="gray"><div className="text-sm">{dateReport.dayNotes}</div></SectionBox>}
                {(dateReport.workerEntries||[]).length>0&&(
                  <SectionBox title="Worker Details" icon="👷" color="teal">
                    {dateReport.workerEntries.map((w,i)=>(
                      <div key={i} className="text-xs flex justify-between py-1 border-b border-teal-100">
                        <span><span className="font-bold">{w.workerName}</span> · <Badge color={w.attendance==="present"?"green":"red"}>{w.attendance}</Badge>{w.workDone?` · ${w.workDone}`:""}</span>
                        <span>{w.paymentGiven?`Paid: ${CURRENCY}${fmt(w.paymentGiven)}`:""} {+w.pending>0?`P:${CURRENCY}${fmt(w.pending)}`:""}</span>
                      </div>
                    ))}
                  </SectionBox>
                )}
                {(dateReport.payments||[]).filter(p=>p.type!=="Worker Payment").length>0&&(
                  <SectionBox title="Payments" icon="💰" color="green">
                    {(dateReport.payments||[]).filter(p=>p.type!=="Worker Payment").map((p,i)=>(
                      <div key={i} className="flex justify-between text-xs bg-white rounded-lg px-3 py-2 mb-1 border border-green-100">
                        <span><span className="font-bold">{p.type}</span>{p.workerName?` → ${p.workerName}`:""}{p.receivedFrom?` from ${p.receivedFrom}`:""}</span>
                        <span className={`font-black ${p.type==="Site Payment Received"?"text-blue-700":"text-green-700"}`}>{CURRENCY}{fmt(p.amount)}</span>
                      </div>
                    ))}
                  </SectionBox>
                )}
                {dateReport.materialsUnloaded&&<SectionBox title="Materials" icon="🧱" color="teal"><div className="text-sm">{dateReport.materialsUnloaded} · {dateReport.materialQty} (Supplier: {dateReport.supplierName||"—"})</div></SectionBox>}
                {dateReport.extraWorkDesc&&<SectionBox title="Extra Work" icon="➕" color="orange"><div className="text-sm">{dateReport.extraWorkDesc} · {CURRENCY}{fmt(dateReport.extraWorkCost||0)}</div></SectionBox>}
                {dateReport.complaints&&<SectionBox title="Complaints" icon="⚠️" color="red"><div className="text-sm">{dateReport.complaints}</div>{dateReport.actionTaken&&<div className="text-xs text-gray-400">Action: {dateReport.actionTaken}</div>}</SectionBox>}
              </div>
            ):(
              <div className="space-y-2">
                {allReports.map(r=>(
                  <div key={r._id} onClick={()=>setSelectedDate(r.date)} className="bg-white rounded-xl border p-3 cursor-pointer hover:border-amber-300 transition-all">
                    <div className="flex justify-between items-center">
                      <div><div className="font-black text-sm">📅 {r.date}</div><div className="text-xs text-gray-400">{(r.workerEntries||[]).length} workers · {r.completedToday||0} sqft</div></div>
                      <div className="text-right"><div className="text-xs font-bold text-blue-700">{CURRENCY}{fmt(r.totalReceived||0)} recd</div><div className="text-xs text-green-600">{CURRENCY}{fmt(r.totalPayments||0)} paid</div></div>
                    </div>
                  </div>
                ))}
                {allReports.length===0&&<EmptyState icon="📋" text="No reports" />}
              </div>
            )}
          </div>
        )}

        {reportView==="monthly"&&(
          <div className="space-y-3">
            {Object.entries(byMonth).sort((a,b)=>b[0].localeCompare(a[0])).map(([month,data])=>(
              <div key={month} className="bg-white rounded-2xl border shadow-sm p-4">
                <div className="font-black text-gray-900 mb-2">📆 {month}</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-teal-50 rounded-xl p-2 text-center"><div className="font-black text-teal-700">{data.completed} sqft</div><div className="text-gray-400">Done</div></div>
                  <div className="bg-blue-50 rounded-xl p-2 text-center"><div className="font-black text-blue-700">{CURRENCY}{fmt(data.received)}</div><div className="text-gray-400">Received</div></div>
                  <div className="bg-green-50 rounded-xl p-2 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt(data.paid)}</div><div className="text-gray-400">Paid Out</div></div>
                </div>
                <div className="text-xs text-gray-400 mt-1">{data.reports.length} daily reports</div>
              </div>
            ))}
            {Object.keys(byMonth).length===0&&<EmptyState icon="📆" text="No reports" />}
          </div>
        )}

        {reportView==="workers"&&(
          <div className="space-y-3">
            {Object.entries(allWorkers.reduce((acc,w)=>{
              if (!acc[w.workerName]) acc[w.workerName]={days:0,absent:0,paid:0,pending:0,work:[],entries:[]};
              if (w.attendance==="present") acc[w.workerName].days++;
              else acc[w.workerName].absent++;
              acc[w.workerName].paid+=+(w.paymentGiven||0);
              acc[w.workerName].pending+=+(w.pending||0);
              if (w.workDone) acc[w.workerName].work.push(`${w.date}: ${w.workDone}`);
              acc[w.workerName].entries.push(w);
              return acc;
            },{})).map(([name,d])=>(
              <div key={name} className="bg-white rounded-2xl border shadow-sm p-4">
                <div className="font-black text-gray-900 mb-2">👷 {name}</div>
                <div className="grid grid-cols-4 gap-1 text-xs mb-2">
                  <div className="bg-green-50 rounded-lg p-1.5 text-center"><div className="font-black text-green-700">{d.days}</div><div className="text-gray-400">Present</div></div>
                  <div className="bg-red-50 rounded-lg p-1.5 text-center"><div className="font-black text-red-600">{d.absent}</div><div className="text-gray-400">Absent</div></div>
                  <div className="bg-blue-50 rounded-lg p-1.5 text-center"><div className="font-black text-blue-700">{CURRENCY}{fmt(d.paid)}</div><div className="text-gray-400">Paid</div></div>
                  <div className="bg-amber-50 rounded-lg p-1.5 text-center"><div className="font-black text-amber-700">{CURRENCY}{fmt(d.pending)}</div><div className="text-gray-400">Pending</div></div>
                </div>
                {d.work.length>0&&<div className="text-xs text-gray-400">{d.work.slice(0,3).join(" · ")}</div>}
              </div>
            ))}
            {allWorkers.length===0&&<EmptyState icon="👷" text="No worker data" />}
          </div>
        )}

        {reportView==="payments"&&(
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center"><div className="font-black text-blue-700 text-lg">{CURRENCY}{fmt(allPayments.filter(p=>p.type==="Site Payment Received").reduce((a,p)=>a+(+(p.amount)||0),0))}</div><div className="text-xs text-gray-400">Total Received from Site</div></div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center"><div className="font-black text-green-700 text-lg">{CURRENCY}{fmt(allPayments.filter(p=>p.type!=="Site Payment Received").reduce((a,p)=>a+(+(p.amount)||0),0))}</div><div className="text-xs text-gray-400">Total Paid Out</div></div>
            </div>
            {["Site Payment Received","Material Payment","Equipment Payment","Other Expense"].map(type=>{
              const pts = allPayments.filter(p=>p.type===type);
              if (pts.length===0) return null;
              return (
                <SectionBox key={type} title={type} icon={type==="Site Payment Received"?"💰":"💸"} color={type==="Site Payment Received"?"blue":"green"}>
                  {pts.map((p,i)=>(
                    <div key={i} className="text-xs flex justify-between py-1 border-b border-gray-100">
                      <span>{p.date}{p.workerName?` · ${p.workerName}`:""}{p.receivedFrom?` · ${p.receivedFrom}`:""} · {p.mode}</span>
                      <span className="font-black">{CURRENCY}{fmt(p.amount)}</span>
                    </div>
                  ))}
                  <div className="text-xs font-black text-right mt-1">Total: {CURRENCY}{fmt(pts.reduce((a,p)=>a+(+(p.amount)||0),0))}</div>
                </SectionBox>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-gray-900">🔍 Supervisor Overview</h2>
      <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-2">
        <Select label="Select Supervisor" value={selectedSupervisor} options={[{value:"",label:"-- Select Supervisor --"},...supervisors.map(s=>({value:s.name,label:`${s.name} (@${s.username})`}))]} onChange={e=>{setSelectedSupervisor(e.target.value);setSelectedSite(null);}} />
      </div>
      {!selectedSupervisor&&<EmptyState icon="👆" text="Select a supervisor to view their work" />}
      {loading&&<Loader />}
      {selectedSupervisor&&!loading&&(
        <>
          <div className="bg-white rounded-2xl border shadow-sm p-3 space-y-2">
            <input value={searchSite} onChange={e=>setSearchSite(e.target.value)} placeholder="🔍 Search site name or location..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-400" />
            <div className="flex gap-2 items-center">
              <Input label="Filter by date" type="date" value={searchDate} onChange={e=>setSearchDate(e.target.value)} />
              {(searchSite||searchDate)&&<button onClick={()=>{setSearchSite("");setSearchDate("");}} className="text-xs text-amber-600 font-bold mt-5 whitespace-nowrap">✕ Clear</button>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 border rounded-xl p-2 text-center"><div className="font-black">{planned.length}</div><div className="text-xs text-gray-400">Planned</div></div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-center"><div className="font-black text-amber-700">{running.length}</div><div className="text-xs text-gray-400">Running</div></div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-2 text-center"><div className="font-black text-green-700">{completed.length}</div><div className="text-xs text-gray-400">Completed</div></div>
          </div>
          <div className="flex gap-1">
            {[{id:"running",label:"Running"},{id:"planned",label:"Planned"},{id:"completed",label:"Completed"}].map(t=>(
              <button key={t.id} onClick={()=>setActiveTab(t.id)} className={`flex-1 py-2 rounded-xl text-xs font-bold ${activeTab===t.id?"bg-amber-500 text-white":"bg-white border border-gray-200 text-gray-600"}`}>{t.label}</button>
            ))}
          </div>
          <div className="space-y-3">
            {activeTab==="running"&&(running.length===0?<EmptyState icon="🔄" text="No running sites"/>:running.map(s=>{
              const sr=reports.filter(r=>r.siteName===s.customerName||r.siteId===s._id);
              const comp=sr.reduce((a,r)=>a+(+(r.completedToday||0)),0);
              const recv=sr.reduce((a,r)=>a+(+(r.totalReceived||0)),0);
              return (<div key={s._id} onClick={()=>setSelectedSite(s)} className="bg-white rounded-2xl border shadow-sm p-4 cursor-pointer hover:border-amber-300 transition-all">
                <div className="flex items-start justify-between"><div><div className="font-black">{s.customerName}</div><div className="text-xs text-gray-400">📍 {s.siteLocation||"—"}</div></div>
                <button onClick={e=>{e.stopPropagation();approveSite(s._id);}} className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-bold">✅ Approve</button></div>
                <div className="mt-2 grid grid-cols-3 gap-1 text-xs">
                  <div className="bg-teal-50 rounded-lg p-1.5 text-center"><div className="font-black text-teal-700">{comp}/{s.workSize||"-"} sqft</div><div className="text-gray-400">Progress</div></div>
                  <div className="bg-blue-50 rounded-lg p-1.5 text-center"><div className="font-black text-blue-700">{CURRENCY}{fmt(recv)}</div><div className="text-gray-400">Received</div></div>
                  <div className="bg-red-50 rounded-lg p-1.5 text-center"><div className="font-black text-red-600">{CURRENCY}{fmt(+(s.pendingAmount||0))}</div><div className="text-gray-400">Pending</div></div>
                </div>
              </div>);
            }))}
            {activeTab==="planned"&&(planned.length===0?<EmptyState icon="📋" text="No planned sites"/>:planned.map(s=>(
              <div key={s._id} onClick={()=>setSelectedSite(s)} className="bg-white rounded-2xl border shadow-sm p-4 cursor-pointer hover:border-amber-300 transition-all">
                <div className="font-black">{s.customerName}</div><div className="text-xs text-gray-400">📍 {s.siteLocation||"—"} · 📅 {s.startDate||"—"}</div>
              </div>
            )))}
            {activeTab==="completed"&&(completed.length===0?<EmptyState icon="✅" text="No completed sites"/>:completed.map(s=>{
              const sr=reports.filter(r=>r.siteName===s.customerName||r.siteId===s._id);
              const recv=sr.reduce((a,r)=>a+(+(r.totalReceived||0)),0);
              const paid=sr.reduce((a,r)=>a+(+(r.totalPayments||0)),0);
              return (<div key={s._id} onClick={()=>setSelectedSite(s)} className="bg-white rounded-2xl border shadow-sm p-4 cursor-pointer hover:border-amber-300 transition-all">
                <div className="font-black">{s.customerName}</div>
                <div className="text-xs text-gray-400">📍 {s.siteLocation||"—"} · ✅ {s.endDate||"—"}</div>
                <div className="mt-1 grid grid-cols-3 gap-1 text-xs">
                  <div className="bg-blue-50 rounded-lg p-1.5 text-center"><div className="font-black text-blue-700">{CURRENCY}{fmt(recv)}</div><div className="text-gray-400">Received</div></div>
                  <div className="bg-green-50 rounded-lg p-1.5 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt(paid)}</div><div className="text-gray-400">Paid Out</div></div>
                  <div className="bg-red-50 rounded-lg p-1.5 text-center"><div className="font-black text-red-600">{CURRENCY}{fmt(+(s.pendingAmount||0))}</div><div className="text-gray-400">Pending</div></div>
                </div>
              </div>);
            }))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── REPORTS (Admin) ──────────────────────────────────────────────────────────
function Reports({ production, sales, stock, raw, siteWorks }) {
  const [dailyReports, setDailyReports] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [allSiteWorks, setAllSiteWorks] = useState([]);
  const [customerReports, setCustomerReports] = useState({ customers: [], itemWise: [] });
  const [supplierReports, setSupplierReports] = useState({ suppliers: [], materialWise: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("sites");
  const [reportSubTab, setReportSubTab] = useState("all");
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [searchSite, setSearchSite] = useState("");
  const [searchWorker, setSearchWorker] = useState("");
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchSupplier, setSearchSupplier] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(()=>{
    Promise.all([
      api("GET","/dailyreport"), api("GET","/workers"), api("GET","/sitework"),
      api("GET","/customers/reports"), api("GET","/suppliers/reports"),
    ]).then(([dr,w,sw,cr,sr])=>{
      setDailyReports(Array.isArray(dr)?dr:[]);
      setWorkers(Array.isArray(w)?w:[]);
      setAllSiteWorks(Array.isArray(sw)?sw:[]);
      setCustomerReports(cr?.customers ? cr : { customers: [], itemWise: cr?.itemWise || [] });
      setSupplierReports(sr?.suppliers ? sr : { suppliers: [], materialWise: sr?.materialWise || [] });
      setLoading(false);
    });
  },[]);

  const loadCustomerReports = async (type) => {
    const data = await api("GET", `/customers/reports${type ? `?type=${type}` : ""}`);
    if (data?.customers) setCustomerReports(data);
  };
  const loadSupplierReports = async (type) => {
    const data = await api("GET", `/suppliers/reports${type ? `?type=${type}` : ""}`);
    if (data?.suppliers) setSupplierReports(data);
  };

  const filterByDate = (r) => {
    if (fromDate && r.date<fromDate) return false;
    if (toDate && r.date>toDate) return false;
    return true;
  };

  if (loading) return <Loader />;

  const filteredDailyReports = dailyReports.filter(filterByDate);

  // Site Report
  if (selectedSite) {
    const sr = dailyReports.filter(r=>r.siteName===selectedSite.customerName||r.siteId===selectedSite._id).filter(filterByDate).sort((a,b)=>b.date.localeCompare(a.date));
    const allPayments = sr.flatMap(r=>(r.payments||[]).filter(p=>p.type!=="Worker Payment").map(p=>({...p,date:r.date})));
    const allWorkers = sr.flatMap(r=>(r.workerEntries||[]).map(w=>({...w,date:r.date})));
    const totalComp = sr.reduce((a,r)=>a+(+(r.completedToday||0)),0);
    const totalReceived = sr.reduce((a,r)=>a+(+(r.totalReceived||0)),0);
    const totalPaidOut = sr.reduce((a,r)=>a+(+(r.totalPayments||0)),0);
    const byMonth = sr.reduce((acc,r)=>{
      const m=r.date?.slice(0,7)||"-";
      if (!acc[m]) acc[m]={recv:0,paid:0,comp:0,count:0};
      acc[m].recv+=+(r.totalReceived||0); acc[m].paid+=+(r.totalPayments||0);
      acc[m].comp+=+(r.completedToday||0); acc[m].count++;
      return acc;
    },{});

    return (
      <div className="space-y-4">
        <button onClick={()=>setSelectedSite(null)} className="text-amber-600 font-bold text-sm">← Back to Sites</button>
        <div className="bg-white rounded-2xl border shadow-sm p-4">
          <div className="font-black text-xl">{selectedSite.customerName}</div>
          <div className="text-xs text-gray-400">📍 {selectedSite.siteLocation||"—"} · By: {selectedSite.addedBy||"—"}</div>
          <div className="text-xs text-gray-400">🧱 {selectedSite.interlockType||"—"} · {selectedSite.workSize||"—"} sqft total</div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-teal-50 rounded-xl p-2 text-center"><div className="font-black text-teal-700">{totalComp} sqft</div><div className="text-gray-400">Work Done</div></div>
            <div className="bg-blue-50 rounded-xl p-2 text-center"><div className="font-black text-blue-700">{CURRENCY}{fmt(totalReceived)}</div><div className="text-gray-400">Total Received</div></div>
            <div className="bg-green-50 rounded-xl p-2 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt(totalPaidOut)}</div><div className="text-gray-400">Total Paid Out</div></div>
            <div className="bg-red-50 rounded-xl p-2 text-center"><div className="font-black text-red-600">{CURRENCY}{fmt(+(selectedSite.pendingAmount||0))}</div><div className="text-gray-400">Pending</div></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input label="From Date" type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} />
          <Input label="To Date" type="date" value={toDate} onChange={e=>setToDate(e.target.value)} />
        </div>
        {Object.entries(byMonth).sort((a,b)=>b[0].localeCompare(a[0])).map(([month,data])=>(
          <SectionBox key={month} title={`📆 ${month}`} icon="" color="gray">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center"><div className="font-black text-teal-700">{data.comp} sqft</div><div className="text-gray-400">Done</div></div>
              <div className="text-center"><div className="font-black text-blue-700">{CURRENCY}{fmt(data.recv)}</div><div className="text-gray-400">Received</div></div>
              <div className="text-center"><div className="font-black text-green-700">{CURRENCY}{fmt(data.paid)}</div><div className="text-gray-400">Paid Out</div></div>
            </div>
          </SectionBox>
        ))}
        {allWorkers.length>0&&(
          <SectionBox title="Worker Summary" icon="👷" color="teal">
            {Object.entries(allWorkers.reduce((acc,w)=>{
              if (!acc[w.workerName]) acc[w.workerName]={days:0,paid:0,pending:0};
              if (w.attendance==="present") acc[w.workerName].days++;
              acc[w.workerName].paid+=+(w.paymentGiven||0);
              acc[w.workerName].pending+=+(w.pending||0);
              return acc;
            },{})).map(([name,d])=>(
              <div key={name} className="text-xs flex justify-between py-1 border-b border-teal-100">
                <span className="font-bold">{name} ({d.days} days)</span>
                <span>Paid: {CURRENCY}{fmt(d.paid)} {d.pending>0?`· P:${CURRENCY}${fmt(d.pending)}`:""}</span>
              </div>
            ))}
          </SectionBox>
        )}
        {allPayments.filter(p=>p.type==="Site Payment Received").length>0&&(
          <SectionBox title="Payments Received" icon="💰" color="blue">
            {allPayments.filter(p=>p.type==="Site Payment Received").map((p,i)=>(
              <div key={i} className="text-xs flex justify-between py-1 border-b border-blue-100">
                <span>{p.date} · {p.receivedFrom||"—"} · {p.mode}</span>
                <span className="font-black text-blue-700">{CURRENCY}{fmt(p.amount)}</span>
              </div>
            ))}
          </SectionBox>
        )}
        {sr.length===0&&<EmptyState icon="📋" text="No reports for this period" />}
        {sr.map(r=>(
          <div key={r._id} className="bg-white rounded-xl border p-3">
            <div className="flex justify-between"><div className="font-black text-sm">📅 {r.date}</div><div className="text-xs"><span className="text-blue-700">{CURRENCY}{fmt(r.totalReceived||0)}</span> / <span className="text-green-600">{CURRENCY}{fmt(r.totalPayments||0)}</span></div></div>
            <div className="text-xs text-gray-400">{r.completedToday||0} sqft · {(r.workerEntries||[]).length} workers</div>
          </div>
        ))}
      </div>
    );
  }

  // Worker Report
  if (selectedWorker) {
    const workerReports = dailyReports.filter(r=>(r.workerEntries||[]).some(w=>w.workerName===selectedWorker.name)).filter(filterByDate);
    const allEntries = workerReports.flatMap(r=>(r.workerEntries||[]).filter(w=>w.workerName===selectedWorker.name).map(w=>({...w,date:r.date,siteName:r.siteName})));
    const totalDays = allEntries.filter(e=>e.attendance==="present").length;
    const totalPaid = allEntries.reduce((a,e)=>a+(+(e.paymentGiven||0)),0);
    const totalPending = allEntries.reduce((a,e)=>a+(+(e.pending||0)),0);
    const byMonth = allEntries.reduce((acc,e)=>{
      const m=e.date?.slice(0,7)||"-";
      if (!acc[m]) acc[m]={days:0,paid:0,pending:0,work:[]};
      if (e.attendance==="present") acc[m].days++;
      acc[m].paid+=+(e.paymentGiven||0);
      acc[m].pending+=+(e.pending||0);
      if (e.workDone) acc[m].work.push(e.workDone);
      return acc;
    },{});

    return (
      <div className="space-y-4">
        <button onClick={()=>setSelectedWorker(null)} className="text-amber-600 font-bold text-sm">← Back to Workers</button>
        <div className="bg-white rounded-2xl border shadow-sm p-4">
          <div className="font-black text-xl">👷 {selectedWorker.name}</div>
          <div className="text-xs text-gray-400">{selectedWorker.role} · {selectedWorker.paymentType||"day"} · {CURRENCY}{fmt(selectedWorker.rateAmount||0)}/unit</div>
          {selectedWorker.phone&&<div className="text-xs text-gray-400">📞 {selectedWorker.phone}</div>}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center"><div className="font-black text-blue-700 text-lg">{totalDays}</div><div className="text-xs text-gray-400">Work Days</div></div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt(totalPaid)}</div><div className="text-xs text-gray-400">Paid</div></div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center"><div className="font-black text-red-600">{CURRENCY}{fmt(totalPending)}</div><div className="text-xs text-gray-400">Pending</div></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input label="From Date" type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} />
          <Input label="To Date" type="date" value={toDate} onChange={e=>setToDate(e.target.value)} />
        </div>
        {Object.entries(byMonth).sort((a,b)=>b[0].localeCompare(a[0])).map(([month,data])=>(
          <SectionBox key={month} title={`📆 ${month}`} icon="" color="gray">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center"><div className="font-black text-blue-700">{data.days} days</div><div className="text-gray-400">Present</div></div>
              <div className="text-center"><div className="font-black text-green-700">{CURRENCY}{fmt(data.paid)}</div><div className="text-gray-400">Paid</div></div>
              <div className="text-center"><div className="font-black text-red-600">{CURRENCY}{fmt(data.pending)}</div><div className="text-gray-400">Pending</div></div>
            </div>
          </SectionBox>
        ))}
        <div className="text-xs font-black text-gray-500 uppercase">📅 Daily Attendance</div>
        {allEntries.sort((a,b)=>b.date.localeCompare(a.date)).map((e,i)=>(
          <div key={i} className="bg-white rounded-xl border p-3 text-xs flex justify-between items-center">
            <div><div className="font-bold">{e.date}</div><div className="text-gray-400">{e.siteName} {e.workDone?`· ${e.workDone}`:""}</div></div>
            <div className="text-right">
              <Badge color={e.attendance==="present"?"green":"red"}>{e.attendance}</Badge>
              {+e.paymentGiven>0&&<div className="text-green-700 font-bold mt-0.5">{CURRENCY}{fmt(e.paymentGiven)}</div>}
              {+e.pending>0&&<div className="text-red-500 text-xs">P:{CURRENCY}{fmt(e.pending)}</div>}
            </div>
          </div>
        ))}
        {allEntries.length===0&&<EmptyState icon="📋" text="No records for this period" />}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-gray-900">📈 Reports</h2>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {[{id:"sites",label:"🏗️ Sites"},{id:"workers",label:"👷 Workers"},{id:"financial",label:"💰 Financial"},{id:"customers",label:"👤 Customers"},{id:"suppliers",label:"🏪 Suppliers"}].map(t=>(
          <button key={t.id} onClick={()=>{setTab(t.id);setReportSubTab("all");}} className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold ${tab===t.id?"bg-amber-500 text-white":"bg-white border border-gray-200 text-gray-600"}`}>{t.label}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input label="From Date" type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} />
        <Input label="To Date" type="date" value={toDate} onChange={e=>setToDate(e.target.value)} />
      </div>

      {tab==="sites"&&(
        <div className="space-y-3">
          <input value={searchSite} onChange={e=>setSearchSite(e.target.value)} placeholder="🔍 Search site..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" />
          {allSiteWorks.filter(s=>!searchSite||(s.customerName||"").toLowerCase().includes(searchSite.toLowerCase())).map(s=>{
            const sr = filteredDailyReports.filter(r=>r.siteName===s.customerName||r.siteId===s._id);
            const recv = sr.reduce((a,r)=>a+(+(r.totalReceived||0)),0);
            const comp = sr.reduce((a,r)=>a+(+(r.completedToday||0)),0);
            return (
              <div key={s._id} onClick={()=>setSelectedSite(s)} className="bg-white rounded-2xl border shadow-sm p-4 cursor-pointer hover:border-amber-300 transition-all">
                <div className="flex items-start justify-between">
                  <div><div className="font-black text-gray-900">{s.customerName}</div><div className="text-xs text-gray-400">📍 {s.siteLocation||"—"} · By: {s.addedBy||"—"}</div></div>
                  <Badge color={s.status==="completed"?"green":s.status==="running"?"amber":"gray"}>{s.status}</Badge>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1 text-xs">
                  <div className="bg-teal-50 rounded-lg p-1.5 text-center"><div className="font-black text-teal-700">{comp} sqft</div><div className="text-gray-400">Done</div></div>
                  <div className="bg-blue-50 rounded-lg p-1.5 text-center"><div className="font-black text-blue-700">{CURRENCY}{fmt(recv)}</div><div className="text-gray-400">Received</div></div>
                  <div className="bg-red-50 rounded-lg p-1.5 text-center"><div className="font-black text-red-600">{CURRENCY}{fmt(+(s.pendingAmount||0))}</div><div className="text-gray-400">Pending</div></div>
                </div>
              </div>
            );
          })}
          {allSiteWorks.length===0&&<EmptyState icon="🏗️" text="No sites found" />}
        </div>
      )}

      {tab==="workers"&&(
        <div className="space-y-3">
          <input value={searchWorker} onChange={e=>setSearchWorker(e.target.value)} placeholder="🔍 Search worker..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" />
          {workers.filter(w=>!searchWorker||w.name.toLowerCase().includes(searchWorker.toLowerCase())).map(w=>{
            const entries = filteredDailyReports.flatMap(r=>(r.workerEntries||[]).filter(e=>e.workerName===w.name));
            const days = entries.filter(e=>e.attendance==="present").length;
            const paid = entries.reduce((a,e)=>a+(+(e.paymentGiven||0)),0);
            const pending = entries.reduce((a,e)=>a+(+(e.pending||0)),0);
            return (
              <div key={w._id} onClick={()=>setSelectedWorker(w)} className="bg-white rounded-2xl border shadow-sm p-4 cursor-pointer hover:border-amber-300 transition-all">
                <div className="flex items-center justify-between">
                  <div><div className="font-black text-gray-900">{w.name}</div><div className="text-xs text-gray-400">{w.role} · {w.paymentType||"day"} · {CURRENCY}{fmt(w.rateAmount||0)}</div></div>
                  <span className="text-gray-300 text-xl">›</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1 text-xs">
                  <div className="bg-blue-50 rounded-lg p-1.5 text-center"><div className="font-black text-blue-700">{days}</div><div className="text-gray-400">Days</div></div>
                  <div className="bg-green-50 rounded-lg p-1.5 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt(paid)}</div><div className="text-gray-400">Paid</div></div>
                  <div className="bg-red-50 rounded-lg p-1.5 text-center"><div className="font-black text-red-600">{CURRENCY}{fmt(pending)}</div><div className="text-gray-400">Pending</div></div>
                </div>
              </div>
            );
          })}
          {workers.length===0&&<EmptyState icon="👷" text="No workers found" />}
        </div>
      )}

      {tab==="financial"&&(
        <div className="space-y-3">
          {(()=>{
            const totalReceived = filteredDailyReports.reduce((a,r)=>a+(+(r.totalReceived||0)),0);
            const totalPaid = filteredDailyReports.reduce((a,r)=>a+(+(r.totalPayments||0)),0);
            const totalSales = sales.reduce((a,s)=>a+(+(s.total)||0),0);
            return (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Total Received" value={`${CURRENCY}${fmt(totalReceived)}`} icon="💰" color="blue" />
                  <StatCard label="Total Paid Out" value={`${CURRENCY}${fmt(totalPaid)}`} icon="💸" color="green" />
                  <StatCard label="Pending Payments" value={`${CURRENCY}${fmt(allSiteWorks.reduce((a,s)=>a+(+(s.pendingAmount)||0),0))}`} icon="⏳" color="red" />
                  <StatCard label="Stock Sales" value={`${CURRENCY}${fmt(totalSales)}`} icon="🛒" color="purple" />
                </div>
                <div className="bg-white rounded-2xl border shadow-sm p-4">
                  <div className="font-black text-gray-900 mb-3">📊 Site Summary</div>
                  {allSiteWorks.slice(0,5).map(s=>{
                    const sr=filteredDailyReports.filter(r=>r.siteName===s.customerName||r.siteId===s._id);
                    const recv=sr.reduce((a,r)=>a+(+(r.totalReceived||0)),0);
                    return <div key={s._id} className="flex justify-between py-2 border-b border-gray-50 text-sm"><span className="font-bold">{s.customerName}</span><span className="text-blue-700 font-bold">{CURRENCY}{fmt(recv)}</span></div>;
                  })}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {tab==="customers"&&(
        <div className="space-y-3">
          <div className="flex gap-1 flex-wrap">
            {[{id:"all",label:"All Customers"},{id:"pending",label:"Pending"},{id:"paid",label:"Fully Paid"},{id:"items",label:"Item-wise"}].map(t=>(
              <button key={t.id} onClick={()=>{setReportSubTab(t.id); if(t.id!=="items") loadCustomerReports(t.id==="all"?"":t.id);}} className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${reportSubTab===t.id?"bg-amber-500 text-white border-amber-500":"bg-white text-gray-600"}`}>{t.label}</button>
            ))}
          </div>
          <input value={searchCustomer} onChange={e=>setSearchCustomer(e.target.value)} placeholder="🔍 Search customer..." className="w-full border rounded-xl px-3 py-2 text-sm bg-white" />
          {reportSubTab==="items" ? (
            <SectionBox title="Item-wise Sales" icon="📦" color="blue">
              {(customerReports.itemWise||[]).map((it,i)=>(
                <div key={i} className="flex justify-between py-2 border-b border-gray-100 text-sm">
                  <span className="font-bold">{it.item}</span>
                  <span>{fmt(it.quantity)} {it.unit} · {CURRENCY}{fmt(it.amount)}</span>
                </div>
              ))}
              {(customerReports.itemWise||[]).length===0&&<EmptyState icon="📦" text="No sales data" />}
            </SectionBox>
          ) : (
            (customerReports.customers||[]).filter(c=>!searchCustomer||(c.name||"").toLowerCase().includes(searchCustomer.toLowerCase())||(c.mobile||"").includes(searchCustomer)).map(c=>(
              <div key={c._id||c.mobile} className="bg-white rounded-2xl border shadow-sm p-4">
                <div className="font-black">{c.name}</div>
                <div className="text-xs text-gray-400">📱 {c.mobile}</div>
                <div className="mt-2 grid grid-cols-3 gap-1 text-xs">
                  <div className="bg-green-50 rounded-lg p-1.5 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt(c.totalSalesAmount||0)}</div><div className="text-gray-400">Sales</div></div>
                  <div className="bg-teal-50 rounded-lg p-1.5 text-center"><div className="font-black text-teal-700">{CURRENCY}{fmt(c.totalPaid||0)}</div><div className="text-gray-400">Paid</div></div>
                  <div className="bg-red-50 rounded-lg p-1.5 text-center"><div className="font-black text-red-600">{CURRENCY}{fmt(c.totalPending||0)}</div><div className="text-gray-400">Pending</div></div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab==="suppliers"&&(
        <div className="space-y-3">
          <div className="flex gap-1 flex-wrap">
            {[{id:"all",label:"All Suppliers"},{id:"pending",label:"Pending"},{id:"paid",label:"Fully Paid"},{id:"materials",label:"Material-wise"}].map(t=>(
              <button key={t.id} onClick={()=>{setReportSubTab(t.id); if(t.id!=="materials") loadSupplierReports(t.id==="all"?"":t.id);}} className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${reportSubTab===t.id?"bg-teal-500 text-white border-teal-500":"bg-white text-gray-600"}`}>{t.label}</button>
            ))}
          </div>
          <input value={searchSupplier} onChange={e=>setSearchSupplier(e.target.value)} placeholder="🔍 Search supplier..." className="w-full border rounded-xl px-3 py-2 text-sm bg-white" />
          {reportSubTab==="materials" ? (
            <SectionBox title="Material-wise Purchases" icon="🧱" color="teal">
              {(supplierReports.materialWise||[]).map((m,i)=>(
                <div key={i} className="flex justify-between py-2 border-b border-gray-100 text-sm">
                  <span className="font-bold">{m.material}</span>
                  <span>{fmt(m.quantity)} {m.unit} · {CURRENCY}{fmt(m.amount)}</span>
                </div>
              ))}
              {(supplierReports.materialWise||[]).length===0&&<EmptyState icon="🧱" text="No purchase data" />}
            </SectionBox>
          ) : (
            (supplierReports.suppliers||[]).filter(s=>!searchSupplier||(s.name||"").toLowerCase().includes(searchSupplier.toLowerCase())||(s.mobile||"").includes(searchSupplier)).map(s=>(
              <div key={s._id||s.name} className="bg-white rounded-2xl border shadow-sm p-4">
                <div className="font-black">{s.name}</div>
                <div className="text-xs text-gray-400">📱 {s.mobile||"—"}</div>
                <div className="mt-2 grid grid-cols-3 gap-1 text-xs">
                  <div className="bg-red-50 rounded-lg p-1.5 text-center"><div className="font-black text-red-700">{CURRENCY}{fmt(s.totalPurchaseAmount||0)}</div><div className="text-gray-400">Purchases</div></div>
                  <div className="bg-teal-50 rounded-lg p-1.5 text-center"><div className="font-black text-teal-700">{CURRENCY}{fmt(s.totalPaid||0)}</div><div className="text-gray-400">Paid</div></div>
                  <div className="bg-amber-50 rounded-lg p-1.5 text-center"><div className="font-black text-amber-700">{CURRENCY}{fmt(s.totalPending||0)}</div><div className="text-gray-400">Pending</div></div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── WORKERS ──────────────────────────────────────────────────────────────────
function Workers({ user }) {
  const [workers, setWorkers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [siteReports, setSiteReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const emptyForm = { name:"", phone:"", address:"", role:"Labourer", workerCategory:"Site Worker", workerType:"Site Worker", status:"Active", workLocationType:"Outside Site", paymentType:"Per Day", customPaymentType:"", rateAmount:"" };
  const [workerForm, setWorkerForm] = useState(emptyForm);
  const canEdit = isAdminLike(user.role);

  useEffect(()=>{
    Promise.all([api("GET","/workers"),api("GET","/workerpayments"),api("GET","/workerreport")]).then(([w,p,sr])=>{
      setWorkers(Array.isArray(w)?w:[]);
      setPayments(Array.isArray(p)?p:[]);
      setSiteReports(Array.isArray(sr)?sr:[]);
      setLoading(false);
    });
  },[]);

  const addWorker = async () => {
    if (!workerForm.name) return;
    const type = workerForm.workerType || workerForm.workerCategory || "Site Worker";
    const w = await api("POST","/workers",{...workerForm,workerType:type,workerCategory:type,rateAmount:+workerForm.rateAmount||0,addedBy:user.name});
    if (w._id) { setWorkers(p=>[...p,w]); setAddModal(false); setWorkerForm(emptyForm); }
  };

  const saveEdit = async () => {
    const type = editModal.workerType || editModal.workerCategory || "Site Worker";
    const saved = await api("PUT",`/workers/${editModal._id}`,{...editModal,workerType:type,workerCategory:type});
    setWorkers(p=>p.map(x=>x._id===editModal._id?saved:x));
    if (selectedWorker?._id===editModal._id) setSelectedWorker({...selectedWorker,...editModal});
    setEditModal(null);
  };

  const del = async (id) => {
    if (!window.confirm("Delete worker?")) return;
    await api("DELETE",`/workers/${id}`);
    setWorkers(p=>p.filter(x=>x._id!==id));
    setSelectedWorker(null);
  };

  const wPayments = (n) => payments.filter(p=>p.workerName===n).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  const totalPaid = (n) => wPayments(n).reduce((a,p)=>a+(+(p.amount)||0),0);
  const totalSqft = (n) => siteReports.filter(r=>r.workerName===n).reduce((a,r)=>a+(+(r.totalWorkingArea)||0),0);
  const totalDays = (n) => new Set(siteReports.filter(r=>r.workerName===n).map(r=>r.startingDate).filter(Boolean)).size;

  if (loading) return <Loader />;

  if (selectedWorker) {
    const wp = wPayments(selectedWorker.name);
    const sqft = totalSqft(selectedWorker.name);
    const days = totalDays(selectedWorker.name);
    const paid = totalPaid(selectedWorker.name);
    const sites = siteReports.filter(r=>r.workerName===selectedWorker.name);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={()=>setSelectedWorker(null)} className="text-amber-600 font-bold text-sm">← Back</button>
          {canEdit&&<div className="flex gap-1"><button onClick={()=>setEditModal({...selectedWorker})} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold">✏️</button><button onClick={()=>del(selectedWorker._id)} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold">🗑️</button></div>}
        </div>
        <div className="bg-white rounded-2xl border shadow-sm p-4">
          <div className="font-black text-xl text-gray-900 mb-2">👷 {selectedWorker.name}</div>
          <div className="flex gap-1 mb-2"><Badge color={workerTypeOf(selectedWorker)==="Production Worker"?"purple":"teal"}>{workerTypeOf(selectedWorker)}</Badge><Badge color={isActiveWorker(selectedWorker)?"green":"red"}>{selectedWorker.status||"Active"}</Badge></div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><div className="text-xs text-gray-400">Role</div><div className="font-bold">{selectedWorker.role}</div></div>
            <div><div className="text-xs text-gray-400">Phone</div><div className="font-bold">{selectedWorker.phone||"—"}</div></div>
            <div className="col-span-2"><div className="text-xs text-gray-400">Address</div><div className="font-bold">{selectedWorker.address||"—"}</div></div>
            <div><div className="text-xs text-gray-400">Payment Type</div><div className="font-bold">{selectedWorker.paymentType||"Per Day"}</div></div>
            <div><div className="text-xs text-gray-400">Rate</div><div className="font-bold text-amber-700">{CURRENCY}{fmt(selectedWorker.rateAmount||0)}</div></div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-2 text-center"><div className="text-lg font-black text-blue-700">{days}</div><div className="text-xs text-gray-400">Work Days</div></div>
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-2 text-center"><div className="text-lg font-black text-teal-700">{fmt(sqft)}</div><div className="text-xs text-gray-400">sqft</div></div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-2 text-center"><div className="text-lg font-black text-green-700">{CURRENCY}{fmt(paid)}</div><div className="text-xs text-gray-400">Paid</div></div>
        </div>
        <div className="font-black text-gray-800 mb-2">💸 Payment History</div>
        {wp.length===0&&<EmptyState icon="💸" text="No payments recorded" />}
        {wp.map((p,i)=><div key={i} className="bg-white rounded-xl border shadow-sm p-3 mb-2 flex justify-between items-center"><div><div className="font-bold text-sm">{CURRENCY}{fmt(+(p.amount)||0)}</div><div className="text-xs text-gray-400">📅 {p.date}{p.note?` · ${p.note}`:""}</div></div><Badge color="green">Paid</Badge></div>)}
        <div className="font-black text-gray-800 mb-2">🏗️ Site Work</div>
        {sites.length===0&&<EmptyState icon="🏗️" text="No site reports" />}
        {sites.map(r=><div key={r._id} className="bg-white rounded-xl border shadow-sm p-3 mb-2 flex justify-between"><div><div className="font-bold text-sm">{r.siteName||"—"}</div><div className="text-xs text-gray-400">📅 {r.startingDate}</div></div><div className="text-right"><div className="font-black text-teal-700 text-sm">{r.totalWorkingArea||"0"} sqft</div><div className="text-xs text-gray-400">{CURRENCY}{fmt(+(r.totalAmount)||0)}</div></div></div>)}
        {editModal&&<Modal title="Edit Worker" onClose={()=>setEditModal(null)}>
          <div className="space-y-3">
            <Input label="Name" value={editModal.name||""} onChange={e=>setEditModal({...editModal,name:e.target.value})} />
            <Input label="Phone" type="tel" value={editModal.phone||""} onChange={e=>setEditModal({...editModal,phone:e.target.value})} />
            <Input label="Address" value={editModal.address||""} onChange={e=>setEditModal({...editModal,address:e.target.value})} />
            <Select label="Role" value={editModal.role||"Labourer"} options={["Labourer","Mason","Helper","Supervisor","Driver","Other"]} onChange={e=>setEditModal({...editModal,role:e.target.value})} />
            <Select label="Worker Type" value={editModal.workerType||editModal.workerCategory||"Site Worker"} options={["Site Worker","Production Worker"]} onChange={e=>setEditModal({...editModal,workerType:e.target.value,workerCategory:e.target.value})} />
            <Select label="Status" value={editModal.status||"Active"} options={["Active","Inactive"]} onChange={e=>setEditModal({...editModal,status:e.target.value})} />
            <Select label="Payment Type" value={editModal.paymentType||"Per Day"} options={["Per Day","Per Hour","Per Piece","Per Square Feet","Per Square Meter","Other"]} onChange={e=>setEditModal({...editModal,paymentType:e.target.value})} />
            <Input label={`Rate (${CURRENCY})`} type="number" value={editModal.rateAmount||""} onChange={e=>setEditModal({...editModal,rateAmount:+e.target.value})} />
            <button onClick={saveEdit} className="w-full bg-blue-500 text-white py-2.5 rounded-xl font-bold">Save Changes</button>
          </div>
        </Modal>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">👷 Workers</h2>
        {canEdit&&<button onClick={()=>setAddModal(true)} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ Add</button>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white border rounded-xl p-2 text-center"><div className="font-black">{workers.length}</div><div className="text-xs text-gray-400">Workers</div></div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-2 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt(payments.reduce((a,p)=>a+(+(p.amount)||0),0))}</div><div className="text-xs text-gray-400">Total Paid</div></div>
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-2 text-center"><div className="font-black text-teal-700">{fmt(siteReports.reduce((a,r)=>a+(+(r.totalWorkingArea)||0),0))} sqft</div><div className="text-xs text-gray-400">Work</div></div>
      </div>
      <div className="space-y-3">
        {workers.length===0&&<EmptyState icon="👷" text="No workers yet" />}
        {workers.map(w=>(
          <div key={w._id} onClick={()=>setSelectedWorker(w)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:border-amber-300 transition-all">
            <div className="flex items-center justify-between">
              <div><div className="font-black text-gray-900">{w.name}</div><div className="text-xs text-gray-400">{w.role}{w.phone?` · 📞 ${w.phone}`:""}</div><div className="flex gap-1 mt-1"><Badge color={workerTypeOf(w)==="Production Worker"?"purple":"teal"}>{workerTypeOf(w)}</Badge><Badge color={isActiveWorker(w)?"green":"red"}>{w.status||"Active"}</Badge></div><div className="text-xs text-amber-600 font-semibold mt-1">{CURRENCY}{fmt(w.rateAmount||0)} / {w.paymentType||"day"}</div></div>
              <span className="text-gray-300 text-xl">›</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1 text-xs">
              <div className="bg-blue-50 rounded-lg p-1.5 text-center"><div className="font-black text-blue-700">{totalDays(w.name)}</div><div className="text-gray-400">Days</div></div>
              <div className="bg-teal-50 rounded-lg p-1.5 text-center"><div className="font-black text-teal-700">{fmt(totalSqft(w.name))} sqft</div><div className="text-gray-400">Work</div></div>
              <div className="bg-green-50 rounded-lg p-1.5 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt(totalPaid(w.name))}</div><div className="text-gray-400">Paid</div></div>
            </div>
          </div>
        ))}
      </div>
      {addModal&&<Modal title="Add Worker" onClose={()=>setAddModal(false)}>
        <div className="space-y-3">
          <Input label="Worker Name *" value={workerForm.name} onChange={e=>setWorkerForm({...workerForm,name:e.target.value})} />
          <Input label="Phone" type="tel" value={workerForm.phone} onChange={e=>setWorkerForm({...workerForm,phone:e.target.value})} />
          <Input label="Address" value={workerForm.address} onChange={e=>setWorkerForm({...workerForm,address:e.target.value})} />
          <Select label="Role" value={workerForm.role} options={["Labourer","Mason","Helper","Supervisor","Driver","Other"]} onChange={e=>setWorkerForm({...workerForm,role:e.target.value})} />
          <Select label="Worker Type" value={workerForm.workerType} options={["Site Worker","Production Worker"]} onChange={e=>setWorkerForm({...workerForm,workerType:e.target.value,workerCategory:e.target.value})} />
          <Select label="Status" value={workerForm.status} options={["Active","Inactive"]} onChange={e=>setWorkerForm({...workerForm,status:e.target.value})} />
          <Select label="Payment Type" value={workerForm.paymentType} options={["Per Day","Per Hour","Per Piece","Per Square Feet","Per Square Meter","Other"]} onChange={e=>setWorkerForm({...workerForm,paymentType:e.target.value})} />
          {workerForm.paymentType==="Other"&&<Input label="Custom Type" value={workerForm.customPaymentType} onChange={e=>setWorkerForm({...workerForm,customPaymentType:e.target.value})} placeholder="e.g. per load" />}
          <Input label={`Rate (${CURRENCY})`} type="number" value={workerForm.rateAmount} onChange={e=>setWorkerForm({...workerForm,rateAmount:e.target.value})} />
          <button onClick={addWorker} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-bold">Add Worker</button>
        </div>
      </Modal>}
    </div>
  );
}

// ─── SUPPLIERS ────────────────────────────────────────────────────────────────
function Suppliers({ user }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const MATERIAL_OPTIONS = ["Cement","Stone","Sand","Blocks","Chips","Steel","Tiles"];
  const emptyForm = { name:"", location:"", phone:"", materials:[], customMaterial:"", note:"" };
  const [form, setForm] = useState(emptyForm);
  const canEdit = isAdminLike(user.role);

  useEffect(()=>{ api("GET","/suppliers").then(d=>{ setSuppliers(Array.isArray(d)?d:[]); setLoading(false); }); },[]);

  const save = async () => {
    if (!form.name) return;
    const mats = [...(form.materials||[])];
    if (form.customMaterial) mats.push(form.customMaterial);
    const data = {...form, materials:mats};
    if (editItem) { await api("PUT",`/suppliers/${editItem._id}`,data); setSuppliers(p=>p.map(x=>x._id===editItem._id?{...x,...data}:x)); }
    else { const item = await api("POST","/suppliers",{...data,addedBy:user.name}); if (item._id) setSuppliers(p=>[...p,item]); }
    setModal(false); setEditItem(null); setForm(emptyForm);
  };

  const del = async (id) => { if (!window.confirm("Delete?")) return; await api("DELETE",`/suppliers/${id}`); setSuppliers(p=>p.filter(x=>x._id!==id)); };

  if (loading) return <Loader />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">🏪 Suppliers</h2>
        {canEdit&&<button onClick={()=>{setForm(emptyForm);setEditItem(null);setModal(true);}} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ Add</button>}
      </div>
      <div className="space-y-3">
        {suppliers.length===0&&<EmptyState icon="🏪" text="No suppliers yet" />}
        {suppliers.map(s=>(
          <div key={s._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1"><div className="font-black text-gray-900">{s.name}</div><div className="text-xs text-gray-400">📍 {s.location||"—"} · 📞 {s.phone||"—"}</div><div className="mt-1 flex gap-1 flex-wrap">{(s.materials||[]).map(m=><Badge key={m} color="teal">{m}</Badge>)}</div></div>
              {canEdit&&<div className="flex gap-1"><button onClick={()=>{setForm({...s,customMaterial:""});setEditItem(s);setModal(true);}} className="bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-lg text-xs font-bold">✏️</button><button onClick={()=>del(s._id)} className="bg-red-50 text-red-600 px-2.5 py-1.5 rounded-lg text-xs font-bold">🗑️</button></div>}
            </div>
          </div>
        ))}
      </div>
      {modal&&<Modal title={editItem?"Edit Supplier":"Add Supplier"} onClose={()=>{setModal(false);setEditItem(null);setForm(emptyForm);}}>
        <div className="space-y-3">
          <Input label="Supplier Name *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
          <Input label="Location" value={form.location||""} onChange={e=>setForm({...form,location:e.target.value})} />
          <Input label="Phone" type="tel" value={form.phone||""} onChange={e=>setForm({...form,phone:e.target.value})} />
          <div><label className="block text-xs font-semibold text-gray-600 mb-2">Materials Supplied</label>
            <div className="flex flex-wrap gap-1 mb-2">{MATERIAL_OPTIONS.map(m=><button key={m} type="button" onClick={()=>{const mats=form.materials||[];setForm({...form,materials:mats.includes(m)?mats.filter(x=>x!==m):[...mats,m]});}} className={`px-2 py-1 rounded-lg text-xs font-bold border ${(form.materials||[]).includes(m)?"bg-teal-500 text-white border-teal-500":"bg-white text-gray-600 border-gray-200"}`}>{m}</button>)}</div>
            <Input label="Other Material" value={form.customMaterial||""} onChange={e=>setForm({...form,customMaterial:e.target.value})} placeholder="Custom material..." />
          </div>
          <button onClick={save} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-bold">{editItem?"Save":"Add Supplier"}</button>
        </div>
      </Modal>}
    </div>
  );
}

// ─── PURCHASES ────────────────────────────────────────────────────────────────
function Purchases({ user }) {
  const [purchases, setPurchases] = useState([]);
  const [supplierMaster, setSupplierMaster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [supplierMode, setSupplierMode] = useState("existing");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [saveToMaster, setSaveToMaster] = useState(true);
  const [quickSearch, setQuickSearch] = useState("");
  const [ledger, setLedger] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ mobile: "", supplier: "", datePreset: "", customDate: "", fromDate: "", toDate: "" });
  const emptyForm = { date:today(), supplierName:"", supplierPhone:"", supplierMobile:"", supplierAddress:"", itemName:"", itemType:"Material", quantity:"", unit:"nos", unitPrice:"", totalAmount:"", amountPaid:"", paymentMode:"Cash", note:"" };
  const [form, setForm] = useState(emptyForm);

  useEffect(()=>{
    Promise.all([api("GET","/purchases"), api("GET","/suppliers")]).then(([p,s])=>{
      setPurchases(Array.isArray(p)?p:[]);
      setSupplierMaster(Array.isArray(s)?s:[]);
      setLoading(false);
    });
  },[]);

  const calcTotal = () => +form.quantity * (+form.unitPrice || 0) || +(form.totalAmount || 0);
  const calcPending = () => Math.max(0, calcTotal() - +(form.amountPaid || 0));

  const filterPurchases = () => {
    let from = filters.fromDate, to = filters.toDate;
    if (filters.datePreset && filters.datePreset !== "custom" && filters.datePreset !== "range") {
      const r = salesDateRange(filters.datePreset);
      if (r) { from = r.from; to = r.to; }
    } else if (filters.datePreset === "custom" && filters.customDate) { from = filters.customDate; to = filters.customDate; }
    const mob = (filters.mobile || quickSearch).replace(/\D/g, "");
    const q = quickSearch.trim().toLowerCase();
    return purchases.filter(p => {
      if (mob && !(p.supplierMobile || p.supplierPhone || "").includes(mob)) return false;
      if (filters.supplier && !(p.supplierName || "").toLowerCase().includes(filters.supplier.toLowerCase())) return false;
      if (q && !mob && !(p.supplierName || "").toLowerCase().includes(q) && !(p.supplierMobile || p.supplierPhone || "").includes(q)) return false;
      if (from && p.date < from) return false;
      if (to && p.date > to) return false;
      return true;
    });
  };

  const openSupplierLedger = async (mobile, name) => {
    setLedgerLoading(true);
    const qs = [];
    if (filters.fromDate) qs.push(`fromDate=${filters.fromDate}`);
    if (filters.toDate) qs.push(`toDate=${filters.toDate}`);
    const suffix = qs.length ? `?${qs.join("&")}` : "";
    let data;
    if (mobile) data = await api("GET", `/suppliers/ledger?mobile=${mobile}${qs.length ? "&" + qs.join("&") : ""}`);
    else if (name) data = await api("GET", `/suppliers/ledger?name=${encodeURIComponent(name)}${qs.length ? "&" + qs.join("&") : ""}`);
    setLedgerLoading(false);
    if (data?.supplier) setLedger(data);
  };

  const handleQuickSearch = async () => {
    const q = quickSearch.trim();
    if (!q) { setLedger(null); return; }
    if (/^\d{6,}$/.test(q.replace(/\D/g, ""))) await openSupplierLedger(q.replace(/\D/g, "").slice(-10));
    else await openSupplierLedger(null, q);
  };

  const selectMasterSupplier = (id) => {
    setSelectedSupplierId(id);
    const s = supplierMaster.find(x => x._id === id);
    if (!s) return;
    setForm(f => ({ ...f, supplierName: s.name, supplierPhone: s.mobile || s.phone || "", supplierMobile: s.mobile || s.phone || "", supplierAddress: s.address || s.location || "" }));
  };

  const save = async () => {
    if (!form.supplierName || !form.itemName) return;
    const total = calcTotal();
    const amountPaid = +(form.amountPaid || 0);
    const item = await api("POST", "/purchases", {
      ...form, totalAmount: total, amountPaid, amountPending: calcPending(),
      supplierMobile: (form.supplierMobile || form.supplierPhone || "").replace(/\D/g, "").slice(-10),
      addedBy: user.name, saveToSupplierMaster: supplierMode === "new" ? saveToMaster : true,
    });
    if (item._id) {
      setPurchases(p => [item, ...p]);
      setModal(false);
      setForm(emptyForm);
      setSelectedSupplierId("");
      api("GET", "/suppliers").then(s => setSupplierMaster(Array.isArray(s) ? s : []));
    }
  };

  const filtered = filterPurchases();
  const canAdd = isAdminLike(user.role);

  if (loading) return <Loader />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">🛒 Purchases</h2>
        {canAdd && <button onClick={() => { setForm(emptyForm); setSupplierMode("existing"); setSaveToMaster(true); setModal(true); }} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ Add</button>}
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-3">
        <div className="flex gap-2">
          <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50" placeholder="🔍 Search by Mobile / Supplier Name" value={quickSearch} onChange={e => setQuickSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && handleQuickSearch()} />
          <button onClick={handleQuickSearch} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold shrink-0">Search</button>
        </div>
        {ledgerLoading && <div className="text-xs text-amber-600 mt-2">Loading supplier...</div>}
      </div>

      {ledger?.supplier && (
        <div className="bg-white rounded-2xl border-2 border-teal-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-4 py-3 flex items-center justify-between">
            <div className="text-white font-black">📒 Supplier Ledger</div>
            <button onClick={() => setLedger(null)} className="text-white/80 hover:text-white text-xl">×</button>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-400 text-xs">Supplier</span><div className="font-bold">{ledger.supplier.name}</div></div>
              <div><span className="text-gray-400 text-xs">Mobile</span><div className="font-bold">{ledger.supplier.mobile || "—"}</div></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <StatCard label="Total Purchases" value={ledger.supplier.totalPurchases} icon="🛒" color="blue" />
              <StatCard label="Purchase Amount" value={`${CURRENCY}${fmt(ledger.supplier.totalPurchaseAmount)}`} icon="💰" color="red" />
              <StatCard label="Total Paid" value={`${CURRENCY}${fmt(ledger.supplier.totalPaid)}`} icon="✅" color="teal" />
              <StatCard label="Total Pending" value={`${CURRENCY}${fmt(ledger.supplier.totalPending)}`} icon="⏳" color="amber" />
            </div>
            {(ledger.materialSummary || []).length > 0 && (
              <SectionBox title="Materials Purchased" icon="🧱" color="teal">
                <table className="w-full text-xs">
                  <thead><tr className="text-gray-400"><th className="text-left p-1">Material</th><th className="text-right p-1">Total Qty</th></tr></thead>
                  <tbody>
                    {ledger.materialSummary.map((m, i) => (
                      <tr key={i} className="border-t"><td className="p-1 font-semibold">{m.item}</td><td className="p-1 text-right">{fmt(m.quantity)} {m.unit}</td></tr>
                    ))}
                  </tbody>
                </table>
              </SectionBox>
            )}
            <div className="overflow-x-auto">
              <div className="text-xs font-bold text-gray-600 mb-1">Purchase History</div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500">
                    <th className="text-left p-2">Date</th><th className="text-left p-2">Material</th><th className="text-right p-2">Qty</th>
                    <th className="text-right p-2">Amount</th><th className="text-right p-2">Paid</th><th className="text-right p-2">Pending</th><th className="text-left p-2">Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {(ledger.purchases || []).map(p => (
                    <tr key={p._id} className="border-t">
                      <td className="p-2">{p.date}</td><td className="p-2 font-semibold">{p.itemName}</td>
                      <td className="p-2 text-right">{p.quantity} {p.unit}</td>
                      <td className="p-2 text-right text-red-700 font-bold">{CURRENCY}{fmt(+(p.totalAmount) || 0)}</td>
                      <td className="p-2 text-right text-teal-700">{CURRENCY}{fmt(+(p.amountPaid) || 0)}</td>
                      <td className="p-2 text-right text-amber-700">{CURRENCY}{fmt(+(p.amountPending) || 0)}</td>
                      <td className="p-2">{p.paymentMode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <button onClick={() => setShowFilters(!showFilters)} className="w-full px-4 py-3 flex justify-between text-sm font-bold text-gray-700">
          <span>🔎 Purchase Filters</span><span>{showFilters ? "▲" : "▼"}</span>
        </button>
        {showFilters && (
          <div className="px-4 pb-4 space-y-3 border-t pt-3">
            <div className="grid grid-cols-2 gap-2">
              <Input label="Mobile" value={filters.mobile} onChange={e => setFilters({ ...filters, mobile: e.target.value })} />
              <Input label="Supplier Name" value={filters.supplier} onChange={e => setFilters({ ...filters, supplier: e.target.value })} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[{ id: "", label: "All" }, { id: "today", label: "Today" }, { id: "yesterday", label: "Yesterday" }, { id: "thismonth", label: "This Month" }, { id: "range", label: "Date Range" }].map(d => (
                <button key={d.id} onClick={() => setFilters({ ...filters, datePreset: d.id })} className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${filters.datePreset === d.id ? "bg-amber-500 text-white" : "bg-gray-50"}`}>{d.label}</button>
              ))}
            </div>
            {filters.datePreset === "range" && (
              <div className="grid grid-cols-2 gap-2">
                <Input label="From" type="date" value={filters.fromDate} onChange={e => setFilters({ ...filters, fromDate: e.target.value })} />
                <Input label="To" type="date" value={filters.toDate} onChange={e => setFilters({ ...filters, toDate: e.target.value })} />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Total Spent" value={`${CURRENCY}${fmt(filtered.reduce((a, p) => a + (+(p.totalAmount) || 0), 0))}`} icon="💰" color="red" sub={`${filtered.length} record(s)`} />
        <StatCard label="Total Pending" value={`${CURRENCY}${fmt(filtered.reduce((a, p) => a + (+(p.amountPending) || 0), 0))}`} icon="⏳" color="amber" />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && <EmptyState icon="🛒" text="No purchases found" />}
        {filtered.map(p => (
          <div key={p._id} className="bg-white rounded-2xl border shadow-sm p-4">
            <div className="flex justify-between gap-2" onClick={() => setViewModal(p)}>
              <div className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2"><span className="font-black">{p.itemName}</span><Badge color="teal">{p.itemType}</Badge></div>
                <div className="text-xs text-gray-400">🏪 {p.supplierName} · 📅 {p.date}</div>
                {(+(p.amountPending) || 0) > 0 && <div className="text-xs text-amber-600">Pending: {CURRENCY}{fmt(+(p.amountPending) || 0)}</div>}
              </div>
              <div className="text-right"><div className="font-black text-red-600">{CURRENCY}{fmt(+(p.totalAmount) || 0)}</div><div className="text-xs text-gray-400">{p.quantity} {p.unit}</div></div>
            </div>
            {(p.supplierMobile || p.supplierPhone) && (
              <button onClick={() => openSupplierLedger(p.supplierMobile || p.supplierPhone)} className="mt-2 text-xs text-teal-600 font-bold hover:underline">View Supplier Ledger →</button>
            )}
          </div>
        ))}
      </div>

      {modal && <Modal title="Add Purchase" onClose={() => setModal(false)} wide>
        <div className="space-y-3">
          <Input label="Date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          <SectionBox title="Supplier" icon="🏪" color="blue">
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => setSupplierMode("existing")} className={`flex-1 py-2 rounded-xl text-xs font-bold border ${supplierMode === "existing" ? "bg-teal-600 text-white" : "bg-white"}`}>Select Existing</button>
              <button type="button" onClick={() => { setSupplierMode("new"); setSelectedSupplierId(""); }} className={`flex-1 py-2 rounded-xl text-xs font-bold border ${supplierMode === "new" ? "bg-teal-600 text-white" : "bg-white"}`}>New Supplier</button>
            </div>
            {supplierMode === "existing" ? (
              <select className="w-full border rounded-xl px-3 py-2.5 text-sm bg-white mb-2" value={selectedSupplierId} onChange={e => selectMasterSupplier(e.target.value)}>
                <option value="">-- Select from Supplier Master --</option>
                {supplierMaster.map(s => <option key={s._id} value={s._id}>{s.name} ({s.mobile || s.phone || "—"})</option>)}
              </select>
            ) : (
              <>
                <Input label="Supplier Name *" value={form.supplierName} onChange={e => setForm({ ...form, supplierName: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Mobile" type="tel" value={form.supplierPhone} onChange={e => setForm({ ...form, supplierPhone: e.target.value, supplierMobile: e.target.value })} />
                  <Input label="Address" value={form.supplierAddress} onChange={e => setForm({ ...form, supplierAddress: e.target.value })} />
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input type="checkbox" checked={saveToMaster} onChange={e => setSaveToMaster(e.target.checked)} className="rounded" />
                  Save to Supplier Master
                </label>
              </>
            )}
            {supplierMode === "existing" && selectedSupplierId && (
              <div className="text-xs bg-white border rounded-xl p-2 mt-1">
                <div><b>{form.supplierName}</b> · {form.supplierPhone}</div>
                <div>{form.supplierAddress || "—"}</div>
              </div>
            )}
          </SectionBox>
          <SectionBox title="Item" icon="📦" color="amber">
            <Input label="Item / Material Name *" value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })} />
            <Select label="Type" value={form.itemType} options={["Material","Equipment","Spare Part","Fuel","Other"]} onChange={e => setForm({ ...form, itemType: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Qty" type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value, totalAmount: String(+e.target.value * (+(form.unitPrice) || 0)) })} />
              <Select label="Unit" value={form.unit} options={["nos","kg","ton","litre","bag","m","sqft","sqm","load"]} onChange={e => setForm({ ...form, unit: e.target.value })} />
              <Input label={`Unit Price (${CURRENCY})`} type="number" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value, totalAmount: String((+(form.quantity) || 0) * +e.target.value) })} />
              <Input label={`Total (${CURRENCY})`} type="number" value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: e.target.value })} />
            </div>
          </SectionBox>
          <div className="grid grid-cols-2 gap-2">
            <Input label={`Amount Paid (${CURRENCY})`} type="number" value={form.amountPaid} onChange={e => setForm({ ...form, amountPaid: e.target.value })} placeholder="0" />
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Pending</label><div className="border border-amber-200 rounded-xl px-3 py-2.5 text-sm bg-amber-50 text-amber-800 font-bold">{CURRENCY}{fmt(calcPending())}</div></div>
          </div>
          <Select label="Payment Mode" value={form.paymentMode} options={["Cash","Bank","GPay","UPI","Credit"]} onChange={e => {
            const mode = e.target.value;
            setForm({ ...form, paymentMode: mode, amountPaid: mode === "Credit" ? form.amountPaid : String(calcTotal()) });
          }} />
          <Textarea label="Note" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
          <button onClick={save} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold">Submit</button>
        </div>
      </Modal>}
      {viewModal && <Modal title="Purchase Details" onClose={() => setViewModal(null)}>
        <div className="space-y-3">
          <div className="text-xs text-gray-400">By: {viewModal.addedBy} · {viewModal.date}</div>
          <SectionBox title="Supplier" icon="🏪" color="blue"><div className="text-sm"><div className="font-bold">{viewModal.supplierName}</div><div className="text-xs text-gray-400">{viewModal.supplierPhone} · {viewModal.supplierAddress || "—"}</div></div></SectionBox>
          <SectionBox title="Item" icon="📦" color="amber">
            <div className="text-sm font-bold">{viewModal.itemName} — {viewModal.quantity} {viewModal.unit}</div>
            <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-center">
              <div className="bg-red-50 rounded-xl p-2"><div className="font-black text-red-700">{CURRENCY}{fmt(+(viewModal.totalAmount) || 0)}</div><div className="text-gray-400">Total</div></div>
              <div className="bg-teal-50 rounded-xl p-2"><div className="font-black text-teal-700">{CURRENCY}{fmt(+(viewModal.amountPaid) || 0)}</div><div className="text-gray-400">Paid</div></div>
              <div className="bg-amber-50 rounded-xl p-2"><div className="font-black text-amber-700">{CURRENCY}{fmt(+(viewModal.amountPending) || 0)}</div><div className="text-gray-400">Pending</div></div>
            </div>
          </SectionBox>
        </div>
      </Modal>}
    </div>
  );
}

// ─── PRODUCTION SITE ──────────────────────────────────────────────────────────
function ProductionSite({ user, setStock }) {
  const [entries, setEntries] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [interlockTypes, setInterlockTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("entry");
  const [modal, setModal] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [ledger, setLedger] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [reports, setReports] = useState(null);
  const [reportType, setReportType] = useState("worker");
  const [filters, setFilters] = useState({ worker: "", datePreset: "", fromDate: "", toDate: "", customDate: "" });
  const [workerSearch, setWorkerSearch] = useState("");

  const emptyForm = {
    date: today(), shift: "", workerId: "", workerName: "", itemId: "", itemName: "",
    category: "", shape: "", color: "", size: "", thickness: "", sqftPerPiece: "", sqftQty: "", unitType: "piece", producedQty: "", unit: "piece",
    productionRate: "", paymentGiven: "", remarks: "",
  };
  const [form, setForm] = useState(emptyForm);

  const canEdit = isAdminLike(user.role) || user.role === "supervisor";

  useEffect(() => {
    Promise.all([
      api("GET", "/productionsite"), api("GET", "/workers"), api("GET", "/masterdata/interlock"),
    ]).then(([e, w, i]) => {
      setEntries(Array.isArray(e) ? e : []);
      setWorkers(Array.isArray(w) ? w : []);
      setInterlockTypes(Array.isArray(i) ? i : []);
      setLoading(false);
    });
  }, []);

  const dateFilterParams = () => {
    let from = filters.fromDate, to = filters.toDate;
    if (filters.datePreset === "today") { const r = salesDateRange("today"); from = r.from; to = r.to; }
    else if (filters.datePreset === "month") {
      const now = new Date();
      from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      to = today();
    } else if (filters.datePreset === "custom" && filters.customDate) { from = filters.customDate; to = filters.customDate; }
    const q = [];
    if (from) q.push(`fromDate=${from}`);
    if (to) q.push(`toDate=${to}`);
    return q.length ? `&${q.join("&")}` : "";
  };

  const calcTotal = () => +(form.producedQty || 0) * +(form.productionRate || 0);
  const calcProductionSqft = () => +(form.sqftQty || 0) || ((+(form.producedQty || 0)) * (+(form.sqftPerPiece || 0)));
  const calcPending = () => Math.max(0, calcTotal() - +(form.paymentGiven || 0));
  const productionWorkers = workers.filter(w => workerTypeOf(w)==="Production Worker" && isActiveWorker(w));

  const selectWorker = (id) => {
    const w = workers.find(x => x._id === id);
    if (!w) return;
    setForm(f => ({ ...f, workerId: id, workerName: w.name }));
  };

  const selectItem = (id) => {
    const it = interlockTypes.find(x => x._id === id);
    if (!it) return;
    let unitType = (it.unit || "piece").toLowerCase();
    if (unitType === "nos" || unitType === "load") unitType = "piece";
    if (!["piece", "sqft", "sqm"].includes(unitType)) unitType = "piece";
    const sqftPerPiece = +(it.sqftPerPiece || 0);
    const producedQty = +(form.producedQty || 0);
    setForm(f => ({
      ...f, itemId: id, itemName: it.name, category: it.category || "", shape: it.shape || "", color: it.color || "", size: it.size || "", thickness: it.thickness || "",
      sqftPerPiece: sqftPerPiece ? String(sqftPerPiece) : "", sqftQty: sqftPerPiece && producedQty ? String(sqftPerPiece * producedQty) : "", unitType, unit: unitType,
    }));
  };

  const save = async () => {
    if (saving) return;
    setSaveError("");
    if (!form.workerName) { setSaveError("Select a worker"); return; }
    if (!form.itemName) { setSaveError("Select an item"); return; }
    if (!+(form.producedQty)) { setSaveError("Enter produced quantity"); return; }
    if (!+(form.productionRate)) { setSaveError("Enter rate per unit manually"); return; }
    setSaving(true);
    try {
      const item = await api("POST", "/productionsite", {
        ...form,
        producedQty: +form.producedQty,
        sqftPerPiece: +(form.sqftPerPiece || 0),
        sqftQty: calcProductionSqft(),
        productionRate: +form.productionRate,
        paymentGiven: +(form.paymentGiven || 0),
        addedBy: user.name,
      });
      if (item.duplicateIgnored) {
        setSaveError(item.message || "Duplicate production entry ignored.");
        api("GET", "/productionsite").then(e => setEntries(Array.isArray(e) ? e : []));
        api("GET", "/stock").then(s => setStock?.(Array.isArray(s) ? s : []));
      } else if (item._id) {
        setEntries(p => [item, ...p]);
        setModal(false);
        setForm(emptyForm);
        api("GET", "/workers").then(w => setWorkers(Array.isArray(w) ? w : []));
        api("GET", "/stock").then(s => setStock?.(Array.isArray(s) ? s : []));
      } else setSaveError(item.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const openLedger = async (name) => {
    if (!name) return;
    setLedgerLoading(true);
    const data = await api("GET", `/workers/reports/production?name=${encodeURIComponent(name)}${dateFilterParams()}`);
    setLedger(data);
    setLedgerLoading(false);
  };

  const loadReports = async () => {
    const data = await api("GET", `/productionsite/reports?type=detail${dateFilterParams()}`);
    setReports(data);
  };

  const productionEntries = entries.filter(e => e.producedQty > 0);
  const filteredEntries = productionEntries.filter(e => {
    if (filters.worker && !(e.workerName || "").toLowerCase().includes(filters.worker.toLowerCase())) return false;
    let from = filters.fromDate, to = filters.toDate;
    if (filters.datePreset === "today") { const r = salesDateRange("today"); from = r.from; to = r.to; }
    else if (filters.datePreset === "month") {
      const now = new Date();
      from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      to = today();
    } else if (filters.datePreset === "custom" && filters.customDate) { from = filters.customDate; to = filters.customDate; }
    if (from && e.date < from) return false;
    if (to && e.date > to) return false;
    return true;
  });

  const todayEntries = productionEntries.filter(e => e.date === today());
  const todayEarned = todayEntries.reduce((a, e) => a + (+(e.totalAmount) || 0), 0);
  const todayPaid = todayEntries.reduce((a, e) => a + (+(e.paymentGiven) || 0), 0);

  if (loading) return <Loader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">🏭 Production Site</h2>
        {canEdit && tab === "entry" && (
          <button onClick={() => { setModal(true); setSaveError(""); setForm(emptyForm); }} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ Production</button>
        )}
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {[{ id: "entry", label: "📝 Entry" }, { id: "ledger", label: "👷 Worker Ledger" }, { id: "reports", label: "📊 Reports" }].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); if (t.id === "reports") loadReports(); }} className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold ${tab === t.id ? "bg-amber-500 text-white" : "bg-white border text-gray-600"}`}>{t.label}</button>
        ))}
      </div>

      {tab === "entry" && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Today's Production" value={fmt(todayEntries.reduce((a, e) => a + (+(e.producedQty) || 0), 0))} icon="📦" color="blue" sub={`${fmt(todayEntries.reduce((a,e)=>a+itemSqft(e, interlockTypes),0))} sqft`} />
            <StatCard label="Today's Earnings" value={`${CURRENCY}${fmt(todayEarned)}`} icon="💰" color="green" />
            <StatCard label="Today's Paid" value={`${CURRENCY}${fmt(todayPaid)}`} icon="✅" color="teal" />
          </div>
          <div className="space-y-2">
            {filteredEntries.length === 0 && <EmptyState icon="🏭" text="No production entries" />}
            {filteredEntries.map(e => (
              <div key={e._id} className="bg-white rounded-2xl border shadow-sm p-4">
                <div className="flex justify-between gap-2">
                  <div>
                    <div className="font-black">{e.workerName} · {e.itemName}</div>
                    <div className="text-xs text-gray-400">📅 {e.date}{e.shift ? ` · ${e.shift}` : ""}{e.color ? ` · ${e.color}` : ""}</div>
                    <div className="text-sm text-gray-600">{qtyWithSqft(e, interlockTypes)} x {CURRENCY}{e.productionRate}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-green-700">{CURRENCY}{fmt(+(e.totalAmount) || 0)}</div>
                    {(+(e.paymentGiven) || 0) > 0 && <div className="text-xs text-teal-600">Paid: {CURRENCY}{fmt(+(e.paymentGiven) || 0)}</div>}
                    {(+(e.amountPending) || 0) > 0 && <div className="text-xs text-red-500">Pending: {CURRENCY}{fmt(+(e.amountPending) || 0)}</div>}
                  </div>
                </div>
                <button onClick={() => openLedger(e.workerName)} className="mt-2 text-xs text-amber-600 font-bold hover:underline">View Worker Ledger →</button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "ledger" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input className="flex-1 border rounded-xl px-3 py-2.5 text-sm bg-gray-50" placeholder="🔍 Search Worker Name" value={workerSearch} onChange={e => setWorkerSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && openLedger(workerSearch)} />
            <button onClick={() => openLedger(workerSearch)} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold shrink-0">Search</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[{ id: "", label: "All" }, { id: "today", label: "Today" }, { id: "month", label: "This Month" }, { id: "custom", label: "Custom Date" }, { id: "range", label: "Date Range" }].map(d => (
              <button key={d.id} onClick={() => setFilters({ ...filters, datePreset: d.id })} className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${filters.datePreset === d.id ? "bg-amber-500 text-white" : "bg-gray-50"}`}>{d.label}</button>
            ))}
          </div>
          {filters.datePreset === "custom" && <Input label="Date" type="date" value={filters.customDate} onChange={e => setFilters({ ...filters, customDate: e.target.value })} />}
          {filters.datePreset === "range" && (
            <div className="grid grid-cols-2 gap-2">
              <Input label="From" type="date" value={filters.fromDate} onChange={e => setFilters({ ...filters, fromDate: e.target.value })} />
              <Input label="To" type="date" value={filters.toDate} onChange={e => setFilters({ ...filters, toDate: e.target.value })} />
            </div>
          )}
          {ledgerLoading && <div className="text-xs text-amber-600">Loading...</div>}
          {ledger?.worker && (
            <div className="bg-white rounded-2xl border-2 border-amber-200 overflow-hidden">
              <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-3 text-white font-black">🏭 {ledger.worker.name} <span className="text-xs font-normal opacity-80">· Production Only</span></div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <StatCard label="Total Production Qty" value={fmt(ledger.worker.totalQuantity)} icon="📦" color="blue" sub={`${fmt(ledger.worker.totalSqft || (ledger.history || []).reduce((a,h)=>a+itemSqft(h, interlockTypes),0))} sqft`} />
                  <StatCard label="Production Earnings" value={`${CURRENCY}${fmt(ledger.worker.totalEarnings)}`} icon="💰" color="green" />
                  <StatCard label="Payments Given" value={`${CURRENCY}${fmt(ledger.worker.totalPaid)}`} icon="✅" color="teal" />
                  <StatCard label="Pending" value={`${CURRENCY}${fmt(ledger.worker.totalPending)}`} icon="⏳" color="red" />
                </div>
                {(ledger.itemSummary || []).length > 0 && (
                  <SectionBox title="Production Summary" icon="📦" color="blue">
                    <table className="w-full text-xs"><thead><tr className="text-gray-400"><th className="text-left p-1">Item</th><th className="text-right p-1">Total Qty / Sqft</th></tr></thead>
                      <tbody>{ledger.itemSummary.map((it, i) => <tr key={i} className="border-t"><td className="p-1 font-semibold">{it.item}</td><td className="p-1 text-right">{qtyWithSqft(it, interlockTypes)}</td></tr>)}</tbody>
                    </table>
                  </SectionBox>
                )}
                <div className="overflow-x-auto">
                  <div className="text-xs font-bold mb-1">Production History</div>
                  <table className="w-full text-xs">
                    <thead><tr className="bg-gray-50 text-gray-500"><th className="p-2">Date</th><th className="p-2">Item</th><th className="p-2">Color</th><th className="p-2 text-right">Qty</th><th className="p-2">Unit</th><th className="p-2 text-right">Rate</th><th className="p-2 text-right">Amount</th><th className="p-2 text-right">Paid</th></tr></thead>
                    <tbody>
                      {(ledger.history || []).map((h, i) => (
                        <tr key={i} className="border-t"><td className="p-2">{h.date}</td><td className="p-2 font-semibold">{h.item}</td><td className="p-2">{h.color || "—"}</td><td className="p-2 text-right">{qtyWithSqft(h, interlockTypes)}</td><td className="p-2">{h.unit}</td><td className="p-2 text-right">{CURRENCY}{fmt(+(h.rate) || 0)}</td><td className="p-2 text-right font-bold text-green-700">{CURRENCY}{fmt(+(h.amount) || 0)}</td><td className="p-2 text-right text-teal-700">{CURRENCY}{fmt(+(h.paid) || 0)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {workers.filter(w => !workerSearch || w.name.toLowerCase().includes(workerSearch.toLowerCase())).map(w => (
              <div key={w._id} onClick={() => openLedger(w.name)} className="bg-white rounded-2xl border p-4 cursor-pointer hover:border-amber-300">
                <div className="flex justify-between"><div className="font-black">{w.name}</div><span className="text-gray-300">›</span></div>
                <div className="mt-1 grid grid-cols-3 gap-1 text-xs">
                  <div className="text-center bg-green-50 rounded p-1"><div className="font-bold text-green-700">{CURRENCY}{fmt(w.totalEarnings || 0)}</div><div className="text-gray-400">Earned</div></div>
                  <div className="text-center bg-teal-50 rounded p-1"><div className="font-bold text-teal-700">{CURRENCY}{fmt(w.totalPaid || 0)}</div><div className="text-gray-400">Paid</div></div>
                  <div className="text-center bg-red-50 rounded p-1"><div className="font-bold text-red-600">{CURRENCY}{fmt(w.totalPending || 0)}</div><div className="text-gray-400">Pending</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "reports" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {[{ id: "worker", label: "Worker-wise" }, { id: "item", label: "Item-wise" }, { id: "color", label: "Color-wise" }, { id: "pending", label: "Pending Salary" }].map(t => (
              <button key={t.id} onClick={() => setReportType(t.id)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${reportType === t.id ? "bg-amber-500 text-white" : "bg-gray-50"}`}>{t.label}</button>
            ))}
            <button onClick={loadReports} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500 text-white ml-auto">Refresh</button>
          </div>
          {reports && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <StatCard label="Total Qty" value={fmt(reports.totalQuantity || 0)} icon="📦" color="blue" sub={`${fmt(reports.totalSqft || 0)} sqft`} />
                <StatCard label="Total Amount" value={`${CURRENCY}${fmt(reports.totalAmount || 0)}`} icon="💰" color="green" />
                <StatCard label="Entries" value={reports.totalEntries || 0} icon="📋" color="purple" />
              </div>
              {reportType === "worker" && (reports.workerWise || []).map((w, i) => (
                <div key={i} className="bg-white rounded-xl border p-3 flex justify-between text-sm"><span className="font-bold">{w.worker}</span><span>{qtyWithSqft(w, interlockTypes)} · {CURRENCY}{fmt(w.earnings)} · Paid {CURRENCY}{fmt(w.paid)}</span></div>
              ))}
              {reportType === "item" && (reports.itemWise || []).map((it, i) => (
                <div key={i} className="bg-white rounded-xl border p-3 flex justify-between text-sm"><span className="font-bold">{it.item}</span><span>{qtyWithSqft(it, interlockTypes)} · {CURRENCY}{fmt(it.amount)}</span></div>
              ))}
              {reportType === "color" && (reports.colorWise || []).map((c, i) => (
                <div key={i} className="bg-white rounded-xl border p-3 flex justify-between text-sm"><span className="font-bold">{c.color}</span><span>{qtyWithSqft(c, interlockTypes)} · {CURRENCY}{fmt(c.amount)}</span></div>
              ))}
              {reportType === "pending" && (reports.pendingWorkers || []).map((w, i) => (
                <div key={i} className="bg-white rounded-xl border p-3"><div className="font-bold">{w.name}</div><div className="text-xs text-red-600 mt-1">Pending: {CURRENCY}{fmt(w.totalPending)} · Earned: {CURRENCY}{fmt(w.totalEarnings)} · Paid: {CURRENCY}{fmt(w.totalPaid)}</div></div>
              ))}
            </>
          )}
        </div>
      )}

      {modal && (
        <Modal title="Production Entry" onClose={() => { setModal(false); setSaveError(""); }} wide>
          <div className="space-y-3">
            <SectionBox title="Worker Details" icon="👷" color="purple">
              <div className="grid grid-cols-2 gap-2">
                <Input label="Date *" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                <Input label="Shift (optional)" value={form.shift} onChange={e => setForm({ ...form, shift: e.target.value })} placeholder="Morning / Evening" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Worker Name *</label>
                <select className="w-full border rounded-xl px-3 py-2.5 text-sm bg-white" value={form.workerId} onChange={e => selectWorker(e.target.value)}>
                  <option value="">-- Select Worker --</option>
                  {productionWorkers.map(w => <option key={w._id} value={w._id}>{w.name} ({w.role})</option>)}
                </select>
                {productionWorkers.length===0&&<div className="text-xs text-red-500 mt-1">No active production workers found.</div>}
              </div>
            </SectionBox>

            <SectionBox title="Product Details" icon="🧱" color="amber">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Select Item (Master Interlock) *</label>
                <select className="w-full border rounded-xl px-3 py-2.5 text-sm bg-white" value={form.itemId} onChange={e => selectItem(e.target.value)}>
                  <option value="">-- Select Interlock Type --</option>
                  {interlockTypes.map(it => <option key={it._id} value={it._id}>{it.name}{it.color ? ` (${it.color})` : ""}</option>)}
                </select>
              </div>
              {form.itemName && (
                <div className="bg-amber-50 rounded-xl p-2 text-xs space-y-0.5">
                  <div><b>Item:</b> {form.itemName}</div>
                  <div><b>Category:</b> {form.category || "-"}</div>
                  <div><b>Color:</b> {form.color || "—"}</div>
                  <div><b>1 Piece Sqft:</b> {form.sqftPerPiece || "0"}</div>
                  <div><b>Unit:</b> {form.unitType === "piece" ? "Piece" : form.unitType === "sqft" ? "Sqft" : form.unitType}</div>
                </div>
              )}
              <div className="text-xs text-gray-500 mt-1">Rate is not taken from Master Data — enter manually below.</div>
            </SectionBox>

            <SectionBox title="Production Details" icon="📦" color="green">
              <div className="grid grid-cols-2 gap-2">
                <Input label="Produced Quantity *" type="number" step="any" value={form.producedQty} onChange={e => {
                  const producedQty = +(e.target.value || 0);
                  const sqftPerPiece = +(form.sqftPerPiece || 0);
                  setForm({ ...form, producedQty: e.target.value, sqftQty: sqftPerPiece ? String(producedQty * sqftPerPiece) : form.sqftQty });
                }} placeholder="e.g. 500" />
                <Select label="Unit" value={form.unit} options={["sqft", "piece", "sqm"]} onChange={e => setForm({ ...form, unit: e.target.value, unitType: e.target.value })} />
                <Input label="1 Piece Sqft" type="number" step="any" value={form.sqftPerPiece} onChange={e => {
                  const sqftPerPiece = +(e.target.value || 0);
                  const producedQty = +(form.producedQty || 0);
                  setForm({ ...form, sqftPerPiece: e.target.value, sqftQty: sqftPerPiece && producedQty ? String(producedQty * sqftPerPiece) : "" });
                }} placeholder="0" />
                <Input label="Total Sqft" type="number" value={calcProductionSqft()} readOnly />
                <Input label={`Rate per Unit (${CURRENCY}) *`} type="number" step="any" value={form.productionRate} onChange={e => setForm({ ...form, productionRate: e.target.value })} placeholder="Enter rate manually e.g. 7.50" />
                <Input label={`Payment Given (${CURRENCY})`} type="number" step="any" value={form.paymentGiven} onChange={e => setForm({ ...form, paymentGiven: e.target.value })} placeholder="0" />
              </div>
              {+(form.producedQty) > 0 && +(form.productionRate) > 0 && (
                <div className="bg-gray-50 rounded-xl p-2 text-xs text-gray-600 text-center">
                  {form.producedQty} {form.unit} / {fmt(calcProductionSqft())} sqft x {CURRENCY}{form.productionRate} = <b className="text-green-700">{CURRENCY}{fmt(calcTotal())}</b>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                  <div className="text-xs text-gray-400">Total Amount (auto)</div>
                  <div className="text-xl font-black text-green-700">{CURRENCY}{fmt(calcTotal())}</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                  <div className="text-xs text-gray-400">Pending Amount</div>
                  <div className="text-xl font-black text-red-600">{CURRENCY}{fmt(calcPending())}</div>
                </div>
              </div>
              <Textarea label="Remarks" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} placeholder="Optional notes" />
            </SectionBox>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-2 text-xs text-blue-700">
              ✅ On submit: Stock increases automatically · Worker earnings update · Payment reduces pending
            </div>
            {saveError && <div className="text-xs text-red-600 font-bold bg-red-50 border border-red-200 rounded-xl p-2">{saveError}</div>}
            <button onClick={save} disabled={saving} className={`w-full py-3 rounded-xl font-bold text-white ${saving ? "bg-amber-300 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-600"}`}>{saving ? "Saving..." : "Submit Production"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────
function AttendanceReports({ user }) {
  const [workers, setWorkers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("mark");
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [markDate, setMarkDate] = useState(today());
  const [attendance, setAttendance] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(()=>{
    Promise.all([api("GET","/workers"),api("GET","/productionsite"),api("GET","/workerpayments")]).then(([w,e,p])=>{
      setWorkers(Array.isArray(w)?w:[]);
      setEntries(Array.isArray(e)?e:[]);
      setPayments(Array.isArray(p)?p:[]);
      setLoading(false);
    });
  },[]);

  useEffect(()=>{
    if(workers.length===0) return;
    const existing=entries.find(e=>e.date===markDate);
    if(existing) setAttendance(existing.attendance||[]);
    else setAttendance(workers.map(w=>({workerId:w._id,workerName:w.name,status:"present",workDone:"",workUnit:w.paymentType||"day",rate:+(w.rateAmount||0),total:0})));
  },[markDate,workers]);

  const updateAtt=(i,field,val)=>{const att=[...attendance];att[i]={...att[i],[field]:val};if(field==="workDone"||field==="rate")att[i].total=+(att[i].workDone||0)*(+(att[i].rate||0));setAttendance(att);};

  const saveAttendance=async()=>{
    setSaving(true);
    const totalCost=attendance.reduce((a,x)=>a+(+(x.total)||0),0);
    const existing=entries.find(e=>e.date===markDate);
    if(existing){await api("PUT",`/productionsite/${existing._id}`,{attendance,totalCost});setEntries(p=>p.map(x=>x._id===existing._id?{...x,attendance,totalCost}:x));}
    else{const item=await api("POST","/productionsite",{date:markDate,attendance,totalCost,addedBy:user.name});if(item._id)setEntries(p=>[item,...p]);}
    setSaving(false);
  };

  const getWorkerLedger=(wname)=>{
    const allAtt=entries.flatMap(e=>(e.attendance||[]).filter(a=>a.workerName===wname).map(a=>({...a,date:e.date})));
    const present=allAtt.filter(a=>a.status==="present");
    const totalEarned=present.reduce((a,x)=>a+(+(x.total)||0),0);
    const totalPaid=payments.filter(p=>p.workerName===wname).reduce((a,p)=>a+(+(p.amount)||0),0);
    return{present,totalDays:present.length,totalEarned,totalPaid,pending:Math.max(0,totalEarned-totalPaid)};
  };

  if(loading) return <Loader />;

  if(selectedWorker){
    const {present,totalDays,totalEarned,totalPaid,pending}=getWorkerLedger(selectedWorker.name);
    const wPay=payments.filter(p=>p.workerName===selectedWorker.name).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
    return(
      <div className="space-y-4">
        <button onClick={()=>setSelectedWorker(null)} className="text-amber-600 font-bold text-sm">← Back</button>
        <div className="bg-white rounded-2xl border shadow-sm p-4"><div className="font-black text-xl">{selectedWorker.name}</div><div className="text-xs text-gray-400">{selectedWorker.role} · {CURRENCY}{fmt(selectedWorker.rateAmount||0)}/{selectedWorker.paymentType||"day"}</div></div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center"><div className="text-xl font-black text-blue-700">{totalDays}</div><div className="text-xs text-gray-400">Work Days</div></div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center"><div className="text-xl font-black text-green-700">{CURRENCY}{fmt(totalEarned)}</div><div className="text-xs text-gray-400">Earned</div></div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center"><div className="text-xl font-black text-amber-700">{CURRENCY}{fmt(totalPaid)}</div><div className="text-xs text-gray-400">Paid</div></div>
          <div className={`${pending>0?"bg-red-50 border-red-200":"bg-green-50 border-green-200"} border rounded-xl p-3 text-center`}><div className={`text-xl font-black ${pending>0?"text-red-600":"text-green-600"}`}>{CURRENCY}{fmt(pending)}</div><div className="text-xs text-gray-400">Pending</div></div>
        </div>
        <div className="font-black text-gray-800">📅 Attendance</div>
        {present.sort((a,b)=>b.date.localeCompare(a.date)).map((a,i)=><div key={i} className="bg-white rounded-xl border shadow-sm p-3 mb-2 flex justify-between"><div><div className="font-bold text-sm">📅 {a.date}</div>{+(a.workDone||0)>0&&<div className="text-xs text-gray-400">{a.workDone} {a.workUnit}</div>}</div><div className="font-black text-green-700">{CURRENCY}{fmt(a.total)}</div></div>)}
        <div className="font-black text-gray-800">💸 Payments</div>
        {wPay.length===0&&<EmptyState icon="💸" text="No payments" />}
        {wPay.map((p,i)=><div key={i} className="bg-white rounded-xl border shadow-sm p-3 mb-2 flex justify-between"><div><div className="font-bold text-sm">{CURRENCY}{fmt(p.amount)}</div><div className="text-xs text-gray-400">📅 {p.date}{p.note?` · ${p.note}`:""}</div></div><Badge color="green">Paid</Badge></div>)}
      </div>
    );
  }

  return(
    <div className="space-y-4">
      <h2 className="text-xl font-black text-gray-900">📊 Attendance</h2>
      <div className="flex gap-1">
        {["mark","reports","ledger"].map(t=><button key={t} onClick={()=>setTab(t)} className={`flex-1 py-2 rounded-xl text-xs font-bold ${tab===t?"bg-amber-500 text-white":"bg-white border border-gray-200 text-gray-600"}`}>{t==="mark"?"✅ Mark":t==="reports"?"📊 Reports":"👷 Ledger"}</button>)}
      </div>
      {tab==="mark"&&(
        <div className="space-y-3">
          <Input label="Date" type="date" value={markDate} onChange={e=>setMarkDate(e.target.value)} />
          {attendance.map((a,i)=><div key={i} className={`rounded-2xl border p-3 space-y-2 ${a.status==="present"?"border-green-200 bg-green-50":"border-red-100 bg-red-50"}`}>
            <div className="flex items-center justify-between"><div className="font-black text-sm">{a.workerName}</div>
              <div className="flex gap-1">{["present","absent"].map(s=><button key={s} type="button" onClick={()=>updateAtt(i,"status",s)} className={`px-3 py-1 rounded-xl text-xs font-bold border ${a.status===s?(s==="present"?"bg-green-500 text-white border-green-500":"bg-red-500 text-white border-red-500"):"bg-white text-gray-500 border-gray-200"}`}>{s==="present"?"✓ Present":"✗ Absent"}</button>)}</div>
            </div>
            {a.status==="present"&&<div className="grid grid-cols-3 gap-2"><Input label="Work Done" type="number" value={a.workDone||""} onChange={e=>updateAtt(i,"workDone",e.target.value)} placeholder="0" /><Input label="Unit" value={a.workUnit||""} onChange={e=>updateAtt(i,"workUnit",e.target.value)} /><Input label={`Rate(${CURRENCY})`} type="number" value={a.rate||""} onChange={e=>updateAtt(i,"rate",e.target.value)} /></div>}
            {a.status==="present"&&+(a.workDone||0)>0&&<div className="text-xs font-black text-green-700 text-right">{CURRENCY}{fmt(+(a.workDone||0)*(+(a.rate||0)))}</div>}
          </div>)}
          {workers.length>0&&<button onClick={saveAttendance} disabled={saving} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold disabled:opacity-60">{saving?"Saving...":"💾 Save Attendance"}</button>}
        </div>
      )}
      {tab==="ledger"&&(
        <div className="space-y-3">
          {workers.map(w=>{
            const{totalDays,totalEarned,totalPaid,pending}=getWorkerLedger(w.name);
            return(<div key={w._id} onClick={()=>setSelectedWorker(w)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:border-amber-300 transition-all">
              <div className="flex items-center justify-between"><div><div className="font-black">{w.name}</div><div className="text-xs text-gray-400">{w.role} · {CURRENCY}{fmt(w.rateAmount||0)}/{w.paymentType||"day"}</div></div><span className="text-gray-300 text-xl">›</span></div>
              <div className="mt-2 grid grid-cols-4 gap-1 text-xs">
                <div className="bg-blue-50 rounded-lg p-1.5 text-center"><div className="font-black text-blue-700">{totalDays}</div><div className="text-gray-400">Days</div></div>
                <div className="bg-green-50 rounded-lg p-1.5 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt(totalEarned)}</div><div className="text-gray-400">Earned</div></div>
                <div className="bg-amber-50 rounded-lg p-1.5 text-center"><div className="font-black text-amber-700">{CURRENCY}{fmt(totalPaid)}</div><div className="text-gray-400">Paid</div></div>
                <div className={`${pending>0?"bg-red-50":"bg-green-50"} rounded-lg p-1.5 text-center`}><div className={`font-black ${pending>0?"text-red-600":"text-green-600"}`}>{CURRENCY}{fmt(pending)}</div><div className="text-gray-400">Pending</div></div>
              </div>
            </div>);
          })}
        </div>
      )}
    </div>
  );
}

// ─── WORK PLANNING ────────────────────────────────────────────────────────────
function WorkPlanning({ siteWorks, user }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showArchive, setShowArchive] = useState(false);
  const emptyForm = { date:today(), siteName:"", plannedWork:"", supervisor:"", workersAllocated:"", materialsNeeded:"", estimatedCost:"", notes:"", status:"Planned" };
  const [form, setForm] = useState(emptyForm);

  useEffect(()=>{ api("GET",`/workplan${showArchive?"?archive=true&role=admin":""}`).then(d=>{ setPlans(Array.isArray(d)?d:[]); setLoading(false); }); },[showArchive]);

  const save = async () => {
    if (!form.siteName) return;
    const payload = {...form, task:form.plannedWork, workers:form.workersAllocated, materials:form.materialsNeeded, note:form.notes, estimatedCost:+form.estimatedCost||0, addedBy:user.name};
    const item = editItem ? await api("PUT",`/workplan/${editItem._id}`,payload) : await api("POST","/workplan",payload);
    if (item._id) {
      setPlans(p=>editItem?p.map(x=>x._id===item._id?item:x):[item,...p]);
      setModal(false); setEditItem(null); setForm(emptyForm);
    }
  };

  const updateStatus = async (id, status) => { await api("PUT",`/workplan/${id}`,{status}); setPlans(p=>p.map(x=>x._id===id?{...x,status}:x)); };
  const openEdit = (p) => {
    setEditItem(p);
    setForm({
      date:p.date||today(), siteName:p.siteName||p.site||"", plannedWork:p.plannedWork||p.task||"",
      supervisor:p.supervisor||"", workersAllocated:p.workersAllocated||p.workers||"",
      materialsNeeded:p.materialsNeeded||p.materials||"", estimatedCost:p.estimatedCost||"",
      notes:p.notes||p.note||"", status:p.status||"Planned"
    });
    setModal(true);
  };

  if (loading) return <Loader />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">📅 Work Planning</h2>
        <div className="flex gap-2">
          {isAdminLike(user.role)&&<button onClick={()=>setShowArchive(!showArchive)} className="bg-gray-100 text-gray-700 px-3 py-2 rounded-xl text-xs font-bold">{showArchive?"Current Plans":"Archive"}</button>}
          <button onClick={()=>{setEditItem(null);setForm(emptyForm);setModal(true);}} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ Plan</button>
        </div>
      </div>
      <div className="space-y-3">
        {plans.length===0&&<EmptyState icon="📅" text="No plans yet" />}
        {plans.map(p=>(
          <div key={p._id} className="bg-white rounded-2xl border shadow-sm p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1"><div className="font-black">{p.siteName}</div><div className="text-xs text-gray-400">📅 {p.date}{(p.plannedWork||p.task)?` · ${p.plannedWork||p.task}`:""}</div><div className="text-xs text-gray-400">{p.supervisor?`Supervisor: ${p.supervisor} · `:""}Workers: {p.workersAllocated||p.workers||"—"}</div></div>
              <Badge color={p.status==="Completed"?"green":p.status==="Cancelled"?"red":p.status==="In Progress"?"amber":"blue"}>{p.status}</Badge>
            </div>
            <div className="mt-2 flex gap-1">{["Planned","In Progress","Completed","Cancelled"].map(s=><button key={s} onClick={()=>updateStatus(p._id,s)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${p.status===s?"bg-amber-500 text-white border-amber-500":"bg-gray-50 text-gray-500 border-gray-200"}`}>{s}</button>)}</div>
            <button onClick={()=>openEdit(p)} className="mt-2 w-full bg-blue-50 text-blue-700 py-1.5 rounded-xl text-xs font-bold">Edit Plan</button>
          </div>
        ))}
      </div>
      {modal&&<Modal title={editItem?"Edit Work Plan":"Add Work Plan"} onClose={()=>{setModal(false);setEditItem(null);}}>
        <div className="space-y-3">
          <Input label="Date" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} />
          <Input label="Site Name *" value={form.siteName} onChange={e=>setForm({...form,siteName:e.target.value})} placeholder="Site / project" />
          <Textarea label="Planned Work" value={form.plannedWork} onChange={e=>setForm({...form,plannedWork:e.target.value})} />
          <Input label="Supervisor" value={form.supervisor} onChange={e=>setForm({...form,supervisor:e.target.value})} />
          <Input label="Workers Planned" value={form.workersAllocated} onChange={e=>setForm({...form,workersAllocated:e.target.value})} />
          <Input label="Materials Needed" value={form.materialsNeeded} onChange={e=>setForm({...form,materialsNeeded:e.target.value})} />
          <Input label={`Estimated Cost (${CURRENCY})`} type="number" value={form.estimatedCost} onChange={e=>setForm({...form,estimatedCost:e.target.value})} />
          <Select label="Status" value={form.status} options={["Planned","In Progress","Completed","Cancelled"]} onChange={e=>setForm({...form,status:e.target.value})} />
          <Textarea label="Notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
          <button onClick={save} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold">{editItem?"Save Plan":"Add Plan"}</button>
        </div>
      </Modal>}
    </div>
  );
}

// ─── STOCK ────────────────────────────────────────────────────────────────────
function Stock({ stock, setStock, user }) {
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const emptyForm = { name:"", category:"", productType:"", color:"", size:"", quantity:0, unit:"piece", sqftPerPiece:0, minStock:0, price:0 };
  const [form, setForm] = useState(emptyForm);

  const save = async () => {
    if (editItem) { await api("PUT",`/stock/${editItem._id}`,form); setStock(p=>p.map(x=>x._id===editItem._id?{...x,...form}:x)); setEditItem(null); }
    else { const item=await api("POST","/stock",form); if(item._id) setStock(p=>[...p,item]); }
    setModal(false); setForm(emptyForm);
  };

  const del = async (id) => { if(!window.confirm("Delete?")) return; await api("DELETE",`/stock/${id}`); setStock(p=>p.filter(x=>x._id!==id)); };


  const groupedStock = Object.values((stock || []).reduce((acc, s) => {
    const prefix = s.category ? `${s.category} - ` : "";
    const rawName = String(s.name || "").trim();
    const cleanName = prefix && rawName.toLowerCase().startsWith(prefix.toLowerCase()) ? rawName.slice(prefix.length).trim() : rawName;
    const sizeKey = s.productType === "hollowbrick" ? String(s.size || "").trim().toLowerCase() : "";
    const key = `${String(s.productType || "").trim().toLowerCase()}|${String(s.category || "").trim().toLowerCase()}|${cleanName.trim().toLowerCase()}|${String(s.color || "").trim().toLowerCase()}|${sizeKey}|${String(s.unit || "").trim().toLowerCase()}`;
    const displayName = s.productType === "hollowbrick" && s.size ? `${cleanName || s.name} - ${s.size} inch` : (cleanName || s.name);
    if (!acc[key]) acc[key] = { ...s, name: displayName, quantity: 0, sqftQuantity: 0, _ids: [], duplicateCount: 0 };
    acc[key].quantity += +(s.quantity) || 0;
    acc[key].sqftPerPiece = s.productType === "hollowbrick" ? 0 : (acc[key].sqftPerPiece || +(s.sqftPerPiece || 0));
    acc[key].sqftQuantity += s.productType === "hollowbrick" ? 0 : (+(s.sqftQuantity || 0) || ((+(s.quantity)||0) * (+(s.sqftPerPiece)||0)));
    acc[key]._ids.push(s._id);
    acc[key].duplicateCount += 1;
    acc[key].price = acc[key].price || s.price;
    return acc;
  }, {}));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">📦 Stock</h2>
        {isAdminLike(user.role)&&<button onClick={()=>{setForm(emptyForm);setEditItem(null);setModal(true);}} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ Add</button>}
      </div>
      <div className="space-y-2">
        {groupedStock.length===0&&<EmptyState icon="BOX" text="No stock items" />}
        {groupedStock.map(s=>(
          <div key={s._id} className="bg-white rounded-2xl border shadow-sm p-4 flex items-center justify-between">
            <div><div className="font-black">{s.name}</div>{s.category&&<div className="text-xs text-gray-400">{s.category}{s.color?` · ${s.color}`:""}</div>}<div className="text-sm text-gray-600">{s.quantity} piece{+(s.quantity)!==1?"s":""}{(+(s.sqftQuantity)||0)>0?` · ${fmt(s.sqftQuantity)} sqft`:""}</div>{s.sqftPerPiece>0&&<div className="text-xs text-gray-400">1 piece = {fmt(s.sqftPerPiece)} sqft</div>}{s.price>0&&<div className="text-xs text-amber-600">Rate: {CURRENCY}{fmt(s.price)}</div>}{s.duplicateCount>1&&<div className="text-xs text-blue-600 font-bold">{s.duplicateCount} entries combined</div>}</div>
            {isAdminLike(user.role)&&s.duplicateCount===1&&<div className="flex gap-1"><button onClick={()=>{setForm({...s});setEditItem(s);setModal(true);}} className="bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-lg text-xs font-bold">Edit</button><button onClick={()=>del(s._id)} className="bg-red-50 text-red-600 px-2.5 py-1.5 rounded-lg text-xs font-bold">Delete</button></div>}
          </div>
        ))}
      </div>
      {modal&&<Modal title={editItem?"Edit":"Add Stock"} onClose={()=>{setModal(false);setEditItem(null);}}>
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Category" value={form.category||""} onChange={e=>setForm({...form,category:e.target.value})} />
            <Select label="Product Type" value={form.productType||""} options={[{value:"",label:"General"},{value:"interlock",label:"Interlock"},{value:"hollowbrick",label:"Hollow Brick"}]} onChange={e=>setForm({...form,productType:e.target.value})} />
            <Input label="Color" value={form.color||""} onChange={e=>setForm({...form,color:e.target.value})} />
            <Input label={form.productType==="interlock"?"Size (inch)":"Size"} value={form.size||""} onChange={e=>setForm({...form,size:e.target.value})} placeholder={form.productType==="hollowbrick"?"e.g. 6 inch":form.productType==="interlock"?"e.g. 8x4":"e.g. 20x10x6"} />
            {form.productType==="interlock"&&<Input label="Thickness (inch)" value={form.thickness||""} onChange={e=>setForm({...form,thickness:e.target.value})} placeholder="e.g. 2.5" />}
            <Input label="Qty" type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:+e.target.value,sqftQuantity:(+e.target.value||0)*(+(form.sqftPerPiece)||0)})} />
            {form.productType!=="hollowbrick"&&<Input label="1 Piece Sqft" type="number" step="any" value={form.sqftPerPiece||""} onChange={e=>setForm({...form,sqftPerPiece:+e.target.value,sqftQuantity:(+(form.quantity)||0)*(+e.target.value||0)})} />}
            <Input label="Unit" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} />
            <Input label="Min Stock" type="number" value={form.minStock} onChange={e=>setForm({...form,minStock:+e.target.value})} />
            <Input label={`Price(${CURRENCY})`} type="number" value={form.price} onChange={e=>setForm({...form,price:+e.target.value})} />
          </div>
          <button onClick={save} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-bold">{editItem?"Save":"Add"}</button>
        </div>
      </Modal>}
    </div>
  );
}

// ─── RAW MATERIAL ─────────────────────────────────────────────────────────────
function RawMaterial({ raw, setRaw, user }) {
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const emptyForm = { name:"", quantity:0, unit:"bag", price:0, supplier:"" };
  const [form, setForm] = useState(emptyForm);

  const save = async () => {
    if (editItem) { await api("PUT",`/raw/${editItem._id}`,form); setRaw(p=>p.map(x=>x._id===editItem._id?{...x,...form}:x)); setEditItem(null); }
    else { const item=await api("POST","/raw",form); if(item._id) setRaw(p=>[...p,item]); }
    setModal(false); setForm(emptyForm);
  };

  const del = async (id) => { if(!window.confirm("Delete?")) return; await api("DELETE",`/raw/${id}`); setRaw(p=>p.filter(x=>x._id!==id)); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">🧱 Raw Material</h2>
        {isAdminLike(user.role)&&<button onClick={()=>{setForm(emptyForm);setEditItem(null);setModal(true);}} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ Add</button>}
      </div>
      <div className="space-y-2">
        {raw.length===0&&<EmptyState icon="🧱" text="No raw materials" />}
        {raw.map(r=>(
          <div key={r._id} className="bg-white rounded-2xl border shadow-sm p-4 flex items-center justify-between">
            <div><div className="font-black">{r.name||r.material}</div><div className="text-sm text-gray-600">{r.quantity||r.qty} {r.unit}</div>{r.supplier&&<div className="text-xs text-gray-400">Supplier: {r.supplier}</div>}</div>
            {isAdminLike(user.role)&&<div className="flex gap-1"><button onClick={()=>{setForm({...r});setEditItem(r);setModal(true);}} className="bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-lg text-xs font-bold">✏️</button><button onClick={()=>del(r._id)} className="bg-red-50 text-red-600 px-2.5 py-1.5 rounded-lg text-xs font-bold">🗑️</button></div>}
          </div>
        ))}
      </div>
      {modal&&<Modal title={editItem?"Edit":"Add Raw Material"} onClose={()=>{setModal(false);setEditItem(null);}}>
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Qty" type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:+e.target.value})} />
            <Select label="Unit" value={form.unit} options={["bag","kg","ton","litre","load","nos"]} onChange={e=>setForm({...form,unit:e.target.value})} />
            <Input label={`Price(${CURRENCY})`} type="number" value={form.price} onChange={e=>setForm({...form,price:+e.target.value})} />
            <Input label="Supplier" value={form.supplier} onChange={e=>setForm({...form,supplier:e.target.value})} />
          </div>
          <button onClick={save} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-bold">{editItem?"Save":"Add"}</button>
        </div>
      </Modal>}
    </div>
  );
}

// ─── PRODUCTION ───────────────────────────────────────────────────────────────
function Production({ production, setProduction, stock, user }) {
  const [modal, setModal] = useState(false);
  const emptyForm = { date:today(), product:"", target:0, produced:0, status:"pending", note:"" };
  const [form, setForm] = useState(emptyForm);

  const save = async () => {
    const item=await api("POST","/production",{...form,target:+form.target,produced:+form.produced,supervisor:user.name,status:isAdminLike(user.role)?"approved":"pending",product:form.product||stock[0]?.name||"Standard Interlock"});
    if(item._id){setProduction(p=>[item,...p]);setModal(false);setForm(emptyForm);}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">🏭 Production</h2>
        <button onClick={()=>setModal(true)} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ Log</button>
      </div>
      <div className="space-y-3">
        {production.length===0&&<EmptyState icon="🏭" text="No production logs" />}
        {production.map(p=><div key={p._id} className="bg-white rounded-2xl border shadow-sm p-4 flex items-center justify-between"><div><div className="font-black">{p.product}</div><div className="text-xs text-gray-400">📅 {p.date} · By: {p.supervisor}</div><div className="text-sm text-gray-600">Target: {p.target} · Done: <span className="font-bold text-green-700">{p.produced}</span></div></div><Badge color={p.status==="approved"?"green":p.status==="rejected"?"red":"yellow"}>{p.status}</Badge></div>)}
      </div>
      {modal&&<Modal title="Log Production" onClose={()=>setModal(false)}>
        <div className="space-y-3">
          <Input label="Date" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} />
          <Select label="Product" value={form.product} options={["",...stock.map(s=>s.name)]} onChange={e=>setForm({...form,product:e.target.value})} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Target" type="number" value={form.target} onChange={e=>setForm({...form,target:+e.target.value})} />
            <Input label="Produced" type="number" value={form.produced} onChange={e=>setForm({...form,produced:+e.target.value})} />
          </div>
          <button onClick={save} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-bold">Submit</button>
        </div>
      </Modal>}
    </div>
  );
}

// ─── SALES HELPERS ────────────────────────────────────────────────────────────
function salesDateRange(preset) {
  const now = new Date();
  const td = today();
  if (preset === "today") return { from: td, to: td };
  if (preset === "yesterday") {
    const y = new Date(now); y.setDate(y.getDate() - 1);
    const ds = y.toISOString().split("T")[0];
    return { from: ds, to: ds };
  }
  if (preset === "thismonth") {
    const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    return { from, to: td };
  }
  return null;
}

function filterSalesList(sales, { quickSearch, mobile, customer, datePreset, customDate, fromDate, toDate, invoice }) {
  let from = fromDate, to = toDate;
  if (datePreset && datePreset !== "custom" && datePreset !== "range") {
    const r = salesDateRange(datePreset);
    if (r) { from = r.from; to = r.to; }
  } else if (datePreset === "custom" && customDate) {
    from = customDate; to = customDate;
  }
  const q = (quickSearch || "").toLowerCase().trim();
  const mob = (mobile || "").replace(/\D/g, "");
  return sales.filter(s => {
    if (q && !(s.mobileNumber || "").includes(q) && !(s.customer || "").toLowerCase().includes(q)) return false;
    if (mob && !(s.mobileNumber || "").includes(mob)) return false;
    if (customer && !(s.customer || "").toLowerCase().includes(customer.toLowerCase())) return false;
    if (invoice && !(s.invoiceNumber || "").toLowerCase().includes(invoice.toLowerCase())) return false;
    if (from && s.date < from) return false;
    if (to && s.date > to) return false;
    return true;
  });
}

// ─── SALES ────────────────────────────────────────────────────────────────────
function Sales({ sales, setSales, stock, setStock, user }) {
  const [modal, setModal] = useState(false);
  const [interlockTypes, setInterlockTypes] = useState([]);
  const [customerMaster, setCustomerMaster] = useState([]);
  const [customerMode, setCustomerMode] = useState("existing");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [saveToMaster, setSaveToMaster] = useState(true);
  const [quickSearch, setQuickSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [ledger, setLedger] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [customerPreview, setCustomerPreview] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [printSale, setPrintSale] = useState(null);
  const [printOptions, setPrintOptions] = useState({ billType: "without_gst", gstNumber: "", cgstPercent: "", sgstPercent: "" });
  const [filters, setFilters] = useState({ mobile: "", customer: "", datePreset: "", customDate: "", fromDate: "", toDate: "", invoice: "" });

  const emptyForm = { date: today(), product: "", productType: "interlock", itemId: "", category: "", shape: "", color: "", size: "", thickness: "", interlockDetails: "", quantity: "", sqftPerPiece: "", sqftQty: "", unit: "piece", price: "", discount: "", amountPaid: "", customer: "", mobileNumber: "", address: "", gstNumber: "", state: "Kerala", stateCode: "32", reverseCharge: "No", transportMode: "", vehicleNumber: "", dateOfSupply: today(), placeOfSupply: "", hsnSac: "", bankName: "", bankAccount: "", bankIfsc: "", terms: "", billType: "without_gst", cgstPercent: "", sgstPercent: "", paymentMode: "Cash" };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    Promise.all([api("GET", "/masterdata/interlock"), api("GET", "/masterdata/hollowbricks"), api("GET", "/customers")]).then(([d, h, c]) => {
      const interlocks = Array.isArray(d) ? d.map(x => ({ ...x, productType: "interlock" })) : [];
      const hollow = Array.isArray(h) ? h.map(x => ({ ...x, productType: "hollowbrick" })) : [];
      setInterlockTypes([...interlocks, ...hollow]);
      setCustomerMaster(Array.isArray(c) ? c : []);
    });
  }, []);

  const isHollow = (sale = form) => sale?.productType === "hollowbrick";
  const isOther = (sale = form) => sale?.productType === "other";
  const hasSqftSale = (sale = form) => !isHollow(sale) && (+(sale?.sqftPerPiece || 0) > 0 || +(sale?.sqftQty || 0) > 0);
  const calcSqftQty = () => isHollow() ? 0 : (+(form.sqftQty || 0) || ((+(form.quantity || 0)) * (+(form.sqftPerPiece || 0))));
  const calcSubtotal = () => (isHollow() || (isOther() && !hasSqftSale()) ? +(form.quantity || 0) : calcSqftQty()) * +(form.price || 0);
  const calcTaxable = () => Math.max(0, calcSubtotal() - +(form.discount || 0));
  const calcCgst = () => form.billType === "with_gst" ? calcTaxable() * (+(form.cgstPercent || 0)) / 100 : 0;
  const calcSgst = () => form.billType === "with_gst" ? calcTaxable() * (+(form.sgstPercent || 0)) / 100 : 0;
  const calcTotal = () => Math.max(0, calcTaxable() + calcCgst() + calcSgst());
  const calcPending = () => Math.max(0, calcTotal() - +(form.amountPaid || 0));
  const billBaseAmount = (sale, opts = {}) => {
    if (sale?.taxableAmount != null) return +(sale.taxableAmount) || 0;
    if ((opts.billType || sale?.billType) === "with_gst" && (+(sale?.cgstAmount) || +(sale?.sgstAmount))) {
      return Math.max(0, (+(sale?.total) || 0) - (+(sale?.cgstAmount) || 0) - (+(sale?.sgstAmount) || 0));
    }
    return +(sale?.total) || 0;
  };
  const printTax = (sale, opts) => {
    const taxable = billBaseAmount(sale, opts);
    const withGst = opts.billType === "with_gst";
    const cgstPercent = withGst ? +(opts.cgstPercent || sale?.cgstPercent || 0) : 0;
    const sgstPercent = withGst ? +(opts.sgstPercent || sale?.sgstPercent || 0) : 0;
    const cgstAmount = taxable * cgstPercent / 100;
    const sgstAmount = taxable * sgstPercent / 100;
    return { taxable, cgstPercent, sgstPercent, cgstAmount, sgstAmount, total: taxable + cgstAmount + sgstAmount };
  };
  const saleSqftOf = (sale) => hasSqftSale(sale) ? (+(sale?.sqftQty || 0) || ((+(sale?.quantity || 0)) * (+(sale?.sqftPerPiece || 0)))) : 0;
  const saleQtyText = (sale) => isHollow(sale)
    ? `${fmt(sale?.quantity || 0)} numbers`
    : hasSqftSale(sale)
      ? `${fmt(sale?.quantity || 0)} ${sale?.unit || "pcs"} / ${fmt(saleSqftOf(sale))} sqft`
      : `${fmt(sale?.quantity || 0)} ${sale?.unit || "pcs"}`;

  const lookupCustomer = async (mobile) => {
    const m = mobile.replace(/\D/g, "").slice(-10);
    if (m.length < 10) { setCustomerPreview(null); return; }
    setLookupLoading(true);
    const data = await api("GET", `/customers/mobile/${m}`);
    setLookupLoading(false);
    if (data?.customer) {
      setCustomerPreview(data);
      setForm(f => ({ ...f, customer: data.customer.name || f.customer, address: data.customer.address || f.address, mobileNumber: m }));
    } else {
      setCustomerPreview(null);
    }
  };

  const ledgerQuery = () => {
    const q = [];
    if (filters.fromDate || filters.toDate) {
      if (filters.fromDate) q.push(`fromDate=${filters.fromDate}`);
      if (filters.toDate) q.push(`toDate=${filters.toDate}`);
    } else if (filters.datePreset && filters.datePreset !== "custom" && filters.datePreset !== "range") {
      const r = salesDateRange(filters.datePreset);
      if (r) { if (r.from) q.push(`fromDate=${r.from}`); if (r.to) q.push(`toDate=${r.to}`); }
    } else if (filters.datePreset === "custom" && filters.customDate) {
      q.push(`fromDate=${filters.customDate}`, `toDate=${filters.customDate}`);
    }
    return q.length ? `?${q.join("&")}` : "";
  };

  const openLedger = async (mobile, name) => {
    setLedgerLoading(true);
    let data;
    if (mobile) {
      const m = (mobile || "").replace(/\D/g, "").slice(-10);
      if (m.length < 10) { setLedgerLoading(false); return; }
      data = await api("GET", `/customers/mobile/${m}${ledgerQuery()}`);
    } else if (name) {
      data = await api("GET", `/customers/search?name=${encodeURIComponent(name)}${ledgerQuery().replace("?", "&")}`);
    }
    setLedgerLoading(false);
    if (data?.customer) setLedger(data);
    else if (data?.customers?.length) setLedger({ pickList: data.customers });
  };

  const handleQuickSearch = async () => {
    const q = quickSearch.trim();
    if (!q) { setLedger(null); return; }
    const isMobile = /^\d{6,}$/.test(q.replace(/\D/g, ""));
    if (isMobile) await openLedger(q.replace(/\D/g, "").slice(-10));
    else await openLedger(null, q);
  };

  const selectMasterCustomer = (id) => {
    setSelectedCustomerId(id);
    const c = customerMaster.find(x => x._id === id);
    if (!c) return;
    setForm(f => ({ ...f, customer: c.name, mobileNumber: c.mobile, address: c.address || "", gstNumber: c.gstNumber || "" }));
    lookupCustomer(c.mobile);
  };

  const save = async () => {
    setSaveError("");
    const mobile = (form.mobileNumber || "").replace(/\D/g, "").slice(-10);
    if (!mobile || mobile.length < 10) { setSaveError("Mobile number is required (10 digits)"); return; }
    if (!form.customer) { setSaveError("Customer name is required"); return; }
    if (!form.product) { setSaveError("Select a product"); return; }
    const total = calcTotal();
    const amountPaid = +(form.amountPaid || 0);
    const item = await api("POST", "/sales", {
      ...form, mobileNumber: mobile, total, discount: +(form.discount || 0),
      taxableAmount: calcTaxable(), sqftPerPiece: isHollow() ? 0 : +(form.sqftPerPiece || 0), sqftQty: hasSqftSale() ? calcSqftQty() : 0, cgstPercent: +(form.cgstPercent || 0), sgstPercent: +(form.sgstPercent || 0),
      cgstAmount: calcCgst(), sgstAmount: calcSgst(),
      amountPaid, amountPending: Math.max(0, total - amountPaid),
      quantity: +form.quantity, price: +form.price, addedBy: user.name,
      saveToCustomerMaster: customerMode === "new" ? saveToMaster : true,
    });
    if (item._id) {
      setSales(p => [item, ...p]);
      setModal(false);
      setForm(emptyForm);
      setCustomerPreview(null);
      setSelectedCustomerId("");
      api("GET", "/customers").then(c => setCustomerMaster(Array.isArray(c) ? c : []));
      api("GET", "/stock").then(s => setStock?.(Array.isArray(s) ? s : []));
    } else {
      setSaveError(item.message || "Failed to save sale");
    }
  };

  const openPrintBill = (sale) => {
    setPrintSale(sale);
    setPrintOptions({
      billType: sale.billType === "with_gst" ? "with_gst" : "without_gst",
      gstNumber: sale.gstNumber || "",
      cgstPercent: sale.cgstPercent ? String(sale.cgstPercent) : "",
      sgstPercent: sale.sgstPercent ? String(sale.sgstPercent) : "",
    });
  };

  const printBill = () => {
    if (!printSale) return;
    const tax = printTax(printSale, printOptions);
    const withGst = printOptions.billType === "with_gst";
    const invoiceNo = printSale.invoiceNumber || printSale._id?.slice(-8)?.toUpperCase() || "";
    const details = isOther(printSale)
      ? [printSale.category, printSale.color, printSale.size].filter(Boolean).join(" / ")
      : [printSale.shape, printSale.color, printSale.size ? `${printSale.size} inch` : "", printSale.thickness ? `${printSale.thickness} inch thick` : ""].filter(Boolean).join(" / ");
    const countOnly = isHollow(printSale) || (isOther(printSale) && !hasSqftSale(printSale));
    const saleSqft = countOnly ? 0 : saleSqftOf(printSale);
    const itemAmount = tax.taxable;
    const cgstRate = withGst ? tax.cgstPercent : 0;
    const sgstRate = withGst ? tax.sgstPercent : 0;
    const igstRate = 0;
    const fullDetails = [
      printSale.interlockDetails || details,
      printSale.category ? `Category: ${printSale.category}` : "",
      printSale.shape ? `Shape: ${printSale.shape}` : "",
      printSale.color ? `Color: ${printSale.color}` : "",
      printSale.size ? `Size/No.: ${isOther(printSale) ? printSale.size : `${printSale.size} inch`}` : "",
      printSale.thickness && !isOther(printSale) ? `Thickness: ${printSale.thickness} inch` : "",
      printSale.sqftPerPiece && !countOnly ? `1 piece = ${fmt(printSale.sqftPerPiece)} sqft` : "",
      printSale.unit ? `Unit: ${printSale.unit}` : ""
    ].filter(Boolean).join("<br>");
    const rows = `
      <tr>
        <td class="center">1</td>
        <td><b>${printSale.product || "-"}</b><br><span>${fullDetails || ""}</span></td>
        <td class="center">${printSale.hsnSac || "-"}</td>
        <td class="right">${fmt(printSale.quantity)}</td>
        <td class="right">${countOnly ? (printSale.unit || "piece") : fmt(saleSqft)}</td>
        <td class="right">${CURRENCY}${fmt(printSale.price)}</td>
        <td class="right">${CURRENCY}${fmt(itemAmount)}</td>
        <td class="right">${cgstRate || ""}</td>
        <td class="right">${withGst ? CURRENCY + fmt(tax.cgstAmount) : ""}</td>
        <td class="right">${sgstRate || ""}</td>
        <td class="right">${withGst ? CURRENCY + fmt(tax.sgstAmount) : ""}</td>
        <td class="right">${igstRate || ""}</td>
        <td class="right"></td>
        <td class="right">${CURRENCY}${fmt(tax.total)}</td>
      </tr>`;
    const html = `<!doctype html><html><head><title>Invoice ${invoiceNo}</title>
      <style>
        *{box-sizing:border-box}body{font-family:Arial,"Times New Roman",serif;color:#172554;margin:18px;background:#f8fafc}.invoice{background:#fff;border:2px solid #172554;max-width:1120px;margin:auto;box-shadow:0 18px 50px rgba(15,23,42,.12)}
        .printbtn{position:fixed;right:18px;top:12px;padding:9px 16px;border:0;border-radius:8px;background:#172554;color:white;font-weight:700}.title{display:grid;grid-template-columns:1.05fr 2fr 1.05fr;border-bottom:2px solid #172554;min-height:118px}
        .title>div{padding:10px}.brand{text-align:center}.brand h1{font-size:29px;margin:6px 0 4px;letter-spacing:.4px;color:#111827}.brand .addr{font-size:13px;font-weight:700;line-height:1.45;color:#1f2937}.brand .gst{display:inline-block;margin-top:5px;border:1px solid #172554;padding:3px 10px;font-size:12px;font-weight:700}
        .side{font-size:13px;line-height:1.75}.side.right{text-align:right}.pill{display:inline-block;border:1px solid #172554;border-radius:3px;padding:2px 8px;margin-top:3px}.grid2{display:grid;grid-template-columns:1fr 1fr;border-bottom:2px solid #172554}.cell{padding:0;border-right:2px solid #172554;min-height:154px}.cell:last-child{border-right:0}.cell-body{padding:8px 10px}
        .line{display:grid;grid-template-columns:145px 1fr;font-size:13px;line-height:1.65;gap:6px}.label{font-weight:700;color:#111827}.section-title{text-align:center;font-weight:800;border-bottom:1px solid #172554;padding:6px 4px;font-size:12px;background:#eff6ff;letter-spacing:.3px}
        table{width:100%;border-collapse:collapse}th,td{border:1px solid #172554;padding:6px;font-size:12px;vertical-align:top}th{font-weight:800;text-align:center;background:#f8fafc}.right{text-align:right}.center{text-align:center}.total-row td{font-weight:800;background:#f8fafc}
        .words{border-top:2px solid #172554;padding:9px 10px;font-size:13px}.bottom{display:grid;grid-template-columns:1.15fr 1fr;border-top:2px solid #172554}.bank,.amounts{min-height:190px}.bank{border-right:2px solid #172554}.bank .body{padding:10px 12px;font-size:13px;line-height:1.75}.amounts table td{height:23px}.amounts table tr:last-child td{font-size:13px;background:#eff6ff}
        .footer{display:grid;grid-template-columns:1fr 1fr;border-top:2px solid #172554;min-height:96px}.seal{border-right:2px solid #172554;text-align:center;padding-top:36px;font-size:13px;color:#64748b}.sign{text-align:right;padding:10px 14px;font-size:13px}.sign b{display:block;margin-top:40px}
        @media print{.printbtn{display:none}body{margin:7mm;background:#fff}.invoice{max-width:none;box-shadow:none}th{background:#fff}.section-title,.amounts table tr:last-child td{background:#fff}}
      </style></head><body>
      <button class="printbtn" onclick="window.print()">Print</button>
      <div class="invoice">
        <div class="title">
          <div class="side"><b><i>TAX INVOICE</i></b><br>Invoice No. : <b>${invoiceNo}</b><br>Invoice Date : <b>${printSale.date || ""}</b><br>Reverse Charge : ${printSale.reverseCharge || "No"}<br><span class="pill">State Code: ${printSale.stateCode || "32"}</span></div>
          <div class="brand"><h1>P. K. INTERLOCKS & HOLLOW BRICKS</h1><div class="addr">HAJ ROAD, VILAKKODE, IRITTY<br>State: Kerala</div><div class="gst">GSTIN: 32AESHA2414P1ZP</div></div>
          <div class="side right"><b>PH:</b> 7034116685<br>9946956685<br><br>Date: <b>${printSale.date || ""}</b></div>
        </div>
        <div class="grid2">
          <div class="cell">
            <div class="section-title">Details of Receiver / Billed to</div>
            <div class="cell-body">
            <div class="line"><span class="label">Name</span><span>: ${printSale.customer || "-"}</span></div>
            <div class="line"><span class="label">Mobile</span><span>: ${printSale.mobileNumber || "-"}</span></div>
            <div class="line"><span class="label">GSTIN</span><span>: ${withGst ? (printOptions.gstNumber || printSale.gstNumber || "-") : "-"}</span></div>
            <div class="line"><span class="label">Address</span><span>: ${printSale.address || "-"}</span></div>
            <div class="line"><span class="label">State</span><span>: ${printSale.state || "Kerala"}</span></div>
            <div class="line"><span class="label">State Code</span><span>: ${printSale.stateCode || "32"}</span></div>
            </div>
          </div>
          <div class="cell">
            <div class="section-title">Details of Consignee / Shipped to</div>
            <div class="cell-body">
            <div class="line"><span class="label">Transportation Mode</span><span>: ${printSale.transportMode || "-"}</span></div>
            <div class="line"><span class="label">Vehicle Number</span><span>: ${printSale.vehicleNumber || "-"}</span></div>
            <div class="line"><span class="label">Date of Supply</span><span>: ${printSale.dateOfSupply || printSale.date || "-"}</span></div>
            <div class="line"><span class="label">Place of Supply</span><span>: ${printSale.placeOfSupply || "-"}</span></div>
            <div class="line"><span class="label">Payment Mode</span><span>: ${printSale.paymentMode || "-"}</span></div>
            </div>
          </div>
        </div>
        <table>
          <thead><tr><th>Sl.<br>No.</th><th>Name of Product / Service</th><th>HSN/SAC</th><th>Qty</th><th>${countOnly ? "Unit" : "Sqft"}</th><th>Rate</th><th>Taxable<br>Value</th><th colspan="2">CGST</th><th colspan="2">SGST</th><th colspan="2">IGST</th><th>Total</th></tr>
          <tr><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th>Rate</th><th>Amount</th><th>Rate</th><th>Amount</th><th>Rate</th><th>Amount</th><th></th></tr></thead>
          <tbody>${rows}<tr class="total-row"><td colspan="6" class="right">Total</td><td class="right">${CURRENCY}${fmt(tax.taxable)}</td><td></td><td class="right">${withGst ? CURRENCY + fmt(tax.cgstAmount) : ""}</td><td></td><td class="right">${withGst ? CURRENCY + fmt(tax.sgstAmount) : ""}</td><td></td><td></td><td class="right">${CURRENCY}${fmt(tax.total)}</td></tr></tbody>
        </table>
        <div class="words"><b>Total Invoice Amount:</b> ${CURRENCY}${fmt(tax.total)} only</div>
        <div class="bottom">
          <div class="bank">
            <div class="section-title">BANK DETAILS</div>
            <div class="body">Name of Bank : ${printSale.bankName || "-"}<br>Bank A/C No. : ${printSale.bankAccount || "-"}<br>Bank Branch IFSC : ${printSale.bankIfsc || "-"}<br><br><b>Terms & Conditions:</b><br>${printSale.terms || "Certified that the particulars given above are true and correct."}</div>
          </div>
          <div class="amounts">
            <table><tbody>
              <tr><td>Total Amount Before Tax</td><td class="right">${CURRENCY}${fmt(tax.taxable)}</td></tr>
              <tr><td>Discount</td><td class="right">${CURRENCY}${fmt(printSale.discount || 0)}</td></tr>
              <tr><td>Add : CGST</td><td class="right">${withGst ? CURRENCY + fmt(tax.cgstAmount) : ""}</td></tr>
              <tr><td>Add : SGST</td><td class="right">${withGst ? CURRENCY + fmt(tax.sgstAmount) : ""}</td></tr>
              <tr><td>Add : IGST</td><td class="right"></td></tr>
              <tr><td>Tax Amount : GST</td><td class="right">${withGst ? CURRENCY + fmt(tax.cgstAmount + tax.sgstAmount) : ""}</td></tr>
              <tr><td>Total Amount After Tax</td><td class="right"><b>${CURRENCY}${fmt(tax.total)}</b></td></tr>
              <tr><td>Payment Mode</td><td class="right">${printSale.paymentMode || "-"}</td></tr>
              <tr><td>Paid</td><td class="right">${CURRENCY}${fmt(printSale.amountPaid)}</td></tr>
              <tr><td>Pending</td><td class="right">${CURRENCY}${fmt(Math.max(0, tax.total - (+(printSale.amountPaid)||0)))}</td></tr>
            </tbody></table>
          </div>
        </div>
        <div class="footer"><div class="seal">(Common Seal)</div><div class="sign">For P.K. Interlocks & Hollowbricks<b>Authorised Signatory</b></div></div>
      </div>
      <script>window.onload=()=>setTimeout(()=>window.print(),250)</script></body></html>`;
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const filtered = filterSalesList(sales, { quickSearch, ...filters });
  const filteredTotal = filtered.reduce((a, s) => a + (+(s.total) || 0), 0);
  const filteredPaid = filtered.reduce((a, s) => a + (+(s.amountPaid) || 0), 0);
  const filteredPending = filtered.reduce((a, s) => a + (+(s.amountPending) || 0), 0);
  const filteredQty = filtered.reduce((a, s) => a + (+(s.quantity) || 0), 0);
  const filteredSqft = filtered.reduce((a, s) => a + saleSqftOf(s), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">💰 Sales</h2>
        <button onClick={() => { setModal(true); setSaveError(""); setCustomerPreview(null); setCustomerMode("existing"); setSaveToMaster(true); }} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ Sale</button>
      </div>

      {/* Quick Search */}
      <div className="bg-white rounded-2xl border shadow-sm p-3">
        <div className="flex gap-2">
          <input
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50"
            placeholder="🔍 Search by Mobile Number / Customer Name"
            value={quickSearch}
            onChange={e => setQuickSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleQuickSearch()}
          />
          <button onClick={handleQuickSearch} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shrink-0">Search</button>
        </div>
        {ledgerLoading && <div className="text-xs text-amber-600 mt-2">Loading customer...</div>}
      </div>

      {/* Customer pick list */}
      {ledger?.pickList && (
        <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-2">
          <div className="font-bold text-sm">Multiple customers found — select one:</div>
          {ledger.pickList.map(c => (
            <button key={c._id} onClick={() => openLedger(c.mobile)} className="w-full text-left bg-gray-50 hover:bg-amber-50 border rounded-xl p-3 text-sm">
              <div className="font-bold">{c.name}</div>
              <div className="text-xs text-gray-400">📱 {c.mobile} · Pending: {CURRENCY}{fmt(c.totalPending || 0)}</div>
            </button>
          ))}
          <button onClick={() => setLedger(null)} className="text-xs text-red-500 font-bold">Cancel</button>
        </div>
      )}

      {/* Customer Ledger */}
      {ledger?.customer && (
        <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 flex items-center justify-between">
            <div className="text-white font-black">📒 Customer Ledger</div>
            <button onClick={() => setLedger(null)} className="text-white/80 hover:text-white text-xl leading-none">×</button>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-400 text-xs">Customer</span><div className="font-bold">{ledger.customer.name || "—"}</div></div>
              <div><span className="text-gray-400 text-xs">Mobile</span><div className="font-bold">{ledger.customer.mobile}</div></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <StatCard label="Total Purchases" value={ledger.customer.totalPurchases} icon="🛒" color="blue" />
              <StatCard label="Sales Amount" value={`${CURRENCY}${fmt(ledger.customer.totalSalesAmount)}`} icon="💰" color="green" />
              <StatCard label="Total Quantity" value={fmt(ledger.customer.totalQuantity)} icon="📦" color="purple" />
              <StatCard label="Discount Given" value={`${CURRENCY}${fmt(ledger.customer.totalDiscount)}`} icon="🏷️" color="amber" />
              <StatCard label="Total Paid" value={`${CURRENCY}${fmt(ledger.customer.totalPaid)}`} icon="✅" color="teal" />
              <StatCard label="Total Pending" value={`${CURRENCY}${fmt(ledger.customer.totalPending)}`} icon="⏳" color="red" />
            </div>
            {(ledger.itemSummary || []).length > 0 && (
              <SectionBox title="Purchased Items Summary" icon="📦" color="blue">
                <table className="w-full text-xs">
                  <thead><tr className="text-gray-400"><th className="text-left p-1">Item</th><th className="text-right p-1">Total Qty / Sqft</th></tr></thead>
                  <tbody>
                    {ledger.itemSummary.map((it, i) => (
                      <tr key={i} className="border-t border-gray-100"><td className="p-1 font-semibold">{it.item}</td><td className="p-1 text-right">{qtyWithSqft(it)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </SectionBox>
            )}
            <div className="overflow-x-auto">
              <div className="text-xs font-bold text-gray-600 mb-1">Complete Purchase History</div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Item</th>
                    <th className="text-right p-2">Qty</th>
                    <th className="text-right p-2">Amount</th>
                    <th className="text-right p-2">Discount</th>
                    <th className="text-right p-2">Paid</th>
                    <th className="text-right p-2">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {(ledger.purchases || []).map(p => (
                    <tr key={p._id} className="border-t border-gray-100">
                      <td className="p-2">{p.date}</td>
                      <td className="p-2 font-semibold">{p.product}</td>
                      <td className="p-2 text-right">{saleQtyText(p)}</td>
                      <td className="p-2 text-right text-green-700 font-bold">{CURRENCY}{fmt(+(p.total) || 0)}</td>
                      <td className="p-2 text-right text-amber-600">{CURRENCY}{fmt(+(p.discount) || 0)}</td>
                      <td className="p-2 text-right text-teal-700">{CURRENCY}{fmt(+(p.amountPaid) || 0)}</td>
                      <td className="p-2 text-right text-red-600">{CURRENCY}{fmt(+(p.amountPending) || 0)}</td>
                    </tr>
                  ))}
                  {(ledger.purchases || []).length === 0 && (
                    <tr><td colSpan={7} className="p-4 text-center text-gray-400">No purchases found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Search Filters */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <button onClick={() => setShowFilters(!showFilters)} className="w-full px-4 py-3 flex items-center justify-between text-sm font-bold text-gray-700 hover:bg-gray-50">
          <span>🔎 Sales Reports & Filters</span>
          <span>{showFilters ? "▲" : "▼"}</span>
        </button>
        {showFilters && (
          <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
            <div className="grid grid-cols-2 gap-2">
              <Input label="Mobile Number" value={filters.mobile} onChange={e => setFilters({ ...filters, mobile: e.target.value })} placeholder="9876543210" />
              <Input label="Customer Name" value={filters.customer} onChange={e => setFilters({ ...filters, customer: e.target.value })} placeholder="Name" />
            </div>
            <Input label="Invoice Number" value={filters.invoice} onChange={e => setFilters({ ...filters, invoice: e.target.value })} placeholder="Future use" />
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Date Filter</label>
              <div className="flex flex-wrap gap-1.5">
                {[{ id: "", label: "All" }, { id: "today", label: "Today" }, { id: "yesterday", label: "Yesterday" }, { id: "thismonth", label: "This Month" }, { id: "custom", label: "Custom Date" }, { id: "range", label: "Date Range" }].map(d => (
                  <button key={d.id} onClick={() => setFilters({ ...filters, datePreset: d.id })} className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${filters.datePreset === d.id ? "bg-amber-500 text-white border-amber-500" : "bg-gray-50 text-gray-600 border-gray-200"}`}>{d.label}</button>
                ))}
              </div>
            </div>
            {filters.datePreset === "custom" && (
              <Input label="Date" type="date" value={filters.customDate} onChange={e => setFilters({ ...filters, customDate: e.target.value })} />
            )}
            {filters.datePreset === "range" && (
              <div className="grid grid-cols-2 gap-2">
                <Input label="From" type="date" value={filters.fromDate} onChange={e => setFilters({ ...filters, fromDate: e.target.value })} />
                <Input label="To" type="date" value={filters.toDate} onChange={e => setFilters({ ...filters, toDate: e.target.value })} />
              </div>
            )}
            <button onClick={() => setFilters({ mobile: "", customer: "", datePreset: "", customDate: "", fromDate: "", toDate: "", invoice: "" })} className="text-xs text-red-500 font-bold">Clear Filters</button>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Total Sales" value={`${CURRENCY}${fmt(filteredTotal)}`} icon="💰" color="green" sub={`${filtered.length} record(s)`} />
        <StatCard label="Total Qty" value={fmt(filteredQty)} icon="📦" color="blue" sub={filteredSqft ? `${fmt(filteredSqft)} sqft` : "Numbers only"} />
        <StatCard label="Total Paid" value={`${CURRENCY}${fmt(filteredPaid)}`} icon="✅" color="teal" />
        <StatCard label="Total Pending" value={`${CURRENCY}${fmt(filteredPending)}`} icon="⏳" color="red" />
      </div>

      {/* Sales List */}
      <div className="space-y-2">
        {filtered.length === 0 && <EmptyState icon="💰" text="No sales found" />}
        {filtered.map(s => (
          <div key={s._id} className="bg-white rounded-2xl border shadow-sm p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-black text-gray-900">{s.product}</div>
                {s.interlockDetails && <div className="text-xs text-amber-600">{s.interlockDetails}</div>}
                <div className="text-xs text-gray-400 mt-0.5">📅 {s.date}{s.customer ? ` · 👤 ${s.customer}` : ""}</div>
                {s.mobileNumber && <div className="text-xs text-gray-500">📱 {s.mobileNumber}</div>}
                <div className="text-sm text-gray-600">{saleQtyText(s)} x {CURRENCY}{s.price}{isHollow(s) ? "" : ""}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-black text-green-700">{CURRENCY}{fmt(+(s.total) || 0)}</div>
                {(+(s.amountPaid) || 0) > 0 && <div className="text-xs text-teal-600">Paid: {CURRENCY}{fmt(+(s.amountPaid) || 0)}</div>}
                {(+(s.amountPending) || 0) > 0 && <div className="text-xs text-red-500">Pending: {CURRENCY}{fmt(+(s.amountPending) || 0)}</div>}
                <Badge color={s.paymentMode === "Cash" ? "green" : s.paymentMode === "Credit" ? "red" : "blue"}>{s.paymentMode}</Badge>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {s.mobileNumber && (
                <button onClick={() => openLedger(s.mobileNumber)} className="text-xs text-amber-600 font-bold hover:underline">View Customer Ledger</button>
              )}
              <button onClick={() => openPrintBill(s)} className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl font-bold hover:bg-blue-100">Print Bill</button>
            </div>
          </div>
        ))}
      </div>

      {/* Record Sale Modal */}
      {modal && (
        <Modal title="Record Sale" onClose={() => { setModal(false); setSaveError(""); setCustomerPreview(null); }} wide>
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
              <div className="text-xs font-bold text-blue-700">Customer Details</div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setCustomerMode("existing")} className={`flex-1 py-2 rounded-xl text-xs font-bold border ${customerMode === "existing" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600"}`}>Select Existing</button>
                <button type="button" onClick={() => { setCustomerMode("new"); setSelectedCustomerId(""); setCustomerPreview(null); }} className={`flex-1 py-2 rounded-xl text-xs font-bold border ${customerMode === "new" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600"}`}>New Customer</button>
              </div>
              {customerMode === "existing" ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Select Customer *</label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white" value={selectedCustomerId} onChange={e => selectMasterCustomer(e.target.value)}>
                    <option value="">-- Select from Customer Master --</option>
                    {customerMaster.map(c => <option key={c._id} value={c._id}>{c.name} ({c.mobile})</option>)}
                  </select>
                </div>
              ) : (
                <>
                  <Input label="Mobile Number *" value={form.mobileNumber} onChange={e => setForm({ ...form, mobileNumber: e.target.value })} onBlur={e => lookupCustomer(e.target.value)} placeholder="10-digit mobile" />
                  <Input label="Customer Name *" value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} placeholder="Customer name" />
                  <Input label="Address (optional)" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Address" />
                  <Input label="GST Number (optional)" value={form.gstNumber} onChange={e => setForm({ ...form, gstNumber: e.target.value })} placeholder="GSTIN" />
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={saveToMaster} onChange={e => setSaveToMaster(e.target.checked)} className="rounded" />
                    Save to Customer Master
                  </label>
                </>
              )}
              {lookupLoading && <div className="text-xs text-amber-600">Looking up customer...</div>}
              {customerPreview?.customer && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-2 text-xs space-y-1">
                  <div className="font-bold text-green-700">✅ Existing Customer Found</div>
                  <div>Previous Purchases: <b>{customerPreview.customer.totalPurchases}</b></div>
                  <div>Total Paid: <b>{CURRENCY}{fmt(customerPreview.customer.totalPaid)}</b></div>
                  <div>Total Pending: <b className="text-red-600">{CURRENCY}{fmt(customerPreview.customer.totalPending)}</b></div>
                </div>
              )}
              {customerMode === "existing" && selectedCustomerId && (
                <div className="text-xs text-gray-600 bg-white rounded-xl p-2 border">
                  <div><b>Name:</b> {form.customer}</div>
                  <div><b>Mobile:</b> {form.mobileNumber}</div>
                  <div><b>Address:</b> {form.address || "—"}</div>
                </div>
              )}
            </div>

            <Input label="Date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
              <div className="text-xs font-bold text-gray-600">Invoice & Transport Details</div>
              <div className="grid grid-cols-2 gap-2">
                <Input label="Invoice Number" value={form.invoiceNumber || ""} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })} placeholder="Auto if blank" />
                <Select label="Reverse Charge" value={form.reverseCharge || "No"} options={["No", "Yes"]} onChange={e => setForm({ ...form, reverseCharge: e.target.value })} />
                <Input label="State" value={form.state || ""} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="Kerala" />
                <Input label="State Code" value={form.stateCode || ""} onChange={e => setForm({ ...form, stateCode: e.target.value })} placeholder="32" />
                <Input label="Transport Mode" value={form.transportMode || ""} onChange={e => setForm({ ...form, transportMode: e.target.value })} placeholder="Road / Own Vehicle" />
                <Input label="Vehicle Number" value={form.vehicleNumber || ""} onChange={e => setForm({ ...form, vehicleNumber: e.target.value })} placeholder="KL-00-0000" />
                <Input label="Date of Supply" type="date" value={form.dateOfSupply || ""} onChange={e => setForm({ ...form, dateOfSupply: e.target.value })} />
                <Input label="Place of Supply" value={form.placeOfSupply || ""} onChange={e => setForm({ ...form, placeOfSupply: e.target.value })} placeholder="Place" />
                <Input label="HSN / SAC" value={form.hsnSac || ""} onChange={e => setForm({ ...form, hsnSac: e.target.value })} placeholder="HSN/SAC" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Product *</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50" value={isOther() ? "__other" : form.itemId} onChange={e => {
                if (e.target.value === "__other") {
                  setForm({ ...form, itemId: "", productType: "other", product: "", category: "", shape: "", color: "", size: "", thickness: "", sqftPerPiece: "", sqftQty: "", interlockDetails: "", unit: "piece", price: "" });
                  return;
                }
                const it = interlockTypes.find(x => x._id === e.target.value);
                const isHb = it?.productType === "hollowbrick";
                const details = it ? (isHb ? [it.category, it.size ? `${it.size} inch` : ""].filter(Boolean).join(" / ") : [it.shape, it.color, it.size ? `${it.size} inch` : "", it.thickness ? `${it.thickness} inch thick` : ""].filter(Boolean).join(" / ")) : "";
                const price = isHb ? (it?.price || 0) : (it?.pricePerSqft || 0);
                const sqftPerPiece = isHb ? 0 : +(it?.sqftPerPiece || 0);
                const pieces = +(form.quantity || 0);
                setForm({ ...form, itemId: it?._id || "", productType: it?.productType || "interlock", product: it?.name || "", category: it?.category || "", shape: it?.shape || "", color: it?.color || "", size: it?.size || "", thickness: it?.thickness || "", sqftPerPiece: String(sqftPerPiece || ""), sqftQty: pieces && sqftPerPiece ? String(pieces * sqftPerPiece) : "", unit: "piece", interlockDetails: details, price: String(price) });
              }}>
                <option value="">-- Select Product --</option>
                {interlockTypes.map(i => (
                  <option key={`${i.productType}-${i._id}`} value={i._id}>{i.productType === "hollowbrick" ? "Hollow Brick - " : ""}{i.name}{i.color ? ` (${i.color})` : ""}{i.size ? ` - ${i.size}${i.productType==="hollowbrick" ? " inch" : ""}` : ""}</option>
                ))}
                <option value="__other">Other - Manual Product</option>
              </select>
              {isOther() && (
                <div className="mt-2 bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Product Name" value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} placeholder="Type product name" />
                    <Input label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Category" />
                    <Input label="Color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="Color" />
                    <Input label="Size / No." value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} placeholder="Size, No., model" />
                    <Input label="Unit" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value || "piece" })} placeholder="piece / load / number" />
                    <Input label="Extra Details" value={form.interlockDetails} onChange={e => setForm({ ...form, interlockDetails: e.target.value })} placeholder="Any bill description" />
                  </div>
                </div>
              )}
              {form.product && interlockTypes.find(x => x._id === form.itemId) && (
                <div className="mt-1 bg-amber-50 rounded-xl p-2 text-xs text-gray-600">
                  {form.category && <div>Category: {form.category}</div>}
                  {form.interlockDetails && <div>{form.interlockDetails}</div>}
                  {!isHollow() && interlockTypes.find(x => x._id === form.itemId)?.sqftPerPiece && <div>1 piece = {fmt(interlockTypes.find(x => x._id === form.itemId)?.sqftPerPiece)} sqft</div>}
                  <div className="text-amber-700 font-bold">Rate: {CURRENCY}{form.price || 0}{isHollow() ? " / piece" : ""}</div>
                </div>
              )}
              {interlockTypes.length === 0 && <div className="text-xs text-red-500 mt-1">No interlock types found. Add them in ⚙️ Master Data first!</div>}
            </div>
            <div className={`grid grid-cols-2 ${isHollow() ? "md:grid-cols-2" : "md:grid-cols-4"} gap-2`}>
              <Input label={isHollow() ? "Numbers" : isOther() ? "Quantity / No." : "Pieces"} type="number" value={form.quantity} onChange={e => {
                const pieces = +(e.target.value || 0);
                const sqftPerPiece = +(form.sqftPerPiece || 0);
                setForm({ ...form, quantity: e.target.value, sqftQty: !isHollow() && sqftPerPiece ? String(pieces * sqftPerPiece) : "" });
              }} placeholder="0" />
              {!isHollow() && <>
                <Input label={isOther() ? "1 Unit Sqft (optional)" : "1 Piece Sqft"} type="number" step="any" value={form.sqftPerPiece} onChange={e => {
                  const sqftPerPiece = +(e.target.value || 0);
                  const pieces = +(form.quantity || 0);
                  setForm({ ...form, sqftPerPiece: e.target.value, sqftQty: sqftPerPiece && pieces ? String(pieces * sqftPerPiece) : "" });
                }} placeholder="0" />
                <Input label="Total Sqft" type="number" value={calcSqftQty()} readOnly />
              </>}
              <Input label={`Rate (${CURRENCY})`} type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0" />
            </div>
            <Input label={`Discount (${CURRENCY})`} type="number" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} placeholder="0" />
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
              <Select label="Bill Type" value={form.billType} options={[{ value: "without_gst", label: "Without GST" }, { value: "with_gst", label: "With GST" }]} onChange={e => setForm({ ...form, billType: e.target.value })} />
              {form.billType === "with_gst" && (
                <>
                  <Input label="Customer GST Number" value={form.gstNumber} onChange={e => setForm({ ...form, gstNumber: e.target.value })} placeholder="GSTIN" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="CGST %" type="number" step="any" value={form.cgstPercent} onChange={e => setForm({ ...form, cgstPercent: e.target.value })} placeholder="9" />
                    <Input label="SGST %" type="number" step="any" value={form.sgstPercent} onChange={e => setForm({ ...form, sgstPercent: e.target.value })} placeholder="9" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white rounded-xl p-2"><div className="font-black">{CURRENCY}{fmt(calcTaxable())}</div><div className="text-gray-400">Taxable</div></div>
                    <div className="bg-white rounded-xl p-2"><div className="font-black">{CURRENCY}{fmt(calcCgst())}</div><div className="text-gray-400">CGST</div></div>
                    <div className="bg-white rounded-xl p-2"><div className="font-black">{CURRENCY}{fmt(calcSgst())}</div><div className="text-gray-400">SGST</div></div>
                  </div>
                </>
              )}
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <div className="text-xs text-gray-400">Total Amount</div>
              <div className="text-2xl font-black text-green-700">{CURRENCY}{fmt(calcTotal())}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input label={`Amount Paid (${CURRENCY})`} type="number" value={form.amountPaid} onChange={e => setForm({ ...form, amountPaid: e.target.value })} placeholder="0" />
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Pending Amount</label>
                <div className="w-full border border-red-200 rounded-xl px-3 py-2.5 text-sm bg-red-50 text-red-700 font-bold">{CURRENCY}{fmt(calcPending())}</div>
              </div>
            </div>
            <Select label="Payment Mode" value={form.paymentMode} options={["Cash", "Bank", "GPay", "UPI", "Credit"]} onChange={e => {
              const mode = e.target.value;
              setForm({ ...form, paymentMode: mode, amountPaid: mode === "Credit" ? form.amountPaid : String(calcTotal()) });
            }} />
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
              <div className="text-xs font-bold text-gray-600">Bank Details & Terms</div>
              <Input label="Bank Name" value={form.bankName || ""} onChange={e => setForm({ ...form, bankName: e.target.value })} placeholder="Bank name" />
              <div className="grid grid-cols-2 gap-2">
                <Input label="Bank A/C No." value={form.bankAccount || ""} onChange={e => setForm({ ...form, bankAccount: e.target.value })} placeholder="Account number" />
                <Input label="Bank IFSC" value={form.bankIfsc || ""} onChange={e => setForm({ ...form, bankIfsc: e.target.value })} placeholder="IFSC" />
              </div>
              <Textarea label="Terms & Conditions" value={form.terms || ""} onChange={e => setForm({ ...form, terms: e.target.value })} placeholder="Terms & conditions" />
            </div>
            {saveError && <div className="text-xs text-red-600 font-bold bg-red-50 border border-red-200 rounded-xl p-2">{saveError}</div>}
            <button onClick={save} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600">Record Sale</button>
          </div>
        </Modal>
      )}
      {printSale && (
        <Modal title="Print Bill" onClose={() => setPrintSale(null)}>
          <div className="space-y-3">
            <div className="bg-gray-50 border rounded-xl p-3 text-sm">
              <div className="font-black">{printSale.customer || "-"}</div>
              <div className="text-xs text-gray-500">{printSale.product || "-"} · {printSale.date}</div>
              <div className="text-xs text-gray-500">Invoice: {printSale.invoiceNumber || printSale._id?.slice(-8)?.toUpperCase()}</div>
            </div>
            <Select label="Bill Format" value={printOptions.billType} options={[{ value: "without_gst", label: "Without GST" }, { value: "with_gst", label: "With GST" }]} onChange={e => setPrintOptions({ ...printOptions, billType: e.target.value })} />
            {printOptions.billType === "with_gst" && (
              <>
                <Input label="Customer GST Number" value={printOptions.gstNumber} onChange={e => setPrintOptions({ ...printOptions, gstNumber: e.target.value })} placeholder="GSTIN" />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="CGST %" type="number" step="any" value={printOptions.cgstPercent} onChange={e => setPrintOptions({ ...printOptions, cgstPercent: e.target.value })} placeholder="9" />
                  <Input label="SGST %" type="number" step="any" value={printOptions.sgstPercent} onChange={e => setPrintOptions({ ...printOptions, sgstPercent: e.target.value })} placeholder="9" />
                </div>
              </>
            )}
            {(() => {
              const tax = printTax(printSale, printOptions);
              return (
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-blue-50 rounded-xl p-2"><div className="font-black text-blue-700">{CURRENCY}{fmt(tax.taxable)}</div><div className="text-gray-400">Taxable</div></div>
                  <div className="bg-green-50 rounded-xl p-2"><div className="font-black text-green-700">{CURRENCY}{fmt(tax.total)}</div><div className="text-gray-400">Bill Total</div></div>
                  {printOptions.billType === "with_gst" && <div className="bg-amber-50 rounded-xl p-2"><div className="font-black text-amber-700">{CURRENCY}{fmt(tax.cgstAmount)}</div><div className="text-gray-400">CGST</div></div>}
                  {printOptions.billType === "with_gst" && <div className="bg-purple-50 rounded-xl p-2"><div className="font-black text-purple-700">{CURRENCY}{fmt(tax.sgstAmount)}</div><div className="text-gray-400">SGST</div></div>}
                </div>
              );
            })()}
            <button onClick={printBill} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">Print Bill</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── USERS ────────────────────────────────────────────────────────────────────
function Users({ currentUser, allUsers, setAllUsers }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name:"", username:"", password:"", role:"user" });
  const [saveError, setSaveError] = useState("");

  const save = async () => {
    if (!form.name||!form.username||!form.password) { setSaveError("All fields required"); return; }
    setSaveError("");
    const user=await api("POST","/users",form);
    if(user._id){setAllUsers(p=>[...p,user]);setModal(false);setForm({name:"",username:"",password:"",role:"user"});}
    else setSaveError(user.message||"Failed to add user");
  };

  const toggleActive = async (u) => {
    if(u._id===currentUser._id) return;
    await api("PUT",`/users/${u._id}`,{active:!u.active});
    setAllUsers(p=>p.map(x=>x._id===u._id?{...x,active:!x.active}:x));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">👥 Users</h2>
        <button onClick={()=>setModal(true)} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ Add User</button>
      </div>
      <div className="space-y-2">
        {allUsers.map(u=>(
          <div key={u._id} className="bg-white rounded-2xl border shadow-sm p-4 flex items-center justify-between">
            <div><div className="flex items-center gap-2"><span className="font-black">{u.name}</span><Badge color={u.role==="admin"?"purple":u.role==="supervisor"?"green":"blue"}>{u.role}</Badge>{!u.active&&<Badge color="red">Inactive</Badge>}</div><div className="text-xs text-gray-400">@{u.username}</div></div>
            {u._id!==currentUser._id&&<button onClick={()=>toggleActive(u)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${u.active?"bg-red-50 text-red-600 border-red-200":"bg-green-50 text-green-600 border-green-200"}`}>{u.active?"Deactivate":"Activate"}</button>}
          </div>
        ))}
      </div>
      {modal&&<Modal title="Add User" onClose={()=>{setModal(false);setSaveError("");}}>
        <div className="space-y-3">
          <Input label="Full Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
          <Input label="Username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} />
          <Input label="Password" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
          <Select label="Role" value={form.role} options={["admin","supervisor","user"]} onChange={e=>setForm({...form,role:e.target.value})} />
          {saveError&&<div className="text-xs text-red-600 font-semibold bg-red-50 rounded-xl p-3">{saveError}</div>}
          <button onClick={save} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-bold">Add User</button>
        </div>
      </Modal>}
    </div>
  );
}

// ─── ADMIN SITE REPORT ────────────────────────────────────────────────────────
function AdminSiteReport() {
  const [siteWorks, setSiteWorks] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState(null);
  const [search, setSearch] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(()=>{
    Promise.all([api("GET","/sitework"),api("GET","/dailyreport")]).then(([sw,dr])=>{
      setSiteWorks(Array.isArray(sw)?sw:[]);
      setDailyReports(Array.isArray(dr)?dr:[]);
      setLoading(false);
    });
  },[]);

  const getSiteReports = (site) => {
    let r = dailyReports.filter(r=>r.siteName===site.customerName||r.siteId===site._id);
    if (filterFrom) r = r.filter(x=>x.date>=filterFrom);
    if (filterTo) r = r.filter(x=>x.date<=filterTo);
    return r.sort((a,b)=>b.date.localeCompare(a.date));
  };

  const filteredSites = siteWorks.filter(s=>!search||(s.customerName||"").toLowerCase().includes(search.toLowerCase())||(s.siteLocation||"").toLowerCase().includes(search.toLowerCase()));

  if (loading) return <Loader />;

  if (selectedSite) {
    const sr = getSiteReports(selectedSite);
    const groupedReports = mergeDailyReportsByDate(sr);
    const siteReportDocs = dailyReports.filter(r=>r.siteName===selectedSite.customerName||r.siteId===selectedSite._id);
    const allPayments = siteReportDocs.flatMap(r=>(r.payments||[]).filter(p=>p.type!=="Worker Payment").map(p=>({...p,date:r.date})));
    const supervisorSitePayments = allPayments.filter(p=>p.type==="Client Payment Received"||p.type==="Site Payment Received").map(p=>({...p,source:"Supervisor Daily Report"}));
    const dailySiteReceived = supervisorSitePayments.reduce((a,p)=>a+(+(p.amount)||0),0);
    const siteWorkPayments = directSitePaymentRows(selectedSite, dailySiteReceived);
    const paymentHistory = [...siteWorkPayments, ...supervisorSitePayments].sort((a,b)=>(b.date||"").localeCompare(a.date||""));
    const allWorkerDetails = siteReportDocs.flatMap(r=>(r.workerEntries||[]).map(w=>({...w,date:r.date,siteName:r.siteName})));
    // Also get worker entry payments (salary paid via worker section)
    const allWorkerEntryPayments = siteReportDocs.flatMap(r=>(r.workerEntries||[]).filter(w=>+(w.paymentGiven||0)>0).map(w=>({type:"Worker Payment",workerName:w.workerName,paidTo:w.workerName,amount:+(w.paymentGiven||0),mode:"Cash",date:r.date,remarks:w.remarks||"",fromWorkerEntry:true})));
    const allWorkerPayments = allWorkerEntryPayments;
    const clientPayments = paymentHistory;
    const materialPayments = allPayments.filter(p=>p.type==="Material Payment");
    const equipmentPayments = allPayments.filter(p=>p.type==="Equipment Payment");
    const otherPayments = allPayments.filter(p=>p.type==="Other Expense");
    const totalReceived = clientPayments.reduce((a,p)=>a+(+(p.amount)||0),0);
    const totalWorkerExp = allWorkerPayments.reduce((a,p)=>a+(+(p.amount)||0),0);
    const totalMatExp = materialPayments.reduce((a,p)=>a+(+(p.amount)||0),0);
    const totalEquipExp = equipmentPayments.reduce((a,p)=>a+(+(p.amount)||0),0);
    const totalExpenses = totalWorkerExp + totalMatExp + totalEquipExp + otherPayments.reduce((a,p)=>a+(+(p.amount)||0),0);
    const siteCost = +(selectedSite.totalCost||selectedSite.totalAmount||0);
    const dynamicPending = Math.max(0, siteCost - totalReceived);
    const totalComp = sr.reduce((a,r)=>a+(+(r.completedToday||0)),0);
    const workerSummary = {
      totalWorkers: new Set(allWorkerDetails.map(w=>w.workerName).filter(Boolean)).size,
      totalArea: allWorkerDetails.reduce((a,w)=>a+(+(w.workArea)||0),0),
      totalCost: allWorkerDetails.reduce((a,w)=>a+(+(w.amountEarned||w.salary)||0),0),
      totalPaid: allWorkerDetails.reduce((a,w)=>a+(+(w.paymentGiven)||0),0),
      totalPending: allWorkerDetails.reduce((a,w)=>a+(+(w.pending)||0),0),
    };
    const allMats = sr.filter(r=>r.materialsUnloaded);
    const allExtra = sr.filter(r=>r.extraWorkDesc);
    const allComplaints = sr.filter(r=>r.complaints);
    const dateReport = selectedDate ? groupedReports.find(r=>r.date===selectedDate) : null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={()=>{setSelectedSite(null);setSelectedDate(null);}} className="text-amber-600 font-bold text-sm">← Back</button>
          <div className="flex items-center gap-2">
            <Badge color={selectedSite.status==="completed"?"green":"amber"}>{selectedSite.status}</Badge>
            {selectedSite.status!=="completed"&&(
              <button onClick={async()=>{
                await api("PUT",`/sitework/${selectedSite._id}`,{status:"completed",endDate:today()});
                setSiteWorks(p=>p.map(s=>s._id===selectedSite._id?{...s,status:"completed",endDate:today()}:s));
                setSelectedSite(s=>({...s,status:"completed",endDate:today()}));
              }} className="bg-green-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-green-600">✅ Mark Complete</button>
            )}
          </div>
        </div>
        <div className="bg-white rounded-2xl border shadow-sm p-4">
          <div className="font-black text-xl">{selectedSite.customerName}</div>
          <div className="text-xs text-gray-400">📍 {selectedSite.siteLocation||"—"} · By: {selectedSite.addedBy||"—"}</div>
          <div className="text-xs text-gray-400">🧱 {selectedSite.interlockType||"—"} · {selectedSite.workSize||"—"} sqft</div>
          {selectedSite.endDate&&<div className="text-xs text-green-600 font-semibold">✅ Completed: {selectedSite.endDate}</div>}
        </div>
        <SiteWorkDetailsPanel site={selectedSite} dailyReceived={dailySiteReceived} />
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center"><div className="text-lg font-black text-green-700">{CURRENCY}{fmt(siteCost)}</div><div className="text-xs text-gray-400">Total Site Cost</div></div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center"><div className="text-lg font-black text-blue-700">{CURRENCY}{fmt(totalReceived)}</div><div className="text-xs text-gray-400">✅ Amount Received</div></div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center"><div className="text-lg font-black text-red-600">{CURRENCY}{fmt(dynamicPending)}</div><div className="text-xs text-gray-400">🔴 Pending Amount</div></div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center"><div className="text-lg font-black text-orange-700">{CURRENCY}{fmt(totalExpenses)}</div><div className="text-xs text-gray-400">Total Expenses</div></div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-center"><div className="font-black text-amber-700">{CURRENCY}{fmt(totalWorkerExp)}</div><div className="text-gray-400">👷 Workers</div></div>
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-2 text-center"><div className="font-black text-teal-700">{CURRENCY}{fmt(totalMatExp)}</div><div className="text-gray-400">🧱 Materials</div></div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-2 text-center"><div className="font-black text-purple-700">{CURRENCY}{fmt(totalEquipExp)}</div><div className="text-gray-400">🔧 Equipment</div></div>
        </div>
        {paymentHistory.length>0&&(
          <SectionBox title="Payment History" icon="💳" color="blue">
            {paymentHistory.map((p,i)=><div key={i} className="grid grid-cols-4 gap-2 text-xs py-1 border-b border-blue-100">
              <span>{p.date||"—"}</span><span>{p.source}</span><span>{p.mode||p.paymentMode||"—"}</span><span className="text-right font-bold text-blue-700">{CURRENCY}{fmt(p.amount)}</span>
            </div>)}
          </SectionBox>
        )}
        {allWorkerDetails.length>0&&(
          <SectionBox title="Worker Work Details" icon="👷" color="teal">
            <div className="grid grid-cols-5 gap-1 text-xs">
              <div className="bg-white rounded-lg p-1 text-center"><div className="font-black">{workerSummary.totalWorkers}</div><div className="text-gray-400">Workers</div></div>
              <div className="bg-white rounded-lg p-1 text-center"><div className="font-black">{fmt(workerSummary.totalArea)}</div><div className="text-gray-400">Area</div></div>
              <div className="bg-white rounded-lg p-1 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt(workerSummary.totalCost)}</div><div className="text-gray-400">Cost</div></div>
              <div className="bg-white rounded-lg p-1 text-center"><div className="font-black text-blue-700">{CURRENCY}{fmt(workerSummary.totalPaid)}</div><div className="text-gray-400">Paid</div></div>
              <div className="bg-white rounded-lg p-1 text-center"><div className="font-black text-red-600">{CURRENCY}{fmt(workerSummary.totalPending)}</div><div className="text-gray-400">Pending</div></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[760px]">
                <thead><tr className="text-gray-400"><th className="text-left p-1">Date</th><th className="text-left p-1">Worker</th><th className="text-left p-1">Category</th><th className="text-right p-1">Area</th><th className="p-1">Unit</th><th className="text-right p-1">Rate</th><th className="text-right p-1">Amount</th><th className="text-right p-1">Paid</th><th className="text-right p-1">Pending</th></tr></thead>
                <tbody>{allWorkerDetails.map((w,i)=><tr key={i} className="border-t"><td className="p-1">{w.date}</td><td className="p-1 font-bold">{w.workerName}</td><td className="p-1">{w.workCategory||"—"}</td><td className="p-1 text-right">{fmt(w.workArea)}</td><td className="p-1">{w.unit||"—"}</td><td className="p-1 text-right">{CURRENCY}{fmt(w.rate)}</td><td className="p-1 text-right text-green-700">{CURRENCY}{fmt(w.amountEarned||w.salary)}</td><td className="p-1 text-right text-blue-700">{CURRENCY}{fmt(w.paymentGiven)}</td><td className="p-1 text-right text-red-600">{CURRENCY}{fmt(w.pending)}</td></tr>)}</tbody>
              </table>
            </div>
          </SectionBox>
        )}

        <div className="bg-white rounded-2xl border shadow-sm p-3">
          <div className="text-xs font-bold text-gray-500 mb-2">📅 View by Date</div>
          <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50" value={selectedDate||""} onChange={e=>setSelectedDate(e.target.value||null)}>
            <option value="">All Dates ({groupedReports.length} days / {sr.length} reports)</option>
            {groupedReports.map(r=><option key={r.date} value={r.date}>{r.date} - {r.reportCount} report(s), {r.workersCount||0} workers, {r.completedToday||0} sqft</option>)}
          </select>
        </div>

        {dateReport?(
          <div className="space-y-3">
            <div className="text-xs font-black text-gray-600 uppercase">📅 {selectedDate} Activity</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-blue-50 rounded-xl p-2 text-center"><div className="font-black text-blue-700">{dateReport.workersCount||0}</div><div className="text-gray-400">Workers</div></div>
              <div className="bg-teal-50 rounded-xl p-2 text-center"><div className="font-black text-teal-700">{dateReport.completedToday||0} sqft</div><div className="text-gray-400">Done</div></div>
              <div className="bg-green-50 rounded-xl p-2 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt(dateReport.totalPayments||0)}</div><div className="text-gray-400">Payments</div></div>
            </div>
            {dateReport.dayNotes&&<SectionBox title="Day Notes" icon="📝" color="gray"><div className="text-sm">{dateReport.dayNotes}</div></SectionBox>}
            {dateReport.materialsUnloaded&&<SectionBox title="Materials" icon="🧱" color="teal"><div className="text-sm">{dateReport.materialsUnloaded} · {dateReport.materialQty}</div><div className="text-xs text-gray-400">Supplier: {dateReport.supplierName||"—"}</div></SectionBox>}
            {dateReport.extraWorkDesc&&<SectionBox title="Extra Work" icon="➕" color="orange"><div className="text-sm">{dateReport.extraWorkDesc} · {dateReport.extraWorkQty}</div><div className="text-xs font-bold text-orange-700">{CURRENCY}{fmt(dateReport.extraWorkCost||0)}</div></SectionBox>}
            {(dateReport.workerEntries||[]).length>0&&(
              <SectionBox title="Worker Payments" icon="👷" color="teal">
                {dateReport.workerEntries.map((w,i)=>(
                  <div key={i} className="bg-white rounded-xl px-3 py-2 mb-1 border border-teal-100">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm">{w.workerName}</span>
                      <Badge color={w.attendance==="present"?"green":"red"}>{w.attendance}</Badge>
                    </div>
                    {w.workDone&&<div className="text-xs text-gray-500">Work: {w.workDone}</div>}
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-gray-500">Salary: {CURRENCY}{fmt(w.salary||0)}</span>
                      {+(w.paymentGiven||0)>0&&<span className="text-green-700 font-black">✅ Paid: {CURRENCY}{fmt(w.paymentGiven)}</span>}
                      {+(w.pending||0)>0&&<span className="text-red-600 font-bold">🔴 Pending: {CURRENCY}{fmt(w.pending)}</span>}
                    </div>
                  </div>
                ))}
                {(dateReport.workerEntries||[]).some(w=>+(w.paymentGiven||0)>0)&&(
                  <div className="text-xs font-black text-green-700 text-right border-t border-teal-200 pt-1">
                    Total Paid: {CURRENCY}{fmt((dateReport.workerEntries||[]).reduce((a,w)=>a+(+(w.paymentGiven||0)),0))}
                  </div>
                )}
              </SectionBox>
            )}
            {(dateReport.payments||[]).filter(p=>p.type!=="Worker Payment").length>0&&(
              <SectionBox title="Other Payments" icon="💰" color="green">
                {(dateReport.payments||[]).filter(p=>p.type!=="Worker Payment").map((p,i)=>(
                  <div key={i} className="flex justify-between text-xs bg-white rounded-lg px-3 py-2 mb-1 border border-green-100">
                    <div>
                      <span className={`font-bold ${p.type==="Site Payment Received"||p.type==="Client Payment Received"?"text-green-700":"text-gray-700"}`}>{p.type}</span>
                      <span className="text-gray-500 ml-1">→ {p.workerName||p.paidTo||p.receivedFrom||"—"} · {p.mode}</span>
                    </div>
                    <span className={`font-black ml-2 ${p.type==="Site Payment Received"||p.type==="Client Payment Received"?"text-green-700":"text-red-600"}`}>
                      {p.type==="Site Payment Received"||p.type==="Client Payment Received"?"+":"-"}{CURRENCY}{fmt(p.amount)}
                    </span>
                  </div>
                ))}
                <div className="text-xs font-black text-green-700 text-right pt-1 border-t border-green-200">
                  Net: {CURRENCY}{fmt((dateReport.payments||[]).filter(p=>p.type!=="Worker Payment").reduce((a,p)=>a+(+(p.amount)||0),0))}
                </div>
              </SectionBox>
            )}
            {dateReport.complaints&&<SectionBox title="Complaints" icon="⚠️" color="red"><div className="text-sm">{dateReport.complaints}</div>{dateReport.actionTaken&&<div className="text-xs text-gray-400 mt-1">Action: {dateReport.actionTaken}</div>}</SectionBox>}
          </div>
        ):(
          <div className="space-y-3">
            <div className="text-xs font-black text-gray-500 uppercase">📊 Full Site History</div>
            {clientPayments.length>0&&<SectionBox title="Client Payments Received" icon="💚" color="green">{clientPayments.map((p,i)=><div key={i} className="text-xs flex justify-between py-1 border-b border-green-100"><span>{p.date} · {p.paidTo||"—"} · {p.mode}</span><span className="font-black text-green-700">+{CURRENCY}{fmt(p.amount)}</span></div>)}<div className="text-xs font-black text-green-700 text-right pt-1">Total: {CURRENCY}{fmt(totalReceived)}</div></SectionBox>}
            {allWorkerPayments.length>0&&<SectionBox title="Worker Payments" icon="👷" color="amber">{allWorkerPayments.sort((a,b)=>(b.date||"").localeCompare(a.date||"")).map((p,i)=><div key={i} className="text-xs flex justify-between py-1 border-b border-amber-100"><span><span className="font-bold">{p.workerName||p.paidTo||"—"}</span> · {p.date} · {p.mode}</span><span className="font-black text-amber-700">{CURRENCY}{fmt(p.amount)}</span></div>)}<div className="text-xs font-black text-amber-700 text-right pt-1">Total: {CURRENCY}{fmt(allWorkerPayments.reduce((a,p)=>a+(+(p.amount)||0),0))}</div></SectionBox>}
            {materialPayments.length>0&&<SectionBox title="Material Payments" icon="🧱" color="teal">{materialPayments.map((p,i)=><div key={i} className="text-xs flex justify-between py-1 border-b border-teal-100"><span>{p.date} · {p.paidTo||"—"}</span><span className="font-black text-teal-700">{CURRENCY}{fmt(p.amount)}</span></div>)}</SectionBox>}
            {allMats.length>0&&<SectionBox title="Material History" icon="📦" color="blue">{allMats.map((r,i)=><div key={i} className="text-xs flex justify-between py-1 border-b border-blue-100"><span>{r.date} · {r.materialsUnloaded} ({r.materialQty})</span><span className="text-gray-400">{r.supplierName||"—"}</span></div>)}</SectionBox>}
            {allExtra.length>0&&<SectionBox title="Extra Work" icon="➕" color="orange">{allExtra.map((r,i)=><div key={i} className="text-xs flex justify-between py-1 border-b border-orange-100"><span>{r.date} · {r.extraWorkDesc}</span><span className="font-black text-orange-700">{CURRENCY}{fmt(r.extraWorkCost||0)}</span></div>)}</SectionBox>}
            {allComplaints.length>0&&<SectionBox title="Complaints" icon="⚠️" color="red">{allComplaints.map((r,i)=><div key={i} className="text-xs py-1 border-b border-red-100"><div>{r.date} · {r.complaints}</div>{r.actionTaken&&<div className="text-gray-400">Action: {r.actionTaken}</div>}</div>)}</SectionBox>}
            <div className="text-xs font-black text-gray-500 uppercase">Daily Reports ({groupedReports.length} days / {sr.length} reports)</div>
            {groupedReports.length===0&&<EmptyState icon="Report" text="No reports submitted" />}
            {groupedReports.map(r=><div key={r.date} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-2"><div className="flex items-center justify-between"><div><div className="font-black">📅 {r.date}</div><div className="text-xs text-gray-400">{r.workersCount||0} workers · {r.completedToday||0} sqft · By: {r.addedBy}</div></div><div className="text-right"><div className="font-black text-green-700">{CURRENCY}{fmt(r.totalPayments||0)}</div><Badge color="amber">{r.siteStatus||"running"}</Badge></div></div></div>)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-gray-900">🏗️ Site Reports</h2>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search site name or location..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" />
      <div className="grid grid-cols-2 gap-2">
        <Input label="From Date" type="date" value={filterFrom} onChange={e=>setFilterFrom(e.target.value)} />
        <Input label="To Date" type="date" value={filterTo} onChange={e=>setFilterTo(e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-center"><div className="font-black text-amber-700">{siteWorks.filter(s=>s.status==="running").length}</div><div className="text-xs text-gray-400">Running</div></div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-2 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt(siteWorks.reduce((a,s)=>a+(+(s.totalCost||s.totalAmount)||0),0))}</div><div className="text-xs text-gray-400">Total</div></div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-2 text-center"><div className="font-black text-red-600">{CURRENCY}{fmt(siteWorks.reduce((a,s)=>a+(+(s.pendingAmount)||0),0))}</div><div className="text-xs text-gray-400">Pending</div></div>
      </div>
      <div className="space-y-3">
        {filteredSites.length===0&&<EmptyState icon="🏗️" text="No sites found" />}
        {filteredSites.map(s=>{
          const sr=getSiteReports(s);
          const received=dailyReports.filter(r=>r.siteName===s.customerName||r.siteId===s._id).flatMap(r=>(r.payments||[]).filter(p=>p.type==="Client Payment Received")).reduce((a,p)=>a+(+(p.amount)||0),0);
          return(
            <div key={s._id} onClick={()=>setSelectedSite(s)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:border-amber-300 transition-all">
              <div className="flex items-start justify-between">
                <div><div className="font-black text-gray-900">{s.customerName}</div><div className="text-xs text-gray-400">📍 {s.siteLocation||"—"} · By: {s.addedBy||"—"}</div><div className="text-xs text-gray-400">📅 {s.startDate||"—"} · {sr.length} reports</div></div>
                <div className="text-right"><Badge color={s.status==="completed"?"green":"amber"}>{s.status}</Badge><div className="text-xs text-green-600 font-bold mt-1">Received: {CURRENCY}{fmt(received)}</div><div className="text-xs text-red-500">Pending: {CURRENCY}{fmt(+(s.pendingAmount||0))}</div></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── WORKER REPORTS (Production / Site / Overall) ───────────────────────────
function AdminWorkerReport({ user }) {
  const [workers, setWorkers] = useState([]);
  const [siteWorks, setSiteWorks] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const isSupervisorLedger = user?.role === "supervisor";
  const [tab, setTab] = useState(isSupervisorLedger ? "site" : "production");
  const [siteSubTab, setSiteSubTab] = useState("daily");
  const [report, setReport] = useState(null);
  const [overall, setOverall] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ fromDate: "", toDate: "", customDate: "", datePreset: "", item: "", color: "", site: "" });
  const emptySiteWorkerEntry = { date: today(), workerName: "", siteName: "", siteId: "", workCategory: "Fitting", workArea: "", unit: "Sqft", rate: "", paymentGiven: "", paymentMode: "Cash", remarks: "" };
  const [siteWorkerEntry, setSiteWorkerEntry] = useState(emptySiteWorkerEntry);

  useEffect(() => {
    Promise.all([api("GET", "/workers"), api("GET", "/sitework"), api("GET", "/dailyreport")]).then(([w, sw, dr]) => {
      setWorkers(Array.isArray(w) ? w : []);
      setSiteWorks(Array.isArray(sw) ? sw : []);
      setDailyReports(Array.isArray(dr) ? dr : []);
      setLoading(false);
    });
  }, []);

  const permittedSiteWorks = isSupervisorLedger
    ? siteWorks.filter(s => s.addedBy === user?.name)
    : siteWorks;
  const supervisorReportWorkerNames = isSupervisorLedger
    ? dailyReports.filter(r => r.addedBy === user?.name).flatMap(r => (r.workerEntries || []).map(w => w.workerName).filter(Boolean))
    : [];
  const permittedWorkerNames = new Set([...permittedSiteWorks.flatMap(s => s.selectedWorkers || []), ...supervisorReportWorkerNames]);
  const visibleWorkers = workers.filter(w => {
    if (workerTypeOf(w) !== (tab === "production" ? "Production Worker" : "Site Worker")) return false;
    if (!isActiveWorker(w)) return false;
    if (isSupervisorLedger && !permittedWorkerNames.has(w.name)) return false;
    if (search && !w.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const queryParams = () => {
    const q = [];
    if (filters.datePreset === "today") { const r = salesDateRange("today"); q.push(`fromDate=${r.from}`, `toDate=${r.to}`); }
    else if (filters.datePreset === "month") {
      const now = new Date();
      q.push(`fromDate=${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`, `toDate=${today()}`);
    } else if (filters.datePreset === "custom" && filters.customDate) q.push(`date=${filters.customDate}`);
    else {
      if (filters.fromDate) q.push(`fromDate=${filters.fromDate}`);
      if (filters.toDate) q.push(`toDate=${filters.toDate}`);
    }
    if (filters.item) q.push(`item=${encodeURIComponent(filters.item)}`);
    if (filters.color) q.push(`color=${encodeURIComponent(filters.color)}`);
    if (filters.site) q.push(`site=${encodeURIComponent(filters.site)}`);
    return q.length ? `&${q.join("&")}` : "";
  };

  const loadReport = async (name) => {
    if (!name) return;
    setSelectedWorker(name);
    setSelectedSite(null);
    const accessParams = `&role=${encodeURIComponent(user?.role || "")}&userName=${encodeURIComponent(user?.name || "")}`;
    if (tab === "production") {
      const data = await api("GET", `/workers/reports/production?name=${encodeURIComponent(name)}${queryParams()}`);
      setReport(data);
      setOverall(null);
    } else if (tab === "site") {
      const data = await api("GET", `/workers/reports/site?name=${encodeURIComponent(name)}${queryParams()}${accessParams}`);
      setReport(data);
      setOverall(null);
    } else {
      const data = await api("GET", `/workers/reports/overall?name=${encodeURIComponent(name)}${queryParams()}`);
      setOverall(data);
      setReport(null);
    }
  };

  const saveSiteWorkerEntry = async () => {
    if (!siteWorkerEntry.date || !siteWorkerEntry.workerName || !siteWorkerEntry.siteName || !siteWorkerEntry.workCategory) return;
    const normalize = (v) => String(v || "").trim().toLowerCase();
    const site = siteWorks.find(s => s.customerName === siteWorkerEntry.siteName || s._id === siteWorkerEntry.siteId);
    const existingReport = dailyReports.find(r =>
      r.date === siteWorkerEntry.date &&
      (normalize(r.siteName) === normalize(siteWorkerEntry.siteName) || (siteWorkerEntry.siteId && r.siteId === siteWorkerEntry.siteId))
    );
    const hasDuplicate = (existingReport?.workerEntries || []).some(w =>
      normalize(w.workerName) === normalize(siteWorkerEntry.workerName) &&
      normalize(w.workCategory) === normalize(siteWorkerEntry.workCategory)
    );
    if (hasDuplicate) {
      window.confirm("Worker work entry already exists for this date and site.\nDo you want to edit the existing entry?");
      return;
    }

    const area = parseFloat(siteWorkerEntry.workArea) || 0;
    const rate = parseFloat(siteWorkerEntry.rate) || 0;
    const earned = area * rate;
    const paid = parseFloat(siteWorkerEntry.paymentGiven) || 0;
    const entry = {
      workerName: siteWorkerEntry.workerName,
      attendance: "present",
      dutyArea: "",
      workDone: siteWorkerEntry.workCategory,
      workCategory: siteWorkerEntry.workCategory,
      workArea: area,
      unit: siteWorkerEntry.unit,
      rate,
      salary: String(earned),
      amountEarned: earned,
      paymentGiven: paid,
      paymentMode: siteWorkerEntry.paymentMode,
      pending: String(Math.max(0, earned - paid)),
      remarks: siteWorkerEntry.remarks
    };

    const paymentsTotal = (rows, payments) =>
      (payments || []).filter(p => p.type !== "Worker Payment").reduce((a, p) => a + (+(p.amount) || 0), 0) +
      (rows || []).reduce((a, w) => a + (+(w.paymentGiven) || 0), 0);

    let saved;
    if (existingReport?._id) {
      const workerEntries = [...(existingReport.workerEntries || []), entry];
      const payments = (existingReport.payments || []).filter(p => p.type !== "Worker Payment");
      saved = await api("PUT", `/dailyreport/${existingReport._id}`, {
        ...existingReport,
        payments,
        workerEntries,
        totalPayments: paymentsTotal(workerEntries, payments)
      });
      if (saved?._id) setDailyReports(p => p.map(r => r._id === saved._id ? saved : r));
    } else {
      const body = {
        date: siteWorkerEntry.date,
        siteName: siteWorkerEntry.siteName,
        siteId: site?._id || siteWorkerEntry.siteId || "",
        siteStatus: site?.status || "running",
        interlockType: site?.interlockType || "",
        workerEntries: [entry],
        payments: [],
        totalPayments: paid,
        totalReceived: 0,
        addedBy: user?.name || "Office"
      };
      saved = await api("POST", "/dailyreport", body);
      if (saved?._id) setDailyReports(p => [saved, ...p]);
    }

    if (saved?._id) {
      setAddModal(false);
      setSiteWorkerEntry(emptySiteWorkerEntry);
      if (selectedWorker) loadReport(selectedWorker);
    } else if (saved?.message) {
      window.alert(saved.message);
    }
  };

  if (loading) return <Loader />;

  const FilterBar = () => (
    <div className="space-y-2">
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search worker name..." className="w-full border rounded-xl px-3 py-2.5 text-sm bg-white" onKeyDown={e => e.key === "Enter" && loadReport(search)} />
      <div className="flex flex-wrap gap-1.5">
        {[{ id: "", label: "All" }, { id: "today", label: "Today" }, { id: "month", label: "This Month" }, { id: "custom", label: "Custom" }, { id: "range", label: "Range" }].map(d => (
          <button key={d.id} onClick={() => setFilters({ ...filters, datePreset: d.id })} className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${filters.datePreset === d.id ? "bg-amber-500 text-white" : "bg-gray-50"}`}>{d.label}</button>
        ))}
      </div>
      {filters.datePreset === "custom" && <Input label="Date" type="date" value={filters.customDate} onChange={e => setFilters({ ...filters, customDate: e.target.value })} />}
      {filters.datePreset === "range" && (
        <div className="grid grid-cols-2 gap-2">
          <Input label="From" type="date" value={filters.fromDate} onChange={e => setFilters({ ...filters, fromDate: e.target.value })} />
          <Input label="To" type="date" value={filters.toDate} onChange={e => setFilters({ ...filters, toDate: e.target.value })} />
        </div>
      )}
      {tab === "production" && (
        <div className="grid grid-cols-2 gap-2">
          <Input label="Item Name" value={filters.item} onChange={e => setFilters({ ...filters, item: e.target.value })} placeholder="Filter by item" />
          <Input label="Color" value={filters.color} onChange={e => setFilters({ ...filters, color: e.target.value })} placeholder="Filter by color" />
        </div>
      )}
      {tab === "site" && (
        <div className="grid grid-cols-2 gap-2">
          <Input label="Site Name" value={filters.site} onChange={e => setFilters({ ...filters, site: e.target.value })} placeholder="Filter by site" />
          <Input label="Work Category" value={filters.item} onChange={e => setFilters({ ...filters, item: e.target.value })} placeholder="Filter by category" />
        </div>
      )}
    </div>
  );

  if (selectedSite && report?.sites) {
    const site = report.sites.find(s => s.siteName === selectedSite);
    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedSite(null)} className="text-amber-600 font-bold text-sm">← Back to Site List</button>
        <div className="bg-white rounded-2xl border p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-black text-xl text-gray-800">🏗️ Site: {site?.siteName}</h3>
            <div className="text-xs text-gray-400 mt-1">Work Category: <span className="font-semibold text-gray-700">{site?.workCategory}</span></div>
          </div>
          
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5">
              <div className="font-black text-blue-700">{site?.totalArea || 0} {site?.unit || "Sqft"}</div>
              <div className="text-gray-400 mt-0.5">Total Area</div>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-2.5">
              <div className="font-black text-green-700">{CURRENCY}{fmt(site?.totalEarned || 0)}</div>
              <div className="text-gray-400 mt-0.5">Total Earned</div>
            </div>
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-2.5">
              <div className="font-black text-teal-700">{CURRENCY}{fmt(site?.totalPaid || 0)}</div>
              <div className="text-gray-400 mt-0.5">Total Paid</div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-2.5">
              <div className="font-black text-red-600">{CURRENCY}{fmt(site?.pending || 0)}</div>
              <div className="text-gray-400 mt-0.5">Pending</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-4 shadow-sm space-y-2">
          <h4 className="font-bold text-sm text-gray-700 border-b pb-1">📅 Chronological Entries & Pending Logic</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500">
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Work Category</th>
                  <th className="p-2 text-right">Area</th>
                  <th className="p-2">Unit</th>
                  <th className="p-2 text-right">Rate</th>
                  <th className="p-2 text-right">Earned</th>
                  <th className="p-2 text-right">Paid</th>
                  <th className="p-2 text-right">Pending</th>
                </tr>
              </thead>
              <tbody>
                {(site?.entries || []).map((h, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{h.date}</td>
                    <td className="p-2">{h.workCategory || "—"}</td>
                    <td className="p-2 text-right">{h.workArea || 0}</td>
                    <td className="p-2">{h.unit || "—"}</td>
                    <td className="p-2 text-right">{CURRENCY}{fmt(h.rate || 0)}</td>
                    <td className="p-2 text-right font-semibold text-green-700">{CURRENCY}{fmt(h.amountEarned)}</td>
                    <td className="p-2 text-right text-blue-700">{CURRENCY}{fmt(h.paymentGiven)}</td>
                    <td className="p-2 text-right text-red-600 font-bold">{CURRENCY}{fmt(h.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (selectedWorker && (report || overall)) {
    const filteredDailyHistory = (report?.history || []).filter(h => {
      if (h.isExtraPayment) return false;
      if (filters.site && !(h.siteName || "").toLowerCase().includes(filters.site.toLowerCase())) return false;
      if (filters.item && !(h.workCategory || "").toLowerCase().includes(filters.item.toLowerCase())) return false;
      return true;
    });
    const dailyAreaSum = filteredDailyHistory.reduce((sum, h) => sum + (+(h.workArea) || 0), 0);
    const dailyEarnedSum = filteredDailyHistory.reduce((sum, h) => sum + (h.amountEarned || 0), 0);
    const dailyPaidSum = filteredDailyHistory.reduce((sum, h) => sum + (h.paymentGiven || 0), 0);
    const dailyPendingSum = Math.max(0, dailyEarnedSum - dailyPaidSum);

    return (
      <div className="space-y-4">
        <button onClick={() => { setSelectedWorker(null); setReport(null); setOverall(null); }} className="text-amber-600 font-bold text-sm">← Back</button>
        <FilterBar />
        <button onClick={() => loadReport(selectedWorker)} className="w-full bg-amber-500 text-white py-2 rounded-xl text-sm font-bold">Apply Filters</button>

        {tab === "production" && report?.worker && (
          <>
            <div className="bg-white rounded-2xl border p-4"><div className="font-black text-xl">🏭 {report.worker.name}</div><div className="text-xs text-gray-400">Production Workers Report</div></div>
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Total Production Qty" value={fmt(report.worker.totalQuantity)} icon="📦" color="blue" sub={`${fmt(report.worker.totalSqft || (report.history || []).reduce((a,h)=>a+itemSqft(h),0))} sqft`} />
              <StatCard label="Production Earnings" value={`${CURRENCY}${fmt(report.worker.totalEarnings)}`} icon="💰" color="green" />
              <StatCard label="Payments Given" value={`${CURRENCY}${fmt(report.worker.totalPaid)}`} icon="✅" color="teal" />
              <StatCard label="Pending" value={`${CURRENCY}${fmt(report.worker.totalPending)}`} icon="⏳" color="red" />
            </div>
            {(report.itemSummary || []).length > 0 && (
              <SectionBox title="Production Summary" icon="📦" color="blue">
                {report.itemSummary.map((it, i) => <div key={i} className="flex justify-between text-sm py-1 border-b"><span className="font-bold">{it.item}</span><span>{qtyWithSqft(it)}</span></div>)}
              </SectionBox>
            )}
            <div className="overflow-x-auto">
              <div className="text-xs font-bold mb-1">Production History</div>
              <table className="w-full text-xs">
                <thead><tr className="bg-gray-50 text-gray-500"><th className="p-2">Date</th><th className="p-2">Item</th><th className="p-2">Color</th><th className="p-2 text-right">Qty / Sqft</th><th className="p-2">Unit</th><th className="p-2 text-right">Rate</th><th className="p-2 text-right">Amount</th><th className="p-2 text-right">Paid</th></tr></thead>
                <tbody>
                  {(report.history || []).map((h, i) => (
                    <tr key={i} className="border-t"><td className="p-2">{h.date}</td><td className="p-2 font-semibold">{h.item}</td><td className="p-2">{h.color || "—"}</td><td className="p-2 text-right">{qtyWithSqft(h)}</td><td className="p-2">{h.unit}</td><td className="p-2 text-right">{CURRENCY}{fmt(+(h.rate) || 0)}</td><td className="p-2 text-right font-bold text-green-700">{CURRENCY}{fmt(+(h.amount) || 0)}</td><td className="p-2 text-right text-teal-700">{CURRENCY}{fmt(+(h.paid) || 0)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "site" && report?.worker && (
          <>
            <div className="bg-white rounded-2xl border p-4">
              <div className="font-black text-xl">🏗️ {report.worker.name}</div>
              <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider text-amber-600 mt-1">Site Worker Ledger</div>
            </div>

            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {[{ id: "daily", label: "Daily View" }, { id: "monthly", label: "Monthly View" }, { id: "sitewise", label: "Site-wise View" }, { id: "total", label: "Overall View" }].map(sub => (
                <button key={sub.id} onClick={() => { setSiteSubTab(sub.id); setSelectedSite(null); }} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${siteSubTab === sub.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}>{sub.label}</button>
              ))}
            </div>

            {siteSubTab === "daily" && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-blue-700">{fmt(dailyAreaSum)}</div>
                    <div className="text-xs text-gray-400">Total Area</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-green-700">{CURRENCY}{fmt(dailyEarnedSum)}</div>
                    <div className="text-xs text-gray-400">Total Earned</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-blue-700">{CURRENCY}{fmt(dailyPaidSum)}</div>
                    <div className="text-xs text-gray-400">Total Paid</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-red-600">{CURRENCY}{fmt(dailyPendingSum)}</div>
                    <div className="text-xs text-gray-400">Daily Pending</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border p-4 shadow-sm space-y-2">
                  <h4 className="font-bold text-sm text-gray-700 border-b pb-1">📋 Daily History</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500">
                          <th className="p-2 text-left">Date</th>
                          <th className="p-2 text-left">Worker</th>
                          <th className="p-2 text-left">Site Name</th>
                          <th className="p-2 text-left">Category</th>
                          <th className="p-2 text-right">Area</th>
                          <th className="p-2">Unit</th>
                          <th className="p-2 text-right">Rate</th>
                          <th className="p-2 text-right">Amount</th>
                          <th className="p-2 text-right">Payment Given</th>
                          <th className="p-2 text-right">Pending</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDailyHistory.length === 0 && (
                          <tr><td colSpan="10" className="p-4 text-center text-gray-400">No daily entries found</td></tr>
                        )}
                        {filteredDailyHistory.map((h, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{h.date}</td>
                            <td className="p-2 font-semibold">{h.workerName || report.worker.name}</td>
                            <td className="p-2 font-bold">{h.siteName}</td>
                            <td className="p-2">{h.workCategory || "—"}</td>
                            <td className="p-2 text-right">{h.workArea || 0}</td>
                            <td className="p-2">{h.unit || "—"}</td>
                            <td className="p-2 text-right">{CURRENCY}{fmt(h.rate || 0)}</td>
                            <td className="p-2 text-right text-green-700 font-semibold">{CURRENCY}{fmt(h.amountEarned)}</td>
                            <td className="p-2 text-right text-blue-700">{CURRENCY}{fmt(h.paymentGiven)}</td>
                            <td className="p-2 text-right text-red-600 font-bold">{CURRENCY}{fmt(h.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {siteSubTab === "monthly" && (() => {
              const monthMap = filteredDailyHistory.reduce((acc,h)=>{
                const m = (h.date||"").slice(0,7) || "Unknown";
                if (!acc[m]) acc[m] = { days:new Set(), area:0, earned:0, paid:0 };
                acc[m].days.add(h.date);
                acc[m].area += +(h.workArea)||0;
                acc[m].earned += +(h.amountEarned)||0;
                acc[m].paid += +(h.paymentGiven)||0;
                return acc;
              },{});
              return <div className="space-y-3">
                {Object.entries(monthMap).length===0&&<EmptyState icon="📅" text="No monthly entries found" />}
                {Object.entries(monthMap).sort((a,b)=>b[0].localeCompare(a[0])).map(([month,m])=>(
                  <div key={month} className="bg-white rounded-2xl border p-4 shadow-sm">
                    <div className="font-black mb-2">{month}</div>
                    <div className="grid grid-cols-5 gap-1 text-xs">
                      <div className="bg-gray-50 rounded-lg p-1.5 text-center"><div className="font-black">{m.days.size}</div><div className="text-gray-400">Days</div></div>
                      <div className="bg-blue-50 rounded-lg p-1.5 text-center"><div className="font-black text-blue-700">{fmt(m.area)}</div><div className="text-gray-400">Sqft</div></div>
                      <div className="bg-green-50 rounded-lg p-1.5 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt(m.earned)}</div><div className="text-gray-400">Earnings</div></div>
                      <div className="bg-teal-50 rounded-lg p-1.5 text-center"><div className="font-black text-teal-700">{CURRENCY}{fmt(m.paid)}</div><div className="text-gray-400">Payments</div></div>
                      <div className="bg-red-50 rounded-lg p-1.5 text-center"><div className="font-black text-red-600">{CURRENCY}{fmt(Math.max(0,m.earned-m.paid))}</div><div className="text-gray-400">Pending</div></div>
                    </div>
                  </div>
                ))}
              </div>;
            })()}

            {siteSubTab === "total" && (
              <div className="bg-white rounded-2xl border p-5 shadow-sm space-y-4">
                <h3 className="font-black text-gray-800 text-base border-b pb-2">👷 Worker Overall Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Worker Name: <span className="font-bold text-gray-900">{report.worker.name}</span></div>
                  <div>Total Sites Worked: <span className="font-bold text-gray-900">{report.worker.totalSites}</span></div>
                  <div>Total Area Completed: <span className="font-bold text-gray-900">{report.worker.totalAreaCompleted || 0} Sqft</span></div>
                  <div>Total Amount Earned: <span className="font-bold text-green-700">{CURRENCY}{fmt(report.worker.totalEarnings)}</span></div>
                  <div>Total Payments Given: <span className="font-bold text-blue-700">{CURRENCY}{fmt(report.worker.totalPaid)}</span></div>
                  <div className="col-span-2 bg-red-50 border border-red-200 rounded-xl p-3 flex justify-between font-black text-red-700">
                    <span>Total Pending Amount:</span>
                    <span>{CURRENCY}{fmt(report.worker.totalPending)}</span>
                  </div>
                </div>
                <div className="overflow-x-auto border-t pt-3">
                  <div className="text-xs font-bold text-gray-500 mb-2">Full Daily History</div>
                  <table className="w-full text-xs">
                    <thead><tr className="bg-gray-50 text-gray-500"><th className="p-2 text-left">Date</th><th className="p-2 text-left">Site</th><th className="p-2 text-left">Category</th><th className="p-2 text-right">Area</th><th className="p-2 text-right">Rate</th><th className="p-2 text-right">Earned</th><th className="p-2 text-right">Paid</th><th className="p-2 text-right">Pending</th></tr></thead>
                    <tbody>
                      {filteredDailyHistory.length === 0 && <tr><td colSpan="8" className="p-4 text-center text-gray-400">No history found</td></tr>}
                      {filteredDailyHistory.map((h, i) => (
                        <tr key={i} className="border-t"><td className="p-2">{h.date}</td><td className="p-2 font-bold">{h.siteName}</td><td className="p-2">{h.workCategory || "—"}</td><td className="p-2 text-right">{h.workArea || 0}</td><td className="p-2 text-right">{CURRENCY}{fmt(h.rate || 0)}</td><td className="p-2 text-right text-green-700">{CURRENCY}{fmt(h.amountEarned)}</td><td className="p-2 text-right text-blue-700">{CURRENCY}{fmt(h.paymentGiven)}</td><td className="p-2 text-right text-red-600 font-bold">{CURRENCY}{fmt(h.balance)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {siteSubTab === "sitewise" && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-gray-400">Site-wise Summary (click a site to view details)</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500">
                        <th className="p-2 text-left">Site Name</th>
                        <th className="p-2 text-left">Worker Name</th>
                        <th className="p-2 text-left">Category</th>
                        <th className="p-2 text-right">Total Area</th>
                        <th className="p-2 text-right">Total Earned</th>
                        <th className="p-2 text-right">Total Paid</th>
                        <th className="p-2 text-right">Pending</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(report.sites || []).length === 0 && (
                        <tr><td colSpan="7" className="p-4 text-center text-gray-400">No site data found</td></tr>
                      )}
                      {(report.sites || []).map((s, i) => (
                        <tr key={i} onClick={() => setSelectedSite(s.siteName)} className="border-t hover:bg-amber-50 cursor-pointer transition-all">
                          <td className="p-2 font-bold text-blue-600 underline">{s.siteName}</td>
                          <td className="p-2 font-semibold">{report.worker.name}</td>
                          <td className="p-2">{s.workCategory || "—"}</td>
                          <td className="p-2 text-right">{s.totalArea || 0}</td>
                          <td className="p-2 text-right font-semibold text-green-700">{CURRENCY}{fmt(s.totalEarned)}</td>
                          <td className="p-2 text-right text-blue-700">{CURRENCY}{fmt(s.totalPaid)}</td>
                          <td className="p-2 text-right text-red-600 font-bold">{CURRENCY}{fmt(s.pending)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {siteSubTab === "datewise" && (
              <div className="bg-white rounded-2xl border p-4 shadow-sm space-y-2">
                <h4 className="font-bold text-sm text-gray-700 border-b pb-1">📅 Date-wise View</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500">
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">Site Name</th>
                        <th className="p-2 text-left">Work Category</th>
                        <th className="p-2 text-right">Area</th>
                        <th className="p-2">Unit</th>
                        <th className="p-2 text-right">Rate</th>
                        <th className="p-2 text-right">Amount Earned</th>
                        <th className="p-2 text-right">Payment Given</th>
                        <th className="p-2 text-right">Pending Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(report.history || []).length === 0 && (
                        <tr><td colSpan="9" className="p-4 text-center text-gray-400">No entries found</td></tr>
                      )}
                      {(report.history || []).map((h, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{h.date}</td>
                          <td className="p-2 font-bold">{h.siteName}</td>
                          <td className="p-2">{h.workCategory || "—"}</td>
                          <td className="p-2 text-right">{h.workArea || 0}</td>
                          <td className="p-2">{h.unit || "—"}</td>
                          <td className="p-2 text-right">{CURRENCY}{fmt(h.rate || 0)}</td>
                          <td className="p-2 text-right text-green-700 font-semibold">{CURRENCY}{fmt(h.amountEarned)}</td>
                          <td className="p-2 text-right text-blue-700">{CURRENCY}{fmt(h.paymentGiven)}</td>
                          <td className="p-2 text-right text-red-600 font-bold">{CURRENCY}{fmt(h.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "overall" && overall && (
          <>
            <div className="bg-white rounded-2xl border p-4"><div className="font-black text-xl">👷 {overall.worker.name}</div><div className="text-xs text-gray-400">Combined Worker Account</div></div>
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Production Earnings" value={`${CURRENCY}${fmt(overall.production.totalEarnings)}`} icon="🏭" color="green" sub={`Pending ${CURRENCY}${fmt(overall.production.totalPending)}`} />
              <StatCard label="Site Work Earnings" value={`${CURRENCY}${fmt(overall.site.totalEarnings)}`} icon="🏗️" color="blue" sub={`Pending ${CURRENCY}${fmt(overall.site.totalPending)}`} />
              <StatCard label="Grand Total Earnings" value={`${CURRENCY}${fmt(overall.grandTotal.totalEarnings)}`} icon="💰" color="purple" />
              <StatCard label="Grand Total Pending" value={`${CURRENCY}${fmt(overall.grandTotal.totalPending)}`} icon="⏳" color="red" sub={`Paid ${CURRENCY}${fmt(overall.grandTotal.totalPaid)}`} />
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-black text-gray-900">{isSupervisorLedger ? "Supervisor Worker Ledger" : "Worker Reports"}</h2>
      </div>
      {!isSupervisorLedger && <div className="flex gap-1 overflow-x-auto pb-1">
        {[{ id: "production", label: "🏭 Production Worker Ledger" }, { id: "site", label: "👷 Site Worker Ledger" }].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setReport(null); setOverall(null); setSelectedWorker(null); setSiteSubTab("daily"); }} className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold ${tab === t.id ? "bg-amber-500 text-white" : "bg-white border text-gray-600"}`}>{t.label}</button>
        ))}
      </div>}
      <FilterBar />
      <div className="space-y-2">
        {visibleWorkers.length === 0 && <EmptyState icon="ðŸ‘·" text="No workers found" />}
        {visibleWorkers.map(w => (
          <div key={w._id} onClick={() => loadReport(w.name)} className="bg-white rounded-2xl border p-4 cursor-pointer hover:border-amber-300">
            <div className="flex justify-between"><div className="font-black">{w.name}</div><span className="text-gray-300">›</span></div>
            <div className="text-xs text-gray-400">{w.role} · {w.paymentType || "day"}</div>
          </div>
        ))}
      </div>
      {false&&addModal&&(
        <Modal title="Add Worker Entry" onClose={()=>setAddModal(false)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input label="Date" type="date" value={siteWorkerEntry.date} onChange={e=>setSiteWorkerEntry({...siteWorkerEntry,date:e.target.value})} />
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Worker Name</label>
                <input list="wr-worker-list" value={siteWorkerEntry.workerName} onChange={e=>setSiteWorkerEntry({...siteWorkerEntry,workerName:e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50" />
                <datalist id="wr-worker-list">{workers.map(w=><option key={w._id} value={w.name}/>)}</datalist>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Site Name</label>
              <input list="wr-site-list" value={siteWorkerEntry.siteName} onChange={e=>{
                const site = siteWorks.find(s=>s.customerName===e.target.value);
                setSiteWorkerEntry({...siteWorkerEntry,siteName:e.target.value,siteId:site?._id||""});
              }} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50" />
              <datalist id="wr-site-list">{siteWorks.map(s=><option key={s._id} value={s.customerName}/>)}</datalist>
            </div>
            <Select label="Work Category" value={siteWorkerEntry.workCategory} options={["Fitting","Polish","Levelling","Cutting","Loading","Unloading","Other"]} onChange={e=>setSiteWorkerEntry({...siteWorkerEntry,workCategory:e.target.value})} />
            <div className="grid grid-cols-3 gap-2">
              <Input label="Area" type="number" value={siteWorkerEntry.workArea} onChange={e=>setSiteWorkerEntry({...siteWorkerEntry,workArea:e.target.value})} />
              <Select label="Unit" value={siteWorkerEntry.unit} options={["Sqft","Sqm","Piece","Meter"]} onChange={e=>setSiteWorkerEntry({...siteWorkerEntry,unit:e.target.value})} />
              <Input label="Rate" type="number" value={siteWorkerEntry.rate} onChange={e=>setSiteWorkerEntry({...siteWorkerEntry,rate:e.target.value})} />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-center text-sm font-black text-amber-800">
              Total Amount: {CURRENCY}{fmt((parseFloat(siteWorkerEntry.workArea)||0)*(parseFloat(siteWorkerEntry.rate)||0))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input label="Payment Given" type="number" value={siteWorkerEntry.paymentGiven} onChange={e=>setSiteWorkerEntry({...siteWorkerEntry,paymentGiven:e.target.value})} />
              <Select label="Payment Mode" value={siteWorkerEntry.paymentMode} options={["Cash","UPI","Bank Transfer"]} onChange={e=>setSiteWorkerEntry({...siteWorkerEntry,paymentMode:e.target.value})} />
            </div>
            <Input label="Remarks" value={siteWorkerEntry.remarks} onChange={e=>setSiteWorkerEntry({...siteWorkerEntry,remarks:e.target.value})} />
            <button onClick={saveSiteWorkerEntry} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600">Save Worker Entry</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────

// ─── SUPERVISOR SITE REPORT ───────────────────────────────────────────────────
function SupervisorSiteReport({ user }) {
  const [siteWorks, setSiteWorks] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(()=>{
    Promise.all([api("GET","/sitework"),api("GET","/dailyreport")]).then(([sw,dr])=>{
      setSiteWorks((Array.isArray(sw)?sw:[]).filter(s=>s.addedBy===user.name));
      setDailyReports((Array.isArray(dr)?dr:[]).filter(r=>r.addedBy===user.name));
      setLoading(false);
    });
  },[]);

  const getSiteReports = (site) =>
    dailyReports.filter(r=>r.siteName===site.customerName||r.siteId===site._id)
      .sort((a,b)=>b.date.localeCompare(a.date));

  const filteredSites = siteWorks.filter(s=>!search||(s.customerName||"").toLowerCase().includes(search.toLowerCase())||(s.siteLocation||"").toLowerCase().includes(search.toLowerCase()));

  if (loading) return <Loader />;

  if (selectedSite) {
    const sr = getSiteReports(selectedSite);
    const groupedReports = mergeDailyReportsByDate(sr);
    const allPayments = sr.flatMap(r=>(r.payments||[]).filter(p=>p.type!=="Worker Payment").map(p=>({...p,date:r.date})));
    const dailyClientPayments = allPayments.filter(p=>p.type==="Site Payment Received");
    const siteWorkPayments = directSitePaymentRows(selectedSite, dailyClientPayments.reduce((a,p)=>a+(+(p.amount)||0),0));
    const clientPayments = [...siteWorkPayments, ...dailyClientPayments].sort((a,b)=>(b.date||"").localeCompare(a.date||""));
    const workerPayments = sr.flatMap(r=>(r.workerEntries||[]).filter(w=>+(w.paymentGiven||0)>0).map(w=>({type:"Worker Payment",workerName:w.workerName,amount:+(w.paymentGiven||0),mode:w.paymentMode||"Cash",date:r.date,remarks:w.remarks||""})));
    const materialPayments = allPayments.filter(p=>p.type==="Material Payment");
    const equipmentPayments = allPayments.filter(p=>p.type==="Equipment Payment");
    const totalReceived = clientPayments.reduce((a,p)=>a+(+(p.amount)||0),0);
    const totalWorkerExp = workerPayments.reduce((a,p)=>a+(+(p.amount)||0),0);
    const totalMatExp = materialPayments.reduce((a,p)=>a+(+(p.amount)||0),0);
    const totalEquipExp = equipmentPayments.reduce((a,p)=>a+(+(p.amount)||0),0);
    const totalExpenses = totalWorkerExp+totalMatExp+totalEquipExp;
    const siteCost = +(selectedSite.totalCost||selectedSite.totalAmount||0);
    const dynamicPending = Math.max(0, siteCost - totalReceived);
    const totalComp = sr.reduce((a,r)=>a+(+(r.completedToday||0)),0);
    const allMats = sr.filter(r=>r.materialsUnloaded);
    const allExtra = sr.filter(r=>r.extraWorkDesc);
    const dateReport = selectedDate?groupedReports.find(r=>r.date===selectedDate):null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={()=>{setSelectedSite(null);setSelectedDate(null);}} className="text-amber-600 font-bold text-sm">← Back</button>
          <div className="flex items-center gap-2">
            <Badge color={selectedSite.status==="completed"?"green":"amber"}>{selectedSite.status}</Badge>
            {selectedSite.status!=="completed"&&(
              <button onClick={async()=>{
                await api("PUT",`/sitework/${selectedSite._id}`,{status:"completed",endDate:today()});
                setSiteWorks(p=>p.map(s=>s._id===selectedSite._id?{...s,status:"completed",endDate:today()}:s));
                setSelectedSite(s=>({...s,status:"completed",endDate:today()}));
              }} className="bg-green-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-green-600">✅ Mark Complete</button>
            )}
          </div>
        </div>
        <div className="bg-white rounded-2xl border shadow-sm p-4">
          <div className="font-black text-xl">{selectedSite.customerName}</div>
          <div className="text-xs text-gray-400">📍 {selectedSite.siteLocation||"—"}</div>
          <div className="text-xs text-gray-400">🧱 {selectedSite.interlockType||"—"} · {selectedSite.workSize||"—"} sqft</div>
          {selectedSite.endDate&&<div className="text-xs text-green-600 font-semibold">✅ Completed: {selectedSite.endDate}</div>}
        </div>
        <SiteWorkDetailsPanel site={selectedSite} dailyReceived={dailyClientPayments.reduce((a,p)=>a+(+(p.amount)||0),0)} />
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center"><div className="text-lg font-black text-green-700">{CURRENCY}{fmt(siteCost)}</div><div className="text-xs text-gray-400">Total Cost</div></div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center"><div className="text-lg font-black text-blue-700">{CURRENCY}{fmt(totalReceived)}</div><div className="text-xs text-gray-400">✅ Received</div></div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center"><div className="text-lg font-black text-red-600">{CURRENCY}{fmt(dynamicPending)}</div><div className="text-xs text-gray-400">🔴 Pending</div></div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center"><div className="text-lg font-black text-orange-700">{CURRENCY}{fmt(totalExpenses)}</div><div className="text-xs text-gray-400">Expenses</div></div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-center"><div className="font-black text-amber-700">{CURRENCY}{fmt(totalWorkerExp)}</div><div className="text-gray-400">👷 Workers</div></div>
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-2 text-center"><div className="font-black text-teal-700">{CURRENCY}{fmt(totalMatExp)}</div><div className="text-gray-400">🧱 Materials</div></div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-2 text-center"><div className="font-black text-purple-700">{CURRENCY}{fmt(totalEquipExp)}</div><div className="text-gray-400">🔧 Equipment</div></div>
        </div>
        <div className="bg-white rounded-2xl border shadow-sm p-3">
          <div className="text-xs font-bold text-gray-500 mb-2">📅 View by Date</div>
          <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50" value={selectedDate||""} onChange={e=>setSelectedDate(e.target.value||null)}>
            <option value="">All Dates ({groupedReports.length} days / {sr.length} reports)</option>
            {groupedReports.map(r=><option key={r.date} value={r.date}>{r.date} - {r.reportCount} report(s), {r.workersCount||0} workers, {r.completedToday||0} sqft</option>)}
          </select>
        </div>
        {dateReport?(
          <div className="space-y-3">
            <div className="text-xs font-black text-gray-600 uppercase">📅 {selectedDate} Activity</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-blue-50 rounded-xl p-2 text-center"><div className="font-black text-blue-700">{dateReport.workersCount||0}</div><div className="text-gray-400">Workers</div></div>
              <div className="bg-teal-50 rounded-xl p-2 text-center"><div className="font-black text-teal-700">{dateReport.completedToday||0} sqft</div><div className="text-gray-400">Done</div></div>
              <div className="bg-blue-50 rounded-xl p-2 text-center"><div className="font-black text-blue-700">{CURRENCY}{fmt(dateReport.totalReceived||0)}</div><div className="text-gray-400">Received</div></div>
            </div>
            {dateReport.dayNotes&&<SectionBox title="Day Notes" icon="📝" color="gray"><div className="text-sm">{dateReport.dayNotes}</div></SectionBox>}
            {(dateReport.workerEntries||[]).length>0&&(
              <SectionBox title="Workers" icon="👷" color="teal">
                {dateReport.workerEntries.map((w,i)=>(
                  <div key={i} className="text-xs flex justify-between py-1 border-b border-teal-100">
                    <span><span className="font-bold">{w.workerName}</span> · <Badge color={w.attendance==="present"?"green":"red"}>{w.attendance}</Badge></span>
                    <span>{w.paymentGiven?`Paid: ${CURRENCY}${fmt(w.paymentGiven)}`:""}{+w.pending>0?` | Pending: ${CURRENCY}${fmt(w.pending)}`:""}</span>
                  </div>
                ))}
              </SectionBox>
            )}
            {dateReport.materialsUnloaded&&<SectionBox title="Materials" icon="🧱" color="teal"><div className="text-sm">{dateReport.materialsUnloaded} · {dateReport.materialQty}</div><div className="text-xs text-gray-400">Supplier: {dateReport.supplierName||"—"}</div></SectionBox>}
            {dateReport.extraWorkDesc&&<SectionBox title="Extra Work" icon="➕" color="orange"><div className="text-sm">{dateReport.extraWorkDesc} · {dateReport.extraWorkQty}</div><div className="text-xs font-bold text-orange-700">{CURRENCY}{fmt(dateReport.extraWorkCost||0)}</div></SectionBox>}
            {(dateReport.payments||[]).filter(p=>p.type!=="Worker Payment").length>0&&(
              <SectionBox title="Payments" icon="💰" color="green">
                {(dateReport.payments||[]).filter(p=>p.type!=="Worker Payment").map((p,i)=>(
                  <div key={i} className="flex justify-between text-xs bg-white rounded-lg px-3 py-2 mb-1 border border-green-100">
                    <span><span className={`font-bold ${p.type==="Site Payment Received"?"text-blue-700":"text-gray-700"}`}>{p.type}</span>{p.workerName?` → ${p.workerName}`:""}{p.receivedFrom?` from ${p.receivedFrom}`:""} · {p.mode}</span>
                    <span className={`font-black ${p.type==="Site Payment Received"?"text-blue-700":"text-red-600"}`}>{p.type==="Site Payment Received"?"+":"-"}{CURRENCY}{fmt(p.amount)}</span>
                  </div>
                ))}
              </SectionBox>
            )}
            {dateReport.complaints&&<SectionBox title="Complaints" icon="⚠️" color="red"><div className="text-sm">{dateReport.complaints}</div>{dateReport.actionTaken&&<div className="text-xs text-gray-400 mt-1">Action: {dateReport.actionTaken}</div>}</SectionBox>}
          </div>
        ):(
          <div className="space-y-3">
            <div className="text-xs font-black text-gray-500 uppercase">📊 Full Site History</div>
            {clientPayments.length>0&&<SectionBox title="Site Payments Received" icon="💚" color="green">{clientPayments.map((p,i)=><div key={i} className="text-xs flex justify-between py-1 border-b border-green-100"><span>{p.date} · {p.receivedFrom||"—"} · {p.mode}</span><span className="font-black text-green-700">+{CURRENCY}{fmt(p.amount)}</span></div>)}<div className="text-xs font-black text-green-700 text-right pt-1">Total: {CURRENCY}{fmt(totalReceived)}</div></SectionBox>}
            {workerPayments.length>0&&<SectionBox title="Worker Payments" icon="👷" color="amber">{workerPayments.map((p,i)=><div key={i} className="text-xs flex justify-between py-1 border-b border-amber-100"><span>{p.date} · {p.workerName||p.paidTo||"—"}</span><span className="font-black text-amber-700">{CURRENCY}{fmt(p.amount)}</span></div>)}</SectionBox>}
            {materialPayments.length>0&&<SectionBox title="Material Payments" icon="🧱" color="teal">{materialPayments.map((p,i)=><div key={i} className="text-xs flex justify-between py-1 border-b border-teal-100"><span>{p.date} · {p.materialName||p.paidTo||"—"}</span><span className="font-black text-teal-700">{CURRENCY}{fmt(p.amount)}</span></div>)}</SectionBox>}
            {allMats.length>0&&<SectionBox title="Material History" icon="📦" color="blue">{allMats.map((r,i)=><div key={i} className="text-xs flex justify-between py-1 border-b border-blue-100"><span>{r.date} · {r.materialsUnloaded} ({r.materialQty})</span><span className="text-gray-400">{r.supplierName||"—"}</span></div>)}</SectionBox>}
            {allExtra.length>0&&<SectionBox title="Extra Work" icon="➕" color="orange">{allExtra.map((r,i)=><div key={i} className="text-xs flex justify-between py-1 border-b border-orange-100"><span>{r.date} · {r.extraWorkDesc}</span><span className="font-black text-orange-700">{CURRENCY}{fmt(r.extraWorkCost||0)}</span></div>)}</SectionBox>}
            <div className="text-xs font-black text-gray-500 uppercase">Daily Reports ({groupedReports.length} days / {sr.length} reports)</div>
            {groupedReports.length===0&&<EmptyState icon="Report" text="No reports submitted yet" />}
            {groupedReports.map(r=>(
              <div key={r.date} onClick={()=>setSelectedDate(r.date)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-2 cursor-pointer hover:border-amber-300 transition-all">
                <div className="flex items-center justify-between">
                  <div><div className="font-black">📅 {r.date}</div><div className="text-xs text-gray-400">{r.workersCount||0} workers · {r.completedToday||0} sqft</div></div>
                  <div className="text-right">
                    {+(r.totalReceived||0)>0&&<div className="font-black text-blue-700 text-xs">+{CURRENCY}{fmt(r.totalReceived)}</div>}
                    <div className="font-black text-green-700">{CURRENCY}{fmt(r.totalPayments||0)}</div>
                    <Badge color="amber">{r.siteStatus||"running"}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-gray-900">📊 My Site Reports</h2>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search site..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" />
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-center"><div className="font-black text-amber-700">{siteWorks.filter(s=>s.status==="running").length}</div><div className="text-gray-400">Running</div></div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-2 text-center"><div className="font-black text-green-700">{siteWorks.filter(s=>s.status==="completed").length}</div><div className="text-gray-400">Completed</div></div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-2 text-center"><div className="font-black text-blue-700">{CURRENCY}{fmt(siteWorks.reduce((a,s)=>a+directSitePaymentRows(s, getSiteReports(s).reduce((x,r)=>x+(+(r.totalReceived||0)),0)).reduce((x,p)=>x+(+(p.amount)||0),0),0)+dailyReports.reduce((a,r)=>a+(+(r.totalReceived||0)),0))}</div><div className="text-gray-400">Total Rcvd</div></div>
      </div>
      <div className="space-y-3">
        {filteredSites.length===0&&<EmptyState icon="📊" text="No sites found" />}
        {filteredSites.map(s=>{
          const sr = getSiteReports(s);
          const dailyReceived = sr.reduce((a,r)=>a+(+(r.totalReceived||0)),0);
          const received = dailyReceived + directSitePaymentRows(s, dailyReceived).reduce((a,p)=>a+(+(p.amount)||0),0);
          const siteCost = +(s.totalCost||s.totalAmount||0);
          const pending = Math.max(0, siteCost - received);
          return (
            <div key={s._id} onClick={()=>setSelectedSite(s)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:border-amber-300 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-black text-gray-900">{s.customerName}</div>
                  <div className="text-xs text-gray-400">📍 {s.siteLocation||"—"}</div>
                  <div className="text-xs text-gray-400">{sr.length} daily reports</div>
                </div>
                <Badge color={s.status==="completed"?"green":s.status==="running"?"amber":"gray"}>{s.status}</Badge>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1 text-xs">
                <div className="bg-green-50 rounded-lg p-1.5 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt(siteCost)}</div><div className="text-gray-400">Cost</div></div>
                <div className="bg-blue-50 rounded-lg p-1.5 text-center"><div className="font-black text-blue-700">{CURRENCY}{fmt(received)}</div><div className="text-gray-400">Received</div></div>
                <div className="bg-red-50 rounded-lg p-1.5 text-center"><div className="font-black text-red-600">{CURRENCY}{fmt(pending)}</div><div className="text-gray-400">Pending</div></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ─── SUPERVISOR SITE REPORT ───────────────────────────────────────────────────


// ─── SUPERVISOR SITE REPORT VIEW ─────────────────────────────────────────────


function OfficeDailyReport({ user }) {
  const [selectedDate, setSelectedDate] = useState(today());
  const [report, setReport] = useState({ totals: {}, sales: [], purchases: [], productionEntries: [], productionItemSummary: [], productionPayments: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams({ date: selectedDate, role: effectiveRoleOf(user.role), name: user.name });
    api("GET", `/office-daily-report?${params.toString()}`).then(data => {
      if (!active) return;
      setReport(data?.totals ? data : { totals: {}, sales: [], purchases: [], productionEntries: [], productionItemSummary: [], productionPayments: [] });
      setLoading(false);
    });
    return () => { active = false; };
  }, [selectedDate, user.role, user.name]);

  const total = report.totals || {};
  const money = value => `${CURRENCY}${fmt(value)}`;
  const detailText = entry => {
    const inchSized = entry?.productType === "interlock" || entry?.productType === "hollowbrick";
    return [
      entry.category,
      entry.shape,
      entry.color,
      entry.size && inchSized ? `${entry.size} inch` : entry.size,
      entry.thickness && inchSized ? `${entry.thickness} inch thick` : entry.thickness
    ].filter(Boolean).join(", ");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-black text-gray-900">Office Daily Report</h2>
          <div className="text-xs text-gray-400">Daily sales, purchases, production, and production worker payments</div>
        </div>
        <div className="bg-white border rounded-2xl shadow-sm p-3">
          <Input label="Report Date" type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} />
        </div>
      </div>

      {loading ? <Loader /> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Sales Amount" value={money(total.salesAmount)} icon="S" color="blue" sub={`${total.salesCount||0} bills`} />
            <StatCard label="Cash Received" value={money(total.cashReceived)} icon="R" color="green" sub={`Pending ${money(total.salesPending)}`} />
            <StatCard label="Purchase Paid" value={money(total.purchasePaid)} icon="P" color="amber" sub={`Total ${money(total.purchaseAmount)}`} />
            <StatCard label="Production Paid" value={money(total.productionPayments)} icon="W" color="purple" sub={`Pending ${money(total.productionPending)}`} />
            <StatCard label="Production Qty" value={fmt(total.productionQuantity)} icon="Q" color="teal" sub={`${fmt(total.productionSqft || 0)} sqft | ${total.productionCount||0} entries`} />
            <StatCard label="Production Value" value={money(total.productionEarnings)} icon="V" color="green" />
            <StatCard label="Total Cash Paid" value={money(total.cashPaid)} icon="-" color="red" />
            <StatCard label="Net Cash" value={money(total.netCash)} icon="=" color={+(total.netCash)>=0?"green":"red"} />
          </div>

          <SectionBox title="Production Item-wise Total" icon="P" color="teal">
            {(report.productionItemSummary||[]).length===0 ? <div className="text-xs text-gray-400">No production for this day</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-gray-400 border-b"><th className="py-2">Item</th><th>Category / Color</th><th className="text-right">Qty / Sqft</th><th>Unit</th><th className="text-right">Amount</th><th className="text-right">Paid</th><th className="text-right">Pending</th></tr></thead>
                  <tbody>{report.productionItemSummary.map((p,i)=>(
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2 font-bold">{p.item}</td>
                      <td>{[p.category,p.color].filter(Boolean).join(" / ") || "-"}</td>
                      <td className="text-right font-bold">{qtyWithSqft(p)}</td>
                      <td>{p.unit}</td>
                      <td className="text-right">{money(p.amount)}</td>
                      <td className="text-right text-green-700 font-bold">{money(p.paid)}</td>
                      <td className="text-right text-red-600 font-bold">{money(p.pending)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </SectionBox>

          <SectionBox title="Sales Details" icon="S" color="green">
            {(report.sales||[]).length===0 ? <div className="text-xs text-gray-400">No sales for this day</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-gray-400 border-b"><th className="py-2">Invoice</th><th>Customer</th><th>Product</th><th className="text-right">Qty</th><th className="text-right">Total</th><th className="text-right">Received</th><th className="text-right">Pending</th></tr></thead>
                  <tbody>{report.sales.map(s=>(
                    <tr key={s._id} className="border-b border-gray-100">
                      <td className="py-2 font-bold">{s.invoiceNumber||"-"}</td>
                      <td>{s.customer||"-"}</td>
                      <td><div className="font-semibold">{s.product||s.interlockDetails||"-"}</div><div className="text-gray-400">{detailText(s)}</div></td>
                      <td className="text-right">{s.productType==="hollowbrick" ? `${fmt(s.quantity)} numbers` : <>{fmt(s.quantity)} pcs<br />{fmt(+(s.sqftQty||0) || (+(s.quantity||0) * +(s.sqftPerPiece||0)))} sqft</>}</td>
                      <td className="text-right">{money(s.total)}</td>
                      <td className="text-right text-green-700 font-bold">{money(s.amountPaid)}</td>
                      <td className="text-right text-red-600 font-bold">{money(s.amountPending)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </SectionBox>

          <SectionBox title="Purchase Details" icon="P" color="amber">
            {(report.purchases||[]).length===0 ? <div className="text-xs text-gray-400">No purchases for this day</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-gray-400 border-b"><th className="py-2">Supplier</th><th>Material</th><th className="text-right">Qty</th><th className="text-right">Total</th><th className="text-right">Paid</th><th className="text-right">Pending</th><th>Vehicle</th></tr></thead>
                  <tbody>{report.purchases.map(p=>(
                    <tr key={p._id} className="border-b border-gray-100">
                      <td className="py-2 font-bold">{p.supplierName||"-"}</td>
                      <td>{p.itemName||p.itemType||"-"}</td>
                      <td className="text-right">{fmt(p.quantity)} {p.unit||""}</td>
                      <td className="text-right">{money(p.totalAmount)}</td>
                      <td className="text-right text-green-700 font-bold">{money(p.amountPaid)}</td>
                      <td className="text-right text-red-600 font-bold">{money(p.amountPending)}</td>
                      <td>{[p.vehicleNumber,p.driverName].filter(Boolean).join(" / ") || "-"}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </SectionBox>

          <SectionBox title="Production Worker Payments" icon="W" color="purple">
            {(report.productionPayments||[]).length===0 ? <div className="text-xs text-gray-400">No production worker payments for this day</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-gray-400 border-b"><th className="py-2">Worker</th><th>Item</th><th className="text-right">Produced / Sqft</th><th className="text-right">Earned</th><th className="text-right">Paid</th><th className="text-right">Pending</th><th>Remarks</th></tr></thead>
                  <tbody>{report.productionPayments.map((p,i)=>(
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2 font-bold">{p.workerName||"-"}</td>
                      <td>{p.itemName||p.category||"-"}</td>
                      <td className="text-right">{qtyWithSqft(p)}</td>
                      <td className="text-right">{money(p.earned)}</td>
                      <td className="text-right text-green-700 font-bold">{money(p.amount)}</td>
                      <td className="text-right text-red-600 font-bold">{money(p.pending)}</td>
                      <td>{p.remarks||"-"}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </SectionBox>

          <SectionBox title="Production Entry Details" icon="D" color="blue">
            {(report.productionEntries||[]).length===0 ? <div className="text-xs text-gray-400">No production entries for this day</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-gray-400 border-b"><th className="py-2">Worker</th><th>Item</th><th>Color</th><th className="text-right">Qty / Sqft</th><th className="text-right">Rate</th><th className="text-right">Amount</th><th className="text-right">Paid</th></tr></thead>
                  <tbody>{report.productionEntries.map(e=>(
                    <tr key={e._id} className="border-b border-gray-100">
                      <td className="py-2 font-bold">{e.workerName||"-"}</td>
                      <td>{e.itemName||e.category||"-"}</td>
                      <td>{e.color||"-"}</td>
                      <td className="text-right">{qtyWithSqft(e)}</td>
                      <td className="text-right">{money(e.productionRate)}</td>
                      <td className="text-right">{money(e.totalAmount)}</td>
                      <td className="text-right text-green-700 font-bold">{money(e.paymentGiven)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </SectionBox>
        </>
      )}
    </div>
  );
}

function DailyCashFlow({ user, allUsers }) {
  const [view, setView] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(today());
  const [dateMode, setDateMode] = useState("all");
  const [fromDate, setFromDate] = useState(today());
  const [toDate, setToDate] = useState(today());
  const [personFilter, setPersonFilter] = useState(user.role === "admin" ? "role:all" : "");
  const [data, setData] = useState({ history: [], total: {} });
  const [loading, setLoading] = useState(true);

  const getRange = () => {
    if (view === "daily") return { from: selectedDate, to: selectedDate };
    if (dateMode === "all") return { from: "", to: "" };
    if (dateMode === "today") return { from: today(), to: today() };
    if (dateMode === "monthly") {
      const d = new Date();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      return { from: `${d.getFullYear()}-${month}-01`, to: `${d.getFullYear()}-${month}-${last}` };
    }
    if (dateMode === "custom") return { from: fromDate, to: fromDate };
    return { from: fromDate, to: toDate };
  };

  useEffect(() => {
    let active = true;
    const range = getRange();
    const params = new URLSearchParams({ role: user.role, name: user.name, fromDate: range.from, toDate: range.to });
    if (user.role === "admin") {
      const [kind, role, ...nameParts] = personFilter.split(":");
      if (kind === "role" && role !== "all") params.set("personRole", role);
      if (kind === "person") {
        params.set("personRole", role);
        params.set("person", nameParts.join(":"));
      }
    }
    setLoading(true);
    api("GET", `/cashflow?${params.toString()}`).then(result => {
      if (!active) return;
      setData(result?.history ? result : { history: [], total: {} });
      setLoading(false);
    });
    return () => { active = false; };
  }, [user.role, user.name, view, selectedDate, dateMode, fromDate, toDate, personFilter]);

  const isSupervisor = user.role === "supervisor" || (user.role === "admin" && personFilter.includes(":supervisor"));
  const isMixedCashFlow = user.role === "admin" && personFilter === "role:all";
  const total = data.total || {};
  const money = value => `${CURRENCY}${fmt(value)}`;
  const dateLabel = value => {
    if (!value) return "—";
    const [y,m,d] = value.split("-");
    return `${d}-${m}-${y}`;
  };
  const personOptions = [
    { value:"role:all", label:"All Persons" },
    { value:"role:supervisor", label:"All Supervisors" },
    { value:"role:user", label:"Admin & Users" },
    ...(allUsers || []).filter(u=>u.role==="admin"||u.role==="supervisor"||u.role==="user").map(u=>({
      value:`person:${u.role}:${u.name}`, label:`${u.name} (${u.role})`
    }))
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-black text-gray-900">Daily Cash Flow</h2>
          <div className="text-xs text-gray-400">Read-only totals from reports, sales, purchases and payments</div>
        </div>
        <div className="flex bg-white border rounded-xl p-1">
          <button onClick={()=>setView("daily")} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${view==="daily"?"bg-amber-500 text-white":"text-gray-500"}`}>Daily View</button>
          <button onClick={()=>setView("total")} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${view==="total"?"bg-amber-500 text-white":"text-gray-500"}`}>Total View</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {user.role==="admin"&&<Select label="Select Person" value={personFilter} options={personOptions} onChange={e=>setPersonFilter(e.target.value)} />}
        {view==="daily" ? (
          <Input label="Select Date" type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} />
        ) : (
          <>
            <Select label="Date Filter" value={dateMode} options={[
              {value:"all",label:"All Time"},{value:"today",label:"Today"},{value:"monthly",label:"Monthly"},
              {value:"custom",label:"Custom Date"},{value:"range",label:"Date Range"}
            ]} onChange={e=>setDateMode(e.target.value)} />
            {(dateMode==="custom"||dateMode==="range")&&<Input label={dateMode==="custom"?"Date":"From Date"} type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} />}
            {dateMode==="range"&&<Input label="To Date" type="date" value={toDate} onChange={e=>setToDate(e.target.value)} />}
          </>
        )}
      </div>

      {loading ? <Loader /> : (
        <>
          {view==="daily"&&<div className="text-sm font-black text-gray-700">Date: {dateLabel(selectedDate)}</div>}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {isMixedCashFlow ? (
              <>
                <StatCard label="Cash Received" value={money(total.received)} icon="₹" color="green" />
                <StatCard label="Sales Amount" value={money(total.salesAmount)} icon="S" color="blue" />
                <StatCard label="Worker Payments" value={money(total.workerPayments)} icon="W" color="amber" />
                <StatCard label="Purchase Payments" value={money(total.purchasePayments)} icon="P" color="teal" />
                <StatCard label="Other Expenses" value={money(total.otherExpenses)} icon="O" color="purple" />
                <StatCard label="Total Expenses" value={money(total.totalExpenses)} icon="−" color="red" />
                <StatCard label="Net Cash Balance" value={money(total.netBalance)} icon="=" color={+(total.netBalance)>=0?"green":"red"} />
              </>
            ) : isSupervisor ? (
              <>
                <StatCard label="Cash Received" value={money(total.received)} icon="₹" color="green" />
                <StatCard label="Worker Payments" value={money(total.workerPayments)} icon="W" color="amber" />
                <StatCard label="Vehicle Charges" value={money(total.vehicleCharges)} icon="V" color="blue" />
                <StatCard label="Other Expenses" value={money(total.otherExpenses)} icon="O" color="purple" />
                <StatCard label="Material Payments" value={money(total.materialPayments)} icon="M" color="teal" />
                <StatCard label="Equipment Payments" value={money(total.equipmentPayments)} icon="E" color="gray" />
                <StatCard label="Total Expenses" value={money(total.totalExpenses)} icon="−" color="red" />
                <StatCard label="Net Cash Balance" value={money(total.netBalance)} icon="=" color={+(total.netBalance)>=0?"green":"red"} />
              </>
            ) : (
              <>
                <StatCard label="Total Sales Amount" value={money(total.salesAmount)} icon="S" color="blue" />
                <StatCard label="Customer Payments Received" value={money(total.customerPayments)} icon="₹" color="green" />
                <StatCard label="Purchase Payments" value={money(total.purchasePayments)} icon="P" color="amber" />
                <StatCard label="Worker Payments" value={money(total.workerPayments)} icon="W" color="teal" />
                <StatCard label="Other Expenses" value={money(total.otherExpenses)} icon="O" color="purple" />
                <StatCard label="Total Expenses" value={money(total.totalExpenses)} icon="−" color="red" />
                <StatCard label="Net Cash Balance" value={money(total.netBalance)} icon="=" color={+(total.netBalance)>=0?"green":"red"} />
              </>
            )}
          </div>

          {data.history.length===0 ? <EmptyState icon="₹" text="No cash flow records for this filter" /> : (
            <div className="space-y-3">
              {data.history.map((row,i)=>(
                <div key={`${row.date}-${row.person}-${i}`} className="bg-white rounded-2xl border shadow-sm p-4 space-y-3">
                  <div className="flex justify-between gap-2">
                    <div><div className="font-black">{dateLabel(row.date)}{user.role==="admin"?` · ${row.person}`:""}</div><div className="text-xs text-gray-400">{row.personRole}</div></div>
                    <div className={`font-black ${row.netBalance>=0?"text-green-700":"text-red-600"}`}>{money(row.netBalance)}</div>
                  </div>
                  {isSupervisor ? (
                    <>
                      <SectionBox title="Cash Received" icon="₹" color="green">
                        {(row.receivedDetails||[]).length===0?<div className="text-xs text-gray-400">No cash received</div>:(row.receivedDetails||[]).map((d,j)=><div key={j} className="grid grid-cols-4 gap-2 text-xs border-b border-green-100 py-1"><span>{dateLabel(d.date)}</span><span>{d.site||"—"}</span><span>{d.source}</span><span className="text-right font-bold">{money(d.amount)}</span></div>)}
                      </SectionBox>
                      <SectionBox title="Cash Spent" icon="−" color="red">
                        {(row.spentDetails||[]).length===0?<div className="text-xs text-gray-400">No cash spent</div>:(row.spentDetails||[]).map((d,j)=><div key={j} className="grid grid-cols-4 gap-2 text-xs border-b border-red-100 py-1"><span>{dateLabel(d.date)}</span><span>{d.type}</span><span>{d.details||"—"}</span><span className="text-right font-bold">{money(d.amount)}</span></div>)}
                      </SectionBox>
                    </>
                  ) : (
                    <>
                      <SectionBox title="Sales" icon="₹" color="green">
                        {(row.salesDetails||[]).length===0?<div className="text-xs text-gray-400">No sales</div>:(row.salesDetails||[]).map((d,j)=><div key={j} className="grid grid-cols-4 gap-2 text-xs border-b border-green-100 py-1"><span>{dateLabel(d.date)}</span><span>{d.customer||"—"}</span><span>{d.item||"—"}</span><span className="text-right font-bold">{money(d.amountReceived)}</span></div>)}
                      </SectionBox>
                      <SectionBox title="Purchases & Expenses" icon="−" color="red">
                        {(row.purchaseDetails||[]).map((d,j)=><div key={`p${j}`} className="grid grid-cols-4 gap-2 text-xs border-b border-red-100 py-1"><span>{dateLabel(d.date)}</span><span>{d.supplier||"—"}</span><span>{d.material||"—"}</span><span className="text-right font-bold">{money(d.amountPaid)}</span></div>)}
                        {(row.spentDetails||[]).map((d,j)=><div key={`e${j}`} className="grid grid-cols-4 gap-2 text-xs border-b border-red-100 py-1"><span>{dateLabel(d.date)}</span><span>{d.type}</span><span>{d.details||"—"}</span><span className="text-right font-bold">{money(d.amount)}</span></div>)}
                        {!(row.purchaseDetails||[]).length&&!(row.spentDetails||[]).length&&<div className="text-xs text-gray-400">No purchases or expenses</div>}
                      </SectionBox>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const NAV = {
  admin: [
    { id:"cashflow", label:"Daily Cash Flow", icon:"₹" },
    { id:"officedaily", label:"Office Daily Report", icon:"DR" },
    { id:"dashboard", label:"Dashboard", icon:"📊" },
    { id:"sitework", label:"Site Work", icon:"🏗️" },
    { id:"productionsite", label:"Production Site", icon:"🏭" },
    { id:"masterdata", label:"Master Data", icon:"⚙️" },
    { id:"suppliers", label:"Suppliers", icon:"🏪" },
    { id:"workers", label:"Workers", icon:"👷" },
    { id:"attendance", label:"Attendance", icon:"📊" },
    { id:"dailyreport", label:"Supervisor Report", icon:"📝" },
    { id:"sitereport", label:"Site Reports", icon:"🏗️" },
    { id:"workerreport2", label:"Worker Reports", icon:"👷" },
    { id:"supervisorreports", label:"Sup. Overview", icon:"🔍" },
    { id:"purchases", label:"Purchases", icon:"🛒" },
    { id:"stock", label:"Stock", icon:"📦" },
    { id:"raw", label:"Raw Material", icon:"🧱" },
    { id:"sales", label:"Sales", icon:"💰" },
    { id:"devices", label:"Devices", icon:"📱" },
    { id:"users", label:"Users", icon:"👥" },
    { id:"reports", label:"Reports", icon:"📈" },
  ],
  supervisor: [
    { id:"cashflow", label:"Daily Cash Flow", icon:"₹" },
    { id:"sitework", label:"Site Work", icon:"🏗️" },
    { id:"dailyreport", label:"Daily Report", icon:"📋" },
    { id:"mysitereports", label:"My Site Reports", icon:"📊" },
    { id:"workerreport2", label:"Worker Ledger", icon:"W" },
    { id:"workerreport", label:"Site Report", icon:"📝" },
    { id:"workers", label:"Workers", icon:"👷" },
    { id:"suppliers", label:"Suppliers", icon:"🏪" },
    { id:"purchases", label:"Purchases", icon:"🛒" },
    { id:"workplan", label:"Work Planning", icon:"📅" },
  ],
  user: [
    { id:"cashflow", label:"Daily Cash Flow", icon:"₹" },
    { id:"dashboard", label:"Dashboard", icon:"📊" },
    { id:"sitework", label:"Site Work", icon:"🏗️" },
    { id:"productionsite", label:"Production Site", icon:"🏭" },
    { id:"masterdata", label:"Master Data", icon:"⚙️" },
    { id:"suppliers", label:"Suppliers", icon:"🏪" },
    { id:"workers", label:"Workers", icon:"👷" },
    { id:"attendance", label:"Attendance", icon:"📊" },
    { id:"workerreport", label:"Site Report", icon:"📋" },
    { id:"dailyreport", label:"Supervisor Report", icon:"📝" },
    { id:"supervisorwork", label:"Sup. Work", icon:"📋" },
    { id:"sitereport", label:"Site Reports", icon:"🏗️" },
    { id:"workerreport2", label:"Worker Reports", icon:"👷" },
    { id:"supervisorreports", label:"Sup. Overview", icon:"🔍" },
    { id:"purchases", label:"Purchases", icon:"🛒" },
    { id:"stock", label:"Stock", icon:"📦" },
    { id:"raw", label:"Raw Material", icon:"🧱" },
    { id:"sales", label:"Sales", icon:"💰" },
    { id:"reports", label:"Reports", icon:"📈" },
  ],
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stock, setStock] = useState([]);
  const [raw, setRaw] = useState([]);
  const [production, setProduction] = useState([]);
  const [sales, setSales] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [siteWorks, setSiteWorks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    if (!currentUser) return;
    if (currentUser.role==="supervisor") {
      api("GET","/sitework").then(sw=>setSiteWorks(Array.isArray(sw)?sw:[])).catch(()=>{});
      return;
    }
    setLoading(true);
    Promise.all([api("GET","/stock"),api("GET","/raw"),api("GET","/production"),api("GET","/sales"),api("GET","/users"),api("GET","/sitework")])
      .then(([s,r,p,sa,u,sw])=>{
        setStock(Array.isArray(s)?s:[]);
        setRaw(Array.isArray(r)?r:[]);
        setProduction(Array.isArray(p)?p:[]);
        setSales(Array.isArray(sa)?sa:[]);
        setAllUsers(Array.isArray(u)?u:[]);
        setSiteWorks(Array.isArray(sw)?sw:[]);
        setLoading(false);
      }).catch(()=>setLoading(false));
  },[currentUser]);

  if (!currentUser) return <Login onLogin={(u)=>{
    if (u.devicePending) {
      setCurrentUser({...u, _pendingDevice: true});
    } else {
      setCurrentUser(u);
      setPage(u.role==="supervisor"?"sitework":"dashboard");
    }
  }} />;
  
  // Show device pending screen
  if (currentUser?._pendingDevice) {
    return <DevicePendingScreen 
      username={currentUser.username} 
      deviceInfo={currentUser.deviceInfo}
      onRetry={()=>{
        setCurrentUser({...currentUser, _pendingDevice: false});
        setPage(currentUser.role==="supervisor"?"sitework":"dashboard");
      }}
    />;
  }

  const nav = NAV[effectiveRoleOf(currentUser.role)]||[];
  const roleColors = { admin:"from-slate-700 to-slate-800", supervisor:"from-emerald-600 to-emerald-700", user:"from-blue-600 to-blue-700" };

  const renderPage = () => {
    if (loading) return <Loader />;
    switch (page) {
      case "dashboard": return <Dashboard stock={stock} raw={raw} production={production} sales={sales} siteWorks={siteWorks} user={currentUser} />;
      case "sitework": return <SiteWork siteWorks={siteWorks} setSiteWorks={setSiteWorks} user={currentUser} />;
      case "masterdata": return <MasterData />;
      case "workers": return <Workers user={currentUser} />;
      case "suppliers": return <Suppliers user={currentUser} />;
      case "productionsite": return <ProductionSite user={currentUser} setStock={setStock} />;
      case "attendance": return <AttendanceReports user={currentUser} />;
      case "supervisorwork": return <SupervisorWorkView user={currentUser} />;
      case "supervisorsitereport": return <SupervisorSiteReport user={currentUser} />;
      case "mysitereports": return <SupervisorSiteReport user={currentUser} />;
      case "workerreport": return <WorkerReport user={currentUser} />;
      case "dailyreport": return <DailyReport user={currentUser} />;
      case "workplan": return <WorkPlanning siteWorks={siteWorks} user={currentUser} />;
      case "purchases": return <Purchases user={currentUser} />;
      case "supervisorreports": return <SupervisorReports allUsers={Array.isArray(allUsers)?allUsers:[]} />;
      case "sitereport": return <AdminSiteReport />;
      case "workerreport2": return <AdminWorkerReport user={currentUser} />;
      case "stock": return <Stock stock={stock} setStock={setStock} user={currentUser} />;
      case "raw": return <RawMaterial raw={raw} setRaw={setRaw} user={currentUser} />;
      case "production": return <Production production={production} setProduction={setProduction} stock={stock} user={currentUser} />;
      case "sales": return <Sales sales={sales} setSales={setSales} stock={stock} setStock={setStock} user={currentUser} />;
      case "cashflow": return <DailyCashFlow user={currentUser} allUsers={allUsers} />;
      case "officedaily": return isAdminLike(currentUser.role)?<OfficeDailyReport user={currentUser} />:null;
      case "users": return isAdminLike(currentUser.role)?<Users currentUser={currentUser} allUsers={allUsers} setAllUsers={setAllUsers} />:null;
      case "devices": return <DeviceManagement user={currentUser} />;
      case "reports": return <Reports production={production} sales={sales} stock={stock} raw={raw} siteWorks={siteWorks} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {sidebarOpen&&<div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={()=>setSidebarOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-slate-950 z-30 flex flex-col transform transition-transform duration-300 ${sidebarOpen?"translate-x-0":"-translate-x-full"} lg:translate-x-0 lg:static lg:h-screen lg:flex`}>
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl">{COMPANY.logo}</div>
            <div><div className="text-white font-black text-sm leading-tight">{COMPANY.name}</div><div className="text-slate-400 text-xs">Management System</div></div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(item=>(
            <button key={item.id} onClick={()=>{setPage(item.id);setSidebarOpen(false);}}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${page===item.id?"bg-amber-500 text-white shadow-sm":"text-slate-400 hover:bg-slate-900 hover:text-white"}`}>
              <span className="text-base">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-slate-800">
          <div className="px-2 pb-3 text-center">
            <div className="text-[10px] font-bold text-slate-400">{POWERED_BY}</div>
            <div className="text-[9px] text-slate-500 mt-0.5">{COPYRIGHT_TEXT}</div>
          </div>
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-3 py-3">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${roleColors[currentUser.role]} flex items-center justify-center text-white font-black text-xs shrink-0`}>{currentUser.avatar}</div>
            <div className="flex-1 min-w-0"><div className="text-white text-xs font-bold truncate">{currentUser.name}</div><div className="text-stone-400 text-xs capitalize">{currentUser.role}</div></div>
            <button onClick={()=>setCurrentUser(null)} className="text-stone-500 hover:text-red-400 text-xs font-bold" title="Logout">⏻</button>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
          <button onClick={()=>setSidebarOpen(!sidebarOpen)} className="lg:hidden text-gray-600 text-xl">☰</button>
          <h1 className="font-black text-slate-950 flex-1 text-base">{nav.find(n=>n.id===page)?.icon} {nav.find(n=>n.id===page)?.label}</h1>
          <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${roleColors[currentUser.role]} text-white text-xs font-bold`}>
            {currentUser.avatar} <span className="capitalize">{currentUser.role}</span>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto max-w-6xl w-full mx-auto">{renderPage()}</main>
      </div>
    </div>
  );
}
