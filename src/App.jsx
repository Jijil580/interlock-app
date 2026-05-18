import { useState, useEffect } from "react";

const API = "https://interlock-backend.onrender.com/api";
const COMPANY = { name: "PK Interlock", logo: "🏭" };
const CURRENCY = "₹";
const fmt = (n) => (+(n)||0).toLocaleString("en-IN");
const today = () => new Date().toISOString().split("T")[0];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide?"max-w-2xl":"max-w-lg"} max-h-[92vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
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
      {label && <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>}
      <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50" {...props} />
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div>
      {label && <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>}
      <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50 resize-none" rows={3} {...props} />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div>
      {label && <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>}
      <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50" {...props}>
        {options.map((o) => <option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}
      </select>
    </div>
  );
}

function StatCard({ label, value, sub, icon, color }) {
  const c = { amber:"from-amber-400 to-orange-500", blue:"from-blue-500 to-blue-600", green:"from-emerald-500 to-green-600", red:"from-red-500 to-rose-600", purple:"from-violet-500 to-purple-600", teal:"from-teal-500 to-cyan-600", gray:"from-gray-400 to-gray-500" };
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-start gap-3">
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c[color]||c.amber} flex items-center justify-center text-xl shrink-0 shadow`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-xl font-black text-gray-900 truncate">{value}</div>
        <div className="text-xs font-semibold text-gray-600">{label}</div>
        {sub && <div className="text-xs text-gray-400">{sub}</div>}
      </div>
    </div>
  );
}

function Loader() {
  return <div className="flex items-center justify-center py-16"><div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>;
}

function EmptyState({ icon, text }) {
  return <div className="bg-white rounded-2xl border p-10 text-center"><div className="text-4xl mb-2">{icon}</div><div className="text-gray-400 font-semibold">{text}</div></div>;
}

function SectionBox({ title, icon, color = "gray", children }) {
  const c = { gray:"bg-gray-50 border-gray-200 text-gray-700", blue:"bg-blue-50 border-blue-200 text-blue-700", green:"bg-green-50 border-green-200 text-green-700", amber:"bg-amber-50 border-amber-200 text-amber-700", red:"bg-red-50 border-red-200 text-red-700", purple:"bg-purple-50 border-purple-200 text-purple-700", teal:"bg-teal-50 border-teal-200 text-teal-700", orange:"bg-orange-50 border-orange-200 text-orange-700" };
  return (
    <div className={`${c[color]} border rounded-2xl p-4 space-y-3`}>
      <div className={`text-xs font-black uppercase tracking-wider ${c[color].split(" ")[2]}`}>{icon} {title}</div>
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
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
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
        <button onClick={checkStatus} disabled={checking} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 disabled:opacity-60 mt-2">
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
        if (data.role !== "admin") {
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
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">{COMPANY.logo}</div>
          <h1 className="text-2xl font-black text-gray-900">{COMPANY.name}</h1>
          <p className="text-gray-400 text-sm mt-1">Management System</p>
        </div>
        <div className="space-y-4">
          <Input label="Username" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Enter username" onKeyDown={e=>e.key==="Enter"&&login()} />
          <Input label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter password" onKeyDown={e=>e.key==="Enter"&&login()} />
          {error && <div className="text-red-600 text-xs font-semibold bg-red-50 rounded-xl p-3">{error}</div>}
          <button onClick={login} disabled={loading} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-black text-base hover:opacity-90 shadow-lg disabled:opacity-60">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ stock, raw, production, sales, siteWorks, user }) {
  const totalSales = sales.reduce((a,s)=>a+(+(s.total)||0),0);
  const pendingWork = siteWorks.filter(s=>s.status==="running"||s.status==="pending").length;
  const completedWork = siteWorks.filter(s=>s.status==="completed").length;
  const totalIncome = siteWorks.reduce((a,s)=>a+(+(s.totalAmount)||0),0);
  const pendingPayment = siteWorks.filter(s=>s.paymentStatus!=="paid").reduce((a,s)=>a+(+(s.pendingAmount)||0),0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-gray-900">Good day, {user.name.split(" ")[0]} 👋</h2>
        <p className="text-xs text-gray-400 mt-0.5">{new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Running Sites" value={pendingWork} icon="🏗️" color="amber" />
        <StatCard label="Completed" value={completedWork} icon="✅" color="green" />
        <StatCard label="Total Income" value={`${CURRENCY}${fmt(totalIncome)}`} icon="💰" color="teal" />
        <StatCard label="Pending Payment" value={`${CURRENCY}${fmt(pendingPayment)}`} icon="⏳" color="red" />
      </div>
      {user.role === "admin" && (
        <div className="space-y-3">
          <div className="text-xs font-black text-gray-500 uppercase tracking-wider">📦 Stock Overview</div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Stock Items" value={stock.length} icon="📦" color="blue" />
            <StatCard label="Sales Today" value={`${CURRENCY}${fmt(totalSales)}`} icon="🛒" color="purple" />
          </div>
        </div>
      )}
      {siteWorks.length > 0 && (
        <div>
          <div className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">🏗️ Recent Sites</div>
          {siteWorks.slice(0,3).map(s=>(
            <div key={s._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-2 flex items-center justify-between">
              <div>
                <div className="font-black text-sm text-gray-900">{s.customerName||s.siteName||"—"}</div>
                <div className="text-xs text-gray-400">{s.location||s.siteLocation||"—"}</div>
              </div>
              <Badge color={s.status==="completed"?"green":s.status==="running"?"amber":"gray"}>{s.status||"pending"}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MASTER DATA (Admin) ──────────────────────────────────────────────────────
function MasterData() {
  const [tab, setTab] = useState("interlock");
  const [data, setData] = useState({ interlock:[], materials:[], labor:[], extrawork:[] });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // {type, item}
  const [form, setForm] = useState({});

  useEffect(() => {
    Promise.all([
      api("GET","/masterdata/interlock"),
      api("GET","/masterdata/materials"),
      api("GET","/masterdata/labor"),
      api("GET","/masterdata/extrawork"),
    ]).then(([i,m,l,e])=>{
      setData({ interlock:Array.isArray(i)?i:[], materials:Array.isArray(m)?m:[], labor:Array.isArray(l)?l:[], extrawork:Array.isArray(e)?e:[] });
      setLoading(false);
    });
  }, []);

  const save = async () => {
    const type = modal.type;
    if (modal.item?._id) {
      const updated = await api("PUT", `/masterdata/${type}/${modal.item._id}`, form);
      setData(d=>({...d,[type]:d[type].map(x=>x._id===modal.item._id?{...x,...form}:x)}));
    } else {
      const created = await api("POST", `/masterdata/${type}`, form);
      if (created._id) setData(d=>({...d,[type]:[...d[type],created]}));
    }
    setModal(null); setForm({});
  };

  const del = async (type, id) => {
    if (!window.confirm("Delete this item?")) return;
    await api("DELETE", `/masterdata/${type}/${id}`);
    setData(d=>({...d,[type]:d[type].filter(x=>x._id!==id)}));
  };

  const openAdd = (type) => { setForm({}); setModal({type, item:null}); };
  const openEdit = (type, item) => { setForm({...item}); setModal({type, item}); };

  const tabs = [
    { id:"interlock", label:"Interlock Types", icon:"🧱" },
    { id:"materials", label:"Raw Materials", icon:"⚙️" },
    { id:"labor", label:"Labor Rates", icon:"👷" },
    { id:"extrawork", label:"Extra Work", icon:"➕" },
  ];

  const renderForm = () => {
    const t = modal?.type;
    if (t==="interlock") return <>
      <Input label="Name *" value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Paving Block" />
      <div className="grid grid-cols-2 gap-2">
        <Input label="Shape" value={form.shape||""} onChange={e=>setForm({...form,shape:e.target.value})} placeholder="e.g. Rectangular" />
        <Input label="Color" value={form.color||""} onChange={e=>setForm({...form,color:e.target.value})} placeholder="e.g. Grey" />
        <Input label="Size (cm)" value={form.size||""} onChange={e=>setForm({...form,size:e.target.value})} placeholder="e.g. 20x10x6" />
        <Input label="Thickness (cm)" value={form.thickness||""} onChange={e=>setForm({...form,thickness:e.target.value})} placeholder="e.g. 6" />
        <Input label={`Price/sqft (${CURRENCY})`} type="number" value={form.pricePerSqft||""} onChange={e=>setForm({...form,pricePerSqft:+e.target.value})} />
        <Input label={`Price/sqm (${CURRENCY})`} type="number" value={form.pricePerSqm||""} onChange={e=>setForm({...form,pricePerSqm:+e.target.value})} />
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
                {tab==="interlock" && <div className="text-xs text-gray-500 mt-0.5">{[item.shape,item.color,item.size,item.thickness&&`${item.thickness}cm`].filter(Boolean).join(" · ")}</div>}
                {tab==="interlock" && <div className="text-xs text-amber-700 font-semibold mt-0.5">{item.pricePerSqft&&`${CURRENCY}${fmt(item.pricePerSqft)}/sqft`} {item.pricePerSqm&&`· ${CURRENCY}${fmt(item.pricePerSqm)}/sqm`}</div>}
                {tab==="materials" && <div className="text-xs text-gray-500 mt-0.5">{item.category} · {CURRENCY}{fmt(item.price)}/{item.unit} {item.stock>0&&`· Stock: ${item.stock}`}</div>}
                {tab==="labor" && <div className="text-xs text-gray-500 mt-0.5">{CURRENCY}{fmt(item.rate)} per {item.rateType}</div>}
                {tab==="extrawork" && <div className="text-xs text-gray-500 mt-0.5">{CURRENCY}{fmt(item.rate)} per {item.unit}</div>}
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
        <Modal title={`${modal.item?"Edit":"Add"} ${tabs.find(t=>t.id===modal.type)?.label}`} onClose={()=>{setModal(null);setForm({});}}>
          <div className="space-y-3">
            {renderForm()}
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
    advancePaid:"", pendingAmount:"", paymentStatus:"pending", paymentMode:"Cash", note:"",
  };

  const save = async (f) => {
    if (!f.customerName) return;
    const item = await api("POST", "/sitework", {...f, addedBy:user.name});
    if (item._id) { setSiteWorks(p=>[item,...p]); setShowAdd(false); }
  };

  const saveEdit = async (f) => {
    await api("PUT", `/sitework/${f._id}`, f);
    setSiteWorks(p=>p.map(x=>x._id===f._id?{...x,...f}:x));
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
      `Advance  : ${CURRENCY}${fmt(s.advancePaid||0)}`,
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
        {(user.role==="admin"||user.role==="supervisor")&&(
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
              {(user.role==="admin"||user.role==="supervisor")&&<button onClick={()=>setEditItem({...s})} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-1.5 rounded-xl text-xs font-bold">✏️ Edit</button>}
              <button onClick={()=>generateInvoice(s)} className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 py-1.5 rounded-xl text-xs font-bold">🧾 Invoice</button>
              {user.role==="admin"&&<button onClick={()=>del(s._id)} className="bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1.5 rounded-xl text-xs font-bold">🗑️</button>}
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
                <div className="flex justify-between"><span>Advance Paid</span><span className="font-bold text-green-600">{CURRENCY}{fmt(viewItem.advancePaid||0)}</span></div>
                <div className="flex justify-between"><span className="font-black text-red-600">Pending</span><span className="font-black text-red-600">{CURRENCY}{fmt(viewItem.pendingAmount||0)}</span></div>
              </div>
            </SectionBox>
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
  const [saving, setSaving] = useState(false);

  const updateCalc = (updates) => {
    const nf = {...f,...updates};
    const total = calcTotal(nf);
    const pending = Math.max(0, total-(+(nf.advancePaid||0)));
    setF({...nf, baseWorkCost:String(+(nf.workSize||0)*(+(nf.ratePerUnit||0))), totalCost:String(total), pendingAmount:String(pending)});
  };

  const addEW = () => {
    if (!ewForm.name||!ewForm.rate) return;
    const total = +(ewForm.qty||1)*(+(ewForm.rate)||0);
    const updated = [...(f.extraWork||[]), {...ewForm,total}];
    const totalCost = calcTotal({...f,extraWork:updated});
    const pending = Math.max(0, totalCost-(+(f.advancePaid||0)));
    setF(p=>({...p, extraWork:updated, totalCost:String(totalCost), pendingAmount:String(pending)}));
    setEwForm({name:"",qty:"1",rate:""});
  };

  const removeEW = (i) => {
    const updated = f.extraWork.filter((_,j)=>j!==i);
    const totalCost = calcTotal({...f,extraWork:updated});
    const pending = Math.max(0, totalCost-(+(f.advancePaid||0)));
    setF(p=>({...p, extraWork:updated, totalCost:String(totalCost), pendingAmount:String(pending)}));
  };

  const addEM = () => {
    if (!emForm.name||!emForm.qty) return;
    const total = +(emForm.qty||0)*(+(emForm.rate)||0);
    const updated = [...(f.extraMaterials||[]), {...emForm,total}];
    const totalCost = calcTotal({...f,extraMaterials:updated});
    const pending = Math.max(0, totalCost-(+(f.advancePaid||0)));
    setF(p=>({...p, extraMaterials:updated, totalCost:String(totalCost), pendingAmount:String(pending)}));
    setEmForm({name:"",qty:"",unit:"nos",rate:""});
  };

  const removeEM = (i) => {
    const updated = f.extraMaterials.filter((_,j)=>j!==i);
    const totalCost = calcTotal({...f,extraMaterials:updated});
    const pending = Math.max(0, totalCost-(+(f.advancePaid||0)));
    setF(p=>({...p, extraMaterials:updated, totalCost:String(totalCost), pendingAmount:String(pending)}));
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
            {workers.map(w=>(
              <button key={w._id} type="button" onClick={()=>{
                const sel=f.selectedWorkers||[];
                setF({...f,selectedWorkers:sel.includes(w.name)?sel.filter(x=>x!==w.name):[...sel,w.name]});
              }} className={`px-2 py-1 rounded-lg text-xs font-bold border transition-colors ${(f.selectedWorkers||[]).includes(w.name)?"bg-teal-500 text-white border-teal-500":"bg-white text-gray-600 border-gray-200"}`}>
                {w.name}
              </button>
            ))}
            {workers.length===0&&<div className="text-xs text-gray-400">No workers — add from Workers menu first</div>}
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
            <Input label="Advance Paid" type="number" value={f.advancePaid||""} onChange={e=>updateCalc({advancePaid:e.target.value})} placeholder="0" />
            <div className="bg-red-50 rounded-xl p-2 border border-red-200 text-center">
              <div className="text-xs text-gray-400">Pending</div>
              <div className="font-black text-red-600">{CURRENCY}{fmt(+(f.pendingAmount||0))}</div>
            </div>
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
        {(user.role==="supervisor"||user.role==="admin")&&<button onClick={()=>{setForm(emptyForm);setModal(true);}} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ Add</button>}
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
                  {(user.role==="supervisor"||user.role==="admin")&&<button onClick={()=>setEditModal({...r})} className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1.5 rounded-lg text-xs font-bold">✏️</button>}
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
            <div className="flex justify-between items-center"><div className="text-xs text-gray-400">By: {viewModal.addedBy}</div><button onClick={()=>downloadReport(viewModal)} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold">⬇️ Download</button></div>
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
                    {!viewModal.signatures?.[role]&&(user.role===role||user.role==="admin")&&<button onClick={()=>signReport(viewModal._id,role)} className="mt-1 bg-green-500 text-white px-2 py-0.5 rounded-lg text-xs font-bold w-full">Sign</button>}
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
    workerEntries:[], // [{workerName, attendance, workDone, salary, paymentGiven, pending, remarks}]
    payments:[], // [{type, workerName, siteName, date, mode, amount, pending, remarks, materialName, supplierName, equipmentName, receivedFrom}]
  };
  const [form, setForm] = useState(emptyForm);
  const [workerEntry, setWorkerEntry] = useState({workerName:"",attendance:"present",workDone:"",salary:"",paymentGiven:"",pending:"",remarks:""});
  const [payForm, setPayForm] = useState({type:"Worker Payment",workerName:"",siteName:"",date:today(),mode:"Cash",amount:"",pending:"",remarks:"",materialName:"",supplierName:"",equipmentName:"",receivedFrom:""});

  useEffect(()=>{
    Promise.all([api("GET","/sitework"),api("GET","/workers"),api("GET","/dailyreport")]).then(([sw,w,dr])=>{
      setSiteWorks(Array.isArray(sw)?sw:[]);
      setWorkers(Array.isArray(w)?w:[]);
      setReports(Array.isArray(dr)?dr:[]);
      setLoading(false);
    });
  },[]);

  const mySites = siteWorks.filter(s=>user.role==="admin"||s.addedBy===user.name);
  const planned = mySites.filter(s=>s.status==="pending");
  const running = mySites.filter(s=>s.status==="running");
  const completed = mySites.filter(s=>s.status==="completed");
  const getSiteReports = (site) => reports.filter(r=>r.siteName===site.customerName||r.siteId===site._id).sort((a,b)=>b.date.localeCompare(a.date));

  const addWorkerEntry = () => {
    if (!workerEntry.workerName) return;
    const pending = Math.max(0, +(workerEntry.salary||0) - +(workerEntry.paymentGiven||0));
    setForm(f=>({...f, workerEntries:[...(f.workerEntries||[]),{...workerEntry,pending:String(pending)}]}));
    setWorkerEntry({workerName:"",attendance:"present",workDone:"",salary:"",paymentGiven:"",pending:"",remarks:""});
  };

  const addPayment = () => {
    if (!payForm.amount) return;
    setForm(f=>({...f, payments:[...(f.payments||[]),{...payForm,amount:+payForm.amount,pending:+payForm.pending||0,siteName:payForm.siteName||f.siteName}]}));
    setPayForm({type:"Worker Payment",workerName:"",siteName:"",date:today(),mode:"Cash",amount:"",pending:"",remarks:"",materialName:"",supplierName:"",equipmentName:"",receivedFrom:""});
  };

  const save = async () => {
    if (!form.siteName||!form.date) return;

    // 1. Save worker entry payments to workerpayments
    for (const we of (form.workerEntries||[])) {
      if (+we.paymentGiven>0) {
        await api("POST","/workerpayments",{workerName:we.workerName,amount:+we.paymentGiven,date:form.date,note:`Site: ${form.siteName}`,addedBy:user.name,siteName:form.siteName});
      }
    }
    // 2. Save worker payments from payments section
    for (const p of (form.payments||[])) {
      if (p.type==="Worker Payment"&&p.workerName) {
        await api("POST","/workerpayments",{workerName:p.workerName,amount:+p.amount,date:form.date,note:`Site: ${form.siteName} | ${p.remarks||""}`,addedBy:user.name,siteName:form.siteName});
      }
    }
    const totalPayments = (form.payments||[]).reduce((a,p)=>a+(+(p.amount)||0),0);

    // 3. Calculate site payment received & AUTO-UPDATE sitework
    const sitePayments = (form.payments||[]).filter(p=>p.type==="Site Payment Received");
    const totalReceived = sitePayments.reduce((a,p)=>a+(+(p.amount)||0),0);
    if (totalReceived > 0 && form.siteId) {
      const site = siteWorks.find(s=>s._id===form.siteId);
      if (site) {
        const newAdvance = +(site.advancePaid||0) + totalReceived;
        const siteCost = +(site.totalCost||site.totalAmount||0);
        const newPending = Math.max(0, siteCost - newAdvance);
        const newStatus = newPending===0?"paid":newAdvance>0?"partial":"pending";
        await api("PUT",`/sitework/${form.siteId}`,{advancePaid:String(newAdvance),pendingAmount:String(newPending),paymentStatus:newStatus});
        setSiteWorks(p=>p.map(s=>s._id===form.siteId?{...s,advancePaid:String(newAdvance),pendingAmount:String(newPending),paymentStatus:newStatus}:s));
      }
    }
    const item = await api("POST","/dailyreport",{...form,totalPayments,totalReceived,addedBy:user.name});
    if(item._id){ setReports(p=>[item,...p]); setAddModal(false); setForm(emptyForm); setSiteSearch(""); }
  };;

  const openAdd = (site) => {
    setForm({...emptyForm,siteName:site.customerName,siteId:site._id,interlockType:site.interlockType||"",siteStatus:site.status||"running"});
    setSiteSearch(site.customerName);
    setAddModal(true);
  };

  if (loading) return <Loader />;

  if (selectedSite) {
    const sr = getSiteReports(selectedSite);
    const dateReport = selectedDate?sr.find(r=>r.date===selectedDate):null;
    const totalComp = sr.reduce((a,r)=>a+(+(r.completedToday||0)),0);
    const totalPaid = sr.reduce((a,r)=>a+(+(r.totalPayments||0)),0);
    const totalReceived = sr.reduce((a,r)=>a+(+(r.totalReceived||0)),0);
    const allPayments = sr.flatMap(r=>(r.payments||[]).map(p=>({...p,date:r.date})));
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
            <option value="">All Dates ({sr.length} reports)</option>
            {sr.map(r=><option key={r._id} value={r.date}>{r.date} — {r.completedToday||0} sqft, {CURRENCY}{fmt(r.totalPayments||0)} paid</option>)}
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
            {(dateReport.payments||[]).length>0&&(
              <SectionBox title="Payments" icon="💰" color="green">
                {dateReport.payments.map((p,i)=>(
                  <div key={i} className="flex justify-between text-xs bg-white rounded-lg px-3 py-2 mb-1 border border-green-100">
                    <div><span className="font-bold">{p.type}</span>{p.workerName?` → ${p.workerName}`:""}{p.receivedFrom?` from ${p.receivedFrom}`:""}<div className="text-gray-400">{p.mode}{p.remarks?` · ${p.remarks}`:""}</div></div>
                    <span className={`font-black ${p.type==="Site Payment Received"?"text-blue-700":"text-green-700"}`}>{CURRENCY}{fmt(p.amount)}</span>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                  <div className="bg-blue-50 rounded-lg p-1.5 text-center"><div className="font-black text-blue-700">{CURRENCY}{fmt((dateReport.payments||[]).filter(p=>p.type==="Site Payment Received").reduce((a,p)=>a+(+(p.amount)||0),0))}</div><div className="text-gray-400">Received</div></div>
                  <div className="bg-green-50 rounded-lg p-1.5 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt((dateReport.payments||[]).filter(p=>p.type!=="Site Payment Received").reduce((a,p)=>a+(+(p.amount)||0),0))}</div><div className="text-gray-400">Paid Out</div></div>
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
            <div className="text-xs font-black text-gray-500 uppercase">📅 All Daily Reports</div>
            {sr.length===0&&<EmptyState icon="📋" text="No reports yet" />}
            {sr.map(r=>(
              <div key={r._id} onClick={()=>setViewModal(r)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 cursor-pointer hover:border-amber-300 transition-all">
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
          return (<div key={s._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"><div className="flex items-start justify-between"><div className="flex-1 cursor-pointer" onClick={()=>setSelectedSite(s)}><div className="font-black">{s.customerName}</div><div className="text-xs text-gray-400">📍 {s.siteLocation||"—"} · {comp}/{s.workSize||"?"} sqft</div></div><button onClick={()=>openAdd(s)} className="bg-amber-500 text-white px-2 py-1.5 rounded-lg text-xs font-bold shrink-0 ml-2">+ Entry</button></div></div>);
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
                if(found) setForm(f=>({...f,siteName:found.customerName,siteId:found._id,interlockType:found.interlockType||f.interlockType,siteStatus:found.status||"running"}));
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
                  <input list="worker-list" value={workerEntry.workerName} onChange={e=>setWorkerEntry({...workerEntry,workerName:e.target.value})} placeholder="Select or type worker name..." className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50" />
                  <datalist id="worker-list">{workers.map(w=><option key={w._id} value={w.name}/>)}</datalist>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select label="Attendance" value={workerEntry.attendance} options={["present","absent","half-day"]} onChange={e=>setWorkerEntry({...workerEntry,attendance:e.target.value})} />
                  <Input label="Work Done" value={workerEntry.workDone} onChange={e=>setWorkerEntry({...workerEntry,workDone:e.target.value})} placeholder="e.g. 50 sqft" />
                  <Input label={`Salary/Wage (${CURRENCY})`} type="number" value={workerEntry.salary} onChange={e=>{
                    const pending = Math.max(0,+(e.target.value||0)-(+(workerEntry.paymentGiven||0)));
                    setWorkerEntry({...workerEntry,salary:e.target.value,pending:String(pending)});
                  }} placeholder="0" />
                  <Input label={`Payment Given (${CURRENCY})`} type="number" value={workerEntry.paymentGiven} onChange={e=>{
                    const pending = Math.max(0,+(workerEntry.salary||0)-(+(e.target.value||0)));
                    setWorkerEntry({...workerEntry,paymentGiven:e.target.value,pending:String(pending)});
                  }} placeholder="0" />
                </div>
                {+(workerEntry.salary||0)>0&&<div className="bg-white rounded-xl p-2 border border-teal-200 flex justify-between text-xs"><span>Pending Salary</span><span className="font-black text-red-600">{CURRENCY}{fmt(Math.max(0,+(workerEntry.salary||0)-(+(workerEntry.paymentGiven||0))))}</span></div>}
                <Input label="Remarks" value={workerEntry.remarks} onChange={e=>setWorkerEntry({...workerEntry,remarks:e.target.value})} placeholder="Optional" />
                <button onClick={addWorkerEntry} className="w-full bg-teal-500 text-white py-2 rounded-xl text-xs font-bold hover:bg-teal-600">+ Add Worker Entry</button>
              </div>
              {(form.workerEntries||[]).map((w,i)=>(
                <div key={i} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-teal-200 text-xs mt-1">
                  <div><span className="font-bold">{w.workerName}</span> · <Badge color={w.attendance==="present"?"green":"red"}>{w.attendance}</Badge>{w.workDone?` · ${w.workDone}`:""}</div>
                  <div className="flex items-center gap-1">
                    {w.paymentGiven&&<span className="text-green-700 font-bold">{CURRENCY}{fmt(w.paymentGiven)}</span>}
                    {+w.pending>0&&<span className="text-red-500">(P:{CURRENCY}{fmt(w.pending)})</span>}
                    <button onClick={()=>setForm(f=>({...f,workerEntries:f.workerEntries.filter((_,j)=>j!==i)}))} className="text-red-400 font-black ml-1">×</button>
                  </div>
                </div>
              ))}
            </SectionBox>

            <SectionBox title="Payments & Expenses" icon="💰" color="green">
              <Select label="Payment Type" value={payForm.type} options={["Worker Payment","Material Payment","Equipment Payment","Site Payment Received","Other Expense"]} onChange={e=>setPayForm({...payForm,type:e.target.value,workerName:"",materialName:"",supplierName:"",equipmentName:"",receivedFrom:""})} />
              
              {payForm.type==="Worker Payment"&&(
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Worker Name</label>
                  <input list="pay-worker-list" value={payForm.workerName} onChange={e=>setPayForm({...payForm,workerName:e.target.value})} placeholder="Select worker..." className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50" />
                  <datalist id="pay-worker-list">{workers.map(w=><option key={w._id} value={w.name}/>)}</datalist>
                </div>
              )}
              {payForm.type==="Material Payment"&&(
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Material Name" value={payForm.materialName||""} onChange={e=>setPayForm({...payForm,materialName:e.target.value})} placeholder="Material" />
                  <Input label="Supplier" value={payForm.supplierName||""} onChange={e=>setPayForm({...payForm,supplierName:e.target.value})} placeholder="Supplier" />
                </div>
              )}
              {payForm.type==="Equipment Payment"&&(
                <Input label="Equipment Name" value={payForm.equipmentName||""} onChange={e=>setPayForm({...payForm,equipmentName:e.target.value})} placeholder="Equipment" />
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
              {(form.payments||[]).map((p,i)=>(
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
                  <div className="bg-green-50 rounded-lg p-1.5 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt((form.payments||[]).filter(p=>p.type!=="Site Payment Received").reduce((a,p)=>a+(+(p.amount)||0),0))}</div><div className="text-gray-400">Paid Out</div></div>
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

            <button onClick={save} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600">Submit Daily Report</button>
          </div>
        </Modal>
      )}
      {viewModal&&(
        <Modal title={`${viewModal.siteName} — ${viewModal.date}`} onClose={()=>setViewModal(null)}>
          <div className="space-y-3">
            <div className="text-xs text-gray-400">By: {viewModal.addedBy}</div>
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
            {(viewModal.payments||[]).length>0&&(
              <SectionBox title="Payments" icon="💰" color="green">
                {viewModal.payments.map((p,i)=>(
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
    const allPayments = allReports.flatMap(r=>(r.payments||[]).map(p=>({...p,date:r.date})));
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
                {(dateReport.payments||[]).length>0&&(
                  <SectionBox title="Payments" icon="💰" color="green">
                    {dateReport.payments.map((p,i)=>(
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
            {["Site Payment Received","Worker Payment","Material Payment","Equipment Payment","Other Expense"].map(type=>{
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
                  <div className="bg-teal-50 rounded-lg p-1.5 text-center"><div className="font-black text-teal-700">{comp}/{s.workSize||"?"} sqft</div><div className="text-gray-400">Progress</div></div>
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
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("sites"); // sites | workers | financial
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [searchSite, setSearchSite] = useState("");
  const [searchWorker, setSearchWorker] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(()=>{
    Promise.all([api("GET","/dailyreport"),api("GET","/workers"),api("GET","/sitework")]).then(([dr,w,sw])=>{
      setDailyReports(Array.isArray(dr)?dr:[]);
      setWorkers(Array.isArray(w)?w:[]);
      setAllSiteWorks(Array.isArray(sw)?sw:[]);
      setLoading(false);
    });
  },[]);

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
    const allPayments = sr.flatMap(r=>(r.payments||[]).map(p=>({...p,date:r.date})));
    const allWorkers = sr.flatMap(r=>(r.workerEntries||[]).map(w=>({...w,date:r.date})));
    const totalComp = sr.reduce((a,r)=>a+(+(r.completedToday||0)),0);
    const totalReceived = sr.reduce((a,r)=>a+(+(r.totalReceived||0)),0);
    const totalPaidOut = sr.reduce((a,r)=>a+(+(r.totalPayments||0)),0);
    const byMonth = sr.reduce((acc,r)=>{
      const m=r.date?.slice(0,7)||"?";
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
      const m=e.date?.slice(0,7)||"?";
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
      <div className="flex gap-1">
        {[{id:"sites",label:"🏗️ Sites"},{id:"workers",label:"👷 Workers"},{id:"financial",label:"💰 Financial"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className={`flex-1 py-2 rounded-xl text-xs font-bold ${tab===t.id?"bg-amber-500 text-white":"bg-white border border-gray-200 text-gray-600"}`}>{t.label}</button>
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
  const emptyForm = { name:"", phone:"", address:"", role:"Labourer", workerCategory:"Site", workLocationType:"Outside Site", paymentType:"Per Day", customPaymentType:"", rateAmount:"" };
  const [workerForm, setWorkerForm] = useState(emptyForm);
  const canEdit = user.role==="admin"||user.role==="user";

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
    const w = await api("POST","/workers",{...workerForm,rateAmount:+workerForm.rateAmount||0,addedBy:user.name});
    if (w._id) { setWorkers(p=>[...p,w]); setAddModal(false); setWorkerForm(emptyForm); }
  };

  const saveEdit = async () => {
    await api("PUT",`/workers/${editModal._id}`,editModal);
    setWorkers(p=>p.map(x=>x._id===editModal._id?{...x,...editModal}:x));
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
              <div><div className="font-black text-gray-900">{w.name}</div><div className="text-xs text-gray-400">{w.role}{w.phone?` · 📞 ${w.phone}`:""}</div><div className="text-xs text-amber-600 font-semibold">{CURRENCY}{fmt(w.rateAmount||0)} / {w.paymentType||"day"}</div></div>
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
  const canEdit = user.role==="admin"||user.role==="user";

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
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const emptyForm = { date:today(), supplierName:"", supplierPhone:"", supplierAddress:"", itemName:"", itemType:"Material", quantity:"", unit:"nos", unitPrice:"", totalAmount:"", paymentMode:"Cash", vehicleNumber:"", vehicleType:"", driverName:"", driverPhone:"", deliveryAddress:"", note:"" };
  const [form, setForm] = useState(emptyForm);

  useEffect(()=>{ api("GET","/purchases").then(d=>{ setPurchases(Array.isArray(d)?d:[]); setLoading(false); }); },[]);

  const save = async () => {
    if (!form.supplierName||!form.itemName) return;
    const total = +form.quantity*(+form.unitPrice)||+form.totalAmount||0;
    const item = await api("POST","/purchases",{...form,totalAmount:total,addedBy:user.name});
    if (item._id) { setPurchases(p=>[item,...p]); setModal(false); setForm(emptyForm); }
  };

  if (loading) return <Loader />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">🛒 Purchases</h2>
        {(user.role==="admin"||user.role==="user")&&<button onClick={()=>{setForm(emptyForm);setModal(true);}} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ Add</button>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white border rounded-xl p-2 text-center"><div className="font-black">{purchases.length}</div><div className="text-xs text-gray-400">Total</div></div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-2 text-center"><div className="font-black text-red-700">{CURRENCY}{fmt(purchases.reduce((a,p)=>a+(+(p.totalAmount)||0),0))}</div><div className="text-xs text-gray-400">Spent</div></div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-2 text-center"><div className="font-black text-blue-700">{new Set(purchases.map(p=>p.supplierName).filter(Boolean)).size}</div><div className="text-xs text-gray-400">Suppliers</div></div>
      </div>
      <div className="space-y-3">
        {purchases.length===0&&<EmptyState icon="🛒" text="No purchases yet" />}
        {purchases.map(p=>(
          <div key={p._id} onClick={()=>setViewModal(p)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:border-amber-300 transition-all">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1"><div className="flex items-center gap-2"><span className="font-black text-gray-900">{p.itemName}</span><Badge color="teal">{p.itemType}</Badge></div><div className="text-xs text-gray-400">🏪 {p.supplierName} · 📅 {p.date}</div></div>
              <div className="text-right"><div className="font-black text-red-600">{CURRENCY}{fmt(+(p.totalAmount)||0)}</div><div className="text-xs text-gray-400">{p.quantity} {p.unit}</div></div>
            </div>
          </div>
        ))}
      </div>
      {modal&&<Modal title="Add Purchase" onClose={()=>setModal(false)} wide>
        <div className="space-y-3">
          <Input label="Date" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} />
          <SectionBox title="Supplier" icon="🏪" color="blue">
            <Input label="Supplier Name *" value={form.supplierName} onChange={e=>setForm({...form,supplierName:e.target.value})} />
            <div className="grid grid-cols-2 gap-2"><Input label="Phone" type="tel" value={form.supplierPhone} onChange={e=>setForm({...form,supplierPhone:e.target.value})} /><Input label="Address" value={form.supplierAddress} onChange={e=>setForm({...form,supplierAddress:e.target.value})} /></div>
          </SectionBox>
          <SectionBox title="Item" icon="📦" color="amber">
            <Input label="Item Name *" value={form.itemName} onChange={e=>setForm({...form,itemName:e.target.value})} />
            <Select label="Type" value={form.itemType} options={["Material","Equipment","Spare Part","Fuel","Other"]} onChange={e=>setForm({...form,itemType:e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Qty" type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value,totalAmount:String(+e.target.value*(+(form.unitPrice)||0))})} />
              <Select label="Unit" value={form.unit} options={["nos","kg","ton","litre","bag","m","sqft","sqm","load"]} onChange={e=>setForm({...form,unit:e.target.value})} />
              <Input label={`Unit Price(${CURRENCY})`} type="number" value={form.unitPrice} onChange={e=>setForm({...form,unitPrice:e.target.value,totalAmount:String(+e.target.value*(+(form.quantity)||0))})} />
              <Input label={`Total(${CURRENCY})`} type="number" value={form.totalAmount} onChange={e=>setForm({...form,totalAmount:e.target.value})} />
            </div>
          </SectionBox>
          <Select label="Payment Mode" value={form.paymentMode} options={["Cash","Bank","GPay","UPI","Credit"]} onChange={e=>setForm({...form,paymentMode:e.target.value})} />
          <Textarea label="Note" value={form.note} onChange={e=>setForm({...form,note:e.target.value})} />
          <button onClick={save} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold">Submit</button>
        </div>
      </Modal>}
      {viewModal&&<Modal title="Purchase Details" onClose={()=>setViewModal(null)}>
        <div className="space-y-3">
          <div className="text-xs text-gray-400">By: {viewModal.addedBy} · {viewModal.date}</div>
          <SectionBox title="Supplier" icon="🏪" color="blue"><div className="grid grid-cols-2 gap-2 text-sm"><div><div className="text-xs text-gray-400">Name</div><div className="font-bold">{viewModal.supplierName}</div></div><div><div className="text-xs text-gray-400">Phone</div><div className="font-bold">{viewModal.supplierPhone||"—"}</div></div></div></SectionBox>
          <SectionBox title="Item" icon="📦" color="amber"><div className="grid grid-cols-2 gap-2 text-sm"><div><div className="text-xs text-gray-400">Item</div><div className="font-bold">{viewModal.itemName}</div></div><div><div className="text-xs text-gray-400">Qty</div><div className="font-bold">{viewModal.quantity} {viewModal.unit}</div></div></div><div className="bg-red-50 rounded-xl p-2 text-center mt-2"><div className="text-lg font-black text-red-700">{CURRENCY}{fmt(+(viewModal.totalAmount)||0)}</div><div className="text-xs text-gray-400">Total</div></div></SectionBox>
        </div>
      </Modal>}
    </div>
  );
}

// ─── PRODUCTION SITE ──────────────────────────────────────────────────────────
function ProductionSite({ user }) {
  const [entries, setEntries] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const emptyForm = { date:today(), workType:"", notes:"", attendance:[] };
  const [form, setForm] = useState(emptyForm);

  useEffect(()=>{
    Promise.all([api("GET","/productionsite"),api("GET","/workers")]).then(([e,w])=>{
      setEntries(Array.isArray(e)?e:[]);
      setWorkers(Array.isArray(w)?w:[]);
      setLoading(false);
    });
  },[]);

  const initAttendance = () => {
    setForm({...emptyForm,date:today(),attendance:workers.map(w=>({workerId:w._id,workerName:w.name,status:"present",workDone:"",workUnit:w.paymentType||"day",rate:w.rateAmount||0,total:0}))});
    setModal(true);
  };

  const updateAtt = (i,field,val) => {
    const att=[...form.attendance]; att[i]={...att[i],[field]:val};
    if(field==="workDone"||field==="rate") att[i].total=+(att[i].workDone||0)*(+(att[i].rate||0));
    setForm({...form,attendance:att});
  };

  const save = async () => {
    const totalCost=form.attendance.reduce((a,x)=>a+(+(x.total)||0),0);
    const item=await api("POST","/productionsite",{...form,totalCost,addedBy:user.name});
    if(item._id){setEntries(p=>[item,...p]);setModal(false);}
  };

  if (loading) return <Loader />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">🏭 Production Site</h2>
        <button onClick={initAttendance} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ Daily Entry</button>
      </div>
      <div className="space-y-3">
        {entries.length===0&&<EmptyState icon="🏭" text="No entries yet" />}
        {entries.map(e=><div key={e._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"><div className="flex items-center justify-between"><div><div className="font-black">📅 {e.date}</div><div className="text-xs text-gray-400">By: {e.addedBy} · {(e.attendance||[]).filter(a=>a.status==="present").length} present</div></div><div className="font-black text-green-700">{CURRENCY}{fmt(e.totalCost||0)}</div></div></div>)}
      </div>
      {modal&&<Modal title="Daily Production Entry" onClose={()=>setModal(false)} wide>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2"><Input label="Date" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /><Input label="Work Type" value={form.workType||""} onChange={e=>setForm({...form,workType:e.target.value})} /></div>
          {form.attendance.map((a,i)=><div key={i} className={`rounded-2xl border p-3 space-y-2 ${a.status==="present"?"border-green-200 bg-green-50":"border-red-100 bg-red-50"}`}>
            <div className="flex items-center justify-between"><div className="font-bold text-sm">{a.workerName}</div>
              <div className="flex gap-1">{["present","absent"].map(s=><button key={s} type="button" onClick={()=>updateAtt(i,"status",s)} className={`px-2 py-1 rounded-lg text-xs font-bold border ${a.status===s?(s==="present"?"bg-green-500 text-white border-green-500":"bg-red-500 text-white border-red-500"):"bg-white text-gray-500 border-gray-200"}`}>{s}</button>)}</div>
            </div>
            {a.status==="present"&&<div className="grid grid-cols-3 gap-2"><Input label="Work Done" type="number" value={a.workDone||""} onChange={e=>updateAtt(i,"workDone",e.target.value)} placeholder="0" /><Input label="Unit" value={a.workUnit||""} onChange={e=>updateAtt(i,"workUnit",e.target.value)} /><Input label={`Rate(${CURRENCY})`} type="number" value={a.rate||""} onChange={e=>updateAtt(i,"rate",e.target.value)} /></div>}
          </div>)}
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center"><div className="text-xs text-gray-400">Total Cost</div><div className="text-2xl font-black text-green-700">{CURRENCY}{fmt(form.attendance.reduce((a,x)=>a+(+(x.workDone||0)*(+(x.rate||0))),0))}</div></div>
          <button onClick={save} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold">Submit</button>
        </div>
      </Modal>}
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
  const emptyForm = { date:today(), siteName:"", task:"", workers:"", materials:"", note:"", status:"planned" };
  const [form, setForm] = useState(emptyForm);

  useEffect(()=>{ api("GET","/workplan").then(d=>{ setPlans(Array.isArray(d)?d:[]); setLoading(false); }); },[]);

  const save = async () => {
    if (!form.siteName) return;
    const item = await api("POST","/workplan",{...form,addedBy:user.name});
    if (item._id) { setPlans(p=>[item,...p]); setModal(false); setForm(emptyForm); }
  };

  const updateStatus = async (id, status) => { await api("PUT",`/workplan/${id}`,{status}); setPlans(p=>p.map(x=>x._id===id?{...x,status}:x)); };

  if (loading) return <Loader />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">📅 Work Planning</h2>
        <button onClick={()=>setModal(true)} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ Plan</button>
      </div>
      <div className="space-y-3">
        {plans.length===0&&<EmptyState icon="📅" text="No plans yet" />}
        {plans.map(p=>(
          <div key={p._id} className="bg-white rounded-2xl border shadow-sm p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1"><div className="font-black">{p.siteName}</div><div className="text-xs text-gray-400">📅 {p.date}{p.task?` · ${p.task}`:""}</div></div>
              <Badge color={p.status==="done"?"green":p.status==="planned"?"blue":"amber"}>{p.status}</Badge>
            </div>
            <div className="mt-2 flex gap-1">{["planned","in-progress","done"].map(s=><button key={s} onClick={()=>updateStatus(p._id,s)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${p.status===s?"bg-amber-500 text-white border-amber-500":"bg-gray-50 text-gray-500 border-gray-200"}`}>{s}</button>)}</div>
          </div>
        ))}
      </div>
      {modal&&<Modal title="Add Work Plan" onClose={()=>setModal(false)}>
        <div className="space-y-3">
          <Input label="Date" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} />
          <Input label="Site Name *" value={form.siteName} onChange={e=>setForm({...form,siteName:e.target.value})} placeholder="Site / project" />
          <Textarea label="Tasks" value={form.task} onChange={e=>setForm({...form,task:e.target.value})} />
          <Input label="Workers" value={form.workers} onChange={e=>setForm({...form,workers:e.target.value})} />
          <Input label="Materials" value={form.materials} onChange={e=>setForm({...form,materials:e.target.value})} />
          <button onClick={save} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold">Add Plan</button>
        </div>
      </Modal>}
    </div>
  );
}

// ─── STOCK ────────────────────────────────────────────────────────────────────
function Stock({ stock, setStock, user }) {
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const emptyForm = { name:"", quantity:0, unit:"nos", minStock:0, price:0 };
  const [form, setForm] = useState(emptyForm);

  const save = async () => {
    if (editItem) { await api("PUT",`/stock/${editItem._id}`,form); setStock(p=>p.map(x=>x._id===editItem._id?{...x,...form}:x)); setEditItem(null); }
    else { const item=await api("POST","/stock",form); if(item._id) setStock(p=>[...p,item]); }
    setModal(false); setForm(emptyForm);
  };

  const del = async (id) => { if(!window.confirm("Delete?")) return; await api("DELETE",`/stock/${id}`); setStock(p=>p.filter(x=>x._id!==id)); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">📦 Stock</h2>
        {user.role==="admin"&&<button onClick={()=>{setForm(emptyForm);setEditItem(null);setModal(true);}} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ Add</button>}
      </div>
      <div className="space-y-2">
        {stock.length===0&&<EmptyState icon="📦" text="No stock items" />}
        {stock.map(s=>(
          <div key={s._id} className="bg-white rounded-2xl border shadow-sm p-4 flex items-center justify-between">
            <div><div className="font-black">{s.name}</div><div className="text-sm text-gray-600">{s.quantity} {s.unit}</div>{s.price>0&&<div className="text-xs text-amber-600">{CURRENCY}{fmt(s.price)}/unit</div>}</div>
            {user.role==="admin"&&<div className="flex gap-1"><button onClick={()=>{setForm({...s});setEditItem(s);setModal(true);}} className="bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-lg text-xs font-bold">✏️</button><button onClick={()=>del(s._id)} className="bg-red-50 text-red-600 px-2.5 py-1.5 rounded-lg text-xs font-bold">🗑️</button></div>}
          </div>
        ))}
      </div>
      {modal&&<Modal title={editItem?"Edit":"Add Stock"} onClose={()=>{setModal(false);setEditItem(null);}}>
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Qty" type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:+e.target.value})} />
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
        {user.role==="admin"&&<button onClick={()=>{setForm(emptyForm);setEditItem(null);setModal(true);}} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ Add</button>}
      </div>
      <div className="space-y-2">
        {raw.length===0&&<EmptyState icon="🧱" text="No raw materials" />}
        {raw.map(r=>(
          <div key={r._id} className="bg-white rounded-2xl border shadow-sm p-4 flex items-center justify-between">
            <div><div className="font-black">{r.name||r.material}</div><div className="text-sm text-gray-600">{r.quantity||r.qty} {r.unit}</div>{r.supplier&&<div className="text-xs text-gray-400">Supplier: {r.supplier}</div>}</div>
            {user.role==="admin"&&<div className="flex gap-1"><button onClick={()=>{setForm({...r});setEditItem(r);setModal(true);}} className="bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-lg text-xs font-bold">✏️</button><button onClick={()=>del(r._id)} className="bg-red-50 text-red-600 px-2.5 py-1.5 rounded-lg text-xs font-bold">🗑️</button></div>}
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
    const item=await api("POST","/production",{...form,target:+form.target,produced:+form.produced,supervisor:user.name,status:user.role==="admin"?"approved":"pending",product:form.product||stock[0]?.name||"Standard Interlock"});
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

// ─── SALES ────────────────────────────────────────────────────────────────────
function Sales({ sales, setSales, stock, user }) {
  const [modal, setModal] = useState(false);
  const emptyForm = { date:today(), product:"", quantity:0, price:0, total:0, customer:"", paymentMode:"Cash" };
  const [form, setForm] = useState(emptyForm);

  const save = async () => {
    const total=+form.quantity*(+form.price);
    const item=await api("POST","/sales",{...form,total,quantity:+form.quantity,price:+form.price,addedBy:user.name});
    if(item._id){setSales(p=>[item,...p]);setModal(false);setForm(emptyForm);}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">💰 Sales</h2>
        <button onClick={()=>setModal(true)} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ Sale</button>
      </div>
      <StatCard label="Total Sales" value={`${CURRENCY}${fmt(sales.reduce((a,s)=>a+(+(s.total)||0),0))}`} icon="💰" color="green" />
      <div className="space-y-2">
        {sales.length===0&&<EmptyState icon="💰" text="No sales yet" />}
        {sales.map(s=><div key={s._id} className="bg-white rounded-2xl border shadow-sm p-4 flex items-center justify-between"><div><div className="font-black">{s.product}</div><div className="text-xs text-gray-400">📅 {s.date}{s.customer?` · 👤 ${s.customer}`:""}</div><div className="text-sm text-gray-600">{s.quantity} × {CURRENCY}{s.price}</div></div><div className="text-right"><div className="font-black text-green-700">{CURRENCY}{fmt(+(s.total)||0)}</div><Badge color={s.paymentMode==="Cash"?"green":"blue"}>{s.paymentMode}</Badge></div></div>)}
      </div>
      {modal&&<Modal title="Record Sale" onClose={()=>setModal(false)}>
        <div className="space-y-3">
          <Input label="Date" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} />
          <Select label="Product" value={form.product} options={["",...stock.map(s=>s.name)]} onChange={e=>setForm({...form,product:e.target.value})} />
          <Input label="Customer" value={form.customer} onChange={e=>setForm({...form,customer:e.target.value})} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Qty" type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:+e.target.value,total:+e.target.value*(+form.price)})} />
            <Input label={`Price(${CURRENCY})`} type="number" value={form.price} onChange={e=>setForm({...form,price:+e.target.value,total:+form.quantity*(+e.target.value)})} />
          </div>
          <Select label="Payment" value={form.paymentMode} options={["Cash","Bank","GPay","Credit"]} onChange={e=>setForm({...form,paymentMode:e.target.value})} />
          <button onClick={save} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-bold">Record Sale</button>
        </div>
      </Modal>}
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
    const allPayments = dailyReports.filter(r=>r.siteName===selectedSite.customerName||r.siteId===selectedSite._id).flatMap(r=>(r.payments||[]).map(p=>({...p,date:r.date})));
    const clientPayments = allPayments.filter(p=>p.type==="Client Payment Received"||p.type==="Site Payment Received");
    const workerPayments = allPayments.filter(p=>p.type==="Worker Payment");
    const materialPayments = allPayments.filter(p=>p.type==="Material Payment");
    const equipmentPayments = allPayments.filter(p=>p.type==="Equipment Payment");
    const otherPayments = allPayments.filter(p=>p.type==="Other Expense");
    const totalReceived = clientPayments.reduce((a,p)=>a+(+(p.amount)||0),0);
    const totalWorkerExp = workerPayments.reduce((a,p)=>a+(+(p.amount)||0),0);
    const totalMatExp = materialPayments.reduce((a,p)=>a+(+(p.amount)||0),0);
    const totalEquipExp = equipmentPayments.reduce((a,p)=>a+(+(p.amount)||0),0);
    const totalExpenses = totalWorkerExp + totalMatExp + totalEquipExp + otherPayments.reduce((a,p)=>a+(+(p.amount)||0),0);
    const siteCost = +(selectedSite.totalCost||selectedSite.totalAmount||0);
    const dynamicPending = Math.max(0, siteCost - totalReceived);
    const totalComp = sr.reduce((a,r)=>a+(+(r.completedToday||0)),0);
    const allMats = sr.filter(r=>r.materialsUnloaded);
    const allExtra = sr.filter(r=>r.extraWorkDesc);
    const allComplaints = sr.filter(r=>r.complaints);
    const dateReport = selectedDate ? sr.find(r=>r.date===selectedDate) : null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={()=>{setSelectedSite(null);setSelectedDate(null);}} className="text-amber-600 font-bold text-sm">← Back</button>
          <Badge color={selectedSite.status==="completed"?"green":"amber"}>{selectedSite.status}</Badge>
        </div>
        <div className="bg-white rounded-2xl border shadow-sm p-4">
          <div className="font-black text-xl">{selectedSite.customerName}</div>
          <div className="text-xs text-gray-400">📍 {selectedSite.siteLocation||"—"} · By: {selectedSite.addedBy||"—"}</div>
          <div className="text-xs text-gray-400">🧱 {selectedSite.interlockType||"—"} · {selectedSite.workSize||"—"} sqft</div>
        </div>
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

        <div className="bg-white rounded-2xl border shadow-sm p-3">
          <div className="text-xs font-bold text-gray-500 mb-2">📅 View by Date</div>
          <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50" value={selectedDate||""} onChange={e=>setSelectedDate(e.target.value||null)}>
            <option value="">All Dates ({sr.length} reports)</option>
            {sr.map(r=><option key={r._id} value={r.date}>{r.date} — {r.workersCount||0} workers, {r.completedToday||0} sqft</option>)}
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
            {(dateReport.payments||[]).length>0&&(
              <SectionBox title="Payments" icon="💰" color="green">
                {dateReport.payments.map((p,i)=><div key={i} className="flex justify-between text-xs bg-white rounded-lg px-3 py-2 mb-1 border border-green-100">
                  <span><span className={`font-bold ${p.type==="Client Payment Received"?"text-green-700":"text-gray-700"}`}>{p.type}</span> → {p.paidTo||"—"} · {p.mode}</span>
                  <span className={`font-black ${p.type==="Client Payment Received"?"text-green-700":"text-red-600"}`}>{p.type==="Client Payment Received"?"+":"-"}{CURRENCY}{fmt(p.amount)}</span>
                </div>)}
              </SectionBox>
            )}
            {dateReport.complaints&&<SectionBox title="Complaints" icon="⚠️" color="red"><div className="text-sm">{dateReport.complaints}</div>{dateReport.actionTaken&&<div className="text-xs text-gray-400 mt-1">Action: {dateReport.actionTaken}</div>}</SectionBox>}
          </div>
        ):(
          <div className="space-y-3">
            <div className="text-xs font-black text-gray-500 uppercase">📊 Full Site History</div>
            {clientPayments.length>0&&<SectionBox title="Client Payments Received" icon="💚" color="green">{clientPayments.map((p,i)=><div key={i} className="text-xs flex justify-between py-1 border-b border-green-100"><span>{p.date} · {p.paidTo||"—"} · {p.mode}</span><span className="font-black text-green-700">+{CURRENCY}{fmt(p.amount)}</span></div>)}<div className="text-xs font-black text-green-700 text-right pt-1">Total: {CURRENCY}{fmt(totalReceived)}</div></SectionBox>}
            {workerPayments.length>0&&<SectionBox title="Worker Payments" icon="👷" color="amber">{workerPayments.map((p,i)=><div key={i} className="text-xs flex justify-between py-1 border-b border-amber-100"><span>{p.date} · {p.paidTo||"—"}</span><span className="font-black text-amber-700">{CURRENCY}{fmt(p.amount)}</span></div>)}</SectionBox>}
            {materialPayments.length>0&&<SectionBox title="Material Payments" icon="🧱" color="teal">{materialPayments.map((p,i)=><div key={i} className="text-xs flex justify-between py-1 border-b border-teal-100"><span>{p.date} · {p.paidTo||"—"}</span><span className="font-black text-teal-700">{CURRENCY}{fmt(p.amount)}</span></div>)}</SectionBox>}
            {allMats.length>0&&<SectionBox title="Material History" icon="📦" color="blue">{allMats.map((r,i)=><div key={i} className="text-xs flex justify-between py-1 border-b border-blue-100"><span>{r.date} · {r.materialsUnloaded} ({r.materialQty})</span><span className="text-gray-400">{r.supplierName||"—"}</span></div>)}</SectionBox>}
            {allExtra.length>0&&<SectionBox title="Extra Work" icon="➕" color="orange">{allExtra.map((r,i)=><div key={i} className="text-xs flex justify-between py-1 border-b border-orange-100"><span>{r.date} · {r.extraWorkDesc}</span><span className="font-black text-orange-700">{CURRENCY}{fmt(r.extraWorkCost||0)}</span></div>)}</SectionBox>}
            {allComplaints.length>0&&<SectionBox title="Complaints" icon="⚠️" color="red">{allComplaints.map((r,i)=><div key={i} className="text-xs py-1 border-b border-red-100"><div>{r.date} · {r.complaints}</div>{r.actionTaken&&<div className="text-gray-400">Action: {r.actionTaken}</div>}</div>)}</SectionBox>}
            <div className="text-xs font-black text-gray-500 uppercase">📅 Daily Reports ({sr.length})</div>
            {sr.length===0&&<EmptyState icon="📋" text="No reports submitted" />}
            {sr.map(r=><div key={r._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-2"><div className="flex items-center justify-between"><div><div className="font-black">📅 {r.date}</div><div className="text-xs text-gray-400">{r.workersCount||0} workers · {r.completedToday||0} sqft · By: {r.addedBy}</div></div><div className="text-right"><div className="font-black text-green-700">{CURRENCY}{fmt(r.totalPayments||0)}</div><Badge color="amber">{r.siteStatus||"running"}</Badge></div></div></div>)}
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

// ─── ADMIN WORKER REPORT ──────────────────────────────────────────────────────
function AdminWorkerReport() {
  const [workers, setWorkers] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [search, setSearch] = useState("");

  useEffect(()=>{
    Promise.all([api("GET","/workers"),api("GET","/dailyreport"),api("GET","/workerpayments")]).then(([w,dr,p])=>{
      setWorkers(Array.isArray(w)?w:[]);
      setDailyReports(Array.isArray(dr)?dr:[]);
      setPayments(Array.isArray(p)?p:[]);
      setLoading(false);
    });
  },[]);

  const getWorkerData = (wname) => {
    // Payments from daily reports
    let drPayments = dailyReports.flatMap(r=>(r.payments||[]).filter(p=>p.paidTo===wname&&p.type==="Worker Payment").map(p=>({...p,date:r.date,siteName:r.siteName})));
    // Direct payments
    let directPay = payments.filter(p=>p.workerName===wname);
    if (filterFrom) { drPayments=drPayments.filter(p=>p.date>=filterFrom); directPay=directPay.filter(p=>p.date>=filterFrom); }
    if (filterTo) { drPayments=drPayments.filter(p=>p.date<=filterTo); directPay=directPay.filter(p=>p.date<=filterTo); }
    const totalPaid = drPayments.reduce((a,p)=>a+(+(p.amount)||0),0) + directPay.reduce((a,p)=>a+(+(p.amount)||0),0);
    // Worker attendance from daily reports
    const attendance = dailyReports.flatMap(r=>(r.workers||[]).filter(w=>w.workerName===wname).map(w=>({...w,date:r.date,siteName:r.siteName})));
    return { drPayments, directPay, totalPaid, attendance };
  };

  if (loading) return <Loader />;

  if (selectedWorker) {
    const w = selectedWorker;
    const {drPayments, directPay, totalPaid, attendance} = getWorkerData(w.name);
    const allPay = [...drPayments.map(p=>({...p,source:"Daily Report"})),...directPay.map(p=>({...p,source:"Direct",paidTo:p.workerName}))].sort((a,b)=>(b.date||"").localeCompare(a.date||""));

    return (
      <div className="space-y-4">
        <button onClick={()=>setSelectedWorker(null)} className="text-amber-600 font-bold text-sm">← Back</button>
        <div className="bg-white rounded-2xl border shadow-sm p-4">
          <div className="font-black text-xl">{w.name}</div>
          <div className="text-xs text-gray-400">{w.role} · 📞 {w.phone||"—"}</div>
          <div className="text-xs text-amber-600 font-semibold">{CURRENCY}{fmt(w.rateAmount||0)} / {w.paymentType||"day"}</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input label="From Date" type="date" value={filterFrom} onChange={e=>setFilterFrom(e.target.value)} />
          <Input label="To Date" type="date" value={filterTo} onChange={e=>setFilterTo(e.target.value)} />
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <div className="text-xs text-gray-400 mb-1">Total Salary Paid</div>
          <div className="text-2xl font-black text-green-700">{CURRENCY}{fmt(totalPaid)}</div>
        </div>
        <div className="font-black text-gray-800">💸 Payment History</div>
        {allPay.length===0&&<EmptyState icon="💸" text="No payments in this period" />}
        {allPay.map((p,i)=>(
          <div key={i} className="bg-white rounded-xl border shadow-sm p-3 mb-2">
            <div className="flex justify-between items-start">
              <div><div className="font-bold text-sm">{CURRENCY}{fmt(+(p.amount)||0)}</div><div className="text-xs text-gray-400">📅 {p.date} · {p.mode||"—"}</div>{p.siteName&&<div className="text-xs text-gray-400">🏗️ {p.siteName}</div>}{p.remarks&&<div className="text-xs text-gray-400">{p.remarks}</div>}</div>
              <Badge color="green">{p.source}</Badge>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const filteredWorkers = workers.filter(w=>!search||(w.name||"").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-gray-900">👷 Worker Reports</h2>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search worker name..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" />
      <div className="grid grid-cols-2 gap-2">
        <Input label="From Date" type="date" value={filterFrom} onChange={e=>setFilterFrom(e.target.value)} />
        <Input label="To Date" type="date" value={filterTo} onChange={e=>setFilterTo(e.target.value)} />
      </div>
      <div className="space-y-3">
        {filteredWorkers.length===0&&<EmptyState icon="👷" text="No workers found" />}
        {filteredWorkers.map(w=>{
          const {totalPaid} = getWorkerData(w.name);
          return (
            <div key={w._id} onClick={()=>setSelectedWorker(w)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:border-amber-300 transition-all">
              <div className="flex items-center justify-between">
                <div><div className="font-black text-gray-900">{w.name}</div><div className="text-xs text-gray-400">{w.role}{w.phone?` · 📞 ${w.phone}`:""}</div><div className="text-xs text-amber-600">{CURRENCY}{fmt(w.rateAmount||0)} / {w.paymentType||"day"}</div></div>
                <div className="text-right"><div className="font-black text-green-700">{CURRENCY}{fmt(totalPaid)}</div><div className="text-xs text-gray-400">Total Paid</div></div>
              </div>
            </div>
          );
        })}
      </div>
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
    const allPayments = sr.flatMap(r=>(r.payments||[]).map(p=>({...p,date:r.date})));
    const clientPayments = allPayments.filter(p=>p.type==="Site Payment Received");
    const workerPayments = allPayments.filter(p=>p.type==="Worker Payment");
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
    const dateReport = selectedDate?sr.find(r=>r.date===selectedDate):null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={()=>{setSelectedSite(null);setSelectedDate(null);}} className="text-amber-600 font-bold text-sm">← Back</button>
          <Badge color={selectedSite.status==="completed"?"green":"amber"}>{selectedSite.status}</Badge>
        </div>
        <div className="bg-white rounded-2xl border shadow-sm p-4">
          <div className="font-black text-xl">{selectedSite.customerName}</div>
          <div className="text-xs text-gray-400">📍 {selectedSite.siteLocation||"—"}</div>
          <div className="text-xs text-gray-400">🧱 {selectedSite.interlockType||"—"} · {selectedSite.workSize||"—"} sqft</div>
        </div>
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
            <option value="">All Dates ({sr.length} reports)</option>
            {sr.map(r=><option key={r._id} value={r.date}>{r.date} — {r.workersCount||0} workers, {r.completedToday||0} sqft</option>)}
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
            {(dateReport.payments||[]).length>0&&(
              <SectionBox title="Payments" icon="💰" color="green">
                {dateReport.payments.map((p,i)=>(
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
            <div className="text-xs font-black text-gray-500 uppercase">📅 Daily Reports ({sr.length})</div>
            {sr.length===0&&<EmptyState icon="📋" text="No reports submitted yet" />}
            {sr.map(r=>(
              <div key={r._id} onClick={()=>setSelectedDate(r.date)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-2 cursor-pointer hover:border-amber-300 transition-all">
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
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-2 text-center"><div className="font-black text-blue-700">{CURRENCY}{fmt(dailyReports.reduce((a,r)=>a+(+(r.totalReceived||0)),0))}</div><div className="text-gray-400">Total Rcvd</div></div>
      </div>
      <div className="space-y-3">
        {filteredSites.length===0&&<EmptyState icon="📊" text="No sites found" />}
        {filteredSites.map(s=>{
          const sr = getSiteReports(s);
          const received = sr.reduce((a,r)=>a+(+(r.totalReceived||0)),0);
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


const NAV = {
  admin: [
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
    { id:"devices", label:"Devices", icon:"📱" },
    { id:"devices", label:"Devices", icon:"📱" },
    { id:"users", label:"Users", icon:"👥" },
    { id:"reports", label:"Reports", icon:"📈" },
  ],
  supervisor: [
    { id:"sitework", label:"Site Work", icon:"🏗️" },
    { id:"dailyreport", label:"Daily Report", icon:"📋" },
    { id:"mysitereports", label:"My Site Reports", icon:"📊" },
    { id:"workerreport", label:"Site Report", icon:"📝" },
    { id:"workers", label:"Workers", icon:"👷" },
    { id:"suppliers", label:"Suppliers", icon:"🏪" },
    { id:"purchases", label:"Purchases", icon:"🛒" },
    { id:"workplan", label:"Work Planning", icon:"📅" },
  ],
  user: [
    { id:"dashboard", label:"Dashboard", icon:"📊" },
    { id:"sitework", label:"Site Work", icon:"🏗️" },
    { id:"productionsite", label:"Production Site", icon:"🏭" },
    { id:"attendance", label:"Attendance", icon:"📊" },
    { id:"workers", label:"Workers", icon:"👷" },
    { id:"suppliers", label:"Suppliers", icon:"🏪" },
    { id:"purchases", label:"Purchases", icon:"🛒" },
    { id:"stock", label:"Stock", icon:"📦" },
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

  const nav = NAV[currentUser.role]||[];
  const roleColors = { admin:"from-violet-500 to-purple-600", supervisor:"from-emerald-500 to-green-600", user:"from-blue-500 to-blue-600" };

  const renderPage = () => {
    if (loading) return <Loader />;
    switch (page) {
      case "dashboard": return <Dashboard stock={stock} raw={raw} production={production} sales={sales} siteWorks={siteWorks} user={currentUser} />;
      case "sitework": return <SiteWork siteWorks={siteWorks} setSiteWorks={setSiteWorks} user={currentUser} />;
      case "masterdata": return <MasterData />;
      case "workers": return <Workers user={currentUser} />;
      case "suppliers": return <Suppliers user={currentUser} />;
      case "productionsite": return <ProductionSite user={currentUser} />;
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
      case "mysitereports": return <SupervisorSiteReport user={currentUser} />;
      case "workerreport2": return <AdminWorkerReport />;
      case "stock": return <Stock stock={stock} setStock={setStock} user={currentUser} />;
      case "raw": return <RawMaterial raw={raw} setRaw={setRaw} user={currentUser} />;
      case "production": return <Production production={production} setProduction={setProduction} stock={stock} user={currentUser} />;
      case "sales": return <Sales sales={sales} setSales={setSales} stock={stock} user={currentUser} />;
      case "users": return currentUser.role==="admin"?<Users currentUser={currentUser} allUsers={allUsers} setAllUsers={setAllUsers} />:null;
      case "devices": return <DeviceManagement user={currentUser} />;
      case "devices": return <DeviceManagement user={currentUser} />;
      case "reports": return <Reports production={production} sales={sales} stock={stock} raw={raw} siteWorks={siteWorks} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen&&<div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={()=>setSidebarOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-stone-900 z-30 flex flex-col transform transition-transform duration-300 ${sidebarOpen?"translate-x-0":"-translate-x-full"} lg:translate-x-0 lg:static lg:h-screen lg:flex`}>
        <div className="px-5 py-5 border-b border-stone-700">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{COMPANY.logo}</div>
            <div><div className="text-white font-black text-sm leading-tight">{COMPANY.name}</div><div className="text-stone-400 text-xs">Management System</div></div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(item=>(
            <button key={item.id} onClick={()=>{setPage(item.id);setSidebarOpen(false);}}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${page===item.id?"bg-amber-500 text-white shadow-lg":"text-stone-400 hover:bg-stone-800 hover:text-white"}`}>
              <span className="text-base">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-stone-700">
          <div className="flex items-center gap-3 bg-stone-800 rounded-xl px-3 py-3">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${roleColors[currentUser.role]} flex items-center justify-center text-white font-black text-xs shrink-0`}>{currentUser.avatar}</div>
            <div className="flex-1 min-w-0"><div className="text-white text-xs font-bold truncate">{currentUser.name}</div><div className="text-stone-400 text-xs capitalize">{currentUser.role}</div></div>
            <button onClick={()=>setCurrentUser(null)} className="text-stone-500 hover:text-red-400 text-xs font-bold" title="Logout">⏻</button>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
          <button onClick={()=>setSidebarOpen(!sidebarOpen)} className="lg:hidden text-gray-600 text-xl">☰</button>
          <h1 className="font-black text-gray-900 flex-1 text-base">{nav.find(n=>n.id===page)?.icon} {nav.find(n=>n.id===page)?.label}</h1>
          <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${roleColors[currentUser.role]} text-white text-xs font-bold`}>
            {currentUser.avatar} <span className="capitalize">{currentUser.role}</span>
          </div>
        </header>
        <main className="flex-1 p-4 overflow-y-auto max-w-3xl w-full mx-auto">{renderPage()}</main>
      </div>
    </div>
  );
}