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
function WorkerReport({ siteWorks, user }) {
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const emptyForm = { startingDate: today(), siteId: "", workerName: "", workingCost: "", extraWork: "", extraMaterial: "", totalWorkingArea: "", totalAmount: "", paymentMode: "Cash", amountReceivedBy: "", materialSupply: "", notes: "", signatures: { supervisor: false, office: false, admin: false } };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    api("GET", "/workerreport").then((d) => { setReports(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const save = async () => {
    const data = { ...form, workingCost: +form.workingCost, extraWork: +form.extraWork, totalWorkingArea: +form.totalWorkingArea, totalAmount: +form.totalAmount, addedBy: user.name };
    const item = await api("POST", "/workerreport", data);
    setReports((p) => [item, ...p]);
    setModal(false);
    setForm(emptyForm);
  };

  const signReport = async (id, role) => {
    const report = reports.find((r) => r._id === id);
    const updatedSigs = { ...(report.signatures || {}), [role]: true };
    await api("PUT", `/workerreport/${id}`, { signatures: updatedSigs });
    setReports((p) => p.map((r) => r._id === id ? { ...r, signatures: updatedSigs } : r));
    if (viewModal?._id === id) setViewModal((v) => ({ ...v, signatures: updatedSigs }));
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">👷 Site Report</h2>
        <button onClick={() => { setForm(emptyForm); setModal(true); }} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ Add Report</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border rounded-xl p-3 text-center shadow-sm"><div className="text-lg font-black">{reports.length}</div><div className="text-xs text-gray-500">Total</div></div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center shadow-sm"><div className="text-lg font-black text-green-700">{CURRENCY}{fmt(reports.reduce((a, r) => a + (r.totalAmount || 0), 0))}</div><div className="text-xs text-gray-500">Total Amount</div></div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center shadow-sm"><div className="text-lg font-black text-amber-700">{reports.filter((r) => r.signatures?.supervisor && r.signatures?.office && r.signatures?.admin).length}</div><div className="text-xs text-gray-500">Fully Signed</div></div>
      </div>
      <div className="space-y-3">
        {reports.length === 0 && <div className="bg-white rounded-2xl border p-8 text-center text-gray-400">No site reports yet</div>}
        {reports.map((r) => {
          const allSigned = r.signatures?.supervisor && r.signatures?.office && r.signatures?.admin;
          const siteName = siteWorks.find((s) => s._id === r.siteId)?.customerName || "—";
          return (
            <div key={r._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-gray-900">{r.workerName}</h3>
                    <Badge color={r.paymentMode === "Cash" ? "green" : r.paymentMode === "Bank" ? "blue" : "purple"}>{r.paymentMode}</Badge>
                    {allSigned && <Badge color="green">✅ Fully Signed</Badge>}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">📅 {r.startingDate} · 🏗️ {siteName}</div>
                </div>
                <button onClick={() => setViewModal(r)} className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-100">View</button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded-xl p-2 text-center"><div className="text-sm font-black text-blue-700">{r.totalWorkingArea} sqm</div><div className="text-xs text-gray-500">Total Area</div></div>
                <div className="bg-green-50 rounded-xl p-2 text-center"><div className="text-sm font-black text-green-700">{CURRENCY}{fmt(r.totalAmount)}</div><div className="text-xs text-gray-500">Total Amount</div></div>
              </div>
              <div className="mt-3 flex gap-2 flex-wrap">
                {["supervisor", "office", "admin"].map((role) => (
                  <div key={role} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border ${r.signatures?.[role] ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 text-gray-500"}`}>
                    {r.signatures?.[role] ? "✓" : "○"} <span className="capitalize font-semibold">{role}</span>
                    {!r.signatures?.[role] && (user.role === role || user.role === "admin") && (
                      <button onClick={() => signReport(r._id, role)} className="ml-1 bg-green-500 text-white px-1.5 py-0.5 rounded text-xs font-bold hover:bg-green-600">Sign</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <Modal title="Add Site Report" onClose={() => setModal(false)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Starting Date" type="date" value={form.startingDate} onChange={(e) => setForm({ ...form, startingDate: e.target.value })} />
              <Select label="Site" value={form.siteId} options={[{ value: "", label: "Select site..." }, ...siteWorks.map((s) => ({ value: s._id, label: s.customerName }))]} onChange={(e) => setForm({ ...form, siteId: e.target.value })} />
            </div>
            <Input label="Worker Name" value={form.workerName} onChange={(e) => setForm({ ...form, workerName: e.target.value })} placeholder="Worker full name" />
            <div className="grid grid-cols-2 gap-3">
              <Input label={`Working Cost (${CURRENCY})`} type="number" value={form.workingCost} onChange={(e) => setForm({ ...form, workingCost: e.target.value })} />
              <Input label="Total Working Area (sqm)" type="number" value={form.totalWorkingArea} onChange={(e) => setForm({ ...form, totalWorkingArea: e.target.value })} />
            </div>

            <div className="bg-orange-50 rounded-xl p-3 space-y-2">
              <SectionTitle icon="➕" title="Extra Work & Material" />
              <Textarea label="Extra Work Details" value={form.extraWork} onChange={(e) => setForm({ ...form, extraWork: e.target.value })} placeholder="Any extra work done..." />
              <Textarea label="Extra Material Using" value={form.extraMaterial} onChange={(e) => setForm({ ...form, extraMaterial: e.target.value })} placeholder="Extra materials used..." />
            </div>

            <div className="bg-green-50 rounded-xl p-3 space-y-2">
              <SectionTitle icon="💰" title="Payments" />
              <Input label={`Total Amount (${CURRENCY})`} type="number" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} />
              <Select label="Payment Mode" value={form.paymentMode} options={["Cash", "Bank", "GPay"]} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })} />
              <Input label="Amount Received By" value={form.amountReceivedBy} onChange={(e) => setForm({ ...form, amountReceivedBy: e.target.value })} placeholder="Name of person who received" />
            </div>

            <Textarea label="🧱 Material Supply" value={form.materialSupply} onChange={(e) => setForm({ ...form, materialSupply: e.target.value })} placeholder="Materials supplied to site..." />
            <Textarea label="📝 Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any other notes..." />

            <div className="bg-gray-50 rounded-xl p-3">
              <SectionTitle icon="✍️" title="Work Finished — Signatures" />
              <div className="space-y-2">
                {["supervisor", "office", "admin"].map((role) => (
                  <div key={role} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                    <span className="capitalize text-sm font-semibold text-gray-700">{role}</span>
                    <span className="text-xs text-gray-400">Will sign after review</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={save} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-bold hover:bg-amber-600">Submit Report</button>
          </div>
        </Modal>
      )}

      {viewModal && (
        <Modal title="Site Report Details" onClose={() => setViewModal(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[["Starting Date", viewModal.startingDate], ["Site", siteWorks.find((s) => s._id === viewModal.siteId)?.customerName || "—"], ["Worker Name", viewModal.workerName], ["Payment Mode", viewModal.paymentMode]].map(([l, v]) => (
                <div key={l} className="bg-gray-50 rounded-xl p-3"><div className="text-xs text-gray-500">{l}</div><div className="font-bold text-gray-900">{v}</div></div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center"><div className="text-lg font-black text-blue-700">{viewModal.totalWorkingArea} sqm</div><div className="text-xs text-gray-500">Total Area</div></div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center"><div className="text-lg font-black text-amber-700">{CURRENCY}{fmt(viewModal.workingCost)}</div><div className="text-xs text-gray-500">Working Cost</div></div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center"><div className="text-lg font-black text-green-700">{CURRENCY}{fmt(viewModal.totalAmount)}</div><div className="text-xs text-gray-500">Total Amt</div></div>
            </div>
            {viewModal.extraWork && <div className="bg-orange-50 border border-orange-200 rounded-xl p-3"><div className="text-xs font-bold text-orange-600 mb-1">➕ Extra Work</div><div className="text-sm text-gray-700">{viewModal.extraWork}</div></div>}
            {viewModal.extraMaterial && <div className="bg-orange-50 border border-orange-200 rounded-xl p-3"><div className="text-xs font-bold text-orange-600 mb-1">🧱 Extra Material</div><div className="text-sm text-gray-700">{viewModal.extraMaterial}</div></div>}
            {viewModal.amountReceivedBy && <div className="bg-green-50 border border-green-200 rounded-xl p-3"><div className="text-xs font-bold text-green-600 mb-1">💰 Amount Received By</div><div className="text-sm font-bold text-gray-900">{viewModal.amountReceivedBy}</div></div>}
            {viewModal.materialSupply && <div className="bg-gray-50 rounded-xl p-3"><div className="text-xs font-bold text-gray-500 mb-1">🧱 Material Supply</div><div className="text-sm text-gray-700">{viewModal.materialSupply}</div></div>}
            {viewModal.notes && <div className="bg-gray-50 rounded-xl p-3"><div className="text-xs font-bold text-gray-500 mb-1">📝 Notes</div><div className="text-sm text-gray-700">{viewModal.notes}</div></div>}
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase mb-2">✍️ Work Finished Signatures</div>
              <div className="space-y-2">
                {["supervisor", "office", "admin"].map((role) => (
                  <div key={role} className={`flex items-center justify-between p-3 rounded-xl border ${viewModal.signatures?.[role] ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
                    <div className="flex items-center gap-2">
                      <span>{viewModal.signatures?.[role] ? "✅" : "⭕"}</span>
                      <span className="capitalize font-semibold text-sm text-gray-700">{role}</span>
                    </div>
                    {!viewModal.signatures?.[role] && (user.role === role || user.role === "admin") && (
                      <button onClick={() => signReport(viewModal._id, role)} className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-green-600">Sign Now</button>
                    )}
                    {viewModal.signatures?.[role] && <span className="text-xs text-green-600 font-semibold">Signed ✓</span>}
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

// ─── DAILY SUPERVISOR REPORT ──────────────────────────────────────────────────
function DailyReport({ siteWorks, user }) {
  const [reports, setReports] = useState([]);
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const emptyForm = { date: today(), newSiteDetails: "", runningSiteDetails: "", workersDetails: "", materialSupply: "", complaints: "", payments: [], dayNote: "", expense: "", expenseAmount: "" };
  const [form, setForm] = useState(emptyForm);
  const [newPayment, setNewPayment] = useState({ from: "", amount: "", mode: "Cash" });

  useEffect(() => {
    api("GET", "/dailyreport").then((d) => { setReports(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const addPayment = () => {
    if (!newPayment.from || !newPayment.amount) return;
    setForm((f) => ({ ...f, payments: [...(f.payments || []), { ...newPayment, amount: +newPayment.amount, id: Date.now() }] }));
    setNewPayment({ from: "", amount: "", mode: "Cash" });
  };

  const save = async () => {
    const data = { ...form, expenseAmount: +form.expenseAmount, addedBy: user.name };
    const item = await api("POST", "/dailyreport", data);
    setReports((p) => [item, ...p]);
    setModal(false);
    setForm(emptyForm);
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">📋 Supervisor Report</h2>
        <button onClick={() => { setForm(emptyForm); setModal(true); }} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 shadow">+ Add Report</button>
      </div>
      <div className="space-y-3">
        {reports.length === 0 && <div className="bg-white rounded-2xl border p-8 text-center text-gray-400">No supervisor reports yet</div>}
        {reports.map((r) => (
          <div key={r._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-black text-gray-900">📅 {r.date}</div>
                <div className="text-xs text-gray-400 mt-0.5">By: {r.addedBy}</div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {r.newSiteDetails && <Badge color="blue">🏗️ New Site</Badge>}
                  {r.runningSiteDetails && <Badge color="teal">🔄 Running Site</Badge>}
                  {r.complaints && <Badge color="red">⚠️ Complaint</Badge>}
                  {r.payments?.length > 0 && <Badge color="green">💰 {r.payments.length} Payments</Badge>}
                  {r.expenseAmount > 0 && <Badge color="orange">💸 Expense</Badge>}
                </div>
              </div>
              <button onClick={() => setViewModal(r)} className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-100 shrink-0">View</button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {r.payments?.length > 0 && <div className="bg-green-50 border border-green-200 rounded-xl p-2 text-center"><div className="text-sm font-black text-green-700">{CURRENCY}{fmt(r.payments.reduce((a, p) => a + p.amount, 0))}</div><div className="text-xs text-gray-500">Received</div></div>}
              {r.expenseAmount > 0 && <div className="bg-red-50 border border-red-200 rounded-xl p-2 text-center"><div className="text-sm font-black text-red-600">{CURRENCY}{fmt(r.expenseAmount)}</div><div className="text-xs text-gray-500">Expenses</div></div>}
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title="Supervisor Daily Report" onClose={() => setModal(false)}>
          <div className="space-y-3">
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />

            <div className="bg-blue-50 rounded-xl p-3 space-y-2">
              <SectionTitle icon="🆕" title="New Site Details" />
              <Textarea label="" value={form.newSiteDetails} onChange={(e) => setForm({ ...form, newSiteDetails: e.target.value })} placeholder="New site started today..." />
            </div>

            <div className="bg-teal-50 rounded-xl p-3 space-y-2">
              <SectionTitle icon="🔄" title="Running Site Details" />
              <Textarea label="" value={form.runningSiteDetails} onChange={(e) => setForm({ ...form, runningSiteDetails: e.target.value })} placeholder="Update on running sites..." />
            </div>

            <div className="bg-amber-50 rounded-xl p-3 space-y-2">
              <SectionTitle icon="👷" title="Workers Detail" />
              <Textarea label="" value={form.workersDetails} onChange={(e) => setForm({ ...form, workersDetails: e.target.value })} placeholder="Workers present, assigned tasks..." />
            </div>

            <div className="bg-orange-50 rounded-xl p-3 space-y-2">
              <SectionTitle icon="🧱" title="Material Supply" />
              <Textarea label="" value={form.materialSupply} onChange={(e) => setForm({ ...form, materialSupply: e.target.value })} placeholder="Materials sent to sites..." />
            </div>

            <div className="bg-green-50 rounded-xl p-3 space-y-2">
              <SectionTitle icon="💰" title="Payments Received" />
              {(form.payments || []).map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <span className="text-sm font-semibold text-gray-700">{p.from} — {CURRENCY}{fmt(p.amount)} <Badge color={p.mode === "Cash" ? "green" : p.mode === "Bank" ? "blue" : "purple"}>{p.mode}</Badge></span>
                  <button onClick={() => setForm((f) => ({ ...f, payments: f.payments.filter((x) => x.id !== p.id) }))} className="text-red-400 hover:text-red-600 text-lg">×</button>
                </div>
              ))}
              <div className="flex gap-2">
                <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="From (site/customer)" value={newPayment.from} onChange={(e) => setNewPayment({ ...newPayment, from: e.target.value })} />
                <input type="number" className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none" placeholder="Amount" value={newPayment.amount} onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })} />
                <select className="border border-gray-200 rounded-lg px-2 py-2 text-sm bg-white" value={newPayment.mode} onChange={(e) => setNewPayment({ ...newPayment, mode: e.target.value })}>
                  <option>Cash</option><option>Bank</option><option>GPay</option>
                </select>
                <button onClick={addPayment} className="bg-green-500 text-white px-3 py-2 rounded-lg font-bold hover:bg-green-600">+</button>
              </div>
            </div>

            <div className="bg-red-50 rounded-xl p-3 space-y-2">
              <SectionTitle icon="⚠️" title="Complaints" />
              <Textarea label="" value={form.complaints} onChange={(e) => setForm({ ...form, complaints: e.target.value })} placeholder="Any complaints or issues..." />
            </div>

            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <SectionTitle icon="📝" title="Day Note" />
              <Textarea label="" value={form.dayNote} onChange={(e) => setForm({ ...form, dayNote: e.target.value })} placeholder="General notes for the day..." />
            </div>

            <div className="bg-purple-50 rounded-xl p-3 space-y-2">
              <SectionTitle icon="💸" title="Expense" />
              <Textarea label="Expense Details" value={form.expense} onChange={(e) => setForm({ ...form, expense: e.target.value })} placeholder="What was spent today..." />
              <Input label={`Total Expense (${CURRENCY})`} type="number" value={form.expenseAmount} onChange={(e) => setForm({ ...form, expenseAmount: e.target.value })} placeholder="0" />
            </div>

            <button onClick={save} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-bold hover:bg-amber-600">Submit Report</button>
          </div>
        </Modal>
      )}

      {viewModal && (
        <Modal title={`Supervisor Report — ${viewModal.date}`} onClose={() => setViewModal(null)}>
          <div className="space-y-3">
            {[
              { icon: "🆕", label: "New Site Details", value: viewModal.newSiteDetails, color: "bg-blue-50 border-blue-200" },
              { icon: "🔄", label: "Running Site Details", value: viewModal.runningSiteDetails, color: "bg-teal-50 border-teal-200" },
              { icon: "👷", label: "Workers Detail", value: viewModal.workersDetails, color: "bg-amber-50 border-amber-200" },
              { icon: "🧱", label: "Material Supply", value: viewModal.materialSupply, color: "bg-orange-50 border-orange-200" },
              { icon: "⚠️", label: "Complaints", value: viewModal.complaints, color: "bg-red-50 border-red-200" },
              { icon: "📝", label: "Day Note", value: viewModal.dayNote, color: "bg-gray-50 border-gray-200" },
            ].filter((x) => x.value).map(({ icon, label, value, color }) => (
              <div key={label} className={`border rounded-xl p-3 ${color}`}>
                <div className="text-xs font-bold text-gray-500 mb-1">{icon} {label}</div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{value}</div>
              </div>
            ))}
            {viewModal.payments?.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="text-xs font-bold text-green-700 mb-2">💰 Payments Received</div>
                {viewModal.payments.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-green-100 last:border-0">
                    <span className="text-gray-700">{p.from} <Badge color={p.mode === "Cash" ? "green" : p.mode === "Bank" ? "blue" : "purple"}>{p.mode}</Badge></span>
                    <span className="font-black text-green-700">{CURRENCY}{fmt(p.amount)}</span>
                  </div>
                ))}
                <div className="text-right mt-2 font-black text-green-800">Total: {CURRENCY}{fmt(viewModal.payments.reduce((a, p) => a + p.amount, 0))}</div>
              </div>
            )}
            {viewModal.expenseAmount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <div className="text-xs font-bold text-red-600 mb-1">💸 Expense</div>
                {viewModal.expense && <div className="text-sm text-gray-700 mb-1">{viewModal.expense}</div>}
                <div className="text-lg font-black text-red-600">{CURRENCY}{fmt(viewModal.expenseAmount)}</div>
              </div>
            )}
            <div className="text-xs text-gray-400">By: {viewModal.addedBy}</div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── WORK PLANNING ────────────────────────────────────────────────────────────
function WorkPlanning({ siteWorks, user }) {
  const [plans, setPlans] = useState([]);
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const emptyForm = { fromDate: today(), toDate: "", site: "", siteWork: "", materialsNeeded: "", payments: "", workersSettling: "", notes: "", status: "planned" };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    api("GET", "/workplan").then((d) => { setPlans(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const save = async () => {
    const item = await api("POST", "/workplan", { ...form, addedBy: user.name });
    setPlans((p) => [item, ...p]);
    setModal(false);
    setForm(emptyForm);
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
        {["planned", "in-progress", "completed", "cancelled"].map((s) => (
          <div key={s} className="bg-white border rounded-xl p-3 text-center shadow-sm">
            <div className="text-xl font-black text-gray-900">{plans.filter((p) => p.status === s).length}</div>
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
                <div className="text-xs text-gray-400 mt-0.5">📅 {p.fromDate} → {p.toDate} (1 week)</div>
              </div>
              <button onClick={() => setViewModal(p)} className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-100 shrink-0">View</button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {p.siteWork && <div className="bg-gray-50 rounded-xl p-2"><div className="text-xs text-gray-500">Site Work</div><div className="text-sm font-semibold text-gray-800 truncate">{p.siteWork}</div></div>}
              {p.workersSettling && <div className="bg-amber-50 rounded-xl p-2"><div className="text-xs text-gray-500">Workers Settling</div><div className="text-sm font-semibold text-amber-800 truncate">{p.workersSettling}</div></div>}
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              {["planned", "in-progress", "completed", "cancelled"].filter((s) => s !== p.status).map((s) => (
                <button key={s} onClick={() => updateStatus(p._id, s)} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-200 capitalize">→ {s}</button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title="New Work Plan (1 Week)" onClose={() => setModal(false)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="From Date" type="date" value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} />
              <Input label="To Date (1 week)" type="date" value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} />
            </div>
            <Select label="Site" value={form.site} options={[{ value: "", label: "Select site..." }, ...siteWorks.map((s) => ({ value: s.customerName, label: s.customerName })), { value: "__new__", label: "+ New Site" }]} onChange={(e) => setForm({ ...form, site: e.target.value === "__new__" ? "" : e.target.value, isNewSite: e.target.value === "__new__" })} />
            {form.isNewSite && <Input label="New Site Name" value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} placeholder="Enter new site name" />}

            <div className="bg-blue-50 rounded-xl p-3 space-y-2">
              <SectionTitle icon="🏗️" title="Site Work Plan" />
              <Textarea label="" value={form.siteWork} onChange={(e) => setForm({ ...form, siteWork: e.target.value })} placeholder="What site work is planned this week..." />
            </div>

            <div className="bg-orange-50 rounded-xl p-3 space-y-2">
              <SectionTitle icon="🧱" title="Materials Needed" />
              <Textarea label="" value={form.materialsNeeded} onChange={(e) => setForm({ ...form, materialsNeeded: e.target.value })} placeholder="Materials required this week..." />
            </div>

            <div className="bg-green-50 rounded-xl p-3 space-y-2">
              <SectionTitle icon="💰" title="Payments Plan" />
              <Textarea label="" value={form.payments} onChange={(e) => setForm({ ...form, payments: e.target.value })} placeholder="Expected payments, amounts..." />
            </div>

            <div className="bg-amber-50 rounded-xl p-3 space-y-2">
              <SectionTitle icon="👷" title="Workers Settling" />
              <Textarea label="" value={form.workersSettling} onChange={(e) => setForm({ ...form, workersSettling: e.target.value })} placeholder="Worker allocation and settling plan..." />
            </div>

            <Textarea label="📝 Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any additional notes..." />
            <button onClick={save} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-bold hover:bg-amber-600">Save Work Plan</button>
          </div>
        </Modal>
      )}

      {viewModal && (
        <Modal title="Work Plan Details" onClose={() => setViewModal(null)}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-gray-900 text-lg">{viewModal.site}</h3>
              <Badge color={statusColors[viewModal.status]}>{viewModal.status}</Badge>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
              <div className="text-sm font-bold text-blue-700">📅 {viewModal.fromDate} → {viewModal.toDate}</div>
            </div>
            {[
              { icon: "🏗️", label: "Site Work", value: viewModal.siteWork, color: "bg-blue-50 border-blue-200" },
              { icon: "🧱", label: "Materials Needed", value: viewModal.materialsNeeded, color: "bg-orange-50 border-orange-200" },
              { icon: "💰", label: "Payments Plan", value: viewModal.payments, color: "bg-green-50 border-green-200" },
              { icon: "👷", label: "Workers Settling", value: viewModal.workersSettling, color: "bg-amber-50 border-amber-200" },
              { icon: "📝", label: "Notes", value: viewModal.notes, color: "bg-gray-50 border-gray-200" },
            ].filter((x) => x.value).map(({ icon, label, value, color }) => (
              <div key={label} className={`border rounded-xl p-3 ${color}`}>
                <div className="text-xs font-bold text-gray-500 mb-1">{icon} {label}</div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{value}</div>
              </div>
            ))}
            <div className="text-xs text-gray-400">Added by: {viewModal.addedBy}</div>
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
    { id: "supervisorreports", label: "Supervisor Reports", icon: "🔍" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "reports", label: "Reports", icon: "📈" },
  ],
  supervisor: [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "sitework", label: "Site Work", icon: "🏗️" },
    { id: "workerreport", label: "Worker Reports", icon: "👷" },
    { id: "dailyreport", label: "Daily Report", icon: "📋" },
    { id: "workplan", label: "Work Planning", icon: "📅" },
    { id: "production", label: "Production", icon: "🏭" },
    { id: "stock", label: "Stock", icon: "📦" },
    { id: "raw", label: "Raw Material", icon: "🧱" },
    { id: "sales", label: "Sales", icon: "💰" },
    { id: "reports", label: "Reports", icon: "📈" },
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

  if (!currentUser) return <Login onLogin={(u) => { setCurrentUser(u); setPage("dashboard"); }} />;

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
      case "workerreport": return <WorkerReport siteWorks={siteWorks} user={currentUser} />;
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
