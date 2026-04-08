import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, X, Check, Search, ChevronRight, Eye, EyeOff,
  Pencil, Trash2, Star, Crown, SlidersHorizontal, TrendingUp, TrendingDown,
} from "lucide-react";

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
const ACCOUNT_TYPES: { id: AccountType; label: string; emoji: string; color: string; hasBank: boolean }[] = [
  { id: "savings",    label: "Savings Account",    emoji: "🏦", color: "#4895EF", hasBank: true  },
  { id: "current",    label: "Current Account",    emoji: "💼", color: "#7C5CFF", hasBank: true  },
  { id: "credit",     label: "Credit Card",        emoji: "💳", color: "#F72585", hasBank: true  },
  { id: "liability",  label: "Liability Account",  emoji: "💸", color: "#EF4444", hasBank: true  },
  { id: "investment", label: "Investment Account", emoji: "📈", color: "#2EC4B6", hasBank: true  },
  { id: "salary",     label: "Salary Account",     emoji: "💰", color: "#22C55E", hasBank: true  },
  { id: "cash",       label: "Cash Wallet",        emoji: "💵", color: "#FFB703", hasBank: false },
];

const PAYMENT_MODES = [
  { id: "upi"        as PaymentMode, label: "UPI",         emoji: "📲" },
  { id: "netbanking" as PaymentMode, label: "Net Banking", emoji: "🌐" },
  { id: "cheque"     as PaymentMode, label: "Cheque",      emoji: "📄" },
  { id: "cash"       as PaymentMode, label: "Cash",        emoji: "💵" },
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
  "#4895EF","#22C55E","#F72585","#FFB703",
  "#7C5CFF","#F7931A","#2EC4B6","#EF4444",
  "#C77DFF","#FF6B9D","#4CC9F0","#06D6A0",
];

const QUICK_TEMPLATES = [
  { name: "HDFC Savings",  type: "savings"  as AccountType, bank: "HDFC Bank",                 emoji: "🏦", color: "#4895EF", modes: ["upi","netbanking"]       as PaymentMode[] },
  { name: "SBI Savings",   type: "savings"  as AccountType, bank: "State Bank of India (SBI)", emoji: "🏦", color: "#22C55E", modes: ["upi","netbanking","cheque"] as PaymentMode[] },
  { name: "Credit Card",   type: "credit"   as AccountType, bank: "ICICI Bank",                emoji: "💳", color: "#F72585", modes: ["netbanking"]              as PaymentMode[] },
  { name: "Cash Wallet",   type: "cash"     as AccountType, bank: "",                          emoji: "💵", color: "#FFB703", modes: ["cash"]                   as PaymentMode[] },
  { name: "Kotak Savings", type: "savings"  as AccountType, bank: "Kotak Mahindra Bank",       emoji: "🏦", color: "#845EC2", modes: ["upi","netbanking"]       as PaymentMode[] },
  { name: "Investment A/C",type: "investment"as AccountType, bank: "HDFC Bank",                emoji: "📈", color: "#2EC4B6", modes: ["netbanking"]             as PaymentMode[] },
];

const EMPTY_FORM: FormState = {
  name: "", type: "savings", bankName: "", paymentModes: ["upi","netbanking"],
  trackBalance: true, openingBalance: "", color: "#4895EF", isPrimary: false, upiId: "",
};

// ─── Default Accounts ──────────────────────────────────────────────────────────
const DEFAULT_ACCOUNTS: Account[] = [
  {
    id:"a1", name:"HDFC Savings",      type:"savings",    bankName:"HDFC Bank",
    balance:0,   trackBalance:true, color:"#4895EF", isPrimary:true,
    paymentModes:["upi","netbanking"], upiId:"user@hdfc",
  },
  {
    id:"a2", name:"SBI Salary A/C",    type:"salary",     bankName:"State Bank of India (SBI)",
    balance:0,  trackBalance:true, color:"#22C55E", isPrimary:false,
    paymentModes:["upi","netbanking","cheque"], upiId:"user@sbi",
  },
  {
    id:"a3", name:"ICICI Credit Card", type:"credit",     bankName:"ICICI Bank",
    balance:0,  trackBalance:true, color:"#F72585", isPrimary:false,
    paymentModes:["netbanking"],
  },
  {
    id:"a4", name:"Cash Wallet",       type:"cash",
    balance:0,    trackBalance:true, color:"#FFB703", isPrimary:false,
    paymentModes:["cash"],
  },
];

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
  const assets = tracked.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0);
  const debt   = tracked.filter(a => a.balance < 0).reduce((s, a) => s + Math.abs(a.balance), 0);
  const net    = assets - debt;
  const primary = accounts.find(a => a.isPrimary);

  return (
    <div className="mx-4 mb-4 rounded-3xl overflow-hidden relative"
      style={{
        background: "linear-gradient(135deg,#1A1F35 0%,#0E1424 100%)",
        border: "1px solid rgba(124,92,255,0.2)",
        boxShadow: "0 8px 32px rgba(124,92,255,0.12)",
      }}>
      {/* Glow orb */}
      <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(124,92,255,0.18) 0%,transparent 70%)" }} />
      <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(76,201,240,0.12) 0%,transparent 70%)" }} />

      <div className="relative z-10 p-5">
        <div className="flex items-start justify-between mb-1">
          <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.38)", letterSpacing:"0.6px" }}>NET WORTH</p>
          <button onClick={onToggle}
            className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)" }}>
            {visible ? <Eye className="w-3.5 h-3.5 text-white/50" /> : <EyeOff className="w-3.5 h-3.5 text-white/50" />}
          </button>
        </div>

        <p className="text-white font-bold mb-4" style={{ fontSize:28, letterSpacing:"-0.5px" }}>
          {visible ? fmtBal(net) : "₹ ••••••"}
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl px-3.5 py-3"
            style={{ background:"rgba(34,197,94,0.10)", border:"1px solid rgba(34,197,94,0.18)" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3 h-3" style={{ color:"#22C55E" }} />
              <span style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.38)" }}>ASSETS</span>
            </div>
            <p className="font-bold" style={{ fontSize:15, color:"#4ADE80" }}>
              {visible ? fmtBal(assets) : "••••••"}
            </p>
          </div>
          <div className="rounded-2xl px-3.5 py-3"
            style={{ background:"rgba(239,68,68,0.10)", border:"1px solid rgba(239,68,68,0.18)" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-3 h-3" style={{ color:"#EF4444" }} />
              <span style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.38)" }}>DEBT</span>
            </div>
            <p className="font-bold" style={{ fontSize:15, color:"#F87171" }}>
              {visible ? fmtBal(debt) : "••••••"}
            </p>
          </div>
        </div>

        {primary && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-2xl"
            style={{ background:"rgba(255,183,3,0.08)", border:"1px solid rgba(255,183,3,0.18)" }}>
            <Star className="w-3 h-3 fill-[#FFB703] text-[#FFB703]" />
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.55)" }}>
              Primary: <span className="text-white/80 font-semibold">{primary.name}</span>
              {primary.trackBalance && (
                <span style={{ color:"#4ADE80" }}>  {visible ? fmtBal(primary.balance) : "••••"}</span>
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
  const balColor = account.balance < 0 ? "#F87171" : "#4ADE80";

  return (
    <motion.div
      layout
      whileTap={{ scale: 0.978 }}
      className="relative rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: "linear-gradient(135deg,rgba(255,255,255,0.048) 0%,rgba(255,255,255,0.020) 100%)",
        border: account.isPrimary
          ? "1px solid rgba(255,183,3,0.35)"
          : `1px solid rgba(255,255,255,0.07)`,
        boxShadow: account.isPrimary ? "0 4px 20px rgba(255,183,3,0.10)" : "none",
      }}
    >
      {/* Color accent bar */}
      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{ background: `linear-gradient(180deg,${account.color},${account.color}55)` }} />

      <div className="px-4 py-3.5">
        {/* Row 1: icon + name + balance */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl relative"
            style={{
              background: `linear-gradient(135deg,${account.color}30 0%,${account.color}14 100%)`,
              border: `1px solid ${account.color}35`,
            }}>
            {info.emoji}
            {account.isPrimary && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background:"linear-gradient(135deg,#FFB703,#FF9500)", boxShadow:"0 2px 6px rgba(255,183,3,0.6)" }}>
                <Star className="w-2.5 h-2.5 text-white fill-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-white font-semibold truncate" style={{ fontSize:14 }}>{account.name}</p>
              {account.isCustom && (
                <span className="px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ fontSize:9, fontWeight:700, background:`${account.color}22`, color:account.color }}>CUSTOM</span>
              )}
            </div>
            <p className="text-white/38 mt-0.5 truncate" style={{ fontSize:11 }}>
              {info.label}{account.bankName ? ` · ${account.bankName}` : ""}
            </p>
          </div>

          {/* Balance */}
          <div className="text-right flex-shrink-0">
            {account.trackBalance ? (
              <p className="font-bold" style={{ fontSize:15, color: balColor }}>
                {visible ? fmtBal(account.balance) : "••••••"}
              </p>
            ) : (
              <p className="text-white/28" style={{ fontSize:12 }}>Not tracked</p>
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
                  style={{ background:`${account.color}14`, border:`1px solid ${account.color}25`, fontSize:10, color:`${account.color}cc` }}>
                  {pm.emoji} {pm.label}
                </span>
              ) : null;
            })}
            {account.upiId && (
              <span className="px-2 py-0.5 rounded-full"
                style={{ background:"rgba(76,201,240,0.12)", border:"1px solid rgba(76,201,240,0.22)", fontSize:9, color:"#4CC9F0" }}>
                {account.upiId}
              </span>
            )}
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <motion.button whileTap={{ scale:0.8 }} onClick={e => { e.stopPropagation(); onTogglePrimary(); }}
              className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors hover:bg-white/6">
              <Star className={`w-3.5 h-3.5 transition-colors ${account.isPrimary ? "text-[#FFB703] fill-[#FFB703]" : "text-white/28"}`} />
            </motion.button>
            <motion.button whileTap={{ scale:0.8 }} onClick={e => { e.stopPropagation(); onEdit(); }}
              className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors hover:bg-white/6">
              <Pencil className="w-3 h-3 text-white/38" />
            </motion.button>
            <motion.button whileTap={{ scale:0.8 }} onClick={e => { e.stopPropagation(); onDelete(); }}
              className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors hover:bg-rose-500/12">
              <Trash2 className="w-3 h-3 text-rose-400/55" />
            </motion.button>
            <ChevronRight className="w-4 h-4 text-white/20 ml-0.5" />
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
  const [open, setOpen]   = useState(false);
  const [q, setQ]         = useState("");
  const filtered = BANKS.filter(b => b.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="relative">
      <button type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-left transition-colors"
        style={{
          background:"rgba(255,255,255,0.055)",
          border:`1px solid ${value ? accentColor + "45" : "rgba(255,255,255,0.10)"}`,
          fontSize:14,
        }}>
        <span style={{ color: value ? "white" : "rgba(255,255,255,0.25)" }}>
          {value || "Select bank…"}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration:0.2 }}>
          <ChevronRight className="w-4 h-4 text-white/30 rotate-90" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
            exit={{ height:0, opacity:0 }} transition={{ duration:0.22 }}
            className="mt-1.5 rounded-2xl overflow-hidden"
            style={{ background:"#131D30", border:"1px solid rgba(255,255,255,0.10)", maxHeight:220, overflowY:"auto" }}
          >
            <div className="sticky top-0 p-2" style={{ background:"#131D30" }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/35" />
                <input autoFocus value={q} onChange={e => setQ(e.target.value)}
                  placeholder="Search banks…"
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-white placeholder:text-white/25 focus:outline-none"
                  style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.10)", fontSize:13 }} />
              </div>
            </div>
            <div className="pb-2">
              {filtered.map(bank => (
                <button key={bank} type="button"
                  onClick={() => { onChange(bank); setOpen(false); setQ(""); }}
                  className="w-full text-left px-4 py-2.5 transition-colors hover:bg-white/5 flex items-center justify-between"
                  style={{ fontSize:13, color: bank === value ? accentColor : "rgba(255,255,255,0.68)" }}>
                  <span>🏦 {bank}</span>
                  {bank === value && <Check className="w-3.5 h-3.5" style={{ color:accentColor }} />}
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
    name:          editAccount.name,
    type:          editAccount.type,
    bankName:      editAccount.bankName ?? "",
    paymentModes:  editAccount.paymentModes,
    trackBalance:  editAccount.trackBalance,
    openingBalance:editAccount.trackBalance ? String(Math.abs(editAccount.balance)) : "",
    color:         editAccount.color,
    isPrimary:     editAccount.isPrimary,
    upiId:         editAccount.upiId ?? "",
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
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ background:"rgba(0,0,0,0.82)", backdropFilter:"blur(16px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y:"100%" }} animate={{ y:0 }} exit={{ y:"100%" }}
        transition={{ duration:0.32, ease:[0.4,0,0.2,1] }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md mx-auto rounded-t-3xl"
        style={{
          background:"linear-gradient(180deg,#16203A 0%,#0E1424 100%)",
          border:"1px solid rgba(255,255,255,0.09)", borderBottom:"none",
          maxHeight:"92vh", overflowY:"auto",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-white/15" />
        </div>

        <div className="px-5 pb-8 pt-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white font-bold" style={{ fontSize:19 }}>
                {isEdit ? "Edit Account" : step === "quick" ? "Add Account" : "Configure Account"}
              </h2>
              {!isEdit && step === "form" && (
                <button onClick={() => setStep("quick")}
                  className="text-white/38 mt-0.5" style={{ fontSize:12 }}>
                  ← Back to templates
                </button>
              )}
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-2xl flex items-center justify-center"
              style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.09)" }}>
              <X className="w-4 h-4 text-white/50" />
            </button>
          </div>

          {/* ── STEP: Quick Templates ── */}
          {step === "quick" && (
            <div>
              <p style={{ fontSize:12, color:"rgba(255,255,255,0.38)", marginBottom:12 }}>
                ⚡ Quick Add — one tap to create
              </p>
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                {QUICK_TEMPLATES.map(t => {
                  const ti = ACCOUNT_TYPES.find(x => x.id === t.type)!;
                  return (
                    <motion.button key={t.name} whileTap={{ scale:0.95 }} onClick={() => applyTemplate(t)}
                      className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl text-left transition-all"
                      style={{
                        background:`linear-gradient(135deg,${t.color}1A 0%,${t.color}0A 100%)`,
                        border:`1px solid ${t.color}30`,
                      }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background:`${t.color}22`, border:`1px solid ${t.color}35` }}>
                        {ti.emoji}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-semibold truncate" style={{ fontSize:13 }}>{t.name}</p>
                        <p className="text-white/35 truncate" style={{ fontSize:11 }}>{ti.label}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-white/8" />
                <span className="text-white/28" style={{ fontSize:12 }}>or create manually</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>
              <motion.button whileTap={{ scale:0.97 }} onClick={() => setStep("form")}
                className="w-full py-3.5 rounded-2xl text-white font-semibold flex items-center justify-center gap-2"
                style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", fontSize:14 }}>
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
                <label className="text-white/40 mb-2 block" style={{ fontSize:11, fontWeight:700, letterSpacing:"0.6px" }}>ACCOUNT NAME</label>
                <input value={form.name} onChange={e => set("name", e.target.value)}
                  placeholder="e.g. HDFC Savings, Cash…"
                  className="w-full px-4 py-3.5 rounded-2xl text-white placeholder:text-white/22 focus:outline-none"
                  style={{
                    background:"rgba(255,255,255,0.055)",
                    border:`1px solid ${errors.name ? "#EF4444" : form.name ? currType.color+"45" : "rgba(255,255,255,0.10)"}`,
                    fontSize:14, transition:"border-color 0.2s",
                  }} />
                {errors.name && <p className="text-rose-400 mt-1" style={{ fontSize:11 }}>{errors.name}</p>}
              </div>

              {/* Account Type */}
              <div>
                <label className="text-white/40 mb-2.5 block" style={{ fontSize:11, fontWeight:700, letterSpacing:"0.6px" }}>ACCOUNT TYPE</label>
                <div className="grid grid-cols-4 gap-2">
                  {ACCOUNT_TYPES.map(t => (
                    <button key={t.id} type="button"
                      onClick={() => { set("type", t.id); if (!t.hasBank) set("bankName",""); }}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all"
                      style={{
                        background: form.type === t.id ? `linear-gradient(135deg,${t.color}28,${t.color}12)` : "rgba(255,255,255,0.04)",
                        border: form.type === t.id ? `1.5px solid ${t.color}55` : "1px solid rgba(255,255,255,0.07)",
                        boxShadow: form.type === t.id ? `0 4px 14px ${t.color}20` : "none",
                      }}>
                      <span style={{ fontSize:18 }}>{t.emoji}</span>
                      <span style={{ fontSize:9.5, fontWeight:700, color: form.type === t.id ? t.color : "rgba(255,255,255,0.38)", textAlign:"center", lineHeight:1.3 }}>
                        {t.label.replace(" Account","").replace(" Wallet","")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bank Name (conditional) */}
              {currType.hasBank && (
                <div>
                  <label className="text-white/40 mb-2 block" style={{ fontSize:11, fontWeight:700, letterSpacing:"0.6px" }}>BANK NAME</label>
                  <BankDropdown value={form.bankName} onChange={v => set("bankName",v)} accentColor={currType.color} />
                  {errors.bankName && <p className="text-rose-400 mt-1" style={{ fontSize:11 }}>{errors.bankName}</p>}
                </div>
              )}

              {/* Supported Payments */}
              <div>
                <label className="text-white/40 mb-2.5 block" style={{ fontSize:11, fontWeight:700, letterSpacing:"0.6px" }}>SUPPORTED PAYMENTS</label>
                <div className="flex gap-2 flex-wrap">
                  {PAYMENT_MODES.map(m => {
                    const sel = form.paymentModes.includes(m.id);
                    return (
                      <motion.button key={m.id} whileTap={{ scale:0.93 }} type="button"
                        onClick={() => toggleMode(m.id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl transition-all"
                        style={{
                          background: sel ? `${currType.color}22` : "rgba(255,255,255,0.05)",
                          border: sel ? `1px solid ${currType.color}50` : "1px solid rgba(255,255,255,0.09)",
                        }}>
                        <span style={{ fontSize:14 }}>{m.emoji}</span>
                        <span style={{ fontSize:12, fontWeight:600, color: sel ? currType.color : "rgba(255,255,255,0.45)" }}>{m.label}</span>
                        {sel && <Check className="w-3 h-3" style={{ color:currType.color }} />}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* UPI ID (conditional) */}
              {hasUPI && (
                <div>
                  <label className="text-white/40 mb-2 block" style={{ fontSize:11, fontWeight:700, letterSpacing:"0.6px" }}>UPI ID <span className="normal-case font-normal text-white/25">(optional)</span></label>
                  <input value={form.upiId} onChange={e => set("upiId",e.target.value)}
                    placeholder="yourname@upi"
                    className="w-full px-4 py-3 rounded-2xl text-white placeholder:text-white/22 focus:outline-none"
                    style={{ background:"rgba(255,255,255,0.055)", border:"1px solid rgba(255,255,255,0.10)", fontSize:14 }} />
                </div>
              )}

              {/* Track Balance */}
              <div>
                <div className="flex items-center justify-between py-3.5 px-4 rounded-2xl"
                  style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
                  <div>
                    <p className="text-white font-medium" style={{ fontSize:14 }}>Track Balance</p>
                    <p className="text-white/35" style={{ fontSize:11 }}>Monitor this account's balance</p>
                  </div>
                  <motion.button type="button" whileTap={{ scale:0.9 }}
                    onClick={() => set("trackBalance", !form.trackBalance)}
                    className="w-12 h-6 rounded-full relative transition-colors flex-shrink-0"
                    style={{ background: form.trackBalance ? "linear-gradient(135deg,#7C5CFF,#4CC9F0)" : "rgba(255,255,255,0.12)" }}>
                    <motion.div
                      animate={{ x: form.trackBalance ? 24 : 2 }}
                      transition={{ duration:0.22, ease:[0.4,0,0.2,1] }}
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white"
                      style={{ boxShadow:"0 2px 6px rgba(0,0,0,0.3)" }} />
                  </motion.button>
                </div>
              </div>

              {/* Opening Balance (conditional) */}
              <AnimatePresence>
                {form.trackBalance && (
                  <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
                    exit={{ height:0, opacity:0 }} transition={{ duration:0.22 }} style={{ overflow:"hidden" }}>
                    <label className="text-white/40 mb-2 block" style={{ fontSize:11, fontWeight:700, letterSpacing:"0.6px" }}>OPENING BALANCE</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-bold" style={{ fontSize:16 }}>₹</span>
                      <input value={form.openingBalance} onChange={e => set("openingBalance",e.target.value)}
                        placeholder="0.00" inputMode="decimal"
                        className="w-full pl-9 pr-4 py-3.5 rounded-2xl text-white placeholder:text-white/22 focus:outline-none"
                        style={{ background:"rgba(255,255,255,0.055)", border:`1px solid ${errors.openingBalance ? "#EF4444" : "rgba(255,255,255,0.10)"}`, fontSize:16, fontWeight:700 }} />
                    </div>
                    {errors.openingBalance && <p className="text-rose-400 mt-1" style={{ fontSize:11 }}>{errors.openingBalance}</p>}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Color Tag */}
              <div>
                <label className="text-white/40 mb-2.5 block" style={{ fontSize:11, fontWeight:700, letterSpacing:"0.6px" }}>COLOR TAG</label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_TAGS.map(c => (
                    <button key={c} type="button" onClick={() => set("color",c)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                      style={{
                        background:c, opacity: form.color === c ? 1 : 0.45,
                        transform: form.color === c ? "scale(1.18)" : "scale(1)",
                        border: form.color === c ? "2px solid white" : "none",
                        boxShadow: form.color === c ? `0 4px 12px ${c}70` : "none",
                      }}>
                      {form.color === c && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Account */}
              <div>
                <div className="flex items-center justify-between py-3.5 px-4 rounded-2xl"
                  style={{
                    background: form.isPrimary ? "rgba(255,183,3,0.08)" : "rgba(255,255,255,0.04)",
                    border: form.isPrimary ? "1px solid rgba(255,183,3,0.28)" : "1px solid rgba(255,255,255,0.07)",
                  }}>
                  <div className="flex items-center gap-2.5">
                    <Star className={`w-4 h-4 transition-colors ${form.isPrimary ? "text-[#FFB703] fill-[#FFB703]" : "text-white/30"}`} />
                    <div>
                      <p className="text-white font-medium" style={{ fontSize:14 }}>Primary Account ⭐</p>
                      <p className="text-white/35" style={{ fontSize:11 }}>Your main account for transactions</p>
                    </div>
                  </div>
                  <motion.button type="button" whileTap={{ scale:0.9 }}
                    onClick={() => set("isPrimary", !form.isPrimary)}
                    className="w-12 h-6 rounded-full relative transition-colors flex-shrink-0"
                    style={{ background: form.isPrimary ? "linear-gradient(135deg,#FFB703,#FF9500)" : "rgba(255,255,255,0.12)" }}>
                    <motion.div
                      animate={{ x: form.isPrimary ? 24 : 2 }}
                      transition={{ duration:0.22, ease:[0.4,0,0.2,1] }}
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white"
                      style={{ boxShadow:"0 2px 6px rgba(0,0,0,0.3)" }} />
                  </motion.button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 py-4 rounded-2xl font-semibold text-white/50"
                  style={{ background:"rgba(255,255,255,0.055)", border:"1px solid rgba(255,255,255,0.08)", fontSize:14 }}>
                  Cancel
                </button>
                <motion.button whileTap={{ scale:0.97 }} type="button" onClick={handleSave}
                  className="flex-1 py-4 rounded-2xl text-white font-bold"
                  style={{
                    fontSize:14,
                    background:`linear-gradient(135deg,${currType.color} 0%,${currType.color}bb 100%)`,
                    boxShadow:`0 6px 22px ${currType.color}48`,
                  }}>
                  {isEdit ? "Save Changes" : "✦ Add Account"}
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
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ background:"rgba(0,0,0,0.75)", backdropFilter:"blur(12px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y:"100%" }} animate={{ y:0 }} exit={{ y:"100%" }}
        transition={{ duration:0.28, ease:[0.4,0,0.2,1] }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md mx-auto rounded-t-3xl p-5"
        style={{ background:"linear-gradient(180deg,#16203A 0%,#0E1424 100%)", border:"1px solid rgba(255,255,255,0.09)", borderBottom:"none" }}
      >
        <div className="flex justify-center mb-4">
          <div className="w-9 h-1 rounded-full bg-white/15" />
        </div>
        <p className="text-white font-bold mb-4" style={{ fontSize:17 }}>Filter Accounts</p>
        <div className="space-y-2">
          {[{ id:"all" as const, label:"All Accounts", emoji:"🗂️", color:"#7C5CFF" },
            ...ACCOUNT_TYPES.map(t => ({ id: t.id as AccountType | "all", label:t.label, emoji:t.emoji, color:t.color }))
          ].map(opt => (
            <motion.button key={opt.id} whileTap={{ scale:0.97 }} onClick={() => { onFilter(opt.id as AccountType | "all"); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
              style={{
                background: filter === opt.id ? `${opt.color}18` : "rgba(255,255,255,0.04)",
                border: filter === opt.id ? `1px solid ${opt.color}45` : "1px solid rgba(255,255,255,0.07)",
              }}>
              <span style={{ fontSize:18 }}>{opt.emoji}</span>
              <span style={{ fontSize:14, fontWeight:600, color: filter === opt.id ? opt.color : "rgba(255,255,255,0.65)" }}>{opt.label}</span>
              {filter === opt.id && <Check className="w-4 h-4 ml-auto" style={{ color:opt.color }} />}
            </motion.button>
          ))}
        </div>
        <button onClick={onClose}
          className="w-full mt-4 py-3.5 rounded-2xl text-white/50 font-semibold"
          style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", fontSize:14 }}>
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
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background:"rgba(0,0,0,0.82)", backdropFilter:"blur(16px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale:0.86, opacity:0 }} animate={{ scale:1, opacity:1 }}
        exit={{ scale:0.86, opacity:0 }} transition={{ duration:0.22, ease:[0.4,0,0.2,1] }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl p-6"
        style={{ background:"linear-gradient(135deg,#1C2440 0%,#131926 100%)", border:"1px solid rgba(255,255,255,0.10)" }}
      >
        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background:"rgba(239,68,68,0.14)", border:"1px solid rgba(239,68,68,0.25)" }}>
          <Trash2 className="w-6 h-6 text-rose-400" />
        </div>
        <h3 className="text-white font-bold text-center mb-2" style={{ fontSize:17 }}>Delete Account?</h3>
        <p className="text-white/42 text-center mb-6 leading-relaxed" style={{ fontSize:13 }}>
          <span className="text-white/68 font-medium">"{name}"</span> and all its transaction history will be permanently removed.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl font-semibold text-white/50"
            style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", fontSize:14 }}>
            Cancel
          </button>
          <motion.button whileTap={{ scale:0.96 }} onClick={onConfirm}
            className="flex-1 py-3.5 rounded-2xl font-bold text-white"
            style={{ background:"linear-gradient(135deg,#F72585,#EF4444)", boxShadow:"0 6px 20px rgba(247,37,133,0.38)", fontSize:14 }}>
            Delete
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export function AccountsScreen() {
  const [accounts, setAccounts]   = useState<Account[]>(DEFAULT_ACCOUNTS);
  const [modal, setModal]         = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Account | null>(null);
  const [delTarget, setDelTarget]   = useState<Account | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter]         = useState<AccountType | "all">("all");
  const [search, setSearch]         = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showBal, setShowBal]       = useState(true);

  // ── CRUD ─────────────────────────────────────────────────────────────────────
  const saveAccount = (form: FormState) => {
    const balance = form.trackBalance && form.openingBalance
      ? parseFloat(form.openingBalance) || 0 : 0;

    if (modal === "edit" && editTarget) {
      setAccounts(p => p.map(a => a.id === editTarget.id ? {
        ...a, name:form.name, type:form.type, bankName:form.bankName||undefined,
        balance, trackBalance:form.trackBalance, color:form.color,
        isPrimary:form.isPrimary, paymentModes:form.paymentModes,
        upiId:form.upiId||undefined,
      } : (form.isPrimary ? { ...a, isPrimary: false } : a)));
    } else {
      const newAcc: Account = {
        id:`a-${Date.now()}`, name:form.name, type:form.type,
        bankName:form.bankName||undefined, balance, trackBalance:form.trackBalance,
        color:form.color, isPrimary:form.isPrimary, paymentModes:form.paymentModes,
        upiId:form.upiId||undefined, isCustom:true,
      };
      setAccounts(p => [
        ...(form.isPrimary ? p.map(a => ({ ...a, isPrimary:false })) : p),
        newAcc,
      ]);
    }
    setModal(null); setEditTarget(null);
  };

  const deleteAccount = () => {
    if (!delTarget) return;
    setAccounts(p => p.filter(a => a.id !== delTarget.id));
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
      style={{ background:"linear-gradient(180deg,#0B0F1A 0%,#121826 100%)", minHeight:"calc(100vh - 56px)" }}>

      {/* Top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-28 pointer-events-none"
        style={{ background:"radial-gradient(ellipse at 50% 0%,rgba(124,92,255,0.11) 0%,transparent 70%)" }} />

      {/* ── Search bar ── */}
      <AnimatePresence>
        {showSearch && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
            exit={{ height:0, opacity:0 }} transition={{ duration:0.22 }}
            className="px-4 pt-3 overflow-hidden">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search accounts…"
                className="w-full pl-10 pr-9 py-3 rounded-2xl text-white placeholder:text-white/25 focus:outline-none"
                style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(124,92,255,0.28)", fontSize:13 }} />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                  <X className="w-3 h-3 text-white/60" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top row: search toggle + filter ── */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#7C5CFF]" />
          <p className="text-white/35" style={{ fontSize:11, fontWeight:500 }}>
            {visible.length} {visible.length === 1 ? "account" : "accounts"}
            {filter !== "all" && ` · ${ACCOUNT_TYPES.find(t => t.id === filter)?.label}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowSearch(v => !v); if (showSearch) setSearch(""); }}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: showSearch ? "rgba(124,92,255,0.22)" : "rgba(255,255,255,0.06)",
              border:`1px solid ${showSearch ? "rgba(124,92,255,0.45)" : "rgba(255,255,255,0.08)"}`,
            }}>
            <Search className="w-4 h-4" style={{ color: showSearch ? "#9D7EFF" : "rgba(255,255,255,0.38)" }} />
          </button>
          <button onClick={() => setShowFilter(true)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: filter !== "all" ? "rgba(124,92,255,0.22)" : "rgba(255,255,255,0.06)",
              border:`1px solid ${filter !== "all" ? "rgba(124,92,255,0.45)" : "rgba(255,255,255,0.08)"}`,
            }}>
            <SlidersHorizontal className="w-4 h-4" style={{ color: filter !== "all" ? "#9D7EFF" : "rgba(255,255,255,0.38)" }} />
          </button>
        </div>
      </div>

      {/* ── Net Worth Banner ── */}
      <NetWorthBanner accounts={accounts} visible={showBal} onToggle={() => setShowBal(v => !v)} />

      {/* ── Account List ── */}
      <div className="px-4 space-y-2.5 pb-4">
        {visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl"
              style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)" }}>
              {search ? "🔍" : "🏦"}
            </div>
            <p className="text-white/38 text-center" style={{ fontSize:14 }}>
              {search ? `No results for "${search}"` : filter !== "all" ? "No accounts of this type" : "No accounts yet"}
            </p>
            {!search && filter === "all" && (
              <motion.button whileTap={{ scale:0.96 }} onClick={() => setModal("add")}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl"
                style={{ background:"linear-gradient(135deg,#7C5CFF,#4CC9F0)", boxShadow:"0 6px 20px rgba(124,92,255,0.4)" }}>
                <Plus className="w-4 h-4 text-white" />
                <span className="text-white font-bold" style={{ fontSize:14 }}>Add First Account</span>
              </motion.button>
            )}
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {visible.map(acc => (
            <motion.div key={acc.id} layout
              initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-8, scale:0.96 }} transition={{ duration:0.22 }}>
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
            <p className="text-white/28 mb-3" style={{ fontSize:11, fontWeight:600, letterSpacing:"0.5px" }}>BY TYPE</p>
            <div className="grid grid-cols-4 gap-2">
              {ACCOUNT_TYPES.filter(t => accounts.some(a => a.type === t.id)).map(t => {
                const cnt = accounts.filter(a => a.type === t.id).length;
                return (
                  <motion.button key={t.id} whileTap={{ scale:0.94 }} onClick={() => setFilter(t.id)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-2xl"
                    style={{ background:`${t.color}12`, border:`1px solid ${t.color}25` }}>
                    <span style={{ fontSize:20 }}>{t.emoji}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:t.color }}>{cnt}</span>
                    <span style={{ fontSize:9.5, color:"rgba(255,255,255,0.35)", textAlign:"center", lineHeight:1.2 }}>
                      {t.label.replace(" Account","").replace(" Wallet","")}
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
        whileTap={{ scale:0.88 }}
        onClick={() => { setEditTarget(null); setModal("add"); }}
        className="fixed z-40 flex items-center justify-center rounded-2xl"
        style={{
          bottom:90, right:20, width:56, height:56,
          background:"linear-gradient(135deg,#7C5CFF 0%,#4CC9F0 100%)",
          boxShadow:"0 8px 32px rgba(124,92,255,0.6)",
          animation:"accFabBreathe 3s ease-in-out infinite",
        }}
      >
        <Plus className="w-6 h-6 text-white" strokeWidth={2.8} />
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

      <style>{`
        @keyframes accFabBreathe {
          0%,100% { box-shadow: 0 8px 32px rgba(124,92,255,0.58); transform: scale(1); }
          50%      { box-shadow: 0 8px 52px rgba(124,92,255,0.88), 0 0 0 10px rgba(124,92,255,0.10); transform: scale(1.055); }
        }
      `}</style>
    </div>
  );
}