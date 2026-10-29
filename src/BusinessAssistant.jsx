import { useEffect, useMemo, useState } from "react";
import { Bot, Mic, Send, Volume2, VolumeX } from "lucide-react";

const API = `${(import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "")}/api`;
const today = () => new Date().toISOString().slice(0, 10);
const deviceId = () => {
  let id = localStorage.getItem("pk_device_id");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("pk_device_id", id); }
  return id;
};

export default function BusinessAssistant({ user, language }) {
  const [fromDate, setFromDate] = useState(() => `${today().slice(0, 4)}-01-01`);
  const [toDate, setToDate] = useState(today());
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recognitionSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const locale = language === "ml" ? "ml-IN" : "en-IN";
  const token = localStorage.getItem("pk3_ai_token") || "";
  const range = useMemo(() => ({ fromDate, toDate }), [fromDate, toDate]);

  useEffect(() => {
    let alive = true;
    fetch(`${API}/ai/status`, { headers: { Authorization: `Bearer ${token}`, "X-Device-Id": deviceId() } })
      .then(async response => ({ ok: response.ok, data: await response.json() }))
      .then(({ ok, data }) => { if (alive) setEnabled(ok && data.enabled); })
      .catch(() => { if (alive) setEnabled(false); });
    return () => { alive = false; };
  }, [token]);

  const send = async (text = question) => {
    const prompt = text.trim();
    if (!prompt || busy || !token) return;
    const next = [...messages, { role: "user", content: prompt }];
    setMessages(next);
    setQuestion("");
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${API}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "X-Device-Id": deviceId() },
        body: JSON.stringify({ message: prompt, history: messages.slice(-8), ...range, language }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Assistant request failed");
      setMessages(current => [...current, { role: "assistant", content: data.answer }]);
      if (data.enabled === false) setEnabled(false);
    } catch (e) { setError(e.message || "Could not connect to the assistant"); }
    finally { setBusy(false); }
  };

  const startVoice = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.lang = locale;
    recognition.interimResults = false;
    recognition.onresult = event => setQuestion(event.results[0][0].transcript);
    recognition.onerror = () => setError(language === "ml" ? "ശബ്ദം തിരിച്ചറിയാനായില്ല." : "Speech could not be recognized.");
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  };

  const speak = text => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const t = language === "ml" ? {
    title: "AI ബിസിനസ് അസിസ്റ്റന്റ്", intro: "നിങ്ങളുടെ അനുമതിയുള്ള ബിസിനസ് ഡാറ്റയെക്കുറിച്ച് ചോദിക്കൂ.", from: "ആരംഭ തീയതി", to: "അവസാന തീയതി", placeholder: "ഒരു ചോദ്യം ചോദിക്കൂ...", send: "അയയ്ക്കുക", disabled: "AI ലഭ്യമല്ല. മാനുവൽ ആപ്പ് ഫീച്ചറുകൾ പ്രവർത്തിക്കുന്നു.", listening: "കേൾക്കുന്നു...", empty: "നിങ്ങളുടെ ചോദ്യം ഇവിടെ ചോദിക്കാം.",
  } : {
    title: "AI Business Assistant", intro: "Ask about business data available to your role.", from: "From", to: "To", placeholder: "Ask a business question...", send: "Send", disabled: "AI is not configured yet. The rest of the app remains available.", listening: "Listening...", empty: "Ask a question about your business.",
  };

  return <section className="mx-auto max-w-4xl space-y-4" aria-label={t.title}>
    <header className="flex items-center gap-3 border-b border-slate-200 pb-4">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><Bot size={23}/></span>
      <div><h2 className="text-lg font-black text-slate-900">{t.title}</h2><p className="text-sm text-slate-500">{t.intro}</p></div>
    </header>
    <div className="grid grid-cols-2 gap-3 sm:max-w-md">
      <label className="text-xs font-semibold text-slate-600">{t.from}<input className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" type="date" value={fromDate} max={toDate} onChange={e => setFromDate(e.target.value)}/></label>
      <label className="text-xs font-semibold text-slate-600">{t.to}<input className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" type="date" value={toDate} min={fromDate} max={today()} onChange={e => setToDate(e.target.value)}/></label>
    </div>
    {!enabled && <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{t.disabled}</div>}
    <div className="min-h-64 space-y-3 rounded-md border border-slate-200 bg-white p-4" aria-live="polite">
      {!messages.length && <p className="py-12 text-center text-sm text-slate-400">{t.empty}</p>}
      {messages.map((message, index) => <article key={`${index}-${message.role}`} className={`max-w-[92%] whitespace-pre-wrap rounded-lg p-3 text-sm ${message.role === "user" ? "ml-auto bg-slate-100 text-slate-900" : "border border-emerald-100 bg-emerald-50 text-slate-800"}`}>
        <div>{message.content}</div>{message.role === "assistant" && <button type="button" onClick={() => speak(message.content)} className="mt-2 inline-flex h-8 w-8 items-center justify-center rounded text-slate-600 hover:bg-white" title="Read answer aloud" aria-label="Read answer aloud"><Volume2 size={16}/></button>}
      </article>)}
      {busy && <p className="text-sm text-slate-500">{language === "ml" ? "ചിന്തിക്കുന്നു..." : "Thinking..."}</p>}
    </div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <form onSubmit={e => { e.preventDefault(); send(); }} className="flex items-end gap-2">
      <textarea className="min-h-12 flex-1 resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400" value={question} onChange={e => setQuestion(e.target.value)} placeholder={t.placeholder} maxLength={1200} rows={2}/>
      {recognitionSupported && <button type="button" onClick={startVoice} disabled={listening || busy} className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border ${listening ? "border-red-300 bg-red-50 text-red-700" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`} title={listening ? t.listening : "Speak question"} aria-label={listening ? t.listening : "Speak question"}><Mic size={18}/></button>}
      <button type="submit" disabled={busy || !question.trim() || !enabled} className="inline-flex h-11 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"><Send size={16}/><span>{t.send}</span></button>
      {speaking && <button type="button" onClick={() => { window.speechSynthesis.cancel(); setSpeaking(false); }} className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-300 text-slate-700" title="Stop playback" aria-label="Stop playback"><VolumeX size={17}/></button>}
    </form>
    <p className="text-xs text-slate-400">{user.name} · {user.role}</p>
  </section>;
}
