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
import { useCategoryContext } from "../context/CategoryContext";

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
  category_id?: string;
  subcategory_id?: string;
  bookmarked: boolean;
  type: "expense" | "income" | "transfer" | "savings";
  recurring: boolean;
}

type PeriodTab = "Daily" | "Calendar" | "Monthly" | "Total" | "Note";

// ─── Helpers ────────────────────────────────────────────────────────────────────
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function formatINR(n: number) {
  return Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
const C_INCOME = "#EF4444"; // Red/Orange
const C_EXPENSE = "#4CC9F0"; // Blue/Cyan
const C_SAVINGS = "#FFB703";
const C_BALANCE = "#FFFFFF"; // White

// ─── Summary Card (reused for all period headers) ───────────────────────────────
function SummaryCard({ income, expense, savings, balance }: { income: number; expense: number; savings: number; balance: number }) {
  const totalExpense = expense + savings;
  const netTotal = income - totalExpense;
  return (
    <div className="bg-[#161B26] rounded-lg p-2.5 border border-white/[0.05]">
      <div className="grid grid-cols-3 gap-2">
        {[
          { l: "Income", v: income, c: C_INCOME, p: "+" },
          { l: "Expense", v: totalExpense, c: C_EXPENSE, p: "-" },
          { l: "Total", v: netTotal, c: C_BALANCE, p: netTotal >= 0 ? "+" : "-" },
        ].map(s => (
          <div key={s.l} className="text-center">
            <p className="text-[9px] text-white/30">{s.l}</p>
            <p className="text-[11px] font-semibold tabular-nums" style={{ color: s.c }}>{s.p}₹{formatINR(s.v)}</p>
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
  const { getCatById, getSubById } = useCategoryContext();

  const isSavings = transaction.type === "savings";
  const isIncome = transaction.type === "income";
  const isExpense = transaction.type === "expense";
  const amountColor = isIncome ? C_INCOME : isSavings ? C_SAVINGS : isExpense ? C_EXPENSE : "rgba(255,255,255,0.85)";

  const cat = transaction.category_id ? getCatById(transaction.category_id) : null;
  const sub = (transaction.category_id && transaction.subcategory_id)
    ? getSubById(transaction.category_id, transaction.subcategory_id)
    : null;

  return (
    <motion.div
      onClick={() => onLongPress(transaction)}
      className="flex items-center gap-3 py-3 px-2 rounded-xl transition-colors hover:bg-white/[0.04] active:bg-white/[0.06] cursor-pointer"
      style={{ userSelect: "none" }}
    >
      {/* Column 1: Category & Subcategory */}
      <div className="w-[130px] flex-shrink-0 min-w-0 pr-2">
        <p className="text-[12px] font-semibold text-white/90 truncate flex items-center gap-1">
          <span className="text-sm flex-shrink-0">{cat?.emoji || "🛍️"}</span>
          <span className="truncate">{cat?.name || transaction.category}</span>
        </p>
        {sub ? (
          <p className="text-[10px] text-white/45 truncate flex items-center gap-1 mt-0.5">
            <span className="text-xs flex-shrink-0">{sub.emoji}</span>
            <span className="truncate">{sub.name}</span>
          </p>
        ) : (
          <p className="text-[10px] text-white/20 truncate mt-0.5">—</p>
        )}
      </div>

      {/* Column 2: Note/Name & Account */}
      <div className="flex-1 min-w-0 pr-2">
        <p className="text-[12px] text-white/90 font-medium truncate">{transaction.note || transaction.name || "—"}</p>
        <p className="text-[10px] text-white/30 truncate mt-0.5">{transaction.account}</p>
      </div>

      {/* Column 3: Amount */}
      <div className="w-[95px] flex-shrink-0 text-right">
        <p className="text-[12px] font-bold tabular-nums" style={{ color: amountColor }}>
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
        account: t.account_name || "Account",
        amount: parseFloat(t.amount),
        date: t.date?.split("T")[0] || "",
        dateLabel: new Date(t.date).toLocaleDateString(),
        category: t.category_name || "Uncategorized",
        subcategory: undefined,
        category_id: t.category_id,
        subcategory_id: t.subcategoryId || t.subcategory_id,
        bookmarked: false,
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
      return { day, income, expense: expense + savings, transactions: dayTxs };
    });
  }, [daysInMonth, getTransactionsForDay]);

  const selectedDayData = useMemo(() => {
    if (selectedDay === null) return null;
    const activeDay = Math.min(selectedDay, daysInMonth);
    return dayStats.find(d => d.day === activeDay) || null;
  }, [dayStats, selectedDay, daysInMonth]);

  return (
    <div className="pb-24 relative">
      {/* ─── Period Navigation ──────────────────────────────────────── */}
      <div className="sticky top-[57px] z-30 bg-[#0D0F14]/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex items-center justify-between px-5 py-3">
          <motion.button whileTap={{ scale: 0.85 }} 
            onClick={() => shiftPeriod(-1)}
            disabled={period === "Total"}
            className={`w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center active:bg-white/10 transition-colors ${period === "Total" ? "opacity-30 cursor-not-allowed" : ""}`}>
            <ChevronLeft className="w-4 h-4 text-white/60" />
          </motion.button>
          <p className="text-white font-semibold text-sm">{periodLabel}</p>
          <motion.button whileTap={{ scale: 0.85 }} 
            onClick={() => shiftPeriod(1)}
            disabled={period === "Total"}
            className={`w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center active:bg-white/10 transition-colors ${period === "Total" ? "opacity-30 cursor-not-allowed" : ""}`}>
            <ChevronRight className="w-4 h-4 text-white/60" />
          </motion.button>
        </div>

        {/* Period Tabs */}
        <div className="flex px-4 pb-3 gap-1">
          {(["Daily", "Calendar", "Monthly", "Total", "Note"] as PeriodTab[]).map(tab => (
            <motion.button key={tab} whileTap={{ scale: 0.93 }}
              onClick={() => handlePeriodChange(tab)}
              className="flex-1 py-2 rounded-lg text-[11px] font-medium transition-all"
              style={{
                background: period === tab ? "rgba(239,68,68,0.12)" : "transparent",
                color: period === tab ? "#EF4444" : "rgba(255,255,255,0.35)",
                borderBottom: period === tab ? "2px solid #EF4444" : "2px solid transparent",
              }}>
              {tab}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ─── Summary Strip ──────────────────────────────────────────── */}
      <div className="px-5 py-3">
        <div className="bg-[#161B26] rounded-xl p-4 border border-white/[0.05]">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Income", value: summary.income, color: C_INCOME, prefix: "+" },
              { label: "Expenses", value: summary.expense + summary.savings, color: C_EXPENSE, prefix: "-" },
              { label: "Total", value: summary.income - (summary.expense + summary.savings), color: C_BALANCE, prefix: (summary.income - (summary.expense + summary.savings)) >= 0 ? "+" : "-" },
            ].map(item => (
              <div key={item.label} className="text-center">
                <p className="text-[10px] text-white/40 mb-1 uppercase tracking-wider font-semibold">{item.label}</p>
                <p className="text-[13px] font-bold tabular-nums" style={{ color: item.color }}>
                  {item.prefix}₹ {formatINR(item.value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Transaction List ───────────────────────────────────────── */}
      <div className="px-4">
        {filtered.length === 0 && period !== "Calendar" ? (
          <div className="flex flex-col items-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1.5px dashed rgba(255,255,255,0.1)" }}>
              <FileText className="w-7 h-7 text-white/15" />
            </div>
            <p className="text-white/40 font-semibold text-sm">No transactions</p>
            <p className="text-white/20 mt-1 text-xs">Tap + to add your first transaction</p>
          </div>
        ) : period === "Daily" || period === "Note" ? (
          /* ── Daily / Note View ──────────────────────────── */
          dateGroups.map((group, gi) => {
            const isOpen = expandedGroups.has(group.dateKey);
            return (
              <div key={group.dateKey}>
                <motion.button
                  className="w-full pt-4 pb-2 cursor-pointer active:bg-white/[0.02] rounded-xl transition-colors flex items-center justify-between"
                  onClick={() => toggleGroup(group.dateKey)}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-extrabold text-white/90 leading-none">{group.dayNum}</span>
                    <div className="flex flex-col items-start justify-center text-left leading-tight">
                      <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">{group.dayName}</span>
                      <span className="text-[10px] text-white/30">{group.monthYear}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 text-[11px] font-bold tabular-nums">
                      {group.income > 0 && (
                        <span style={{ color: C_INCOME }}>+₹ {formatINR(group.income)}</span>
                      )}
                      {(group.expense + group.savings) > 0 && (
                        <span style={{ color: C_EXPENSE }}>-₹ {formatINR(group.expense + group.savings)}</span>
                      )}
                    </div>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      className="flex items-center"
                    >
                      <ChevronDown className="w-4 h-4 text-white/30" />
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
                      <div className="border-l-2 border-white/[0.04] ml-4 pl-2">
                        {group.transactions.map(tx => (
                          <TransactionRow key={tx.id} transaction={tx} onLongPress={setActionTx} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {gi < dateGroups.length - 1 && <div className="h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent my-1" />}
              </div>
            );
          })
        ) : period === "Calendar" ? (
          /* ── Calendar View ───────────────────────────────── */
          <div className="space-y-4">
            {/* Calendar Grid Container */}
            <div className="bg-[#161B26] rounded-2xl p-4 border border-white/[0.05]">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-2 mb-3">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-xs text-white/40 font-semibold uppercase tracking-wider">
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
                  const isSelected = selectedDay !== null && Math.min(selectedDay, daysInMonth) === stat.day;

                  return (
                    <button
                      key={stat.day}
                      onClick={() => setSelectedDay(stat.day)}
                      className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-[#EF4444] text-white"
                          : "bg-[#0D0F14] text-white/70 hover:bg-[#1B2130]"
                      }`}
                    >
                      <span className="text-sm font-semibold">{stat.day}</span>
                      <div className="flex gap-1 mt-1.5">
                        {hasIncome && (
                          <div className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-[#EF4444]"}`} />
                        )}
                        {hasExpense && (
                          <div className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-[#4CC9F0]"}`} />
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
                <h3 className="text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">
                  Transactions on {MONTHS[currentMonth]} {Math.min(selectedDay, daysInMonth)}, {currentYear}
                </h3>

                {!selectedDayData || selectedDayData.transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center bg-[#161B26]/30 rounded-2xl border border-white/[0.03]">
                    <p className="text-2xl mb-1">📭</p>
                    <p className="text-white/40 text-xs">No transactions on this day</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 border-l-2 border-white/[0.04] ml-2 pl-2">
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
          <div>
            {monthGroups.map((group) => {
              const aKey = `a-${group.key}`;
              const isOpen = expandedGroups.has(aKey);
              return (
                <div key={group.key} className="mb-3">
                  <motion.button
                    className="w-full flex items-center justify-between bg-[#161B26] rounded-xl px-4 py-3 border border-white/[0.04] cursor-pointer active:bg-white/[0.06] transition-colors"
                    onClick={() => toggleGroup(aKey)}
                    whileTap={{ scale: 0.99 }}
                  >
                    <p className="text-sm font-semibold text-white/80">{group.monthLabel} {group.year}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-3 text-[10px] tabular-nums font-bold">
                        <span style={{ color: C_INCOME }}>+₹ {formatINR(group.income)}</span>
                        <span style={{ color: C_EXPENSE }}>-₹ {formatINR(group.expense + group.savings)}</span>
                        <span className="font-semibold" style={{ color: C_BALANCE }}>
                          ₹ {formatINR(group.income - (group.expense + group.savings))}
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
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center z-40 bg-[#EF4444]"
        style={{
          boxShadow: "0 6px 24px rgba(239,68,68,0.4), 0 0 40px rgba(239,68,68,0.15)",
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
      </AnimatePresence>
    </div>
  );
}