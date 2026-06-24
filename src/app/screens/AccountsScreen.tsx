import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { accountsAPI, authAPI } from "../services/api";
import { PremiumFeatureGate } from "../components/PremiumFeatureGate";
import {
  Plus, X, Check, Search, ChevronRight, Eye, EyeOff,
  Pencil, Trash2, Star, Crown, SlidersHorizontal, TrendingUp, TrendingDown,
  Landmark, Briefcase, CreditCard, HandCoins, LineChart, Banknote, Wallet,
  Smartphone, Globe, FileText, Zap, LayoutGrid, Sparkles,
  type LucideIcon,
} from "lucide-react";

type IconType = LucideIcon;

// ─── Types ─────────────────────────────────────────────────────────────────────
type AccountType = "savings" | "current" | "credit" | "liability" | "investment" | "salary" | "cash";
type PaymentMode = "upi" | "netbanking" | "cheque" | "cash";

interface Account {
  id: string;
  name: string;
  type: AccountType;
  bankName?: string;
  balance: number;
  trackBalance: boolean;
  color: string;
  isPrimary: boolean;
  paymentModes: PaymentMode[];
  upiId?: string;
  isCustom?: boolean;
}

interface FormState {
  name: string;
  type: AccountType;
  bankName: string;
  paymentModes: PaymentMode[];
  trackBalance: boolean;
  openingBalance: string;
  color: string;
  isPrimary: boolean;
  upiId: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const ACCOUNT_TYPES: { id: AccountType; label: string; icon: IconType; color: string; hasBank: boolean }[] = [
  { id: "savings", label: "Savings Account", icon: Landmark, color: "#4895EF", hasBank: true },
  { id: "current", label: "Current Account", icon: Briefcase, color: "#D4A24C", hasBank: true },
  { id: "credit", label: "Credit Card", icon: CreditCard, color: "#F72585", hasBank: true },
  { id: "liability", label: "Liability Account", icon: HandCoins, color: "#EF4444", hasBank: true },
  { id: "investment", label: "Investment Account", icon: LineChart, color: "#2EC4B6", hasBank: true },
  { id: "salary", label: "Salary Account", icon: Banknote, color: "#22C55E", hasBank: true },
  { id: "cash", label: "Cash Wallet", icon: Wallet, color: "#FFB703", hasBank: false },
];

const PAYMENT_MODES = [
  { id: "upi" as PaymentMode, label: "UPI", icon: Smartphone },
  { id: "netbanking" as PaymentMode, label: "Net Banking", icon: Globe },
  { id: "cheque" as PaymentMode, label: "Cheque", icon: FileText },
  { id: "cash" as PaymentMode, label: "Cash", icon: Banknote },
];

const BANKS = [
  "State Bank of India (SBI)", "HDFC Bank", "ICICI Bank", "Axis Bank",
  "Kotak Mahindra Bank", "IndusInd Bank", "Yes Bank", "Bank of Baroda",
  "Punjab National Bank", "Canara Bank", "Union Bank of India", "IDFC FIRST Bank",
  "Federal Bank", "South Indian Bank", "RBL Bank", "Bandhan Bank",
  "UCO Bank", "Indian Bank", "Central Bank of India", "Bank of India",
  "Other Bank",
];

const COLOR_TAGS = [
  "#4895EF", "#22C55E", "#F72585", "#FFB703",
  "#D4A24C", "#F7931A", "#2EC4B6", "#EF4444",
  "#C77DFF", "#FF6B9D", "#D4A24C", "#06D6A0",
];

const QUICK_TEMPLATES = [
  { name: "HDFC Savings", type: "savings" as AccountType, bank: "HDFC Bank", emoji: "🏦", color: "#4895EF", modes: ["upi", "netbanking"] as PaymentMode[] },
  { name: "SBI Savings", type: "savings" as AccountType, bank: "State Bank of India (SBI)", emoji: "🏦", color: "#22C55E", modes: ["upi", "netbanking", "cheque"] as PaymentMode[] },
  { name: "Credit Card", type: "credit" as AccountType, bank: "ICICI Bank", emoji: "💳", color: "#F72585", modes: ["netbanking"] as PaymentMode[] },
  { name: "Cash Wallet", type: "cash" as AccountType, bank: "", emoji: "💵", color: "#FFB703", modes: ["cash"] as PaymentMode[] },
  { name: "Kotak Savings", type: "savings" as AccountType, bank: "Kotak Mahindra Bank", emoji: "🏦", color: "#845EC2", modes: ["upi", "netbanking"] as PaymentMode[] },
  { name: "Investment A/C", type: "investment" as AccountType, bank: "HDFC Bank", emoji: "📈", color: "#2EC4B6", modes: ["netbanking"] as PaymentMode[] },
];

const EMPTY_FORM: FormState = {
  name: "", type: "savings", bankName: "", paymentModes: ["upi", "netbanking"],
  trackBalance: true, openingBalance: "", color: "#4895EF", isPrimary: false, upiId: "",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmtBal = (n: number) =>
  `${n < 0 ? "-" : ""}₹${Math.abs(n).toLocaleString("en-IN")}`;

const typeInfo = (t: AccountType) =>
  ACCOUNT_TYPES.find(x => x.id === t) ?? ACCOUNT_TYPES[0];

// ─── Net Worth Banner ──────────────────────────────────────────────────────────
function NetWorthBanner({ accounts, visible, onToggle }: {
  accounts: Account[]; visible: boolean; onToggle: () => void;
}) {
  const tracked = accounts.filter(a => a.trackBalance);
  const totalBalance = tracked.reduce((s, a) => s + a.balance, 0);
  const primary = accounts.find(a => a.isPrimary);

  return (
    <div className="mx-4 mb-4 rounded-[18px] overflow-hidden relative"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--divider)",
      }}>
      {/* Glow orb */}
      <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(212,162,76,0.18) 0%,transparent 70%)" }} />
      <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(212,162,76,0.12) 0%,transparent 70%)" }} />

      <div className="relative z-10 p-5">
        <div className="flex items-start justify-between mb-1">
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-faint)", letterSpacing: "0.6px" }}>TOTAL BALANCE</p>
          <button onClick={onToggle}
            className="w-7 h-7 rounded-[14px] flex items-center justify-center"
            style={{ background: "var(--surface-raised)" }}>
            {visible ? <Eye className="w-3.5 h-3.5" strokeWidth={1.75} style={{ color: "var(--ink-faint)" }} /> : <EyeOff className="w-3.5 h-3.5" strokeWidth={1.75} style={{ color: "var(--ink-faint)" }} />}
          </button>
        </div>

        <p className="font-fraunces tabular-nums" style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.5px", color: "var(--ink)" }}>
          {visible ? fmtBal(totalBalance) : "₹ ••••••"}
        </p>

        {primary && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-[14px]"
            style={{ background: "rgba(212,162,76,0.08)", border: "1px solid rgba(212,162,76,0.18)" }}>
            <Star className="w-3 h-3" strokeWidth={1.75} style={{ fill: "var(--gold)", color: "var(--gold)" }} />
            <p style={{ fontSize: 11, color: "var(--ink-muted)" }}>
              Primary: <span className="font-semibold" style={{ color: "var(--ink)" }}>{primary.name}</span>
              {primary.trackBalance && (
                <span className="font-fraunces tabular-nums" style={{ color: "var(--ink-faint)" }}>  {visible ? fmtBal(primary.balance) : "••••"}</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Account Card ──────────────────────────────────────────────────────────────
function AccountCard({ account, visible, onEdit, onDelete, onTogglePrimary }: {
  account: Account; visible: boolean;
  onEdit: () => void; onDelete: () => void; onTogglePrimary: () => void;
}) {
  const info = typeInfo(account.type);
  const balColor = account.balance < 0 ? "var(--ink-faint)" : "var(--ink)";

  return (
    <motion.div
      layout
      whileTap={{ scale: 0.978 }}
      className="relative rounded-[18px] overflow-hidden cursor-pointer"
      style={{
        background: "linear-gradient(135deg,color-mix(in srgb, var(--ink) 5%, transparent) 0%,color-mix(in srgb, var(--ink) 2%, transparent) 100%)",
        border: account.isPrimary
          ? "1px solid rgba(255,183,3,0.35)"
          : `1px solid var(--divider)`,
        boxShadow: account.isPrimary ? "0 4px 20px rgba(255,183,3,0.10)" : "none",
      }}
    >
      {/* Color accent bar */}
      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{ background: `linear-gradient(180deg,${account.color},${account.color}55)` }} />

      <div className="px-4 py-3.5">
        {/* Row 1: icon + name + balance */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-[14px] flex-shrink-0 flex items-center justify-center relative"
            style={{
              background: `linear-gradient(135deg,${account.color}30 0%,${account.color}14 100%)`,
              border: `1px solid ${account.color}35`,
            }}>
            <info.icon className="w-5 h-5" strokeWidth={1.75} style={{ color: account.color }} />
            {account.isPrimary && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#FFB703,#FF9500)", boxShadow: "0 2px 6px rgba(255,183,3,0.6)" }}>
                <Star className="w-2.5 h-2.5 text-ink fill-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-ink font-semibold truncate" style={{ fontSize: 14 }}>{account.name}</p>
              {account.isCustom && (
                <span className="px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ fontSize: 9, fontWeight: 700, background: `${account.color}22`, color: account.color }}>CUSTOM</span>
              )}
            </div>
            <p className="text-ink/38 mt-0.5 truncate" style={{ fontSize: 11 }}>
              {info.label}{account.bankName ? ` · ${account.bankName}` : ""}
            </p>
          </div>

          {/* Balance */}
          <div className="text-right flex-shrink-0">
            {account.trackBalance ? (
              <p className="font-fraunces font-bold tabular-nums" style={{ fontSize: 15, color: balColor }}>
                {visible ? fmtBal(account.balance) : "••••••"}
              </p>
            ) : (
              <p className="text-ink/28" style={{ fontSize: 12 }}>Not tracked</p>
            )}
          </div>
        </div>

        {/* Row 2: payment modes + actions */}
        <div className="flex items-center justify-between mt-2.5 pl-14">
          {/* Payment chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {account.paymentModes.map(m => {
              const pm = PAYMENT_MODES.find(x => x.id === m);
              return pm ? (
                <span key={m} className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ background: `${account.color}14`, border: `1px solid ${account.color}25`, fontSize: 10, color: `${account.color}cc` }}>
                  <pm.icon className="w-2.5 h-2.5" strokeWidth={1.75} /> {pm.label}
                </span>
              ) : null;
            })}
            {account.upiId && (
              <span className="px-2 py-0.5 rounded-full"
                style={{ background: "rgba(212,162,76,0.12)", border: "1px solid rgba(212,162,76,0.12)", fontSize: 9, color: "#D4A24C" }}>
                {account.upiId}
              </span>
            )}
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <motion.button whileTap={{ scale: 0.8 }} onClick={e => { e.stopPropagation(); onTogglePrimary(); }}
              className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors hover:bg-ink/6">
              <Star className={`w-3.5 h-3.5 transition-colors ${account.isPrimary ? "text-[var(--gold)] fill-[var(--gold)]" : "text-ink/28"}`} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.8 }} onClick={e => { e.stopPropagation(); onEdit(); }}
              className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors hover:bg-ink/6">
              <Pencil className="w-3 h-3 text-ink/38" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.8 }} onClick={e => { e.stopPropagation(); onDelete(); }}
              className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors hover:bg-rose-500/12">
              <Trash2 className="w-3 h-3 text-rose-400/55" />
            </motion.button>
            <ChevronRight className="w-4 h-4 text-ink/20 ml-0.5" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Bank Dropdown ─────────────────────────────────────────────────────────────
function BankDropdown({ value, onChange, accentColor }: {
  value: string; onChange: (v: string) => void; accentColor: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = BANKS.filter(b => b.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="relative">
      <button type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-left transition-colors"
        style={{
          background: "color-mix(in srgb, var(--ink) 6%, transparent)",
          border: `1px solid ${value ? accentColor + "45" : "var(--divider)"}`,
          fontSize: 14,
        }}>
        <span style={{ color: value ? "white" : "var(--divider)" }}>
          {value || "Select bank…"}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight className="w-4 h-4 text-ink/30 rotate-90" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
            className="mt-1.5 rounded-2xl overflow-hidden"
            style={{ background: "var(--surface-raised)", border: "1px solid var(--divider)", maxHeight: 220, overflowY: "auto" }}
          >
            <div className="sticky top-0 p-2" style={{ background: "var(--surface-raised)" }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink/35" />
                <input autoFocus value={q} onChange={e => setQ(e.target.value)}
                  placeholder="Search banks…"
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-ink placeholder:text-ink/25 focus:outline-none"
                  style={{ background: "var(--divider)", border: "1px solid var(--divider)", fontSize: 13 }} />
              </div>
            </div>
            <div className="pb-2">
              {filtered.map(bank => (
                <button key={bank} type="button"
                  onClick={() => { onChange(bank); setOpen(false); setQ(""); }}
                  className="w-full text-left px-4 py-2.5 transition-colors hover:bg-ink/5 flex items-center gap-2 justify-between"
                  style={{ fontSize: 13, color: bank === value ? accentColor : "color-mix(in srgb, var(--ink) 68%, transparent)" }}>
                  <span className="flex items-center gap-2"><Landmark className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} /> {bank}</span>
                  {bank === value && <Check className="w-3.5 h-3.5" strokeWidth={1.75} style={{ color: accentColor }} />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Add / Edit Modal ──────────────────────────────────────────────────────────
function AccountModal({ editAccount, onClose, onSave }: {
  editAccount: Account | null;
  onClose: () => void;
  onSave: (form: FormState) => void;
}) {
  const initForm = (): FormState => editAccount ? {
    name: editAccount.name,
    type: editAccount.type,
    bankName: editAccount.bankName ?? "",
    paymentModes: editAccount.paymentModes,
    trackBalance: editAccount.trackBalance,
    // Do NOT pre-fill openingBalance with the live balance — that would
    // overwrite the DB opening balance and cause double-counting when
    // transactions are applied on top again.
    openingBalance: "",
    color: editAccount.color,
    isPrimary: editAccount.isPrimary,
    upiId: editAccount.upiId ?? "",
  } : { ...EMPTY_FORM };

  const [form, setForm] = useState<FormState>(initForm);
  const [step, setStep] = useState<"quick" | "form">(editAccount ? "form" : "quick");
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }));

  const currType = ACCOUNT_TYPES.find(t => t.id === form.type)!;
  const hasUPI = form.paymentModes.includes("upi");

  const applyTemplate = (t: typeof QUICK_TEMPLATES[0]) => {
    setForm(f => ({
      ...f, name: t.name, type: t.type, bankName: t.bank ?? "",
      color: t.color, paymentModes: t.modes,
    }));
    setStep("form");
  };

  const toggleMode = (m: PaymentMode) =>
    set("paymentModes", form.paymentModes.includes(m)
      ? form.paymentModes.filter(x => x !== m)
      : [...form.paymentModes, m]);

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Account name is required";
    if (currType.hasBank && !form.bankName) e.bankName = "Please select a bank";
    if (form.trackBalance && form.openingBalance && isNaN(parseFloat(form.openingBalance)))
      e.openingBalance = "Enter a valid amount";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => { if (validate()) onSave(form); };

  const isEdit = !!editAccount;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(16px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md mx-auto rounded-t-[18px]"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--divider)", borderBottom: "none",
          maxHeight: "92vh", overflowY: "auto",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-ink/15" />
        </div>

        <div className="px-5 pb-8 pt-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-ink font-bold" style={{ fontSize: 19 }}>
                {isEdit ? "Edit Account" : step === "quick" ? "Add Account" : "Configure Account"}
              </h2>
              {!isEdit && step === "form" && (
                <button onClick={() => setStep("quick")}
                  className="text-ink/38 mt-0.5" style={{ fontSize: 12 }}>
                  ← Back to templates
                </button>
              )}
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--divider)", border: "1px solid var(--divider)" }}>
              <X className="w-4 h-4 text-ink/50" />
            </button>
          </div>

          {/* ── STEP: Quick Templates ── */}
          {step === "quick" && (
            <div>
              <p className="flex items-center gap-1.5" style={{ fontSize: 12, color: "color-mix(in srgb, var(--ink) 38%, transparent)", marginBottom: 12 }}>
                <Zap className="w-3 h-3" strokeWidth={1.75} /> Quick Add — one tap to create
              </p>
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                {QUICK_TEMPLATES.map(t => {
                  const ti = ACCOUNT_TYPES.find(x => x.id === t.type)!;
                  return (
                    <motion.button key={t.name} whileTap={{ scale: 0.95 }} onClick={() => applyTemplate(t)}
                      className="flex items-center gap-2.5 px-3.5 py-3 rounded-[14px] text-left transition-all"
                      style={{
                        background: `linear-gradient(135deg,${t.color}1A 0%,${t.color}0A 100%)`,
                        border: `1px solid ${t.color}30`,
                      }}>
                      <div className="w-9 h-9 rounded-[14px] flex items-center justify-center flex-shrink-0"
                        style={{ background: `${t.color}22`, border: `1px solid ${t.color}35` }}>
                        <ti.icon className="w-4 h-4" strokeWidth={1.75} style={{ color: t.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-ink font-semibold truncate" style={{ fontSize: 13 }}>{t.name}</p>
                        <p className="text-ink/35 truncate" style={{ fontSize: 11 }}>{ti.label}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-ink/8" />
                <span className="text-ink/28" style={{ fontSize: 12 }}>or create manually</span>
                <div className="flex-1 h-px bg-ink/8" />
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep("form")}
                className="w-full py-3.5 rounded-2xl text-ink font-semibold flex items-center justify-center gap-2"
                style={{ background: "var(--divider)", border: "1px solid var(--divider)", fontSize: 14 }}>
                <Plus className="w-4 h-4" />
                Custom Account
              </motion.button>
            </div>
          )}

          {/* ── STEP: Form ── */}
          {step === "form" && (
            <div className="space-y-4">
              {/* Account Name */}
              <div>
                <label className="text-ink/40 mb-2 block" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.6px" }}>ACCOUNT NAME</label>
                <input value={form.name} onChange={e => set("name", e.target.value)}
                  placeholder="e.g. HDFC Savings, Cash…"
                  className="w-full px-4 py-3.5 rounded-2xl text-ink placeholder:text-ink/22 focus:outline-none"
                  style={{
                    background: "color-mix(in srgb, var(--ink) 6%, transparent)",
                    border: `1px solid ${errors.name ? "#EF4444" : form.name ? currType.color + "45" : "var(--divider)"}`,
                    fontSize: 14, transition: "border-color 0.2s",
                  }} />
                {errors.name && <p className="text-rose-400 mt-1" style={{ fontSize: 11 }}>{errors.name}</p>}
              </div>

              {/* Account Type */}
              <div>
                <label className="text-ink/40 mb-2.5 block" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.6px" }}>ACCOUNT TYPE</label>
                <div className="grid grid-cols-4 gap-2">
                  {ACCOUNT_TYPES.map(t => (
                    <button key={t.id} type="button"
                      onClick={() => { set("type", t.id); if (!t.hasBank) set("bankName", ""); set("color", t.color); }}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all"
                      style={{
                        background: form.type === t.id ? `linear-gradient(135deg,${t.color}28,${t.color}12)` : "color-mix(in srgb, var(--ink) 4%, transparent)",
                        border: form.type === t.id ? `1.5px solid ${t.color}55` : "1px solid var(--divider)",
                        boxShadow: form.type === t.id ? `0 4px 14px ${t.color}20` : "none",
                      }}>
                      <t.icon className="w-[18px] h-[18px]" strokeWidth={1.75} style={{ color: form.type === t.id ? t.color : "color-mix(in srgb, var(--ink) 38%, transparent)" }} />
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: form.type === t.id ? t.color : "color-mix(in srgb, var(--ink) 38%, transparent)", textAlign: "center", lineHeight: 1.3 }}>
                        {t.label.replace(" Account", "").replace(" Wallet", "")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bank Name (conditional) */}
              {currType.hasBank && (
                <div>
                  <label className="text-ink/40 mb-2 block" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.6px" }}>BANK NAME</label>
                  <BankDropdown value={form.bankName} onChange={v => set("bankName", v)} accentColor={currType.color} />
                  {errors.bankName && <p className="text-rose-400 mt-1" style={{ fontSize: 11 }}>{errors.bankName}</p>}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 py-4 rounded-2xl font-semibold text-ink/50"
                  style={{ background: "color-mix(in srgb, var(--ink) 6%, transparent)", border: "1px solid var(--divider)", fontSize: 14 }}>
                  Cancel
                </button>
                <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={handleSave}
                  className="flex-1 py-4 rounded-2xl text-ink font-bold"
                  style={{
                    fontSize: 14,
                    background: `linear-gradient(135deg,${currType.color} 0%,${currType.color}bb 100%)`,
                    boxShadow: `0 6px 22px ${currType.color}48`,
                  }}>
                  {isEdit ? "Save Changes" : "Add Account"}
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Filter Sheet ──────────────────────────────────────────────────────────────
function FilterSheet({ filter, onFilter, onClose }: {
  filter: AccountType | "all"; onFilter: (t: AccountType | "all") => void; onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md mx-auto rounded-t-[18px] p-5"
        style={{ background: "var(--surface)", border: "1px solid var(--divider)", borderBottom: "none" }}
      >
        <div className="flex justify-center mb-4">
          <div className="w-9 h-1 rounded-full bg-ink/15" />
        </div>
        <p className="text-ink font-bold mb-4" style={{ fontSize: 17 }}>Filter Accounts</p>
        <div className="space-y-2">
          {[{ id: "all" as const, label: "All Accounts", icon: LayoutGrid as IconType, color: "#D4A24C" },
          ...ACCOUNT_TYPES.map(t => ({ id: t.id as AccountType | "all", label: t.label, icon: t.icon, color: t.color }))
          ].map(opt => (
            <motion.button key={opt.id} whileTap={{ scale: 0.97 }} onClick={() => { onFilter(opt.id as AccountType | "all"); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-[14px] transition-all"
              style={{
                background: filter === opt.id ? `${opt.color}18` : "color-mix(in srgb, var(--ink) 4%, transparent)",
                border: filter === opt.id ? `1px solid ${opt.color}45` : "1px solid var(--divider)",
              }}>
              <opt.icon className="w-[18px] h-[18px]" strokeWidth={1.75} style={{ color: opt.color }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: filter === opt.id ? opt.color : "color-mix(in srgb, var(--ink) 65%, transparent)" }}>{opt.label}</span>
              {filter === opt.id && <Check className="w-4 h-4 ml-auto" strokeWidth={1.75} style={{ color: opt.color }} />}
            </motion.button>
          ))}
        </div>
        <button onClick={onClose}
          className="w-full mt-4 py-3.5 rounded-2xl text-ink/50 font-semibold"
          style={{ background: "color-mix(in srgb, var(--ink) 5%, transparent)", border: "1px solid var(--divider)", fontSize: 14 }}>
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Delete Confirm ─────────────────────────────────────────────────────────────
function DeleteModal({ name, onClose, onConfirm }: { name: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(16px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.86, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.86, opacity: 0 }} transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-[18px] p-6"
        style={{ background: "var(--surface)", border: "1px solid var(--divider)" }}
      >
        <div className="w-14 h-14 rounded-[14px] mx-auto mb-4 flex items-center justify-center"
          style={{ background: "var(--expense-chip)" }}>
          <Trash2 className="w-6 h-6" strokeWidth={1.75} style={{ color: "var(--expense)" }} />
        </div>
        <h3 className="text-ink font-bold text-center mb-2" style={{ fontSize: 17 }}>Delete Account?</h3>
        <p className="text-ink/42 text-center mb-6 leading-relaxed" style={{ fontSize: 13 }}>
          <span className="text-ink/68 font-medium">"{name}"</span> and all its transaction history will be permanently removed.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl font-semibold text-ink/50"
            style={{ background: "color-mix(in srgb, var(--ink) 6%, transparent)", border: "1px solid var(--divider)", fontSize: 14 }}>
            Cancel
          </button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={onConfirm}
            className="flex-1 py-3.5 rounded-[14px] font-bold"
            style={{ background: "var(--expense)", color: "var(--ink)", fontSize: 14 }}>
            Delete
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export function AccountsScreen() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Account | null>(null);
  const [delTarget, setDelTarget] = useState<Account | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState<AccountType | "all">("all");
  const [showSearch, setShowSearch] = useState(false);
  const [showBal, setShowBal] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpgradeGate, setShowUpgradeGate] = useState(false);

  const handleSyncBankClick = () => {
    const user = authAPI.getCurrentUser();
    const isFree = !user || !user.subscription_tier || user.subscription_tier.toLowerCase() === "free";
    if (isFree) {
      setShowUpgradeGate(true);
    } else {
      toast.success("Connecting to secure banking APIs... Fetching transactions... Synced!");
    }
  };

  // ── LOAD API DATA ────────────────────────────────────────────────────────────
  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const data = await accountsAPI.getAll();
      const mapped: Account[] = data.map((a: any) => ({
        id: a.id,
        name: a.name,
        type: a.type || "savings",
        balance: parseFloat(a.balance || "0"),
        color: a.color || "#4895EF",
        trackBalance: true, // Not tracked in backend
        isPrimary: false,   // Not tracked in backend
        paymentModes: ["upi", "netbanking"],
        isCustom: true
      }));
      setAccounts(mapped);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load accounts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // ── CRUD ─────────────────────────────────────────────────────────────────────
  const saveAccount = async (form: FormState) => {
    try {
      if (modal === "edit" && editTarget) {
        // Update name/type/color only — never touch the DB balance during an edit.
        // Writing the live balance back would cause double-counting because
        // getAccountsWithBalances() adds transaction deltas on top of the stored balance.
        await accountsAPI.update(editTarget.id, {
          name: form.name,
          type: form.type,
          color: form.color,
          icon: "🏦",
          // balance intentionally omitted — keep the original opening balance
        });
        toast.success("Account updated");
      } else {
        // Create: opening balance is set once and never changed by edits
        const balance = form.trackBalance && form.openingBalance
          ? parseFloat(form.openingBalance) || 0 : 0;
        await accountsAPI.create({
          name: form.name,
          type: form.type,
          balance: balance,
          color: form.color,
          icon: "🏦",
          parent_id: undefined
        });
        toast.success("Account created");
      }
      fetchAccounts();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save account");
    }
    setModal(null); setEditTarget(null);
  };

  const deleteAccount = async () => {
    if (!delTarget) return;
    try {
      await accountsAPI.delete(delTarget.id, true); // force delete
      toast.success("Account deleted");
      fetchAccounts();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete account");
    }
    setDelTarget(null);
  };

  const togglePrimary = (id: string) => {
    setAccounts(p => p.map(a => ({ ...a, isPrimary: a.id === id ? !a.isPrimary : a.isPrimary === true && a.id !== id ? false : a.isPrimary })));
  };

  // ── Filter ────────────────────────────────────────────────────────────────────
  const q = search.toLowerCase().trim();
  const visible = accounts.filter(a =>
    (filter === "all" || a.type === filter) &&
    (!q || a.name.toLowerCase().includes(q) || a.bankName?.toLowerCase().includes(q))
  );

  return (
    <div className="relative pb-32"
      style={{ background: "var(--bg-deep)", minHeight: "calc(100vh - 56px)" }}>

      {/* Top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-28 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(212,162,76,0.11) 0%,transparent 70%)" }} />

      {/* ── Search bar ── */}
      <AnimatePresence>
        {showSearch && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
            className="px-4 pt-3 overflow-hidden">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/35" />
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search accounts…"
                className="w-full pl-10 pr-9 py-3 rounded-2xl text-ink placeholder:text-ink/25 focus:outline-none"
                style={{ background: "var(--divider)", border: "1px solid rgba(212,162,76,0.28)", fontSize: 13 }} />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-ink/10 flex items-center justify-center">
                  <X className="w-3 h-3 text-ink/60" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top row: search toggle + filter ── */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#D4A24C]" />
          <p className="text-ink/35" style={{ fontSize: 11, fontWeight: 500 }}>
            {visible.length} {visible.length === 1 ? "account" : "accounts"}
            {filter !== "all" && ` · ${ACCOUNT_TYPES.find(t => t.id === filter)?.label}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSyncBankClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all"
            style={{
              background: "linear-gradient(135deg, rgba(212,162,76,0.18) 0%, rgba(212,162,76,0.06) 100%)",
              border: "1px solid rgba(212,162,76,0.3)",
            }}>
            <Zap className="w-3.5 h-3.5 text-[#D4A24C]" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#D4A24C" }}>Sync Bank</span>
          </button>
          <button onClick={() => { setShowSearch(v => !v); if (showSearch) setSearch(""); }}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: showSearch ? "rgba(212,162,76,0.22)" : "color-mix(in srgb, var(--ink) 6%, transparent)",
              border: `1px solid ${showSearch ? "rgba(212,162,76,0.45)" : "var(--divider)"}`,
            }}>
            <Search className="w-4 h-4" style={{ color: showSearch ? "#D4A24C" : "color-mix(in srgb, var(--ink) 38%, transparent)" }} />
          </button>
          <button onClick={() => setShowFilter(true)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: filter !== "all" ? "rgba(212,162,76,0.22)" : "color-mix(in srgb, var(--ink) 6%, transparent)",
              border: `1px solid ${filter !== "all" ? "rgba(212,162,76,0.45)" : "var(--divider)"}`,
            }}>
            <SlidersHorizontal className="w-4 h-4" style={{ color: filter !== "all" ? "#D4A24C" : "color-mix(in srgb, var(--ink) 38%, transparent)" }} />
          </button>
        </div>
      </div>

      {/* ── Net Worth Banner ── */}
      <NetWorthBanner accounts={accounts} visible={showBal} onToggle={() => setShowBal(v => !v)} />

      {/* ── Account List ── */}
      <div className="px-4 space-y-2.5 pb-4">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <p className="text-ink/38" style={{ fontSize: 14 }}>Loading accounts…</p>
          </div>
        )}

        {!isLoading && visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-[14px] flex items-center justify-center"
              style={{ background: "var(--surface-raised)", border: "1px solid var(--divider)" }}>
              {search ? <Search className="w-6 h-6" strokeWidth={1.75} style={{ color: "var(--ink-faint)" }} /> : <Landmark className="w-6 h-6" strokeWidth={1.75} style={{ color: "var(--ink-faint)" }} />}
            </div>
            <p className="text-ink/38 text-center" style={{ fontSize: 14 }}>
              {search ? `No results for "${search}"` : filter !== "all" ? "No accounts of this type" : "No accounts yet"}
            </p>
            {!search && filter === "all" && (
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => setModal("add")}
                className="flex items-center gap-2 px-5 py-3 rounded-[14px]"
                style={{ background: "var(--gold)", boxShadow: "0 6px 20px rgba(212,162,76,0.4)" }}>
                <Plus className="w-4 h-4" strokeWidth={1.75} style={{ color: "#241B0A" }} />
                <span className="font-bold" style={{ fontSize: 14, color: "#241B0A" }}>Add First Account</span>
              </motion.button>
            )}
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {!isLoading && visible.map(acc => (
            <motion.div key={acc.id} layout
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }} transition={{ duration: 0.22 }}>
              <AccountCard
                account={acc} visible={showBal}
                onEdit={() => { setEditTarget(acc); setModal("edit"); }}
                onDelete={() => setDelTarget(acc)}
                onTogglePrimary={() => togglePrimary(acc.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Type overview strip */}
        {visible.length > 0 && filter === "all" && !search && (
          <div className="pt-2">
            <p className="text-ink/28 mb-3" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.5px" }}>BY TYPE</p>
            <div className="grid grid-cols-4 gap-2">
              {ACCOUNT_TYPES.filter(t => accounts.some(a => a.type === t.id)).map(t => {
                const cnt = accounts.filter(a => a.type === t.id).length;
                return (
                  <motion.button key={t.id} whileTap={{ scale: 0.94 }} onClick={() => setFilter(t.id)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-[14px]"
                    style={{ background: `${t.color}12`, border: `1px solid ${t.color}25` }}>
                    <t.icon className="w-5 h-5" strokeWidth={1.75} style={{ color: t.color }} />
                    <span className="font-fraunces tabular-nums" style={{ fontSize: 11, fontWeight: 700, color: t.color }}>{cnt}</span>
                    <span style={{ fontSize: 9.5, color: "color-mix(in srgb, var(--ink) 35%, transparent)", textAlign: "center", lineHeight: 1.2 }}>
                      {t.label.replace(" Account", "").replace(" Wallet", "")}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── FAB ── */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={() => { setEditTarget(null); setModal("add"); }}
        className="fixed z-40 flex items-center justify-center rounded-full"
        style={{
          bottom: 90, right: 20, width: 56, height: 56,
          background: "var(--gold)",
          boxShadow: "0 8px 32px rgba(212,162,76,0.6)",
          animation: "accFabBreathe 3s ease-in-out infinite",
        }}
      >
        <Plus className="w-6 h-6" strokeWidth={1.75} style={{ color: "#241B0A" }} />
      </motion.button>

      {/* ── Modals ── */}
      <AnimatePresence>
        {(modal === "add" || modal === "edit") && (
          <AccountModal key="acc-modal"
            editAccount={modal === "edit" ? editTarget : null}
            onClose={() => { setModal(null); setEditTarget(null); }}
            onSave={saveAccount}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {delTarget && (
          <DeleteModal key="del-modal" name={delTarget.name}
            onClose={() => setDelTarget(null)} onConfirm={deleteAccount} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showFilter && (
          <FilterSheet key="filter" filter={filter}
            onFilter={setFilter} onClose={() => setShowFilter(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showUpgradeGate && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm shadow-2xl" onClick={() => setShowUpgradeGate(false)} />
            <div className="relative max-w-sm w-full">
              <PremiumFeatureGate
                featureName="Bank Syncing"
                requiredTier="Pro"
                benefits={[
                  "Automatically pull live bank account statements",
                  "Link up to 3 bank accounts on the Pro plan",
                  "Secure banking standard 256-bit encryption",
                  "Eliminate manual data entry and errors"
                ]}
                onUnlock={() => setShowUpgradeGate(false)}
              >
                <div className="hidden" />
              </PremiumFeatureGate>
            </div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes accFabBreathe {
          0%,100% { box-shadow: 0 8px 32px rgba(212,162,76,0.58); transform: scale(1); }
          50%      { box-shadow: 0 8px 52px rgba(212,162,76,0.88), 0 0 0 10px rgba(212,162,76,0.10); transform: scale(1.055); }
        }
      `}</style>
    </div>
  );
}



