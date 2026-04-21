import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, ChevronRight, Calendar, Award,
  ArrowUpDown, Repeat, Sparkles, Plus, TrendingUp,
  Wallet, PieChart as PieIcon, Zap, BarChart2,
} from "lucide-react";
import { BalanceCard } from "../components/BalanceCard";
import { SpendingOverview } from "../components/SpendingOverview";
import { useCategoryContext } from "../context/CategoryContext";

import { authAPI, statsAPI, transactionsAPI, accountsAPI } from "../services/api";

// ─── Zero State Data ────────────────────────────────────────────────────────────
const ACCOUNTS_ZERO = [
  { id:"a1", name:"HDFC Savings",      emoji:"🏦", color:"#4895EF", balance:0 },
  { id:"a2", name:"SBI Salary A/C",   emoji:"💰", color:"#22C55E", balance:0 },
  { id:"a3", name:"ICICI Credit Card",emoji:"💳", color:"#F72585", balance:0 },
  { id:"a4", name:"Cash Wallet",      emoji:"💵", color:"#FFB703", balance:0 },
];

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ─── Empty State Reusable Component ────────────────────────────────────────────
function EmptyState({
  emoji, title, subtitle, ctaLabel, onCta, compact = false,
}: {
  emoji: string; title: string; subtitle?: string;
  ctaLabel?: string; onCta?: () => void; compact?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-6 gap-2" : "py-10 gap-3"}`}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className={`${compact ? "w-12 h-12 text-2xl" : "w-16 h-16 text-3xl"} rounded-2xl flex items-center justify-center`}
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1.5px dashed rgba(255,255,255,0.15)",
        }}>
        {emoji}
      </motion.div>
      <div>
        <p className="text-white/55 font-semibold" style={{ fontSize: compact ? 13 : 14 }}>{title}</p>
        {subtitle && (
          <p className="text-white/30 mt-0.5" style={{ fontSize: 12 }}>{subtitle}</p>
        )}
      </div>
      {ctaLabel && onCta && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onCta}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold"
          style={{
            background: "linear-gradient(135deg,#7C5CFF,#4CC9F0)",
            boxShadow: "0 4px 16px rgba(124,92,255,0.38)",
            fontSize: 12,
            color: "white",
          }}>
          <Plus className="w-3.5 h-3.5" />
          {ctaLabel}
        </motion.button>
      )}
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  label, value, accentColor, icon: Icon, isEmpty = true,
}: {
  label: string; value: string; accentColor: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  isEmpty?: boolean;
}) {
  return (
    <div className="rounded-2xl p-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg,rgba(255,255,255,0.055) 0%,rgba(255,255,255,0.02) 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}>
      <div className="absolute top-2 right-2 w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ background: `${accentColor}18` }}>
        <Icon className="w-4 h-4" style={{ color: accentColor }} />
      </div>
      <p className="text-white/40 mb-1.5" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.4px" }}>
        {label.toUpperCase()}
      </p>
      <p className="font-bold" style={{ fontSize: 24, color: isEmpty ? "rgba(255,255,255,0.22)" : accentColor }}>
        {value}
      </p>
      {isEmpty && (
        <p className="text-white/20 mt-1" style={{ fontSize: 10 }}>No data yet</p>
      )}
    </div>
  );
}

// ─── Section Header ─────────────────────────────────────────────────────────────
function SectionHeader({ title, actionLabel, onAction }: {
  title: string; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-white font-bold" style={{ fontSize: 16 }}>{title}</h3>
      {actionLabel && (
        <button onClick={onAction} style={{ fontSize: 13, fontWeight: 600, color: "#7C5CFF" }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────────
export function DashboardScreen() {
  const navigate = useNavigate();
  const [dateMode, setDateMode]     = useState<"month" | "custom">("month");
  const [monthIdx, setMonthIdx]     = useState(new Date().getMonth());
  const [year, setYear]             = useState(new Date().getFullYear());
  const [dismissedAlert, setAlert]  = useState(false);
  
  const [recurringList, setRecurringList] = useState<any[]>([]);
  const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0, savings: 0 });
  const [finlyScore, setFinlyScore] = useState(0);
  const [accountsList, setAccountsList] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { getCatById } = useCategoryContext();
  const user = authAPI.getCurrentUser();

  // Dynamic greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.name ? user.name.split(" ")[0] : "there";
    if (hour >= 5 && hour < 12) return `Good Morning, ${name}`;
    if (hour >= 12 && hour < 17) return `Good Afternoon, ${name}`;
    if (hour >= 17 && hour < 21) return `Good Evening, ${name}`;
    return `Good Night, ${name}`;
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const monthStr = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
      
      const [summaryData, scoreData, accountsData, txData, recurringData] = await Promise.all([
        statsAPI.getSummary(monthStr),
        statsAPI.getFinlyScore(monthStr),
        accountsAPI.getAll(),
        transactionsAPI.getAll({ month: monthStr }),
        transactionsAPI.getRecurring()
      ]);

      setStats({
        income: summaryData?.income || 0,
        expense: summaryData?.expense || 0,
        balance: summaryData?.balance || 0,
        savings: summaryData?.savings || 0
      });
      setFinlyScore(scoreData?.score || 0);
      setAccountsList(accountsData || []);
      setRecentTransactions((txData || []).slice(0, 3));
      setRecurringList(recurringData?.filter((r: any) => r.status === "active").slice(0, 3) || []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [monthIdx, year]);

  const prevMonth = () => {
    if (monthIdx === 0) { setMonthIdx(11); setYear(y => y - 1); }
    else setMonthIdx(i => i - 1);
  };
  const nextMonth = () => {
    if (monthIdx === 11) { setMonthIdx(0); setYear(y => y + 1); }
    else setMonthIdx(i => i + 1);
  };
  const jumpToday = () => { setMonthIdx(new Date().getMonth()); setYear(new Date().getFullYear()); };

  const isCurrentMonth = monthIdx === new Date().getMonth() && year === new Date().getFullYear();

  return (
    <div className="relative pb-36"
      style={{ background: "linear-gradient(180deg,#0B0F1A 0%,#121826 100%)", minHeight: "100vh" }}>

      {/* Top ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(124,92,255,0.11) 0%,transparent 70%)" }} />

      <div className="relative z-10 px-4 pt-5 space-y-5">

        {/* ── Greeting ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-white font-bold" style={{ fontSize: 24 }}>
              {getGreeting()}
            </h1>
            <p className="text-white/38 mt-0.5" style={{ fontSize: 13 }}>
              Welcome to Finly — let's get started
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,rgba(124,92,255,0.22),rgba(76,201,240,0.14))", border: "1px solid rgba(124,92,255,0.3)" }}>
            <Sparkles className="w-5 h-5 text-[#7C5CFF]" />
          </div>
        </div>

        {/* ── Start Here Hero Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg,#7C5CFF 0%,#4CC9F0 100%)",
            boxShadow: "0 12px 40px rgba(124,92,255,0.38)",
          }}>
          {/* Decorative blobs */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full"
            style={{ background: "rgba(255,255,255,0.10)", filter: "blur(24px)" }} />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full"
            style={{ background: "rgba(76,201,240,0.20)", filter: "blur(24px)" }} />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-white/80" />
              <span className="text-white/80 font-semibold" style={{ fontSize: 11, letterSpacing: "0.5px" }}>
                FRESH START
              </span>
            </div>
            <p className="text-white font-bold mb-1" style={{ fontSize: 22, letterSpacing: "-0.3px" }}>
              ₹ {stats.balance.toLocaleString("en-IN")}
            </p>
            <p className="text-white/70 mb-4" style={{ fontSize: 13 }}>
              Total balance · Start adding transactions
            </p>
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate("/dashboard/add-transaction")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold"
                style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(8px)", fontSize: 13, color: "white" }}>
                <Plus className="w-4 h-4" />
                Add Transaction
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate("/dashboard/accounts")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold"
                style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", fontSize: 13, color: "white/80" }}>
                <Wallet className="w-4 h-4" />
                Accounts
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* ── Date Selector ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 p-1 rounded-xl"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {(["month", "custom"] as const).map(mode => (
              <button key={mode}
                onClick={() => setDateMode(mode)}
                className="px-4 py-1.5 rounded-lg capitalize font-semibold transition-colors"
                style={{
                  fontSize: 12,
                  background: dateMode === mode ? "linear-gradient(135deg,#7C5CFF,#4CC9F0)" : "transparent",
                  color: dateMode === mode ? "white" : "rgba(255,255,255,0.35)",
                  boxShadow: dateMode === mode ? "0 2px 8px rgba(124,92,255,0.35)" : "none",
                }}>
                {mode}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={prevMonth}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}>
              <ChevronLeft className="w-4 h-4 text-white/50" />
            </button>
            <span className="font-semibold min-w-28 text-center" style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
              {MONTHS[monthIdx]} {year}
            </span>
            <button onClick={nextMonth}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}>
              <ChevronRight className="w-4 h-4 text-white/50" />
            </button>
          </div>
        </div>

        {/* Jump to Today */}
        {!isCurrentMonth && (
          <motion.button
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onClick={jumpToday}
            className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 font-semibold"
            style={{
              background: "rgba(124,92,255,0.12)",
              border: "1px solid rgba(124,92,255,0.28)",
              fontSize: 13, color: "#9D7EFF",
            }}>
            <Calendar className="w-4 h-4" />
            Jump to Today ({MONTHS[new Date().getMonth()]} {new Date().getFullYear()})
          </motion.button>
        )}

        {/* ── Summary Cards 2×2 ── */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Income"      value={`₹${stats.income.toLocaleString("en-IN")}`} accentColor="#22C55E" icon={TrendingUp} isEmpty={stats.income === 0} />
          <StatCard label="Expense"     value={`₹${stats.expense.toLocaleString("en-IN")}`} accentColor="#EF4444" icon={ArrowUpDown} isEmpty={stats.expense === 0} />
          <StatCard label="Net Balance" value={`₹${stats.balance.toLocaleString("en-IN")}`} accentColor="#7C5CFF" icon={Wallet} isEmpty={stats.balance === 0} />
          <StatCard label="Savings"     value={`₹${stats.savings.toLocaleString("en-IN")}`} accentColor="#F72585" icon={BarChart2} isEmpty={stats.savings === 0} />
        </div>

        {/* ── Finly Score ── */}
        <div className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg,rgba(124,92,255,0.10) 0%,rgba(76,201,240,0.06) 100%)",
            border: "1px solid rgba(124,92,255,0.22)",
          }}>
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle,rgba(124,92,255,0.18) 0%,transparent 70%)" }} />

          <div className="flex items-start justify-between mb-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-5 h-5 text-[#7C5CFF]" />
                <h3 className="text-white font-bold" style={{ fontSize: 16 }}>Finly Score</h3>
              </div>
              <p className="text-white/38" style={{ fontSize: 12 }}>
                {finlyScore > 0 ? "You're on the right track!" : "Start tracking to see your financial health"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold" style={{ fontSize: 38, color: finlyScore > 0 ? "white" : "rgba(255,255,255,0.22)", letterSpacing: "-1px" }}>{finlyScore}</p>
              <p className="text-white/28" style={{ fontSize: 12 }}>/100</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 rounded-full overflow-hidden relative z-10"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg,#7C5CFF,#4CC9F0)" }}
              initial={{ width: "0%" }}
              animate={{ width: `${finlyScore}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-3 relative z-10">
            <p className="text-white/25" style={{ fontSize: 10 }}>
              {finlyScore > 0 ? "Keep it up!" : "Add income & expenses to compute score"}
            </p>
            <span className="px-2 py-0.5 rounded-full" style={{ fontSize: 10, fontWeight: 700, background: "rgba(255,255,255,0.07)", color: finlyScore > 0 ? "white" : "rgba(255,255,255,0.28)" }}>
              {finlyScore}%
            </span>
          </div>
        </div>

        {/* ── Overview Card (BalanceCard) ── */}
        <div>
          <SectionHeader title="Overview" />
          <BalanceCard balance={stats.balance} income={stats.income} expense={stats.expense} />
        </div>

        {/* ── Spending Overview (pie chart) ── */}
        <SpendingOverview month={`${year}-${String(monthIdx + 1).padStart(2, "0")}`} />

        {/* ── Insights ── */}
        <div>
          <SectionHeader title="Insights" />
          <div className="rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg,rgba(255,255,255,0.045) 0%,rgba(255,255,255,0.018) 100%)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}>
            <EmptyState
              emoji="🧠"
              title="No insights yet"
              subtitle="Start adding transactions to unlock AI-powered insights"
              ctaLabel="Add Transaction"
              onCta={() => navigate("/dashboard/add-transaction")}
            />
          </div>
        </div>

        {/* ── Recent Transactions ── */}
        <div>
          <SectionHeader
            title="Recent Transactions"
            actionLabel={recentTransactions.length > 0 ? "View All" : undefined}
            onAction={recentTransactions.length > 0 ? () => navigate("/dashboard/transactions") : undefined}
          />
          {recentTransactions.length === 0 ? (
            <div className="rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(135deg,rgba(255,255,255,0.045) 0%,rgba(255,255,255,0.018) 100%)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}>
              <EmptyState
                emoji="🧾"
                title="No transactions yet"
                subtitle="Your recent income & expenses will appear here"
                ctaLabel="Add your first transaction"
                onCta={() => navigate("/dashboard/add-transaction")}
              />
            </div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((tx: any) => {
                const cat = tx.categoryId || tx.category_id ? getCatById(tx.categoryId || tx.category_id) : null;
                const typeColor = tx.type === "income" ? "#22C55E" : tx.type === "transfer" ? "#4CC9F0" : "#EF4444";
                const isExpense = tx.type === "expense";
                return (
                  <motion.div key={tx.id}
                    whileTap={{scale:0.98}}
                    onClick={() => navigate("/dashboard/transactions")}
                    className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg,${typeColor}08 0%,rgba(255,255,255,0.02) 100%)`,
                      border: `1px solid ${typeColor}20`,
                    }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{background:`${cat?.color || typeColor}18`, border:`1px solid ${cat?.color || typeColor}30`}}>
                      {cat?.emoji || (tx.type === "income" ? "💰" : tx.type === "transfer" ? "🔄" : "💸")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate" style={{fontSize:13}}>
                        {tx.note || cat?.name || "Transaction"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span style={{fontSize:11, color:"rgba(255,255,255,0.55)"}}>
                          {tx.date ? new Date(tx.date).toLocaleDateString("en-IN", {month:"short", day:"numeric"}) : "Unknown"}
                        </span>
                      </div>
                    </div>
                    <p className="font-bold flex-shrink-0" style={{fontSize:14, color:typeColor}}>
                      {isExpense ? "-" : "+"}₹{parseFloat(tx.amount).toLocaleString("en-IN")}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Upcoming Recurring ── */}
        <div>
          <SectionHeader
            title="Upcoming Recurring"
            actionLabel={recurringList.length > 0 ? "View All" : undefined}
            onAction={recurringList.length > 0 ? () => navigate("/dashboard/recurring") : undefined}
          />
          {recurringList.length === 0 ? (
            <div className="rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(135deg,rgba(255,255,255,0.045) 0%,rgba(255,255,255,0.018) 100%)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}>
              <EmptyState
                emoji="🔁"
                title="No recurring transactions set"
                subtitle="Set up recurring entries when adding a transaction"
                compact
              />
            </div>
          ) : (
            <div className="space-y-2">
              {recurringList.map((rec: any) => {
                const cat = rec.categoryId ? getCatById(rec.categoryId) : null;
                const typeColor = rec.type === "income" ? "#22C55E" : rec.type === "transfer" ? "#4CC9F0" : "#EF4444";
                const start = new Date(rec.startDate);
                const day = start.getDate();
                const freq = rec.frequency === "monthly" ? `${day}${day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"}` :
                             rec.frequency === "weekly" ? ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][start.getDay()] :
                             rec.frequency;

                return (
                  <motion.div key={rec.id}
                    whileTap={{scale:0.98}}
                    onClick={() => navigate("/dashboard/recurring")}
                    className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg,${typeColor}08 0%,rgba(255,255,255,0.02) 100%)`,
                      border: `1px solid ${typeColor}20`,
                    }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{background:`${cat?.color || typeColor}18`, border:`1px solid ${cat?.color || typeColor}30`}}>
                      {cat?.emoji || (rec.type === "income" ? "💰" : rec.type === "transfer" ? "🔄" : "💸")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate" style={{fontSize:13}}>
                        {cat?.name || rec.note || "Transaction"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Repeat className="w-3 h-3" style={{color:typeColor}} />
                        <span style={{fontSize:11, color:"rgba(255,255,255,0.55)"}}>
                          {freq} • {rec.frequency}
                        </span>
                      </div>
                    </div>
                    <p className="font-bold flex-shrink-0" style={{fontSize:14, color:typeColor}}>
                      ₹{rec.amount.toLocaleString("en-IN")}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Accounts Summary ── */}
        <div>
          <SectionHeader
            title="Accounts"
            actionLabel="View All"
            onAction={() => navigate("/dashboard/accounts")}
          />
          <div className="rounded-2xl p-5"
            style={{
              background: "linear-gradient(135deg,rgba(255,255,255,0.055) 0%,rgba(255,255,255,0.02) 100%)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}>
            {/* Net worth row */}
            <div className="flex items-center justify-between mb-4 pb-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div>
                <p className="text-white/40" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.4px" }}>NET WORTH</p>
                <p className="font-bold mt-0.5" style={{ fontSize: 26, color: stats.balance > 0 ? "white" : "rgba(255,255,255,0.22)" }}>
                  ₹{stats.balance.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Wallet className="w-3.5 h-3.5 text-white/30" />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", fontWeight: 600 }}>
                  {accountsList.length > 0 ? `${accountsList.length} Accounts` : "No accounts"}
                </span>
              </div>
            </div>

            {/* Individual accounts */}
            <div className="space-y-3">
              {(accountsList.length > 0 ? accountsList.slice(0, 4) : ACCOUNTS_ZERO).map(acc => (
                <div key={acc.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: `${acc.color || '#4895EF'}18`, border: `1px solid ${acc.color || '#4895EF'}28` }}>
                    {acc.icon || acc.emoji || "🏦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/60 font-semibold truncate" style={{ fontSize: 13 }}>{acc.name}</p>
                  </div>
                  <p className="font-bold" style={{ fontSize: 13, color: acc.balance > 0 ? "white" : "rgba(255,255,255,0.25)" }}>
                    ₹{parseFloat(acc.balance || 0).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>

            {/* Add account CTA */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/dashboard/accounts")}
              className="w-full mt-4 py-3 rounded-2xl flex items-center justify-center gap-2 font-semibold"
              style={{
                background: "rgba(124,92,255,0.10)",
                border: "1px dashed rgba(124,92,255,0.30)",
                fontSize: 13, color: "#9D7EFF",
              }}>
              <Zap className="w-4 h-4" />
              Connect your accounts
            </motion.button>
          </div>
        </div>

        {/* ── Motivational Footer CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-3xl p-5 text-center relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg,rgba(124,92,255,0.12) 0%,rgba(76,201,240,0.08) 100%)",
            border: "1px solid rgba(124,92,255,0.22)",
          }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(circle at 50% 0%,rgba(124,92,255,0.10) 0%,transparent 60%)" }} />
          <div className="relative z-10">
            <p className="text-3xl mb-2">🚀</p>
            <p className="text-white font-bold mb-1" style={{ fontSize: 16 }}>
              Your financial journey starts here
            </p>
            <p className="text-white/40 mb-4" style={{ fontSize: 13 }}>
              Add your first income or expense to see<br />your personalized financial overview
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/dashboard/add-transaction")}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold mx-auto"
              style={{
                background: "linear-gradient(135deg,#7C5CFF,#4CC9F0)",
                boxShadow: "0 6px 20px rgba(124,92,255,0.42)",
                fontSize: 14, color: "white",
              }}>
              <Plus className="w-4 h-4" />
              Start Adding Transactions
            </motion.button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}