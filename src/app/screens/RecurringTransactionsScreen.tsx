import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import {
  ArrowLeft, Repeat, Edit2, Pause, Play, Trash2, Filter,
  ChevronDown, Calendar, TrendingUp, AlertCircle, CheckCircle2,
  Landmark, Briefcase, CreditCard, Wallet, Coins, ArrowRightLeft, HandCoins
} from "lucide-react";
import { useCategoryContext } from "../context/CategoryContext";
import { transactionsAPI } from "../services/api";
import { toast } from "sonner";
import { PremiumFeatureGate } from "../components/PremiumFeatureGate";

// Types
interface RecurringTransaction {
  id: string;
  type: "expense" | "income" | "transfer";
  amount: number;
  categoryId: string | null;
  subcategoryId: string | null;
  accountId: string;
  toAccountId: string | null;
  note: string;
  title: string | null;
  frequency: string;
  interval?: number;
  startDate: string;
  nextDueDate: string | null;
  endType: string;
  endDate: string | null;
  endCount: number | null;
  occurrenceCount: number;
  status: "active" | "paused" | "completed" | "expired";
  createdAt: string;
}

const ACCOUNTS = [
  { id:"a1", name:"HDFC Savings",      icon: Landmark, color:"#4895EF" },
  { id:"a2", name:"SBI Salary A/C",   icon: Briefcase, color:"#22C55E" },
  { id:"a3", name:"ICICI Credit Card",icon: CreditCard, color:"#F72585" },
  { id:"a4", name:"Cash Wallet",      icon: Wallet, color:"#FFB703" },
];

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function RecurringTransactionsScreen() {
  const navigate = useNavigate();
  const { getCatById } = useCategoryContext();
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [filterType, setFilterType] = useState<"all" | "expense" | "income" | "transfer">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "paused" | "completed">("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadRecurring();
  }, []);

  const loadRecurring = async () => {
    try {
      const data = await transactionsAPI.getRecurring();
      setRecurring(data.map((t: any) => ({
        id: t.id,
        type: t.type,
        amount: parseFloat(t.amount),
        categoryId: t.category_id,
        subcategoryId: null,
        accountId: t.account_id,
        toAccountId: null,
        note: t.note || "",
        title: t.title || null,
        frequency: t.repeat_frequency || "monthly",
        interval: t.repeat_interval || 1,
        startDate: t.date,
        nextDueDate: t.next_due_date || t.date,
        endType: t.repeat_end_type || "never",
        endDate: t.repeat_end_date || null,
        endCount: t.repeat_occurrences_total || null,
        occurrenceCount: t.repeat_occurrences_current || 0,
        status: "active",
        createdAt: t.date,
      })));
    } catch (error) {
      console.error("Failed to load recurring transactions:", error);
    }
  };

  const rToFreq = (months: number) => {
    if (months === 1) return "monthly";
    if (months === 3) return "quarterly";
    if (months === 6) return "half-yearly";
    if (months === 12) return "yearly";
    return "monthly";
  };

  const handleTogglePause = (id: string) => {
    try {
      const updated = recurring.map(r =>
        r.id === id
          ? { ...r, status: r.status === "active" ? "paused" : "active" as any }
          : r
      );
      setRecurring(updated);
      toast.success("Transaction status updated");
    } catch (error) {
      console.error("Failed to toggle pause:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await transactionsAPI.delete(id);
      setRecurring(recurring.filter(r => r.id !== id));
      toast.success("Recurring transaction deleted");
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("Failed to delete");
    }
  };

  const getNextOccurrence = (rec: RecurringTransaction) => {
    const start = new Date(rec.startDate);
    const now = new Date();
    let next = new Date(start);

    // Calculate next occurrence based on frequency
    const occurrences = rec.occurrenceCount;
    switch (rec.frequency) {
      case "daily":
        next.setDate(start.getDate() + occurrences);
        break;
      case "weekly":
        next.setDate(start.getDate() + (occurrences * 7));
        break;
      case "monthly":
        next.setMonth(start.getMonth() + occurrences);
        break;
      case "quarterly":
        next.setMonth(start.getMonth() + (occurrences * 3));
        break;
      case "half-yearly":
        next.setMonth(start.getMonth() + (occurrences * 6));
        break;
      case "yearly":
        next.setFullYear(start.getFullYear() + occurrences);
        break;
    }

    // If next occurrence is in the past, calculate the actual next one
    while (next < now) {
      switch (rec.frequency) {
        case "daily": next.setDate(next.getDate() + 1); break;
        case "weekly": next.setDate(next.getDate() + 7); break;
        case "monthly": next.setMonth(next.getMonth() + 1); break;
        case "quarterly": next.setMonth(next.getMonth() + 3); break;
        case "half-yearly": next.setMonth(next.getMonth() + 6); break;
        case "yearly": next.setFullYear(next.getFullYear() + 1); break;
      }
    }

    return next;
  };

  const formatFrequency = (freq: string, interval: number = 1) => {
    if (interval > 1) return `Every ${interval} ${freq.replace('ly', '')}s`;
    if (freq === 'half-yearly') return 'Half-Yearly';
    if (freq === 'quarterly') return 'Quarterly';
    if (freq === 'days') return 'Daily';
    if (freq === 'weeks') return 'Weekly';
    if (freq === 'months') return 'Monthly';
    if (freq === 'years') return 'Yearly';
    return freq.charAt(0).toUpperCase() + freq.slice(1);
  };

  const getRepeatText = (rec: RecurringTransaction) => {
    const start = new Date(rec.startDate);
    const day = start.getDate();
    const dayOfWeek = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][start.getDay()];
    const int = rec.interval || 1;

    if (rec.frequency === 'daily' || rec.frequency === 'days') return int > 1 ? `Every ${int} days` : 'Every day';
    if (rec.frequency === 'weekly' || rec.frequency === 'weeks') return int > 1 ? `Every ${int} weeks on ${dayOfWeek}` : `Every ${dayOfWeek}`;
    if (rec.frequency === 'monthly' || rec.frequency === 'months') return int > 1 ? `Every ${int} months on ${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}` : `${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of every month`;
    if (rec.frequency === 'quarterly') return `${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} every 3 months`;
    if (rec.frequency === 'half-yearly') return `${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} every 6 months`;
    if (rec.frequency === 'yearly' || rec.frequency === 'years') return int > 1 ? `Every ${int} years on ${day} ${MONTHS_SHORT[start.getMonth()]}` : `${day} ${MONTHS_SHORT[start.getMonth()]} every year`;
    return 'Custom schedule';
  };

  const getEndText = (rec: RecurringTransaction) => {
    if (rec.endType === 'never') return 'No end date';
    if (rec.endType === 'on_date' && rec.endDate) {
      const end = new Date(rec.endDate);
      return `Until ${MONTHS_SHORT[end.getMonth()]} ${end.getFullYear()}`;
    }
    if (rec.endType === 'after_n') {
      return `${rec.occurrenceCount}/${rec.endCount} times`;
    }
    return '';
  };



  const filtered = recurring.filter(r => {
    if (filterType !== "all" && r.type !== filterType) return false;
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "#22C55E";
      case "paused": return "#FFB703";
      case "completed": return "#9CA3AF";
      case "expired": return "#EF4444";
      default: return "#9CA3AF";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "income": return "#22C55E";
      case "savings": return "#F97316";
      case "expense": return "#EF4444";
      case "transfer": return "#D4A24C";
      default: return "#D4A24C";
    }
  };

  return (
    <PremiumFeatureGate
      featureName="Recurring Transactions"
      requiredTier="Premium"
      benefits={[
        "Automate your daily, weekly, or monthly expenses",
        "Auto-generate transaction logs on schedule",
        "Detailed recurring forecasts & calendars",
        "Manage active repeat schedules in one place"
      ]}
    >
      <div className="relative pb-24" style={{background:"var(--bg-deep)", minHeight:"100vh"}}>
        {/* Top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-28 pointer-events-none"
          style={{background:"radial-gradient(ellipse at 50% 0%,rgba(212,162,76,0.12) 0%,transparent 70%)"}} />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <motion.button whileTap={{scale:0.88}} onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{background:"var(--divider)", border:"1px solid var(--divider)"}}>
              <ArrowLeft className="w-5 h-5 text-ink/70" />
            </motion.button>
            <p className="text-ink font-bold" style={{fontSize:17}}>Recurring Transactions</p>
            <motion.button whileTap={{scale:0.88}} onClick={() => setShowFilters(v => !v)}
              className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{
                background: showFilters ? "rgba(212,162,76,0.22)" : "var(--divider)",
                border: `1px solid ${showFilters ? "rgba(212,162,76,0.4)" : "var(--divider)"}`,
              }}>
              <Filter className="w-4.5 h-4.5" style={{color: showFilters ? "#D4A24C" : "color-mix(in srgb, var(--ink) 55%, transparent)"}} />
            </motion.button>
          </div>

          {/* Stats */}
          <div className="px-4 mb-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl px-3 py-3 relative overflow-hidden"
                style={{background:"linear-gradient(135deg,rgba(34,197,94,0.14),rgba(34,197,94,0.06))", border:"1px solid rgba(34,197,94,0.25)"}}>
                <p style={{fontSize:10, fontWeight:700, color:"color-mix(in srgb, var(--ink) 38%, transparent)", letterSpacing:"0.6px"}}>ACTIVE</p>
                <p className="font-bold mt-0.5" style={{fontSize:18, color:"#4ADE80"}}>
                  {recurring.filter(r => r.status === "active").length}
                </p>
              </div>
              <div className="rounded-2xl px-3 py-3 relative overflow-hidden"
                style={{background:"linear-gradient(135deg,rgba(255,183,3,0.14),rgba(255,183,3,0.06))", border:"1px solid rgba(255,183,3,0.25)"}}>
                <p style={{fontSize:10, fontWeight:700, color:"color-mix(in srgb, var(--ink) 38%, transparent)", letterSpacing:"0.6px"}}>PAUSED</p>
                <p className="font-bold mt-0.5" style={{fontSize:18, color:"#FFB703"}}>
                  {recurring.filter(r => r.status === "paused").length}
                </p>
              </div>
              <div className="rounded-2xl px-3 py-3 relative overflow-hidden"
                style={{background:"linear-gradient(135deg,rgba(212,162,76,0.14),rgba(212,162,76,0.06))", border:"1px solid rgba(212,162,76,0.25)"}}>
                <p style={{fontSize:10, fontWeight:700, color:"color-mix(in srgb, var(--ink) 38%, transparent)", letterSpacing:"0.6px"}}>TOTAL</p>
                <p className="font-bold mt-0.5" style={{fontSize:18, color:"#D4A24C"}}>
                  {recurring.length}
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{opacity:0, height:0}} animate={{opacity:1, height:"auto"}}
                exit={{opacity:0, height:0}} transition={{duration:0.2}}
                className="px-4 mb-4 overflow-hidden">
                <div className="p-4 rounded-2xl" style={{background:"color-mix(in srgb, var(--ink) 4%, transparent)", border:"1px solid var(--divider)"}}>
                  <p className="text-ink/45 mb-2" style={{fontSize:11, fontWeight:700}}>TYPE</p>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {(["all","expense","income","transfer"] as const).map(type => (
                      <motion.button key={type} whileTap={{scale:0.92}}
                        onClick={() => setFilterType(type)}
                        className="py-2 rounded-xl capitalize"
                        style={{
                          background: filterType === type ? "rgba(212,162,76,0.25)" : "color-mix(in srgb, var(--ink) 6%, transparent)",
                          border: filterType === type ? "1px solid rgba(212,162,76,0.5)" : "1px solid transparent",
                          fontSize:11, fontWeight:700,
                          color: filterType === type ? "#D4A24C" : "color-mix(in srgb, var(--ink) 45%, transparent)",
                        }}>
                        {type}
                      </motion.button>
                    ))}
                  </div>
                  <p className="text-ink/45 mb-2" style={{fontSize:11, fontWeight:700}}>STATUS</p>
                  <div className="grid grid-cols-4 gap-2">
                    {(["all","active","paused","completed"] as const).map(status => (
                      <motion.button key={status} whileTap={{scale:0.92}}
                        onClick={() => setFilterStatus(status)}
                        className="py-2 rounded-xl capitalize"
                        style={{
                          background: filterStatus === status ? "rgba(212,162,76,0.25)" : "color-mix(in srgb, var(--ink) 6%, transparent)",
                          border: filterStatus === status ? "1px solid rgba(212,162,76,0.5)" : "1px solid transparent",
                          fontSize:11, fontWeight:700,
                          color: filterStatus === status ? "#D4A24C" : "color-mix(in srgb, var(--ink) 45%, transparent)",
                        }}>
                        {status}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* List */}
          <div className="px-4">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                  style={{background:"rgba(212,162,76,0.1)", border:"1px solid rgba(212,162,76,0.2)"}}>
                  <Repeat className="w-10 h-10" style={{color: "#D4A24C"}} />
                </div>
                <p className="text-ink font-bold" style={{fontSize:16}}>No recurring transactions</p>
                <p className="text-ink/45 text-center" style={{fontSize:13}}>
                  Create your first recurring<br />transaction to automate your finances
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filtered.map((rec, i) => {
                  const cat = rec.categoryId ? getCatById(rec.categoryId) : null;
                  const acc = ACCOUNTS.find(a => a.id === rec.accountId);
                  const nextOccurrence = rec.status === "active" ? getNextOccurrence(rec) : null;
                  const statusColor = getStatusColor(rec.status);
                  const typeColor = getTypeColor(rec.type);

                  return (
                    <motion.div key={rec.id}
                      layout
                      initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}
                      exit={{opacity:0, y:-5}} transition={{delay: i * 0.03, duration:0.2}}
                      className="mb-3 rounded-2xl overflow-hidden"
                      style={{
                        background:`linear-gradient(135deg,${typeColor}08 0%,color-mix(in srgb, var(--ink) 2%, transparent) 100%)`,
                        border:`1px solid ${typeColor}20`,
                      }}>
                      <div className="p-4">
                        {/* Header */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                            style={{background:`${cat?.color || typeColor}18`, border:`1px solid ${cat?.color || typeColor}30`}}>
                            {(() => {
                              if (cat?.icon) {
                                const CatIcon = cat.icon;
                                return <CatIcon className="w-6 h-6 text-ink/80" style={{ color: cat.color }} />;
                              }
                              if (cat?.emoji) return <span className="text-xl">{cat.emoji}</span>;
                              
                              const FallbackIcon = rec.type === "income" ? HandCoins : rec.type === "transfer" ? ArrowRightLeft : Coins;
                              return <FallbackIcon className="w-6 h-6 text-ink/80" />;
                            })()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-ink font-bold truncate" style={{fontSize:14}}>
                              {rec.title || cat?.name || "Transaction"}
                            </p>
                            <p className="text-ink/55" style={{fontSize:11}}>{rec.note || "Recurring Transaction"}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold" style={{fontSize:16, color:typeColor}}>
                              ₹{rec.amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                            </p>
                            <div className="flex items-center gap-1 justify-end mt-0.5">
                              <div className="w-2 h-2 rounded-full" style={{background:statusColor}} />
                              <span style={{fontSize:10, color:statusColor, fontWeight:600, textTransform:"capitalize"}}>
                                {rec.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2">
                            <Repeat className="w-3.5 h-3.5 text-ink/35" />
                            <span className="text-ink/65" style={{fontSize:12}}>
                              {formatFrequency(rec.frequency)} • {getRepeatText(rec)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-ink/35" />
                            <span className="text-ink/65" style={{fontSize:12}}>
                              {getEndText(rec)}
                            </span>
                          </div>
                          {acc && (
                            <div className="flex items-center gap-2">
                              <acc.icon className="w-3.5 h-3.5 text-ink/65" />
                              <span className="text-ink/65" style={{fontSize:12}}>
                                From {acc.name}
                              </span>
                            </div>
                          )}
                          {nextOccurrence && (
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400" style={{fontSize:12, fontWeight:600}}>
                                Next: {MONTHS_SHORT[nextOccurrence.getMonth()]} {nextOccurrence.getDate()}, {nextOccurrence.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <motion.button whileTap={{scale:0.95}}
                            onClick={() => handleTogglePause(rec.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl"
                            style={{background:"rgba(255,183,3,0.12)", border:"1px solid rgba(255,183,3,0.25)"}}>
                            {rec.status === "active" ? (
                              <Pause className="w-4 h-4 text-[#FFB703]" />
                            ) : (
                              <Play className="w-4 h-4 text-[#FFB703]" />
                            )}
                            <span className="text-[#FFB703]" style={{fontSize:12, fontWeight:700}}>
                              {rec.status === "active" ? "Pause" : "Resume"}
                            </span>
                          </motion.button>
                          <motion.button whileTap={{scale:0.95}}
                            onClick={() => handleDelete(rec.id)}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl"
                            style={{background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.25)"}}>
                            <Trash2 className="w-4 h-4 text-rose-400" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </PremiumFeatureGate>
  );
}




