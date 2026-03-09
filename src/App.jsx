import { useState, useEffect } from "react";

const API = "https://interlock-backend.onrender.com/api";
const COMPANY = { name: "Al-Noor Interlock", logo: "🏭" };
const CURRENCY = "₹";

const fmt = (n) => n?.toLocaleString("en-IN") ?? "0";
const today = () => new Date().toISOString().split("T")[0];

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

function Badge({ children, color }) {
  const colors = {
    green: "bg-green-100 text-green-700 border-green-200",
    red: "bg-red-100 text-red-700 border-red-200",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    gray: "bg-gray-100 text-gray-600 border-gray-200",
    orange: "bg-orange-100 text-orange-700 border-orange-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
    teal: "bg-teal-100 text-teal-700 border-teal-200",
  };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colors[color] || colors.gray}`}>{children}</span>;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50" {...props} />
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50 resize-none" rows={3} {...props} />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50" {...props}>
        {options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </div>
  );
}

function StatCard({ label, value, sub, icon, color }) {
  const colors = { amber: "from-amber-400 to-orange-500", blue: "from-blue-500 to-blue-600", green: "from-emerald-500 to-green-600", red: "from-red-500 to-rose-600", purple: "from-violet-500 to-purple-600", teal: "from-teal-500 to-cyan-600" };
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color] || colors.amber} flex items-center justify-center text-2xl shrink-0 shadow`}>{icon}</div>
      <div>
        <div className="text-2xl font-black text-gray-900">{value}</div>
        <div className="text-sm font-semibold text-gray-700">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function Loader() {
  return <div className="flex items-center justify-center py-16"><div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>;
}

function SectionTitle({ icon, title }) {
  return <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{icon} {title}</div>;
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true); setError("");
    try {
      const user = await api("POST", "/login", { username, password });
      if (user.message) setError(user.message);
      else onLogin(user);
    } catch { setError("Server error. Please try again."); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(45deg,#d97706 0,#d97706 1px,transparent 0,transparent 50%)", backgroundSize: "20px 20px" }} />
      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-8 text-center">
            <div className="text-5xl mb-2">{COMPANY.logo}</div>
            <h1 className="text-2xl font-black text-white tracking-tight">{COMPANY.name}</h1>
            <p className="text-amber-100 text-sm mt-1">Manufacturing Management System</p>
          </div>
          <div className="px-8 py-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Username</label>
              <input className="mt-1 w-full border-b-2 border-gray-200 focus:border-amber-500 px-0 py-2 text-sm outline-none bg-transparent"
                placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
              <input type="password" className="mt-1 w-full border-b-2 border-gray-200 focus:border-amber-500 px-0 py-2 text-sm outline-none bg-transparent"
                placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
            </div>
            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
            <button onClick={submit} disabled={loading} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] disabled:opacity-60">
              {loading ? "Signing in…" : "Sign In"}
            </button>
            <div className="bg-gray-50 rounded-xl p-3 space-y-1">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Demo Accounts</p>
              {[{ role: "admin", u: "admin", p: "admin123" }, { role: "supervisor", u: "supervisor", p: "sup123" }, { role: "user", u: "user", p: "user123" }].map((u) => (
                <button key={u.role} onClick={() => { setUsername(u.u); setPassword(u.p); setError(""); }}
                  className="block w-full text-left text-xs text-gray-600 hover:text-amber-700 hover:bg-amber-50 px-2 py-1 rounded transition-colors">
                  <span className="font-semibold">{u.role}</span>: {u.u} / {u.p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard({ stock, raw, production, sales, siteWorks, user }) {
  const lowStock = stock.filter((s) => s.qty < s.minQty).length;
  const todayProd = production.filter((p) => p.date === today());
  const totalProduced = todayProd.reduce((a, p) => a + p.produced, 0);
  const pendingApprovals = production.filter((p) => p.status === "pending").length;
  const totalSales = sales.reduce((a, s) => a + s.total, 0);
  const paidSales = sales.filter((s) => s.status === "paid").reduce((a, s) => a + s.total, 0);
  const activeSites = siteWorks.filter((s) => s.workStatus === "ongoing").length;
  const totalSitePending = siteWorks.reduce((a, s) => a + (s.pendingAmount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900">Good {new Date().getHours() < 12 ? "Morning" : "Afternoon"}, {user.name.split(" ")[0]} 👋</h2>
        <p className="text-gray-500 text-sm">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon="📦" label="Stock Items" value={stock.length} sub={lowStock > 0 ? `⚠️ ${lowStock} low stock` : "All good"} color="blue" />
        <StatCard icon="🏭" label="Today's Output" value={`${fmt(totalProduced)} sqm`} sub={`${todayProd.length} entries`} color="amber" />
        {user.role !== "user" && <>
          <StatCard icon="🏗️" label="Active Sites" value={activeSites} sub="Work in progress" color="teal" />
          <StatCard icon="💸" label="Site Pending" value={`${CURRENCY}${fmt(totalSitePending)}`} sub="Unpaid amount" color="red" />
          <StatCard icon="💰" label="Total Sales" value={`${CURRENCY}${fmt(totalSales)}`} sub={`Collected: ${CURRENCY}${fmt(paidSales)}`} color="green" />
          <StatCard icon="⏳" label="Pending Approvals" value={pendingApprovals} sub="Production entries" color={pendingApprovals > 0 ? "red" : "green"} />
        </>}
        {user.role === "user" && <>
          <StatCard icon="🧱" label="Raw Materials" value={raw.length} sub="In stock" color="purple" />
          <StatCard icon="✅" label="My Entries Today" value={todayProd.length} sub="Production logs" color="green" />
        </>}
      </div>
      {lowStock > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <h3 className="font-bold text-red-700 mb-2 text-sm">⚠️ Low Stock Alerts</h3>
          {stock.filter((s) => s.qty < s.minQty).map((s) => (
            <div key={s._id} className="text-xs text-red-600 flex justify-between"><span>{s.name}</span><span className="font-bold">{s.qty} {s.unit} (min: {s.minQty})</span></div>
          ))}
        </div>
      )}
      {user.role !== "user" && siteWorks.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-900">🏗️ Recent Site Works</h3></div>
          <div className="divide-y divide-gray-50">
            {siteWorks.slice(0, 4).map((s) => (
              <div key={s._id} className="px-5 py-3 flex items-center justify-between">
                <div><div className="text-sm font-semibold text-gray-800">{s.customerName}</div><div className="text-xs text-gray-400">📍{s.location} · {s.date}</div></div>
                <div className="flex items-center gap-2">
                  <Badge color={s.workStatus === "completed" ? "green" : s.workStatus === "ongoing" ? "blue" : "yellow"}>{s.workStatus}</Badge>
                  <span className="text-xs font-bold text-red-600">{CURRENCY}{fmt(s.pendingAmount)} pending</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── WORKER REPORT ────────────────────────────────────────────────────────────
// ─── SITE REPORT (Worker Report) ─────────────────────────────────────────────
// ─── SITE REPORT ─────────────────────────────────────────────────────────────
// Shows all sites from Supervisor Reports with full details
function WorkerReport({ user }) {
  const [dailyReports, setDailyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [detailTab, setDetailTab] = useState("info");

  useEffect(() => {
    api("GET", "/dailyreport").then((d) => {
      setDailyReports(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, []);

  // Build site map
  const allSites = {};
  dailyReports.forEach((r) => {
    const add = (key, status) => {
      if (!key) return;
      if (!allSites[key]) allSites[key] = { name: key, status, entries: [], lastUpdated: r.date };
      if (!allSites[key].entries.find(e => e._id === r._id)) allSites[key].entries.push(r);
      if (status === "completed") allSites[key].status = "completed";
      else if (allSites[key].status !== "completed") allSites[key].status = status;
      allSites[key].lastUpdated = r.date;
    };
    add(r.newSite?.siteName, "running");
    add(r.runningSite?.siteName, "running");
    add(r.completedSite?.siteName, "completed");
  });

  const siteList = Object.values(allSites).sort((a, b) => (b.lastUpdated || "").localeCompare(a.lastUpdated || ""));
  const filtered = activeTab === "all" ? siteList : siteList.filter(s => s.status === activeTab);

  // Compute selected site data
  const site = selectedSite ? allSites[selectedSite] : null;
  const entries = site ? site.entries : [];
  const latestNew = entries.map(e => e.newSite).filter(s => s?.siteName === selectedSite).pop() || null;
  const latestRunning = entries.map(e => e.runningSite).filter(s => s?.siteName === selectedSite).pop() || null;
  const latestCompleted = entries.map(e => e.completedSite).filter(s => s?.siteName === selectedSite).pop() || null;
  const latestInfo = latestCompleted || latestRunning || latestNew || {};
  const allWorkers = entries.flatMap(e => (e.workers || []).map(w => ({ ...w, date: e.date, addedBy: e.addedBy })));
  const allMaterials = entries.flatMap(e => e.materialSupply?.materialName ? [{ ...e.materialSupply, date: e.date }] : []).filter(m => !m.siteName || m.siteName === selectedSite);
  const allPayments = entries.flatMap(e => (e.payments || []).filter(p => !p.siteName || p.siteName === selectedSite).map(p => ({ ...p, reportDate: e.date })));
  const allExpenses = entries.flatMap(e => (e.expenses || []).filter(x => !x.siteName || x.siteName === selectedSite).map(x => ({ ...x, reportDate: e.date })));
  const allComplaints = entries.flatMap(e => (e.complaints || []).filter(c => !c.siteName || c.siteName === selectedSite));
  const allNotes = entries.map(e => ({ date: e.date, note: e.dayNotes, by: e.addedBy })).filter(n => n.note);
  const totalPaid = allPayments.reduce((a, p) => a + (+p.amount || 0), 0);
  const totalExpenses = allExpenses.reduce((a, e) => a + (+e.amount || 0), 0);
  const totalCost = +(latestInfo.totalCost || latestCompleted?.totalCost || 0);
  const pendingAmt = +(latestInfo.pendingAmount || latestCompleted?.finalPendingAmount || 0);

  if (loading) return <Loader />;

  // ── DETAIL VIEW ──
  if (selectedSite && site) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => { setSelectedSite(null); setDetailTab("info"); }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl font-bold text-sm">← Back</button>
          <h2 className="text-lg font-black text-gray-900 flex-1 truncate">{selectedSite}</h2>
          <Badge color={site.status === "completed" ? "green" : "blue"}>{site.status}</Badge>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-50 border rounded-xl p-2 text-center"><div className="text-sm font-black">{CURRENCY}{fmt(totalCost)}</div><div className="text-xs text-gray-500">Total Cost</div></div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-2 text-center"><div className="text-sm font-black text-green-700">{CURRENCY}{fmt(totalPaid)}</div><div className="text-xs text-gray-500">Paid</div></div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-2 text-center"><div className="text-sm font-black text-red-600">{CURRENCY}{fmt(pendingAmt)}</div><div className="text-xs text-gray-500">Pending</div></div>
        </div>

        <div className="flex gap-1 flex-wrap">
          {[["info","ℹ️ Info"],["workers","👷 Workers"],["materials","🧱 Materials"],["payments","💰 Payments"],["complaints","⚠️ Issues"],["notes","📝 Notes"],["expenses","💸 Expenses"]].map(([id, label]) => (
            <button key={id} onClick={() => setDetailTab(id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${detailTab === id ? "bg-amber-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {label}
            </button>
          ))}
        </div>

        {detailTab === "info" && (
          <div className="space-y-3">
            {latestNew && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <div className="text-xs font-bold text-blue-700 mb-2">🆕 Site Info</div>
                <div className="grid grid-cols-2 gap-2">
                  {[["Client",latestNew.clientName],["Location",latestNew.location],["Start Date",latestNew.startDate],["Interlock",latestNew.interlockType],["Area",latestNew.totalWorkArea?latestNew.totalWorkArea+" sqft":""],["Workers",latestNew.numWorkers],["Qty Unloaded",latestNew.interlockQtyUnloaded]].filter(([,v])=>v).map(([l,v])=>(
                    <div key={l} className="bg-white rounded-lg p-2"><div className="text-xs text-gray-400">{l}</div><div className="text-sm font-bold text-gray-900">{v}</div></div>
                  ))}
                </div>
                {latestNew.materialsUnloaded && <div className="mt-2 bg-white rounded-lg p-2 text-xs"><span className="text-gray-400">Materials: </span><span className="font-semibold">{latestNew.materialsUnloaded}</span></div>}
                {latestNew.equipmentUnloaded && <div className="mt-1 bg-white rounded-lg p-2 text-xs"><span className="text-gray-400">Equipment: </span><span className="font-semibold">{latestNew.equipmentUnloaded}</span></div>}
              </div>
            )}
            {latestRunning && (
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
                <div className="text-xs font-bold text-teal-700 mb-2">🔄 Latest Running Update</div>
                <div className="grid grid-cols-2 gap-2">
                  {[["Workers",latestRunning.numWorkers],["Interlock",latestRunning.interlockType],["Total Area",latestRunning.totalWorkArea?latestRunning.totalWorkArea+" sqft":""],["Done Today",latestRunning.workCompletedToday?latestRunning.workCompletedToday+" sqft":""],["Status",latestRunning.progressStatus]].filter(([,v])=>v).map(([l,v])=>(
                    <div key={l} className="bg-white rounded-lg p-2"><div className="text-xs text-gray-400">{l}</div><div className="text-sm font-bold text-gray-900">{v}</div></div>
                  ))}
                </div>
                {latestRunning.materialsUnloaded && <div className="mt-1 bg-white rounded-lg p-2 text-xs"><span className="text-gray-400">Materials: </span>{latestRunning.materialsUnloaded}</div>}
                {latestRunning.equipmentAvailable && <div className="mt-1 bg-white rounded-lg p-2 text-xs"><span className="text-gray-400">Equipment: </span>{latestRunning.equipmentAvailable}</div>}
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[["Received",latestRunning.amountReceived],["Total Cost",latestRunning.totalCost],["Pending",latestRunning.pendingAmount]].filter(([,v])=>v).map(([l,v])=>(
                    <div key={l} className="bg-white rounded-lg p-2 text-center"><div className="text-sm font-black">{CURRENCY}{fmt(+v)}</div><div className="text-xs text-gray-400">{l}</div></div>
                  ))}
                </div>
              </div>
            )}
            {latestCompleted && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <div className="text-xs font-bold text-green-700 mb-2">✅ Completed</div>
                <div className="grid grid-cols-2 gap-2">
                  {[["Location",latestCompleted.location],["Completion Date",latestCompleted.completionDate],["Total Sqft",latestCompleted.totalSqftCompleted?latestCompleted.totalSqftCompleted+" sqft":""],["Interlock Used",latestCompleted.interlockTypeUsed],["Total Workers",latestCompleted.totalWorkers]].filter(([,v])=>v).map(([l,v])=>(
                    <div key={l} className="bg-white rounded-lg p-2"><div className="text-xs text-gray-400">{l}</div><div className="text-sm font-bold text-gray-900">{v}</div></div>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[["Total Cost",latestCompleted.totalCost],["Received",latestCompleted.totalAmountReceived],["Pending",latestCompleted.finalPendingAmount]].filter(([,v])=>v).map(([l,v])=>(
                    <div key={l} className="bg-white rounded-lg p-2 text-center"><div className="text-sm font-black">{CURRENCY}{fmt(+v)}</div><div className="text-xs text-gray-400">{l}</div></div>
                  ))}
                </div>
              </div>
            )}
            {!latestNew && !latestRunning && !latestCompleted && <div className="text-center text-gray-400 py-8">No info available</div>}
          </div>
        )}

        {detailTab === "workers" && (
          <div className="space-y-2">
            {allWorkers.length === 0 && <div className="bg-white rounded-2xl border p-8 text-center text-gray-400">No workers recorded</div>}
            {allWorkers.map((w, i) => (
              <div key={i} className="bg-white rounded-xl border p-3 flex items-center justify-between">
                <div><div className="font-bold text-gray-900">{w.name}</div><div className="text-xs text-gray-400">📅 {w.date} · {w.addedBy}</div></div>
                <Badge color={w.attendance==="Present"?"green":w.attendance==="Absent"?"red":"yellow"}>{w.attendance}</Badge>
              </div>
            ))}
            {allWorkers.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                <span className="text-sm font-black text-amber-700">{allWorkers.filter(w=>w.attendance==="Present").length} Present · {allWorkers.filter(w=>w.attendance==="Absent").length} Absent · {allWorkers.filter(w=>w.attendance==="Half Day").length} Half Day</span>
              </div>
            )}
          </div>
        )}

        {detailTab === "materials" && (
          <div className="space-y-2">
            {allMaterials.length === 0 && <div className="bg-white rounded-2xl border p-8 text-center text-gray-400">No materials recorded</div>}
            {allMaterials.map((m, i) => (
              <div key={i} className="bg-white rounded-xl border p-3">
                <div className="flex justify-between items-start gap-2">
                  <div><div className="font-bold text-gray-900">{m.materialName}</div><div className="text-xs text-gray-400">📅 {m.date} · {m.supplier || "No supplier"}</div></div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg px-2 py-1 text-sm font-black text-orange-700">{m.qty}</div>
                </div>
                {m.deliveryDetails && <div className="mt-1 text-xs text-gray-500">🚚 {m.deliveryDetails}</div>}
              </div>
            ))}
          </div>
        )}

        {detailTab === "payments" && (
          <div className="space-y-2">
            {allPayments.length === 0 && <div className="bg-white rounded-2xl border p-8 text-center text-gray-400">No payments recorded</div>}
            {allPayments.map((p, i) => (
              <div key={i} className="bg-white rounded-xl border p-3 flex justify-between items-start gap-2">
                <div><div className="font-bold text-gray-900">{p.paidTo}</div><div className="text-xs text-gray-400">📅 {p.date||p.reportDate} · {p.type}</div></div>
                <div className="text-right"><div className="text-sm font-black text-green-700">{CURRENCY}{fmt(+p.amount)}</div><Badge color={p.mode==="Cash"?"green":p.mode==="Bank"?"blue":"purple"}>{p.mode}</Badge></div>
              </div>
            ))}
            {allPayments.length > 0 && <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center"><div className="text-lg font-black text-green-700">{CURRENCY}{fmt(totalPaid)}</div><div className="text-xs text-gray-500">Total Paid</div></div>}
          </div>
        )}

        {detailTab === "complaints" && (
          <div className="space-y-2">
            {allComplaints.length === 0 && <div className="bg-white rounded-2xl border p-8 text-center text-gray-400">No complaints recorded</div>}
            {allComplaints.map((c, i) => (
              <div key={i} className="bg-red-50 border border-red-200 rounded-xl p-3">
                <div className="font-bold text-gray-900 text-sm">{c.description}</div>
                <div className="text-xs text-gray-500 mt-1">By: {c.reportedBy}</div>
                {c.actionTaken && <div className="text-xs text-green-700 mt-1">✅ {c.actionTaken}</div>}
              </div>
            ))}
          </div>
        )}

        {detailTab === "notes" && (
          <div className="space-y-2">
            {allNotes.length === 0 && <div className="bg-white rounded-2xl border p-8 text-center text-gray-400">No notes recorded</div>}
            {allNotes.map((n, i) => (
              <div key={i} className="bg-gray-50 border rounded-xl p-3"><div className="text-xs text-gray-400 mb-1">📅 {n.date} · {n.by}</div><div className="text-sm text-gray-700">{n.note}</div></div>
            ))}
          </div>
        )}

        {detailTab === "expenses" && (
          <div className="space-y-2">
            {allExpenses.length === 0 && <div className="bg-white rounded-2xl border p-8 text-center text-gray-400">No expenses recorded</div>}
            {allExpenses.map((e, i) => (
              <div key={i} className="bg-white rounded-xl border p-3 flex justify-between items-start gap-2">
                <div><div className="font-bold text-gray-900">{e.type}</div><div className="text-xs text-gray-500">{e.description}</div><div className="text-xs text-gray-400">📅 {e.date||e.reportDate}</div></div>
                <div className="text-sm font-black text-purple-700">{CURRENCY}{fmt(+e.amount)}</div>
              </div>
            ))}
            {allExpenses.length > 0 && <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center"><div className="text-lg font-black text-purple-700">{CURRENCY}{fmt(totalExpenses)}</div><div className="text-xs text-gray-500">Total Expenses</div></div>}
          </div>
        )}
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-gray-900">🏗️ Site Report</h2>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border rounded-xl p-3 text-center shadow-sm"><div className="text-xl font-black">{siteList.length}</div><div className="text-xs text-gray-500">All Sites</div></div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center shadow-sm"><div className="text-xl font-black text-blue-700">{siteList.filter(s=>s.status==="running").length}</div><div className="text-xs text-gray-500">Running</div></div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center shadow-sm"><div className="text-xl font-black text-green-700">{siteList.filter(s=>s.status==="completed").length}</div><div className="text-xs text-gray-500">Completed</div></div>
      </div>
      <div className="flex gap-2">
        {[["all","All"],["running","🔄 Running"],["completed","✅ Completed"]].map(([id,label])=>(
          <button key={id} onClick={()=>setActiveTab(id)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${activeTab===id?"bg-amber-500 text-white shadow":"bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{label}</button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.length === 0 && <div className="bg-white rounded-2xl border p-8 text-center text-gray-400">No sites found</div>}
        {filtered.map((s) => {
          const e = s.entries;
          const lN = e.map(r=>r.newSite).filter(x=>x?.siteName===s.name).pop();
          const lR = e.map(r=>r.runningSite).filter(x=>x?.siteName===s.name).pop();
          const lC = e.map(r=>r.completedSite).filter(x=>x?.siteName===s.name).pop();
          const info = lC||lR||lN||{};
          const paid = e.flatMap(r=>r.payments||[]).reduce((a,p)=>a+(+p.amount||0),0);
          const pending = +(info.pendingAmount||info.finalPendingAmount||0);
          const cost = +(info.totalCost||0);
          const wCount = e.flatMap(r=>r.workers||[]).length;
          return (
            <div key={s.name} onClick={()=>{ setSelectedSite(s.name); setDetailTab("info"); }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:border-amber-300 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-gray-900 truncate">{s.name}</h3>
                    <Badge color={s.status==="completed"?"green":"blue"}>{s.status}</Badge>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">📍 {info.location||"—"} · 📅 {s.lastUpdated}</div>
                </div>
                <span className="text-gray-300 text-xl shrink-0">›</span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                <div className="bg-gray-50 rounded-lg p-2 text-center"><div className="font-black text-gray-800">{CURRENCY}{fmt(cost)}</div><div className="text-gray-400">Cost</div></div>
                <div className="bg-green-50 rounded-lg p-2 text-center"><div className="font-black text-green-700">{CURRENCY}{fmt(paid)}</div><div className="text-gray-400">Paid</div></div>
                <div className="bg-red-50 rounded-lg p-2 text-center"><div className="font-black text-red-600">{CURRENCY}{fmt(pending)}</div><div className="text-gray-400">Pending</div></div>
                <div className="bg-amber-50 rounded-lg p-2 text-center"><div className="font-black text-amber-700">{wCount}</div><div className="text-gray-400">Workers</div></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DailyReport({ siteWorks, user }) {
  const [reports, setReports] = useState([]);
  const [modal, setModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("running");
  const [activeSection, setActiveSection] = useState("newsite");

  const emptyWorker = () => ({ id: Date.now(), name: "", attendance: "Present" });
  const emptyComplaint = () => ({ id: Date.now(), siteName: "", description: "", reportedBy: "", actionTaken: "" });
  const emptyPayment = () => ({ id: Date.now(), siteName: "", type: "Labour", amount: "", paidTo: "", mode: "Cash", date: today() });
  const emptyExpense = () => ({ id: Date.now(), type: "", siteName: "", amount: "", description: "", date: today() });

  const emptyForm = {
    date: today(),
    newSite: { siteName:"", location:"", clientName:"", startDate:today(), numWorkers:"", interlockType:"", totalWorkArea:"", materialsUnloaded:"", equipmentUnloaded:"", interlockQtyUnloaded:"", amountReceived:"", totalCost:"", pendingAmount:"" },
    runningSite: { siteName:"", location:"", numWorkers:"", interlockType:"", totalWorkArea:"", workCompletedToday:"", materialsUnloaded:"", equipmentAvailable:"", amountReceived:"", totalCost:"", pendingAmount:"", progressStatus:"ongoing" },
    completedSite: { siteName:"", location:"", completionDate:today(), totalSqftCompleted:"", interlockTypeUsed:"", totalWorkers:"", totalCost:"", totalAmountReceived:"", finalPendingAmount:"" },
    workers: [], workerSite: "",
    materialSupply: { siteName:"", materialName:"", qty:"", supplier:"", deliveryDetails:"" },
    complaints: [],
    payments: [],
    dayNotes: "",
    expenses: [],
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    api("GET", "/dailyreport").then((d) => { setReports(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const save = async () => {
    const data = { ...form, addedBy: user.name };
    const item = await api("POST", "/dailyreport", data);
    setReports((p) => [item, ...p]);
    setModal(false); setForm(emptyForm); setActiveSection("newsite");
  };

  // Collect all unique sites - NEW sites go straight to running
  // Priority: completed > running > new(running)
  const allSites = {};
  reports.forEach((r) => {
    if (r.newSite?.siteName) {
      const key = r.newSite.siteName;
      if (!allSites[key]) allSites[key] = { name: key, status: "running", entries: [], latest: r };
      if (!allSites[key].entries.includes(r)) allSites[key].entries.push(r);
      // Only update status if not already completed
      if (allSites[key].status !== "completed") allSites[key].status = "running";
      allSites[key].latest = r;
    }
    if (r.runningSite?.siteName) {
      const key = r.runningSite.siteName;
      if (!allSites[key]) allSites[key] = { name: key, status: "running", entries: [], latest: r };
      if (!allSites[key].entries.includes(r)) allSites[key].entries.push(r);
      if (allSites[key].status !== "completed") allSites[key].status = "running";
      allSites[key].latest = r;
    }
    if (r.completedSite?.siteName) {
      const key = r.completedSite.siteName;
      if (!allSites[key]) allSites[key] = { name: key, status: "completed", entries: [], latest: r };
      if (!allSites[key].entries.includes(r)) allSites[key].entries.push(r);
      allSites[key].status = "completed"; // completed always wins
      allSites[key].latest = r;
    }
  });

  const siteList = Object.values(allSites);
  const runningSites = siteList.filter(s => s.status === "running");
  const completedSites = siteList.filter(s => s.status === "completed");

  const sections = [
    { id: "newsite", label: "🆕 New Site" },
    { id: "runningsite", label: "🔄 Running" },
    { id: "completedsite", label: "✅ Completed" },
    { id: "workers", label: "👷 Workers" },
    { id: "material", label: "🧱 Material" },
    { id: "complaints", label: "⚠️ Complaints" },
    { id: "payments", label: "💰 Payments" },
    { id: "daynotes", label: "📝 Notes" },
    { id: "expenses", label: "💸 Expenses" },
  ];

  if (loading) return <Loader />;

  // ── SITE DETAILS VIEW ──
  if (selectedSite) {
    const site = allSites[selectedSite];
    if (!site) { setSelectedSite(null); return null; }
    const allEntries = site.entries;
    const latestNew = allEntries.map(e => e.newSite).filter(s => s?.siteName === selectedSite).pop();
    const latestRunning = allEntries.map(e => e.runningSite).filter(s => s?.siteName === selectedSite).pop();
    const latestCompleted = allEntries.map(e => e.completedSite).filter(s => s?.siteName === selectedSite).pop();
    const allWorkers = allEntries.flatMap(e => e.workers || []);
    const allComplaints = allEntries.flatMap(e => e.complaints || []).filter(c => !c.siteName || c.siteName === selectedSite);
    const allPayments = allEntries.flatMap(e => e.payments || []).filter(p => !p.siteName || p.siteName === selectedSite);
    const allExpenses = allEntries.flatMap(e => e.expenses || []).filter(ex => !ex.siteName || ex.siteName === selectedSite);
    const allMaterials = allEntries.map(e => e.materialSupply).filter(m => m?.materialName && (!m.siteName || m.siteName === selectedSite));
    const allNotes = allEntries.map(e => ({ date: e.date, note: e.dayNotes })).filter(n => n.note);
    const totalReceived = allPayments.reduce((a, p) => a + (+p.amount || 0), 0);
    const totalExpenses = allExpenses.reduce((a, e) => a + (+e.amount || 0), 0);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedSite(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl font-bold text-sm">← Back</button>
          <h2 className="text-xl font-black text-gray-900 flex-1">{selectedSite}</h2>
          <Badge color={site.status === "completed" ? "green" : site.status === "running" ? "blue" : "yellow"}>{site.status}</Badge>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border rounded-xl p-3 text-center shadow-sm"><div className="text-lg font-black">{allEntries.length}</div><div className="text-xs text-gray-500">Reports</div></div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center shadow-sm"><div className="text-lg font-black text-green-700">{CURRENCY}{fmt(totalReceived)}</div><div className="text-xs text-gray-500">Received</div></div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center shadow-sm"><div className="text-lg font-black text-red-600">{CURRENCY}{fmt(totalExpenses)}</div><div className="text-xs text-gray-500">Expenses</div></div>
        </div>

        {/* Site Info */}
        {latestNew && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-blue-700 mb-2">🆕 Site Info</div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
              {[["Location", latestNew.location], ["Client", latestNew.clientName], ["Start Date", latestNew.startDate], ["Workers", latestNew.numWorkers], ["Interlock", latestNew.interlockType], ["Work Area", latestNew.totalWorkArea ? latestNew.totalWorkArea + " sqft" : ""]].filter(([,v]) => v).map(([l, v]) => (
                <div key={l} className="bg-white rounded-lg p-2"><div className="text-gray-400">{l}</div><div className="font-bold text-gray-900">{v}</div></div>
              ))}
            </div>
            {latestNew.materialsUnloaded && <div className="mt-2 text-xs bg-white rounded-lg p-2"><span className="text-gray-400">Materials: </span>{latestNew.materialsUnloaded}</div>}
            {latestNew.equipmentUnloaded && <div className="mt-1 text-xs bg-white rounded-lg p-2"><span className="text-gray-400">Equipment: </span>{latestNew.equipmentUnloaded}</div>}
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[["Received", latestNew.amountReceived], ["Total Cost", latestNew.totalCost], ["Pending", latestNew.pendingAmount]].filter(([,v]) => v).map(([l, v]) => (
                <div key={l} className="bg-white rounded-lg p-2 text-center"><div className="text-sm font-black text-gray-800">{CURRENCY}{fmt(+v)}</div><div className="text-xs text-gray-400">{l}</div></div>
              ))}
            </div>
          </div>
        )}

        {latestRunning && (
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-teal-700 mb-2">🔄 Running Site Details</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[["Workers", latestRunning.numWorkers], ["Interlock Type", latestRunning.interlockType], ["Total Area", latestRunning.totalWorkArea ? latestRunning.totalWorkArea + " sqft" : ""], ["Completed Today", latestRunning.workCompletedToday ? latestRunning.workCompletedToday + " sqft" : ""], ["Status", latestRunning.progressStatus]].filter(([,v]) => v).map(([l, v]) => (
                <div key={l} className="bg-white rounded-lg p-2"><div className="text-gray-400">{l}</div><div className="font-bold text-gray-900">{v}</div></div>
              ))}
            </div>
            {latestRunning.materialsUnloaded && <div className="mt-2 text-xs bg-white rounded-lg p-2"><span className="text-gray-400">Materials: </span>{latestRunning.materialsUnloaded}</div>}
            {latestRunning.equipmentAvailable && <div className="mt-1 text-xs bg-white rounded-lg p-2"><span className="text-gray-400">Equipment: </span>{latestRunning.equipmentAvailable}</div>}
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[["Received", latestRunning.amountReceived], ["Total Cost", latestRunning.totalCost], ["Pending", latestRunning.pendingAmount]].filter(([,v]) => v).map(([l, v]) => (
                <div key={l} className="bg-white rounded-lg p-2 text-center"><div className="text-sm font-black text-gray-800">{CURRENCY}{fmt(+v)}</div><div className="text-xs text-gray-400">{l}</div></div>
              ))}
            </div>
          </div>
        )}

        {latestCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-green-700 mb-2">✅ Completed Site</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[["Location", latestCompleted.location], ["Completion Date", latestCompleted.completionDate], ["Total Sqft", latestCompleted.totalSqftCompleted], ["Interlock Used", latestCompleted.interlockTypeUsed], ["Total Workers", latestCompleted.totalWorkers]].filter(([,v]) => v).map(([l, v]) => (
                <div key={l} className="bg-white rounded-lg p-2"><div className="text-gray-400">{l}</div><div className="font-bold text-gray-900">{v}</div></div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[["Total Cost", latestCompleted.totalCost], ["Received", latestCompleted.totalAmountReceived], ["Pending", latestCompleted.finalPendingAmount]].filter(([,v]) => v).map(([l, v]) => (
                <div key={l} className="bg-white rounded-lg p-2 text-center"><div className="text-sm font-black text-gray-800">{CURRENCY}{fmt(+v)}</div><div className="text-xs text-gray-400">{l}</div></div>
              ))}
            </div>
          </div>
        )}

        {/* Workers */}
        {allWorkers.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-amber-700 mb-2">👷 Workers Details</div>
            {allWorkers.map((w, i) => (
              <div key={i} className="flex justify-between items-center py-1.5 border-b border-amber-100 last:border-0">
                <span className="text-sm font-semibold text-gray-800">{w.name}</span>
                <Badge color={w.attendance === "Present" ? "green" : w.attendance === "Absent" ? "red" : "yellow"}>{w.attendance}</Badge>
              </div>
            ))}
          </div>
        )}

        {/* Material Supply */}
        {allMaterials.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-orange-700 mb-2">🧱 Material Supply</div>
            {allMaterials.map((m, i) => (
              <div key={i} className="bg-white rounded-xl p-3 mb-2 text-xs">
                <div className="grid grid-cols-2 gap-1">
                  {[["Material", m.materialName], ["Qty", m.qty], ["Supplier", m.supplier], ["Delivery", m.deliveryDetails]].filter(([,v]) => v).map(([l, v]) => (
                    <div key={l}><span className="text-gray-400">{l}: </span><span className="font-semibold">{v}</span></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payments */}
        {allPayments.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-green-700 mb-2">💰 Payments</div>
            {allPayments.map((p, i) => (
              <div key={i} className="flex justify-between items-center py-1.5 border-b border-green-100 last:border-0 text-xs">
                <span>{p.type} → {p.paidTo} <Badge color={p.mode === "Cash" ? "green" : p.mode === "Bank" ? "blue" : "purple"}>{p.mode}</Badge></span>
                <span className="font-black text-green-700">{CURRENCY}{fmt(+p.amount)}</span>
              </div>
            ))}
            <div className="text-right mt-2 font-black text-green-800">Total: {CURRENCY}{fmt(totalReceived)}</div>
          </div>
        )}

        {/* Complaints */}
        {allComplaints.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-red-700 mb-2">⚠️ Complaints</div>
            {allComplaints.map((c, i) => (
              <div key={i} className="bg-white rounded-xl p-3 mb-2 text-xs">
                <div className="font-semibold text-gray-800">{c.description}</div>
                <div className="text-gray-500 mt-0.5">By: {c.reportedBy}</div>
                {c.actionTaken && <div className="text-green-700 mt-0.5">Action: {c.actionTaken}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Day Notes */}
        {allNotes.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-gray-600 mb-2">📝 Day Notes</div>
            {allNotes.map((n, i) => (
              <div key={i} className="bg-white rounded-xl p-3 mb-2">
                <div className="text-xs text-gray-400 mb-1">📅 {n.date}</div>
                <div className="text-sm text-gray-700">{n.note}</div>
              </div>
            ))}
          </div>
        )}

        {/* Expenses */}
        {allExpenses.length > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-purple-700 mb-2">💸 Expenses</div>
            {allExpenses.map((e, i) => (
              <div key={i} className="flex justify-between items-center py-1.5 border-b border-purple-100 last:border-0 text-xs">
                <span>{e.type} — {e.description} <span className="text-gray-400">{e.date}</span></span>
                <span className="font-black text-purple-700">{CURRENCY}{fmt(+e.amount)}</span>
              </div>
            ))}
            <div className="text-right mt-2 font-black text-purple-800">Total: {CURRENCY}{fmt(totalExpenses)}</div>
          </div>
        )}
      </div>
    );
  }

  // ── MAIN LIST VIEW ──
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">📋 Supervisor Report</h2>
        <button onClick={() => { setForm(emptyForm); setActiveSection("newsite"); setModal(true); }} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ Add Report</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center"><div className="text-xl font-black text-blue-700">{runningSites.length}</div><div className="text-xs text-gray-500">Running Sites</div></div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center"><div className="text-xl font-black text-green-700">{completedSites.length}</div><div className="text-xs text-gray-500">Completed Sites</div></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[["running", "🔄 Running"], ["completed", "✅ Completed"]].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${activeTab === id ? "bg-amber-500 text-white shadow" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* RUNNING SITES */}
      {activeTab === "running" && (
        <div className="space-y-3">
          {runningSites.length === 0 && <div className="bg-white rounded-2xl border p-8 text-center text-gray-400">No running sites</div>}
          {runningSites.map((site) => {
            const info = site.entries.map(e => e.runningSite).filter(s => s?.siteName).pop() || {};
            const pending = info.pendingAmount || 0;
            return (
              <div key={site.name} onClick={() => setSelectedSite(site.name)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:border-amber-300 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><h3 className="font-black text-gray-900">{site.name}</h3><Badge color="blue">Running</Badge></div>
                    <div className="text-xs text-gray-400 mt-0.5">📍 {info.location} · 👷 {info.numWorkers} workers</div>
                  </div>
                  <span className="text-gray-300 text-lg">›</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-gray-50 rounded-lg p-2 text-center"><div className="font-bold text-blue-700">{info.workCompletedToday || "—"} sqft</div><div className="text-gray-400">Today</div></div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center"><div className="font-bold text-gray-700">{info.totalWorkArea || "—"} sqft</div><div className="text-gray-400">Total</div></div>
                  <div className="bg-red-50 rounded-lg p-2 text-center"><div className="font-bold text-red-600">{CURRENCY}{fmt(+pending)}</div><div className="text-gray-400">Pending</div></div>
                </div>
                {info.totalWorkArea && info.workCompletedToday && (
                  <div className="mt-2 bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(100, Math.round((+info.workCompletedToday / +info.totalWorkArea) * 100))}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* COMPLETED SITES */}
      {activeTab === "completed" && (
        <div className="space-y-3">
          {completedSites.length === 0 && <div className="bg-white rounded-2xl border p-8 text-center text-gray-400">No completed sites</div>}
          {completedSites.map((site) => {
            const info = site.entries.map(e => e.completedSite).filter(s => s?.siteName).pop() || {};
            return (
              <div key={site.name} onClick={() => setSelectedSite(site.name)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:border-amber-300 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><h3 className="font-black text-gray-900">{site.name}</h3><Badge color="green">Completed</Badge></div>
                    <div className="text-xs text-gray-400 mt-0.5">📍 {info.location} · ✅ {info.completionDate}</div>
                  </div>
                  <span className="text-gray-300 text-lg">›</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-gray-50 rounded-lg p-2 text-center"><div className="font-bold text-gray-700">{info.totalSqftCompleted || "—"} sqft</div><div className="text-gray-400">Completed</div></div>
                  <div className="bg-green-50 rounded-lg p-2 text-center"><div className="font-bold text-green-700">{CURRENCY}{fmt(+(info.totalAmountReceived||0))}</div><div className="text-gray-400">Received</div></div>
                  <div className="bg-red-50 rounded-lg p-2 text-center"><div className="font-bold text-red-600">{CURRENCY}{fmt(+(info.finalPendingAmount||0))}</div><div className="text-gray-400">Pending</div></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD REPORT MODAL */}
      {modal && (
        <Modal title="Daily Report Entry" onClose={() => setModal(false)}>
          <div className="space-y-3">
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} />
            <div className="flex gap-1 flex-wrap">
              {sections.map((s) => (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${activeSection === s.id ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {s.label}
                </button>
              ))}
            </div>

            {activeSection === "newsite" && (
              <div className="bg-blue-50 rounded-xl p-3 space-y-2">
                <SectionTitle icon="🆕" title="New Site Details" />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Site Name" value={form.newSite.siteName} onChange={(e)=>setForm({...form,newSite:{...form.newSite,siteName:e.target.value}})} />
                  <Input label="Location" value={form.newSite.location} onChange={(e)=>setForm({...form,newSite:{...form.newSite,location:e.target.value}})} />
                  <Input label="Client Name" value={form.newSite.clientName} onChange={(e)=>setForm({...form,newSite:{...form.newSite,clientName:e.target.value}})} />
                  <Input label="Start Date" type="date" value={form.newSite.startDate} onChange={(e)=>setForm({...form,newSite:{...form.newSite,startDate:e.target.value}})} />
                  <Input label="No. of Workers" type="number" value={form.newSite.numWorkers} onChange={(e)=>setForm({...form,newSite:{...form.newSite,numWorkers:e.target.value}})} />
                  <Input label="Interlock Type" value={form.newSite.interlockType} onChange={(e)=>setForm({...form,newSite:{...form.newSite,interlockType:e.target.value}})} />
                  <Input label="Total Work Area (sqft)" type="number" value={form.newSite.totalWorkArea} onChange={(e)=>setForm({...form,newSite:{...form.newSite,totalWorkArea:e.target.value}})} />
                  <Input label="Interlock Qty Unloaded" value={form.newSite.interlockQtyUnloaded} onChange={(e)=>setForm({...form,newSite:{...form.newSite,interlockQtyUnloaded:e.target.value}})} placeholder="sqft / piecework" />
                </div>
                <Textarea label="Materials Unloaded" value={form.newSite.materialsUnloaded} onChange={(e)=>setForm({...form,newSite:{...form.newSite,materialsUnloaded:e.target.value}})} />
                <Textarea label="Equipment Unloaded" value={form.newSite.equipmentUnloaded} onChange={(e)=>setForm({...form,newSite:{...form.newSite,equipmentUnloaded:e.target.value}})} />
                <div className="grid grid-cols-3 gap-2">
                  <Input label={`Received (${CURRENCY})`} type="number" value={form.newSite.amountReceived} onChange={(e)=>setForm({...form,newSite:{...form.newSite,amountReceived:e.target.value}})} />
                  <Input label={`Total Cost (${CURRENCY})`} type="number" value={form.newSite.totalCost} onChange={(e)=>setForm({...form,newSite:{...form.newSite,totalCost:e.target.value}})} />
                  <Input label={`Pending (${CURRENCY})`} type="number" value={form.newSite.pendingAmount} onChange={(e)=>setForm({...form,newSite:{...form.newSite,pendingAmount:e.target.value}})} />
                </div>
              </div>
            )}

            {activeSection === "runningsite" && (
              <div className="bg-teal-50 rounded-xl p-3 space-y-2">
                <SectionTitle icon="🔄" title="Running Site Details" />
                <div className="mb-2">
                  <Select label="Select Running Site (auto-fill)" value={form.runningSite.siteName}
                    options={[{value:"",label:"-- Select site --"},...runningSites.map(s=>({value:s.name,label:s.name}))]}
                    onChange={(e) => {
                      const siteName = e.target.value;
                      const site = allSites[siteName];
                      if (site) {
                        const latestInfo = site.entries.map(en => en.runningSite || en.newSite).filter(Boolean).pop() || {};
                        setForm(f => ({...f, runningSite: {
                          siteName,
                          location: latestInfo.location || "",
                          numWorkers: latestInfo.numWorkers || "",
                          interlockType: latestInfo.interlockType || "",
                          totalWorkArea: latestInfo.totalWorkArea || "",
                          workCompletedToday: "",
                          materialsUnloaded: "",
                          equipmentAvailable: latestInfo.equipmentUnloaded || latestInfo.equipmentAvailable || "",
                          amountReceived: latestInfo.amountReceived || "",
                          totalCost: latestInfo.totalCost || "",
                          pendingAmount: latestInfo.pendingAmount || "",
                          progressStatus: "ongoing"
                        }}));
                      } else {
                        setForm(f => ({...f, runningSite: {...f.runningSite, siteName}}));
                      }
                    }} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Site Name (or type new)" value={form.runningSite.siteName} onChange={(e)=>setForm({...form,runningSite:{...form.runningSite,siteName:e.target.value}})} />
                  <Input label="Location" value={form.runningSite.location} onChange={(e)=>setForm({...form,runningSite:{...form.runningSite,location:e.target.value}})} />
                  <Input label="No. of Workers" type="number" value={form.runningSite.numWorkers} onChange={(e)=>setForm({...form,runningSite:{...form.runningSite,numWorkers:e.target.value}})} />
                  <Input label="Interlock Type" value={form.runningSite.interlockType} onChange={(e)=>setForm({...form,runningSite:{...form.runningSite,interlockType:e.target.value}})} />
                  <Input label="Total Work Area (sqft)" type="number" value={form.runningSite.totalWorkArea} onChange={(e)=>setForm({...form,runningSite:{...form.runningSite,totalWorkArea:e.target.value}})} />
                  <Input label="Work Completed Today (sqft)" type="number" value={form.runningSite.workCompletedToday} onChange={(e)=>setForm({...form,runningSite:{...form.runningSite,workCompletedToday:e.target.value}})} />
                </div>
                <Textarea label="Materials Unloaded" value={form.runningSite.materialsUnloaded} onChange={(e)=>setForm({...form,runningSite:{...form.runningSite,materialsUnloaded:e.target.value}})} />
                <Textarea label="Equipment Available" value={form.runningSite.equipmentAvailable} onChange={(e)=>setForm({...form,runningSite:{...form.runningSite,equipmentAvailable:e.target.value}})} />
                <Select label="Progress Status" value={form.runningSite.progressStatus} options={["ongoing","on-hold","near-completion"]} onChange={(e)=>setForm({...form,runningSite:{...form.runningSite,progressStatus:e.target.value}})} />
                <div className="grid grid-cols-3 gap-2">
                  <Input label={`Received (${CURRENCY})`} type="number" value={form.runningSite.amountReceived} onChange={(e)=>setForm({...form,runningSite:{...form.runningSite,amountReceived:e.target.value}})} />
                  <Input label={`Total Cost (${CURRENCY})`} type="number" value={form.runningSite.totalCost} onChange={(e)=>setForm({...form,runningSite:{...form.runningSite,totalCost:e.target.value}})} />
                  <Input label={`Pending (${CURRENCY})`} type="number" value={form.runningSite.pendingAmount} onChange={(e)=>setForm({...form,runningSite:{...form.runningSite,pendingAmount:e.target.value}})} />
                </div>
              </div>
            )}

            {activeSection === "completedsite" && (
              <div className="bg-green-50 rounded-xl p-3 space-y-2">
                <SectionTitle icon="✅" title="Completed Site Details" />
                <div className="mb-2">
                  <Select label="Select Running Site to Complete" value={form.completedSite.siteName}
                    options={[{value:"",label:"-- Select running site --"},...runningSites.map(s=>({value:s.name,label:s.name}))]}
                    onChange={(e) => {
                      const siteName = e.target.value;
                      const site = allSites[siteName];
                      if (site) {
                        const latestInfo = site.entries.map(en => en.runningSite || en.newSite).filter(Boolean).pop() || {};
                        setForm(f => ({...f, completedSite: {
                          siteName,
                          location: latestInfo.location || "",
                          completionDate: today(),
                          totalSqftCompleted: latestInfo.totalWorkArea || "",
                          interlockTypeUsed: latestInfo.interlockType || "",
                          totalWorkers: latestInfo.numWorkers || "",
                          totalCost: latestInfo.totalCost || "",
                          totalAmountReceived: latestInfo.amountReceived || "",
                          finalPendingAmount: latestInfo.pendingAmount || ""
                        }}));
                      } else {
                        setForm(f => ({...f, completedSite: {...f.completedSite, siteName}}));
                      }
                    }} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Site Name" value={form.completedSite.siteName} onChange={(e)=>setForm({...form,completedSite:{...form.completedSite,siteName:e.target.value}})} />
                  <Input label="Location" value={form.completedSite.location} onChange={(e)=>setForm({...form,completedSite:{...form.completedSite,location:e.target.value}})} />
                  <Input label="Completion Date" type="date" value={form.completedSite.completionDate} onChange={(e)=>setForm({...form,completedSite:{...form.completedSite,completionDate:e.target.value}})} />
                  <Input label="Total Sqft Completed" type="number" value={form.completedSite.totalSqftCompleted} onChange={(e)=>setForm({...form,completedSite:{...form.completedSite,totalSqftCompleted:e.target.value}})} />
                  <Input label="Interlock Type Used" value={form.completedSite.interlockTypeUsed} onChange={(e)=>setForm({...form,completedSite:{...form.completedSite,interlockTypeUsed:e.target.value}})} />
                  <Input label="Total Workers Used" type="number" value={form.completedSite.totalWorkers} onChange={(e)=>setForm({...form,completedSite:{...form.completedSite,totalWorkers:e.target.value}})} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input label={`Total Cost (${CURRENCY})`} type="number" value={form.completedSite.totalCost} onChange={(e)=>setForm({...form,completedSite:{...form.completedSite,totalCost:e.target.value}})} />
                  <Input label={`Received (${CURRENCY})`} type="number" value={form.completedSite.totalAmountReceived} onChange={(e)=>setForm({...form,completedSite:{...form.completedSite,totalAmountReceived:e.target.value}})} />
                  <Input label={`Pending (${CURRENCY})`} type="number" value={form.completedSite.finalPendingAmount} onChange={(e)=>setForm({...form,completedSite:{...form.completedSite,finalPendingAmount:e.target.value}})} />
                </div>
              </div>
            )}

            {activeSection === "workers" && (
              <div className="bg-amber-50 rounded-xl p-3 space-y-2">
                <SectionTitle icon="👷" title="Workers Details" />
                <Input label="Site Name" value={form.workerSite} onChange={(e)=>setForm({...form,workerSite:e.target.value})} placeholder="Which site" />
                {(form.workers||[]).map((w,i) => (
                  <div key={w.id} className="bg-white border border-amber-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between"><span className="text-xs font-bold text-amber-700">Worker {i+1}</span><button onClick={()=>setForm(f=>({...f,workers:f.workers.filter(x=>x.id!==w.id)}))} className="text-red-400 text-lg">×</button></div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Name / Team" value={w.name} onChange={(e)=>setForm(f=>({...f,workers:f.workers.map(x=>x.id===w.id?{...x,name:e.target.value}:x)}))} />
                      <Select label="Attendance" value={w.attendance} options={["Present","Absent","Half Day"]} onChange={(e)=>setForm(f=>({...f,workers:f.workers.map(x=>x.id===w.id?{...x,attendance:e.target.value}:x)}))} />
                    </div>
                  </div>
                ))}
                <button onClick={()=>setForm(f=>({...f,workers:[...(f.workers||[]),emptyWorker()]}))} className="w-full bg-amber-500 text-white py-2 rounded-xl text-sm font-bold hover:bg-amber-600">+ Add Worker</button>
              </div>
            )}

            {activeSection === "material" && (
              <div className="bg-orange-50 rounded-xl p-3 space-y-2">
                <SectionTitle icon="🧱" title="Material Supply" />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Site Name" value={form.materialSupply.siteName} onChange={(e)=>setForm({...form,materialSupply:{...form.materialSupply,siteName:e.target.value}})} />
                  <Input label="Material Name" value={form.materialSupply.materialName} onChange={(e)=>setForm({...form,materialSupply:{...form.materialSupply,materialName:e.target.value}})} />
                  <Input label="Quantity" value={form.materialSupply.qty} onChange={(e)=>setForm({...form,materialSupply:{...form.materialSupply,qty:e.target.value}})} />
                  <Input label="Supplier" value={form.materialSupply.supplier} onChange={(e)=>setForm({...form,materialSupply:{...form.materialSupply,supplier:e.target.value}})} />
                </div>
                <Textarea label="Delivery Details" value={form.materialSupply.deliveryDetails} onChange={(e)=>setForm({...form,materialSupply:{...form.materialSupply,deliveryDetails:e.target.value}})} />
              </div>
            )}

            {activeSection === "complaints" && (
              <div className="bg-red-50 rounded-xl p-3 space-y-2">
                <SectionTitle icon="⚠️" title="Complaints" />
                {(form.complaints||[]).map((c,i) => (
                  <div key={c.id} className="bg-white border border-red-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between"><span className="text-xs font-bold text-red-600">Complaint {i+1}</span><button onClick={()=>setForm(f=>({...f,complaints:f.complaints.filter(x=>x.id!==c.id)}))} className="text-red-400 text-lg">×</button></div>
                    <Input label="Site Name" value={c.siteName||""} onChange={(e)=>setForm(f=>({...f,complaints:f.complaints.map(x=>x.id===c.id?{...x,siteName:e.target.value}:x)}))} />
                    <Textarea label="Description" value={c.description} onChange={(e)=>setForm(f=>({...f,complaints:f.complaints.map(x=>x.id===c.id?{...x,description:e.target.value}:x)}))} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Reported By" value={c.reportedBy} onChange={(e)=>setForm(f=>({...f,complaints:f.complaints.map(x=>x.id===c.id?{...x,reportedBy:e.target.value}:x)}))} />
                      <Input label="Action Taken" value={c.actionTaken} onChange={(e)=>setForm(f=>({...f,complaints:f.complaints.map(x=>x.id===c.id?{...x,actionTaken:e.target.value}:x)}))} />
                    </div>
                  </div>
                ))}
                <button onClick={()=>setForm(f=>({...f,complaints:[...(f.complaints||[]),emptyComplaint()]}))} className="w-full bg-red-500 text-white py-2 rounded-xl text-sm font-bold hover:bg-red-600">+ Add Complaint</button>
              </div>
            )}

            {activeSection === "payments" && (
              <div className="bg-green-50 rounded-xl p-3 space-y-2">
                <SectionTitle icon="💰" title="Payments" />
                {(form.payments||[]).map((p,i) => (
                  <div key={p.id} className="bg-white border border-green-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between"><span className="text-xs font-bold text-green-600">Payment {i+1}</span><button onClick={()=>setForm(f=>({...f,payments:f.payments.filter(x=>x.id!==p.id)}))} className="text-red-400 text-lg">×</button></div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Site Name" value={p.siteName||""} onChange={(e)=>setForm(f=>({...f,payments:f.payments.map(x=>x.id===p.id?{...x,siteName:e.target.value}:x)}))} />
                      <Select label="Type" value={p.type} options={["Labour","Material","Equipment"]} onChange={(e)=>setForm(f=>({...f,payments:f.payments.map(x=>x.id===p.id?{...x,type:e.target.value}:x)}))} />
                      <Input label={`Amount (${CURRENCY})`} type="number" value={p.amount} onChange={(e)=>setForm(f=>({...f,payments:f.payments.map(x=>x.id===p.id?{...x,amount:e.target.value}:x)}))} />
                      <Input label="Paid To" value={p.paidTo} onChange={(e)=>setForm(f=>({...f,payments:f.payments.map(x=>x.id===p.id?{...x,paidTo:e.target.value}:x)}))} />
                      <Select label="Mode" value={p.mode} options={["Cash","Bank","GPay"]} onChange={(e)=>setForm(f=>({...f,payments:f.payments.map(x=>x.id===p.id?{...x,mode:e.target.value}:x)}))} />
                      <Input label="Date" type="date" value={p.date||today()} onChange={(e)=>setForm(f=>({...f,payments:f.payments.map(x=>x.id===p.id?{...x,date:e.target.value}:x)}))} />
                    </div>
                  </div>
                ))}
                <button onClick={()=>setForm(f=>({...f,payments:[...(f.payments||[]),emptyPayment()]}))} className="w-full bg-green-500 text-white py-2 rounded-xl text-sm font-bold hover:bg-green-600">+ Add Payment</button>
              </div>
            )}

            {activeSection === "daynotes" && (
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <SectionTitle icon="📝" title="Day Notes" />
                <Textarea label="Supervisor remarks" value={form.dayNotes} onChange={(e)=>setForm({...form,dayNotes:e.target.value})} placeholder="Daily observations..." />
              </div>
            )}

            {activeSection === "expenses" && (
              <div className="bg-purple-50 rounded-xl p-3 space-y-2">
                <SectionTitle icon="💸" title="Expenses" />
                {(form.expenses||[]).map((e,i) => (
                  <div key={e.id} className="bg-white border border-purple-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between"><span className="text-xs font-bold text-purple-600">Expense {i+1}</span><button onClick={()=>setForm(f=>({...f,expenses:f.expenses.filter(x=>x.id!==e.id)}))} className="text-red-400 text-lg">×</button></div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Type" value={e.type} onChange={(ev)=>setForm(f=>({...f,expenses:f.expenses.map(x=>x.id===e.id?{...x,type:ev.target.value}:x)}))} />
                      <Input label="Site Name" value={e.siteName||""} onChange={(ev)=>setForm(f=>({...f,expenses:f.expenses.map(x=>x.id===e.id?{...x,siteName:ev.target.value}:x)}))} />
                      <Input label={`Amount (${CURRENCY})`} type="number" value={e.amount} onChange={(ev)=>setForm(f=>({...f,expenses:f.expenses.map(x=>x.id===e.id?{...x,amount:ev.target.value}:x)}))} />
                      <Input label="Date" type="date" value={e.date||today()} onChange={(ev)=>setForm(f=>({...f,expenses:f.expenses.map(x=>x.id===e.id?{...x,date:ev.target.value}:x)}))} />
                    </div>
                    <Textarea label="Description" value={e.description} onChange={(ev)=>setForm(f=>({...f,expenses:f.expenses.map(x=>x.id===e.id?{...x,description:ev.target.value}:x)}))} />
                  </div>
                ))}
                <button onClick={()=>setForm(f=>({...f,expenses:[...(f.expenses||[]),emptyExpense()]}))} className="w-full bg-purple-500 text-white py-2 rounded-xl text-sm font-bold hover:bg-purple-600">+ Add Expense</button>
              </div>
            )}

            <button onClick={save} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 text-base">Submit Report</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function WorkPlanning({ siteWorks, user }) {
  const [plans, setPlans] = useState([]);
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const emptyForm = { fromDate: today(), toDate: "", site: "", isNewSite: false, siteWork: "", materialsNeeded: "", payments: "", workersSettling: "", notes: "", status: "planned" };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    api("GET", "/workplan").then((d) => { setPlans(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const save = async () => {
    const item = await api("POST", "/workplan", { ...form, addedBy: user.name });
    setPlans((p) => [item, ...p]);
    setModal(false); setForm(emptyForm);
  };

  const updateStatus = async (id, status) => {
    await api("PUT", `/workplan/${id}`, { status });
    setPlans((p) => p.map((x) => x._id === id ? { ...x, status } : x));
  };

  const statusColors = { planned: "blue", "in-progress": "yellow", completed: "green", cancelled: "red" };

  if (loading) return <Loader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">📅 Work Planning</h2>
        <button onClick={() => { setForm(emptyForm); setModal(true); }} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ New Plan</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {["planned","in-progress","completed","cancelled"].map((s) => (
          <div key={s} className="bg-white border rounded-xl p-3 text-center shadow-sm">
            <div className="text-xl font-black">{plans.filter(p=>p.status===s).length}</div>
            <div className="text-xs text-gray-500 capitalize">{s}</div>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {plans.length === 0 && <div className="bg-white rounded-2xl border p-8 text-center text-gray-400">No work plans yet</div>}
        {plans.map((p) => (
          <div key={p._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-gray-900">{p.site}</h3>
                  <Badge color={statusColors[p.status]}>{p.status}</Badge>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">📅 {p.fromDate} → {p.toDate}</div>
              </div>
              <button onClick={() => setViewModal(p)} className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-100 shrink-0">View</button>
            </div>
            {p.siteWork && <div className="mt-2 bg-gray-50 rounded-xl p-2 text-xs text-gray-700">🏗️ {p.siteWork}</div>}
            {p.workersSettling && <div className="mt-1 bg-amber-50 border border-amber-200 rounded-xl p-2 text-xs text-amber-800">👷 {p.workersSettling}</div>}
            <div className="mt-3 flex gap-2 flex-wrap">
              {["planned","in-progress","completed","cancelled"].filter(s=>s!==p.status).map(s=>(
                <button key={s} onClick={()=>updateStatus(p._id,s)} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-200 capitalize">→ {s}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <Modal title="New Work Plan (1 Week)" onClose={() => setModal(false)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="From Date" type="date" value={form.fromDate} onChange={(e)=>setForm({...form,fromDate:e.target.value})} />
              <Input label="To Date" type="date" value={form.toDate} onChange={(e)=>setForm({...form,toDate:e.target.value})} />
            </div>
            <div>
              <Select label="Site" value={form.isNewSite?"__new__":form.site} options={[{value:"",label:"Select site..."},...siteWorks.map(s=>({value:s.customerName,label:s.customerName})),{value:"__new__",label:"+ New Site"}]} onChange={(e)=>{ if(e.target.value==="__new__"){setForm({...form,isNewSite:true,site:""})}else{setForm({...form,isNewSite:false,site:e.target.value})}}} />
              {form.isNewSite && <Input label="New Site Name" value={form.site} onChange={(e)=>setForm({...form,site:e.target.value})} placeholder="Enter new site name" />}
            </div>
            <div className="bg-blue-50 rounded-xl p-3 space-y-2"><SectionTitle icon="🏗️" title="Site Work Plan" /><Textarea label="" value={form.siteWork} onChange={(e)=>setForm({...form,siteWork:e.target.value})} placeholder="What site work is planned this week..." /></div>
            <div className="bg-orange-50 rounded-xl p-3 space-y-2"><SectionTitle icon="🧱" title="Materials Needed" /><Textarea label="" value={form.materialsNeeded} onChange={(e)=>setForm({...form,materialsNeeded:e.target.value})} placeholder="Materials required this week..." /></div>
            <div className="bg-green-50 rounded-xl p-3 space-y-2"><SectionTitle icon="💰" title="Payments Plan" /><Textarea label="" value={form.payments} onChange={(e)=>setForm({...form,payments:e.target.value})} placeholder="Expected payments..." /></div>
            <div className="bg-amber-50 rounded-xl p-3 space-y-2"><SectionTitle icon="👷" title="Workers Settling" /><Textarea label="" value={form.workersSettling} onChange={(e)=>setForm({...form,workersSettling:e.target.value})} placeholder="Worker allocation and settling plan..." /></div>
            <Textarea label="📝 Notes" value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})} placeholder="Any additional notes..." />
            <button onClick={save} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-bold hover:bg-amber-600">Save Work Plan</button>
          </div>
        </Modal>
      )}
      {viewModal && (
        <Modal title="Work Plan Details" onClose={() => setViewModal(null)}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap"><h3 className="font-black text-gray-900 text-lg">{viewModal.site}</h3><Badge color={statusColors[viewModal.status]}>{viewModal.status}</Badge></div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center"><div className="text-sm font-bold text-blue-700">📅 {viewModal.fromDate} → {viewModal.toDate}</div></div>
            {[{icon:"🏗️",label:"Site Work",value:viewModal.siteWork,color:"bg-blue-50 border-blue-200"},{icon:"🧱",label:"Materials Needed",value:viewModal.materialsNeeded,color:"bg-orange-50 border-orange-200"},{icon:"💰",label:"Payments Plan",value:viewModal.payments,color:"bg-green-50 border-green-200"},{icon:"👷",label:"Workers Settling",value:viewModal.workersSettling,color:"bg-amber-50 border-amber-200"},{icon:"📝",label:"Notes",value:viewModal.notes,color:"bg-gray-50 border-gray-200"}].filter(x=>x.value).map(({icon,label,value,color})=>(
              <div key={label} className={`border rounded-xl p-3 ${color}`}><div className="text-xs font-bold text-gray-500 mb-1">{icon} {label}</div><div className="text-sm text-gray-700 whitespace-pre-wrap">{value}</div></div>
            ))}
            <div className="text-xs text-gray-400">By: {viewModal.addedBy}</div>
          </div>
        </Modal>
      )}
    </div>
  );
}
function SiteWork({ siteWorks, setSiteWorks, user }) {
  const [modal, setModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [form, setForm] = useState({ date: today(), workStatus: "ongoing", totalAmount: "", paidAmount: "", items: [] });
  const [newItem, setNewItem] = useState({ size: "", qty: "", unit: "sqm" });
  const [filterStatus, setFilterStatus] = useState("all");

  const addItem = () => {
    if (!newItem.size || !newItem.qty) return;
    setForm((f) => ({ ...f, items: [...(f.items || []), { ...newItem, qty: +newItem.qty, id: Date.now() }] }));
    setNewItem({ size: "", qty: "", unit: "sqm" });
  };
  const removeItem = (id) => setForm((f) => ({ ...f, items: f.items.filter((i) => i.id !== id) }));

  const save = async () => {
    const total = +form.totalAmount, paid = +form.paidAmount;
    const data = { ...form, totalAmount: total, paidAmount: paid, pendingAmount: total - paid, addedBy: user.name };
    if (modal === "add") { const item = await api("POST", "/sitework", data); setSiteWorks((p) => [item, ...p]); }
    else { const item = await api("PUT", `/sitework/${form._id}`, data); setSiteWorks((p) => p.map((s) => s._id === form._id ? item : s)); }
    setModal(null);
    setForm({ date: today(), workStatus: "ongoing", totalAmount: "", paidAmount: "", items: [] });
  };

  const addPayment = async () => {
    const extra = +payAmount;
    const newPaid = (payModal.paidAmount || 0) + extra;
    const newPending = Math.max(0, (payModal.pendingAmount || 0) - extra);
    const updates = { paidAmount: newPaid, pendingAmount: newPending, ...(newPending === 0 ? { workStatus: "completed" } : {}) };
    await api("PUT", `/sitework/${payModal._id}`, updates);
    setSiteWorks((p) => p.map((s) => s._id === payModal._id ? { ...s, ...updates } : s));
    setPayModal(null); setPayAmount("");
  };

  const del = async (id) => {
    if (confirm("Delete this site work?")) { await api("DELETE", `/sitework/${id}`); setSiteWorks((p) => p.filter((s) => s._id !== id)); }
  };

  const filtered = filterStatus === "all" ? siteWorks : siteWorks.filter((s) => s.workStatus === filterStatus);
  const totalWork = siteWorks.reduce((a, s) => a + (s.totalAmount || 0), 0);
  const totalPaid = siteWorks.reduce((a, s) => a + (s.paidAmount || 0), 0);
  const totalPending = siteWorks.reduce((a, s) => a + (s.pendingAmount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">🏗️ Site Work</h2>
        <button onClick={() => { setForm({ date: today(), workStatus: "ongoing", totalAmount: "", paidAmount: "", items: [] }); setModal("add"); }} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ Add Site</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border rounded-xl p-3 text-center shadow-sm"><div className="text-lg font-black">{CURRENCY}{fmt(totalWork)}</div><div className="text-xs text-gray-500">Total</div></div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center shadow-sm"><div className="text-lg font-black text-green-700">{CURRENCY}{fmt(totalPaid)}</div><div className="text-xs text-gray-500">Paid</div></div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center shadow-sm"><div className="text-lg font-black text-red-600">{CURRENCY}{fmt(totalPending)}</div><div className="text-xs text-gray-500">Pending</div></div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {["all", "ongoing", "completed", "on-hold"].map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${filterStatus === s ? "bg-amber-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {s} {s !== "all" && `(${siteWorks.filter((x) => x.workStatus === s).length})`}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.length === 0 && <div className="bg-white rounded-2xl border p-8 text-center text-gray-400">No site work entries yet</div>}
        {filtered.map((s) => (
          <div key={s._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap"><h3 className="font-black text-gray-900">{s.customerName}</h3><Badge color={s.workStatus === "completed" ? "green" : s.workStatus === "ongoing" ? "blue" : "yellow"}>{s.workStatus}</Badge></div>
                <div className="text-xs text-gray-400 mt-0.5">📍 {s.location} · 📅 {s.date}</div>
                {s.notes && <div className="text-xs text-gray-500 mt-1 italic">📝 {s.notes}</div>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setViewModal(s)} className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-100">View</button>
                <button onClick={() => { setForm({ ...s, items: s.items || [] }); setModal("edit"); }} className="text-xs bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-100">Edit</button>
                <button onClick={() => del(s._id)} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-100">Del</button>
              </div>
            </div>
            {s.items?.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{s.items.map((item, i) => <span key={i} className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-2 py-1 rounded-lg font-semibold">{item.size} — {item.qty} {item.unit}</span>)}</div>}
            <div className="mt-3 bg-gray-50 rounded-xl p-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><div className="text-sm font-black text-gray-900">{CURRENCY}{fmt(s.totalAmount)}</div><div className="text-xs text-gray-500">Total</div></div>
                <div><div className="text-sm font-black text-green-700">{CURRENCY}{fmt(s.paidAmount)}</div><div className="text-xs text-gray-500">Paid</div></div>
                <div><div className="text-sm font-black text-red-600">{CURRENCY}{fmt(s.pendingAmount)}</div><div className="text-xs text-gray-500">Pending</div></div>
              </div>
              {s.totalAmount > 0 && <div className="mt-2 bg-gray-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(100, Math.round((s.paidAmount / s.totalAmount) * 100))}%` }} /></div>}
            </div>
            {s.pendingAmount > 0 && <button onClick={() => { setPayModal(s); setPayAmount(""); }} className="mt-3 w-full bg-green-500 text-white py-2 rounded-xl text-sm font-bold hover:bg-green-600">+ Add Payment Received</button>}
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={modal === "add" ? "Add Site Work" : "Edit Site Work"} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Customer Name" value={form.customerName || ""} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
              <Input label="Location" value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <Select label="Status" value={form.workStatus} options={[{ value: "ongoing", label: "🔄 Ongoing" }, { value: "completed", label: "✅ Completed" }, { value: "on-hold", label: "⏸️ On Hold" }]} onChange={(e) => setForm({ ...form, workStatus: e.target.value })} />
            </div>
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <SectionTitle icon="🧱" title="Interlock Sizes Unloaded" />
              {(form.items || []).map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-white border rounded-lg px-3 py-2">
                  <span className="text-sm font-semibold text-amber-700">{item.size} — {item.qty} {item.unit}</span>
                  <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 text-lg">×</button>
                </div>
              ))}
              <div className="flex gap-2">
                <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none" placeholder="Size (e.g. 200x100mm)" value={newItem.size} onChange={(e) => setNewItem({ ...newItem, size: e.target.value })} />
                <input type="number" className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none" placeholder="Qty" value={newItem.qty} onChange={(e) => setNewItem({ ...newItem, qty: e.target.value })} />
                <select className="border border-gray-200 rounded-lg px-2 py-2 text-sm bg-white" value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}><option>sqm</option><option>nos</option><option>pcs</option></select>
                <button onClick={addItem} className="bg-amber-500 text-white px-3 py-2 rounded-lg font-bold hover:bg-amber-600">+</button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <SectionTitle icon="💰" title="Payment Details" />
              <div className="grid grid-cols-2 gap-3">
                <Input label={`Total (${CURRENCY})`} type="number" value={form.totalAmount || ""} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} />
                <Input label={`Paid (${CURRENCY})`} type="number" value={form.paidAmount || ""} onChange={(e) => setForm({ ...form, paidAmount: e.target.value })} />
              </div>
              {form.totalAmount && form.paidAmount !== "" && <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center"><span className="text-xs text-red-600 font-semibold">Pending: </span><span className="text-sm font-black text-red-700">{CURRENCY}{fmt(Math.max(0, +form.totalAmount - +form.paidAmount))}</span></div>}
            </div>
            <Input label="Notes" value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <button onClick={save} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-bold hover:bg-amber-600">{modal === "add" ? "Add Site Work" : "Save Changes"}</button>
          </div>
        </Modal>
      )}

      {viewModal && (
        <Modal title="Site Work Details" onClose={() => setViewModal(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[["Customer", viewModal.customerName], ["Location", viewModal.location], ["Date", viewModal.date], ["Status", viewModal.workStatus]].map(([l, v]) => (
                <div key={l} className="bg-gray-50 rounded-xl p-3"><div className="text-xs text-gray-500">{l}</div><div className="font-bold text-gray-900">{v}</div></div>
              ))}
            </div>
            {viewModal.items?.length > 0 && <div><SectionTitle icon="🧱" title="Interlock Items" />{viewModal.items.map((item, i) => <div key={i} className="flex justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 mb-1"><span className="font-semibold text-amber-800">{item.size}</span><span className="font-black text-amber-900">{item.qty} {item.unit}</span></div>)}</div>}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 border rounded-xl p-3 text-center"><div className="text-lg font-black">{CURRENCY}{fmt(viewModal.totalAmount)}</div><div className="text-xs text-gray-500">Total</div></div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center"><div className="text-lg font-black text-green-700">{CURRENCY}{fmt(viewModal.paidAmount)}</div><div className="text-xs text-gray-500">Paid</div></div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center"><div className="text-lg font-black text-red-600">{CURRENCY}{fmt(viewModal.pendingAmount)}</div><div className="text-xs text-gray-500">Pending</div></div>
            </div>
          </div>
        </Modal>
      )}

      {payModal && (
        <Modal title="Add Payment" onClose={() => setPayModal(null)}>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4"><div className="font-bold">{payModal.customerName}</div><div className="text-xs text-red-600 font-bold mt-1">Pending: {CURRENCY}{fmt(payModal.pendingAmount)}</div></div>
            <Input label={`Amount Received (${CURRENCY})`} type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            {payAmount && <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center"><div className="text-xs text-green-600">Remaining</div><div className="text-xl font-black text-green-700">{CURRENCY}{fmt(Math.max(0, payModal.pendingAmount - +payAmount))}</div></div>}
            <button onClick={addPayment} className="w-full bg-green-500 text-white py-2.5 rounded-xl font-bold hover:bg-green-600">Confirm Payment</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── STOCK ────────────────────────────────────────────────────────────────────
function Stock({ stock, setStock, user }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const canEdit = user.role !== "user";
  const save = async () => {
    if (modal === "add") { const item = await api("POST", "/stock", { ...form, qty: +form.qty, minQty: +form.minQty, price: +form.price }); setStock((p) => [...p, item]); }
    else { const item = await api("PUT", `/stock/${form._id}`, { ...form, qty: +form.qty, minQty: +form.minQty, price: +form.price }); setStock((p) => p.map((s) => s._id === form._id ? item : s)); }
    setModal(null);
  };
  const del = async (id) => { if (confirm("Delete?")) { await api("DELETE", `/stock/${id}`); setStock((p) => p.filter((s) => s._id !== id)); } };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-xl font-black text-gray-900">📦 Stock</h2>{canEdit && <button onClick={() => { setForm({ unit: "sqm" }); setModal("add"); }} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ Add</button>}</div>
      <div className="grid gap-3">
        {stock.map((s) => { const low = s.qty < s.minQty; return (
          <div key={s._id} className={`bg-white rounded-2xl border ${low ? "border-red-200" : "border-gray-100"} shadow-sm p-4`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap"><h3 className="font-bold text-gray-900">{s.name}</h3>{low && <Badge color="red">Low</Badge>}</div>
                <div className="mt-2 flex gap-4 flex-wrap text-xs text-gray-500">
                  <span>Qty: <b>{fmt(s.qty)} {s.unit}</b></span><span>Min: <b>{s.minQty}</b></span><span>Price: <b>{CURRENCY}{s.price}</b></span><span>Value: <b className="text-emerald-700">{CURRENCY}{fmt(s.qty * s.price)}</b></span>
                </div>
                <div className="mt-2 bg-gray-100 rounded-full h-2 max-w-xs"><div className={`h-2 rounded-full ${low ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, (s.qty / (s.minQty * 3)) * 100)}%` }} /></div>
              </div>
              {canEdit && <div className="flex gap-2"><button onClick={() => { setForm({ ...s }); setModal("edit"); }} className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-semibold">Edit</button><button onClick={() => del(s._id)} className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg font-semibold">Del</button></div>}
            </div>
          </div>
        );})}
      </div>
      {modal && <Modal title={modal === "add" ? "Add Stock" : "Edit Stock"} onClose={() => setModal(null)}>
        <div className="space-y-3">
          <Input label="Name" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3"><Input label="Qty" type="number" value={form.qty || ""} onChange={(e) => setForm({ ...form, qty: e.target.value })} /><Input label="Unit" value={form.unit || ""} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3"><Input label="Min Qty" type="number" value={form.minQty || ""} onChange={(e) => setForm({ ...form, minQty: e.target.value })} /><Input label={`Price (${CURRENCY})`} type="number" value={form.price || ""} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
          <button onClick={save} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-bold hover:bg-amber-600">{modal === "add" ? "Add" : "Save"}</button>
        </div>
      </Modal>}
    </div>
  );
}

// ─── RAW MATERIAL ─────────────────────────────────────────────────────────────
function RawMaterial({ raw, setRaw, user }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const canEdit = user.role !== "user";
  const save = async () => {
    if (modal === "add") { const item = await api("POST", "/raw", { ...form, qty: +form.qty, minQty: +form.minQty, costPerUnit: +form.costPerUnit, lastPurchase: today() }); setRaw((p) => [...p, item]); }
    else { const item = await api("PUT", `/raw/${form._id}`, { ...form, qty: +form.qty, minQty: +form.minQty, costPerUnit: +form.costPerUnit }); setRaw((p) => p.map((r) => r._id === form._id ? item : r)); }
    setModal(null);
  };
  const del = async (id) => { if (confirm("Delete?")) { await api("DELETE", `/raw/${id}`); setRaw((p) => p.filter((r) => r._id !== id)); } };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-xl font-black text-gray-900">🧱 Raw Material</h2>{canEdit && <button onClick={() => { setForm({}); setModal("add"); }} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ Add</button>}</div>
      <div className="grid gap-3">
        {raw.map((r) => { const low = r.qty < r.minQty; return (
          <div key={r._id} className={`bg-white rounded-2xl border ${low ? "border-red-200" : "border-gray-100"} shadow-sm p-4`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2"><h3 className="font-bold text-gray-900">{r.material}</h3>{low && <Badge color="red">Low</Badge>}</div>
                <div className="text-xs text-gray-400 mb-2">{r.supplier} · {r.lastPurchase}</div>
                <div className="flex gap-4 flex-wrap text-xs text-gray-500"><span>Qty: <b>{r.qty} {r.unit}</b></span><span>Cost: <b>{CURRENCY}{r.costPerUnit}</b></span><span>Value: <b className="text-emerald-700">{CURRENCY}{fmt(r.qty * r.costPerUnit)}</b></span></div>
              </div>
              {canEdit && <div className="flex gap-2"><button onClick={() => { setForm({ ...r }); setModal("edit"); }} className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-semibold">Edit</button><button onClick={() => del(r._id)} className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg font-semibold">Del</button></div>}
            </div>
          </div>
        );})}
      </div>
      {modal && <Modal title={modal === "add" ? "Add Material" : "Edit Material"} onClose={() => setModal(null)}>
        <div className="space-y-3">
          <Input label="Material" value={form.material || ""} onChange={(e) => setForm({ ...form, material: e.target.value })} />
          <Input label="Supplier" value={form.supplier || ""} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          <div className="grid grid-cols-2 gap-3"><Input label="Qty" type="number" value={form.qty || ""} onChange={(e) => setForm({ ...form, qty: e.target.value })} /><Input label="Unit" value={form.unit || ""} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3"><Input label="Min Qty" type="number" value={form.minQty || ""} onChange={(e) => setForm({ ...form, minQty: e.target.value })} /><Input label={`Cost (${CURRENCY})`} type="number" value={form.costPerUnit || ""} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })} /></div>
          <button onClick={save} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-bold hover:bg-amber-600">{modal === "add" ? "Add" : "Save"}</button>
        </div>
      </Modal>}
    </div>
  );
}

// ─── PRODUCTION ───────────────────────────────────────────────────────────────
function Production({ production, setProduction, stock, user }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ date: today(), shift: "Morning", machine: "M-01", target: "", produced: "", notes: "" });
  const canApprove = user.role === "admin" || user.role === "supervisor";
  const save = async () => {
    const item = await api("POST", "/production", { ...form, target: +form.target, produced: +form.produced, supervisor: user.name, status: canApprove ? "approved" : "pending", product: form.product || stock[0]?.name || "Standard Interlock" });
    setProduction((p) => [item, ...p]); setModal(false);
    setForm({ date: today(), shift: "Morning", machine: "M-01", target: "", produced: "", notes: "" });
  };
  const approve = async (id) => { await api("PUT", `/production/${id}`, { status: "approved" }); setProduction((p) => p.map((x) => x._id === id ? { ...x, status: "approved" } : x)); };
  const reject = async (id) => { await api("PUT", `/production/${id}`, { status: "rejected" }); setProduction((p) => p.map((x) => x._id === id ? { ...x, status: "rejected" } : x)); };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-xl font-black text-gray-900">🏭 Production</h2><button onClick={() => setModal(true)} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ Log</button></div>
      <div className="grid grid-cols-3 gap-3">
        {["pending", "approved", "rejected"].map((s) => { const colors = { pending: "bg-yellow-50 border-yellow-200 text-yellow-700", approved: "bg-green-50 border-green-200 text-green-700", rejected: "bg-red-50 border-red-200 text-red-700" }; return <div key={s} className={`border rounded-xl p-3 text-center ${colors[s]}`}><div className="text-2xl font-black">{production.filter((p) => p.status === s).length}</div><div className="text-xs font-semibold capitalize">{s}</div></div>; })}
      </div>
      <div className="space-y-3">
        {production.map((p) => (
          <div key={p._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-2"><div><div className="font-bold text-sm">{p.product}</div><div className="text-xs text-gray-400">{p.date} · {p.shift} · {p.machine}</div>{p.notes && <div className="text-xs italic text-gray-500">📝 {p.notes}</div>}</div><Badge color={p.status === "approved" ? "green" : p.status === "rejected" ? "red" : "yellow"}>{p.status}</Badge></div>
            <div className="mt-3 flex gap-4 text-xs text-gray-500"><span>Target: <b>{p.target} sqm</b></span><span>Produced: <b className={p.produced >= p.target ? "text-green-600" : "text-orange-600"}>{p.produced} sqm</b></span><span>Eff: <b>{Math.round((p.produced / p.target) * 100)}%</b></span></div>
            <div className="mt-2 bg-gray-100 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${p.produced >= p.target ? "bg-green-500" : "bg-orange-400"}`} style={{ width: `${Math.min(100, (p.produced / p.target) * 100)}%` }} /></div>
            {canApprove && p.status === "pending" && <div className="mt-3 flex gap-2"><button onClick={() => approve(p._id)} className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg font-semibold">✓ Approve</button><button onClick={() => reject(p._id)} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-semibold">✗ Reject</button></div>}
          </div>
        ))}
      </div>
      {modal && <Modal title="Log Production" onClose={() => setModal(false)}>
        <div className="space-y-3">
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Select label="Product" value={form.product || stock[0]?.name} options={stock.map((s) => ({ value: s.name, label: s.name }))} onChange={(e) => setForm({ ...form, product: e.target.value })} />
          <div className="grid grid-cols-2 gap-3"><Select label="Shift" value={form.shift} options={["Morning", "Evening", "Night"]} onChange={(e) => setForm({ ...form, shift: e.target.value })} /><Select label="Machine" value={form.machine} options={["M-01", "M-02", "M-03", "M-04"]} onChange={(e) => setForm({ ...form, machine: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3"><Input label="Target (sqm)" type="number" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} /><Input label="Produced (sqm)" type="number" value={form.produced} onChange={(e) => setForm({ ...form, produced: e.target.value })} /></div>
          <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <button onClick={save} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-bold hover:bg-amber-600">Submit</button>
        </div>
      </Modal>}
    </div>
  );
}

// ─── SALES ────────────────────────────────────────────────────────────────────
function Sales({ sales, setSales, stock, user }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ date: today(), status: "pending" });
  const canEdit = user.role !== "user";
  const save = async () => { const qty = +form.qty, price = +form.unitPrice; const item = await api("POST", "/sales", { ...form, qty, unitPrice: price, total: qty * price, invoice: `INV-${String(sales.length + 1).padStart(3, "0")}` }); setSales((p) => [item, ...p]); setModal(false); setForm({ date: today(), status: "pending" }); };
  const markPaid = async (id) => { await api("PUT", `/sales/${id}`, { status: "paid" }); setSales((p) => p.map((s) => s._id === id ? { ...s, status: "paid" } : s)); };
  const del = async (id) => { if (confirm("Delete?")) { await api("DELETE", `/sales/${id}`); setSales((p) => p.filter((s) => s._id !== id)); } };
  const totalRevenue = sales.reduce((a, s) => a + s.total, 0);
  const collected = sales.filter((s) => s.status === "paid").reduce((a, s) => a + s.total, 0);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-xl font-black text-gray-900">💰 Sales</h2>{canEdit && <button onClick={() => { setForm({ date: today(), status: "pending" }); setModal(true); }} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ New</button>}</div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border rounded-xl p-3 text-center shadow-sm"><div className="text-lg font-black">{CURRENCY}{fmt(totalRevenue)}</div><div className="text-xs text-gray-500">Total</div></div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center shadow-sm"><div className="text-lg font-black text-green-700">{CURRENCY}{fmt(collected)}</div><div className="text-xs text-gray-500">Collected</div></div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center shadow-sm"><div className="text-lg font-black text-orange-600">{CURRENCY}{fmt(totalRevenue - collected)}</div><div className="text-xs text-gray-500">Outstanding</div></div>
      </div>
      <div className="space-y-3">
        {sales.map((s) => (
          <div key={s._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div><div className="font-bold">{s.customer}</div><div className="text-xs text-gray-400">{s.invoice} · {s.date}</div><div className="text-xs text-gray-600 mt-1">{s.product} · {s.qty} sqm @ {CURRENCY}{s.unitPrice}</div></div>
              <div className="text-right"><div className="font-black">{CURRENCY}{fmt(s.total)}</div><Badge color={s.status === "paid" ? "green" : s.status === "overdue" ? "red" : "yellow"}>{s.status}</Badge></div>
            </div>
            {canEdit && s.status !== "paid" && <div className="mt-3 flex gap-2"><button onClick={() => markPaid(s._id)} className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg font-semibold">✓ Paid</button><button onClick={() => del(s._id)} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-semibold">Del</button></div>}
          </div>
        ))}
      </div>
      {modal && <Modal title="New Sale" onClose={() => setModal(false)}>
        <div className="space-y-3">
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label="Customer" value={form.customer || ""} onChange={(e) => setForm({ ...form, customer: e.target.value })} />
          <Select label="Product" value={form.product || stock[0]?.name} options={stock.map((s) => ({ value: s.name, label: s.name }))} onChange={(e) => setForm({ ...form, product: e.target.value })} />
          <div className="grid grid-cols-2 gap-3"><Input label="Qty (sqm)" type="number" value={form.qty || ""} onChange={(e) => setForm({ ...form, qty: e.target.value })} /><Input label={`Price (${CURRENCY})`} type="number" value={form.unitPrice || ""} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} /></div>
          {form.qty && form.unitPrice && <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center"><div className="text-xs text-amber-700">Total</div><div className="text-2xl font-black text-amber-800">{CURRENCY}{fmt(+form.qty * +form.unitPrice)}</div></div>}
          <Select label="Status" value={form.status} options={["pending", "paid", "overdue"]} onChange={(e) => setForm({ ...form, status: e.target.value })} />
          <button onClick={save} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-bold hover:bg-amber-600">Record Sale</button>
        </div>
      </Modal>}
    </div>
  );
}

// ─── USERS ────────────────────────────────────────────────────────────────────
function Users({ currentUser, allUsers, setAllUsers }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ role: "user" });
  const save = async () => { const user = await api("POST", "/users", form); setAllUsers((p) => [...p, user]); setModal(false); setForm({ role: "user" }); };
  const toggleActive = async (u) => { if (u._id === currentUser.id) return; await api("PUT", `/users/${u._id}`, { active: !u.active }); setAllUsers((p) => p.map((x) => x._id === u._id ? { ...x, active: !x.active } : x)); };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-xl font-black text-gray-900">👥 Users</h2><button onClick={() => { setForm({ role: "user" }); setModal(true); }} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ Add</button></div>
      <div className="space-y-3">
        {allUsers.map((u) => (
          <div key={u._id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 ${u.active === false ? "opacity-50" : ""}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-sm shrink-0">{u.avatar}</div>
            <div className="flex-1"><div className="font-bold">{u.name}</div><div className="text-xs text-gray-400">@{u.username}</div></div>
            <div className="flex items-center gap-2">
              <Badge color={u.role === "admin" ? "purple" : u.role === "supervisor" ? "blue" : "gray"}>{u.role}</Badge>
              {u._id !== currentUser.id && <button onClick={() => toggleActive(u)} className={`text-xs px-3 py-1.5 rounded-lg font-semibold ${u.active === false ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"}`}>{u.active === false ? "Activate" : "Deactivate"}</button>}
            </div>
          </div>
        ))}
      </div>
      {modal && <Modal title="Add User" onClose={() => setModal(false)}>
        <div className="space-y-3">
          <Input label="Full Name" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Username" value={form.username || ""} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <Input label="Password" type="password" value={form.password || ""} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Select label="Role" value={form.role} options={["user", "supervisor", "admin"]} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          <button onClick={save} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-bold hover:bg-amber-600">Add User</button>
        </div>
      </Modal>}
    </div>
  );
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────
function Reports({ production, sales, stock, raw, siteWorks }) {
  const totalProd = production.reduce((a, p) => a + p.produced, 0);
  const totalTarget = production.reduce((a, p) => a + p.target, 0);
  const efficiency = totalTarget > 0 ? Math.round((totalProd / totalTarget) * 100) : 0;
  const totalSales = sales.reduce((a, s) => a + s.total, 0);
  const stockValue = stock.reduce((a, s) => a + s.qty * s.price, 0);
  const totalSiteWork = siteWorks.reduce((a, s) => a + (s.totalAmount || 0), 0);
  const totalSitePending = siteWorks.reduce((a, s) => a + (s.pendingAmount || 0), 0);
  const byProduct = {};
  production.forEach((p) => { byProduct[p.product] = (byProduct[p.product] || 0) + p.produced; });
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-gray-900">📈 Reports</h2>
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon="🏭" label="Production" value={`${fmt(totalProd)} sqm`} sub={`Efficiency: ${efficiency}%`} color="amber" />
        <StatCard icon="💰" label="Sales" value={`${CURRENCY}${fmt(totalSales)}`} sub={`${sales.length} orders`} color="green" />
        <StatCard icon="🏗️" label="Site Work" value={`${CURRENCY}${fmt(totalSiteWork)}`} sub={`Pending: ${CURRENCY}${fmt(totalSitePending)}`} color="teal" />
        <StatCard icon="📦" label="Stock Value" value={`${CURRENCY}${fmt(stockValue)}`} sub={`${stock.length} types`} color="blue" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-900 mb-4">Production by Product</h3>
        {Object.entries(byProduct).sort((a, b) => b[1] - a[1]).map(([prod, qty]) => {
          const pct = totalProd > 0 ? Math.round((qty / totalProd) * 100) : 0;
          return (<div key={prod} className="mb-3"><div className="flex justify-between text-sm mb-1"><span className="font-medium truncate">{prod}</span><span className="font-bold shrink-0 ml-2">{fmt(qty)} sqm ({pct}%)</span></div><div className="bg-gray-100 rounded-full h-2"><div className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full" style={{ width: `${pct}%` }} /></div></div>);
        })}
      </div>
    </div>
  );
}

// ─── SUPERVISOR REPORTS (ADMIN VIEW) ─────────────────────────────────────────
function SupervisorReports({ allUsers }) {
  const [selectedSupervisor, setSelectedSupervisor] = useState("");
  const [siteWorks, setSiteWorks] = useState([]);
  const [workerReports, setWorkerReports] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);
  const [workPlans, setWorkPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const supervisors = allUsers.filter((u) => u.role === "supervisor");

  useEffect(() => {
    if (!selectedSupervisor) return;
    setLoading(true);
    Promise.all([
      api("GET", "/sitework"),
      api("GET", "/workerreport"),
      api("GET", "/dailyreport"),
      api("GET", "/workplan"),
    ]).then(([sw, wr, dr, wp]) => {
      setSiteWorks((Array.isArray(sw) ? sw : []).filter((x) => x.addedBy === selectedSupervisor));
      setWorkerReports((Array.isArray(wr) ? wr : []).filter((x) => x.addedBy === selectedSupervisor));
      setDailyReports((Array.isArray(dr) ? dr : []).filter((x) => x.addedBy === selectedSupervisor));
      setWorkPlans((Array.isArray(wp) ? wp : []).filter((x) => x.addedBy === selectedSupervisor));
      setLoading(false);
    });
  }, [selectedSupervisor]);

  const totalSiteWork = siteWorks.reduce((a, s) => a + (s.totalAmount || 0), 0);
  const totalPending = siteWorks.reduce((a, s) => a + (s.pendingAmount || 0), 0);
  const totalWorkerPay = workerReports.reduce((a, r) => a + (r.remuneration || 0), 0);
  const totalDayExpenses = dailyReports.reduce((a, r) => a + (r.expenseAmount || 0), 0);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-gray-900">🔍 Supervisor Reports</h2>

      {/* Supervisor selector */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Supervisor</label>
        <select className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50"
          value={selectedSupervisor} onChange={(e) => { setSelectedSupervisor(e.target.value); setActiveTab("all"); }}>
          <option value="">-- Select a Supervisor --</option>
          {supervisors.map((s) => <option key={s._id} value={s.name}>{s.name} (@{s.username})</option>)}
        </select>
      </div>

      {!selectedSupervisor && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-2">👆</div>
          <div className="text-amber-700 font-semibold">Select a supervisor to view their reports</div>
        </div>
      )}

      {loading && <Loader />}

      {selectedSupervisor && !loading && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon="🏗️" label="Site Works" value={siteWorks.length} sub={`Pending: ${CURRENCY}${fmt(totalPending)}`} color="teal" />
            <StatCard icon="👷" label="Worker Reports" value={workerReports.length} sub={`Pay: ${CURRENCY}${fmt(totalWorkerPay)}`} color="amber" />
            <StatCard icon="📋" label="Daily Reports" value={dailyReports.length} sub={`Expenses: ${CURRENCY}${fmt(totalDayExpenses)}`} color="purple" />
            <StatCard icon="📅" label="Work Plans" value={workPlans.length} sub={`${workPlans.filter((w) => w.status === "planned").length} planned`} color="blue" />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {["all", "sitework", "workers", "daily", "plans"].map((t) => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${activeTab === t ? "bg-amber-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                {t === "all" ? "All" : t === "sitework" ? "🏗️ Sites" : t === "workers" ? "👷 Workers" : t === "daily" ? "📋 Daily" : "📅 Plans"}
              </button>
            ))}
          </div>

          {/* Site Works */}
          {(activeTab === "all" || activeTab === "sitework") && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1"><span className="text-base">🏗️</span><h3 className="font-black text-gray-800">Site Works ({siteWorks.length})</h3></div>
              {siteWorks.length === 0 && <div className="bg-white rounded-xl border p-4 text-center text-gray-400 text-sm">No site works</div>}
              {siteWorks.map((s) => (
                <div key={s._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <div className="font-black text-gray-900">{s.customerName}</div>
                      <div className="text-xs text-gray-400">📍{s.location} · 📅{s.date}</div>
                    </div>
                    <Badge color={s.workStatus === "completed" ? "green" : s.workStatus === "ongoing" ? "blue" : "yellow"}>{s.workStatus}</Badge>
                  </div>
                  {s.items?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {s.items.map((item, i) => <span key={i} className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-2 py-0.5 rounded-lg">{item.size} — {item.qty} {item.unit}</span>)}
                    </div>
                  )}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-50 rounded-xl p-2"><div className="text-sm font-black">{CURRENCY}{fmt(s.totalAmount)}</div><div className="text-xs text-gray-500">Total</div></div>
                    <div className="bg-green-50 rounded-xl p-2"><div className="text-sm font-black text-green-700">{CURRENCY}{fmt(s.paidAmount)}</div><div className="text-xs text-gray-500">Paid</div></div>
                    <div className="bg-red-50 rounded-xl p-2"><div className="text-sm font-black text-red-600">{CURRENCY}{fmt(s.pendingAmount)}</div><div className="text-xs text-gray-500">Pending</div></div>
                  </div>
                  {s.totalAmount > 0 && <div className="mt-2 bg-gray-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(100, Math.round((s.paidAmount / s.totalAmount) * 100))}%` }} /></div>}
                </div>
              ))}
            </div>
          )}

          {/* Worker Reports */}
          {(activeTab === "all" || activeTab === "workers") && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1"><span className="text-base">👷</span><h3 className="font-black text-gray-800">Worker Reports ({workerReports.length})</h3></div>
              {workerReports.length === 0 && <div className="bg-white rounded-xl border p-4 text-center text-gray-400 text-sm">No worker reports</div>}
              {workerReports.map((r) => (
                <div key={r._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <div className="font-black text-gray-900">{r.workerName}</div>
                      <div className="text-xs text-gray-400">📅{r.date}</div>
                    </div>
                    <Badge color={r.paymentMode === "Cash" ? "green" : r.paymentMode === "Bank" ? "blue" : "purple"}>{r.paymentMode}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-amber-50 rounded-xl p-2"><div className="text-sm font-black text-amber-700">{CURRENCY}{fmt(r.remuneration)}</div><div className="text-xs text-gray-500">Daily Pay</div></div>
                    <div className="bg-blue-50 rounded-xl p-2"><div className="text-sm font-black text-blue-700">{r.workingArea} sqm</div><div className="text-xs text-gray-500">Area</div></div>
                    <div className="bg-green-50 rounded-xl p-2"><div className="text-sm font-black text-green-700">{CURRENCY}{fmt(r.workAmount)}</div><div className="text-xs text-gray-500">Work Amt</div></div>
                  </div>
                  {r.materialAmount > 0 && <div className="mt-2 text-xs bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5">🧱 Material: <span className="font-bold">{CURRENCY}{fmt(r.materialAmount)}</span></div>}
                  <div className="mt-2 flex gap-2">
                    {["supervisor", "office", "admin"].map((role) => (
                      <span key={role} className={`text-xs px-2 py-1 rounded-lg border ${r.signatures?.[role] ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 text-gray-400"}`}>
                        {r.signatures?.[role] ? "✓" : "○"} <span className="capitalize">{role}</span>
                      </span>
                    ))}
                  </div>
                  {r.notes && <div className="mt-2 text-xs text-gray-500 italic">📝 {r.notes}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Daily Reports */}
          {(activeTab === "all" || activeTab === "daily") && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1"><span className="text-base">📋</span><h3 className="font-black text-gray-800">Daily Reports ({dailyReports.length})</h3></div>
              {dailyReports.length === 0 && <div className="bg-white rounded-xl border p-4 text-center text-gray-400 text-sm">No daily reports</div>}
              {dailyReports.map((r) => (
                <div key={r._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="font-black text-gray-900">📅 {r.date}</div>
                  <div className="mt-2 space-y-2">
                    {r.newSiteDetails && <div className="bg-blue-50 border border-blue-200 rounded-xl p-3"><div className="text-xs font-bold text-blue-600 mb-1">🏗️ New Site</div><div className="text-xs text-gray-700">{r.newSiteDetails}</div></div>}
                    {r.workersDetails && <div className="bg-amber-50 border border-amber-200 rounded-xl p-3"><div className="text-xs font-bold text-amber-600 mb-1">👷 Workers</div><div className="text-xs text-gray-700">{r.workersDetails}</div></div>}
                    {r.materialsSupplied && <div className="bg-orange-50 border border-orange-200 rounded-xl p-3"><div className="text-xs font-bold text-orange-600 mb-1">🧱 Materials</div><div className="text-xs text-gray-700">{r.materialsSupplied}</div></div>}
                    {r.complaints && <div className="bg-red-50 border border-red-200 rounded-xl p-3"><div className="text-xs font-bold text-red-600 mb-1">⚠️ Complaints</div><div className="text-xs text-gray-700">{r.complaints}</div></div>}
                    {r.payments?.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                        <div className="text-xs font-bold text-green-600 mb-1">💰 Payments</div>
                        {r.payments.map((p, i) => <div key={i} className="flex justify-between text-xs"><span>{p.from} ({p.mode})</span><span className="font-bold">{CURRENCY}{fmt(p.amount)}</span></div>)}
                        <div className="text-xs font-black text-green-700 mt-1">Total: {CURRENCY}{fmt(r.payments.reduce((a, p) => a + p.amount, 0))}</div>
                      </div>
                    )}
                    {r.expenseAmount > 0 && <div className="bg-red-50 border border-red-200 rounded-xl p-3"><div className="text-xs font-bold text-red-600 mb-1">💸 Expenses</div><div className="text-xs text-gray-700">{r.dayExpenses}</div><div className="text-sm font-black text-red-700">{CURRENCY}{fmt(r.expenseAmount)}</div></div>}
                    {r.notes && <div className="bg-gray-50 rounded-xl p-3"><div className="text-xs font-bold text-gray-500 mb-1">📝 Notes</div><div className="text-xs text-gray-700">{r.notes}</div></div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Work Plans */}
          {(activeTab === "all" || activeTab === "plans") && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1"><span className="text-base">📅</span><h3 className="font-black text-gray-800">Work Plans ({workPlans.length})</h3></div>
              {workPlans.length === 0 && <div className="bg-white rounded-xl border p-4 text-center text-gray-400 text-sm">No work plans</div>}
              {workPlans.map((p) => (
                <div key={p._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <div className="font-black text-gray-900">{p.site}</div>
                      <div className="text-xs text-gray-400">📅 {p.fromDate} → {p.toDate}</div>
                    </div>
                    <Badge color={p.status === "completed" ? "green" : p.status === "in-progress" ? "yellow" : p.status === "cancelled" ? "red" : "blue"}>{p.status}</Badge>
                  </div>
                  {p.plannedWork && <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">🔨 {p.plannedWork}</div>}
                  {p.workersAllocated && <div className="mt-1 text-xs text-gray-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">👷 {p.workersAllocated}</div>}
                  {p.materialsNeeded && <div className="mt-1 text-xs text-gray-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">🧱 {p.materialsNeeded}</div>}
                  <div className="mt-2 flex gap-3 text-xs text-gray-500">
                    <span>Est: <span className="font-black text-amber-700">{CURRENCY}{fmt(p.estimatedCost)}</span></span>
                    {p.paymentPlan && <span>Payment: <span className="font-semibold">{p.paymentPlan}</span></span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── NAV ─────────────────────────────────────────────────────────────────────
const NAV = {
  admin: [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "stock", label: "Stock", icon: "📦" },
    { id: "raw", label: "Raw Material", icon: "🧱" },
    { id: "production", label: "Production", icon: "🏭" },
    { id: "sales", label: "Sales", icon: "💰" },
    { id: "sitework", label: "Site Work", icon: "🏗️" },
    { id: "dailyreport", label: "Supervisor Report", icon: "📋" },
    { id: "supervisorreports", label: "Supervisor Overview", icon: "🔍" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "reports", label: "Reports", icon: "📈" },
  ],
  supervisor: [
    { id: "workerreport", label: "Site Report", icon: "👷" },
    { id: "dailyreport", label: "Supervisor Report", icon: "📋" },
    { id: "workplan", label: "Work Planning", icon: "📅" },
  ],
  user: [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "production", label: "Log Production", icon: "🏭" },
    { id: "stock", label: "View Stock", icon: "📦" },
  ],
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
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

  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      Promise.all([api("GET", "/stock"), api("GET", "/raw"), api("GET", "/production"), api("GET", "/sales"), api("GET", "/users"), api("GET", "/sitework")])
        .then(([s, r, p, sa, u, sw]) => { setStock(s); setRaw(r); setProduction(p); setSales(sa); setAllUsers(u); setSiteWorks(Array.isArray(sw) ? sw : []); setLoading(false); });
    }
  }, [currentUser]);

  if (!currentUser) return <Login onLogin={(u) => { setCurrentUser(u); setPage(u.role === "supervisor" ? "workerreport" : "dashboard"); }} />;

  const nav = NAV[currentUser.role] || [];
  const roleColors = { admin: "from-violet-500 to-purple-600", supervisor: "from-emerald-500 to-green-600", user: "from-blue-500 to-blue-600" };

  const renderPage = () => {
    if (loading) return <Loader />;
    switch (page) {
      case "dashboard": return <Dashboard stock={stock} raw={raw} production={production} sales={sales} siteWorks={siteWorks} user={currentUser} />;
      case "stock": return <Stock stock={stock} setStock={setStock} user={currentUser} />;
      case "raw": return <RawMaterial raw={raw} setRaw={setRaw} user={currentUser} />;
      case "production": return <Production production={production} setProduction={setProduction} stock={stock} user={currentUser} />;
      case "sales": return <Sales sales={sales} setSales={setSales} stock={stock} user={currentUser} />;
      case "sitework": return <SiteWork siteWorks={siteWorks} setSiteWorks={setSiteWorks} user={currentUser} />;
      case "workerreport": return <WorkerReport user={currentUser} />;
      case "dailyreport": return <DailyReport siteWorks={siteWorks} user={currentUser} />;
      case "workplan": return <WorkPlanning siteWorks={siteWorks} user={currentUser} />;
      case "supervisorreports": return <SupervisorReports allUsers={allUsers} />;
      case "users": return currentUser.role === "admin" ? <Users currentUser={currentUser} allUsers={allUsers} setAllUsers={setAllUsers} /> : null;
      case "reports": return <Reports production={production} sales={sales} stock={stock} raw={raw} siteWorks={siteWorks} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-stone-900 z-30 flex flex-col transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:h-screen lg:flex`}>
        <div className="px-5 py-5 border-b border-stone-700">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{COMPANY.logo}</div>
            <div><div className="text-white font-black text-sm leading-tight">{COMPANY.name}</div><div className="text-stone-400 text-xs">Management System</div></div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map((item) => (
            <button key={item.id} onClick={() => { setPage(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${page === item.id ? "bg-amber-500 text-white shadow-lg" : "text-stone-400 hover:bg-stone-800 hover:text-white"}`}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-stone-700">
          <div className="flex items-center gap-3 bg-stone-800 rounded-xl px-3 py-3">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${roleColors[currentUser.role]} flex items-center justify-center text-white font-black text-xs shrink-0`}>{currentUser.avatar}</div>
            <div className="flex-1 min-w-0"><div className="text-white text-xs font-bold truncate">{currentUser.name}</div><div className="text-stone-400 text-xs capitalize">{currentUser.role}</div></div>
            <button onClick={() => setCurrentUser(null)} className="text-stone-500 hover:text-red-400 text-xs font-bold" title="Logout">⏻</button>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-gray-600 text-xl">☰</button>
          <h1 className="font-black text-gray-900 flex-1">{nav.find((n) => n.id === page)?.icon} {nav.find((n) => n.id === page)?.label}</h1>
          <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${roleColors[currentUser.role]} text-white text-xs font-bold`}>
            {currentUser.avatar} <span className="capitalize">{currentUser.role}</span>
          </div>
        </header>
        <main className="flex-1 p-4 overflow-y-auto max-w-3xl w-full mx-auto">{renderPage()}</main>
      </div>
    </div>
  );
}
