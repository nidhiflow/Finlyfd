import { useState, useEffect } from "react";
import { savingsGoalsAPI } from "../services/api";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Target, Calendar, ArrowLeft, X, Check,
  Pause, Play, Trash2, Edit3, Archive, ChevronRight,
  TrendingUp, Award, Search, Filter,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────────────────
interface Goal {
  id: string;
  name: string;
  emoji: string;
  target: number;
  saved: number;
  targetDate: string;
  startDate: string;
  color: string;
  trackingMode: "Manual" | "Auto";
  type: "one-time" | "recurring" | "long-term";
  linkedAccount: string;
  carryForward: boolean;
  notes: string;
  status: "active" | "paused" | "completed" | "archived";
  contributions: Contribution[];
}

interface Contribution {
  id: string;
  amount: number;
  date: string;
  note: string;
  fromAccount: string;
}

// ─── Initial Data ───────────────────────────────────────────────────────────────
const INITIAL_GOALS: Goal[] = [];

const GOAL_EMOJIS = ["🏥","✈️","💻","🚗","🏠","💍","📱","🎓","👶","💰","🏖️","🎯"];
const ACCOUNTS = ["HDFC Savings","SBI Salary A/C","ICICI Credit Card","Cash Wallet"];
const GOAL_COLORS = ["#7C5CFF","#4CC9F0","#22C55E","#FFA500","#F72585","#FFB703","#4895EF","#EF4444"];

// ─── Helpers ────────────────────────────────────────────────────────────────────
const fmtINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const pct = (saved: number, target: number) => target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;

// ─── Goal Form Modal ────────────────────────────────────────────────────────────
function GoalFormModal({ goal, onSave, onClose }: {
  goal?: Goal | null; onSave: (g: Partial<Goal>) => void; onClose: () => void;
}) {
  const [name, setName] = useState(goal?.name || "");
  const [emoji, setEmoji] = useState(goal?.emoji || "🎯");
  const [target, setTarget] = useState(goal?.target?.toString() || "");
  const [saved, setSaved] = useState(goal?.saved?.toString() || "0");
  const [targetDate, setTargetDate] = useState(goal?.targetDate || "Dec 2026");
  const [type, setType] = useState<Goal["type"]>(goal?.type || "one-time");
  const [trackingMode, setTrackingMode] = useState<Goal["trackingMode"]>(goal?.trackingMode || "Manual");
  const [linkedAccount, setLinkedAccount] = useState(goal?.linkedAccount || ACCOUNTS[0]);
  const [carryForward, setCarryForward] = useState(goal?.carryForward ?? false);
  const [notes, setNotes] = useState(goal?.notes || "");
  const [color, setColor] = useState(goal?.color || GOAL_COLORS[0]);
  const [showEmojis, setShowEmojis] = useState(false);

  const handleSave = () => {
    if (!name.trim() || !target) { toast.error("Name and target amount are required"); return; }
    onSave({
      name: name.trim(), emoji, target: parseFloat(target), saved: parseFloat(saved || "0"),
      targetDate, type, trackingMode, linkedAccount, carryForward, notes, color,
      startDate: goal?.startDate || new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
    });
  };

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#7C5CFF] transition-colors";
  const labelCls = "text-white/60 text-xs mb-1.5 block";

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }} onClick={e => e.stopPropagation()}
        className="w-full max-w-md mx-auto rounded-t-3xl border-t border-white/10 p-5 max-h-[85vh] overflow-y-auto"
        style={{ background: "linear-gradient(180deg,#1A2238 0%,#131825 100%)" }}>
        <div className="flex justify-center mb-4"><div className="w-8 h-1 rounded-full bg-white/15" /></div>
        <h2 className="text-white font-bold text-lg mb-5">{goal ? "Edit Goal" : "Add New Goal"}</h2>

        <div className="space-y-4">
          {/* Emoji + Name */}
          <div className="flex gap-3">
            <div className="relative">
              <button onClick={() => setShowEmojis(!showEmojis)}
                className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl hover:border-[#7C5CFF] transition-colors">
                {emoji}
              </button>
              <AnimatePresence>
                {showEmojis && (
                  <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.9}}
                    className="absolute top-16 left-0 z-10 grid grid-cols-4 gap-1.5 p-3 rounded-xl border border-white/10"
                    style={{ background: "#1A2238" }}>
                    {GOAL_EMOJIS.map(e => (
                      <button key={e} onClick={() => { setEmoji(e); setShowEmojis(false); }}
                        className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-lg hover:bg-white/10 transition-colors">
                        {e}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex-1">
              <label className={labelCls}>Goal Name</label>
              <input className={inputCls} placeholder="e.g. Emergency Fund" value={name} onChange={e => setName(e.target.value)} style={{ fontSize: 14 }} />
            </div>
          </div>

          {/* Target + Saved */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Target Amount</label>
              <input className={inputCls} placeholder="₹0" type="number" value={target} onChange={e => setTarget(e.target.value)} style={{ fontSize: 14 }} />
            </div>
            <div>
              <label className={labelCls}>Already Saved</label>
              <input className={inputCls} placeholder="₹0" type="number" value={saved} onChange={e => setSaved(e.target.value)} style={{ fontSize: 14 }} />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className={labelCls}>Color</label>
            <div className="flex gap-2">
              {GOAL_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                  style={{ background: c, border: color === c ? "2px solid white" : "2px solid transparent", transform: color === c ? "scale(1.15)" : "scale(1)" }}>
                  {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <label className={labelCls}>Goal Type</label>
            <div className="flex gap-2">
              {(["one-time", "recurring", "long-term"] as const).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all capitalize"
                  style={{
                    background: type === t ? "rgba(124,92,255,0.15)" : "rgba(255,255,255,0.04)",
                    color: type === t ? "#9D7EFF" : "rgba(255,255,255,0.4)",
                    border: type === t ? "1px solid rgba(124,92,255,0.3)" : "1px solid rgba(255,255,255,0.07)",
                  }}>
                  {t.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Tracking Mode */}
          <div>
            <label className={labelCls}>Tracking Mode</label>
            <div className="flex gap-2">
              {(["Manual", "Auto"] as const).map(m => (
                <button key={m} onClick={() => setTrackingMode(m)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: trackingMode === m ? "rgba(124,92,255,0.15)" : "rgba(255,255,255,0.04)",
                    color: trackingMode === m ? "#9D7EFF" : "rgba(255,255,255,0.4)",
                    border: trackingMode === m ? "1px solid rgba(124,92,255,0.3)" : "1px solid rgba(255,255,255,0.07)",
                  }}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Linked Account */}
          <div>
            <label className={labelCls}>Linked Account</label>
            <select className={inputCls} value={linkedAccount} onChange={e => setLinkedAccount(e.target.value)}
              style={{ fontSize: 14, colorScheme: "dark" }}>
              {ACCOUNTS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Target Date */}
          <div>
            <label className={labelCls}>Target Date</label>
            <input className={inputCls} placeholder="e.g. Dec 2026" value={targetDate} onChange={e => setTargetDate(e.target.value)} style={{ fontSize: 14 }} />
          </div>

          {/* Carry Forward Toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-white/70 text-sm font-medium">Carry Forward</p>
              <p className="text-white/30 text-xs">Roll over unmet savings to next period</p>
            </div>
            <button onClick={() => setCarryForward(!carryForward)}
              className="w-12 h-7 rounded-full flex items-center transition-colors px-0.5"
              style={{ background: carryForward ? "#7C5CFF" : "rgba(255,255,255,0.1)" }}>
              <motion.div animate={{ x: carryForward ? 20 : 0 }}
                className="w-6 h-6 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Notes (optional)</label>
            <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Any notes..." value={notes} onChange={e => setNotes(e.target.value)} style={{ fontSize: 14 }} />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <motion.button whileTap={{scale:0.95}} onClick={onClose}
            className="flex-1 py-3.5 rounded-xl bg-white/5 text-white/50 text-sm font-medium">Cancel</motion.button>
          <motion.button whileTap={{scale:0.95}} onClick={handleSave}
            className="flex-1 py-3.5 rounded-xl text-white text-sm font-semibold shadow-lg shadow-[#7C5CFF]/30"
            style={{ background: "linear-gradient(135deg,#7C5CFF,#4CC9F0)" }}>
            {goal ? "Update Goal" : "Create Goal"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Record Savings Modal ───────────────────────────────────────────────────────
function RecordSavingsModal({ goal, onSave, onClose }: {
  goal: Goal; onSave: (amount: number, note: string, account: string) => void; onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [account, setAccount] = useState(goal.linkedAccount);

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#7C5CFF] transition-colors";

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ background: "rgba(0,0,0,0.85)" }} onClick={onClose}>
      <motion.div initial={{scale:0.9}} animate={{scale:1}} onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl p-6 border border-white/10"
        style={{ background: "linear-gradient(180deg,#1A2238 0%,#131825 100%)" }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: `${goal.color}18`, border: `1px solid ${goal.color}30` }}>
            {goal.emoji}
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">{goal.name}</h3>
            <p className="text-white/40 text-xs">{fmtINR(goal.saved)} of {fmtINR(goal.target)}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-white/60 text-xs mb-1.5 block">Amount</label>
            <input className={inputCls} type="number" placeholder="₹0" value={amount} onChange={e => setAmount(e.target.value)} style={{ fontSize: 14 }} />
          </div>
          <div>
            <label className="text-white/60 text-xs mb-1.5 block">From Account</label>
            <select className={inputCls} value={account} onChange={e => setAccount(e.target.value)} style={{ fontSize: 14, colorScheme: "dark" }}>
              {ACCOUNTS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="text-white/60 text-xs mb-1.5 block">Note (optional)</label>
            <input className={inputCls} placeholder="e.g. Monthly savings" value={note} onChange={e => setNote(e.target.value)} style={{ fontSize: 14 }} />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <motion.button whileTap={{scale:0.95}} onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/5 text-white/50 text-sm font-medium">Cancel</motion.button>
          <motion.button whileTap={{scale:0.95}}
            onClick={() => {
              if (!amount || parseFloat(amount) <= 0) { toast.error("Enter a valid amount"); return; }
              onSave(parseFloat(amount), note, account);
            }}
            className="flex-1 py-3 rounded-xl text-white text-sm font-semibold shadow-lg shadow-[#7C5CFF]/30"
            style={{ background: "linear-gradient(135deg,#7C5CFF,#4CC9F0)" }}>
            Record Savings
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Goal Detail View ───────────────────────────────────────────────────────────
function GoalDetail({ goal, onBack, onRecordSavings, onDelete }: {
  goal: Goal; onBack: () => void; onRecordSavings: () => void; onDelete: () => void;
}) {
  const progress = pct(goal.saved, goal.target);
  const remaining = Math.max(0, goal.target - goal.saved);

  const milestones = [25, 50, 75, 100].map(m => ({
    pct: m,
    label: `${m}%`,
    amount: fmtINR(Math.round(goal.target * m / 100)),
    reached: progress >= m,
  }));

  return (
    <motion.div initial={{opacity:0, x: 40}} animate={{opacity:1, x: 0}} exit={{opacity:0, x: -40}}
      transition={{ duration: 0.25 }}>
      <button onClick={onBack} className="flex items-center gap-2 text-white/50 text-sm mb-5 hover:text-white/70 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Goals
      </button>

      {/* Header */}
      <div className="rounded-2xl p-5 mb-4 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg,${goal.color}15 0%,rgba(255,255,255,0.02) 100%)`, border: `1px solid ${goal.color}25` }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
            style={{ background: `${goal.color}18`, border: `1px solid ${goal.color}30` }}>
            {goal.emoji}
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-lg">{goal.name}</h2>
            <p className="text-white/40 text-xs">{goal.type.replace("-", " ")} · {goal.trackingMode} · {goal.linkedAccount}</p>
          </div>
        </div>

        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-white/40 text-xs">Saved</p>
            <p className="text-white font-bold text-2xl">{fmtINR(goal.saved)}</p>
          </div>
          <div className="text-right">
            <p className="text-white/40 text-xs">Target</p>
            <p className="text-white/70 font-semibold">{fmtINR(goal.target)}</p>
          </div>
        </div>

        <div className="h-3 rounded-full overflow-hidden bg-white/10">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg,${goal.color},${goal.color}88)` }}
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs font-semibold" style={{ color: goal.color }}>{progress}%</span>
          <span className="text-white/30 text-xs">Remaining: {fmtINR(remaining)}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-4">
        <motion.button whileTap={{scale:0.95}} onClick={onRecordSavings}
          className="flex-1 py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#7C5CFF,#4CC9F0)", boxShadow: "0 4px 16px rgba(124,92,255,0.3)" }}>
          <Plus className="w-4 h-4" /> Record Savings
        </motion.button>
        <motion.button whileTap={{scale:0.95}} onClick={onDelete}
          className="w-12 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center">
          <Trash2 className="w-4 h-4 text-[#EF4444]" />
        </motion.button>
      </div>

      {/* Milestones */}
      <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h3 className="text-white font-semibold text-sm mb-3">Milestones</h3>
        <div className="space-y-3">
          {milestones.map(m => (
            <div key={m.pct} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${m.reached ? "" : "border border-white/10"}`}
                style={{ background: m.reached ? goal.color : "rgba(255,255,255,0.04)" }}>
                {m.reached ? <Check className="w-3.5 h-3.5 text-white" /> : <span className="text-[10px] text-white/30">{m.label}</span>}
              </div>
              <div className="flex-1">
                <p className={`text-xs font-medium ${m.reached ? "text-white/80" : "text-white/30"}`}>{m.amount}</p>
              </div>
              {m.reached && <span className="text-[10px] font-semibold" style={{ color: goal.color }}>Reached!</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Contribution History */}
      <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h3 className="text-white font-semibold text-sm mb-3">Savings History</h3>
        {goal.contributions.length === 0 ? (
          <p className="text-white/25 text-xs text-center py-4">No contributions yet</p>
        ) : (
          <div className="space-y-2">
            {goal.contributions.slice().reverse().map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                <div>
                  <p className="text-white/70 text-xs font-medium">{c.note || "Savings"}</p>
                  <p className="text-white/30 text-[10px]">{c.date} · {c.fromAccount}</p>
                </div>
                <p className="text-sm font-semibold" style={{ color: "#22C55E" }}>+{fmtINR(c.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Goal Card ──────────────────────────────────────────────────────────────────
function GoalCard({ goal, onClick }: { goal: Goal; onClick: () => void }) {
  const progress = pct(goal.saved, goal.target);

  return (
    <motion.div whileTap={{scale:0.98}} onClick={onClick}
      className="rounded-2xl p-4 cursor-pointer relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg,${goal.color}08 0%,rgba(255,255,255,0.02) 100%)`,
        border: `1px solid ${goal.color}20`,
      }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
          style={{ background: `${goal.color}18`, border: `1px solid ${goal.color}30` }}>
          {goal.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{goal.name}</p>
          <p className="text-white/35 text-[10px]">{goal.type.replace("-", " ")} · {goal.targetDate}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
      </div>

      <div className="flex items-end justify-between mb-2">
        <p className="text-sm font-bold" style={{ color: goal.color }}>{fmtINR(goal.saved)}</p>
        <p className="text-white/30 text-xs">{fmtINR(goal.target)}</p>
      </div>

      <div className="h-2 rounded-full overflow-hidden bg-white/10">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg,${goal.color},${goal.color}88)` }}
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
      <p className="text-right mt-1 text-[10px] font-semibold" style={{ color: `${goal.color}90` }}>{progress}%</p>
    </motion.div>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────────
export function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tab, setTab] = useState<"active" | "completed">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [detailGoal, setDetailGoal] = useState<Goal | null>(null);
  const [savingsGoal, setSavingsGoal] = useState<Goal | null>(null);
  const [deleteGoal, setDeleteGoal] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadGoals = async () => {
    setIsLoading(true);
    try {
      const data = await savingsGoalsAPI.getAll();
      const mapped = data.map((g: any) => ({
        id: g.id,
        name: g.name,
        emoji: g.emoji || "🎯",
        target: parseFloat(g.target_amount || "0"),
        saved: parseFloat(g.current_amount || "0"),
        targetDate: g.target_date || "Dec 2026",
        startDate: g.start_date || "Apr 2026",
        color: g.color || "#7C5CFF",
        trackingMode: g.tracking_mode || "Manual",
        type: g.type || "one-time",
        linkedAccount: g.linked_account || ACCOUNTS[0],
        carryForward: g.carry_forward || false,
        notes: g.notes || "",
        status: g.status || "active",
        contributions: g.contributions || [],
      }));
      setGoals(mapped);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load goals");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const activeGoals = goals.filter(g => g.status === "active" || g.status === "paused");
  const completedGoals = goals.filter(g => g.status === "completed" || g.saved >= g.target);

  const displayedGoals = (tab === "active" ? activeGoals : completedGoals)
    .filter(g => !searchQuery || g.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSaveGoal = async (data: Partial<Goal>) => {
    try {
      if (editGoal) {
        await savingsGoalsAPI.update(editGoal.id, {
          name: data.name,
          emoji: data.emoji,
          target_amount: data.target,
          current_amount: data.saved,
          target_date: data.targetDate,
          start_date: data.startDate,
          color: data.color,
          tracking_mode: data.trackingMode,
          type: data.type,
          linked_account: data.linkedAccount,
          carry_forward: data.carryForward,
          notes: data.notes
        });
        toast.success("Goal updated");
      } else {
        await savingsGoalsAPI.create({
          name: data.name,
          emoji: data.emoji,
          target_amount: data.target,
          current_amount: data.saved,
          target_date: data.targetDate,
          start_date: data.startDate,
          color: data.color,
          tracking_mode: data.trackingMode,
          type: data.type,
          linked_account: data.linkedAccount,
          carry_forward: data.carryForward,
          notes: data.notes,
          status: "active"
        });
        toast.success("Goal created!");
      }
      loadGoals();
    } catch (e) {
      console.error(e);
      toast.error("Failed to save goal");
    }
    setShowForm(false);
    setEditGoal(null);
  };

  const handleRecordSavings = async (goalId: string, amount: number, note: string, account: string) => {
    try {
      await savingsGoalsAPI.recordSavings(goalId, amount, note, account);
      toast.success(`${fmtINR(amount)} added to goal!`);
      loadGoals();
    } catch (e) {
      console.error(e);
      toast.error("Failed to record savings");
    }
    setSavingsGoal(null);
  };

  const handleDeleteGoal = async (goal: Goal) => {
    try {
      await savingsGoalsAPI.delete(goal.id);
      toast.success("Goal deleted");
      loadGoals();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete goal");
    }
    setDeleteGoal(null);
    setDetailGoal(null);
  };

  // ─── Summary Stats ──────────────────────────────────────────────
  const totalTarget = activeGoals.reduce((s, g) => s + g.target, 0);
  const totalSaved = activeGoals.reduce((s, g) => s + g.saved, 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  // If viewing a specific goal detail
  if (detailGoal) {
    const latestGoal = goals.find(g => g.id === detailGoal.id) || detailGoal;
    return (
      <div className="px-5 py-5 pb-24">
        <AnimatePresence mode="wait">
          <GoalDetail
            key={latestGoal.id}
            goal={latestGoal}
            onBack={() => setDetailGoal(null)}
            onRecordSavings={() => setSavingsGoal(latestGoal)}
            onDelete={() => handleDeleteGoal(latestGoal)}
          />
        </AnimatePresence>

        <AnimatePresence>
          {savingsGoal && (
            <RecordSavingsModal
              goal={savingsGoal}
              onSave={(amt, note, acc) => handleRecordSavings(savingsGoal.id, amt, note, acc)}
              onClose={() => setSavingsGoal(null)}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="px-5 py-5 pb-24 relative">
      {/* Summary Banner */}
      {activeGoals.length > 0 && (
        <div className="rounded-2xl p-5 mb-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg,rgba(124,92,255,0.12) 0%,rgba(76,201,240,0.06) 100%)",
            border: "1px solid rgba(124,92,255,0.2)",
          }}>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Total Target", value: fmtINR(totalTarget), color: "white" },
              { label: "Total Saved", value: fmtINR(totalSaved), color: "#22C55E" },
              { label: "Monthly Contribution", value: `${fmtINR(activeGoals.reduce((s,g) => s + (g.contributions.length > 0 ? g.contributions[g.contributions.length-1].amount : 0), 0))}`, color: "white" },
            ].map(s => (
              <div key={s.label}>
                <p className="text-white/35 text-[10px] uppercase mb-1">{s.label}</p>
                <p className="font-bold text-sm" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="h-2 rounded-full overflow-hidden bg-white/10 mt-4">
            <motion.div className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg,#7C5CFF,#4CC9F0)" }}
              initial={{ width: "0%" }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <p className="text-right text-[10px] text-[#9D7EFF] font-semibold mt-1">{overallProgress}% overall</p>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
        <input
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#7C5CFF] transition-colors"
          placeholder="Search goals..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(["active", "completed"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all capitalize"
            style={{
              background: tab === t ? "rgba(124,92,255,0.15)" : "rgba(255,255,255,0.04)",
              color: tab === t ? "#9D7EFF" : "rgba(255,255,255,0.35)",
              border: tab === t ? "1px solid rgba(124,92,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
            }}>
            {t} ({t === "active" ? activeGoals.length : completedGoals.length})
          </button>
        ))}
      </div>

      {/* Goals List */}
      {displayedGoals.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-3xl"
            style={{ background: "rgba(255,255,255,0.03)", border: "1.5px dashed rgba(255,255,255,0.1)" }}>
            🎯
          </div>
          <p className="text-white/40 font-semibold text-sm">
            {tab === "active" ? "No active goals" : "No completed goals"}
          </p>
          <p className="text-white/20 text-xs mt-1">
            {tab === "active" ? "Tap + to set your first financial goal" : "Complete a goal to see it here"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedGoals.map(goal => (
            <GoalCard key={goal.id} goal={goal} onClick={() => setDetailGoal(goal)} />
          ))}
        </div>
      )}

      {/* FAB */}
      <motion.button whileTap={{scale:0.9}}
        onClick={() => { setEditGoal(null); setShowForm(true); }}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center z-40"
        style={{
          background: "linear-gradient(135deg,#7C5CFF,#4CC9F0)",
          boxShadow: "0 6px 24px rgba(124,92,255,0.45), 0 0 40px rgba(124,92,255,0.15)",
        }}>
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* Modals */}
      <AnimatePresence>
        {(showForm || editGoal) && (
          <GoalFormModal
            goal={editGoal}
            onSave={handleSaveGoal}
            onClose={() => { setShowForm(false); setEditGoal(null); }}
          />
        )}
        {savingsGoal && (
          <RecordSavingsModal
            goal={savingsGoal}
            onSave={(amt, note, acc) => handleRecordSavings(savingsGoal.id, amt, note, acc)}
            onClose={() => setSavingsGoal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
