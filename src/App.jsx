import React, { useState, useEffect, useMemo } from "react";
import Servicos from "./Servicos.jsx";
import { isStandalonePWA } from "./pwa.js";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar as ReBar, XAxis, YAxis, Tooltip } from "recharts";
import {
  Plus, Trash2, Pencil, ChevronLeft, ChevronRight, TrendingUp, Home, List,
  Target, Wallet, Search, X, Sun, Moon, AlertTriangle, CheckCircle2, Clock,
  CreditCard, Repeat, Landmark, Sparkles, Check, Briefcase,
} from "lucide-react";

/* ═══════════════════════════ UTILS ═══════════════════════════ */
const BRL = (n) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);
const todayISO = () => new Date().toISOString().slice(0, 10);
const mKey = (iso) => iso.slice(0, 7);
const nowKey = () => mKey(todayISO());
const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const MONTHS_FULL = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const monthLabel = (key) => { const [y, m] = key.split("-").map(Number); return `${MONTHS_FULL[m - 1]} ${y}`; };
const shiftMonth = (key, d) => { const [y, m] = key.split("-").map(Number); const nd = new Date(y, m - 1 + d, 1); return `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, "0")}`; };
const parseNum = (v) => { const n = parseFloat(String(v).replace(/\./g, "").replace(",", ".")); return isNaN(n) ? 0 : n; };
const uid = () => Date.now() + Math.floor(Math.random() * 999);
const fmtDia = (iso) => `${iso.slice(8)}/${iso.slice(5, 7)}`;

/* ═══════════════════════════ DATA — categorias ═══════════════════════════ */
const DEFAULT_CATS = {
  despesa: [
    { name: "Alimentação", icon: "🍽️", color: "#F5C451" },
    { name: "Transporte", icon: "🚗", color: "#67C7FF" },
    { name: "Moradia", icon: "🏠", color: "#A78BFA" },
    { name: "Saúde", icon: "❤️", color: "#FB7185" },
    { name: "Educação", icon: "📚", color: "#6EE7B7" },
    { name: "Lazer", icon: "🎮", color: "#F472B6" },
    { name: "Assinaturas", icon: "📺", color: "#FB923C" },
    { name: "Compras", icon: "🛍️", color: "#38BDF8" },
    { name: "Cartão de crédito", icon: "💳", color: "#FF7A5C" },
    { name: "Dívidas", icon: "🧾", color: "#F87171" },
    { name: "Material", icon: "🎨", color: "#C084FC" },
    { name: "Studio/Aluguel", icon: "🏢", color: "#94A3B8" },
    { name: "Impostos", icon: "🏛️", color: "#FDA4AF" },
    { name: "Outros", icon: "📦", color: "#9CA3AF" },
  ],
  receita: [
    { name: "Tattoo", icon: "🖋️", color: "#C8F65D" },
    { name: "Freelance", icon: "💻", color: "#6EE7B7" },
    { name: "Salário", icon: "💼", color: "#67C7FF" },
    { name: "Outros", icon: "💰", color: "#F5C451" },
  ],
};
const PAYMENTS = ["Pix", "Dinheiro", "Débito", "Crédito", "Boleto", "Transferência"];

/* ═══════════════════════════ STORE — persistência + migração v1 ═══════════════════════════ */
const EMPTY = { theme: "dark", tx: [], customCats: { despesa: [], receita: [] }, budgets: {}, goals: [], debts: [], cards: [], recurring: [] };

const migrateV1 = (old) =>
  old.map((t) => ({
    id: t.id, title: t.desc || t.cat, amount: t.amount,
    type: t.type === "entrada" ? "receita" : "despesa",
    category: t.cat === "Freela TI" ? "Freelance" : t.cat,
    date: t.date, status: "efetivado", payment: "Pix", notes: "",
  }));

const demoData = () => {
  const now = new Date();
  const d = (off, day) => new Date(now.getFullYear(), now.getMonth() - off, day).toISOString().slice(0, 10);
  const t = (date, type, category, title, amount, status = "efetivado", payment = "Pix") =>
    ({ id: uid() + Math.random(), title, amount, type, category, date, status, payment, notes: "" });
  return {
    ...EMPTY,
    tx: [
      t(d(0, 5), "receita", "Tattoo", "Sessão braço fechado", 850),
      t(d(0, 9), "receita", "Freelance", "Ajuste site cliente", 600),
      t(d(0, 12), "receita", "Tattoo", "Fineline recorrente", 320),
      t(d(0, 3), "despesa", "Material", "Tinta + agulhas", 240),
      t(d(0, 7), "despesa", "Studio/Aluguel", "Diária studio", 300),
      t(d(0, 10), "despesa", "Alimentação", "Mercado", 380),
      t(d(0, 15), "despesa", "Assinaturas", "Streaming + software", 90),
      t(d(0, 25), "despesa", "Impostos", "DAS MEI", 76, "pendente", "Boleto"),
      t(d(1, 8), "receita", "Tattoo", "Flash day", 1100),
      t(d(1, 14), "receita", "Freelance", "Bug fix urgente", 450),
      t(d(1, 4), "despesa", "Material", "Reposição estoque", 410),
      t(d(1, 6), "despesa", "Studio/Aluguel", "Diárias studio", 600),
      t(d(1, 11), "despesa", "Alimentação", "Mês", 520),
      t(d(1, 20), "despesa", "Impostos", "DAS MEI", 76),
      t(d(2, 10), "receita", "Tattoo", "Mês movimentado", 1900),
      t(d(2, 5), "despesa", "Material", "Material", 300),
      t(d(2, 12), "despesa", "Alimentação", "Mês", 480),
      t(d(2, 18), "despesa", "Transporte", "Combustível", 220),
    ],
    budgets: { "Alimentação": 500, "Material": 350, "Lazer": 250 },
    goals: [{ id: uid(), name: "Reserva de emergência", target: 6000, current: 1500, deadline: d(-8, 1) }],
    debts: [{ id: uid(), name: "Máquina de tattoo", total: 2400, paid: 1200, installments: 12, paidInst: 6, dueDay: 10, creditor: "Loja X" }],
    cards: [{ id: uid(), name: "Nubank", limit: 3000, used: 640, closeDay: 28, dueDay: 7 }],
    recurring: [
      { id: uid(), title: "Internet", amount: 110, type: "despesa", category: "Moradia", day: 10 },
      { id: uid(), title: "DAS MEI", amount: 76, type: "despesa", category: "Impostos", day: 20 },
      { id: uid(), title: "Academia", amount: 90, type: "despesa", category: "Saúde", day: 5 },
    ],
  };
};

/* ═══════════════════════════ INSIGHTS + SAÚDE FINANCEIRA ═══════════════════════════ */
function buildInsights(S, cursor) {
  const out = [];
  const cur = S.tx.filter((t) => mKey(t.date) === cursor);
  const prev = S.tx.filter((t) => mKey(t.date) === shiftMonth(cursor, -1));
  const sumCat = (arr, cat) => arr.filter((t) => t.type === "despesa" && t.category === cat).reduce((s, t) => s + t.amount, 0);

  // variação por categoria vs mês anterior
  const cats = [...new Set(cur.filter((t) => t.type === "despesa").map((t) => t.category))];
  cats.forEach((c) => {
    const a = sumCat(cur, c), b = sumCat(prev, c);
    if (b > 50 && a > b * 1.2) out.push({ icon: "📈", text: `Você gastou ${Math.round(((a - b) / b) * 100)}% a mais com ${c} este mês.` });
  });

  // orçamentos
  Object.entries(S.budgets).forEach(([c, lim]) => {
    const spent = sumCat(cur, c);
    if (lim > 0 && spent > lim) out.push({ icon: "🚨", text: `Orçamento de ${c} estourado: ${BRL(spent)} de ${BRL(lim)}.` });
    else if (lim > 0 && spent >= lim * 0.8) out.push({ icon: "⚠️", text: `Orçamento de ${c} está em ${Math.round((spent / lim) * 100)}% do limite.` });
  });

  // metas
  S.goals.forEach((g) => {
    const falta = g.target - g.current;
    if (falta <= 0) { out.push({ icon: "🏆", text: `Meta "${g.name}" concluída!` }); return; }
    const meses = g.deadline ? Math.max(1, Math.ceil((new Date(g.deadline) - new Date()) / (30.44 * 864e5))) : 12;
    out.push({ icon: "🎯", text: `Guardando ${BRL(falta / meses)}/mês você atinge "${g.name}" em ${meses} ${meses === 1 ? "mês" : "meses"}.` });
  });

  // maior recorrente
  const recExp = S.recurring.filter((r) => r.type === "despesa").sort((a, b) => b.amount - a.amount);
  if (recExp.length) out.push({ icon: "🔁", text: `Sua maior despesa recorrente é ${recExp[0].title} (${BRL(recExp[0].amount)}).` });

  // contas vencendo em 7 dias
  const today = new Date(); const in7 = new Date(); in7.setDate(today.getDate() + 7);
  const due = S.tx.filter((t) => t.type === "despesa" && t.status === "pendente" && new Date(t.date + "T12:00") >= today && new Date(t.date + "T12:00") <= in7);
  if (due.length) out.push({ icon: "📅", text: `Você tem ${due.length} conta${due.length > 1 ? "s" : ""} vencendo nos próximos 7 dias.` });

  return out.slice(0, 5);
}

function healthScore(S, cursor) {
  const cur = S.tx.filter((t) => mKey(t.date) === cursor);
  const inc = cur.filter((t) => t.type === "receita").reduce((s, t) => s + t.amount, 0);
  const exp = cur.filter((t) => t.type === "despesa").reduce((s, t) => s + t.amount, 0);
  let score = 0;
  // 1) balanço do mês (0–30)
  if (inc > 0) score += Math.max(0, Math.min(30, ((inc - exp) / inc) * 60));
  // 2) orçamentos respeitados (0–25)
  const bEntries = Object.entries(S.budgets).filter(([, l]) => l > 0);
  if (bEntries.length) {
    const ok = bEntries.filter(([c, l]) => cur.filter((t) => t.type === "despesa" && t.category === c).reduce((s, t) => s + t.amount, 0) <= l).length;
    score += (ok / bEntries.length) * 25;
  } else score += 15;
  // 3) carga de dívidas (0–25)
  const debtLeft = S.debts.reduce((s, d) => s + (d.total - d.paid), 0);
  score += debtLeft === 0 ? 25 : Math.max(0, 25 - Math.min(25, (debtLeft / Math.max(inc * 6, 1000)) * 25));
  // 4) progresso de metas (0–20)
  if (S.goals.length) score += (S.goals.reduce((s, g) => s + Math.min(1, g.current / g.target), 0) / S.goals.length) * 20;
  else score += 8;
  score = Math.round(Math.min(100, score));
  const label = score >= 75 ? ["Excelente", "#C8F65D"] : score >= 55 ? ["Boa", "#6EE7B7"] : score >= 35 ? ["Atenção", "#F5C451"] : ["Crítica", "#FF7A5C"];
  return { score, label: label[0], color: label[1] };
}

/* ═══════════════════════════ UI PRIMITIVES ═══════════════════════════ */
const Modal = ({ title, onClose, children }) => (
  <div className="fx-overlay" onClick={onClose}>
    <div className="fx-modal" onClick={(e) => e.stopPropagation()}>
      <div className="fx-modal-head">
        <b>{title}</b>
        <button className="fx-icon-btn" onClick={onClose}><X size={17} /></button>
      </div>
      {children}
    </div>
  </div>
);

const Bar = ({ pct, color }) => (
  <div className="fx-bar"><div style={{ width: `${Math.min(100, pct)}%`, background: color }} /></div>
);

const Empty = ({ text, action, onAction }) => (
  <div className="fx-empty2">
    <p>{text}</p>
    {action && <button className="fx-link" onClick={onAction}>{action}</button>}
  </div>
);


const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(isStandalonePWA());

    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !deferredPrompt) return null;

  return (
    <button
      className="fx-install-btn"
      onClick={async () => {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setDeferredPrompt(null);
      }}
      title="Instalar como aplicativo"
    >
      Instalar
    </button>
  );
};

const BackupCard = ({ onExport, onImport }) => (
  <section className="fx-card">
    <div className="fx-card-title">Backup dos dados</div>
    <p className="fx-backup-text">
      Seus dados ficam salvos neste navegador. Exporte um backup antes de trocar de aparelho, limpar cache ou mudar de domínio.
    </p>
    <div className="fx-backup-actions">
      <button className="fx-mini-btn" onClick={onExport}>Exportar backup</button>
      <label className="fx-mini-btn fx-file-btn">
        Importar backup
        <input type="file" accept="application/json" onChange={(e) => onImport(e.target.files?.[0])} />
      </label>
    </div>
  </section>
);

/* ═══════════════════════════ APP ═══════════════════════════ */
export default function App() {
  const [S, setS] = useState(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("inicio");
  const [cursor, setCursor] = useState(nowKey());
  const [txModal, setTxModal] = useState(null); // null | {} novo | tx existente
  const [subModal, setSubModal] = useState(null); // {kind, item}

  /* ---- load + migração ---- */
  useEffect(() => {
    (async () => {
      let st = null;
      try { const r = await window.storage.get("fluxo:v2"); if (r?.value) st = JSON.parse(r.value); } catch {}
      if (!st) {
        try {
          const old = await window.storage.get("fluxo:tx");
          if (old?.value) st = { ...EMPTY, tx: migrateV1(JSON.parse(old.value)) };
        } catch {}
      }
      setS(st || EMPTY());
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => { try { await window.storage.set("fluxo:v2", JSON.stringify(S)); } catch {} })();
  }, [S, loaded]);

  /* ---- derivados ---- */
  const allCats = useMemo(() => ({
    despesa: [...DEFAULT_CATS.despesa, ...S.customCats.despesa],
    receita: [...DEFAULT_CATS.receita, ...S.customCats.receita],
  }), [S.customCats]);
  const catMeta = (name) => [...allCats.despesa, ...allCats.receita].find((c) => c.name === name) || { icon: "📦", color: "#9CA3AF" };

  const monthTx = useMemo(() => S.tx.filter((t) => mKey(t.date) === cursor), [S.tx, cursor]);
  const mIn = monthTx.filter((t) => t.type === "receita").reduce((s, t) => s + t.amount, 0);
  const mOut = monthTx.filter((t) => t.type === "despesa").reduce((s, t) => s + t.amount, 0);
  const balance = useMemo(() => S.tx.filter((t) => t.status !== "pendente").reduce((s, t) => s + (t.type === "receita" ? t.amount : -t.amount), 0), [S.tx]);

  const budgetTotal = Object.values(S.budgets).reduce((s, v) => s + (v || 0), 0);
  const budgetUsedPct = budgetTotal > 0 ? (mOut / budgetTotal) * 100 : null;

  const runway = useMemo(() => {
    const by = {};
    S.tx.forEach((t) => { if (t.type === "despesa") by[mKey(t.date)] = (by[mKey(t.date)] || 0) + t.amount; });
    const ms = Object.keys(by).sort().slice(-6);
    if (!ms.length) return null;
    const avg = ms.reduce((s, m) => s + by[m], 0) / ms.length;
    return avg > 0 ? { avg, meses: balance / avg } : null;
  }, [S.tx, balance]);

  const insights = useMemo(() => buildInsights(S, cursor), [S, cursor]);
  const health = useMemo(() => healthScore(S, cursor), [S, cursor]);

  const upd = (patch) => setS((p) => ({ ...p, ...patch }));

  /* ---- ações tx ---- */
  const saveTx = (tx) => {
    upd({ tx: tx.id && S.tx.some((t) => t.id === tx.id) ? S.tx.map((t) => (t.id === tx.id ? tx : t)) : [...S.tx, { ...tx, id: uid() }] });
    setTxModal(null);
  };
  const delTx = (id) => upd({ tx: S.tx.filter((t) => t.id !== id) });
  const toggleStatus = (id) => upd({ tx: S.tx.map((t) => (t.id === id ? { ...t, status: t.status === "pendente" ? "efetivado" : "pendente" } : t)) });

  const launchRecurring = (r) => {
    const day = String(Math.min(r.day, 28)).padStart(2, "0");
    upd({ tx: [...S.tx, { id: uid(), title: r.title, amount: r.amount, type: r.type, category: r.category, date: `${cursor}-${day}`, status: "pendente", payment: "Boleto", notes: "recorrente" }] });
  };

  const exportBackup = () => {
    try {
      const safeParse = (key) => {
        const raw = window.localStorage.getItem(key);
        if (!raw) return null;
        try { return JSON.parse(raw); } catch { return raw; }
      };
      const payload = {
        app: "Fluxo Financeiro",
        version: 3,
        exportedAt: new Date().toISOString(),
        keys: {
          "fluxo:v2": S,
          "fluxo:jobs": safeParse("fluxo:jobs"),
        },
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-fluxo-${todayISO()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Não consegui gerar o backup neste navegador.");
    }
  };

  const importBackup = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || "{}"));
        const keys = data.keys || data;
        if (keys["fluxo:v2"]) window.localStorage.setItem("fluxo:v2", JSON.stringify(keys["fluxo:v2"]));
        if (keys["fluxo:jobs"]) window.localStorage.setItem("fluxo:jobs", JSON.stringify(keys["fluxo:jobs"]));
        alert("Backup importado. O app vai recarregar para aplicar os dados.");
        window.location.reload();
      } catch {
        alert("Arquivo de backup inválido.");
      }
    };
    reader.readAsText(file);
  };

  if (!loaded) return <div className="fx-root2" data-theme="dark"><style>{CSS}</style><div className="fx-loading">Carregando…</div></div>;

  return (
    <div className="fx-root2" data-theme={S.theme}>
      <style>{CSS}</style>

      {/* HEADER */}
      <header className="fx-top">
        <div className="fx-brand">
          <span className="fx-logo">F</span>
          <div>
            <div className="fx-name">Fluxo</div>
            <div className="fx-tag">painel financeiro pessoal</div>
          </div>
        </div>
        <div className="fx-head-actions">
          <PWAInstallButton />
          <button className="fx-icon-btn" onClick={() => upd({ theme: S.theme === "dark" ? "light" : "dark" })} title="Alternar tema">
            {S.theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      {/* NAV MÊS (compartilhada) */}
      <div className="fx-month-nav">
        <button onClick={() => setCursor(shiftMonth(cursor, -1))}><ChevronLeft size={17} /></button>
        <span>{monthLabel(cursor)}</span>
        <button onClick={() => setCursor(shiftMonth(cursor, 1))}><ChevronRight size={17} /></button>
      </div>

      <main className="fx-main">
        {tab === "inicio" && <Dashboard {...{ S, cursor, mIn, mOut, balance, runway, budgetUsedPct, insights, health, catMeta, monthTx, goTab: setTab }} />}
        {tab === "extrato" && <Extrato {...{ monthTx, allCats, catMeta, onEdit: (t) => setTxModal(t), onDel: delTx, onToggle: toggleStatus, onNew: () => setTxModal({}) }} />}
        {tab === "planejar" && <Planejar {...{ S, upd, monthTx, allCats, catMeta, setSubModal }} />}
        {tab === "contas" && <>
          <Contas {...{ S, upd, setSubModal, launchRecurring, catMeta, cursor }} />
          <BackupCard onExport={exportBackup} onImport={importBackup} />
        </>}
        {tab === "servicos" && <Servicos />}
      </main>

      {/* BOTTOM NAV */}
      <nav className="fx-nav">
        <button className={tab === "inicio" ? "on" : ""} onClick={() => setTab("inicio")}><Home size={19} /><span>Início</span></button>
        <button className={tab === "extrato" ? "on" : ""} onClick={() => setTab("extrato")}><List size={19} /><span>Extrato</span></button>
        <button className="fx-fab" onClick={() => setTxModal({})}><Plus size={22} /></button>
        <button className={tab === "planejar" ? "on" : ""} onClick={() => setTab("planejar")}><Target size={19} /><span>Planejar</span></button>
        <button className={tab === "contas" ? "on" : ""} onClick={() => setTab("contas")}><Wallet size={19} /><span>Contas</span></button>
        <button className={tab === "servicos" ? "on" : ""} onClick={() => setTab("servicos")}><Briefcase size={19} /><span>Serviços</span></button>
      </nav>

      {txModal !== null && <TxForm tx={txModal} allCats={allCats} onSave={saveTx} onClose={() => setTxModal(null)} />}
      {subModal && <SubForm modal={subModal} S={S} upd={upd} allCats={allCats} onClose={() => setSubModal(null)} />}
    </div>
  );
}

/* ═══════════════════════════ SCREEN: DASHBOARD ═══════════════════════════ */
function Dashboard({ S, cursor, mIn, mOut, balance, runway, budgetUsedPct, insights, health, catMeta, monthTx, goTab }) {
  const catData = useMemo(() => {
    const m = {};
    monthTx.filter((t) => t.type === "despesa").forEach((t) => { m[t.category] = (m[t.category] || 0) + t.amount; });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [monthTx]);

  const sixMonths = useMemo(() => {
    const out = [];
    for (let i = 5; i >= 0; i--) {
      const k = shiftMonth(cursor, -i);
      const tx = S.tx.filter((t) => mKey(t.date) === k);
      out.push({
        m: MONTHS[Number(k.slice(5)) - 1],
        receitas: tx.filter((t) => t.type === "receita").reduce((s, t) => s + t.amount, 0),
        despesas: tx.filter((t) => t.type === "despesa").reduce((s, t) => s + t.amount, 0),
      });
    }
    return out;
  }, [S.tx, cursor]);

  const today = new Date(); const in7 = new Date(); in7.setDate(today.getDate() + 7);
  const upcoming = S.tx
    .filter((t) => t.type === "despesa" && t.status === "pendente")
    .filter((t) => { const d = new Date(t.date + "T12:00"); return d <= in7; })
    .sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);

  const goalsDone = S.goals.filter((g) => g.current >= g.target).length;

  return (
    <>
      {/* HERO */}
      <section className="fx-hero">
        <div className="fx-hero-row">
          <div>
            <div className="fx-hero-label">Saldo atual</div>
            <div className={`fx-balance ${balance < 0 ? "neg" : ""}`}>{BRL(balance)}</div>
          </div>
          <div className="fx-health" style={{ "--hc": health.color }}>
            <svg viewBox="0 0 40 40" width="52" height="52">
              <circle cx="20" cy="20" r="16" fill="none" stroke="var(--line)" strokeWidth="4" />
              <circle cx="20" cy="20" r="16" fill="none" stroke={health.color} strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${(health.score / 100) * 100.5} 100.5`} transform="rotate(-90 20 20)" />
            </svg>
            <div className="fx-health-txt"><b>{health.score}</b><span>{health.label}</span></div>
          </div>
        </div>
        {runway && (
          <div className="fx-runway">
            <TrendingUp size={14} />
            <span>≈ <b>{Math.max(0, runway.meses).toFixed(1)}</b> meses de fôlego</span>
            <span className="fx-runway-sub">gasto médio {BRL(runway.avg)}/mês</span>
          </div>
        )}
      </section>

      {/* CARDS DO MÊS */}
      <div className="fx-grid3">
        <div className="fx-tile"><span>Receitas</span><b className="pos">{BRL(mIn)}</b></div>
        <div className="fx-tile"><span>Despesas</span><b className="neg">{BRL(mOut)}</b></div>
        <div className="fx-tile"><span>Balanço</span><b className={mIn - mOut < 0 ? "neg" : "pos"}>{BRL(mIn - mOut)}</b></div>
      </div>

      {budgetUsedPct !== null && (
        <section className="fx-card">
          <div className="fx-between">
            <span className="fx-card-title" style={{ margin: 0 }}>Orçamento do mês</span>
            <b className="fx-mono" style={{ color: budgetUsedPct > 100 ? "var(--coral)" : budgetUsedPct > 80 ? "#F5C451" : "var(--lime)" }}>{Math.round(budgetUsedPct)}%</b>
          </div>
          <Bar pct={budgetUsedPct} color={budgetUsedPct > 100 ? "var(--coral)" : budgetUsedPct > 80 ? "#F5C451" : "var(--lime)"} />
        </section>
      )}

      {/* INSIGHTS */}
      {insights.length > 0 && (
        <section className="fx-card">
          <div className="fx-card-title"><Sparkles size={13} style={{ verticalAlign: "-2px" }} /> Insights</div>
          <ul className="fx-insights">
            {insights.map((i, k) => <li key={k}><span>{i.icon}</span>{i.text}</li>)}
          </ul>
        </section>
      )}

      {/* PRÓXIMAS CONTAS */}
      {upcoming.length > 0 && (
        <section className="fx-card">
          <div className="fx-card-title">Próximas contas</div>
          <ul className="fx-mini-list">
            {upcoming.map((t) => (
              <li key={t.id}>
                <span className="ico">{catMeta(t.category).icon}</span>
                <span className="nm">{t.title}</span>
                <span className="dt">{fmtDia(t.date)}</span>
                <b className="neg fx-mono">{BRL(t.amount)}</b>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* DONUT CATEGORIAS */}
      {catData.length > 0 && (
        <section className="fx-card">
          <div className="fx-card-title">Despesas por categoria</div>
          <div className="fx-chart">
            <div className="fx-donut">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={catData} dataKey="value" innerRadius={40} outerRadius={60} paddingAngle={2} stroke="none">
                    {catData.map((c, i) => <Cell key={i} fill={catMeta(c.name).color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="fx-donut-center"><span>total</span><b>{BRL(mOut)}</b></div>
            </div>
            <ul className="fx-legend">
              {catData.slice(0, 6).map((c) => (
                <li key={c.name}>
                  <span className="dot" style={{ background: catMeta(c.name).color }} />
                  <span className="lname">{c.name}</span>
                  <span className="lval fx-mono">{BRL(c.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* EVOLUÇÃO 6 MESES */}
      <section className="fx-card">
        <div className="fx-card-title">Receitas × despesas — 6 meses</div>
        <div style={{ width: "100%", height: 160 }}>
          <ResponsiveContainer>
            <BarChart data={sixMonths} barGap={3}>
              <XAxis dataKey="m" tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip formatter={(v) => BRL(v)} contentStyle={{ background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 10, fontSize: 12 }} labelStyle={{ color: "var(--muted)" }} />
              <ReBar dataKey="receitas" fill="#C8F65D" radius={[4, 4, 0, 0]} />
              <ReBar dataKey="despesas" fill="#FF7A5C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* RESUMO METAS */}
      <section className="fx-card fx-clickable" onClick={() => goTab("planejar")}>
        <div className="fx-between">
          <div className="fx-card-title" style={{ margin: 0 }}>Metas</div>
          <span className="fx-muted-sm">{goalsDone}/{S.goals.length} concluídas</span>
        </div>
        {S.goals.slice(0, 2).map((g) => (
          <div key={g.id} style={{ marginTop: 10 }}>
            <div className="fx-between fx-sm"><span>{g.name}</span><span className="fx-mono">{Math.min(100, Math.round((g.current / g.target) * 100))}%</span></div>
            <Bar pct={(g.current / g.target) * 100} color="var(--lime)" />
          </div>
        ))}
        {S.goals.length === 0 && <Empty text="Nenhuma meta ainda." />}
      </section>
    </>
  );
}

/* ═══════════════════════════ SCREEN: EXTRATO ═══════════════════════════ */
function Extrato({ monthTx, allCats, catMeta, onEdit, onDel, onToggle, onNew }) {
  const [q, setQ] = useState("");
  const [fType, setFType] = useState("todos");
  const [fCat, setFCat] = useState("todas");
  const [fStatus, setFStatus] = useState("todos");

  const cats = fType === "receita" ? allCats.receita : fType === "despesa" ? allCats.despesa : [...allCats.despesa, ...allCats.receita];
  const list = monthTx
    .filter((t) => fType === "todos" || t.type === fType)
    .filter((t) => fCat === "todas" || t.category === fCat)
    .filter((t) => fStatus === "todos" || t.status === fStatus)
    .filter((t) => !q || (t.title + t.category + (t.notes || "")).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

  return (
    <>
      <div className="fx-search">
        <Search size={15} />
        <input placeholder="Pesquisar lançamento…" value={q} onChange={(e) => setQ(e.target.value)} />
        {q && <button className="fx-icon-btn" onClick={() => setQ("")}><X size={14} /></button>}
      </div>
      <div className="fx-filters">
        <select value={fType} onChange={(e) => { setFType(e.target.value); setFCat("todas"); }}>
          <option value="todos">Tudo</option><option value="receita">Receitas</option><option value="despesa">Despesas</option>
        </select>
        <select value={fCat} onChange={(e) => setFCat(e.target.value)}>
          <option value="todas">Todas categorias</option>
          {cats.map((c) => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
        </select>
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
          <option value="todos">Status</option><option value="efetivado">Efetivado</option><option value="pendente">Pendente</option>
        </select>
      </div>

      <section className="fx-card">
        <div className="fx-card-title">{list.length} lançamento{list.length !== 1 ? "s" : ""}</div>
        {list.length === 0 ? (
          <Empty text="Nada por aqui neste mês." action="+ adicionar lançamento" onAction={onNew} />
        ) : (
          <ul className="fx-list">
            {list.map((t) => (
              <li key={t.id}>
                <button className="fx-status" onClick={() => onToggle(t.id)} title={t.status === "pendente" ? "Marcar como pago/recebido" : "Marcar como pendente"}>
                  {t.status === "pendente" ? <Clock size={16} color="#F5C451" /> : <CheckCircle2 size={16} color="var(--lime)" />}
                </button>
                <span className="cat-ico">{catMeta(t.category).icon}</span>
                <div className="fx-item-main">
                  <span className="fx-item-desc">{t.title}{t.status === "pendente" && <em className="fx-pend"> · pendente</em>}</span>
                  <span className="fx-item-meta">{t.category} · {fmtDia(t.date)} · {t.payment}</span>
                </div>
                <span className={`fx-item-val fx-mono ${t.type === "receita" ? "pos" : "neg"}`}>
                  {t.type === "receita" ? "+" : "−"}{BRL(t.amount).replace("R$", "").trim()}
                </span>
                <button className="fx-icon-btn dim" onClick={() => onEdit(t)}><Pencil size={14} /></button>
                <button className="fx-icon-btn dim" onClick={() => onDel(t.id)}><Trash2 size={14} /></button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

/* ═══════════════════════════ SCREEN: PLANEJAR (orçamentos + metas) ═══════════════════════════ */
function Planejar({ S, upd, monthTx, allCats, catMeta, setSubModal }) {
  const spent = (cat) => monthTx.filter((t) => t.type === "despesa" && t.category === cat).reduce((s, t) => s + t.amount, 0);
  const budgets = Object.entries(S.budgets).filter(([, l]) => l > 0);

  return (
    <>
      <section className="fx-card">
        <div className="fx-between">
          <div className="fx-card-title" style={{ margin: 0 }}>Orçamentos por categoria</div>
          <button className="fx-mini-btn" onClick={() => setSubModal({ kind: "budget" })}><Plus size={13} /> limite</button>
        </div>
        {budgets.length === 0 && <Empty text="Defina limites de gasto por categoria." />}
        {budgets.map(([cat, lim]) => {
          const sp = spent(cat), pct = (sp / lim) * 100;
          const color = pct > 100 ? "var(--coral)" : pct > 80 ? "#F5C451" : "var(--lime)";
          return (
            <div key={cat} className="fx-budget">
              <div className="fx-between fx-sm">
                <span>{catMeta(cat).icon} {cat} {pct > 100 && <AlertTriangle size={12} color="var(--coral)" style={{ verticalAlign: "-1px" }} />}</span>
                <span className="fx-mono">{BRL(sp)} / {BRL(lim)}</span>
              </div>
              <Bar pct={pct} color={color} />
              <div className="fx-between fx-xs">
                <span style={{ color }}>{Math.round(pct)}% usado</span>
                <span className="fx-muted-sm">{pct >= 100 ? `${BRL(sp - lim)} acima` : `resta ${BRL(lim - sp)}`}</span>
              </div>
              <button className="fx-icon-btn dim fx-budget-del" onClick={() => { const b = { ...S.budgets }; delete b[cat]; upd({ budgets: b }); }}><Trash2 size={13} /></button>
            </div>
          );
        })}
      </section>

      <section className="fx-card">
        <div className="fx-between">
          <div className="fx-card-title" style={{ margin: 0 }}>Metas financeiras</div>
          <button className="fx-mini-btn" onClick={() => setSubModal({ kind: "goal" })}><Plus size={13} /> meta</button>
        </div>
        {S.goals.length === 0 && <Empty text="Crie metas: reserva, viagem, equipamento…" />}
        {S.goals.map((g) => {
          const pct = Math.min(100, (g.current / g.target) * 100);
          const falta = Math.max(0, g.target - g.current);
          const meses = g.deadline ? Math.max(1, Math.ceil((new Date(g.deadline) - new Date()) / (30.44 * 864e5))) : null;
          return (
            <div key={g.id} className="fx-budget">
              <div className="fx-between fx-sm">
                <span>🎯 {g.name}</span>
                <span className="fx-mono">{BRL(g.current)} / {BRL(g.target)}</span>
              </div>
              <Bar pct={pct} color={pct >= 100 ? "var(--lime)" : "#6EE7B7"} />
              <div className="fx-between fx-xs">
                <span className="fx-muted-sm">{Math.round(pct)}%{g.deadline ? ` · até ${fmtDia(g.deadline)}/${g.deadline.slice(2, 4)}` : ""}</span>
                <span className="fx-muted-sm">{falta === 0 ? "concluída 🏆" : meses ? `guarde ${BRL(falta / meses)}/mês` : `faltam ${BRL(falta)}`}</span>
              </div>
              <div className="fx-goal-actions">
                <button className="fx-mini-btn" onClick={() => { const v = prompt("Adicionar quanto à meta? (R$)"); const n = parseNum(v); if (n > 0) upd({ goals: S.goals.map((x) => x.id === g.id ? { ...x, current: x.current + n } : x) }); }}>+ aporte</button>
                <button className="fx-icon-btn dim" onClick={() => setSubModal({ kind: "goal", item: g })}><Pencil size={13} /></button>
                <button className="fx-icon-btn dim" onClick={() => upd({ goals: S.goals.filter((x) => x.id !== g.id) })}><Trash2 size={13} /></button>
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}

/* ═══════════════════════════ SCREEN: CONTAS (dívidas + cartões + recorrentes) ═══════════════════════════ */
function Contas({ S, upd, setSubModal, launchRecurring, catMeta, cursor }) {
  const recTotal = S.recurring.filter((r) => r.type === "despesa").reduce((s, r) => s + r.amount, 0);
  const alreadyLaunched = (r) => S.tx.some((t) => mKey(t.date) === cursor && t.notes === "recorrente" && t.title === r.title);

  return (
    <>
      {/* DÍVIDAS */}
      <section className="fx-card">
        <div className="fx-between">
          <div className="fx-card-title" style={{ margin: 0 }}><Landmark size={13} style={{ verticalAlign: "-2px" }} /> Dívidas e parcelas</div>
          <button className="fx-mini-btn" onClick={() => setSubModal({ kind: "debt" })}><Plus size={13} /> dívida</button>
        </div>
        {S.debts.length === 0 && <Empty text="Nenhuma dívida cadastrada. 🎉" />}
        {S.debts.map((d) => {
          const pct = (d.paid / d.total) * 100;
          return (
            <div key={d.id} className="fx-budget">
              <div className="fx-between fx-sm">
                <span>{d.name}{d.creditor ? ` · ${d.creditor}` : ""}</span>
                <span className="fx-mono">{BRL(d.paid)} / {BRL(d.total)}</span>
              </div>
              <Bar pct={pct} color={pct >= 100 ? "var(--lime)" : "#A78BFA"} />
              <div className="fx-between fx-xs">
                <span className="fx-muted-sm">{d.paidInst}/{d.installments} parcelas · venc. dia {d.dueDay}</span>
                <span className="fx-muted-sm">{pct >= 100 ? "quitada ✓" : `resta ${BRL(d.total - d.paid)}`}</span>
              </div>
              <div className="fx-goal-actions">
                {d.paidInst < d.installments && (
                  <button className="fx-mini-btn" onClick={() => {
                    const parcela = d.total / d.installments;
                    upd({ debts: S.debts.map((x) => x.id === d.id ? { ...x, paid: Math.min(d.total, x.paid + parcela), paidInst: x.paidInst + 1 } : x) });
                  }}><Check size={12} /> pagar parcela ({BRL(d.total / d.installments)})</button>
                )}
                <button className="fx-icon-btn dim" onClick={() => setSubModal({ kind: "debt", item: d })}><Pencil size={13} /></button>
                <button className="fx-icon-btn dim" onClick={() => upd({ debts: S.debts.filter((x) => x.id !== d.id) })}><Trash2 size={13} /></button>
              </div>
            </div>
          );
        })}
      </section>

      {/* CARTÕES */}
      <section className="fx-card">
        <div className="fx-between">
          <div className="fx-card-title" style={{ margin: 0 }}><CreditCard size={13} style={{ verticalAlign: "-2px" }} /> Cartões de crédito</div>
          <button className="fx-mini-btn" onClick={() => setSubModal({ kind: "card" })}><Plus size={13} /> cartão</button>
        </div>
        {S.cards.length === 0 && <Empty text="Cadastre seus cartões para acompanhar limite e fatura." />}
        {S.cards.map((c) => {
          const pct = (c.used / c.limit) * 100;
          const bestDay = c.closeDay >= 28 ? 1 : c.closeDay + 1;
          return (
            <div key={c.id} className="fx-budget">
              <div className="fx-between fx-sm">
                <span>💳 {c.name}</span>
                <span className="fx-mono">{BRL(c.used)} / {BRL(c.limit)}</span>
              </div>
              <Bar pct={pct} color={pct > 80 ? "var(--coral)" : "#67C7FF"} />
              <div className="fx-between fx-xs">
                <span className="fx-muted-sm">disponível {BRL(c.limit - c.used)}</span>
                <span className="fx-muted-sm">fecha dia {c.closeDay} · vence dia {c.dueDay} · melhor compra dia {bestDay}</span>
              </div>
              <div className="fx-goal-actions">
                <button className="fx-icon-btn dim" onClick={() => setSubModal({ kind: "card", item: c })}><Pencil size={13} /></button>
                <button className="fx-icon-btn dim" onClick={() => upd({ cards: S.cards.filter((x) => x.id !== c.id) })}><Trash2 size={13} /></button>
              </div>
            </div>
          );
        })}
      </section>

      {/* RECORRENTES */}
      <section className="fx-card">
        <div className="fx-between">
          <div className="fx-card-title" style={{ margin: 0 }}><Repeat size={13} style={{ verticalAlign: "-2px" }} /> Recorrentes · previsão {BRL(recTotal)}/mês</div>
          <button className="fx-mini-btn" onClick={() => setSubModal({ kind: "recurring" })}><Plus size={13} /> item</button>
        </div>
        {S.recurring.length === 0 && <Empty text="Netflix, aluguel, DAS, academia…" />}
        <ul className="fx-mini-list">
          {S.recurring.map((r) => (
            <li key={r.id}>
              <span className="ico">{catMeta(r.category).icon}</span>
              <span className="nm">{r.title}<em className="fx-muted-sm"> · dia {r.day}</em></span>
              <b className={`fx-mono ${r.type === "receita" ? "pos" : "neg"}`}>{BRL(r.amount)}</b>
              {alreadyLaunched(r)
                ? <span className="fx-launched"><Check size={13} /> no mês</span>
                : <button className="fx-mini-btn" onClick={() => launchRecurring(r)}>lançar</button>}
              <button className="fx-icon-btn dim" onClick={() => upd({ recurring: S.recurring.filter((x) => x.id !== r.id) })}><Trash2 size={13} /></button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

/* ═══════════════════════════ FORM: LANÇAMENTO ═══════════════════════════ */
function TxForm({ tx, allCats, onSave, onClose }) {
  const editing = !!tx.id;
  const [f, setF] = useState({
    title: tx.title || "", amount: tx.amount ? String(tx.amount).replace(".", ",") : "",
    type: tx.type || "despesa", category: tx.category || (tx.type === "receita" ? "Tattoo" : "Alimentação"),
    date: tx.date || todayISO(), status: tx.status || "efetivado", payment: tx.payment || "Pix", notes: tx.notes || "",
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const cats = allCats[f.type];
  const valid = parseNum(f.amount) > 0;

  return (
    <Modal title={editing ? "Editar lançamento" : "Novo lançamento"} onClose={onClose}>
      <div className="fx-toggle">
        {["despesa", "receita"].map((tp) => (
          <button key={tp} className={f.type === tp ? `on ${tp === "receita" ? "entrada" : "saida"}` : ""}
            onClick={() => { set("type", tp); set("category", allCats[tp][0].name); }}>
            {tp === "receita" ? "Receita" : "Despesa"}
          </button>
        ))}
      </div>
      <div className="fx-row">
        <input className="fx-amount" inputMode="decimal" placeholder="0,00" value={f.amount} onChange={(e) => set("amount", e.target.value)} autoFocus />
        <select value={f.category} onChange={(e) => set("category", e.target.value)}>
          {cats.map((c) => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
        </select>
      </div>
      <input placeholder="Título (ex.: Sessão de tattoo, Mercado…)" value={f.title} onChange={(e) => set("title", e.target.value)} style={{ marginBottom: 9 }} />
      <div className="fx-row">
        <input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} />
        <select value={f.payment} onChange={(e) => set("payment", e.target.value)}>
          {PAYMENTS.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div className="fx-row">
        <select value={f.status} onChange={(e) => set("status", e.target.value)}>
          <option value="efetivado">{f.type === "receita" ? "Recebida" : "Paga"}</option>
          <option value="pendente">Pendente</option>
        </select>
        <input placeholder="Observações" value={f.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>
      <button className="fx-add" disabled={!valid} onClick={() => valid && onSave({ ...tx, ...f, amount: parseNum(f.amount), title: f.title.trim() || f.category })}>
        {editing ? "Salvar alterações" : "Adicionar"}
      </button>
    </Modal>
  );
}

/* ═══════════════════════════ FORM: SUBCADASTROS (orçamento/meta/dívida/cartão/recorrente) ═══════════════════════════ */
function SubForm({ modal, S, upd, allCats, onClose }) {
  const { kind, item } = modal;
  const [f, setF] = useState(() => {
    if (kind === "budget") return { cat: allCats.despesa[0].name, limit: "" };
    if (kind === "goal") return { name: item?.name || "", target: item ? String(item.target) : "", current: item ? String(item.current) : "0", deadline: item?.deadline || "" };
    if (kind === "debt") return { name: item?.name || "", total: item ? String(item.total) : "", paid: item ? String(item.paid) : "0", installments: item ? String(item.installments) : "12", paidInst: item ? String(item.paidInst) : "0", dueDay: item ? String(item.dueDay) : "10", creditor: item?.creditor || "" };
    if (kind === "card") return { name: item?.name || "", limit: item ? String(item.limit) : "", used: item ? String(item.used) : "0", closeDay: item ? String(item.closeDay) : "28", dueDay: item ? String(item.dueDay) : "7" };
    return { title: item?.title || "", amount: item ? String(item.amount) : "", type: item?.type || "despesa", category: item?.category || "Assinaturas", day: item ? String(item.day) : "10" };
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const titles = { budget: "Limite por categoria", goal: item ? "Editar meta" : "Nova meta", debt: item ? "Editar dívida" : "Nova dívida", card: item ? "Editar cartão" : "Novo cartão", recurring: "Novo recorrente" };

  const save = () => {
    if (kind === "budget") { const l = parseNum(f.limit); if (l > 0) upd({ budgets: { ...S.budgets, [f.cat]: l } }); }
    if (kind === "goal") {
      const g = { id: item?.id || uid(), name: f.name.trim() || "Meta", target: parseNum(f.target), current: parseNum(f.current), deadline: f.deadline };
      if (g.target > 0) upd({ goals: item ? S.goals.map((x) => x.id === g.id ? g : x) : [...S.goals, g] });
    }
    if (kind === "debt") {
      const d = { id: item?.id || uid(), name: f.name.trim() || "Dívida", total: parseNum(f.total), paid: parseNum(f.paid), installments: Math.max(1, parseInt(f.installments) || 1), paidInst: parseInt(f.paidInst) || 0, dueDay: parseInt(f.dueDay) || 10, creditor: f.creditor.trim() };
      if (d.total > 0) upd({ debts: item ? S.debts.map((x) => x.id === d.id ? d : x) : [...S.debts, d] });
    }
    if (kind === "card") {
      const c = { id: item?.id || uid(), name: f.name.trim() || "Cartão", limit: parseNum(f.limit), used: parseNum(f.used), closeDay: parseInt(f.closeDay) || 28, dueDay: parseInt(f.dueDay) || 7 };
      if (c.limit > 0) upd({ cards: item ? S.cards.map((x) => x.id === c.id ? c : x) : [...S.cards, c] });
    }
    if (kind === "recurring") {
      const r = { id: item?.id || uid(), title: f.title.trim() || "Recorrente", amount: parseNum(f.amount), type: f.type, category: f.category, day: Math.min(28, Math.max(1, parseInt(f.day) || 10)) };
      if (r.amount > 0) upd({ recurring: item ? S.recurring.map((x) => x.id === r.id ? r : x) : [...S.recurring, r] });
    }
    onClose();
  };

  return (
    <Modal title={titles[kind]} onClose={onClose}>
      {kind === "budget" && (<>
        <div className="fx-row">
          <select value={f.cat} onChange={(e) => set("cat", e.target.value)}>
            {allCats.despesa.map((c) => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
          </select>
          <input className="fx-amount" inputMode="decimal" placeholder="Limite R$" value={f.limit} onChange={(e) => set("limit", e.target.value)} autoFocus />
        </div>
      </>)}
      {kind === "goal" && (<>
        <input placeholder="Nome da meta" value={f.name} onChange={(e) => set("name", e.target.value)} style={{ marginBottom: 9 }} autoFocus />
        <div className="fx-row">
          <input inputMode="decimal" placeholder="Valor alvo R$" value={f.target} onChange={(e) => set("target", e.target.value)} />
          <input inputMode="decimal" placeholder="Já guardado R$" value={f.current} onChange={(e) => set("current", e.target.value)} />
        </div>
        <div className="fx-row"><input type="date" value={f.deadline} onChange={(e) => set("deadline", e.target.value)} /></div>
      </>)}
      {kind === "debt" && (<>
        <div className="fx-row">
          <input placeholder="Nome da dívida" value={f.name} onChange={(e) => set("name", e.target.value)} autoFocus />
          <input placeholder="Credor" value={f.creditor} onChange={(e) => set("creditor", e.target.value)} />
        </div>
        <div className="fx-row">
          <input inputMode="decimal" placeholder="Valor total R$" value={f.total} onChange={(e) => set("total", e.target.value)} />
          <input inputMode="decimal" placeholder="Já pago R$" value={f.paid} onChange={(e) => set("paid", e.target.value)} />
        </div>
        <div className="fx-row">
          <input inputMode="numeric" placeholder="Nº parcelas" value={f.installments} onChange={(e) => set("installments", e.target.value)} />
          <input inputMode="numeric" placeholder="Parcelas pagas" value={f.paidInst} onChange={(e) => set("paidInst", e.target.value)} />
          <input inputMode="numeric" placeholder="Dia venc." value={f.dueDay} onChange={(e) => set("dueDay", e.target.value)} />
        </div>
      </>)}
      {kind === "card" && (<>
        <input placeholder="Nome do cartão" value={f.name} onChange={(e) => set("name", e.target.value)} style={{ marginBottom: 9 }} autoFocus />
        <div className="fx-row">
          <input inputMode="decimal" placeholder="Limite total R$" value={f.limit} onChange={(e) => set("limit", e.target.value)} />
          <input inputMode="decimal" placeholder="Usado R$" value={f.used} onChange={(e) => set("used", e.target.value)} />
        </div>
        <div className="fx-row">
          <input inputMode="numeric" placeholder="Dia fechamento" value={f.closeDay} onChange={(e) => set("closeDay", e.target.value)} />
          <input inputMode="numeric" placeholder="Dia vencimento" value={f.dueDay} onChange={(e) => set("dueDay", e.target.value)} />
        </div>
      </>)}
      {kind === "recurring" && (<>
        <div className="fx-row">
          <input placeholder="Nome (ex.: Netflix)" value={f.title} onChange={(e) => set("title", e.target.value)} autoFocus />
          <input inputMode="decimal" placeholder="Valor R$" value={f.amount} onChange={(e) => set("amount", e.target.value)} />
        </div>
        <div className="fx-row">
          <select value={f.type} onChange={(e) => { set("type", e.target.value); set("category", allCats[e.target.value][0].name); }}>
            <option value="despesa">Despesa</option><option value="receita">Receita</option>
          </select>
          <select value={f.category} onChange={(e) => set("category", e.target.value)}>
            {allCats[f.type].map((c) => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
          </select>
          <input inputMode="numeric" placeholder="Dia" value={f.day} onChange={(e) => set("day", e.target.value)} />
        </div>
      </>)}
      <button className="fx-add" onClick={save}>Salvar</button>
    </Modal>
  );
}

/* ═══════════════════════════ STYLES ═══════════════════════════ */
const CSS = `
.fx-root2{
  --lime:#C8F65D; --coral:#FF7A5C;
  font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
  min-height:100vh; max-width:520px; margin:0 auto; padding:16px 14px 86px;
  box-sizing:border-box; transition:background .25s,color .25s;
}
.fx-root2[data-theme="dark"]{
  --ink:#0E0F13; --panel:#16181F; --panel2:#1E212B; --line:#2A2E3A;
  --text:#ECEEF2; --muted:#878E9C;
  background:var(--ink); color:var(--text);
}
.fx-root2[data-theme="light"]{
  --ink:#F4F5F8; --panel:#FFFFFF; --panel2:#EEF0F5; --line:#DDE1EA;
  --text:#171A21; --muted:#6A7180;
  background:var(--ink); color:var(--text);
}
.fx-root2 *{box-sizing:border-box}
.fx-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-variant-numeric:tabular-nums}
.pos{color:#7CB93A} .neg{color:var(--coral)}
.fx-root2[data-theme="dark"] .pos{color:var(--lime)}
.fx-loading{text-align:center;padding:60px 0;color:var(--muted)}

.fx-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.fx-head-actions{display:flex;align-items:center;gap:8px}
.fx-install-btn{background:var(--lime);color:#0E0F13;border:none;border-radius:9px;padding:8px 10px;font-size:12px;font-weight:800;cursor:pointer}
.fx-brand{display:flex;align-items:center;gap:11px}
.fx-logo{width:36px;height:36px;border-radius:11px;background:var(--lime);color:#0E0F13;display:grid;place-items:center;font-weight:800;font-size:19px}
.fx-name{font-weight:700;font-size:17px;letter-spacing:-.3px}
.fx-tag{font-size:11px;color:var(--muted)}
.fx-icon-btn{background:none;border:1px solid var(--line);color:var(--muted);width:32px;height:32px;border-radius:9px;display:grid;place-items:center;cursor:pointer;flex:0 0 auto}
.fx-icon-btn:hover{color:var(--text);border-color:var(--muted)}
.fx-icon-btn.dim{border:none;width:28px;height:28px}

.fx-month-nav{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:12px;font-weight:600;font-size:14px}
.fx-month-nav button{background:var(--panel);border:1px solid var(--line);color:var(--text);width:30px;height:30px;border-radius:9px;display:grid;place-items:center;cursor:pointer}
.fx-month-nav span{min-width:135px;text-align:center}

.fx-hero{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:16px;margin-bottom:12px}
.fx-root2[data-theme="dark"] .fx-hero{background:linear-gradient(160deg,#1a1d26,#121419)}
.fx-hero-row{display:flex;justify-content:space-between;align-items:center;gap:12px}
.fx-hero-label{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1.4px;margin-bottom:4px}
.fx-balance{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:31px;font-weight:600;letter-spacing:-.8px;font-variant-numeric:tabular-nums;color:#7CB93A}
.fx-root2[data-theme="dark"] .fx-balance{color:var(--lime)}
.fx-balance.neg{color:var(--coral)!important}
.fx-health{position:relative;flex:0 0 52px}
.fx-health-txt{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1}
.fx-health-txt b{font-size:14px;font-family:ui-monospace,monospace}
.fx-health-txt span{font-size:7px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-top:2px}
.fx-runway{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:11px;font-size:12.5px;background:rgba(200,246,93,.09);border:1px solid rgba(200,246,93,.22);padding:7px 11px;border-radius:10px;width:fit-content}
.fx-root2[data-theme="light"] .fx-runway{background:rgba(124,185,58,.1);border-color:rgba(124,185,58,.3)}
.fx-runway svg{color:#7CB93A}
.fx-root2[data-theme="dark"] .fx-runway svg{color:var(--lime)}
.fx-runway b{font-family:ui-monospace,monospace}
.fx-runway-sub{color:var(--muted);font-size:11px}

.fx-grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}
.fx-tile{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:10px 11px;display:flex;flex-direction:column;gap:4px}
.fx-tile span{font-size:11px;color:var(--muted)}
.fx-tile b{font-family:ui-monospace,monospace;font-size:13.5px;font-variant-numeric:tabular-nums;font-weight:600}

.fx-card{background:var(--panel);border:1px solid var(--line);border-radius:15px;padding:14px;margin-bottom:12px;position:relative}
.fx-card-title{font-size:11.5px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px}
.fx-clickable{cursor:pointer}
.fx-between{display:flex;justify-content:space-between;align-items:center;gap:8px}
.fx-sm{font-size:13px} .fx-xs{font-size:11px;margin-top:4px}
.fx-muted-sm{font-size:11px;color:var(--muted);font-style:normal}

.fx-bar{height:7px;background:var(--panel2);border-radius:99px;overflow:hidden;margin-top:6px}
.fx-bar div{height:100%;border-radius:99px;transition:width .35s}

.fx-insights{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.fx-insights li{display:flex;gap:9px;font-size:13px;line-height:1.4;background:var(--panel2);padding:9px 11px;border-radius:10px}

.fx-mini-list{list-style:none;margin:0;padding:0}
.fx-mini-list li{display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid var(--line);font-size:13px}
.fx-mini-list li:last-child{border:none}
.fx-mini-list .ico{flex:0 0 auto}
.fx-mini-list .nm{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fx-mini-list .dt{font-size:11px;color:var(--muted)}
.fx-launched{display:flex;align-items:center;gap:3px;font-size:11px;color:#7CB93A}
.fx-root2[data-theme="dark"] .fx-launched{color:var(--lime)}

.fx-chart{display:flex;gap:14px;align-items:center}
.fx-donut{position:relative;width:130px;height:130px;flex:0 0 130px}
.fx-donut-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none}
.fx-donut-center span{font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px}
.fx-donut-center b{font-family:ui-monospace,monospace;font-size:12px}
.fx-legend{list-style:none;margin:0;padding:0;flex:1;min-width:0}
.fx-legend li{display:flex;align-items:center;gap:7px;padding:3px 0;font-size:12.5px}
.fx-legend .dot{width:9px;height:9px;border-radius:3px;flex:0 0 9px}
.fx-legend .lname{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fx-legend .lval{font-size:11.5px;color:var(--muted)}

.fx-search{display:flex;align-items:center;gap:8px;background:var(--panel);border:1px solid var(--line);border-radius:11px;padding:0 11px;margin-bottom:9px;color:var(--muted)}
.fx-search input{background:none;border:none;color:var(--text);padding:11px 0;font-size:14px;flex:1;outline:none}
.fx-search .fx-icon-btn{border:none;width:24px;height:24px}
.fx-filters{display:grid;grid-template-columns:1fr 1.4fr 1fr;gap:7px;margin-bottom:12px}

.fx-list{list-style:none;margin:0;padding:0}
.fx-list li{display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid var(--line)}
.fx-list li:last-child{border:none}
.fx-status{background:none;border:none;cursor:pointer;padding:2px;display:grid;place-items:center;flex:0 0 auto}
.cat-ico{flex:0 0 auto;font-size:15px}
.fx-item-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.fx-item-desc{font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fx-pend{font-size:11px;color:#F5C451;font-style:normal}
.fx-item-meta{font-size:11px;color:var(--muted)}
.fx-item-val{font-size:13.5px;font-weight:600;flex:0 0 auto}

.fx-budget{padding:11px 0;border-bottom:1px solid var(--line);position:relative}
.fx-budget:last-child{border:none;padding-bottom:2px}
.fx-budget-del{position:absolute;top:8px;right:-6px}
.fx-goal-actions{display:flex;align-items:center;gap:6px;margin-top:8px}

.fx-mini-btn{background:var(--panel2);border:1px solid var(--line);color:var(--text);border-radius:8px;padding:5px 10px;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px}
.fx-mini-btn:hover{border-color:var(--muted)}
.fx-link{background:none;border:none;color:#7CB93A;cursor:pointer;font-size:13px;text-decoration:underline}
.fx-root2[data-theme="dark"] .fx-link{color:var(--lime)}
.fx-empty2{text-align:center;padding:12px 0;color:var(--muted);font-size:13px}
.fx-backup-text{font-size:13px;line-height:1.45;color:var(--muted);margin:0 0 11px}
.fx-backup-actions{display:flex;gap:8px;flex-wrap:wrap}
.fx-file-btn{position:relative;overflow:hidden}
.fx-file-btn input{position:absolute;inset:0;opacity:0;cursor:pointer}

.fx-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:520px;
  background:var(--panel);border-top:1px solid var(--line);display:grid;grid-template-columns:1fr 1fr auto 1fr 1fr 1fr;
  align-items:center;padding:7px 10px calc(7px + env(safe-area-inset-bottom));gap:4px;z-index:50}
.fx-nav button{background:none;border:none;color:var(--muted);display:flex;flex-direction:column;align-items:center;gap:3px;font-size:9.5px;cursor:pointer;padding:4px 2px}
.fx-nav button.on{color:#7CB93A}
.fx-root2[data-theme="dark"] .fx-nav button.on{color:var(--lime)}
.fx-fab{width:48px;height:48px;border-radius:50%;background:var(--lime)!important;color:#0E0F13!important;display:grid!important;place-items:center;margin-top:-22px;box-shadow:0 4px 14px rgba(200,246,93,.35)}

.fx-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center;z-index:100;backdrop-filter:blur(2px)}
.fx-modal{background:var(--panel);border:1px solid var(--line);border-radius:18px 18px 0 0;padding:16px;width:100%;max-width:520px;max-height:85vh;overflow-y:auto;animation:fx-up .22s ease}
@keyframes fx-up{from{transform:translateY(30px);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.fx-modal{animation:none}.fx-bar div{transition:none}}
.fx-modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;font-size:15px}

.fx-toggle{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:var(--ink);border:1px solid var(--line);border-radius:11px;padding:4px;margin-bottom:11px}
.fx-toggle button{background:none;border:none;color:var(--muted);padding:9px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer}
.fx-toggle button.on.entrada{background:rgba(200,246,93,.16);color:#7CB93A}
.fx-root2[data-theme="dark"] .fx-toggle button.on.entrada{color:var(--lime)}
.fx-toggle button.on.saida{background:rgba(255,122,92,.15);color:var(--coral)}

.fx-row{display:flex;gap:8px;margin-bottom:9px}
.fx-root2 input,.fx-root2 select{background:var(--ink);border:1px solid var(--line);color:var(--text);border-radius:10px;padding:10px 11px;font-size:14px;font-family:inherit;outline:none;width:100%;min-width:0}
.fx-root2 input:focus,.fx-root2 select:focus{border-color:#7CB93A}
.fx-root2[data-theme="dark"] input:focus,.fx-root2[data-theme="dark"] select:focus{border-color:var(--lime)}
.fx-amount{font-family:ui-monospace,monospace;font-size:16px!important;font-weight:600}
.fx-add{width:100%;background:var(--lime);color:#0E0F13;border:none;border-radius:11px;padding:12px;font-size:15px;font-weight:700;cursor:pointer;margin-top:4px}
.fx-add:disabled{opacity:.4;cursor:not-allowed}
@media (max-width:380px){.fx-chart{flex-direction:column}.fx-donut{margin:0 auto}.fx-filters{grid-template-columns:1fr 1fr}}
`;