import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, Trash2, Pencil, X, Sun, Moon, Check, Clock, Coins,
  Briefcase, ChevronDown, ChevronUp, DollarSign,
} from "lucide-react";

/* ─── utils ─── */
const BRL = (n) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);
const todayISO = () => new Date().toISOString().slice(0, 10);
const parseNum = (v) => { const n = parseFloat(String(v).replace(/\./g, "").replace(",", ".")); return isNaN(n) ? 0 : n; };
const uid = () => Date.now() + Math.floor(Math.random() * 99999);
const fmtDia = (iso) => (iso ? `${iso.slice(8)}/${iso.slice(5, 7)}` : "—");

const STATUS = {
  orcamento: { label: "Orçamento", color: "#94A3B8" },
  andamento: { label: "Em andamento", color: "#67C7FF" },
  concluido: { label: "Concluído", color: "#F5C451" },
  cancelado: { label: "Cancelado", color: "#FF7A5C" },
};

/* splits: now => já recebido e contabilizado por padrão */
const SPLITS = {
  "50/50": { label: "50% agora · 50% no término", rows: [{ label: "Sinal", pct: 50, now: true }, { label: "Conclusão", pct: 50 }] },
  "100fim": { label: "100% no término", rows: [{ label: "Conclusão", pct: 100 }] },
  "avista": { label: "À vista (100% agora)", rows: [{ label: "À vista", pct: 100, now: true }] },
  "30/30/40": { label: "30% · 30% · 40%", rows: [{ label: "Sinal", pct: 30, now: true }, { label: "Andamento", pct: 30 }, { label: "Conclusão", pct: 40 }] },
};

const buildPayments = (total, splitKey) =>
  SPLITS[splitKey].rows.map((r) => ({
    id: uid() + Math.random(),
    label: r.label,
    amount: Math.round(total * r.pct) / 100,
    date: r.now ? todayISO() : "",
    received: !!r.now,
    counted: !!r.now,
  }));

const demo = () => [
  {
    id: uid(), client: "Marina", service: "Braço fechado — 3 sessões", status: "andamento", date: todayISO(), notes: "",
    payments: [
      { id: uid() + 1, label: "Sinal", amount: 425, date: todayISO(), received: true, counted: true },
      { id: uid() + 2, label: "Conclusão", amount: 425, date: "", received: false, counted: false },
    ],
  },
  {
    id: uid() + 3, client: "Loja Verde (freela TI)", service: "Ajustes no site + deploy", status: "orcamento", date: todayISO(), notes: "aguardando aprovação",
    payments: [
      { id: uid() + 4, label: "Entrada", amount: 300, date: "", received: false, counted: false },
      { id: uid() + 5, label: "Entrega", amount: 300, date: "", received: false, counted: false },
    ],
  },
];

export default function Servicos() {
  const [theme, setTheme] = useState("dark");
  const [jobs, setJobs] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState(null); // null | {} novo | job existente
  const [open, setOpen] = useState({}); // job.id -> expandido
  const [filter, setFilter] = useState("todos");

useEffect(() => {
  try {
    const raw = localStorage.getItem("fluxo:jobs");

    if (raw) {
      const parsed = JSON.parse(raw);
      setJobs(parsed.jobs || []);
      setTheme(parsed.theme || "dark");
    } else {
      setJobs([]);
    }
  } catch (error) {
    console.error("Erro ao carregar serviços:", error);
    setJobs([]);
  } finally {
    setLoaded(true);
  }
}, []);
  useEffect(() => {
  if (!loaded) return;

  try {
    localStorage.setItem("fluxo:jobs", JSON.stringify({ jobs, theme }));
  } catch (error) {
    console.error("Erro ao salvar serviços:", error);
  }
}, [jobs, theme, loaded]);
  /* métricas globais */
  const flat = jobs.filter((j) => j.status !== "cancelado").flatMap((j) => j.payments);
  const contabilizado = flat.filter((p) => p.counted).reduce((s, p) => s + p.amount, 0);
  const recebido = flat.filter((p) => p.received).reduce((s, p) => s + p.amount, 0);
  const aReceber = flat.filter((p) => !p.received).reduce((s, p) => s + p.amount, 0);
  const ativos = jobs.filter((j) => j.status === "andamento" || j.status === "orcamento").length;

  const list = jobs.filter((j) => filter === "todos" || j.status === filter);

  const saveJob = (job) => { setJobs((p) => (p.some((j) => j.id === job.id) ? p.map((j) => (j.id === job.id ? job : j)) : [job, ...p])); setModal(null); };
  const delJob = (id) => { if (confirm("Excluir este serviço?")) setJobs((p) => p.filter((j) => j.id !== id)); };
  const patchPay = (jobId, payId, patch) =>
    setJobs((p) => p.map((j) => (j.id === jobId ? { ...j, payments: j.payments.map((pay) => (pay.id === payId ? { ...pay, ...patch } : pay)) } : j)));
  const setStatus = (jobId, status) => setJobs((p) => p.map((j) => (j.id === jobId ? { ...j, status } : j)));

  return (
    <div className="sv-root" data-theme={theme}>
      <style>{CSS}</style>

      <header className="sv-top">
        <div className="sv-brand">
          <span className="sv-logo"><Briefcase size={18} /></span>
          <div><div className="sv-name">Fluxo · Serviços</div><div className="sv-tag">freelancer & renda por projeto</div></div>
        </div>
        <button className="sv-icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}</button>
      </header>

      {/* MÉTRICAS */}
      <section className="sv-hero">
        <div className="sv-hero-label"><Coins size={13} /> Contabilizado no caixa</div>
        <div className="sv-big">{BRL(contabilizado)}</div>
        <div className="sv-hero-sub">o que você escolheu contar agora — vira à vontade nas parcelas</div>
      </section>
      <div className="sv-grid2">
        <div className="sv-tile"><span>A receber</span><b style={{ color: "#F5C451" }}>{BRL(aReceber)}</b></div>
        <div className="sv-tile"><span>Recebido total</span><b>{BRL(recebido)}</b></div>
      </div>

      <button className="sv-new" onClick={() => setModal({})}><Plus size={17} /> Novo serviço</button>

      {/* FILTRO */}
      <div className="sv-chips">
        {["todos", "orcamento", "andamento", "concluido", "cancelado"].map((f) => (
          <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>
            {f === "todos" ? "Todos" : STATUS[f].label}
          </button>
        ))}
      </div>

      {list.length === 0 && <div className="sv-empty">Nenhum serviço aqui. <button className="sv-link" onClick={() => setModal({})}>criar o primeiro</button></div>}

      {list.map((j) => {
        const total = j.payments.reduce((s, p) => s + p.amount, 0);
        const rec = j.payments.filter((p) => p.received).reduce((s, p) => s + p.amount, 0);
        const cont = j.payments.filter((p) => p.counted).reduce((s, p) => s + p.amount, 0);
        const st = STATUS[j.status];
        const isOpen = open[j.id] ?? true;
        return (
          <section className="sv-job" key={j.id}>
            <div className="sv-job-head" onClick={() => setOpen((o) => ({ ...o, [j.id]: !isOpen }))}>
              <div className="sv-job-title">
                <b>{j.client}</b>
                <span className="sv-job-serv">{j.service}</span>
              </div>
              <div className="sv-job-right">
                <span className="sv-pill" style={{ color: st.color, borderColor: st.color + "55", background: st.color + "18" }}>{st.label}</span>
                <b className="sv-mono">{BRL(total)}</b>
                {isOpen ? <ChevronUp size={16} className="sv-chev" /> : <ChevronDown size={16} className="sv-chev" />}
              </div>
            </div>

            <div className="sv-bar"><div style={{ width: `${total ? (rec / total) * 100 : 0}%` }} /></div>
            <div className="sv-job-meta">
              <span>recebido {BRL(rec)} de {BRL(total)}</span>
              <span className="sv-count-tag"><Coins size={11} /> conta {BRL(cont)}</span>
            </div>

            {isOpen && (
              <>
                <ul className="sv-pays">
                  {j.payments.map((p) => (
                    <li key={p.id}>
                      <button className="sv-recv" onClick={() => patchPay(j.id, p.id, { received: !p.received, date: !p.received && !p.date ? todayISO() : p.date })} title={p.received ? "Recebido" : "A receber"}>
                        {p.received ? <Check size={15} color="#F5C451" /> : <Clock size={15} color="#F5C451" />}
                      </button>
                      <div className="sv-pay-main">
                        <span className="sv-pay-label">{p.label} <em>{total ? Math.round((p.amount / total) * 100) : 0}%</em></span>
                        <span className="sv-pay-date">{p.received ? "recebido" : "previsto"} · {fmtDia(p.date)}</span>
                      </div>
                      <b className="sv-mono sv-pay-val">{BRL(p.amount)}</b>
                      <label className="sv-switch" title="Contabilizar no caixa">
                        <input type="checkbox" checked={p.counted} onChange={() => patchPay(j.id, p.id, { counted: !p.counted })} />
                        <span className="sv-slider"><Coins size={10} /></span>
                      </label>
                    </li>
                  ))}
                </ul>

                <div className="sv-job-actions">
                  <select value={j.status} onChange={(e) => setStatus(j.id, e.target.value)}>
                    {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <button className="sv-icon dim" onClick={() => setModal(j)}><Pencil size={14} /></button>
                  <button className="sv-icon dim" onClick={() => delJob(j.id)}><Trash2 size={14} /></button>
                </div>
              </>
            )}
          </section>
        );
      })}

      <footer className="sv-foot">💰 = essa parcela conta no seu caixa. Vire quando quiser — nada muda no combinado com o cliente.</footer>

      {modal !== null && <JobForm job={modal} onSave={saveJob} onClose={() => setModal(null)} />}
    </div>
  );
}

/* ─── FORM ─── */
function JobForm({ job, onSave, onClose }) {
  const editing = !!job.id;
  const [f, setF] = useState({
    client: job.client || "", service: job.service || "", status: job.status || "orcamento",
    total: job.payments ? String(job.payments.reduce((s, p) => s + p.amount, 0)).replace(".", ",") : "",
    notes: job.notes || "",
  });
  const [split, setSplit] = useState("50/50");
  const [payments, setPayments] = useState(job.payments || []);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const applySplit = (key) => { setSplit(key); const t = parseNum(f.total); if (t > 0) setPayments(buildPayments(t, key)); };
  const onTotal = (v) => { set("total", v); const t = parseNum(v); if (t > 0 && !editing) setPayments(buildPayments(t, split)); };

  const patchRow = (id, patch) => setPayments((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const addRow = () => setPayments((p) => [...p, { id: uid() + Math.random(), label: "Parcela", amount: 0, date: "", received: false, counted: false }]);
  const delRow = (id) => setPayments((p) => p.filter((x) => x.id !== id));

  const soma = payments.reduce((s, p) => s + p.amount, 0);
  const valid = f.client.trim() && payments.length > 0 && soma > 0;

  const save = () => valid && onSave({
    id: job.id || uid(), client: f.client.trim(), service: f.service.trim() || "Serviço",
    status: f.status, date: job.date || todayISO(), notes: f.notes.trim(), payments,
  });

  return (
    <div className="sv-overlay" onClick={onClose}>
      <div className="sv-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sv-modal-head"><b>{editing ? "Editar serviço" : "Novo serviço"}</b><button className="sv-icon" onClick={onClose}><X size={16} /></button></div>

        <div className="sv-row">
          <input placeholder="Cliente" value={f.client} onChange={(e) => set("client", e.target.value)} autoFocus />
        </div>
        <input placeholder="Serviço (ex.: Braço fechado, Landing page…)" value={f.service} onChange={(e) => set("service", e.target.value)} style={{ marginBottom: 9 }} />
        <div className="sv-row">
          <div className="sv-amount-wrap"><DollarSign size={14} /><input className="sv-amount" inputMode="decimal" placeholder="Valor total" value={f.total} onChange={(e) => onTotal(e.target.value)} /></div>
          <select value={f.status} onChange={(e) => set("status", e.target.value)}>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        {!editing && (
          <>
            <div className="sv-mini-label">Como será pago</div>
            <div className="sv-splits">
              {Object.entries(SPLITS).map(([k, v]) => (
                <button key={k} className={split === k ? "on" : ""} onClick={() => applySplit(k)}>{v.label}</button>
              ))}
            </div>
          </>
        )}

        {payments.length > 0 && (
          <div className="sv-pay-editor">
            <div className="sv-mini-label">Parcelas <span className={soma !== parseNum(f.total) && parseNum(f.total) > 0 ? "warn" : ""}>soma {BRL(soma)}</span></div>
            {payments.map((p) => (
              <div className="sv-pay-row" key={p.id}>
                <input className="pl" placeholder="Rótulo" value={p.label} onChange={(e) => patchRow(p.id, { label: e.target.value })} />
                <input className="pv" inputMode="decimal" placeholder="0,00" value={p.amount ? String(p.amount).replace(".", ",") : ""} onChange={(e) => patchRow(p.id, { amount: parseNum(e.target.value) })} />
                <input className="pd" type="date" value={p.date} onChange={(e) => patchRow(p.id, { date: e.target.value })} />
                <button className={`tg ${p.received ? "on" : ""}`} onClick={() => patchRow(p.id, { received: !p.received })} title="Recebido"><Check size={13} /></button>
                <button className={`tg ${p.counted ? "onc" : ""}`} onClick={() => patchRow(p.id, { counted: !p.counted })} title="Contabilizar"><Coins size={13} /></button>
                <button className="tg del" onClick={() => delRow(p.id)}><X size={13} /></button>
              </div>
            ))}
            <button className="sv-add-row" onClick={addRow}><Plus size={13} /> parcela</button>
          </div>
        )}

        <button className="sv-new" disabled={!valid} onClick={save} style={{ marginTop: 12 }}>{editing ? "Salvar" : "Criar serviço"}</button>
      </div>
    </div>
  );
}

const CSS = `
.sv-root{--lime:#F5C451;--coral:#FF7A5C;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
  min-height:100vh;max-width:520px;margin:0 auto;padding:16px 14px 40px;box-sizing:border-box;transition:background .25s,color .25s}
.sv-root[data-theme="dark"]{--ink:#0E0F13;--panel:#16181F;--panel2:#1E212B;--line:#2A2E3A;--text:#ECEEF2;--muted:#878E9C;background:var(--ink);color:var(--text)}
.sv-root[data-theme="light"]{--ink:#F4F5F8;--panel:#fff;--panel2:#EEF0F5;--line:#DDE1EA;--text:#171A21;--muted:#6A7180;background:var(--ink);color:var(--text)}
.sv-root *{box-sizing:border-box}
.sv-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-variant-numeric:tabular-nums}

.sv-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.sv-brand{display:flex;align-items:center;gap:11px}
.sv-logo{width:36px;height:36px;border-radius:11px;background:var(--lime);color:#0E0F13;display:grid;place-items:center}
.sv-name{font-weight:700;font-size:16px;letter-spacing:-.3px}
.sv-tag{font-size:11px;color:var(--muted)}
.sv-icon{background:none;border:1px solid var(--line);color:var(--muted);width:32px;height:32px;border-radius:9px;display:grid;place-items:center;cursor:pointer;flex:0 0 auto}
.sv-icon:hover{color:var(--text);border-color:var(--muted)}
.sv-icon.dim{border:none;width:28px;height:28px}

.sv-hero{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:16px;margin-bottom:10px}
.sv-root[data-theme="dark"] .sv-hero{background:linear-gradient(160deg,#1a1d26,#121419)}
.sv-hero-label{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:5px}
.sv-hero-label svg{color:var(--lime)}
.sv-big{font-family:ui-monospace,Menlo,monospace;font-size:30px;font-weight:600;letter-spacing:-.8px;font-variant-numeric:tabular-nums;color:#D9A441}
.sv-root[data-theme="dark"] .sv-big{color:var(--lime)}
.sv-hero-sub{font-size:11.5px;color:var(--muted);margin-top:6px}

.sv-grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
.sv-tile{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:11px 12px;display:flex;flex-direction:column;gap:4px}
.sv-tile span{font-size:11px;color:var(--muted)}
.sv-tile b{font-family:ui-monospace,monospace;font-size:15px;font-variant-numeric:tabular-nums}

.sv-new{width:100%;background:var(--lime);color:#0E0F13;border:none;border-radius:12px;padding:12px;font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:14px}
.sv-new:disabled{opacity:.4;cursor:not-allowed}

.sv-chips{display:flex;gap:6px;overflow-x:auto;margin-bottom:12px;padding-bottom:2px}
.sv-chips button{background:var(--panel);border:1px solid var(--line);color:var(--muted);border-radius:99px;padding:6px 12px;font-size:12px;white-space:nowrap;cursor:pointer;flex:0 0 auto}
.sv-chips button.on{background:var(--lime);color:#0E0F13;border-color:var(--lime);font-weight:600}

.sv-empty{text-align:center;color:var(--muted);font-size:14px;padding:28px 0}
.sv-link{background:none;border:none;color:#D9A441;cursor:pointer;text-decoration:underline;font-size:14px}
.sv-root[data-theme="dark"] .sv-link{color:var(--lime)}

.sv-job{background:var(--panel);border:1px solid var(--line);border-radius:15px;padding:14px;margin-bottom:11px}
.sv-job-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;cursor:pointer}
.sv-job-title b{font-size:15px;display:block}
.sv-job-serv{font-size:12px;color:var(--muted)}
.sv-job-right{display:flex;align-items:center;gap:8px;flex-shrink:0}
.sv-job-right .sv-mono{font-size:14px;font-weight:600}
.sv-pill{font-size:10.5px;padding:3px 8px;border-radius:99px;border:1px solid;font-weight:600;white-space:nowrap}
.sv-chev{color:var(--muted)}

.sv-bar{height:6px;background:var(--panel2);border-radius:99px;overflow:hidden;margin:11px 0 6px}
.sv-bar div{height:100%;background:var(--lime);border-radius:99px;transition:width .35s}
.sv-job-meta{display:flex;justify-content:space-between;font-size:11.5px;color:var(--muted)}
.sv-count-tag{display:flex;align-items:center;gap:4px;color:#D9A441}
.sv-root[data-theme="dark"] .sv-count-tag{color:var(--lime)}

.sv-pays{list-style:none;margin:12px 0 0;padding:0}
.sv-pays li{display:flex;align-items:center;gap:9px;padding:9px 0;border-top:1px solid var(--line)}
.sv-recv{background:none;border:1px solid var(--line);border-radius:8px;width:30px;height:30px;display:grid;place-items:center;cursor:pointer;flex:0 0 auto}
.sv-pay-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.sv-pay-label{font-size:13.5px}
.sv-pay-label em{font-size:11px;color:var(--muted);font-style:normal;margin-left:3px}
.sv-pay-date{font-size:11px;color:var(--muted)}
.sv-pay-val{font-size:13.5px;font-weight:600;flex:0 0 auto}

.sv-switch{position:relative;display:inline-block;width:42px;height:24px;flex:0 0 auto;cursor:pointer}
.sv-switch input{opacity:0;width:0;height:0}
.sv-slider{position:absolute;inset:0;background:var(--panel2);border:1px solid var(--line);border-radius:99px;transition:.2s;display:flex;align-items:center;padding-left:4px;color:var(--muted)}
.sv-slider svg{opacity:0;transition:.2s}
.sv-switch input:checked+.sv-slider{background:rgba(245,196,81,.2);border-color:var(--lime);color:#D9A441;justify-content:flex-start;padding-left:5px}
.sv-switch input:checked+.sv-slider svg{opacity:1}
.sv-slider::after{content:"";position:absolute;right:3px;top:2px;width:17px;height:17px;border-radius:50%;background:var(--muted);transition:.2s}
.sv-switch input:checked+.sv-slider::after{background:var(--lime);right:auto;left:22px}

.sv-job-actions{display:flex;align-items:center;gap:7px;margin-top:12px}
.sv-job-actions select{flex:1}
.sv-root select,.sv-root input{background:var(--ink);border:1px solid var(--line);color:var(--text);border-radius:10px;padding:10px 11px;font-size:14px;font-family:inherit;outline:none;width:100%;min-width:0}
.sv-root select:focus,.sv-root input:focus{border-color:var(--lime)}

.sv-foot{text-align:center;font-size:11px;color:var(--muted);margin-top:14px;line-height:1.5}

.sv-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center;z-index:100;backdrop-filter:blur(2px)}
.sv-modal{background:var(--panel);border:1px solid var(--line);border-radius:18px 18px 0 0;padding:16px;width:100%;max-width:520px;max-height:88vh;overflow-y:auto;animation:up .22s ease}
@keyframes up{from{transform:translateY(30px);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.sv-modal{animation:none}.sv-bar div,.sv-slider,.sv-slider::after{transition:none}}
.sv-modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
.sv-row{display:flex;gap:8px;margin-bottom:9px}
.sv-amount-wrap{display:flex;align-items:center;gap:6px;background:var(--ink);border:1px solid var(--line);border-radius:10px;padding-left:11px;color:var(--muted);flex:1}
.sv-amount{border:none!important;background:none!important;font-family:ui-monospace,monospace;font-size:16px;font-weight:600;padding-left:0!important}
.sv-mini-label{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin:10px 0 7px;display:flex;justify-content:space-between}
.sv-mini-label .warn{color:#F5C451;text-transform:none;letter-spacing:0}
.sv-splits{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:6px}
.sv-splits button{background:var(--ink);border:1px solid var(--line);color:var(--text);border-radius:10px;padding:9px;font-size:12px;cursor:pointer;text-align:left}
.sv-splits button.on{border-color:var(--lime);background:rgba(245,196,81,.1)}

.sv-pay-editor{margin-top:4px}
.sv-pay-row{display:flex;gap:5px;align-items:center;margin-bottom:6px}
.sv-pay-row .pl{flex:1.3}.sv-pay-row .pv{flex:1;font-family:ui-monospace,monospace}.sv-pay-row .pd{flex:1.1;font-size:12px;padding:9px 6px}
.sv-pay-row input{padding:9px}
.sv-pay-row .tg{width:32px;height:36px;flex:0 0 auto;border:1px solid var(--line);background:var(--ink);color:var(--muted);border-radius:9px;display:grid;place-items:center;cursor:pointer}
.sv-pay-row .tg.on{border-color:var(--lime);color:#D9A441;background:rgba(245,196,81,.12)}
.sv-pay-row .tg.onc{border-color:var(--lime);color:#D9A441;background:rgba(245,196,81,.12)}
.sv-pay-row .tg.del:hover{color:var(--coral);border-color:var(--coral)}
.sv-add-row{background:var(--panel2);border:1px solid var(--line);color:var(--text);border-radius:9px;padding:7px 11px;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;margin-top:2px}
`;