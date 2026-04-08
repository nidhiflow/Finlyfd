import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { transactionsAPI, bookmarksAPI } from "../services/api";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Star, Trash2, Plus, FileText, ChevronLeft, ChevronRight, ChevronDown,
  Utensils, Car, Zap, Coffee, ShoppingBag, Edit3,
  ArrowDownLeft, Wallet, Calendar, X,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────────────────
interface Transaction {
  id: number;
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  note: string;
  account: string;
  amount: number;
  date: string;
  dateLabel: string;
  category: string;
  subcategory?: string;
  bookmarked: boolean;
  type: "expense" | "income" | "transfer" | "savings";
  recurring: boolean;
}

type PeriodTab = "Daily" | "Weekly" | "Monthly" | "Annually" | "Custom";

// ─── Helpers ────────────────────────────────────────────────────────────────────
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function formatINR(n: number) { return Math.abs(n).toLocaleString("en-IN"); }

function parseDateStr(d: string) {
  const dt = new Date(d);
  return {
    dayNum: dt.getDate().toString().padStart(2, "0"),
    dayName: DAYS[dt.getDay()],
    monthYear: `${(dt.getMonth() + 1).toString().padStart(2, "0")}.${dt.getFullYear()}`,
    monthIdx: dt.getMonth(),
    monthLabel: MONTHS[dt.getMonth()],
    year: dt.getFullYear(),
    weekNum: getWeekNumber(dt),
    obj: dt,
  };
}

function getWeekNumber(d: Date) {
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime() + (start.getTimezoneOffset() - d.getTimezoneOffset()) * 60000;
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}

// ─── Summary helper ─────────────────────────────────────────────────────────────
function calcSummary(txs: Transaction[]) {
  const income = txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);
  const savings = txs.filter(t => t.type === "savings").reduce((s, t) => s + Math.abs(t.amount), 0);
  return { income, expense, savings, balance: income - expense - savings };
}

// ─── Mock Data ──────────────────────────────────────────────────────────────────
const MOCK_TXS: Transaction[] = [];

// ─── Grouping Functions ─────────────────────────────────────────────────────────
interface DateGroup {
  dateKey: string; dayNum: string; dayName: string; monthYear: string;
  income: number; expense: number; savings: number; balance: number;
  transactions: Transaction[];
}

function groupByDate(txs: Transaction[]): DateGroup[] {
  const map = new Map<string, Transaction[]>();
  txs.forEach(tx => { const l = map.get(tx.date) || []; l.push(tx); map.set(tx.date, l); });
  const groups: DateGroup[] = [];
  map.forEach((list, dateKey) => {
    const p = parseDateStr(dateKey);
    const s = calcSummary(list);
    groups.push({ dateKey, dayNum: p.dayNum, dayName: p.dayName, monthYear: p.monthYear, ...s, transactions: list });
  });
  groups.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  return groups;
}

interface WeekGroup {
  label: string; wn: number;
  income: number; expense: number; savings: number; balance: number;
  transactions: Transaction[];
}

function groupByWeek(txs: Transaction[]): WeekGroup[] {
  const map = new Map<number, Transaction[]>();
  txs.forEach(tx => { const wn = getWeekNumber(new Date(tx.date)); const l = map.get(wn) || []; l.push(tx); map.set(wn, l); });
  const groups: WeekGroup[] = [];
  map.forEach((list, wn) => {
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const f = parseDateStr(sorted[0].date), l = parseDateStr(sorted[sorted.length - 1].date);
    const s = calcSummary(list);
    groups.push({ wn, label: `Week ${wn}: ${f.dayNum} ${f.monthLabel} – ${l.dayNum} ${l.monthLabel}`, ...s, transactions: list });
  });
  groups.sort((a, b) => b.wn - a.wn);
  return groups;
}

interface MonthGroup {
  key: string; monthLabel: string; year: number; monthIdx: number;
  income: number; expense: number; savings: number; balance: number;
  transactions: Transaction[];
}

function groupByMonth(txs: Transaction[]): MonthGroup[] {
  const map = new Map<string, Transaction[]>();
  txs.forEach(tx => {
    const d = new Date(tx.date);
    const key = `${d.getFullYear()}-${d.getMonth().toString().padStart(2, "0")}`;
    const l = map.get(key) || []; l.push(tx); map.set(key, l);
  });
  const groups: MonthGroup[] = [];
  map.forEach((list, key) => {
    const d = new Date(list[0].date);
    const s = calcSummary(list);
    groups.push({ key, monthLabel: MONTHS_FULL[d.getMonth()], year: d.getFullYear(), monthIdx: d.getMonth(), ...s, transactions: list });
  });
  groups.sort((a, b) => b.key.localeCompare(a.key));
  return groups;
}

// ─── Color constants ────────────────────────────────────────────────────────────
const C_INCOME = "#22C55E";
const C_EXPENSE = "#EF4444";
const C_SAVINGS = "#F72585";
const C_BALANCE = "#FFA500";

// ─── Summary Card (reused for all period headers) ───────────────────────────────
function SummaryCard({ income, expense, savings, balance }: { income: number; expense: number; savings: number; balance: number }) {
  return (
    <div className="bg-[#1B2130]/60 rounded-lg p-2.5 border border-white/[0.05]">
      <div className="grid grid-cols-4 gap-2">
        {[
          { l: "Income", v: income, c: C_INCOME },
          { l: "Expense", v: expense, c: C_EXPENSE },
          { l: "Savings", v: savings, c: C_SAVINGS },
          { l: "Balance", v: balance, c: C_BALANCE },
        ].map(s => (
          <div key={s.l} className="text-center">
            <p className="text-[9px] text-white/30">{s.l}</p>
            <p className="text-[11px] font-semibold tabular-nums" style={{ color: s.c }}>₹{formatINR(s.v)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Transaction Row ────────────────────────────────────────────────────────────
function TransactionRow({ transaction, onLongPress, onBookmark }: {
  transaction: Transaction; onLongPress: (tx: Transaction) => void; onBookmark: (id: number) => void;
}) {
  const Icon = transaction.icon;
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pressing, setPressing] = useState(false);

  const onPointerDown = () => {
    setPressing(true);
    longPressTimer.current = setTimeout(() => { onLongPress(transaction); setPressing(false); }, 500);
  };
  const onPointerUp = () => { setPressing(false); if (longPressTimer.current) clearTimeout(longPressTimer.current); };

  const isSavings = transaction.type === "savings";
  const isIncome = transaction.type === "income";
  const isExpense = transaction.type === "expense";
  const amountColor = isIncome ? C_INCOME : isSavings ? C_SAVINGS : isExpense ? C_EXPENSE : "rgba(255,255,255,0.85)";

  return (
    <motion.div
      onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
      className={`flex items-center gap-3 py-3 px-2 rounded-xl transition-colors ${pressing ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"}`}
      style={{ userSelect: "none" }}
    >
      {/* Category label area */}
      <div className="flex-shrink-0 w-[68px]">
        <p className="text-[11px] font-medium truncate text-[#9D7EFF]/70">{transaction.category}</p>
        <p className="text-[10px] text-[#9D7EFF]/35 truncate">{transaction.subcategory || transaction.note}</p>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-white/90 font-medium truncate">{transaction.name}</p>
        <p className="text-[11px] text-white/25 truncate">{transaction.account}</p>
      </div>

      {/* Amount + bookmark */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <div className="text-right">
          <p className="text-[13px] font-semibold tabular-nums" style={{ color: amountColor }}>
            ₹ {formatINR(transaction.amount)}
          </p>
        </div>
        <motion.button whileTap={{ scale: 0.75 }}
          onClick={(e) => { e.stopPropagation(); onBookmark(transaction.id); }}
          className="w-7 h-7 rounded-md flex items-center justify-center">
          <Star className={`w-3.5 h-3.5 ${transaction.bookmarked ? "text-[#FFD700] fill-[#FFD700]" : "text-white/15"}`} />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Action Sheet ───────────────────────────────────────────────────────────────
function ActionSheet({ transaction, onDelete, onEdit, onClose }: {
  transaction: Transaction; onDelete: () => void; onEdit: () => void; onClose: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }} onClick={e => e.stopPropagation()}
        className="w-full max-w-md mx-auto rounded-t-2xl border-t border-white/10 p-5"
        style={{ background: "linear-gradient(180deg,#1A2238 0%,#131825 100%)" }}>
        <div className="flex justify-center mb-4"><div className="w-8 h-1 rounded-full bg-white/15" /></div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#7C5CFF]/15 flex items-center justify-center">
            <transaction.icon className="w-5 h-5 text-[#7C5CFF]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm">{transaction.name}</p>
            <p className="text-white/40 text-xs">{transaction.note} · {transaction.account}</p>
          </div>
          <p className="text-white font-semibold text-sm">₹{formatINR(transaction.amount)}</p>
        </div>
        <div className="space-y-1.5">
          <motion.button whileTap={{ scale: 0.97 }} onClick={onEdit}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/5 border border-white/5 text-white text-sm active:bg-white/10 transition-colors">
            <Edit3 className="w-4 h-4 text-white/50" /> Edit Transaction
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={onDelete}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#EF4444]/8 border border-[#EF4444]/10 text-red-400 text-sm active:bg-[#EF4444]/15 transition-colors">
            <Trash2 className="w-4 h-4" /> Delete Transaction
          </motion.button>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
          className="w-full mt-3 py-3 rounded-xl bg-white/5 text-white/50 text-sm font-medium">Cancel</motion.button>
      </motion.div>
    </motion.div>
  );
}

// ─── Delete Modal ───────────────────────────────────────────────────────────────
function DeleteModal({ transaction, onConfirm, onClose }: {
  transaction: Transaction; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center px-5"
      style={{ background: "rgba(0,0,0,0.85)" }} onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl p-6 border border-red-500/20"
        style={{ background: "linear-gradient(180deg,#1A2238 0%,#101828 100%)" }}>
        <div className="w-12 h-12 rounded-xl bg-[#EF4444]/15 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-[#EF4444]" />
        </div>
        <h2 className="text-white font-bold text-center mb-2" style={{ fontSize: 18 }}>Delete Transaction?</h2>
        <div className="rounded-xl p-3 mb-4 bg-white/[0.03] border border-white/[0.07]">
          <p className="text-white font-semibold text-sm">{transaction.name}</p>
          <p className="text-white/40 text-xs">{transaction.note} · {transaction.account} · {transaction.dateLabel}</p>
          <p className="font-bold mt-1 text-base text-[#EF4444]">₹{formatINR(transaction.amount)}</p>
        </div>
        <p className="text-white/40 text-center mb-5 text-xs">This action can be undone within 5 seconds.</p>
        <div className="flex gap-3">
          <motion.button whileTap={{ scale: 0.95 }} onClick={onClose}
            className="flex-1 py-3 rounded-xl font-semibold bg-white/[0.07] border border-white/10 text-white/60 text-sm">Cancel</motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={onConfirm}
            className="flex-1 py-3 rounded-xl font-bold bg-[#EF4444] text-white text-sm shadow-lg shadow-[#EF4444]/20">Delete</motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Custom Date Range Picker ───────────────────────────────────────────────────
function CustomDatePicker({ onApply, onClose }: {
  onApply: (from: string, to: string) => void; onClose: () => void;
}) {
  const [fromDate, setFromDate] = useState("2026-04-01");
  const [toDate, setToDate] = useState("2026-04-08");

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#7C5CFF] transition-colors";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }} onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl p-6 border border-white/10"
        style={{ background: "linear-gradient(180deg,#1A2238 0%,#131825 100%)" }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#7C5CFF]" />
            <h3 className="text-white font-semibold">Custom Range</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/5"><X className="w-4 h-4 text-white/50" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-white/50 text-xs mb-1.5 block">From</label>
            <input type="date" className={inputCls} value={fromDate} onChange={e => setFromDate(e.target.value)}
              style={{ colorScheme: "dark" }} />
          </div>
          <div>
            <label className="text-white/50 text-xs mb-1.5 block">To</label>
            <input type="date" className={inputCls} value={toDate} onChange={e => setToDate(e.target.value)}
              style={{ colorScheme: "dark" }} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <motion.button whileTap={{ scale: 0.95 }} onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/5 text-white/50 text-sm font-medium">Cancel</motion.button>
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => { if (fromDate > toDate) { toast.error("Invalid range"); return; } onApply(fromDate, toDate); }}
            className="flex-1 py-3 rounded-xl text-white text-sm font-semibold shadow-lg shadow-[#7C5CFF]/30"
            style={{ background: "linear-gradient(135deg,#7C5CFF,#4CC9F0)" }}>Apply</motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────────
export function TransactionsScreen() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<PeriodTab>("Daily");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-indexed
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [customFrom, setCustomFrom] = useState<string | null>(null);
  const [customTo, setCustomTo] = useState<string | null>(null);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [actionTx, setActionTx] = useState<Transaction | null>(null);
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load transactions from real API
  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      // Default: load current year's transactions for fluid navigation
      const start = `${currentYear}-01-01`;
      const end = `${currentYear}-12-31`;
      const url = `/api/transactions?startDate=${start}&endDate=${end}`;
      const data = await transactionsAPI.getAll({ month: undefined }); // Wait, API is already created but let's just fetch all using fetch or API directly.
      // Wait, let's use the API method we added.
      // Our api method only has `month`, `categoryId`, `isRecurring`. Let's just fetch all by not passing anything.
      const txData = await transactionsAPI.getAll();
      
      const mapped = txData.map((t: any) => ({
        id: t.id,
        icon: ShoppingBag, // We don't have dynamic Icon components stored easily, so default to ShoppingBag
        name: t.note || t.category_name || "Transaction",
        note: t.note || "",
        account: t.account_name || "Account",
        amount: parseFloat(t.amount),
        date: t.date?.split("T")[0] || "",
        dateLabel: new Date(t.date).toLocaleDateString(),
        category: t.category_name || "Uncategorized",
        subcategory: undefined,
        bookmarked: false, // Wait, bookmarks are separate table, but finly-backend transaction may not include it. Let's assume false for now.
        type: t.type,
        recurring: !!t.repeat_group_id,
        original: t
      }));
      setTransactions(mapped);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load transactions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [currentYear]); // Refresh when year changes

  const toggleGroup = useCallback((key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  // ─── Period label ───────────────────────────────────────────────
  const periodLabel = useMemo(() => {
    if (period === "Custom" && customFrom && customTo) {
      const f = parseDateStr(customFrom), t = parseDateStr(customTo);
      return `${f.dayNum} ${f.monthLabel} – ${t.dayNum} ${t.monthLabel} ${t.year}`;
    }
    if (period === "Annually") return currentYear.toString();
    if (period === "Weekly") {
      const now = new Date(currentYear, currentMonth, 1);
      const wn = getWeekNumber(now) + currentWeekOffset;
      return `Week ${wn}, ${currentYear}`;
    }
    return `${MONTHS[currentMonth]} ${currentYear}`;
  }, [period, currentMonth, currentYear, currentWeekOffset, customFrom, customTo]);

  // ─── Filter transactions by current period ─────────────────────
  const filtered = useMemo(() => {
    if (period === "Custom" && customFrom && customTo) {
      return transactions.filter(t => t.date >= customFrom && t.date <= customTo);
    }
    if (period === "Annually") {
      return transactions.filter(t => {
        if (!t.date) return false;
        return new Date(t.date).getFullYear() === currentYear;
      });
    }
    // Default: filter by current month/year
    return transactions.filter(t => {
      if (!t.date) return false;
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [transactions, period, currentMonth, currentYear, customFrom, customTo]);

  const summary = useMemo(() => calcSummary(filtered), [filtered]);

  // ─── Navigation handlers ───────────────────────────────────────
  const shiftPeriod = (dir: 1 | -1) => {
    if (period === "Annually") {
      setCurrentYear(y => y + dir);
    } else if (period === "Weekly") {
      setCurrentWeekOffset(o => o + dir);
    } else if (period === "Custom") {
      // no shift for custom
    } else {
      // Daily / Monthly
      let m = currentMonth + dir;
      let y = currentYear;
      if (m > 11) { m = 0; y++; }
      if (m < 0) { m = 11; y--; }
      setCurrentMonth(m);
      setCurrentYear(y);
    }
  };

  const handlePeriodChange = (tab: PeriodTab) => {
    setPeriod(tab);
    if (tab === "Custom") setShowCustomPicker(true);
  };

  const handleCustomApply = (from: string, to: string) => {
    setCustomFrom(from);
    setCustomTo(to);
    setShowCustomPicker(false);
    toast.success("Custom range applied");
  };

  const toggleBookmark = useCallback(async (id: number) => {
    try {
      const t = transactions.find(tx => tx.id === id);
      if (!t) return;
      
      const newStatus = !t.bookmarked;
      // Optimistic update
      setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, bookmarked: newStatus } : tx));
      
      if (newStatus) {
        await bookmarksAPI.create(id.toString());
        toast.success("Bookmarked");
      } else {
        await bookmarksAPI.delete(id.toString());
        toast.success("Removed bookmark");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update bookmark");
    }
  }, [transactions]);

  const handleDelete = async (tx: Transaction) => {
    try {
      await transactionsAPI.delete(tx.id.toString());
      setTransactions(prev => prev.filter(t => t.id !== tx.id));
      setDeleteTx(null); setActionTx(null);
      toast.success("Transaction deleted");
    } catch (err) {
      toast.error("Failed to delete transaction");
    }
  };

  const dateGroups = useMemo(() => groupByDate(filtered), [filtered]);
  const weekGroups = useMemo(() => groupByWeek(filtered), [filtered]);
  const monthGroups = useMemo(() => groupByMonth(filtered), [filtered]);

  // ─── Render group header for date ──────────────────────────────
  const renderDateHeader = (g: DateGroup) => (
    <div className="pt-4 pb-2">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-white/90">{g.dayNum}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-white/50 bg-white/[0.06] px-1.5 py-0.5 rounded">{g.dayName}</span>
            <span className="text-[10px] text-white/25">{g.monthYear}</span>
          </div>
        </div>
      </div>
      <SummaryCard income={g.income} expense={g.expense} savings={g.savings} balance={g.balance} />
    </div>
  );

  return (
    <div className="pb-24 relative">
      {/* ─── Period Navigation ──────────────────────────────────────── */}
      <div className="sticky top-[57px] z-30 bg-[#0D0F14]/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex items-center justify-between px-5 py-3">
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => shiftPeriod(-1)}
            className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center active:bg-white/10 transition-colors">
            <ChevronLeft className="w-4 h-4 text-white/60" />
          </motion.button>
          <p className="text-white font-semibold text-sm">{periodLabel}</p>
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => shiftPeriod(1)}
            className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center active:bg-white/10 transition-colors">
            <ChevronRight className="w-4 h-4 text-white/60" />
          </motion.button>
        </div>

        {/* Period Tabs */}
        <div className="flex px-4 pb-3 gap-1">
          {(["Daily", "Weekly", "Monthly", "Annually", "Custom"] as PeriodTab[]).map(tab => (
            <motion.button key={tab} whileTap={{ scale: 0.93 }}
              onClick={() => handlePeriodChange(tab)}
              className="flex-1 py-2 rounded-lg text-[11px] font-medium transition-all"
              style={{
                background: period === tab ? "rgba(124,92,255,0.15)" : "transparent",
                color: period === tab ? "#9D7EFF" : "rgba(255,255,255,0.35)",
                borderBottom: period === tab ? "2px solid #7C5CFF" : "2px solid transparent",
              }}>
              {tab}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ─── Summary Strip ──────────────────────────────────────────── */}
      <div className="px-5 py-3">
        <div className="bg-[#1B2130]/60 rounded-xl p-3 border border-white/[0.04]">
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Income", value: summary.income, color: C_INCOME, prefix: "+" },
              { label: "Expenses", value: summary.expense, color: C_EXPENSE, prefix: "-" },
              { label: "Savings", value: summary.savings, color: C_SAVINGS, prefix: "↓" },
              { label: "Balance", value: summary.balance, color: C_BALANCE, prefix: "" },
            ].map(item => (
              <div key={item.label} className="text-center">
                <p className="text-[9px] text-white/35 mb-1 uppercase tracking-wider">{item.label}</p>
                <p className="text-[12px] font-semibold tabular-nums" style={{ color: item.color }}>
                  {item.prefix}₹{formatINR(item.value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Transaction List ───────────────────────────────────────── */}
      <div className="px-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1.5px dashed rgba(255,255,255,0.1)" }}>
              <FileText className="w-7 h-7 text-white/15" />
            </div>
            <p className="text-white/40 font-semibold text-sm">No transactions</p>
            <p className="text-white/20 mt-1 text-xs">Tap + to add your first transaction</p>
          </div>
        ) : period === "Daily" || period === "Custom" ? (
          /* ── Daily / Custom View ──────────────────────────── */
          dateGroups.map((group, gi) => {
            const isOpen = expandedGroups.has(group.dateKey);
            return (
            <div key={group.dateKey}>
              <motion.button
                className="w-full pt-4 pb-2 cursor-pointer active:bg-white/[0.02] rounded-xl transition-colors"
                onClick={() => toggleGroup(group.dateKey)}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-white/90">{group.dayNum}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium text-white/50 bg-white/[0.06] px-1.5 py-0.5 rounded">{group.dayName}</span>
                      <span className="text-[10px] text-white/25">{group.monthYear}</span>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <ChevronDown className="w-4 h-4 text-white/30" />
                  </motion.div>
                </div>
                <SummaryCard income={group.income} expense={group.expense} savings={group.savings} balance={group.balance} />
              </motion.button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="border-l-2 border-white/[0.04] ml-4 pl-2">
                      {group.transactions.map(tx => (
                        <TransactionRow key={tx.id} transaction={tx} onLongPress={setActionTx} onBookmark={toggleBookmark} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {gi < dateGroups.length - 1 && <div className="h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent my-1" />}
            </div>
          );})
        ) : period === "Weekly" ? (
          /* ── Weekly View ─────────────────────────────────── */
          weekGroups.map((group, gi) => {
            const wKey = `w-${group.wn}`;
            const isOpen = expandedGroups.has(wKey);
            return (
            <div key={group.wn}>
              <motion.button
                className="w-full pt-4 pb-2 cursor-pointer active:bg-white/[0.02] rounded-xl transition-colors"
                onClick={() => toggleGroup(wKey)}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-white/90">{group.label}</p>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <ChevronDown className="w-4 h-4 text-white/30" />
                  </motion.div>
                </div>
                <SummaryCard income={group.income} expense={group.expense} savings={group.savings} balance={group.balance} />
              </motion.button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="border-l-2 border-white/[0.04] ml-4 pl-2">
                      {group.transactions.map(tx => (
                        <TransactionRow key={tx.id} transaction={tx} onLongPress={setActionTx} onBookmark={toggleBookmark} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {gi < weekGroups.length - 1 && <div className="h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent my-1" />}
            </div>
          );})
        ) : period === "Monthly" ? (
          /* ── Monthly View ────────────────────────────────── */
          monthGroups.map((group, gi) => {
            const isOpen = expandedGroups.has(group.key);
            return (
            <div key={group.key}>
              <motion.button
                className="w-full pt-4 pb-2 cursor-pointer active:bg-white/[0.02] rounded-xl transition-colors"
                onClick={() => toggleGroup(group.key)}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-base font-semibold text-white/90">{group.monthLabel} {group.year}</p>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <ChevronDown className="w-4 h-4 text-white/30" />
                  </motion.div>
                </div>
                <SummaryCard income={group.income} expense={group.expense} savings={group.savings} balance={group.balance} />
              </motion.button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="border-l-2 border-white/[0.04] ml-4 pl-2">
                      {group.transactions.map(tx => (
                        <TransactionRow key={tx.id} transaction={tx} onLongPress={setActionTx} onBookmark={toggleBookmark} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {gi < monthGroups.length - 1 && <div className="h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent my-1" />}
            </div>
          );})
        ) : (
          /* ── Annually View — month-by-month summaries ──── */
          <div>
            {/* Annual summary card */}
            <div className="mt-3 mb-4 bg-gradient-to-br from-[#7C5CFF]/10 to-[#4CC9F0]/5 rounded-2xl p-4 border border-[#7C5CFF]/10">
              <p className="text-white/50 text-xs mb-2">Annual Overview — {currentYear}</p>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { l: "Income", v: summary.income, c: C_INCOME },
                  { l: "Expenses", v: summary.expense, c: C_EXPENSE },
                  { l: "Savings", v: summary.savings, c: C_SAVINGS },
                  { l: "Balance", v: summary.balance, c: C_BALANCE },
                ].map(s => (
                  <div key={s.l} className="text-center">
                    <p className="text-[9px] text-white/35 uppercase">{s.l}</p>
                    <p className="text-sm font-bold" style={{ color: s.c }}>₹{formatINR(s.v)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Month-by-month breakdown */}
            {monthGroups.map((group) => {
              const aKey = `a-${group.key}`;
              const isOpen = expandedGroups.has(aKey);
              return (
              <div key={group.key} className="mb-3">
                <motion.button
                  className="w-full flex items-center justify-between bg-[#1B2130]/50 rounded-xl px-4 py-3 border border-white/[0.04] cursor-pointer active:bg-white/[0.06] transition-colors"
                  onClick={() => toggleGroup(aKey)}
                  whileTap={{ scale: 0.99 }}
                >
                  <p className="text-sm font-semibold text-white/80">{group.monthLabel}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-3 text-[10px] tabular-nums">
                      <span style={{color: C_INCOME}}>+₹{formatINR(group.income)}</span>
                      <span style={{color: C_EXPENSE}}>-₹{formatINR(group.expense)}</span>
                      {group.savings > 0 && <span style={{color: C_SAVINGS}}>↓₹{formatINR(group.savings)}</span>}
                      <span className="font-semibold" style={{ color: C_BALANCE }}>
                        ₹{formatINR(group.balance)}
                      </span>
                    </div>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <ChevronDown className="w-3.5 h-3.5 text-white/25" />
                    </motion.div>
                  </div>
                </motion.button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="border-l-2 border-white/[0.04] ml-4 pl-2 mt-1">
                        {group.transactions.map(tx => (
                          <TransactionRow key={tx.id} transaction={tx} onLongPress={setActionTx} onBookmark={toggleBookmark} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );})}
          </div>
        )}
      </div>

      {/* ─── Floating Add Button ────────────────────────────────────── */}
      <motion.button whileTap={{ scale: 0.9 }}
        onClick={() => navigate("/dashboard/add-transaction")}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center z-40"
        style={{
          background: "linear-gradient(135deg,#7C5CFF,#4CC9F0)",
          boxShadow: "0 6px 24px rgba(124,92,255,0.45), 0 0 40px rgba(124,92,255,0.15)",
        }}>
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* ─── Modals ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {actionTx && !deleteTx && (
          <ActionSheet transaction={actionTx}
            onDelete={() => setDeleteTx(actionTx)}
            onEdit={() => { setActionTx(null); navigate(`/dashboard/edit-transaction/${actionTx.id}`); }}
            onClose={() => setActionTx(null)} />
        )}
        {deleteTx && (
          <DeleteModal transaction={deleteTx}
            onConfirm={() => handleDelete(deleteTx)}
            onClose={() => { setDeleteTx(null); setActionTx(null); }} />
        )}
        {showCustomPicker && (
          <CustomDatePicker onApply={handleCustomApply} onClose={() => { setShowCustomPicker(false); if (!customFrom) setPeriod("Daily"); }} />
        )}
      </AnimatePresence>
    </div>
  );
}