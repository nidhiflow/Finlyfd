import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, useParams } from "react-router";
import { transactionsAPI, accountsAPI, aiAPI } from "../services/api";
import { toast } from "sonner";
import {
  ArrowLeft, ScanLine, Camera, Image as ImageIcon,
  Repeat, ChevronDown, ChevronLeft, ChevronRight,
  Plus, Pencil, Trash2, Check, X, Bell,
  Calculator, Calendar, Zap, Sparkles, Clock,
  ArrowDownCircle, ArrowUpCircle, RefreshCw, CalendarClock, Hourglass,
} from "lucide-react";

// ─── Single Source of Truth ────────────────────────────────────────────────────
// All categories/subcategories come from the shared CategoryContext.
// Any changes made in CategoriesScreen are reflected here immediately.
import { useCategoryContext, Cat, Sub } from "../context/CategoryContext";

import { Briefcase, CreditCard, HandCoins, LineChart, Landmark } from "lucide-react";
// ─── Local types ───────────────────────────────────────────────────────────────
// Cat and Sub are imported from context; Acc is local to this screen.
interface Acc { id: string; name: string; emoji: string; icon?: string; type: string; color: string; balance: number; }
const getAccountIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case "current": return Briefcase;
    case "credit": return CreditCard;
    case "liability": return HandCoins;
    case "investment": return LineChart;
    case "savings":
    default: return Landmark;
  }
};
type TxType = "expense" | "income" | "transfer";


const AVAILABLE_ICONS = [
  { id: 'Briefcase', icon: Briefcase },
  { id: 'CreditCard', icon: CreditCard },
  { id: 'Landmark', icon: Landmark },
  { id: 'Zap', icon: Zap },
  { id: 'Sparkles', icon: Sparkles },
  { id: 'Clock', icon: Clock },
  { id: 'HandCoins', icon: HandCoins },
  { id: 'LineChart', icon: LineChart },
  { id: 'Image', icon: ImageIcon },
  { id: 'Calendar', icon: Calendar }
];

const RECENT_IDS = ["food", "vehicle", "bills"];
const RECENT_INCOME_IDS = ["i-salary", "i-biz"];

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ─── Camera Modal ──────────────────────────────────────────────────────────────
function CameraModal({ onCapture, onClose }: { onCapture: (base64: string) => void, onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error("Camera error:", err);
        toast.error("Failed to access camera");
        onClose();
      });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL("image/jpeg");
      onCapture(base64);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-black"
    >
      <div className="flex items-center justify-between p-4 bg-black/50 absolute top-0 left-0 right-0 z-10">
        <button onClick={onClose} className="p-2 rounded-full bg-white/10 text-white">
          <X className="w-6 h-6" />
        </button>
      </div>
      <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
      <div className="p-6 bg-black absolute bottom-0 left-0 right-0 flex justify-center pb-10">
        <button
          onClick={handleCapture}
          className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center active:scale-95 transition-transform"
        />
      </div>
    </motion.div>
  );
}

// ─── Calculator Modal ──────────────────────────────────────────────────────────
function CalcModal({ value, onChange, onClose }: {
  value: string; onChange: (v: string) => void; onClose: () => void;
}) {
  const [expression, setExpression] = useState(value || "0");
  const [hasResult, setHasResult] = useState(false);

  const isOp = (c: string) => ["+", "-", "×", "÷"].includes(c);

  const evaluate = (expr: string): string => {
    try {
      const s = expr.replace(/×/g, "*").replace(/÷/g, "/");
      const r = Function('"use strict"; return (' + s + ')')();
      if (!isFinite(r)) return "0";
      return parseFloat(r.toFixed(2)).toString();
    } catch { return "0"; }
  };

  const tap = (k: string) => {
    if (k === "C") { setExpression("0"); setHasResult(false); return; }
    if (k === "⌫") { setExpression(p => p.length > 1 ? p.slice(0, -1) : "0"); setHasResult(false); return; }
    if (k === "=") { setExpression(evaluate(expression)); setHasResult(true); return; }
    if (isOp(k)) {
      setHasResult(false);
      setExpression(p => {
        if (p === "0" && k === "-") return "-";
        if (isOp(p.slice(-1))) return p.slice(0, -1) + k;
        return p + k;
      });
      return;
    }
    setExpression(p => {
      if (hasResult && !isOp(k)) { setHasResult(false); return k === "." ? "0." : k; }
      if (k === ".") {
        const parts = p.split(/[+\-×÷]/); const lp = parts[parts.length - 1];
        return lp.includes(".") ? p : p + ".";
      }
      return p === "0" ? k : p + k;
    });
  };

  const preview = (() => {
    if (hasResult) return "";
    const hasOps = expression.split("").some((c, i) => isOp(c) && i > 0);
    return hasOps ? evaluate(expression) : "";
  })();

  const confirm = () => {
    const f = hasResult ? expression : evaluate(expression);
    onChange(f === "0" ? "" : f); onClose();
  };

  const rows: string[][] = [
    ["C", "⌫", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    [".", "0", "=", "✓"],
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(14px)" }}
      onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md mx-auto rounded-t-[18px] p-5"
        style={{ background: "var(--surface)", border: "1px solid var(--divider)", borderBottom: "none" }}>

        <div className="flex justify-center mb-3">
          <div className="w-9 h-1 rounded-full bg-ink/15" />
        </div>

        {/* Display */}
        <div className="text-right mb-4 px-2">
          <p className="text-ink/35" style={{ fontSize: 12 }}>Amount</p>
          <p className="text-ink font-bold truncate" style={{ fontSize: 34, letterSpacing: "-1px" }}>
            {expression.length > 14 ? "..." + expression.slice(-14) : expression}
          </p>
          {preview && (
            <p className="text-[#D4A24C] mt-1" style={{ fontSize: 15 }}>= ₹ {parseFloat(preview).toLocaleString("en-IN")}</p>
          )}
        </div>

        {/* Keys */}
        {rows.map((row, ri) => (
          <div key={ri} className={`grid gap-2 mb-2 ${ri === 0 ? "grid-cols-3" : "grid-cols-4"}`}>
            {row.map(k => (
              <motion.button key={k} whileTap={{ scale: 0.9 }}
                onClick={() => k === "✓" ? confirm() : tap(k)}
                className="py-3.5 rounded-2xl flex items-center justify-center font-bold transition-colors"
                style={{
                  fontSize: k === "✓" ? 20 : isOp(k) || k === "=" ? 22 : 20,
                  background: k === "✓" ? "linear-gradient(135deg,#D4A24C,#D4A24C)"
                    : k === "C" ? "rgba(239,68,68,0.15)"
                      : k === "⌫" ? "rgba(255,183,3,0.12)"
                        : isOp(k) || k === "=" ? "rgba(212,162,76,0.15)"
                          : "var(--divider)",
                  color: k === "✓" ? "white" : k === "C" ? "#F87171" : k === "⌫" ? "#FFB703"
                    : isOp(k) || k === "=" ? "#D4A24C" : "white",
                  boxShadow: k === "✓" ? "0 4px 16px rgba(212,162,76,0.4)" : "none",
                }}>
                {k}
              </motion.button>
            ))}
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

// ─── Subcategory Sheet ─────────────────────────────────────────────────────────
// Reads cat.subs LIVE from context (parent passes cat from getCatsByType).
// Adds/deletes inside this sheet also call context methods so CategoriesScreen
// stays in sync as well.
function SubcategorySheet({ cat, selectedSubId, onSelect, onClose }: {
  cat: Cat; selectedSubId: string | null; onSelect: (s: Sub) => void; onClose: () => void;
}) {
  // Write ops go through the context → propagate to CategoriesScreen instantly
  const { addSubcategory, deleteSubcategory } = useCategoryContext();

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("📌");

  // Use cat.subs directly — they're already live from context via the parent
  const subs = cat.subs;

  const addSub = () => {
    if (!newName.trim()) return;
    addSubcategory(cat.id, { name: newName.trim(), emoji: newEmoji });
    setNewName(""); setNewEmoji("📌"); setAdding(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(16px)" }}
      onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md mx-auto rounded-t-[18px]"
        style={{ background: "var(--surface)", border: "1px solid var(--divider)", borderBottom: "none", maxHeight: "80vh", overflowY: "auto" }}>

        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-ink/15" />
        </div>

        <div className="px-5 pb-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-5 pt-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: `${cat.color}25`, border: `1px solid ${cat.color}35` }}>
                {cat.icon ? <cat.icon className="w-5 h-5" style={{ color: cat.color }} /> : <span className="text-xl">{cat.emoji}</span>}
              </div>
              <div>
                <p className="text-ink font-bold" style={{ fontSize: 17 }}>{cat.name}</p>
                <p className="text-ink/38" style={{ fontSize: 12 }}>Select subcategory</p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "var(--divider)" }}>
              <X className="w-4 h-4 text-ink/50" />
            </button>
          </div>

          {/* Subcategory list */}
          <div className="space-y-2">
            {subs.map(sub => {
              const isSel = selectedSubId === sub.id;
              return (
                <motion.div key={sub.id} layout
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer"
                  style={{
                    background: isSel ? `${cat.color}1A` : "color-mix(in srgb, var(--ink) 4%, transparent)",
                    border: isSel ? `1.5px solid ${cat.color}50` : "1px solid var(--divider)",
                    boxShadow: isSel ? `0 4px 16px ${cat.color}18` : "none",
                  }}
                  onClick={() => { onSelect(sub); onClose(); }}>
                  <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
                    style={{ background: `${cat.color}18`, border: `1px solid ${cat.color}25` }}>
                    {sub.icon ? <sub.icon className="w-4.5 h-4.5" style={{ color: cat.color }} /> : <span className="text-lg">{sub.emoji}</span>}
                  </div>
                  <span className="flex-1 font-semibold"
                    style={{ fontSize: 14, color: isSel ? "white" : "color-mix(in srgb, var(--ink) 72%, transparent)" }}>
                    {sub.name}
                  </span>
                  {isSel && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg,${cat.color},${cat.color}cc)` }}>
                      <Check className="w-3.5 h-3.5 text-ink" />
                    </div>
                  )}
                  {!isSel && (
                    <div className="flex gap-1 opacity-50">
                      <button onClick={e => { e.stopPropagation(); deleteSubcategory(cat.id, sub.id) }}
                        className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-rose-500/15">
                        <Trash2 className="w-3 h-3 text-rose-400/60" />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Add subcategory */}
          <AnimatePresence>
            {adding ? (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
                className="mt-3 p-4 rounded-2xl" style={{ background: "color-mix(in srgb, var(--ink) 5%, transparent)", border: "1px solid var(--divider)" }}>
                <div className="flex gap-2 mb-2">
                  {showIconPicker ? (
                    <div className="absolute z-10 bg-white shadow-xl rounded-xl p-2 flex flex-wrap gap-2 w-48 border" style={{ borderColor: 'var(--divider)' }}>
                      {AVAILABLE_ICONS.map(ic => (
                        <button key={ic.id} onClick={() => { setNewIcon(() => ic.icon); setShowIconPicker(false); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-ink/5">
                          <ic.icon className="w-4 h-4 text-ink" />
                        </button>
                      ))}
                      <button onClick={() => { setNewIcon(null); setShowIconPicker(false); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-ink/5 text-xs">
                        🏷️
                      </button>
                    </div>
                  ) : null}
                  <button onClick={() => setShowIconPicker(!showIconPicker)} className="w-12 flex items-center justify-center rounded-xl bg-ink/7 focus:outline-none relative">
                    {newIcon ? (() => { const Icon = newIcon; return <Icon className="w-5 h-5 text-ink" />; })() : <span style={{ fontSize: 20 }}>{newEmoji}</span>}
                  </button>
                  <input value={newName} onChange={e => setNewName(e.target.value)}
                    placeholder="Subcategory name…" autoFocus
                    onKeyDown={e => e.key === "Enter" && addSub()}
                    className="flex-1 px-3 py-2 rounded-xl text-ink placeholder:text-ink/22 focus:outline-none"
                    style={{ background: "var(--divider)", border: `1px solid ${cat.color}30`, fontSize: 14 }} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setAdding(false)}
                    className="flex-1 py-2 rounded-xl text-ink/40 text-sm"
                    style={{ background: "color-mix(in srgb, var(--ink) 5%, transparent)" }}>Cancel</button>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={addSub}
                    className="flex-1 py-2 rounded-xl text-ink font-semibold text-sm"
                    style={{ background: `linear-gradient(135deg,${cat.color},${cat.color}bb)` }}>Add</motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setAdding(true)}
                className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl"
                style={{ background: "color-mix(in srgb, var(--ink) 4%, transparent)", border: "1px dashed var(--divider)", color: cat.color, fontSize: 13, fontWeight: 600 }}>
                <Plus className="w-4 h-4" />
                Add Subcategory
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Account Sheet ─────────────────────────────────────────────────────────────
function AccountSheet({ selected, onSelect, onClose, excludeId, accounts }: {
  selected: string; onSelect: (a: Acc) => void; onClose: () => void; excludeId?: string; accounts: Acc[];
}) {
  const list = (accounts || []).filter(a => a.id !== excludeId);
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(14px)" }}
      onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md mx-auto rounded-t-[18px] p-5"
        style={{ background: "var(--surface)", border: "1px solid var(--divider)", borderBottom: "none" }}>
        <div className="flex justify-center mb-4">
          <div className="w-9 h-1 rounded-full bg-ink/15" />
        </div>
        <p className="text-ink font-bold mb-4" style={{ fontSize: 17 }}>Select Account</p>
        <div className="space-y-2.5 pb-2">
          {list.length === 0 && (
            <div className="text-center py-6">
              <p className="text-ink/40 text-sm mb-3">No accounts added yet</p>
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => { onClose(); window.location.href = '/dashboard/accounts'; }}
                className="mx-auto flex items-center gap-2 px-5 py-3 rounded-2xl text-ink font-semibold text-sm"
                style={{ background: "linear-gradient(135deg,#D4A24C,#D4A24C)", boxShadow: "0 4px 16px rgba(212,162,76,0.4)" }}>
                <Plus className="w-4 h-4" />
                Add Bank / Account
              </motion.button>
            </div>
          )}
          {list.map(acc => {
            const isSel = selected === acc.id;
            return (
              <motion.button key={acc.id} whileTap={{ scale: 0.97 }} onClick={() => { onSelect(acc); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left"
                style={{
                  background: isSel ? `${acc.color}18` : "color-mix(in srgb, var(--ink) 4%, transparent)",
                  border: isSel ? `1.5px solid ${acc.color}45` : "1px solid var(--divider)",
                }}>
                <div className="w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center"
                  style={{ background: `${acc.color}22`, border: `1px solid ${acc.color}35` }}>
                  {(() => {
                    const AccIcon = getAccountIcon(acc.type);
                    return <AccIcon className="w-5 h-5" style={{ color: acc.color }} />;
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-ink font-semibold" style={{ fontSize: 14 }}>{acc.name}</p>
                  <p className="text-ink/38" style={{ fontSize: 11 }}>{acc.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold tabular-nums" style={{ fontSize: 14, color: acc.balance < 0 ? "var(--ink-faint)" : "var(--ink)" }}>
                    {acc.balance < 0 ? "-" : ""} ₹{Math.abs(acc.balance).toLocaleString("en-IN")}
                  </p>
                  {isSel && <Check className="w-4 h-4 ml-auto mt-0.5" strokeWidth={1.75} style={{ color: acc.color }} />}
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Date Picker Modal ─────────────────────────────────────────────────────────
function DatePickerModal({ date, onSelect, onClose }: {
  date: Date; onSelect: (d: Date) => void; onClose: () => void;
}) {
  const [view, setView] = useState(new Date(date));
  const [pickedDate, setPickedDate] = useState(new Date(date));
  const [hours, setHours] = useState(date.getHours());
  const [minutes, setMinutes] = useState(date.getMinutes());
  const today = new Date();

  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const firstDay = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1);

  const handleDayTap = (day: number) => {
    setPickedDate(new Date(view.getFullYear(), view.getMonth(), day));
  };

  const handleConfirm = () => {
    const final = new Date(pickedDate);
    final.setHours(hours);
    final.setMinutes(minutes);
    onSelect(final);
    onClose();
  };

  const handleQuickSelect = (label: string) => {
    const d = new Date();
    if (label === "Yesterday") d.setDate(d.getDate() - 1);
    else if (label === "This Week") d.setDate(d.getDate() - d.getDay());
    setPickedDate(d);
    setView(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  const h12 = hours % 12 || 12;
  const ampm = hours >= 12 ? "PM" : "AM";
  const previewStr = `${pickedDate.getDate()} ${MONTHS_SHORT[pickedDate.getMonth()]} ${pickedDate.getFullYear()}, ${h12}:${minutes < 10 ? "0" + minutes : minutes} ${ampm}`;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(14px)" }}
      onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md mx-auto rounded-t-[18px] p-5"
        style={{ background: "var(--surface)", border: "1px solid var(--divider)", borderBottom: "none" }}>
        <div className="flex justify-center mb-3">
          <div className="w-9 h-1 rounded-full bg-ink/15" />
        </div>

        <p className="text-ink font-bold mb-2 text-center" style={{ fontSize: 17 }}>Select Date & Time</p>

        {/* Selected preview */}
        <div className="mb-4 py-2.5 px-4 rounded-xl text-center"
          style={{ background: "rgba(212,162,76,0.12)", border: "1px solid rgba(212,162,76,0.25)" }}>
          <p className="text-ink font-semibold" style={{ fontSize: 14 }}>{previewStr}</p>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setView(v => new Date(v.getFullYear(), v.getMonth() - 1, 1))}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-ink/7 active:scale-90 transition-transform">
            <ChevronLeft className="w-4 h-4 text-ink/55" />
          </button>
          <p className="text-ink font-bold" style={{ fontSize: 16 }}>
            {MONTHS_SHORT[view.getMonth()]} {view.getFullYear()}
          </p>
          <button onClick={() => setView(v => new Date(v.getFullYear(), v.getMonth() + 1, 1))}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-ink/7 active:scale-90 transition-transform">
            <ChevronRight className="w-4 h-4 text-ink/55" />
          </button>
        </div>
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => (
            <p key={d} className="text-center text-ink/30 font-semibold" style={{ fontSize: 11 }}>{d}</p>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1 mb-4">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const thisDate = new Date(view.getFullYear(), view.getMonth(), day);
            const isToday = thisDate.toDateString() === today.toDateString();
            const isSel = thisDate.toDateString() === pickedDate.toDateString();
            return (
              <motion.button key={day} whileTap={{ scale: 0.85 }}
                onClick={() => handleDayTap(day)}
                className="aspect-square rounded-full flex items-center justify-center"
                style={{
                  background: isSel ? "linear-gradient(135deg,#D4A24C,#D4A24C)" : isToday ? "rgba(212,162,76,0.18)" : "transparent",
                  boxShadow: isSel ? "0 4px 12px rgba(212,162,76,0.45)" : "none",
                }}>
                <span style={{
                  fontSize: 13, fontWeight: isSel || isToday ? 700 : 400,
                  color: isSel ? "white" : isToday ? "#D4A24C" : "color-mix(in srgb, var(--ink) 65%, transparent)"
                }}>
                  {day}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Time selector with stepper buttons */}
        <div className="mb-4">
          <p className="text-ink/38 mb-2" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.5px" }}>TIME</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl"
              style={{ background: "var(--divider)", border: "1px solid var(--divider)" }}>
              <button onClick={() => setHours(h => h > 0 ? h - 1 : 23)} className="w-7 h-7 rounded-lg bg-ink/8 flex items-center justify-center active:scale-90 transition-transform">
                <ChevronLeft className="w-3.5 h-3.5 text-ink/50" />
              </button>
              <span className="w-8 text-center text-ink font-bold" style={{ fontSize: 18 }}>{hours < 10 ? `0${hours}` : hours}</span>
              <button onClick={() => setHours(h => h < 23 ? h + 1 : 0)} className="w-7 h-7 rounded-lg bg-ink/8 flex items-center justify-center active:scale-90 transition-transform">
                <ChevronRight className="w-3.5 h-3.5 text-ink/50" />
              </button>
              <span className="text-ink/30 mx-0.5" style={{ fontSize: 18 }}>:</span>
              <button onClick={() => setMinutes(m => m > 0 ? m - 1 : 59)} className="w-7 h-7 rounded-lg bg-ink/8 flex items-center justify-center active:scale-90 transition-transform">
                <ChevronLeft className="w-3.5 h-3.5 text-ink/50" />
              </button>
              <span className="w-8 text-center text-ink font-bold" style={{ fontSize: 18 }}>{minutes < 10 ? `0${minutes}` : minutes}</span>
              <button onClick={() => setMinutes(m => m < 59 ? m + 1 : 0)} className="w-7 h-7 rounded-lg bg-ink/8 flex items-center justify-center active:scale-90 transition-transform">
                <ChevronRight className="w-3.5 h-3.5 text-ink/50" />
              </button>
              <span className="text-ink/50 ml-1 font-semibold" style={{ fontSize: 12 }}>{ampm}</span>
            </div>
            <button
              onClick={() => { const now = new Date(); setHours(now.getHours()); setMinutes(now.getMinutes()); }}
              className="px-3 py-2.5 rounded-xl active:scale-95 transition-transform"
              style={{ background: "rgba(212,162,76,0.18)", border: "1px solid rgba(212,162,76,0.3)", fontSize: 12, color: "#D4A24C", fontWeight: 600 }}>
              Now
            </button>
          </div>
        </div>

        {/* Quick shortcuts */}
        <div className="flex gap-2 mb-5">
          {["Today", "Yesterday", "This Week"].map(s => (
            <button key={s} onClick={() => handleQuickSelect(s)}
              className="flex-1 py-2.5 rounded-xl text-center active:scale-95 transition-transform"
              style={{ background: "color-mix(in srgb, var(--ink) 6%, transparent)", border: "1px solid var(--divider)", fontSize: 12, color: "color-mix(in srgb, var(--ink) 65%, transparent)", fontWeight: 600 }}>
              {s}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <motion.button whileTap={{ scale: 0.95 }} onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl text-center font-semibold"
            style={{ background: "var(--divider)", border: "1px solid var(--divider)", fontSize: 14, color: "color-mix(in srgb, var(--ink) 60%, transparent)" }}>
            Cancel
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleConfirm}
            className="flex-1 py-3.5 rounded-2xl text-center font-bold"
            style={{ background: "linear-gradient(135deg,#D4A24C,#D4A24C)", boxShadow: "0 4px 16px rgba(212,162,76,0.4)", fontSize: 14, color: "var(--ink)" }}>
            Save
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Success Overlay ───────────────────────────────────────────────────────────
function SuccessOverlay({ txType, onDone }: { txType: TxType; onDone: () => void }) {
  const Icon = txType === "income" ? ArrowDownCircle : txType === "transfer" ? RefreshCw : ArrowUpCircle;
  const color = txType === "income" ? "var(--income)" : txType === "transfer" ? "var(--gold)" : "var(--expense)";
  useEffect(() => { const t = setTimeout(onDone, 1800); return () => clearTimeout(t); }, []);
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "rgba(16,23,26,0.94)", backdropFilter: "blur(20px)" }}>
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}>
        <div className="w-24 h-24 rounded-[18px] flex items-center justify-center mb-6"
          style={{ background: `linear-gradient(135deg,${color}30,${color}18)`, border: `2px solid ${color}50`, boxShadow: `0 0 40px ${color}40` }}>
          <Icon className="w-11 h-11" strokeWidth={1.75} style={{ color }} />
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <p className="font-bold text-center" style={{ fontSize: 22, color: "var(--ink)" }}>Transaction Saved!</p>
        <p className="text-center mt-1" style={{ fontSize: 14, color: "var(--ink-faint)" }}>Successfully recorded</p>
      </motion.div>
      <motion.div
        className="absolute bottom-0 left-0 h-1 rounded-full"
        style={{ background: `linear-gradient(90deg,${color},transparent)` }}
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: 1.8, ease: "linear" }}
      />
    </motion.div>
  );
}

export const REPEAT_OPTIONS = [
  { id: 'none', label: 'Nothing' },
  { id: 'daily', label: 'Every Day' },
  { id: 'weekdays', label: 'Weekdays' },
  { id: 'weekend', label: 'Weekend' },
  { id: 'weekly', label: 'Every Week' },
  { id: 'biweekly', label: 'Every 2 weeks' },
  { id: 'four_weeks', label: 'Every 4 weeks' },
  { id: 'monthly', label: 'Every Month' },
  { id: 'end_of_month', label: 'The end of the month' },
  { id: 'bimonthly', label: 'Every 2 Month' },
  { id: 'quarterly', label: 'Every 3 Month' },
  { id: 'four_months', label: 'Every 4 Month' },
  { id: 'six_months', label: 'Every 6 Month' },
  { id: 'yearly', label: 'Annually' },
];

function RepeatSelectionModal({ selected, onSelect, onClose }: { selected: string, onSelect: (val: string) => void, onClose: () => void }) {
  return (
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <div className="flex-1" onClick={onClose} />
      <div className="rounded-t-3xl overflow-hidden flex flex-col max-h-[80vh] shadow-2xl" style={{ background: "var(--bg)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center px-6 h-16 shrink-0 border-b border-white/5 relative">
          <span className="font-semibold text-lg text-ink">Repeat</span>
          <button onClick={onClose} className="absolute right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-ink/5">
            <X className="w-5 h-5 text-ink" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          {REPEAT_OPTIONS.map(opt => (
            <div key={opt.id}
                 onClick={() => { onSelect(opt.id); onClose(); }}
                 className="py-4 px-2 cursor-pointer flex items-center justify-between rounded-xl hover:bg-ink/5">
              <span className="text-[16px] font-medium" style={{ color: selected === opt.id ? "var(--accent, #4895EF)" : "var(--ink)" }}>
                {opt.label}
              </span>
              {selected === opt.id && <Check className="w-5 h-5" style={{ color: "var(--accent, #4895EF)" }} />}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export function AddTransactionScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [txType, setTxType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [catId, setCatId] = useState<string | null>(null);
  const [subId, setSubId] = useState<string | null>(null);
  const [accId, setAccId] = useState("");
  const [toAccId, setToAccId] = useState("");
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [recurFreq, setRecurFreq] = useState<string>("monthly");
  const [recurInterval, setRecurInterval] = useState<number>(1);
  const [recurDayOfMonth, setRecurDayOfMonth] = useState<number | null>(null);
  const [recurEndType, setRecurEndType] = useState<string>("never");
  const [recurEndDate, setRecurEndDate] = useState<Date | null>(null);
  const [recurOccurrences, setRecurOccurrences] = useState<string>("");
  const [recurAutoCreate, setRecurAutoCreate] = useState<boolean>(true);
  const [recurReminder, setRecurReminder] = useState<number>(0);

  const [aiScanning, setAiScan] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [ACCOUNTS, setACCOUNTS] = useState<Acc[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [recentNotes, setRecentNotes] = useState<string[]>([]);
  const [notesFetched, setNotesFetched] = useState(false);
  const [showNoteSuggestions, setShowNoteSuggestions] = useState(false);

  // Modal states
  const [showCalc, setShowCalc] = useState(false);
  const [showSubSheet, setShowSubSheet] = useState(false);
  const [showAccSheet, setShowAccSheet] = useState(false);
  const [showToAcc, setShowToAcc] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [showRecurEndDate, setShowRecurEndDate] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showRepeatSheet, setShowRepeatSheet] = useState(false);

  // ─── Load accounts from API ─────────────────────────────────────────────────
  useEffect(() => {
    accountsAPI.getAll().then((data: any[]) => {
      const mapped = (data || []).map((a: any) => ({
        id: a.id, name: a.name, emoji: a.icon || "🏦",
        type: a.type || "Savings", color: a.color || "#4895EF",
        balance: parseFloat(a.balance || 0),
      }));
      setACCOUNTS(mapped);
      if (mapped.length > 0 && !accId) setAccId(mapped[0].id);
      if (mapped.length > 1 && !toAccId) setToAccId(mapped[mapped.length - 1].id);
    }).catch(console.error).finally(() => setLoadingAccounts(false));
  }, []);

  // ─── Load transaction in edit mode ──────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    transactionsAPI.getById(id)
      .then((tx) => {
        if (tx.type) setTxType(String(tx.type).toLowerCase() as TxType);
        if (tx.amount) setAmount(String(tx.amount));
        if (tx.category_id) setCatId(tx.category_id);
        if (tx.subcategory_id || tx.subcategoryId) setSubId(tx.subcategory_id || tx.subcategoryId);
        if (tx.account_id) setAccId(tx.account_id);
        if (tx.to_account_id) setToAccId(tx.to_account_id);
        if (tx.date) setDate(new Date(tx.date));
        if (tx.note) setNote(tx.note);
        if (tx.repeat_group_id || tx.is_recurring) {
          setRecurring(true);
          if ((tx as any).repeat_frequency) {
            setRecurFreq((tx as any).repeat_frequency);
            if ((tx as any).repeat_interval) setRecurInterval((tx as any).repeat_interval);
            if ((tx as any).repeat_day_of_month) setRecurDayOfMonth((tx as any).repeat_day_of_month);
            if ((tx as any).repeat_end_type) setRecurEndType((tx as any).repeat_end_type);
            if ((tx as any).repeat_occurrences_total) setRecurOccurrences(String((tx as any).repeat_occurrences_total));
            if ((tx as any).auto_create !== undefined) setRecurAutoCreate((tx as any).auto_create);
            if ((tx as any).reminder_days_before) setRecurReminder((tx as any).reminder_days_before);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load transaction:", err);
        toast.error("Failed to load transaction details");
      });
  }, [id]);

  // ─── Derive live category list from context ─────────────────────────────────
  const { getCatsByType } = useCategoryContext();
  const cats = getCatsByType(txType === "income" ? "income" : "expense");
  const selectedCat = cats.find(c => c.id === catId);
  const selectedSub = selectedCat?.subs.find(s => s.id === subId);
  const selectedAcc = ACCOUNTS.find(a => a.id === accId) || ACCOUNTS[0] || { id: '', name: loadingAccounts ? 'Loading...' : 'Select Account', emoji: '🏦', type: '', color: '#4895EF', balance: 0 };
  const selectedTo = ACCOUNTS.find(a => a.id === toAccId);
  const recentIds = txType === "income" ? RECENT_INCOME_IDS : RECENT_IDS;
  const recentCats = cats.filter(c => recentIds.includes(c.id));

  // ── Type-specific colors ── Income: green | Expense: red | Transfer: neutral gold accent
  // Hex literals (not CSS vars) here because this screen relies on the `${typeAccent}NN` hex-alpha
  // suffix trick throughout for translucent fills/borders, which only works with raw hex.
  const typeAccent = txType === "income" ? "#6FBE9B" : txType === "transfer" ? "#D4A24C" : "#E2725B";
  const typeBg = typeAccent;

  const renderHighlightedNote = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <>
        {parts.map((p, i) =>
          p.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="text-[#EF4444] font-semibold">{p}</span>
          ) : (
            <span key={i}>{p}</span>
          )
        )}
      </>
    );
  };
  
  const filteredNotes = recentNotes.filter(n => n.toLowerCase().includes(note.toLowerCase()) && n !== note);

  // ── Format date with time ──
  const fmtDate = (d: Date) => {
    const day = d.getDate();
    const month = MONTHS_SHORT[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
    return `${day} ${month} ${year}, ${hours}:${minutesStr} ${ampm}`;
  };

  const resetCat = () => { setCatId(null); setSubId(null); };

  // ── Switch transaction type & reset category selection ──
  // When switching types, clear category/subcategory to prevent type mismatch
  const switchType = (t: TxType) => {
    setTxType(t); resetCat(); setErrors({});
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!amount || parseFloat(amount) <= 0) e.amount = "Please enter a valid amount";
    if (txType !== "transfer") {
      if (!catId) e.cat = "Please select a category";
      else if (selectedCat?.subs.length && !subId) e.sub = "Please select a subcategory";
      // Ensure category type matches transaction type
      else if (!selectedCat) {
        e.cat = "Invalid category selected";
      } else if (selectedCat.type !== txType) {
        e.cat = "Selected category doesn't match transaction type";
      }
    } else {
      if (accId === toAccId) e.toAcc = "From and To accounts must be different";
    }
    setErrors(e);
    return e;
  };

  const handleSave = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      toast.error(Object.values(validationErrors)[0]);
      return;
    }

    try {
      const payload = {
        type: txType,
        amount: parseFloat(amount),
        category_id: catId,
        subcategoryId: subId,
        account_id: accId,
        to_account_id: txType === "transfer" ? toAccId : null,
        date: date.toISOString(),
        note,
        is_recurring: recurring,
        repeat_frequency: recurring ? recurFreq : null,
        repeat_interval: recurring ? recurInterval : null,
        repeat_day_of_month: recurring ? recurDayOfMonth : null,
        repeat_end_type: recurring ? recurEndType : null,
        repeat_occurrences_total: recurring && recurEndType === 'after_n' ? parseInt(recurOccurrences) || null : null,
        auto_create: recurring ? recurAutoCreate : true,
        reminder_days_before: recurring ? recurReminder : null
      };

      if (id) {
        await transactionsAPI.update(id, payload);
      } else {
        await transactionsAPI.create(payload);
      }
      setSaved(true);
    } catch (error) {
      console.error("Failed to save transaction:", error);
      toast.error("Failed to save transaction");
    }
  };

  const handleAIScan = () => {
    document.getElementById("receipt-file-input")?.click();
  };

  const processReceiptData = async (base64Data: string) => {
    setAiScan(true);
    try {
      const result = await aiAPI.scanReceipt(base64Data);
      if (result.amount) setAmount(String(result.amount));
      if (result.note) setNote(result.note);
      if (result.date) setDate(new Date(result.date));

      const targetType = result.type || txType;
      if (result.type && (result.type === "expense" || result.type === "income" || result.type === "transfer")) {
        setTxType(result.type);
      }

      const categorySuggestion = result.category_suggestion || (result.entries && result.entries[0]?.category_suggestion);
      {
        const targetCats = getCatsByType(targetType === "income" ? "income" : "expense");

        // Try to match parent category first
        let matchedCat = categorySuggestion ? targetCats.find(c =>
          c.name.toLowerCase().includes(categorySuggestion.toLowerCase()) ||
          categorySuggestion.toLowerCase().includes(c.name.toLowerCase())
        ) : undefined;

        let matchedSub = null;

        if (!matchedCat && categorySuggestion) {
          // Try to match subcategories
          for (const c of targetCats) {
            const sub = c.subs?.find(s =>
              s.name.toLowerCase().includes(categorySuggestion.toLowerCase()) ||
              categorySuggestion.toLowerCase().includes(s.name.toLowerCase())
            );
            if (sub) {
              matchedCat = c;
              matchedSub = sub;
              break;
            }
          }
        }

        // The AI can suggest a category (e.g. "Other") that has no equivalent in
        // this app's category list, leaving catId unset and silently blocking Save.
        // Fall back to the first available category so the scan always produces a
        // saveable transaction; the user can still change it before saving.
        if (!matchedCat && targetCats.length > 0) {
          matchedCat = targetCats[0];
          toast.info("Couldn't match an exact category — please double-check before saving.");
        }

        if (matchedCat) {
          setCatId(matchedCat.id);
          setErrors(errs => ({ ...errs, cat: undefined! }));

          if (matchedSub) {
            setSubId(matchedSub.id);
            setErrors(errs => ({ ...errs, sub: undefined! }));
          } else if (matchedCat.subs && matchedCat.subs.length > 0) {
            setSubId(matchedCat.subs[0].id);
            setErrors(errs => ({ ...errs, sub: undefined! }));
          } else {
            setSubId(null);
          }
        }
      }
      toast.success("Receipt scanned and details extracted!");
    } catch (err: any) {
      console.error("Scan error:", err);
      toast.error(err.message || "Failed to scan receipt");
    } finally {
      setAiScan(false);
    }
  };

  const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      await processReceiptData(base64Data);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="relative flex flex-col justify-between" style={{ background: "var(--bg-deep)", minHeight: "100vh", paddingBottom: "80px" }}>
      {/* Top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%,${typeAccent}14 0%,transparent 70%)`, transition: "background 0.4s" }} />

      <div className="relative z-10 flex-1 flex flex-col pt-2 pb-2">

        {/* ── Type Toggle ── */}
        <div className="flex gap-2 mx-4 mb-4 bg-[var(--surface)] rounded-[12px] p-1.5">
          {[
            { id: "expense" as TxType, label: "Expense", icon: ArrowUpCircle },
            { id: "income" as TxType, label: "Income", icon: ArrowDownCircle },
            { id: "transfer" as TxType, label: "Transfer", icon: RefreshCw },
          ].map(t => {
            const isActive = txType === t.id;
            return (
              <motion.button
                key={t.id}
                onClick={() => switchType(t.id)}
                whileTap={{ scale: 0.97 }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] transition-colors"
                style={{
                  fontSize: 13.5,
                  fontWeight: 500,
                  background: isActive ? `${typeAccent}33` : "transparent",
                  color: isActive ? typeAccent : "var(--ink-muted)",
                }}>
                <t.icon className="w-[14px] h-[14px]" strokeWidth={1.75} />
                {t.label}
              </motion.button>
            )
          })}
        </div>

        {/* ── Amount Card ── */}
        <div className="mx-4 mb-4 bg-[var(--surface)] rounded-[16px] p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle,${typeAccent}15 0%,transparent 70%)` }} />
          <div className="flex justify-between items-center mb-2 relative z-10">
            <p className="text-[10px] tracking-[0.07em] uppercase text-[var(--ink-muted)] m-0">
              {txType === "income" ? "INCOME AMOUNT" : txType === "transfer" ? "TRANSFER AMOUNT" : "EXPENSE AMOUNT"}
            </p>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowCalc(true)}
              className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-[16px]"
              style={{
                 color: typeAccent,
                 background: `${typeAccent}25`
              }}>
              <Calculator className="w-[13px] h-[13px]" style={{ color: typeAccent }} />
              Calc
            </motion.button>
          </div>
          <div className="flex items-baseline gap-1.5 font-fraunces font-medium text-[38px] relative z-10" style={{ color: typeAccent }}>
            <span className="text-[22px] text-[var(--ink-faint)]">₹</span>
            <input
              type="text" inputMode="decimal"
              value={amount} onChange={e => {
                const v = e.target.value.replace(/[^0-9.]/g, "");
                if ((v.match(/\./g) || []).length <= 1) setAmount(v);
              }}
              placeholder="0"
              className="flex-1 bg-transparent font-fraunces font-medium focus:outline-none placeholder:text-[var(--ink-faint)] tabular-nums"
              style={{ color: typeAccent, width: "100%", letterSpacing: "-1px" }}
            />
          </div>
          {errors.amount && (
            <p className="text-rose-400 mt-1" style={{ fontSize: 11 }}>{errors.amount}</p>
          )}
        </div>

        {/* ── Note ── */}
        <div className="mx-4 mb-4 bg-[var(--surface)] rounded-[14px] px-4 py-3.5 relative z-40">
           <div className="flex items-center gap-2">
             <p className="text-[11px] tracking-[0.07em] uppercase text-[var(--ink-muted)] m-0 w-[45px]">Note</p>
             <input
                value={note}
                onChange={e => { setNote(e.target.value); setShowNoteSuggestions(true); }}
                onFocus={() => { setShowNoteSuggestions(true); if (!notesFetched) { setNotesFetched(true); transactionsAPI.getAll({}).then((txs) => { if (!txs) return; const notes = txs.map((t) => t.note || t.description).filter(Boolean); setRecentNotes(Array.from(new Set(notes))); }).catch(console.error); } }}
                onBlur={() => setTimeout(() => setShowNoteSuggestions(false), 200)}
                placeholder="What was this for?"
                className="flex-1 bg-transparent border-none text-[var(--ink)] font-inter text-[13.5px] outline-none placeholder:text-[var(--ink-faint)]"
             />
           </div>
           <AnimatePresence>
             {showNoteSuggestions && note.length > 0 && filteredNotes.length > 0 && (
               <motion.div
                 initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                 className="absolute top-full left-0 right-0 mt-1.5 rounded-[12px] overflow-hidden z-50 max-h-40 overflow-y-auto"
                 style={{ background: "var(--surface-raised)", border: "1px solid var(--divider)", boxShadow: "0 8px 24px color-mix(in srgb, var(--ink) 12%, transparent)" }}>
                 {filteredNotes.map((s, i) => (
                   <div key={i} 
                     onClick={() => { setNote(s); setShowNoteSuggestions(false); }}
                     className="px-4 py-3 border-b border-[var(--divider)] last:border-b-0 active:bg-ink/5 cursor-pointer text-[var(--ink)] transition-colors"
                     style={{ fontSize: 13.5 }}>
                     {renderHighlightedNote(s, note)}
                   </div>
                 ))}
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* ── Category Section (Income/Expense only) ── */}
        {txType !== "transfer" && (
          <div className="mb-4">
            <div className="flex items-center justify-between mx-4 mb-2">
               <p className="text-[11px] tracking-[0.07em] uppercase text-[var(--ink-muted)] m-0">Category</p>
               {catId && (
                  <button onClick={resetCat}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-[10px]"
                    style={{ background: "var(--divider)", fontSize: 10, color: "color-mix(in srgb, var(--ink) 45%, transparent)" }}>
                    <X className="w-2.5 h-2.5" /> Clear
                  </button>
                )}
            </div>
            {errors.cat && (
              <p className="px-4 text-rose-400 mb-1" style={{ fontSize: 11 }}>{errors.cat}</p>
            )}
            
            {/* Horizontal Scroll Categories */}
            <div className="flex overflow-x-auto gap-2 px-4 pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style dangerouslySetInnerHTML={{__html: `::-webkit-scrollbar { display: none; }`}} />
              {cats.map(c => {
                const isSel = catId === c.id;
                return (
                  <motion.button key={c.id}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      if (catId === c.id) { setShowSubSheet(true); return; }
                      setCatId(c.id); setSubId(null); setErrors(e => ({ ...e, cat: undefined! }));
                      setShowSubSheet(true);
                    }}
                    className="bg-[var(--surface)] rounded-[14px] p-2.5 flex flex-col items-center gap-2 flex-shrink-0 w-[72px]"
                    style={{
                      background: isSel ? `${typeAccent}33` : "var(--surface)",
                      boxShadow: isSel ? `inset 0 0 0 1.5px ${typeAccent}` : "none",
                    }}>
                    <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center"
                       style={{
                          background: isSel ? `${typeAccent}25` : "var(--surface-raised)",
                          color: isSel ? typeAccent : "var(--ink-muted)"
                       }}>
                      {c.icon ? <c.icon className="w-4 h-4" /> : <span style={{ fontSize: 16 }}>{c.emoji}</span>}
                    </div>
                    <span className="text-[10px] text-center leading-[1.2]" style={{ color: isSel ? "var(--ink)" : "var(--ink-muted)" }}>
                      {c.name.replace(" &", "").replace(" and", "").replace("& ", "").slice(0, 10)}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Selected subcategory display */}
            <AnimatePresence>
              {catId && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
                  className="px-4 mt-2 overflow-hidden">
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-[12px]"
                    style={{
                      background: selectedCat ? `${selectedCat.color}10` : "color-mix(in srgb, var(--ink) 5%, transparent)",
                      border: `1px solid ${selectedCat?.color ?? "#fff"}22`,
                    }}>
                      {selectedCat?.icon ? <selectedCat.icon className="w-4 h-4" style={{ color: selectedCat.color }} /> : <span style={{ fontSize: 14 }}>{selectedCat?.emoji}</span>}
                      <div className="flex-1 ml-1">
                        <div className="flex items-baseline gap-2">
                           <p className="text-ink font-semibold m-0" style={{ fontSize: 12 }}>{selectedCat?.name}</p>
                           {subId && <span className="text-ink/60 m-0" style={{ fontSize: 11 }}>→ {selectedSub?.name}</span>}
                        </div>
                      </div>
                      <ChevronRight className="w-3 h-3 text-ink/30" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Grid: Account & Date ── */}
        <div className="grid grid-cols-2 gap-3 mx-4 mb-4">
           {/* Account */}
           <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowAccSheet(true)}
              className="rounded-[14px] p-3 flex items-center gap-2.5 text-left"
              style={{
                 background: `${typeAccent}25`,
                 border: errors.acc ? "1px solid #EF4444" : "none"
              }}>
              <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,0,0,0.2)", color: typeAccent }}>
                 {(() => {
                   const AccIcon = getAccountIcon(selectedAcc.type);
                   return <AccIcon className="w-[14px] h-[14px]" />;
                 })()}
              </div>
              <div className="flex-1 overflow-hidden">
                 <p className="m-0 text-[11.5px] font-medium text-[var(--ink)] truncate">{selectedAcc.name}</p>
                 <span className="text-[11.5px] font-semibold tabular-nums" style={{ color: typeAccent }}>₹{Math.abs(selectedAcc.balance).toLocaleString("en-IN")}</span>
              </div>
           </motion.button>

           {/* Date & Time */}
           <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowDate(true)}
              className="bg-[var(--surface)] rounded-[14px] p-3 flex items-center gap-2.5">
              <div className="w-[30px] h-[30px] rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: "var(--orange-bg)", color: "var(--orange)" }}>
                 <Calendar className="w-[14px] h-[14px]" />
              </div>
              <div className="flex-1 overflow-hidden text-left">
                 <p className="m-0 text-[11.5px] text-[var(--ink-muted)]">Date & time</p>
                 <span className="text-[11.5px] font-medium text-[var(--ink)] truncate block">{fmtDate(date)}</span>
              </div>
           </motion.button>
        </div>

        {errors.acc && <p className="text-rose-400 mt-0.5 mb-2 px-5" style={{ fontSize: 11 }}>{errors.acc}</p>}

        {/* ── Transfer To Account (replaces Date in the grid layout if transfer, or adds new row) ── */}
        {txType === "transfer" && (
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowToAcc(true)}
             className="mx-4 mb-4 rounded-[14px] p-3 flex items-center gap-2.5 text-left w-[calc(100%-32px)]"
             style={{
                background: selectedTo ? `${selectedTo.color}25` : "color-mix(in srgb, var(--ink) 5%, transparent)",
                border: errors.toAcc ? "1px solid #EF4444" : "none"
             }}>
             {selectedTo ? (
                <>
                   <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,0,0,0.2)", color: selectedTo.color }}>
                      {(() => {
                        const ToAccIcon = getAccountIcon(selectedTo.type);
                        return <ToAccIcon className="w-[14px] h-[14px]" />;
                      })()}
                   </div>
                   <div className="flex-1 overflow-hidden">
                      <p className="m-0 text-[12px] font-medium text-[var(--ink)] truncate">To: {selectedTo.name}</p>
                      <span className="text-[12px] font-semibold tabular-nums" style={{ color: selectedTo.color }}>₹{Math.abs(selectedTo.balance).toLocaleString("en-IN")}</span>
                   </div>
                   <ChevronDown className="w-[14px] h-[14px] ml-2" style={{ color: selectedTo.color }} strokeWidth={1.75} />
                </>
             ) : (
                <>
                   <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--divider)", color: "var(--ink-muted)" }}>
                      <Plus className="w-[14px] h-[14px]" />
                   </div>
                   <p className="flex-1 m-0 text-[13px] font-medium text-[var(--ink-muted)]">Select destination account</p>
                </>
             )}
          </motion.button>
        )}

        {/* ── Spacer to push actions to bottom ── */}
        <div className="flex-1 min-h-[8px]" />

        {/* ── Compact Action Row (Attachments, Recurring, AI) ── */}
        <div className="flex gap-2.5 mx-4 mb-4 mt-2">
           {/* Scan AI (Primary secondary action) */}
           <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAIScan}
              disabled={aiScanning}
              className="flex-[2] rounded-[14px] py-3.5 flex items-center justify-center gap-2 text-[13.5px] font-semibold text-[#241B0A]"
              style={{ background: "linear-gradient(135deg, var(--gold), #E8B86B)" }}>
              {aiScanning ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 rounded-full border-2 border-[#241B0A]/30 border-t-[#241B0A]" />
              ) : (
                <>
                   <Sparkles className="w-[14px] h-[14px] stroke-[#241B0A]" />
                   Scan Receipt
                </>
              )}
           </motion.button>
           
           {/* Camera / Gallery mini buttons */}
           <div className="flex gap-2 flex-1">
             <motion.button whileTap={{ scale: 0.96 }}
                onClick={() => setShowCamera(true)}
                className="flex-1 bg-[var(--surface)] rounded-[14px] flex items-center justify-center text-[var(--ink-muted)]">
                <Camera className="w-[15px] h-[15px]" />
             </motion.button>
             <motion.button whileTap={{ scale: 0.96 }}
                onClick={() => document.getElementById("receipt-file-input")?.click()}
                className="flex-1 bg-[var(--surface)] rounded-[14px] flex items-center justify-center text-[var(--ink-muted)]">
                <ImageIcon className="w-[15px] h-[15px]" />
             </motion.button>
           </div>
           
           {/* Recurring Mini Toggle */}
           <motion.button whileTap={{ scale: 0.96 }} onClick={() => setRecurring(!recurring)}
              className="px-4 bg-[var(--surface)] rounded-[14px] flex items-center justify-center transition-colors"
              style={{ color: recurring ? "var(--gold)" : "var(--ink-muted)", border: recurring ? "1px solid var(--gold)" : "1px solid transparent" }}>
              <Repeat className="w-[15px] h-[15px]" />
           </motion.button>
        </div>

        <AnimatePresence>
          {recurring && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 mb-4 overflow-hidden">
              <div className="p-3.5 rounded-[14px]" style={{ background: "var(--surface)", border: `1px solid ${typeAccent}30` }}>
                <p className="text-ink/60 font-semibold mb-2.5" style={{ fontSize: 11, letterSpacing: "0.5px" }}>RECURRING SETTINGS</p>
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowRepeatSheet(true)}>
                    <span className="text-ink" style={{ fontSize: 13 }}>Frequency</span>
                    <span className="font-semibold" style={{ fontSize: 13, color: typeAccent }}>
                      {REPEAT_OPTIONS.find(o => o.id === recurFreq)?.label || "Every Month"}
                    </span>
                  </div>
                  <div className="h-px bg-ink/5" />
                  <div className="flex items-center justify-between">
                    <span className="text-ink" style={{ fontSize: 13 }}>Ends</span>
                    <select
                      value={recurEndType} onChange={e => setRecurEndType(e.target.value as any)}
                      className="bg-transparent text-right font-semibold focus:outline-none"
                      style={{ fontSize: 13, color: typeAccent }}>
                      <option value="never">Never</option>
                      <option value="date">On Date</option>
                    </select>
                  </div>
                  {recurEndType === "date" && (
                    <button onClick={() => setShowRecurEndDate(true)}
                      className="w-full text-right mt-1" style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                      Selected: {fmtDate(recurEndDate)}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Save Button ── */}
        <div className="mx-4 mt-2 mb-2">
           <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              className="w-full rounded-[16px] py-4 flex items-center justify-center gap-2 text-[15px] font-semibold"
              style={{ background: typeAccent, color: "#241310" }}>
              <Check className="w-[15px] h-[15px]" style={{ stroke: "#241310" }} strokeWidth={2.5} />
              Save Transaction
           </motion.button>
        </div>

      </div>

      {/* ── Modals / Overlays ── */}
      <AnimatePresence>
        {showCalc && <CalcModal key="calc" value={amount} onChange={setAmount} onClose={() => setShowCalc(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showRepeatSheet && (
          <RepeatSelectionModal
            key="repeat"
            selected={recurFreq}
            onSelect={(val) => {
              if (val === 'none') {
                setRecurring(false);
                setRecurFreq('monthly');
              } else {
                setRecurring(true);
                setRecurFreq(val);
              }
            }}
            onClose={() => setShowRepeatSheet(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSubSheet && selectedCat && (
          <SubcategorySheet
            key="sub"
            cat={selectedCat}
            selectedSubId={subId}
            onSelect={s => {
              setSubId(s.id);
              setShowSubSheet(false);
              // Move to the next field
              setTimeout(() => {
                setShowAccSheet(true);
              }, 300);
            }}
            onClose={() => setShowSubSheet(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAccSheet && (
          <AccountSheet
            accounts={ACCOUNTS}
            selected={accId} onSelect={a => setAccId(a.id)}
            onClose={() => setShowAccSheet(false)}
            excludeId={txType === "transfer" ? toAccId : undefined} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showToAcc && (
          <AccountSheet
            accounts={ACCOUNTS}
            selected={toAccId} onSelect={a => setToAccId(a.id)}
            onClose={() => setShowToAcc(false)}
            excludeId={accId} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showDate && <DatePickerModal key="tx-date" date={date} onSelect={setDate} onClose={() => setShowDate(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showRecurEndDate && (
          <DatePickerModal key="recur-end-date" date={recurEndDate} onSelect={setRecurEndDate} onClose={() => setShowRecurEndDate(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {saved && <SuccessOverlay key="success" txType={txType} onDone={() => navigate("/dashboard/transactions")} />}
      </AnimatePresence>
      <AnimatePresence>
        {showCamera && (
          <CameraModal 
            key="camera"
            onCapture={(base64) => {
              setShowCamera(false);
              processReceiptData(base64);
            }} 
            onClose={() => setShowCamera(false)} 
          />
        )}
      </AnimatePresence>
      <input
        type="file"
        id="receipt-file-input"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelection}
      />

    </div>
  );
}
