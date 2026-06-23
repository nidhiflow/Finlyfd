import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield, Users, User, ArrowLeft, RefreshCw, Search, Award, Check,
  BarChart3, TrendingUp, Zap, Target, Brain, Repeat2, CreditCard,
  Wallet, Activity, Eye, ChevronRight, Clock
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { adminAPI } from "../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserRow {
  id: string;
  name: string;
  email: string;
  subscription_tier: "Free" | "Pro" | "Premium";
  created_at: string;
  last_seen?: string;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  subscriptions: { Free: number; Pro: number; Premium: number };
  userList: UserRow[];
}

interface Analytics {
  overview: {
    totalUsers: number;
    dau: number;
    wau: number;
    mau: number;
    totalPageViews: number;
    totalTransactions: number;
    totalTransactionVolume: number;
    avgTransactionsPerUser: number;
  };
  growth: { date: string; signups: number }[];
  pageStats: {
    allTime: { page: string; visits: number }[];
    weekly: { page: string; visits: number }[];
    uniqueUsers: { page: string; unique_users: number }[];
  };
  featureTurnout: {
    [key: string]: { users: number; rate: number };
  };
  subscriptions: { Free: number; Pro: number; Premium: number };
  retention: { retained: number; eligible: number; rate: number };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const PAGE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  transactions: "Transactions",
  reports: "Reports",
  accounts: "Accounts",
  budget: "Budget",
  goals: "Goals",
  calendar: "Calendar",
  recurring: "Recurring",
  categories: "Categories",
  settings: "Settings",
  "ai-agent": "AI Agent",
  subscriptions: "Subscriptions",
  "add-transaction": "Add Transaction",
  "edit-transaction": "Edit Transaction",
  admin: "Admin",
};

const PAGE_COLORS: Record<string, string> = {
  dashboard: "#6FBE9B",
  transactions: "#D4A24C",
  reports: "#7C9EF8",
  accounts: "#E07C8A",
  budget: "#A78BFA",
  goals: "#34D399",
  calendar: "#FB923C",
  recurring: "#38BDF8",
  categories: "#F472B6",
  settings: "#94A3B8",
  "ai-agent": "#6366F1",
  subscriptions: "#D4A24C",
  "add-transaction": "#6FBE9B",
};

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

function fmtCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function KPICard({ icon: Icon, label, value, sub, color, delay }: {
  icon: any; label: string; value: string; sub?: string; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--divider)] flex flex-col gap-2"
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/40">{label}</p>
      <p className="text-2xl font-bold text-ink leading-none">{value}</p>
      {sub && <p className="text-[10px] text-ink/40">{sub}</p>}
    </motion.div>
  );
}

function SectionHeader({ icon: Icon, title, color }: { icon: any; title: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <h3 className="text-sm font-bold text-ink">{title}</h3>
    </div>
  );
}

function GrowthChart({ data }: { data: { date: string; signups: number }[] }) {
  const max = Math.max(...data.map(d => d.signups), 1);
  const last7 = data.slice(-7);
  const total = data.reduce((s, d) => s + d.signups, 0);

  return (
    <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--divider)]">
      <SectionHeader icon={TrendingUp} title="User Growth" color="#6FBE9B" />
      <div className="flex items-center gap-3 mb-4">
        <div>
          <p className="text-2xl font-bold text-[#6FBE9B]">{total}</p>
          <p className="text-[10px] text-ink/40">New users · last 30 days</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm font-bold text-ink">{last7.reduce((s, d) => s + d.signups, 0)}</p>
          <p className="text-[10px] text-ink/40">Last 7 days</p>
        </div>
      </div>
      {/* Bar chart */}
      <div className="flex items-end gap-[3px] h-20">
        {data.map((d, i) => {
          const height = max > 0 ? Math.max((d.signups / max) * 100, d.signups > 0 ? 8 : 2) : 2;
          const isRecent = i >= data.length - 7;
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center justify-end group relative">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: 0.02 * i, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className="w-full rounded-sm transition-opacity"
                style={{
                  background: isRecent
                    ? "linear-gradient(to top, #6FBE9B, #6FBE9B80)"
                    : "var(--divider)",
                  minHeight: 2,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        <p className="text-[9px] text-ink/25">{data[0]?.date.slice(5)}</p>
        <p className="text-[9px] text-ink/25">{data[data.length - 1]?.date.slice(5)}</p>
      </div>
    </div>
  );
}

function PagePopularity({ pageStats, totalViews }: {
  pageStats: { page: string; visits: number }[];
  totalViews: number;
}) {
  const [view, setView] = useState<"allTime" | "weekly">("allTime");
  const topPages = pageStats.slice(0, 8);
  const maxVisits = Math.max(...topPages.map(p => p.visits), 1);

  return (
    <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--divider)]">
      <SectionHeader icon={Eye} title="Most Visited Pages" color="#7C9EF8" />

      <div className="flex items-center gap-2 mb-4">
        <p className="text-xl font-bold text-[#7C9EF8]">{fmt(totalViews)}</p>
        <p className="text-[10px] text-ink/40 mt-1">total page views</p>
        <div className="ml-auto flex bg-[var(--bg-deep)] rounded-lg p-1 gap-1">
          {(["allTime", "weekly"] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${
                view === v ? "bg-[#7C9EF8] text-white" : "text-ink/40"
              }`}
            >
              {v === "allTime" ? "All time" : "7 days"}
            </button>
          ))}
        </div>
      </div>

      {topPages.length === 0 ? (
        <div className="py-6 text-center">
          <Eye className="w-8 h-8 text-ink/10 mx-auto mb-2" />
          <p className="text-xs text-ink/30">No page visits recorded yet.</p>
          <p className="text-[10px] text-ink/20 mt-1">Data will appear as users browse the app.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topPages.map((p, i) => {
            const color = PAGE_COLORS[p.page] ?? "#94A3B8";
            const pct = maxVisits > 0 ? (p.visits / maxVisits) * 100 : 0;
            const sharePct = totalViews > 0 ? ((p.visits / totalViews) * 100).toFixed(1) : "0.0";
            return (
              <motion.div
                key={p.page}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-ink/30 w-4">{i + 1}</span>
                    <span className="text-xs font-semibold text-ink">{PAGE_LABELS[p.page] ?? p.page}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-ink/40">{fmt(p.visits)} views</span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: `${color}18`, color }}
                    >
                      {sharePct}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-ink/8 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.05 * i + 0.2, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                    className="h-full rounded-full"
                    style={{ background: color }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FeatureTurnout({ featureTurnout, totalUsers }: {
  featureTurnout: Analytics["featureTurnout"];
  totalUsers: number;
}) {
  const features = [
    { key: "transactions", label: "Transactions", icon: CreditCard, color: "#D4A24C", desc: "logged ≥1 transaction" },
    { key: "accounts", label: "Accounts", icon: Wallet, color: "#6FBE9B", desc: "created ≥1 account" },
    { key: "budgets", label: "Budgets", icon: Target, color: "#A78BFA", desc: "set ≥1 budget" },
    { key: "goals", label: "Savings Goals", icon: Zap, color: "#34D399", desc: "created ≥1 goal" },
    { key: "ai", label: "AI Agent", icon: Brain, color: "#6366F1", desc: "used AI chat" },
    { key: "recurring", label: "Recurring Tx", icon: Repeat2, color: "#38BDF8", desc: "set up recurring tx" },
  ];

  return (
    <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--divider)]">
      <SectionHeader icon={Activity} title="Feature Turnout" color="#A78BFA" />
      <p className="text-[10px] text-ink/40 mb-4">% of users who have used each feature</p>
      <div className="grid grid-cols-2 gap-3">
        {features.map(({ key, label, icon: Icon, color, desc }, i) => {
          const data = featureTurnout[key] ?? { users: 0, rate: 0 };
          const rate = Math.min(Math.round(data.rate), 100);
          const circumference = 2 * Math.PI * 20;
          const dash = (rate / 100) * circumference;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.06 * i, duration: 0.35 }}
              className="rounded-xl p-3 border border-[var(--divider)]"
              style={{ background: `${color}08` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
                <span className="text-[11px] font-bold text-ink leading-tight">{label}</span>
              </div>
              {/* Mini ring progress */}
              <div className="flex items-center gap-3">
                <svg width="48" height="48" viewBox="0 0 48 48" className="rotate-[-90deg]">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="var(--divider)" strokeWidth="4" />
                  <motion.circle
                    cx="24" cy="24" r="20"
                    fill="none"
                    stroke={color}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - dash }}
                    transition={{ delay: 0.06 * i + 0.3, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  />
                </svg>
                <div>
                  <p className="text-xl font-bold leading-none" style={{ color }}>{rate}%</p>
                  <p className="text-[9px] text-ink/40 mt-0.5">{data.users}/{totalUsers} users</p>
                  <p className="text-[9px] text-ink/30 mt-0.5 leading-tight">{desc}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function RetentionCard({ retention }: { retention: Analytics["retention"] }) {
  const rate = Math.round(retention.rate);
  const circumference = 2 * Math.PI * 36;
  const dash = (rate / 100) * circumference;

  return (
    <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--divider)]">
      <SectionHeader icon={Activity} title="7-Day Retention" color="#FB923C" />
      <div className="flex items-center gap-5">
        <svg width="88" height="88" viewBox="0 0 88 88" className="rotate-[-90deg] shrink-0">
          <circle cx="44" cy="44" r="36" fill="none" stroke="var(--divider)" strokeWidth="6" />
          <motion.circle
            cx="44" cy="44" r="36"
            fill="none"
            stroke="#FB923C"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - dash }}
            transition={{ delay: 0.2, duration: 1, ease: [0.4, 0, 0.2, 1] }}
          />
        </svg>
        <div>
          <p className="text-3xl font-bold text-[#FB923C]">{rate}%</p>
          <p className="text-xs font-semibold text-ink/60 mt-1">Retained after 7 days</p>
          <p className="text-[10px] text-ink/40 mt-2 leading-relaxed">
            {retention.retained} of {retention.eligible} eligible users returned within 7 days of signup
          </p>
          <p className="text-[9px] text-ink/25 mt-2">Users who signed up more than 7 days ago</p>
        </div>
      </div>
    </div>
  );
}

function SubscriptionCard({ subscriptions, totalUsers }: {
  subscriptions: { Free: number; Pro: number; Premium: number };
  totalUsers: number;
}) {
  const paid = subscriptions.Pro + subscriptions.Premium;
  const conversionRate = totalUsers > 0 ? ((paid / totalUsers) * 100).toFixed(1) : "0.0";
  const tiers = [
    { key: "Free" as const, color: "#94A3B8", label: "Free" },
    { key: "Pro" as const, color: "#6FBE9B", label: "Pro" },
    { key: "Premium" as const, color: "#D4A24C", label: "Premium" },
  ];

  return (
    <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--divider)]">
      <SectionHeader icon={Award} title="Subscription Breakdown" color="#D4A24C" />

      {/* Conversion rate highlight */}
      <div className="mb-4 p-3 rounded-xl border border-[var(--divider)]" style={{ background: "#D4A24C08" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-ink/40 uppercase tracking-wider font-semibold">Paid Conversion Rate</p>
            <p className="text-2xl font-bold text-[#D4A24C] mt-0.5">{conversionRate}%</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-ink">{paid} paid</p>
            <p className="text-[10px] text-ink/40">{subscriptions.Free} free</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {tiers.map(({ key, color, label }) => {
          const count = subscriptions[key] ?? 0;
          const pct = totalUsers > 0 ? (count / totalUsers) * 100 : 0;
          return (
            <div key={key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold" style={{ color }}>{label}</span>
                <span className="text-ink font-bold">{count} <span className="text-ink/40 font-normal">users</span></span>
              </div>
              <div className="h-2 bg-ink/8 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.15, duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                  className="h-full rounded-full"
                  style={{ background: color }}
                />
              </div>
              <p className="text-[10px] text-ink/30 mt-0.5">{pct.toFixed(1)}% of total users</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AdminScreen() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "pages" | "users">("overview");

  const fetchAll = useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      const [statsData, analyticsData] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getAnalytics(),
      ]);
      setStats(statsData);
      setAnalytics(analyticsData);
      if (showToast) toast.success("Data refreshed");
    } catch (err: any) {
      toast.error(err.message || "Failed to load admin data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleTierChange = async (userId: string, currentTier: string, newTier: "Free" | "Pro" | "Premium") => {
    if (currentTier === newTier) return;
    const promise = adminAPI.updateUserTier(userId, newTier);
    toast.promise(promise, {
      loading: `Updating to ${newTier}...`,
      success: () => {
        if (stats) {
          const updatedUserList = stats.userList.map(u =>
            u.id === userId ? { ...u, subscription_tier: newTier } : u
          );
          const subscriptions = { Free: 0, Pro: 0, Premium: 0 };
          updatedUserList.forEach(u => { subscriptions[u.subscription_tier] = (subscriptions[u.subscription_tier] || 0) + 1; });
          setStats({ ...stats, userList: updatedUserList, subscriptions });
        }
        return `Updated to ${newTier}`;
      },
      error: (err: any) => err.message || "Failed to update tier",
    });
  };

  const filteredUsers = stats?.userList.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-deep)] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <RefreshCw className="w-8 h-8 text-[#D4A24C]" />
        </motion.div>
      </div>
    );
  }

  const ov = analytics?.overview;
  const tabs = [
    { id: "overview" as const, label: "Overview", icon: BarChart3 },
    { id: "pages" as const, label: "Pages", icon: Eye },
    { id: "users" as const, label: "Users", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-deep)] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--bg-deep)]/95 backdrop-blur-xl border-b border-[var(--divider)] px-5 pt-4 pb-0">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/dashboard/settings")}
            className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--divider)] text-ink transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-ink flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#D4A24C]" />
            Admin Analytics
          </h1>
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--divider)] text-ink transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 pb-0">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all border-b-2 ${
                activeTab === id
                  ? "border-[#D4A24C] text-[#D4A24C]"
                  : "border-transparent text-ink/40"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">
        <AnimatePresence mode="wait">
          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {/* KPI Grid */}
              <div className="grid grid-cols-2 gap-3">
                <KPICard icon={Users} label="Total Users" value={fmt(ov?.totalUsers ?? 0)} color="#7C9EF8" delay={0} />
                <KPICard icon={Activity} label="DAU" value={fmt(ov?.dau ?? 0)} sub="Active today" color="#6FBE9B" delay={0.05} />
                <KPICard icon={User} label="WAU" value={fmt(ov?.wau ?? 0)} sub="Active this week" color="#FB923C" delay={0.1} />
                <KPICard icon={Clock} label="MAU" value={fmt(ov?.mau ?? 0)} sub="Active this month" color="#A78BFA" delay={0.15} />
                <KPICard icon={CreditCard} label="Transactions" value={fmt(ov?.totalTransactions ?? 0)} sub="All time" color="#D4A24C" delay={0.2} />
                <KPICard icon={BarChart3} label="Avg Tx/User" value={(ov?.avgTransactionsPerUser ?? 0).toFixed(1)} sub="per user" color="#E07C8A" delay={0.25} />
              </div>

              {/* Transaction Volume */}
              {(ov?.totalTransactionVolume ?? 0) > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="bg-gradient-to-r from-[#D4A24C]/10 to-[#6FBE9B]/10 rounded-2xl p-5 border border-[#D4A24C]/20"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/40 mb-1">Total Expense Volume</p>
                  <p className="text-3xl font-bold text-[#D4A24C]">{fmtCurrency(ov?.totalTransactionVolume ?? 0)}</p>
                  <p className="text-[10px] text-ink/40 mt-1">Tracked across all users</p>
                </motion.div>
              )}

              {/* Growth Chart */}
              {analytics?.growth && <GrowthChart data={analytics.growth} />}

              {/* Retention */}
              {analytics?.retention && <RetentionCard retention={analytics.retention} />}

              {/* Subscription Breakdown */}
              {analytics?.subscriptions && (
                <SubscriptionCard
                  subscriptions={analytics.subscriptions}
                  totalUsers={ov?.totalUsers ?? 0}
                />
              )}

              {/* Feature Turnout */}
              {analytics?.featureTurnout && (
                <FeatureTurnout
                  featureTurnout={analytics.featureTurnout}
                  totalUsers={ov?.totalUsers ?? 0}
                />
              )}
            </motion.div>
          )}

          {/* ── PAGES TAB ── */}
          {activeTab === "pages" && (
            <motion.div
              key="pages"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {/* All-time page popularity */}
              <PagePopularity
                pageStats={analytics?.pageStats.allTime ?? []}
                totalViews={ov?.totalPageViews ?? 0}
              />

              {/* Unique users per page */}
              {(analytics?.pageStats.uniqueUsers ?? []).length > 0 && (
                <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--divider)]">
                  <SectionHeader icon={Users} title="Unique Users per Page" color="#E07C8A" />
                  <div className="space-y-3">
                    {analytics!.pageStats.uniqueUsers.slice(0, 8).map((p, i) => {
                      const color = PAGE_COLORS[p.page] ?? "#94A3B8";
                      const maxU = Math.max(...analytics!.pageStats.uniqueUsers.map(x => x.unique_users), 1);
                      const pct = (p.unique_users / maxU) * 100;
                      return (
                        <div key={p.page}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-ink/30 w-4">{i + 1}</span>
                              <span className="text-xs font-semibold text-ink">{PAGE_LABELS[p.page] ?? p.page}</span>
                            </div>
                            <span className="text-xs font-bold" style={{ color }}>{p.unique_users} users</span>
                          </div>
                          <div className="h-1.5 bg-ink/8 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ delay: 0.05 * i + 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                              className="h-full rounded-full"
                              style={{ background: color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Weekly spotlight */}
              {(analytics?.pageStats.weekly ?? []).length > 0 && (
                <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--divider)]">
                  <SectionHeader icon={TrendingUp} title="This Week's Hotspots" color="#34D399" />
                  <div className="space-y-2">
                    {analytics!.pageStats.weekly.slice(0, 5).map((p, i) => {
                      const color = PAGE_COLORS[p.page] ?? "#94A3B8";
                      return (
                        <motion.div
                          key={p.page}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 * i }}
                          className="flex items-center gap-3 p-3 rounded-xl border border-[var(--divider)]"
                          style={{ background: `${color}08` }}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black" style={{ background: `${color}20`, color }}>
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-ink">{PAGE_LABELS[p.page] ?? p.page}</p>
                            <p className="text-[10px] text-ink/40">{fmt(p.visits)} views this week</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-ink/20" />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {(analytics?.pageStats.allTime ?? []).length === 0 && (
                <div className="bg-[var(--surface)] rounded-2xl p-8 border border-[var(--divider)] text-center">
                  <Eye className="w-12 h-12 text-ink/10 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-ink/40">No page views yet</p>
                  <p className="text-[11px] text-ink/25 mt-1 max-w-[200px] mx-auto">
                    Page visit data will appear here as users browse the app.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── USERS TAB ── */}
          {activeTab === "users" && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* Summary pills */}
              <div className="flex gap-2 flex-wrap">
                {([
                  { label: `${stats?.totalUsers ?? 0} Total`, color: "#7C9EF8" },
                  { label: `${stats?.subscriptions.Free ?? 0} Free`, color: "#94A3B8" },
                  { label: `${stats?.subscriptions.Pro ?? 0} Pro`, color: "#6FBE9B" },
                  { label: `${stats?.subscriptions.Premium ?? 0} Premium`, color: "#D4A24C" },
                ] as const).map(({ label, color }) => (
                  <span key={label} className="text-[11px] font-semibold px-3 py-1 rounded-full border"
                    style={{ background: `${color}12`, color, borderColor: `${color}30` }}>
                    {label}
                  </span>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[var(--surface)] border border-[var(--divider)] rounded-xl text-ink placeholder:text-ink/30 focus:border-[#D4A24C] focus:outline-none text-sm"
                />
              </div>

              {/* User list */}
              <div className="space-y-3">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-10 text-sm text-ink/40">No users found.</div>
                ) : (
                  filteredUsers.map((user, i) => {
                    const tierColor = user.subscription_tier === "Premium"
                      ? "#D4A24C" : user.subscription_tier === "Pro" ? "#6FBE9B" : "#94A3B8";
                    return (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(0.03 * i, 0.3) }}
                        className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--divider)] space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
                              style={{ background: `${tierColor}18`, color: tierColor }}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-ink">{user.name}</h4>
                              <p className="text-[11px] text-ink/50">{user.email}</p>
                            </div>
                          </div>
                          <span
                            className="text-[10px] font-bold px-2 py-1 rounded-full"
                            style={{ background: `${tierColor}15`, color: tierColor }}
                          >
                            {user.subscription_tier}
                          </span>
                        </div>

                        <div className="flex gap-3 text-[10px] text-ink/40">
                          <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                          {user.last_seen && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              Seen {new Date(user.last_seen).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {user.email !== "admin_finly" && (
                          <div className="pt-2 border-t border-[var(--divider)]">
                            <p className="text-[10px] font-medium text-ink/40 mb-2">Change Tier:</p>
                            <div className="grid grid-cols-3 gap-2">
                              {(["Free", "Pro", "Premium"] as const).map(tier => {
                                const tc = tier === "Premium" ? "#D4A24C" : tier === "Pro" ? "#6FBE9B" : "#94A3B8";
                                const isActive = user.subscription_tier === tier;
                                return (
                                  <button
                                    key={tier}
                                    onClick={() => handleTierChange(user.id, user.subscription_tier, tier)}
                                    className="py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                                    style={
                                      isActive
                                        ? { background: tc, color: "var(--bg-deep)" }
                                        : { background: "var(--bg-deep)", border: "1px solid var(--divider)", color: "var(--ink-muted)" }
                                    }
                                  >
                                    {isActive && <Check className="w-3 h-3" />}
                                    {tier}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
