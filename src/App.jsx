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
    { name: "Empréstimos", icon: "🏦", color: "#A78BFA" },
    { name: "Fatura cartão", icon: "💳", color: "#FB7185" },
    { name: "Juros/Multas", icon: "🔥", color: "#FB923C" },
    { name: "Material", icon: "🎨", color: "#C084FC" },
    { name: "Studio/Aluguel", icon: "🏢", color: "#94A3B8" },
    { name: "Impostos", icon: "🏛️", color: "#FDA4AF" },
    { name: "Outros", icon: "📦", color: "#9CA3AF" },
  ],
  receita: [
    { name: "Tattoo", icon: "🖋️", color: "#F5C451" },
    { name: "Freelance", icon: "💻", color: "#6EE7B7" },
    { name: "Salário", icon: "💼", color: "#67C7FF" },
    { name: "Outros", icon: "💰", color: "#F5C451" },
  ],
};
const PAYMENTS = ["Pix", "Dinheiro", "Débito", "Crédito", "Boleto", "Transferência"];
const DEBT_TYPES = {
  cartao: { label: "Cartão de crédito", category: "Fatura cartão", priorityHint: "juros altos" },
  emprestimo: { label: "Empréstimo", category: "Empréstimos", priorityHint: "contrato/juros" },
  consignado: { label: "Consignado", category: "Empréstimos", priorityHint: "manter em dia" },
  conta: { label: "Conta fixa", category: "Dívidas", priorityHint: "vencimento" },
  juros: { label: "Juros/Multa", category: "Juros/Multas", priorityHint: "prioridade alta" },
  outro: { label: "Outro", category: "Dívidas", priorityHint: "avaliar" },
};
const CARD_TYPES = {
  credito: "Crédito",
  debito: "Débito",
  multiplo: "Crédito e débito",
};

const ANDRE_PLAN_TX = [
  { title: "Saldo atual em conta", amount: 800, type: "receita", category: "Outros", date: "2026-07-08", status: "efetivado", payment: "Transferência", notes: "plano do André" },
  { title: "Salário dia 20", amount: 1063, type: "receita", category: "Salário", date: "2026-07-20", status: "pendente", payment: "Transferência", notes: "plano do André" },
  { title: "Ajuda esposa", amount: 1700, type: "receita", category: "Outros", date: "2026-07-20", status: "pendente", payment: "Pix", notes: "plano do André" },
  { title: "Auxílio emergencial", amount: 300, type: "receita", category: "Outros", date: "2026-07-20", status: "pendente", payment: "Pix", notes: "plano do André" },
  { title: "Projeto/Freela 50% inicial", amount: 2000, type: "receita", category: "Freelance", date: "2026-07-20", status: "pendente", payment: "Transferência", notes: "plano do André" },
  { title: "Projeto/Freela restante", amount: 2000, type: "receita", category: "Freelance", date: "2026-08-20", status: "pendente", payment: "Transferência", notes: "plano do André" },
  { title: "Tatuagem líquida", amount: 270, type: "receita", category: "Tattoo", date: "2026-07-20", status: "pendente", payment: "Pix", notes: "plano do André" },
];

const ANDRE_PLAN_DEBTS = [
  { name: "Mercado Pago — quitação empréstimos", creditor: "Mercado Pago", total: 2083.60, paid: 0, installments: 1, paidInst: 0, dueDay: 20, dueDate: "2026-07-20", priority: 1, reason: "Maior desconto, quitar vários empréstimos.", original: 2893.89, centralKind: "quitacao", debtType: "emprestimo", interestLevel: "alto" },
  { name: "Nubank — crédito vencido", creditor: "Nubank", total: 1793.91, paid: 0, installments: 1, paidInst: 0, dueDay: 6, dueDate: "2026-08-06", priority: 2, reason: "Juros altos de cartão/crédito.", centralKind: "quitacao", debtType: "cartao", interestLevel: "alto" },
  { name: "ShopeePay — fatura atrasada", creditor: "ShopeePay", total: 657.02, paid: 0, installments: 1, paidInst: 0, dueDay: 28, dueDate: "2026-05-28", priority: 3, reason: "Fatura atrasada desde 28/05/2026.", originalDue: "2026-05-28", centralKind: "quitacao", debtType: "cartao", interestLevel: "alto" },
  { name: "Itaú — saldo negativo", creditor: "Itaú", total: 400, paid: 0, installments: 1, paidInst: 0, dueDay: 20, dueDate: "2026-07-20", priority: 4, reason: "Zerar saldo negativo.", centralKind: "quitacao", debtType: "conta", interestLevel: "medio" },
  { name: "Inter — fatura atrasada", creditor: "Inter", total: 1244.51, paid: 0, installments: 1, paidInst: 0, dueDay: 7, dueDate: "2026-08-07", priority: 5, reason: "Sugerir para agosto se precisar manter caixa.", centralKind: "quitacao", debtType: "cartao", interestLevel: "alto" },
  { name: "C6 Bank — consignado", creditor: "C6 Bank", total: 440, paid: 0, installments: 1, paidInst: 0, dueDay: 20, dueDate: "2026-08-20", priority: 6, priorityLabel: "manter em dia", reason: "Valor mensal; manter em dia, não antecipar.", centralKind: "mensal", debtType: "consignado", interestLevel: "baixo" },
  { name: "Aluguel", creditor: "Aluguel", total: 300, paid: 0, installments: 1, paidInst: 0, dueDay: 10, dueDate: "2026-08-10", priority: 7, priorityLabel: "mensal", reason: "Compromisso mensal essencial.", centralKind: "mensal", debtType: "conta", interestLevel: "baixo" },
];

const ANDRE_PLAN_CARDS = [
  { name: "Nubank", limit: 3600.02, used: 1793.91, closeDay: 30, dueDay: 6, cardType: "credito", notes: "plano do André" },
  { name: "Inter", limit: 1244.51, used: 1244.51, closeDay: 30, dueDay: 7, cardType: "credito", notes: "limite não informado no plano do André" },
  { name: "ShopeePay", limit: 657.02, used: 657.02, closeDay: 28, dueDay: 28, cardType: "credito", notes: "fatura atrasada vencida em 28/05/2026" },
];

const ANDRE_PLAN_RECURRING = [
  { title: "C6 Bank — consignado", amount: 440, type: "despesa", category: "Dívidas", day: 20 },
  { title: "Aluguel", amount: 300, type: "despesa", category: "Studio/Aluguel", day: 10 },
];

const normText = (v) => String(v || "").trim().toLowerCase();
const cents = (v) => Math.round((Number(v) || 0) * 100);
const sameNameAmount = (item, name, amount, field = "name") => normText(item[field]) === normText(name) && cents(item.amount ?? item.total ?? item.used) === cents(amount);
const pendingDebtValue = (debt) => Math.max(0, (debt.total || 0) - (debt.paid || 0));
const cashBalance = (state) => (state.tx || [])
  .filter((tx) => tx.status !== "pendente")
  .reduce((sum, tx) => sum + (tx.type === "receita" ? tx.amount : -tx.amount), 0);
const debtKind = (debt) => DEBT_TYPES[debt.debtType || "outro"] || DEBT_TYPES.outro;
const debtPaymentCategory = (debt) => debtKind(debt).category;
const debtDueLabel = (debt) => debt.dueDate ? `${fmtDia(debt.dueDate)}/${debt.dueDate.slice(2, 4)}` : `dia ${debt.dueDay || "?"}`;
const daysUntilDebtDue = (debt) => {
  const base = new Date(todayISO() + "T12:00");
  let due;
  if (debt.dueDate) {
    due = new Date(debt.dueDate + "T12:00");
  } else {
    const day = Math.min(28, Math.max(1, Number(debt.dueDay) || 28));
    due = new Date(base.getFullYear(), base.getMonth(), day, 12);
    if (due < base) due = new Date(base.getFullYear(), base.getMonth() + 1, day, 12);
  }
  return Math.ceil((due - base) / 864e5);
};
const interestWeight = (level) => ({ alto: 20, medio: 10, baixo: 0 }[level] ?? 5);
const debtUrgencyScore = (debt) => (daysUntilDebtDue(debt) * 10) - interestWeight(debt.interestLevel) + (Number(debt.priority) || 50);
const urgencyLabel = (debt) => {
  const days = daysUntilDebtDue(debt);
  if (days < 0) return `${Math.abs(days)} dia${Math.abs(days) === 1 ? "" : "s"} atrasado`;
  if (days === 0) return "vence hoje";
  if (days <= 7) return `vence em ${days} dia${days === 1 ? "" : "s"}`;
  return `vence em ${days} dias`;
};
const isCardDebt = (card, debt) => {
  const cardName = normText(card.name);
  return debt.debtType === "cartao" && (normText(debt.creditor).includes(cardName) || normText(debt.name).includes(cardName));
};
const inferDebtType = (debt) => {
  if (debt.debtType) return debt.debtType;
  const text = normText(`${debt.name} ${debt.creditor}`);
  if (text.includes("nubank") || text.includes("inter") || text.includes("shopee") || text.includes("cartão") || text.includes("fatura") || text.includes("crédito")) return "cartao";
  if (text.includes("consignado")) return "consignado";
  if (text.includes("mercado pago") || text.includes("empréstimo")) return "emprestimo";
  if (text.includes("juros") || text.includes("multa")) return "juros";
  if (text.includes("aluguel") || text.includes("saldo negativo")) return "conta";
  return "outro";
};
const inferInterestLevel = (debt) => {
  if (debt.interestLevel) return debt.interestLevel;
  return ["cartao", "emprestimo", "juros"].includes(inferDebtType(debt)) ? "alto" : "medio";
};
const inferCardType = (card) => card.cardType || "credito";

const normalizeStore = (data) => ({
  ...EMPTY,
  ...(data || {}),
  tx: Array.isArray(data?.tx) ? data.tx : [],
  customCats: {
    despesa: Array.isArray(data?.customCats?.despesa) ? data.customCats.despesa : [],
    receita: Array.isArray(data?.customCats?.receita) ? data.customCats.receita : [],
  },
  budgets: data?.budgets || {},
  goals: Array.isArray(data?.goals) ? data.goals : [],
  debts: Array.isArray(data?.debts) ? data.debts.map((debt) => ({ ...debt, debtType: inferDebtType(debt), interestLevel: inferInterestLevel(debt) })) : [],
  cards: Array.isArray(data?.cards) ? data.cards.map((card) => ({ ...card, cardType: inferCardType(card) })) : [],
  recurring: Array.isArray(data?.recurring) ? data.recurring.map((item) => ({
    ...item,
    recurrenceMode: item.recurrenceMode || "permanente",
    totalAmount: item.totalAmount || 0,
    installments: item.installments || 0,
    paidCount: item.paidCount || 0,
  })) : [],
});

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
  const label = score >= 75 ? ["Excelente", "#F5C451"] : score >= 55 ? ["Boa", "#D9A441"] : score >= 35 ? ["Atenção", "#F5C451"] : ["Crítica", "#FF7A5C"];
  return { score, label: label[0], color: label[1] };
}

function applyDebtPaymentsToState(state, debtPayments) {
  const base = normalizeStore(state);
  const nextTx = [...base.tx];
  let nextDebts = [...base.debts];
  let nextCards = [...base.cards];

  debtPayments.forEach(({ debt, amount }) => {
    const ix = nextDebts.findIndex((item) => item.id === debt.id);
    const current = ix >= 0 ? nextDebts[ix] : debt;
    const value = Math.min(parseNum(amount), pendingDebtValue(current));
    if (value <= 0) return;

    nextTx.push({
      id: uid() + Math.random(),
      title: `${value < pendingDebtValue(current) ? "Pagamento parcial" : "Pagamento"} ${current.creditor || current.name}`,
      amount: value,
      type: "despesa",
      category: debtPaymentCategory(current),
      date: todayISO(),
      status: "efetivado",
      payment: "Pix",
      notes: `central:pagamento-divida:${current.id}`,
    });

    if (ix >= 0) {
      nextDebts[ix] = {
        ...current,
        paid: Math.min(current.total, (current.paid || 0) + value),
        paidInst: value >= pendingDebtValue(current) ? (current.installments || current.paidInst || 1) : current.paidInst,
      };
    }

    nextCards = nextCards.map((card) => isCardDebt(card, current)
      ? { ...card, used: Math.max(0, (card.used || 0) - value) }
      : card
    );
  });

  return { ...base, tx: nextTx, debts: nextDebts, cards: nextCards };
}

function applyCardPaymentToState(state, card, amount) {
  const base = normalizeStore(state);
  const cardIx = base.cards.findIndex((item) => item.id === card.id);
  const currentCard = cardIx >= 0 ? base.cards[cardIx] : card;
  const value = Math.min(parseNum(amount), currentCard.used || 0);
  if (value <= 0) return base;

  const nextTx = [...base.tx, {
    id: uid() + Math.random(),
    title: `${value < (currentCard.used || 0) ? "Pagamento parcial" : "Pagamento"} cartão ${currentCard.name}`,
    amount: value,
    type: "despesa",
    category: "Fatura cartão",
    date: todayISO(),
    status: "efetivado",
    payment: "Pix",
    notes: `central:pagamento-cartao:${currentCard.id}`,
  }];

  const nextCards = base.cards.map((item) => item.id === currentCard.id
    ? { ...item, used: Math.max(0, (item.used || 0) - value) }
    : item
  );

  let remaining = value;
  const reductions = {};
  base.debts
    .filter((debt) => isCardDebt(currentCard, debt) && pendingDebtValue(debt) > 0)
    .sort((a, b) => (Number(a.priority) || 99) - (Number(b.priority) || 99))
    .forEach((debt) => {
      if (remaining <= 0) return;
      const paid = Math.min(pendingDebtValue(debt), remaining);
      reductions[debt.id] = paid;
      remaining -= paid;
    });

  const nextDebts = base.debts.map((debt) => {
    const paid = reductions[debt.id] || 0;
    if (paid <= 0) return debt;
    return {
      ...debt,
      paid: Math.min(debt.total, (debt.paid || 0) + paid),
      paidInst: paid >= pendingDebtValue(debt) ? (debt.installments || debt.paidInst || 1) : debt.paidInst,
    };
  });

  return { ...base, tx: nextTx, cards: nextCards, debts: nextDebts };
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
  const [notice, setNotice] = useState(null);

  /* ---- load + migração ---- */
  useEffect(() => {
  try {
    const raw = localStorage.getItem("fluxo:v2");

    if (raw) {
      setS(normalizeStore(JSON.parse(raw)));
    } else {
      setS(normalizeStore(EMPTY));
    }
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    setS(normalizeStore(EMPTY));
  } finally {
    setLoaded(true);
  }
}, []);

 useEffect(() => {
  if (!loaded) return;

  try {
    localStorage.setItem("fluxo:v2", JSON.stringify(S));
  } catch (error) {
    console.error("Erro ao salvar dados:", error);
  }
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
  const balance = useMemo(() => cashBalance(S), [S]);

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
  const notify = (text, tone = "warn") => {
    setNotice({ text, tone });
    window.setTimeout(() => setNotice(null), 3600);
  };

  /* ---- ações tx ---- */
  const saveTx = (tx) => {
    upd({ tx: tx.id && S.tx.some((t) => t.id === tx.id) ? S.tx.map((t) => (t.id === tx.id ? tx : t)) : [...S.tx, { ...tx, id: uid() }] });
    setTxModal(null);
  };
  const delTx = (id) => upd({ tx: S.tx.filter((t) => t.id !== id) });
  const toggleStatus = (id) => setS((prev) => {
    const base = normalizeStore(prev);
    let recurring = base.recurring;
    const tx = base.tx.map((t) => {
      if (t.id !== id) return t;
      const nextStatus = t.status === "pendente" ? "efetivado" : "pendente";
      let recurringCounted = !!t.recurringCounted;

      if (t.recurringId) {
        const rec = recurring.find((item) => item.id === t.recurringId);
        if (rec?.recurrenceMode === "parcelado" && nextStatus === "efetivado" && !recurringCounted) {
          recurring = recurring.map((item) => item.id === rec.id ? { ...item, paidCount: Math.min(item.installments || 0, (item.paidCount || 0) + 1) } : item);
          recurringCounted = true;
        } else if (rec?.recurrenceMode === "parcelado" && nextStatus === "pendente" && recurringCounted) {
          recurring = recurring.map((item) => item.id === rec.id ? { ...item, paidCount: Math.max(0, (item.paidCount || 0) - 1) } : item);
          recurringCounted = false;
        }
      }

      return { ...t, status: nextStatus, recurringCounted };
    });
    return { ...base, tx, recurring };
  });

  const launchRecurring = (r) => {
    if (r.recurrenceMode === "parcelado" && (r.paidCount || 0) >= (r.installments || 0)) {
      notify("Esse recorrente parcelado já foi concluído.", "ok");
      return;
    }
    const day = String(Math.min(r.day, 28)).padStart(2, "0");
    upd({
      tx: [...S.tx, { id: uid(), title: r.title, amount: r.amount, type: r.type, category: r.category, date: `${cursor}-${day}`, status: "pendente", payment: "Boleto", notes: `recorrente:${r.id}`, recurringId: r.id, recurringCounted: false }],
    });
  };

  const payDebt = (debt, amount = pendingDebtValue(debt)) => {
    const value = Math.min(parseNum(amount), pendingDebtValue(debt));
    if (value <= 0) return;
    if (value > balance) {
      notify(`Caixa insuficiente: disponível ${BRL(balance)}, pagamento ${BRL(value)}.`);
      return;
    }
    setS((prev) => applyDebtPaymentsToState(prev, [{ debt, amount }]));
  };

  const payDebts = (debts) => {
    const total = debts.reduce((sum, debt) => sum + pendingDebtValue(debt), 0);
    if (total <= 0) return;
    if (total > balance) {
      notify(`Caixa insuficiente para a sugestão: disponível ${BRL(balance)}, necessário ${BRL(total)}.`);
      return;
    }
    setS((prev) => applyDebtPaymentsToState(prev, debts.map((debt) => ({ debt, amount: pendingDebtValue(debt) }))));
  };

  const payCard = (card, amount = card.used) => {
    const value = Math.min(parseNum(amount), card.used || 0);
    if (value <= 0) return;
    if (value > balance) {
      notify(`Caixa insuficiente: disponível ${BRL(balance)}, pagamento ${BRL(value)}.`);
      return;
    }
    setS((prev) => applyCardPaymentToState(prev, card, amount));
  };

  const importAndrePlan = () => {
    let addedTx = 0;
    let addedDebts = 0;
    let addedCards = 0;
    let addedRecurring = 0;

    const base = normalizeStore(S);
    const nextTx = [...base.tx];
    const nextDebts = [...base.debts];
    const nextCards = [...base.cards];
    const nextRecurring = [...base.recurring];

    ANDRE_PLAN_TX.forEach((tx) => {
      if (!nextTx.some((item) => sameNameAmount(item, tx.title, tx.amount, "title"))) {
        nextTx.push({ ...tx, id: uid() + Math.random() });
        addedTx += 1;
      }
    });

    ANDRE_PLAN_DEBTS.forEach((debt) => {
      if (!nextDebts.some((item) => sameNameAmount(item, debt.name, debt.total))) {
        nextDebts.push({ ...debt, id: uid() + Math.random() });
        addedDebts += 1;
      }
    });

    ANDRE_PLAN_CARDS.forEach((card) => {
      if (!nextCards.some((item) => sameNameAmount(item, card.name, card.used))) {
        nextCards.push({ ...card, id: uid() + Math.random() });
        addedCards += 1;
      }
    });

    ANDRE_PLAN_RECURRING.forEach((item) => {
      if (!nextRecurring.some((row) => sameNameAmount(row, item.title, item.amount, "title"))) {
        nextRecurring.push({ ...item, id: uid() + Math.random() });
        addedRecurring += 1;
      }
    });

    setS({ ...base, tx: nextTx, debts: nextDebts, cards: nextCards, recurring: nextRecurring });

    notify(
      addedTx + addedDebts + addedCards + addedRecurring > 0
        ? `Plano importado: ${addedTx} receitas, ${addedDebts} dívidas, ${addedCards} cartões e ${addedRecurring} recorrentes adicionados.`
        : "Plano do André já estava importado. Nenhuma duplicata foi criada.",
      "ok"
    );
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
        {tab === "central" && <CentralFinanceira {...{ S, cursor, balance, onImportAndrePlan: importAndrePlan, onPayDebt: payDebt, onPayDebts: payDebts, onPayCard: payCard }} />}
        {tab === "contas" && <>
          <Contas {...{ S, upd, setSubModal, launchRecurring, catMeta, cursor, onPayDebt: payDebt, onPayCard: payCard }} />
          <BackupCard onExport={exportBackup} onImport={importBackup} />
        </>}
        {tab === "servicos" && <Servicos />}
      </main>

      {notice && <div className={`fx-toast ${notice.tone}`}>{notice.text}</div>}

      {/* BOTTOM NAV */}
      <nav className="fx-nav">
        <button className={tab === "inicio" ? "on" : ""} onClick={() => setTab("inicio")}><Home size={19} /><span>Início</span></button>
        <button className={tab === "extrato" ? "on" : ""} onClick={() => setTab("extrato")}><List size={19} /><span>Extrato</span></button>
        <button className="fx-fab" onClick={() => setTxModal({})}><Plus size={22} /></button>
        <button className={tab === "planejar" ? "on" : ""} onClick={() => setTab("planejar")}><Target size={19} /><span>Planejar</span></button>
        <button className={tab === "central" ? "on" : ""} onClick={() => setTab("central")}><Landmark size={19} /><span>Central</span></button>
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
              <ReBar dataKey="receitas" fill="#F5C451" radius={[4, 4, 0, 0]} />
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

/* ═══════════════════════════ SCREEN: CENTRAL FINANCEIRA ═══════════════════════════ */
function CentralFinanceira({ S, cursor, balance, onImportAndrePlan, onPayDebt, onPayDebts, onPayCard }) {
  const [incoming, setIncoming] = useState("");
  const [reserve, setReserve] = useState("300");

  const currentBalance = balance;
  const pendingDebts = S.debts.filter((debt) => pendingDebtValue(debt) > 0);
  const attackDebts = pendingDebts
    .filter((debt) => debt.centralKind !== "mensal")
    .sort((a, b) => debtUrgencyScore(a) - debtUrgencyScore(b));

  const monthIncome = S.tx
    .filter((tx) => tx.type === "receita" && mKey(tx.date) === cursor)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const payoffTotal = attackDebts.reduce((sum, debt) => sum + pendingDebtValue(debt), 0);
  const projectedBalance = currentBalance - payoffTotal;
  const activeCreditors = new Set(pendingDebts.map((debt) => debt.creditor || debt.name)).size;

  const cashNow = parseNum(incoming) || currentBalance;
  const minReserve = parseNum(reserve) || 0;
  const sim = attackDebts.reduce((acc, debt) => {
    const amount = pendingDebtValue(debt);
    if (acc.available - amount >= minReserve) {
      acc.pay.push(debt);
      acc.available -= amount;
    } else {
      acc.hold.push(debt);
    }
    return acc;
  }, { available: cashNow, pay: [], hold: [] });

  const payPartialDebt = (debt) => {
    const value = parseNum(prompt(`Pagar quanto de ${debt.creditor || debt.name}?`, String(pendingDebtValue(debt)).replace(".", ",")));
    if (value > 0) onPayDebt(debt, value);
  };

  const paySuggestion = () => {
    if (sim.pay.length === 0) return;
    onPayDebts(sim.pay);
  };

  const payPartialCard = (card) => {
    const value = parseNum(prompt(`Pagar quanto da fatura ${card.name}?`, String(card.used || 0).replace(".", ",")));
    if (value > 0) onPayCard(card, value);
  };

  const statusFor = (name) => {
    const debt = S.debts.find((item) => normText(item.name).includes(normText(name)));
    if (!debt) return "não importado";
    return pendingDebtValue(debt) <= 0 ? "pago" : "pendente";
  };

  const julyPlan = [
    ["Mercado Pago", 2083.60],
    ["Nubank", 1793.91],
    ["ShopeePay", 657.02],
    ["Itaú", 400],
  ];
  const augustPlan = [
    ["Inter", 1244.51],
    ["C6 Bank", 440],
    ["Aluguel", 300],
    ["Começar reserva de emergência", 0],
  ];

  return (
    <>
      <section className="fx-hero fx-war-hero">
        <div className="fx-hero-row">
          <div>
            <div className="fx-hero-label">Central Financeira</div>
            <div className="fx-war-title">Plano de quitação</div>
            <div className="fx-war-sub">Priorizar descontos, segurar caixa mínimo e empurrar o Inter para agosto se precisar.</div>
          </div>
        </div>
        <button className="fx-add fx-import-plan" onClick={onImportAndrePlan}>Importar plano do André</button>
      </section>

      <section className="fx-card">
        <div className="fx-card-title">Resumo da guerra</div>
        <div className="fx-war-grid">
          <div className="fx-war-tile"><span>Entradas previstas</span><b className="pos">{BRL(monthIncome)}</b></div>
          <div className="fx-war-tile"><span>Saldo em caixa</span><b className={currentBalance < 0 ? "neg" : "pos"}>{BRL(currentBalance)}</b></div>
          <div className="fx-war-tile"><span>Total para quitar</span><b className="neg">{BRL(payoffTotal)}</b></div>
          <div className="fx-war-tile"><span>Saldo após quitar</span><b className={projectedBalance < 0 ? "neg" : "pos"}>{BRL(projectedBalance)}</b></div>
          <div className="fx-war-tile wide"><span>Dívidas pendentes · credores ativos</span><b>{pendingDebts.length} · {activeCreditors}</b></div>
        </div>
      </section>

      <section className="fx-card">
        <div className="fx-card-title">Ordem de ataque</div>
        {attackDebts.length === 0 ? <Empty text="Nenhuma dívida de quitação pendente." /> : (
          <div className="fx-attack-list">
            {attackDebts.map((debt) => {
              const remaining = pendingDebtValue(debt);
              return (
                <article className="fx-attack-item" key={debt.id}>
                  <div className="fx-attack-head">
                    <span className="fx-priority">#{debt.priority || "?"}</span>
                    <div>
                      <b>{debt.name}</b>
                      <p>{debt.reason || "Prioridade cadastrada."}</p>
                    </div>
                  </div>
                  <div className="fx-attack-meta">
                    <span className="fx-mono neg">{BRL(remaining)}</span>
                    <span>{debtKind(debt).label}</span>
                    <span>juros {debt.interestLevel || "medio"}</span>
                    <span>{urgencyLabel(debt)}</span>
                    {debt.original && <span>original {BRL(debt.original)}</span>}
                    {debt.originalDue && <span>venc. original {fmtDia(debt.originalDue)}/{debt.originalDue.slice(2, 4)}</span>}
                  </div>
                  <div className="fx-pay-actions">
                    <button className="fx-mini-btn" onClick={() => onPayDebt(debt)}><Check size={12} /> pagar total</button>
                    <button className="fx-mini-btn" onClick={() => payPartialDebt(debt)}>pagar parte</button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="fx-card">
        <div className="fx-card-title">Simulador</div>
        <div className="fx-row">
          <input className="fx-amount" inputMode="decimal" value={incoming} onChange={(e) => setIncoming(e.target.value)} placeholder="Caixa p/ simular" />
          <input inputMode="decimal" value={reserve} onChange={(e) => setReserve(e.target.value)} placeholder="Reserva mínima" />
        </div>
        <div className="fx-sim-summary">
          <span>Caixa usado: <b className="fx-mono">{BRL(cashNow)}</b></span>
          <span>Reserva mínima: <b className="fx-mono">{BRL(minReserve)}</b></span>
          <span>Sobra após sugestão: <b className="fx-mono">{BRL(sim.available)}</b></span>
        </div>
        {sim.pay.length === 0 ? <Empty text="Informe um valor maior para liberar pagamentos sem furar a reserva." /> : (
          <>
            <ul className="fx-mini-list">
              {sim.pay.map((debt) => (
                <li key={debt.id}>
                <span className="ico"><CheckCircle2 size={16} color="var(--lime)" /></span>
                <span className="nm">{debt.name}</span>
                <b className="fx-mono">{BRL(pendingDebtValue(debt))}</b>
              </li>
              ))}
            </ul>
            <button className="fx-add fx-pay-suggestion" onClick={paySuggestion}>Pagar sugestão e atualizar saldo</button>
          </>
        )}
        {sim.hold.length > 0 && (
          <div className="fx-hold-note">
            Fica para depois: {sim.hold.map((debt) => debt.creditor || debt.name).join(", ")}.
          </div>
        )}
      </section>

      <section className="fx-card">
        <div className="fx-card-title">Plano Julho/Agosto</div>
        <div className="fx-plan-month">
          <div className="fx-between fx-sm">
            <b>Julho</b>
            <span className="fx-mono pos">Entradas {BRL(6133)}</span>
          </div>
          {julyPlan.map(([name, amount]) => (
            <div className="fx-plan-row" key={name}>
              <span>{name}</span>
              <b className="fx-mono">{BRL(amount)}</b>
              <em className={statusFor(name) === "pago" ? "ok" : ""}>{statusFor(name)}</em>
            </div>
          ))}
          <p>Inter pode ficar para agosto para manter caixa mínimo.</p>
        </div>
        <div className="fx-plan-month">
          <div className="fx-between fx-sm"><b>Agosto</b><span className="fx-muted-sm">virada para estabilidade</span></div>
          {augustPlan.map(([name, amount]) => (
            <div className="fx-plan-row" key={name}>
              <span>{name}</span>
              <b className="fx-mono">{amount ? BRL(amount) : "reserva"}</b>
              <em className={statusFor(name) === "pago" ? "ok" : ""}>{amount ? statusFor(name) : "iniciar"}</em>
            </div>
          ))}
        </div>
      </section>

      <section className="fx-card">
        <div className="fx-card-title">Cartões no radar</div>
        {S.cards.length === 0 ? <Empty text="Importe o plano ou cadastre cartões em Contas." /> : (
          <div className="fx-card-stack">
            {S.cards.map((card) => (
              <div className="fx-card-row" key={card.id}>
                <div>
                  <b>{card.name}</b>
                  <span>{CARD_TYPES[card.cardType || "credito"]} · fecha dia {card.closeDay} · vence dia {card.dueDay}</span>
                </div>
                <div className="fx-card-pay">
                  <strong className="fx-mono neg">{BRL(card.used)}</strong>
                  {(card.used || 0) > 0 && <button className="fx-mini-btn" onClick={() => payPartialCard(card)}>pagar fatura</button>}
                </div>
              </div>
            ))}
          </div>
        )}
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
          {cats.map((c, i) => <option key={`${c.name}-${c.icon}-${i}`} value={c.name}>{c.icon} {c.name}</option>)}
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
              <Bar pct={pct} color={pct >= 100 ? "var(--lime)" : "#D9A441"} />
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
function Contas({ S, upd, setSubModal, launchRecurring, catMeta, cursor, onPayDebt, onPayCard }) {
  const recTotal = S.recurring.filter((r) => r.type === "despesa").reduce((s, r) => s + r.amount, 0);
  const alreadyLaunched = (r) => S.tx.some((t) => mKey(t.date) === cursor && (t.recurringId === r.id || (t.notes === "recorrente" && t.title === r.title)));
  const payDebtPart = (debt) => {
    const value = parseNum(prompt(`Pagar quanto de ${debt.creditor || debt.name}?`, String(pendingDebtValue(debt)).replace(".", ",")));
    if (value > 0) onPayDebt(debt, value);
  };
  const payCardPart = (card) => {
    const value = parseNum(prompt(`Pagar quanto da fatura ${card.name}?`, String(card.used || 0).replace(".", ",")));
    if (value > 0) onPayCard(card, value);
  };

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
          const remaining = pendingDebtValue(d);
          return (
            <div key={d.id} className="fx-budget">
              <div className="fx-between fx-sm">
                <span>{d.name}{d.creditor ? ` · ${d.creditor}` : ""}</span>
                <span className="fx-mono">{BRL(d.paid)} / {BRL(d.total)}</span>
              </div>
              <Bar pct={pct} color={pct >= 100 ? "var(--lime)" : "#A78BFA"} />
              <div className="fx-between fx-xs">
                <span className="fx-muted-sm">{debtKind(d).label} · juros {d.interestLevel || "medio"} · vence {debtDueLabel(d)}</span>
                <span className="fx-muted-sm">{pct >= 100 ? "quitada ✓" : `resta ${BRL(remaining)}`}</span>
              </div>
              <div className="fx-goal-actions">
                {remaining > 0 && (
                  <>
                    {d.paidInst < d.installments && (
                      <button className="fx-mini-btn" onClick={() => onPayDebt(d, d.total / d.installments)}><Check size={12} /> pagar parcela ({BRL(d.total / d.installments)})</button>
                    )}
                    <button className="fx-mini-btn" onClick={() => onPayDebt(d)}>pagar total</button>
                    <button className="fx-mini-btn" onClick={() => payDebtPart(d)}>pagar parte</button>
                  </>
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
          <div className="fx-card-title" style={{ margin: 0 }}><CreditCard size={13} style={{ verticalAlign: "-2px" }} /> Cartões</div>
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
                <span className="fx-muted-sm">{CARD_TYPES[c.cardType || "credito"]} · fecha dia {c.closeDay} · vence dia {c.dueDay} · melhor compra dia {bestDay}</span>
              </div>
              <div className="fx-goal-actions">
                {(c.used || 0) > 0 && (
                  <>
                    <button className="fx-mini-btn" onClick={() => onPayCard(c)}>pagar total</button>
                    <button className="fx-mini-btn" onClick={() => payCardPart(c)}>pagar parte</button>
                  </>
                )}
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
          {S.recurring.map((r) => {
            const done = r.recurrenceMode === "parcelado" && (r.paidCount || 0) >= (r.installments || 0);
            return (
              <li key={r.id}>
                <span className="ico">{catMeta(r.category).icon}</span>
                <span className="nm">
                  {r.title}
                  <em className="fx-muted-sm">
                    {" "}· dia {r.day} · {r.recurrenceMode === "parcelado" ? `${r.paidCount || 0}/${r.installments || 0} parcelas` : "permanente"}
                  </em>
                </span>
                <b className={`fx-mono ${r.type === "receita" ? "pos" : "neg"}`}>{BRL(r.amount)}</b>
                {done
                  ? <span className="fx-launched"><Check size={13} /> concluído</span>
                  : alreadyLaunched(r)
                    ? <span className="fx-launched"><Check size={13} /> no mês</span>
                    : <button className="fx-mini-btn" onClick={() => launchRecurring(r)}>lançar</button>}
                <button className="fx-icon-btn dim" onClick={() => setSubModal({ kind: "recurring", item: r })}><Pencil size={13} /></button>
                <button className="fx-icon-btn dim" onClick={() => upd({ recurring: S.recurring.filter((x) => x.id !== r.id) })}><Trash2 size={13} /></button>
              </li>
            );
          })}
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
    if (kind === "debt") return { name: item?.name || "", total: item ? String(item.total) : "", paid: item ? String(item.paid) : "0", installments: item ? String(item.installments) : "12", paidInst: item ? String(item.paidInst) : "0", dueDay: item ? String(item.dueDay) : "10", dueDate: item?.dueDate || "", creditor: item?.creditor || "", debtType: item?.debtType || "outro", interestLevel: item?.interestLevel || "medio" };
    if (kind === "card") return { name: item?.name || "", limit: item ? String(item.limit) : "", used: item ? String(item.used) : "0", closeDay: item ? String(item.closeDay) : "28", dueDay: item ? String(item.dueDay) : "7", cardType: item?.cardType || "credito" };
    return { title: item?.title || "", amount: item ? String(item.amount) : "", type: item?.type || "despesa", category: item?.category || "Assinaturas", day: item ? String(item.day) : "10", recurrenceMode: item?.recurrenceMode || "permanente", totalAmount: item?.totalAmount ? String(item.totalAmount) : "", installments: item?.installments ? String(item.installments) : "", paidCount: item?.paidCount ? String(item.paidCount) : "0" };
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
      const d = { id: item?.id || uid(), name: f.name.trim() || "Dívida", total: parseNum(f.total), paid: parseNum(f.paid), installments: Math.max(1, parseInt(f.installments) || 1), paidInst: parseInt(f.paidInst) || 0, dueDay: parseInt(f.dueDay) || 10, dueDate: f.dueDate, creditor: f.creditor.trim(), debtType: f.debtType, interestLevel: f.interestLevel };
      if (d.total > 0) upd({ debts: item ? S.debts.map((x) => x.id === d.id ? d : x) : [...S.debts, d] });
    }
    if (kind === "card") {
      const c = { id: item?.id || uid(), name: f.name.trim() || "Cartão", limit: parseNum(f.limit), used: parseNum(f.used), closeDay: parseInt(f.closeDay) || 28, dueDay: parseInt(f.dueDay) || 7, cardType: f.cardType };
      if (c.limit > 0) upd({ cards: item ? S.cards.map((x) => x.id === c.id ? c : x) : [...S.cards, c] });
    }
    if (kind === "recurring") {
      const amount = parseNum(f.amount);
      const totalAmount = parseNum(f.totalAmount);
      const installments = f.recurrenceMode === "parcelado"
        ? Math.max(1, parseInt(f.installments) || (totalAmount > 0 && amount > 0 ? Math.ceil(totalAmount / amount) : 1))
        : 0;
      const r = { id: item?.id || uid(), title: f.title.trim() || "Recorrente", amount, type: f.type, category: f.category, day: Math.min(28, Math.max(1, parseInt(f.day) || 10)), recurrenceMode: f.recurrenceMode, totalAmount, installments, paidCount: Math.max(0, parseInt(f.paidCount) || 0) };
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
          <select value={f.debtType} onChange={(e) => set("debtType", e.target.value)}>
            {Object.entries(DEBT_TYPES).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
          </select>
          <select value={f.interestLevel} onChange={(e) => set("interestLevel", e.target.value)}>
            <option value="alto">Juros alto</option>
            <option value="medio">Juros médio</option>
            <option value="baixo">Juros baixo</option>
          </select>
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
        <div className="fx-row"><input type="date" value={f.dueDate} onChange={(e) => set("dueDate", e.target.value)} /></div>
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
          <select value={f.cardType} onChange={(e) => set("cardType", e.target.value)}>
            {Object.entries(CARD_TYPES).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
          </select>
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
        <div className="fx-row">
          <select value={f.recurrenceMode} onChange={(e) => set("recurrenceMode", e.target.value)}>
            <option value="permanente">Permanente</option>
            <option value="parcelado">Parcelado com total</option>
          </select>
          <input inputMode="decimal" placeholder="Valor total R$" value={f.totalAmount} onChange={(e) => set("totalAmount", e.target.value)} disabled={f.recurrenceMode !== "parcelado"} />
        </div>
        {f.recurrenceMode === "parcelado" && (
          <div className="fx-row">
            <input inputMode="numeric" placeholder="Nº parcelas" value={f.installments} onChange={(e) => set("installments", e.target.value)} />
            <input inputMode="numeric" placeholder="Parcelas pagas" value={f.paidCount} onChange={(e) => set("paidCount", e.target.value)} />
          </div>
        )}
      </>)}
      <button className="fx-add" onClick={save}>Salvar</button>
    </Modal>
  );
}

/* ═══════════════════════════ STYLES ═══════════════════════════ */
const CSS = `
.fx-root2{
  --lime:#F5C451; --coral:#FF7A5C;
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
.pos{color:#D9A441} .neg{color:var(--coral)}
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
.fx-balance{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:31px;font-weight:600;letter-spacing:-.8px;font-variant-numeric:tabular-nums;color:#D9A441}
.fx-root2[data-theme="dark"] .fx-balance{color:var(--lime)}
.fx-balance.neg{color:var(--coral)!important}
.fx-health{position:relative;flex:0 0 52px}
.fx-health-txt{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1}
.fx-health-txt b{font-size:14px;font-family:ui-monospace,monospace}
.fx-health-txt span{font-size:7px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-top:2px}
.fx-runway{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:11px;font-size:12.5px;background:rgba(245,196,81,.09);border:1px solid rgba(245,196,81,.22);padding:7px 11px;border-radius:10px;width:fit-content}
.fx-root2[data-theme="light"] .fx-runway{background:rgba(245,196,81,.1);border-color:rgba(245,196,81,.3)}
.fx-runway svg{color:#D9A441}
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
.fx-launched{display:flex;align-items:center;gap:3px;font-size:11px;color:#D9A441}
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
.fx-link{background:none;border:none;color:#D9A441;cursor:pointer;font-size:13px;text-decoration:underline}
.fx-root2[data-theme="dark"] .fx-link{color:var(--lime)}
.fx-empty2{text-align:center;padding:12px 0;color:var(--muted);font-size:13px}
.fx-backup-text{font-size:13px;line-height:1.45;color:var(--muted);margin:0 0 11px}
.fx-backup-actions{display:flex;gap:8px;flex-wrap:wrap}
.fx-file-btn{position:relative;overflow:hidden}
.fx-file-btn input{position:absolute;inset:0;opacity:0;cursor:pointer}

.fx-toast{position:fixed;left:50%;bottom:74px;transform:translateX(-50%);z-index:80;max-width:492px;width:calc(100% - 28px);background:var(--panel);border:1px solid var(--line);color:var(--text);border-radius:12px;padding:11px 13px;font-size:13px;line-height:1.35;box-shadow:0 10px 28px rgba(0,0,0,.25)}
.fx-toast.warn{border-color:rgba(255,122,92,.45)}
.fx-toast.ok{border-color:rgba(245,196,81,.35)}

.fx-war-hero{padding-bottom:14px}
.fx-war-title{font-size:24px;font-weight:750;letter-spacing:0;margin-bottom:5px}
.fx-war-sub{font-size:12.5px;color:var(--muted);line-height:1.45;max-width:360px}
.fx-import-plan{margin-top:13px;margin-bottom:0}
.fx-war-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.fx-war-tile{background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:11px;display:flex;flex-direction:column;gap:4px;min-width:0}
.fx-war-tile.wide{grid-column:1 / -1}
.fx-war-tile span{font-size:11px;color:var(--muted)}
.fx-war-tile b{font-family:ui-monospace,monospace;font-size:15px;font-variant-numeric:tabular-nums}
.fx-attack-list{display:flex;flex-direction:column;gap:10px}
.fx-attack-item{background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:11px}
.fx-attack-head{display:flex;gap:10px;align-items:flex-start}
.fx-priority{width:30px;height:30px;border-radius:9px;background:rgba(245,196,81,.14);border:1px solid rgba(245,196,81,.25);color:#D9A441;display:grid;place-items:center;font-size:12px;font-weight:800;flex:0 0 auto}
.fx-root2[data-theme="dark"] .fx-priority{color:var(--lime)}
.fx-attack-head b{font-size:14px;display:block;line-height:1.25}
.fx-attack-head p{margin:4px 0 0;color:var(--muted);font-size:12px;line-height:1.4}
.fx-attack-meta{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin:10px 0;font-size:11px;color:var(--muted)}
.fx-attack-meta .fx-mono{font-size:13px}
.fx-pay-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}
.fx-pay-actions .fx-mini-btn:first-child{background:rgba(245,196,81,.16);border-color:rgba(245,196,81,.32);color:#D9A441}
.fx-root2[data-theme="dark"] .fx-pay-actions .fx-mini-btn:first-child{color:var(--lime)}
.fx-pay-suggestion{margin-top:11px}
.fx-sim-summary{display:flex;gap:8px;flex-wrap:wrap;margin:2px 0 10px;color:var(--muted);font-size:12px}
.fx-hold-note{margin-top:10px;background:rgba(245,196,81,.1);border:1px solid rgba(245,196,81,.22);color:#F5C451;border-radius:10px;padding:9px 10px;font-size:12.5px;line-height:1.4}
.fx-plan-month{background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:11px;margin-bottom:10px}
.fx-plan-month:last-child{margin-bottom:0}
.fx-plan-month p{margin:9px 0 0;color:var(--muted);font-size:12px;line-height:1.4}
.fx-plan-row{display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center;padding:9px 0;border-bottom:1px solid var(--line);font-size:13px}
.fx-plan-row:last-child{border-bottom:none;padding-bottom:0}
.fx-plan-row span{min-width:0}
.fx-plan-row em{font-style:normal;font-size:10.5px;color:#F5C451;border:1px solid rgba(245,196,81,.25);background:rgba(245,196,81,.09);border-radius:99px;padding:3px 7px;white-space:nowrap}
.fx-plan-row em.ok{color:#D9A441;border-color:rgba(245,196,81,.3);background:rgba(245,196,81,.1)}
.fx-root2[data-theme="dark"] .fx-plan-row em.ok{color:var(--lime)}
.fx-card-stack{display:flex;flex-direction:column;gap:8px}
.fx-card-row{display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:10px 11px}
.fx-card-row b{display:block;font-size:13.5px}
.fx-card-row span{display:block;color:var(--muted);font-size:11px;margin-top:2px}
.fx-card-row strong{font-size:13px;white-space:nowrap}
.fx-card-pay{display:flex;flex-direction:column;align-items:flex-end;gap:6px}
.fx-root2 input:disabled,.fx-root2 select:disabled{opacity:.45;cursor:not-allowed}

.fx-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:520px;
  background:var(--panel);border-top:1px solid var(--line);display:grid;grid-template-columns:1fr 1fr auto 1fr 1fr 1fr 1fr;
  align-items:center;padding:7px 10px calc(7px + env(safe-area-inset-bottom));gap:4px;z-index:50}
.fx-nav button{background:none;border:none;color:var(--muted);display:flex;flex-direction:column;align-items:center;gap:3px;font-size:9px;cursor:pointer;padding:4px 1px;min-width:0}
.fx-nav span{max-width:100%;overflow:hidden;text-overflow:ellipsis}
.fx-nav button.on{color:#D9A441}
.fx-root2[data-theme="dark"] .fx-nav button.on{color:var(--lime)}
.fx-fab{width:48px;height:48px;border-radius:50%;background:var(--lime)!important;color:#0E0F13!important;display:grid!important;place-items:center;margin-top:-22px;box-shadow:0 4px 14px rgba(245,196,81,.35)}

.fx-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center;z-index:100;backdrop-filter:blur(2px)}
.fx-modal{background:var(--panel);border:1px solid var(--line);border-radius:18px 18px 0 0;padding:16px;width:100%;max-width:520px;max-height:85vh;overflow-y:auto;animation:fx-up .22s ease}
@keyframes fx-up{from{transform:translateY(30px);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.fx-modal{animation:none}.fx-bar div{transition:none}}
.fx-modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;font-size:15px}

.fx-toggle{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:var(--ink);border:1px solid var(--line);border-radius:11px;padding:4px;margin-bottom:11px}
.fx-toggle button{background:none;border:none;color:var(--muted);padding:9px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer}
.fx-toggle button.on.entrada{background:rgba(245,196,81,.16);color:#D9A441}
.fx-root2[data-theme="dark"] .fx-toggle button.on.entrada{color:var(--lime)}
.fx-toggle button.on.saida{background:rgba(255,122,92,.15);color:var(--coral)}

.fx-row{display:flex;gap:8px;margin-bottom:9px}
.fx-root2 input,.fx-root2 select{background:var(--ink);border:1px solid var(--line);color:var(--text);border-radius:10px;padding:10px 11px;font-size:14px;font-family:inherit;outline:none;width:100%;min-width:0}
.fx-root2 input:focus,.fx-root2 select:focus{border-color:#D9A441}
.fx-root2[data-theme="dark"] input:focus,.fx-root2[data-theme="dark"] select:focus{border-color:var(--lime)}
.fx-amount{font-family:ui-monospace,monospace;font-size:16px!important;font-weight:600}
.fx-add{width:100%;background:var(--lime);color:#0E0F13;border:none;border-radius:11px;padding:12px;font-size:15px;font-weight:700;cursor:pointer;margin-top:4px}
.fx-add:disabled{opacity:.4;cursor:not-allowed}
@media (max-width:380px){.fx-chart{flex-direction:column}.fx-donut{margin:0 auto}.fx-filters{grid-template-columns:1fr 1fr}}
`;
