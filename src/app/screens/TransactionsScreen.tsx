import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { transactionsAPI } from "../services/api";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Star, Trash2, Plus, FileText, ChevronLeft, ChevronRight, ChevronDown,
  ShoppingBag, Edit3, Search, SlidersHorizontal, Inbox,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useCategoryContext } from "../context/CategoryContext";

// ─── Types ──────────────────────────────────────────────────────────────────────
interface Transaction {
  id: number;
  icon: LucideIcon;
  name: string;
  note: string;
  account: string;
  amount: number;
  date: string;
  dateLabel: string;
  category: string;
  subcategory?: string;
  category_id?: string;
  subcategory_id?: string;
  type: "expense" | "income" | "transfer" | "savings";
  recurring: boolean;
}

type PeriodTab = "Daily" | "Calendar" | "Monthly" | "Total" | "Note";

// ─── Helpers ────────────────────────────────────────────────────────────────────
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function formatINR(n: number) {
  return Math.round(Math.abs(n)).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

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
  return { income, expense, savings, balance: income - expense };
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

interface MonthGroup {
  key: string; monthLabel: string; year: number; monthIdx: number;
  income: number; expense: number; savings: number; balance: number;
  transactions: Transaction[];
}

function groupByMonth(txs: Transaction[]): MonthGroup[] {
  const map = new Map<string, Transaction[]>();
  txs.forEach(tx => {
    if (!tx.date) return;
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
const C_INCOME = "var(--income)";
const C_EXPENSE = "var(--expense)";
const C_SAVINGS = "var(--savings)";
const C_BALANCE = "var(--ink)";
const C_ACCENT = "var(--gold)";

// ─── Summary Card (reused for all period headers) ───────────────────────────────
function SummaryCard({ income, expense, savings, balance }: { income: number; expense: number; savings: number; balance: number }) {
  const netTotal = income - expense;
  return (
    <div className="bg-[var(--surface)] rounded-[14px] p-2.5 border border-[var(--divider)]">
      <div className="grid grid-cols-4 gap-2">
        {[
          { l: "Income", v: income, c: C_INCOME, p: "+" },
          { l: "Expense", v: expense, c: C_EXPENSE, p: "-" },
          { l: "Savings", v: savings, c: C_SAVINGS, p: "-" },
          { l: "Total", v: netTotal, c: C_BALANCE, p: netTotal >= 0 ? "+" : "-" },
        ].map(s => (
          <div key={s.l} className="text-center">
            <p className="text-[9px] text-[var(--ink-faint)]">{s.l}</p>
            <p className="text-[11px] font-fraunces font-semibold tabular-nums" style={{ color: s.c }}>{s.p}₹{formatINR(s.v)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Transaction Row ────────────────────────────────────────────────────────────
function TransactionRow({ transaction, onLongPress }: {
  transaction: Transaction; onLongPress: (tx: Transaction) => void;
}) {
  const { categories, getCatById, getSubById } = useCategoryContext();

  const isSavings = transaction.type === "savings";
  const isIncome = transaction.type === "income";
  const isExpense = transaction.type === "expense";
  const amountColor = isIncome ? C_INCOME : isSavings ? C_SAVINGS : isExpense ? C_EXPENSE : "var(--ink-muted)";
  const colorBg = isIncome ? "var(--income-chip)" : isSavings ? "var(--savings-chip)" : "var(--expense-chip)";
  const colorIcon = isIncome ? C_INCOME : isSavings ? C_SAVINGS : C_EXPENSE;

  const cat = transaction.category_id ? getCatById(transaction.category_id) : null;
  const sub = transaction.subcategory_id
    ? (transaction.category_id
        ? getSubById(transaction.category_id, transaction.subcategory_id) 
          ?? (categories.flatMap(c => c.subs).find(s => s.id === transaction.subcategory_id))
        : categories.flatMap(c => c.subs).find(s => s.id === transaction.subcategory_id))
    : null;


  return (
    <motion.div
      onClick={() => onLongPress(transaction)}
      className="flex items-center gap-3 py-3 px-2 rounded-[14px] transition-colors hover:bg-ink/[0.04] active:bg-ink/[0.06] cursor-pointer"
      style={{ userSelect: "none" }}
    >
      {/* Column 1: Category & Subcategory */}
      <div className="w-[130px] flex-shrink-0 min-w-0 pr-2">
        <p className="text-[12px] font-semibold text-[var(--ink)] truncate flex items-center gap-1">
          <span className="text-sm flex-shrink-0">
            {cat?.icon ? <cat.icon className="w-3.5 h-3.5" strokeWidth={1.75} style={{ color: "var(--neutral-icon)" }} /> : cat?.emoji || <ShoppingBag className="w-3.5 h-3.5" strokeWidth={1.75} style={{ color: "var(--neutral-icon)" }} />}
          </span>
          <span className="truncate">{cat?.name || transaction.category}</span>
        </p>
        {sub ? (
          <p className="text-[10px] text-[var(--ink-faint)] truncate flex items-center gap-1 mt-0.5">
            <span className="text-xs flex-shrink-0">
              {sub?.icon ? <sub.icon className="w-3 h-3" strokeWidth={1.75} /> : sub.emoji}
            </span>
            <span className="truncate">{sub.name}</span>
          </p>
        ) : (
          <p className="text-[10px] text-[var(--ink-faint)] truncate mt-0.5">—</p>
        )}
      </div>

      {/* Column 2: Note/Name & Account */}
      <div className="flex-1 min-w-0 pr-2">
        <p className="text-[12px] text-[var(--ink)] font-medium truncate">{transaction.note || transaction.name || "—"}</p>
        <p className="text-[10px] text-[var(--ink-faint)] truncate mt-0.5">{transaction.account}</p>
      </div>

      {/* Column 3: Amount */}
      <div className="w-[95px] flex-shrink-0 text-right">
        <p className="text-[12px] font-fraunces font-bold tabular-nums" style={{ color: amountColor }}>
          {isIncome ? "+" : isExpense ? "-" : ""}₹ {formatINR(transaction.amount)}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Action Sheet ───────────────────────────────────────────────────────────────
function ActionSheet({ transaction, onDelete, onEdit, onClose }: {
  transaction: Transaction; onDelete: () => void; onEdit: () => void; onClose: () => void;
}) {
  const typeColor = transaction.type === "income" ? C_INCOME : transaction.type === "savings" ? C_SAVINGS : transaction.type === "expense" ? C_EXPENSE : "var(--ink-muted)";
  const chipBg = transaction.type === "income" ? "var(--income-chip)" : transaction.type === "savings" ? "var(--savings-chip)" : transaction.type === "expense" ? "var(--expense-chip)" : "var(--neutral-chip)";
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }} onClick={e => e.stopPropagation()}
        className="w-full max-w-md mx-auto rounded-t-[18px] border-t border-[var(--divider)] p-5"
        style={{ background: "var(--surface)" }}>
        <div className="flex justify-center mb-4"><div className="w-8 h-1 rounded-full bg-[var(--divider)]" /></div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: chipBg }}>
            <transaction.icon className="w-5 h-5" strokeWidth={1.75} style={{ color: typeColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm" style={{ color: "var(--ink)" }}>{transaction.name}</p>
            <p className="text-xs" style={{ color: "var(--ink-faint)" }}>{transaction.note} · {transaction.account}</p>
          </div>
          <p className="font-fraunces font-semibold text-sm tabular-nums" style={{ color: typeColor }}>₹{formatINR(transaction.amount)}</p>
        </div>
        <div className="space-y-1.5">
          <motion.button whileTap={{ scale: 0.97 }} onClick={onEdit}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[14px] text-sm active:bg-ink/10 transition-colors"
            style={{ background: "var(--surface-raised)", color: "var(--ink)" }}>
            <Edit3 className="w-4 h-4" strokeWidth={1.75} style={{ color: "var(--ink-faint)" }} /> Edit Transaction
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={onDelete}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[14px] text-sm transition-colors"
            style={{ background: "var(--expense-chip)", color: "var(--expense)" }}>
            <Trash2 className="w-4 h-4" strokeWidth={1.75} /> Delete Transaction
          </motion.button>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
          className="w-full mt-3 py-3 rounded-[14px] text-sm font-medium"
          style={{ background: "var(--surface-raised)", color: "var(--ink-faint)" }}>Cancel</motion.button>
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
        className="w-full max-w-sm rounded-[18px] p-6"
        style={{ background: "var(--surface)", border: "1px solid var(--divider)" }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--expense-chip)" }}>
          <Trash2 className="w-6 h-6" strokeWidth={1.75} style={{ color: "var(--expense)" }} />
        </div>
        <h2 className="font-bold text-center mb-2" style={{ fontSize: 18, color: "var(--ink)" }}>Delete Transaction?</h2>
        <div className="rounded-[14px] p-3 mb-4" style={{ background: "var(--surface-raised)" }}>
          <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>{transaction.name}</p>
          <p className="text-xs" style={{ color: "var(--ink-faint)" }}>{transaction.note} · {transaction.account} · {transaction.dateLabel}</p>
          <p className="font-fraunces font-bold mt-1 text-base tabular-nums" style={{ color: "var(--expense)" }}>₹{formatINR(transaction.amount)}</p>
        </div>
        <p className="text-center mb-5 text-xs" style={{ color: "var(--ink-faint)" }}>This action can be undone within 5 seconds.</p>
        <div className="flex gap-3">
          <motion.button whileTap={{ scale: 0.95 }} onClick={onClose}
            className="flex-1 py-3 rounded-[14px] font-semibold text-sm"
            style={{ background: "var(--surface-raised)", color: "var(--ink-muted)" }}>Cancel</motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={onConfirm}
            className="flex-1 py-3 rounded-[14px] font-bold text-sm"
            style={{ background: "var(--expense)", color: "var(--ink)" }}>Delete</motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────────
export function TransactionsScreen() {
  const navigate = useNavigate();
  const { getCatById, getSubById } = useCategoryContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<PeriodTab>("Daily");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-indexed
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [actionTx, setActionTx] = useState<Transaction | null>(null);
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load transactions from real API
  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const txData = await transactionsAPI.getAll();
      
      const mapped = txData.map((t: any) => ({
        id: t.id,
        icon: ShoppingBag,
        name: t.note || t.category_name || "Transaction",
        note: t.note || "",
        account: t.type === "transfer"
          ? `${t.account_name || "Account"} ➔ ${t.to_account_name || "Account"}`
          : (t.account_name || "Account"),
        amount: parseFloat(t.amount),
        date: t.date?.split("T")[0] || "",
        dateLabel: new Date(t.date).toLocaleDateString(),
        category: t.category_name || "Uncategorized",
        subcategory: undefined,
        category_id: t.category_id,
        subcategory_id: t.subcategoryId || t.subcategory_id,
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
  }, [currentYear]);

  const toggleGroup = useCallback((key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  // ─── Period label ───────────────────────────────────────────────
  const periodLabel = useMemo(() => {
    if (period === "Total") return "All Time";
    if (period === "Monthly") return currentYear.toString();
    return `${MONTHS[currentMonth]} ${currentYear}`;
  }, [period, currentMonth, currentYear]);

  // ─── Filter transactions by current period ─────────────────────
  const filtered = useMemo(() => {
    if (period === "Total") {
      return transactions;
    }
    if (period === "Monthly") {
      return transactions.filter(t => {
        if (!t.date) return false;
        return new Date(t.date).getFullYear() === currentYear;
      });
    }
    // Daily, Calendar, Note: filter by current month/year
    return transactions.filter(t => {
      if (!t.date) return false;
      const d = new Date(t.date);
      const inMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      if (period === "Note") {
        return inMonth && t.note && t.note.trim() !== "";
      }
      return inMonth;
    });
  }, [transactions, period, currentMonth, currentYear]);

  const summary = useMemo(() => calcSummary(filtered), [filtered]);

  // ─── Navigation handlers ───────────────────────────────────────
  const shiftPeriod = (dir: 1 | -1) => {
    if (period === "Total") {
      // no shift for total
    } else if (period === "Monthly") {
      setCurrentYear(y => y + dir);
    } else {
      // Daily / Calendar / Note
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
    if (tab === "Calendar") {
      setSelectedDay(new Date().getDate());
    }
  };

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
  const monthGroups = useMemo(() => groupByMonth(filtered), [filtered]);

  // Days in current month for inline calendar
  const daysInMonth = useMemo(() => new Date(currentYear, currentMonth + 1, 0).getDate(), [currentYear, currentMonth]);
  const firstDayOfWeek = useMemo(() => new Date(currentYear, currentMonth, 1).getDay(), [currentYear, currentMonth]);

  const getTransactionsForDay = useCallback((day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return transactions.filter(t => t.date === dateStr);
  }, [transactions, currentMonth, currentYear]);

  const dayStats = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dayTxs = getTransactionsForDay(day);
      const income = dayTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const expense = dayTxs.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);
      const savings = dayTxs.filter(t => t.type === "savings").reduce((s, t) => s + Math.abs(t.amount), 0);
      return { day, income, expense, savings, transactions: dayTxs };
    });
  }, [daysInMonth, getTransactionsForDay]);

  const selectedDayData = useMemo(() => {
    if (selectedDay === null) return null;
    const activeDay = Math.min(selectedDay, daysInMonth);
    return dayStats.find(d => d.day === activeDay) || null;
  }, [dayStats, selectedDay, daysInMonth]);

  return (
    <div className="pb-24 relative" style={{ background: "var(--bg-deep)", minHeight: "100vh" }}>
      {/* Top ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(212,162,76,0.11) 0%,transparent 70%)" }} />

      {/* ─── Period Navigation ──────────────────────────────────────── */}
      <div className="sticky top-[57px] z-30 backdrop-blur-xl border-b border-[var(--divider)]" style={{ background: "rgba(16,23,26,0.95)" }}>
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left section: Month navigation */}
          <div className="flex items-center gap-1.5">
            <motion.button whileTap={{ scale: 0.85 }}
              onClick={() => shiftPeriod(-1)}
              disabled={period === "Total"}
              className={`p-1 transition-colors ${period === "Total" ? "opacity-30 cursor-not-allowed" : ""}`}
              style={{ color: "var(--ink-muted)" }}>
              <ChevronLeft className="w-5 h-5" strokeWidth={1.75} />
            </motion.button>
            <span className="font-semibold text-[15px] min-w-[70px] text-center" style={{ color: "var(--ink)" }}>{periodLabel}</span>
            <motion.button whileTap={{ scale: 0.85 }}
              onClick={() => shiftPeriod(1)}
              disabled={period === "Total"}
              className={`p-1 transition-colors ${period === "Total" ? "opacity-30 cursor-not-allowed" : ""}`}
              style={{ color: "var(--ink-muted)" }}>
              <ChevronRight className="w-5 h-5" strokeWidth={1.75} />
            </motion.button>
          </div>

          {/* Right section: Action Icons */}
          <div className="flex items-center gap-4" style={{ color: "var(--ink-muted)" }}>
            <motion.button whileTap={{ scale: 0.85 }} className="transition-colors">
              <Star className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.85 }} className="transition-colors">
              <Search className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.85 }} className="transition-colors">
              <SlidersHorizontal className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </motion.button>
          </div>
        </div>

        {/* Period Tabs */}
        <div className="flex px-4 pb-2.5 gap-1 border-b border-[var(--divider)]">
          {(["Daily", "Calendar", "Monthly", "Total", "Note"] as PeriodTab[]).map(tab => {
            const isSel = period === tab;
            return (
              <motion.button key={tab} whileTap={{ scale: 0.93 }}
                onClick={() => handlePeriodChange(tab)}
                className="flex-1 py-1.5 text-[13px] font-semibold transition-all relative text-center"
                style={{
                  color: isSel ? "var(--ink)" : "var(--ink-faint)",
                }}>
                {tab}
                {isSel && (
                  <motion.div layoutId="tabUnderline" className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: "var(--gold)" }} />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ─── Summary Strip ──────────────────────────────────────────── */}
      <div className="px-5 py-3">
        <div className="rounded-[18px] p-4" style={{ background: "var(--surface)", border: "1px solid var(--divider)" }}>
          <div className="grid grid-cols-4 text-center">
            <div className="min-w-0">
              <p className="text-[9px] mb-0.5 uppercase tracking-wider font-semibold truncate" style={{ color: "var(--ink-faint)" }}>Income</p>
              <p className="font-fraunces text-[11px] font-bold tabular-nums truncate" style={{ color: C_INCOME }}>
                ₹{formatINR(summary.income)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[9px] mb-0.5 uppercase tracking-wider font-semibold truncate" style={{ color: "var(--ink-faint)" }}>Expense</p>
              <p className="font-fraunces text-[11px] font-bold tabular-nums truncate" style={{ color: C_EXPENSE }}>
                ₹{formatINR(summary.expense)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[9px] mb-0.5 uppercase tracking-wider font-semibold truncate" style={{ color: "var(--ink-faint)" }}>Savings</p>
              <p className="font-fraunces text-[11px] font-bold tabular-nums truncate" style={{ color: C_SAVINGS }}>
                ₹{formatINR(summary.savings)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[9px] mb-0.5 uppercase tracking-wider font-semibold truncate" style={{ color: "var(--ink-faint)" }}>Total</p>
              <p className="font-fraunces text-[11px] font-bold tabular-nums truncate" style={{ color: C_BALANCE }}>
                ₹{formatINR(summary.income - summary.expense)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Transaction List ───────────────────────────────────────── */}
      <div className="px-4 relative z-10">
        {filtered.length === 0 && period !== "Calendar" ? (
          <div className="flex flex-col items-center py-20">
            <div className="w-16 h-16 rounded-[14px] flex items-center justify-center mb-4"
              style={{ background: "var(--surface-raised)", border: "1.5px dashed var(--divider)" }}>
              <FileText className="w-7 h-7" strokeWidth={1.75} style={{ color: "var(--ink-faint)" }} />
            </div>
            <p className="font-semibold text-sm" style={{ color: "var(--ink-muted)" }}>No transactions</p>
            <p className="mt-1 text-xs" style={{ color: "var(--ink-faint)" }}>Tap + to add your first transaction</p>
          </div>
        ) : period === "Daily" || period === "Note" ? (
          /* ── Daily / Note View ──────────────────────────── */
          dateGroups.map((group) => {
            const isOpen = expandedGroups.has(group.dateKey);
            return (
              <div key={group.dateKey} className="border-b border-[var(--divider)] pb-1">
                <motion.button
                  className="w-full pt-4 pb-2 cursor-pointer active:bg-ink/[0.02] rounded-[14px] transition-colors flex items-center justify-between text-left"
                  onClick={() => toggleGroup(group.dateKey)}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold" style={{ color: "var(--ink)" }}>{group.dayNum}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase leading-none" style={{ color: "var(--ink-muted)", background: "var(--surface-raised)" }}>{group.dayName}</span>
                    <span className="text-[11px]" style={{ color: "var(--ink-faint)" }}>{group.monthYear}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="font-fraunces flex items-center gap-2.5 text-[11px] font-bold tabular-nums">
                      {group.income > 0 && <span style={{ color: C_INCOME }}>₹{formatINR(group.income)}</span>}
                      {group.expense > 0 && <span style={{ color: C_EXPENSE }}>₹{formatINR(group.expense)}</span>}
                      {group.savings > 0 && <span style={{ color: C_SAVINGS }}>₹{formatINR(group.savings)}</span>}
                    </div>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      className="flex items-center"
                    >
                      <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.75} style={{ color: "var(--ink-faint)" }} />
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
                      <div className="border-l border-[var(--divider)] ml-4 pl-2">
                        {group.transactions.map(tx => (
                          <TransactionRow key={tx.id} transaction={tx} onLongPress={setActionTx} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        ) : period === "Calendar" ? (
          /* ── Calendar View ───────────────────────────────── */
          <div className="space-y-4 pt-4">
            {/* Calendar Grid Container */}
            <div className="rounded-[18px] p-4" style={{ background: "var(--surface)", border: "1px solid var(--divider)" }}>
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-2 mb-3">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink-faint)" }}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Empty cells before first day */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {/* Days */}
                {dayStats.map((stat) => {
                  const hasIncome = stat.income > 0;
                  const hasExpense = stat.expense > 0;
                  const hasSavings = stat.savings > 0;
                  const isSelected = selectedDay !== null && Math.min(selectedDay, daysInMonth) === stat.day;

                  return (
                    <button
                      key={stat.day}
                      onClick={() => setSelectedDay(stat.day)}
                      className="relative aspect-square rounded-[14px] flex flex-col items-center justify-center transition-colors"
                      style={isSelected
                        ? { background: "var(--gold)", color: "#241B0A" }
                        : { background: "var(--surface-raised)", color: "var(--ink-muted)" }}
                    >
                      <span className="text-sm font-semibold">{stat.day}</span>
                      <div className="flex gap-1 mt-1.5">
                        {hasIncome && (
                          <div className="w-1 h-1 rounded-full" style={{ background: isSelected ? "#241B0A" : "var(--income)" }} />
                        )}
                        {hasExpense && (
                          <div className="w-1 h-1 rounded-full" style={{ background: isSelected ? "#241B0A" : "var(--expense)" }} />
                        )}
                        {hasSavings && (
                          <div className="w-1 h-1 rounded-full" style={{ background: isSelected ? "#241B0A" : "var(--savings)" }} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Day Details */}
            {selectedDay !== null && (
              <div>
                <h3 className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: "var(--ink-faint)" }}>
                  Transactions on {MONTHS[currentMonth]} {Math.min(selectedDay, daysInMonth)}, {currentYear}
                </h3>

                {!selectedDayData || selectedDayData.transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center rounded-[18px]" style={{ background: "var(--surface)", border: "1px solid var(--divider)" }}>
                    <Inbox className="w-6 h-6 mb-1.5" strokeWidth={1.75} style={{ color: "var(--ink-faint)" }} />
                    <p className="text-xs" style={{ color: "var(--ink-faint)" }}>No transactions on this day</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 border-l border-ink/[0.05] ml-2 pl-2">
                    {selectedDayData.transactions.map(tx => (
                      <TransactionRow key={tx.id} transaction={tx} onLongPress={setActionTx} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ── Monthly / Total View ────────────────────────────────── */
          <div className="pt-4">
            {monthGroups.map((group) => {
              const aKey = `a-${group.key}`;
              const isOpen = expandedGroups.has(aKey);
              return (
                <div key={group.key} className="mb-3 border-b border-[var(--divider)] pb-2">
                  <motion.button
                    className="w-full flex items-center justify-between rounded-[14px] px-4 py-3.5 cursor-pointer active:bg-ink/[0.06] transition-colors"
                    style={{ background: "var(--surface)", border: "1px solid var(--divider)" }}
                    onClick={() => toggleGroup(aKey)}
                    whileTap={{ scale: 0.99 }}
                  >
                    <p className="text-sm font-semibold" style={{ color: "var(--ink-muted)" }}>{group.monthLabel} {group.year}</p>
                    <div className="flex items-center gap-2">
                      <div className="font-fraunces flex gap-2.5 text-[11px] tabular-nums font-bold">
                        {group.income > 0 && <span style={{ color: C_INCOME }}>₹{formatINR(group.income)}</span>}
                        {group.expense > 0 && <span style={{ color: C_EXPENSE }}>₹{formatINR(group.expense)}</span>}
                        {group.savings > 0 && <span style={{ color: C_SAVINGS }}>₹{formatINR(group.savings)}</span>}
                        <span className="font-semibold" style={{ color: C_BALANCE }}>
                          ₹{formatINR(group.income - group.expense)}
                        </span>
                      </div>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      >
                        <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.75} style={{ color: "var(--ink-faint)" }} />
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
                        <div className="border-l border-[var(--divider)] ml-4 pl-2 mt-1">
                          {group.transactions.map(tx => (
                            <TransactionRow key={tx.id} transaction={tx} onLongPress={setActionTx} />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Floating Add Button ────────────────────────────────────── */}
      <motion.button whileTap={{ scale: 0.9 }}
        onClick={() => navigate("/dashboard/add-transaction")}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center z-40"
        style={{
          background: "var(--gold)",
          boxShadow: "0 6px 24px rgba(212,162,76,0.45)",
        }}>
        <Plus className="w-6 h-6" strokeWidth={1.75} style={{ color: "#241B0A" }} />
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
      </AnimatePresence>
    </div>
  );
}


