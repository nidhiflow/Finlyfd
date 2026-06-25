import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, ChevronRight, Calendar, Award,
  ArrowUpDown, Repeat, Sparkles, Plus, TrendingUp,
  Wallet, PieChart as PieIcon, Zap, BarChart2, HelpCircle,
  Lightbulb, Target, AlertTriangle, Rocket, Brain, Receipt,
  Landmark, ArrowDownCircle, ArrowUpCircle, RefreshCw,
} from "lucide-react";
import { BalanceCard } from "../components/BalanceCard";
import { SpendingOverview } from "../components/SpendingOverview";
import { DateRangePicker } from "../components/DateRangePicker";
import { useCategoryContext } from "../context/CategoryContext";

import { authAPI, statsAPI, transactionsAPI, accountsAPI } from "../services/api";

// ─── Zero State Data ────────────────────────────────────────────────────────────
// Accounts are now strictly fetched from the user's connected DB accounts.

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ─── Empty State Reusable Component ────────────────────────────────────────────
function EmptyState({
  icon: Icon, title, subtitle, ctaLabel, onCta, compact = false,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string; subtitle?: string;
  ctaLabel?: string; onCta?: () => void; compact?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-6 gap-2" : "py-10 gap-3"}`}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className={`${compact ? "w-12 h-12" : "w-16 h-16"} rounded-[14px] flex items-center justify-center`}
        style={{
          background: "var(--surface-raised)",
          border: "1.5px dashed var(--divider)",
          color: "var(--ink-faint)",
        }}>
        <Icon className={compact ? "w-5 h-5" : "w-6 h-6"} strokeWidth={1.75} />
      </motion.div>
      <div>
        <p className="font-semibold" style={{ fontSize: compact ? 13 : 14, color: "var(--ink-muted)" }}>{title}</p>
        {subtitle && (
          <p className="mt-0.5" style={{ fontSize: 12, color: "var(--ink-faint)" }}>{subtitle}</p>
        )}
      </div>
      {ctaLabel && onCta && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onCta}
          className="flex items-center gap-1.5 px-4 py-2 rounded-[14px] font-semibold"
          style={{
            background: "var(--gold)",
            fontSize: 12,
            color: "#241B0A",
          }}>
          <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
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
        background: "linear-gradient(135deg,color-mix(in srgb, var(--ink) 6%, transparent) 0%,color-mix(in srgb, var(--ink) 2%, transparent) 100%)",
        border: "1px solid var(--divider)",
      }}>
      <div className="absolute top-2 right-2 w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ background: `${accentColor}18` }}>
        <Icon className="w-4 h-4" style={{ color: accentColor }} />
      </div>
      <p className="text-ink/40 mb-1.5" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.4px" }}>
        {label.toUpperCase()}
      </p>
      <p className="font-bold" style={{ fontSize: 24, color: isEmpty ? "var(--divider)" : accentColor }}>
        {value}
      </p>
      {isEmpty && (
        <p className="text-ink/20 mt-1" style={{ fontSize: 10 }}>No data yet</p>
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
      <h3 className="font-bold" style={{ fontSize: 16, color: "var(--ink)" }}>{title}</h3>
      {actionLabel && (
        <button onClick={onAction} style={{ fontSize: 13, fontWeight: 600, color: "var(--gold)" }}>
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
  const [finlyLabel, setFinlyLabel] = useState('');
  const [accountsList, setAccountsList] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showScoreInfo, setShowScoreInfo] = useState(false);

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
      setFinlyLabel(scoreData?.label || '');
      setAccountsList(accountsData || []);
      setRecentTransactions((txData || []).slice(0, 3));
      setRecurringList((recurringData || []).slice(0, 3).map((t: any) => ({
        ...t,
        categoryId: t.category_id,
        startDate: t.date,
        frequency: t.repeat_frequency || "monthly",
        status: "active"
      })));
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
      style={{ background: "var(--bg-deep)", minHeight: "100vh" }}>

      {/* Top ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(212,162,76,0.11) 0%,transparent 70%)" }} />

      <div className="relative z-10 px-4 pt-5 space-y-5">

        {/* ── Greeting ── */}
        <div className="flex items-start justify-between">
          <div>
            <p className="font-inter text-[12px] uppercase tracking-[0.08em] text-[var(--ink-faint)] mb-1">
              Finly · personal finance
            </p>
            <h1 className="font-fraunces text-[var(--ink)] font-medium" style={{ fontSize: 26 }}>
              {getGreeting()}
            </h1>
          </div>
          <div className="flex gap-2.5 mt-0.5">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/dashboard/ai-agent")}
              className="w-[34px] h-[34px] rounded-full flex items-center justify-center cursor-pointer text-[var(--ink-muted)] bg-[var(--surface)]"
            >
              <Sparkles className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* ── Start Here Hero Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-[18px] p-6 relative overflow-hidden"
          style={{ background: "var(--surface)" }}>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 text-[12px] text-[var(--ink-muted)] bg-[var(--surface-raised)] px-3 py-1.5 rounded-full mb-[18px]">
              <ChevronLeft className="w-3 h-3 cursor-pointer" onClick={prevMonth} />
              <span className="font-medium">{MONTHS[monthIdx]} {year}</span>
              <ChevronRight className="w-3 h-3 cursor-pointer" onClick={nextMonth} />
            </div>
            
            <p className="text-[13px] text-[var(--ink-muted)] mb-1.5">Total balance</p>
            <p className="font-fraunces text-[var(--ink)] font-medium text-[42px] mb-5 tracking-[-0.01em]" style={{ fontVariantNumeric: "tabular-nums", lineHeight: "1.1" }}>
              <sup className="text-[22px] font-normal text-[var(--ink-muted)] relative" style={{ top: "-0.5em" }}>₹</sup>{stats.balance.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>

            <div className="grid grid-cols-[1fr_1px_1fr] gap-[18px]">
              <div className="flex flex-col">
                <p className="flex items-center gap-1.5 text-[12px] text-[var(--ink-muted)] mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--mint)]"></span>Income
                </p>
                <p className="text-[18px] font-semibold text-[var(--ink)] m-0" style={{ fontVariantNumeric: "tabular-nums" }}>
                  ₹{stats.income.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </p>
              </div>
              
              <div className="bg-[var(--divider)]"></div>
              
              <div className="flex flex-col">
                <p className="flex items-center gap-1.5 text-[12px] text-[var(--ink-muted)] mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--coral)]"></span>Expense
                </p>
                <p className="text-[18px] font-semibold text-[var(--ink)] m-0" style={{ fontVariantNumeric: "tabular-nums" }}>
                  ₹{stats.expense.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={() => navigate("/dashboard/add-transaction")} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[14px] text-[14px] font-medium font-inter border-none bg-[var(--gold)] text-[#241B0A]">
            + Add transaction
          </button>
          <button onClick={() => navigate("/dashboard/accounts")} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[14px] text-[14px] font-medium font-inter border-none bg-[var(--surface)] text-[var(--ink)]">
            Accounts
          </button>
        </div>

        {/* ── Date Selector ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-[var(--surface)] border border-[var(--divider)]">
            {(["month", "custom"] as const).map(mode => (
              <button key={mode}
                onClick={() => {
                  setDateMode(mode);
                  if (mode === "custom") setShowDatePicker(true);
                }}
                className="px-4 py-1.5 rounded-lg capitalize font-semibold transition-colors"
                style={{
                  fontSize: 12,
                  background: dateMode === mode ? "var(--gold)" : "transparent",
                  color: dateMode === mode ? "#241B0A" : "var(--ink-muted)",
                }}>
                {mode}
              </button>
            ))}
          </div>

          {dateMode === "month" ? (
          <div className="flex items-center gap-2">
            <button onClick={prevMonth}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "color-mix(in srgb, var(--ink) 6%, transparent)", border: "1px solid var(--divider)" }}>
              <ChevronLeft className="w-4 h-4 text-ink/50" />
            </button>
            <span className="font-semibold min-w-28 text-center" style={{ fontSize: 13, color: "color-mix(in srgb, var(--ink) 75%, transparent)" }}>
              {MONTHS[monthIdx]} {year}
            </span>
            <button onClick={nextMonth}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "color-mix(in srgb, var(--ink) 6%, transparent)", border: "1px solid var(--divider)" }}>
              <ChevronRight className="w-4 h-4 text-ink/50" />
            </button>
          </div>
          ) : (
          <button onClick={() => setShowDatePicker(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl font-semibold"
            style={{ background: "var(--surface)", border: "1px solid var(--gold)", fontSize: 12, color: "var(--gold)" }}>
            {customStart && customEnd
              ? `${customStart.getDate()}/${customStart.getMonth()+1} — ${customEnd.getDate()}/${customEnd.getMonth()+1}`
              : "Pick dates"}
          </button>
          )}
        </div>

        {/* Jump to Today */}
        {!isCurrentMonth && (
          <motion.button
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onClick={jumpToday}
            className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 font-semibold mt-3"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--gold)",
              fontSize: 13, color: "var(--gold)",
            }}>
            <Calendar className="w-4 h-4" />
            Jump to Today ({MONTHS[new Date().getMonth()]} {new Date().getFullYear()})
          </motion.button>
        )}

        {/* Stat Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[var(--surface)] rounded-[14px] px-4 py-3.5">
            <p className="text-[12px] text-[var(--ink-muted)] mb-1.5">Finly score</p>
            <p className="text-[19px] font-semibold text-[var(--ink)] m-0 tabular-nums">
              {finlyScore} <span className="text-[11px] font-medium text-[var(--ink-muted)]">· {finlyScore >= 80 ? "Excellent" : "Good"}</span>
            </p>
          </div>
          <div className="bg-[var(--surface)] rounded-[14px] px-4 py-3.5">
            <p className="text-[12px] text-[var(--ink-muted)] mb-1.5">Saved this month</p>
            <p className="text-[19px] font-semibold m-0 tabular-nums" style={{ color: "var(--savings)" }}>
              ₹{stats.savings.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>



        {/* ── Spending Overview (pie chart) ── */}
        <SpendingOverview month={`${year}-${String(monthIdx + 1).padStart(2, "0")}`} />

        {/* ── Insights ── */}
        {(stats.income > 0 || stats.expense > 0) ? (
        <div>
          <SectionHeader title="Insights" />
          <div className="space-y-3">
            {stats.expense > 0 && stats.income > 0 && (
              <div className="rounded-[18px] p-4" style={{ background: "var(--surface)", border: "1px solid var(--divider)" }}>
                <div className="flex items-center gap-3">
                  <Lightbulb className="w-5 h-5 flex-shrink-0" strokeWidth={1.75} style={{ color: "var(--gold)" }} />
                  <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>You spent <span className="font-semibold tabular-nums" style={{ color: "var(--expense)" }}>{Math.round((stats.expense / stats.income) * 100)}%</span> of your income this month</p>
                </div>
              </div>
            )}
            {stats.savings > 0 && (
              <div className="rounded-[18px] p-4" style={{ background: "rgba(212,162,76,0.08)", border: "1px solid rgba(212,162,76,0.18)" }}>
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 flex-shrink-0" strokeWidth={1.75} style={{ color: "var(--savings)" }} />
                  <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>Great! You saved <span className="font-semibold tabular-nums" style={{ color: "var(--savings)" }}>₹{stats.savings.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span> this month</p>
                </div>
              </div>
            )}
            {stats.expense > stats.income && stats.income > 0 && (
              <div className="rounded-[18px] p-4" style={{ background: "rgba(226,114,91,0.08)", border: "1px solid rgba(226,114,91,0.18)" }}>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" strokeWidth={1.75} style={{ color: "var(--expense)" }} />
                  <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>You're spending more than you earn. Consider reviewing your expenses.</p>
                </div>
              </div>
            )}
          </div>
        </div>
        ) : (
        <div>
          <SectionHeader title="Insights" />
          <div className="rounded-[18px] overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--divider)" }}>
            <EmptyState
              icon={Brain}
              title="No insights yet"
              subtitle="Start adding transactions to unlock AI-powered insights"
              ctaLabel="Add Transaction"
              onCta={() => navigate("/dashboard/add-transaction")}
            />
          </div>
        </div>
        )}

        {/* ── Recent Transactions ── */}
        <div className="mb-2 mt-4">
          <div className="flex justify-between items-baseline mb-3.5">
            <p className="text-[15px] font-semibold text-[var(--ink)] m-0">Recent transactions</p>
            <span className="text-[12px] text-[var(--gold)] font-medium cursor-pointer" onClick={() => navigate("/dashboard/transactions")}>View all</span>
          </div>
          
          <div className="bg-[var(--surface)] rounded-[18px] px-4 py-1">
          {recentTransactions.length === 0 ? (
            <div className="py-4">
              <EmptyState
                icon={Receipt}
                title="No transactions yet"
                subtitle="Your recent income & expenses will appear here"
                compact
              />
            </div>
          ) : (
            recentTransactions.map((tx: any) => {
              const cat = tx.categoryId || tx.category_id ? getCatById(tx.categoryId || tx.category_id) : null;
              const typeColor = tx.type === "income" ? "var(--income)" : tx.type === "transfer" ? "var(--ink-muted)" : tx.type === "savings" ? "var(--savings)" : "var(--expense)";
              const TypeIcon = tx.type === "income" ? ArrowDownCircle : tx.type === "transfer" ? RefreshCw : ArrowUpCircle;
              const isExpense = tx.type === "expense";
              return (
                <div key={tx.id} className="flex items-center gap-3 py-3 border-b border-[var(--divider)] last:border-b-0 cursor-pointer" onClick={() => navigate("/dashboard/transactions")}>
                  <div className="w-9 h-9 rounded-full bg-[var(--surface-raised)] flex items-center justify-center flex-shrink-0">
                    {cat?.icon ? (
                      <cat.icon className="w-4 h-4" strokeWidth={1.75} style={{ color: "var(--ink-muted)" }} />
                    ) : cat?.emoji ? (
                      <span className="text-[14px] text-[var(--ink-muted)]">{cat.emoji}</span>
                    ) : (
                      <TypeIcon className="w-4 h-4" strokeWidth={1.75} style={{ color: typeColor }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] m-0 text-[var(--ink)] truncate">{tx.note || cat?.name || "Transaction"}</p>
                    <p className="text-[11.5px] mt-0.5 mb-0 text-[var(--ink-faint)]">{tx.date ? new Date(tx.date).toLocaleDateString("en-IN", {month:"short", day:"numeric"}) : "Unknown"}</p>
                  </div>
                  <span className="text-[13.5px] font-medium tabular-nums" style={{ color: typeColor }}>
                    {isExpense ? "-" : tx.type === "income" ? "+" : ""}₹{parseFloat(tx.amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </span>
                </div>
              );
            })
          )}
          </div>
        </div>

        {/* ── Upcoming Recurring ── */}
        <div>
          <SectionHeader
            title="Upcoming Recurring"
            actionLabel={recurringList.length > 0 ? "View All" : undefined}
            onAction={recurringList.length > 0 ? () => navigate("/dashboard/recurring") : undefined}
          />
          {recurringList.length === 0 ? (
            <div className="rounded-[18px] overflow-hidden"
              style={{ background: "var(--surface)", border: "1px solid var(--divider)" }}>
              <EmptyState
                icon={Repeat}
                title="No recurring transactions set"
                subtitle="Set up recurring entries when adding a transaction"
                compact
              />
            </div>
          ) : (
            <div className="space-y-2">
              {recurringList.map((rec: any) => {
                const cat = rec.categoryId ? getCatById(rec.categoryId) : null;
                const typeColor = rec.type === "income" ? "var(--income)" : rec.type === "transfer" ? "var(--ink-muted)" : "var(--expense)";
                const chipBg = rec.type === "income" ? "var(--income-chip)" : rec.type === "transfer" ? "var(--neutral-chip)" : "var(--expense-chip)";
                const TypeIcon = rec.type === "income" ? ArrowDownCircle : rec.type === "transfer" ? RefreshCw : ArrowUpCircle;
                const start = new Date(rec.startDate);
                const day = start.getDate();
                const freq = rec.frequency === "monthly" ? `${day}${day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"}` :
                             rec.frequency === "weekly" ? ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][start.getDay()] :
                             rec.frequency;

                return (
                  <motion.div key={rec.id}
                    whileTap={{scale:0.98}}
                    onClick={() => navigate("/dashboard/recurring")}
                    className="flex items-center gap-3 p-3 rounded-[14px] cursor-pointer"
                    style={{ background: "var(--surface)", border: "1px solid var(--divider)" }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: cat ? "var(--neutral-chip)" : chipBg }}>
                      {cat?.icon ? (
                        <cat.icon className="w-4 h-4 text-[var(--ink)]" strokeWidth={1.75} />
                      ) : cat?.emoji ? (
                        <span>{cat.emoji}</span>
                      ) : (
                        <TypeIcon className="w-4.5 h-4.5" strokeWidth={1.75} style={{ color: cat ? "var(--neutral-icon)" : typeColor }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate" style={{fontSize:13, color: "var(--ink)"}}>
                        {cat?.name || rec.note || "Transaction"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Repeat className="w-3 h-3" strokeWidth={1.75} style={{color:"var(--ink-faint)"}} />
                        <span style={{fontSize:11, color:"var(--ink-faint)"}}>
                          {freq} • {rec.frequency}
                        </span>
                      </div>
                    </div>
                    <p className="font-bold flex-shrink-0 tabular-nums" style={{fontSize:14, color:typeColor}}>
                      ₹{rec.amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
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
          <div className="rounded-[18px] p-5"
            style={{ background: "var(--surface)", border: "1px solid var(--divider)" }}>
            {/* Accounts count row */}
            <div className="flex items-center justify-between mb-4 pb-4"
              style={{ borderBottom: "1px solid var(--divider)" }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.4px", color: "var(--ink-faint)" }}>YOUR ACCOUNTS</p>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[14px]"
                style={{ background: "var(--surface-raised)" }}>
                <Wallet className="w-3.5 h-3.5" strokeWidth={1.75} style={{ color: "var(--ink-faint)" }} />
                <span style={{ fontSize: 11, color: "var(--ink-faint)", fontWeight: 600 }}>
                  {accountsList.length > 0 ? `${accountsList.length} Accounts` : "No accounts"}
                </span>
              </div>
            </div>

            {/* Individual accounts */}
            <div className="space-y-3">
              {accountsList.length === 0 ? (
                <div className="py-6">
                  <EmptyState
                    icon={Landmark}
                    title="No accounts yet"
                    subtitle="Connect your accounts to start tracking balances"
                    compact
                  />
                </div>
              ) : (
                accountsList.slice(0, 4).map(acc => (
                  <div key={acc.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[14px] flex items-center justify-center text-base flex-shrink-0"
                      style={{ background: "var(--neutral-chip)" }}>
                      {acc.icon || acc.emoji || <Landmark className="w-4 h-4" strokeWidth={1.75} style={{ color: "var(--neutral-icon)" }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate" style={{ fontSize: 13, color: "var(--ink-muted)" }}>{acc.name}</p>
                    </div>
                    <p className="font-bold tabular-nums" style={{ fontSize: 13, color: acc.balance > 0 ? "var(--ink)" : "var(--ink-faint)" }}>
                      ₹{parseFloat(acc.balance || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Add account CTA */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/dashboard/accounts")}
              className="w-full mt-4 py-3 rounded-[14px] flex items-center justify-center gap-2 font-semibold"
              style={{
                background: "rgba(212,162,76,0.10)",
                border: "1px dashed rgba(212,162,76,0.30)",
                fontSize: 13, color: "var(--gold)",
              }}>
              <Zap className="w-4 h-4" strokeWidth={1.75} />
              Connect your accounts
            </motion.button>
          </div>
        </div>

        {/* ── Motivational Footer CTA — only for new users ── */}
        {recentTransactions.length === 0 && stats.income === 0 && stats.expense === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-[18px] p-5 text-center relative overflow-hidden"
          style={{
            background: "rgba(212,162,76,0.10)",
            border: "1px solid rgba(212,162,76,0.22)",
          }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(circle at 50% 0%,rgba(212,162,76,0.10) 0%,transparent 60%)" }} />
          <div className="relative z-10">
            <Rocket className="w-7 h-7 mx-auto mb-2" strokeWidth={1.75} style={{ color: "var(--gold)" }} />
            <p className="font-bold mb-1" style={{ fontSize: 16, color: "var(--ink)" }}>
              Your financial journey starts here
            </p>
            <p className="mb-4" style={{ fontSize: 13, color: "var(--ink-faint)" }}>
              Add your first income or expense to see<br />your personalized financial overview
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/dashboard/add-transaction")}
              className="flex items-center gap-2 px-6 py-3 rounded-[14px] font-bold mx-auto"
              style={{
                background: "var(--gold)",
                fontSize: 14, color: "#241B0A",
              }}>
              <Plus className="w-4 h-4" strokeWidth={1.75} />
              Start Adding Transactions
            </motion.button>
          </div>
        </motion.div>
        )}

      </div>

      {/* Custom Date Range Picker */}
      <AnimatePresence>
        {showDatePicker && (
          <DateRangePicker
            startDate={customStart}
            endDate={customEnd}
            onSelect={(s, e) => {
              setCustomStart(s);
              setCustomEnd(e);
              // Reload data with custom date range
              loadDashboardData();
            }}
            onClose={() => setShowDatePicker(false)}
          />
        )}
      </AnimatePresence>

      {/* About Finly Score Info Modal */}
      <AnimatePresence>
        {showScoreInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(14px)" }}
            onClick={() => setShowScoreInfo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl p-6 relative overflow-hidden text-left"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--divider)",
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
              }}
            >
              {/* Top glow */}
              <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(212,162,76,0.15) 0%, transparent 70%)" }} />

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#D4A24C]/15 border border-[#D4A24C]/25">
                  <Award className="w-5 h-5 text-[#D4A24C]" />
                </div>
                <h3 className="text-ink font-bold text-lg">About Finly Score</h3>
              </div>

              <p className="text-ink/70 text-sm leading-relaxed mb-5">
                The Finly Score measures your monthly financial health and budget discipline. It is computed dynamically using three key factors:
              </p>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs text-emerald-400 font-bold flex-shrink-0 mt-0.5">50</div>
                  <div>
                    <h4 className="text-ink font-semibold text-xs">Savings Rate (Up to 50 pts)</h4>
                    <p className="text-ink/40 text-[11px] mt-0.5">Calculated as the percentage of your monthly income you save (Income - Expenses).</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xs text-blue-400 font-bold flex-shrink-0 mt-0.5">30</div>
                  <div>
                    <h4 className="text-ink font-semibold text-xs">Expense Control (Up to 30 pts)</h4>
                    <p className="text-ink/40 text-[11px] mt-0.5">Points awarded for keeping total spending under 50%, 70%, or 85% of your earnings.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xs text-purple-400 font-bold flex-shrink-0 mt-0.5">20</div>
                  <div>
                    <h4 className="text-ink font-semibold text-xs">Tracking Activity (Up to 20 pts)</h4>
                    <p className="text-ink/40 text-[11px] mt-0.5">Earned by consistently logging transactions in the ledger.</p>
                  </div>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowScoreInfo(false)}
                className="w-full py-3 bg-gradient-to-r from-[#D4A24C] to-[#D4A24C] rounded-xl text-ink font-semibold text-sm shadow-md shadow-[#D4A24C]/25"
              >
                Got it
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


