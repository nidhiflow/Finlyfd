import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown, Pencil, Trash2, Plus, X, Check,
  Search, Star, Sparkles, Zap, Crown, TrendingUp,
  Wallet, FolderOpen,
} from "lucide-react";
// ─── Single Source of Truth ────────────────────────────────────────────────────
// Cat & Sub types and ALL category data now live in CategoryContext.
// This screen reads from and writes to that shared context so that
// AddTransactionScreen (and every other consumer) stays perfectly in sync.
import { useCategoryContext, Cat, Sub } from "../context/CategoryContext";
import { authAPI } from "../services/api";
import { PremiumFeatureGate } from "../components/PremiumFeatureGate";

// ─── Types local to this screen ───────────────────────────────────────────────
type ModalMode =
  | { kind: "add-cat";  activeType: "expense" | "income" }
  | { kind: "edit-cat"; cat: Cat }
  | { kind: "add-sub";  parentId: string }
  | { kind: "edit-sub"; parentId: string; sub: Sub };
type DelTarget =
  | { kind: "cat"; id: string; name: string }
  | { kind: "sub"; id: string; name: string; parentId: string };

// ─── Color Palette ─────────────────────────────────────────────────────────────
const PALETTE = [
  "#D4A24C","#D4A24C","#FF6B35","#06D6A0",
  "#F72585","#F7931A","#845EC2","#2EC4B6",
  "#FF6B9D","#22C55E","#4895EF","#C77DFF",
  "#FF4757","#FFB703","#2ED573","#00B4D8",
  "#7209B7","#3A0CA3","#48CAE4","#FB5607",
];

const QUICK_EMOJI = [
  "💰","🏠","🚗","✈️","🍔","🛒","💊","🏋️","💻","📱",
  "🎮","🎬","📚","💳","🏦","📊","🎁","❤️","⭐","🔥",
  "⚡","💡","🛍️","🏆","🔧","🎯","🚀","💼","🌍","🎓",
  "🍕","☕","🍺","🎨","📷","🏡","🧘","🌸","⛽","🪙",
  "🎵","🎸","🐾","🌱","📸","🧹","🍱","🏊","🎪","🛠️",
];

const AI_EXPENSE_SUGGESTIONS = [
  { name: "Pet Care",         emoji: "🐾", color: "#F7931A" },
  { name: "Music Classes",    emoji: "🎸", color: "#C77DFF" },
  { name: "Garden & Plants",  emoji: "🌱", color: "#22C55E" },
  { name: "Photography",      emoji: "📸", color: "#4895EF" },
  { name: "Cleaning Service", emoji: "🧹", color: "#D4A24C" },
  { name: "Online Courses",   emoji: "🎓", color: "#D4A24C" },
  { name: "Meal Prep",        emoji: "🍱", color: "#FF6B35" },
  { name: "Hobby & Craft",    emoji: "🎨", color: "#F72585" },
];

const AI_INCOME_SUGGESTIONS = [
  { name: "Pension",          emoji: "🏛️", color: "#2EC4B6" },
  { name: "Royalties",        emoji: "🎵", color: "#C77DFF" },
  { name: "Consulting Fees",  emoji: "🧑‍💼", color: "#4895EF" },
  { name: "Online Business",  emoji: "🌐", color: "#D4A24C" },
  { name: "Dividends",        emoji: "💹", color: "#22C55E" },
  { name: "Part-time Job",    emoji: "⏰", color: "#FF6B35" },
  { name: "Affiliate Income", emoji: "🔗", color: "#D4A24C" },
  { name: "Content Creator",  emoji: "🎥", color: "#F72585" },
];

// ─── Usage Dots ─────────────────────────────────────────────────────────────────
function UsageDots({ level, color }: { level: number; color: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="w-1 h-1 rounded-full transition-all"
          style={{ background: i <= level ? color : "var(--divider)" }} />
      ))}
    </div>
  );
}


// ─── Category Card ──────────────────────────────────────────────────────────────
function CategoryCard({
  cat, isExpanded, isPinned, isPrimary,
  onToggle, onEdit, onDelete, onPin, onTogglePrimary,
  onAddSub, onEditSub, onDeleteSub,
}: {
  cat: Cat; isExpanded: boolean; isPinned: boolean; isPrimary: boolean;
  onToggle: () => void; onEdit: () => void; onDelete: () => void;
  onPin: () => void; onTogglePrimary: () => void;
  onAddSub: () => void; onEditSub: (s: Sub) => void; onDeleteSub: (s: Sub) => void;
}) {
  const isIncome = cat.type === "income";

  // Primary income: border becomes green-ish with a glow
  const borderColor = isPrimary
    ? "rgba(34,197,94,0.45)"
    : isExpanded
      ? cat.color + "35"
      : "var(--divider)";

  const bg = isPrimary
    ? `linear-gradient(135deg, rgba(34,197,94,0.10) 0%, ${cat.color}0A 100%)`
    : isExpanded
      ? `linear-gradient(135deg, ${cat.color}12 0%, color-mix(in srgb, var(--ink) 3%, transparent) 100%)`
      : "linear-gradient(135deg, color-mix(in srgb, var(--ink) 5%, transparent) 0%, color-mix(in srgb, var(--ink) 2%, transparent) 100%)";

  return (
    <motion.div
      layout
      whileTap={{ scale: 0.982 }}
      transition={{ layout: { duration: 0.22 } }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: bg,
        border: `1px solid ${borderColor}`,
        boxShadow: isPrimary
          ? `0 4px 28px rgba(34,197,94,0.16)`
          : isExpanded ? `0 4px 28px ${cat.color}18` : "none",
      }}
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{ background: isPrimary
          ? "linear-gradient(180deg,#22C55E,#D4A24C)"
          : `linear-gradient(180deg, ${cat.color} 0%, ${cat.color}50 100%)` }} />

      {/* PRIMARY crown glow chip */}
      {isPrimary && (
        <div className="absolute top-2.5 right-12 flex items-center gap-1 px-2 py-0.5 rounded-full"
          style={{ background: "linear-gradient(135deg,rgba(34,197,94,0.25),rgba(212,162,76,0.12))", border: "1px solid rgba(34,197,94,0.35)" }}>
          <Crown className="w-2.5 h-2.5" style={{ color: "#22C55E" }} />
          <span style={{ fontSize: 9, fontWeight: 800, color: "#4ADE80", letterSpacing: "0.5px" }}>PRIMARY</span>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none" onClick={onToggle}>
        {/* Emoji bubble */}
        <div className="w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl relative"
          style={{
            background: isPrimary
              ? "linear-gradient(135deg,rgba(34,197,94,0.28) 0%,rgba(34,197,94,0.10) 100%)"
              : `linear-gradient(135deg, ${cat.color}32 0%, ${cat.color}14 100%)`,
            border: isPrimary
              ? "1.5px solid rgba(34,197,94,0.45)"
              : `1px solid ${cat.color}38`,
            boxShadow: isPrimary ? "0 0 12px rgba(34,197,94,0.3)" : "none",
          }}>
          {cat.icon ? <cat.icon className="w-6 h-6" style={{ color: "color-mix(in srgb, var(--ink) 85%, transparent)" }} /> : <span>{cat.emoji}</span>}
          {/* Pin badge for expense, Crown badge for income */}
          {!isIncome && isPinned && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FFB703] flex items-center justify-center"
              style={{ boxShadow: "0 2px 6px rgba(255,183,3,0.6)" }}>
              <Star className="w-2.5 h-2.5 text-ink fill-white" />
            </div>
          )}
          {isIncome && isPrimary && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#22C55E,#D4A24C)", boxShadow: "0 2px 8px rgba(34,197,94,0.6)" }}>
              <Crown className="w-2.5 h-2.5 text-ink" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-ink font-semibold leading-tight" style={{ fontSize: 14 }}>{cat.name}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-ink/38" style={{ fontSize: 11 }}>
              {cat.subs.length} {cat.subs.length === 1 ? "subcategory" : "subcategories"}
            </p>
            {/* Monthly income badge for primary income */}
            {isIncome && isPrimary && cat.monthlyEst && (
              <span className="px-1.5 py-0.5 rounded-full" style={{ fontSize: 10, fontWeight: 700, background: "rgba(34,197,94,0.18)", color: "#4ADE80" }}>
                {cat.monthlyEst}/mo
              </span>
            )}
            {cat.usage && !isPrimary && (
              <>
                <div className="w-px h-2.5 bg-ink/12" />
                <UsageDots level={cat.usage} color={isIncome ? "#22C55E" : cat.color} />
              </>
            )}
            {cat.isCustom && (
              <span className="px-1.5 py-0.5 rounded-full" style={{ fontSize: 9, fontWeight: 700, background: `${cat.color}25`, color: cat.color }}>CUSTOM</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0">
          {/* Expense: Star (pin) | Income: Crown (primary) */}
          {!isIncome ? (
            <motion.button whileTap={{ scale: 0.8 }}
              onClick={e => { e.stopPropagation(); onPin(); }}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-ink/6">
              <Star className={`w-3.5 h-3.5 transition-colors ${isPinned ? "text-[#FFB703] fill-[#FFB703]" : "text-ink/28"}`} />
            </motion.button>
          ) : (
            <motion.button whileTap={{ scale: 0.8 }}
              onClick={e => { e.stopPropagation(); onTogglePrimary(); }}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-ink/6"
              style={{ background: isPrimary ? "rgba(34,197,94,0.12)" : "transparent" }}>
              <Crown className={`w-3.5 h-3.5 transition-colors ${isPrimary ? "text-[#22C55E]" : "text-ink/28"}`} />
            </motion.button>
          )}
          <motion.button whileTap={{ scale: 0.8 }}
            onClick={e => { e.stopPropagation(); onEdit(); }}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-ink/6">
            <Pencil className="w-3.5 h-3.5 text-ink/40" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.8 }}
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-rose-500/12">
            <Trash2 className="w-3.5 h-3.5 text-rose-400/55" />
          </motion.button>
          <div className="w-7 h-8 flex items-center justify-center">
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.25, ease: [0.4,0,0.2,1] }}>
              <ChevronDown className="w-4 h-4 text-ink/30" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Expanded panel */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.4,0,0.2,1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="mx-4 h-px mb-3"
              style={{ background: `linear-gradient(to right, ${isPrimary ? "#22C55E" : cat.color}40, transparent)` }} />
            <div className="px-4 pb-3 space-y-0.5">
              {cat.subs.length === 0 && (
                <p className="text-ink/25 text-center py-3" style={{ fontSize: 12 }}>No subcategories yet</p>
              )}
              {cat.subs.map((sub, i) => (
                <motion.div key={sub.id}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.03, duration: 0.17 }}
                  className="flex items-center gap-2.5 pl-1 pr-1 py-1.5 rounded-xl hover:bg-ink/4 transition-colors group"
                >
                  <div className="relative flex-shrink-0 flex items-center" style={{ width: 34 }}>
                    <div className="absolute left-[9px] top-0 bottom-0 w-px"
                      style={{ background: isPrimary ? "rgba(34,197,94,0.22)" : `${cat.color}28` }} />
                    <div className="absolute left-[9px] top-1/2 w-2 h-px"
                      style={{ background: isPrimary ? "rgba(34,197,94,0.22)" : `${cat.color}28` }} />
                    <div className="relative z-10 w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                      style={{
                        background: isPrimary ? "rgba(34,197,94,0.14)" : `${cat.color}18`,
                        border: `1px solid ${isPrimary ? "rgba(34,197,94,0.22)" : cat.color + "25"}`,
                      }}>
                      {sub.icon ? <sub.icon className="w-4 h-4" style={{ color: "color-mix(in srgb, var(--ink) 75%, transparent)" }} /> : <span>{sub.emoji}</span>}
                    </div>
                  </div>
                  <span className="flex-1 text-ink/68" style={{ fontSize: 13 }}>{sub.name}</span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button whileTap={{ scale: 0.8 }} onClick={() => onEditSub(sub)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-ink/10">
                      <Pencil className="w-2.5 h-2.5 text-ink/45" />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.8 }} onClick={() => onDeleteSub(sub)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-rose-500/15">
                      <Trash2 className="w-2.5 h-2.5 text-rose-400/60" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
              <motion.button whileTap={{ scale: 0.97 }} onClick={onAddSub}
                className="mt-1.5 ml-1 flex items-center gap-1.5 py-2 px-3 rounded-xl hover:bg-ink/5 transition-colors"
                style={{ color: isPrimary ? "#22C55E" : cat.color, fontSize: 12, fontWeight: 600 }}>
                <Plus className="w-3.5 h-3.5" />
                Add Subcategory
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Pinned Strip (expense quick-access) ────────────────────────────────────────
function PinnedStrip({ cats, pinnedIds, onTap }: { cats: Cat[]; pinnedIds: Set<string>; onTap: (id: string) => void }) {
  const pinned = cats.filter(c => pinnedIds.has(c.id));
  if (!pinned.length) return null;
  return (
    <div className="px-4 pb-1">
      <div className="flex items-center gap-2 mb-2">
        <Star className="w-3 h-3 text-[#FFB703] fill-[#FFB703]" />
        <span className="text-ink/38" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.5px" }}>PINNED</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {pinned.map(c => (
          <motion.button key={c.id} whileTap={{ scale: 0.93 }} onClick={() => onTap(c.id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl"
            style={{ background: `linear-gradient(135deg,${c.color}22 0%,${c.color}10 100%)`, border: `1px solid ${c.color}38` }}>
            {c.icon ? <c.icon className="w-4 h-4" style={{ color: "color-mix(in srgb, var(--ink) 80%, transparent)" }} /> : <span style={{ fontSize: 15 }}>{c.emoji}</span>}
            <span className="text-ink/80 whitespace-nowrap" style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Category Modal ─────────────────────────────────────────────────────────────
function CategoryModal({
  modal, cats, onClose, onSave,
}: {
  modal: ModalMode; cats: Cat[];
  onClose: () => void;
  onSave: (name: string, emoji: string, color: string) => void;
}) {
  const isSubModal = modal.kind === "add-sub" || modal.kind === "edit-sub";
  const parentCat = isSubModal ? cats.find(c => c.id === (modal as any).parentId) : null;
  const isIncome = (modal.kind === "add-cat" && modal.activeType === "income")
    || (modal.kind === "edit-cat" && modal.cat.type === "income")
    || (parentCat?.type === "income");

  const [name,  setName]  = useState(() => modal.kind === "edit-cat" ? modal.cat.name  : modal.kind === "edit-sub" ? modal.sub.name  : "");
  const [emoji, setEmoji] = useState(() => modal.kind === "edit-cat" ? modal.cat.emoji : modal.kind === "edit-sub" ? modal.sub.emoji : isIncome ? "💰" : "📝");
  const [color, setColor] = useState(() => modal.kind === "edit-cat" ? modal.cat.color : isIncome ? "#22C55E" : PALETTE[0]);
  const [showAI, setShowAI] = useState(false);

  const btnColor = isSubModal ? (parentCat?.color ?? (isIncome ? "#22C55E" : PALETTE[0])) : color;
  const titles = { "add-cat": isIncome ? "New Income Category" : "New Category", "edit-cat": "Edit Category", "add-sub": "New Subcategory", "edit-sub": "Edit Subcategory" };
  const title = titles[modal.kind];
  const aiSuggestions = isIncome ? AI_INCOME_SUGGESTIONS : AI_EXPENSE_SUGGESTIONS;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(16px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ duration: 0.32, ease: [0.4,0,0.2,1] }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md mx-auto rounded-t-3xl"
        style={{
          background: isIncome
            ? "linear-gradient(180deg, #102218 0%, #0B1A10 50%, var(--bg-deep) 100%)"
            : "linear-gradient(180deg, var(--surface) 0%, var(--bg-deep) 100%)",
          border: `1px solid ${isIncome ? "rgba(34,197,94,0.15)" : "var(--divider)"}`,
          borderBottom: "none",
          maxHeight: "90vh", overflowY: "auto",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full" style={{ background: isIncome ? "rgba(34,197,94,0.3)" : "var(--divider)" }} />
        </div>

        <div className="px-5 pb-8 pt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-ink font-bold" style={{ fontSize: 19 }}>{title}</h2>
              {isIncome && !isSubModal && (
                <p className="flex items-center gap-1" style={{ fontSize: 12, color: "rgba(74,222,128,0.7)", marginTop: 2 }}>
                  <Wallet className="w-3 h-3" /> Income Category
                </p>
              )}
              {isSubModal && parentCat && (
                <p className="text-ink/38 mt-0.5" style={{ fontSize: 12 }}>
                  in <span className="inline-flex items-center gap-1" style={{ color: parentCat.color }}>{parentCat.icon ? <parentCat.icon className="w-3.5 h-3.5" /> : parentCat.emoji} {parentCat.name}</span>
                </p>
              )}
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--divider)", border: "1px solid var(--divider)" }}>
              <X className="w-4 h-4 text-ink/50" />
            </button>
          </div>

          {/* AI Suggest */}
          {modal.kind === "add-cat" && (
            <div className="mb-4">
              <button onClick={() => setShowAI(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all"
                style={{
                  background: showAI
                    ? isIncome ? "linear-gradient(135deg,rgba(34,197,94,0.15),rgba(212,162,76,0.12))" : "linear-gradient(135deg,rgba(212,162,76,0.18),rgba(212,162,76,0.12))"
                    : "color-mix(in srgb, var(--ink) 5%, transparent)",
                  border: `1px solid ${showAI ? (isIncome ? "rgba(34,197,94,0.4)" : "rgba(212,162,76,0.4)") : "var(--divider)"}`,
                }}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: isIncome ? "linear-gradient(135deg,#22C55E,#D4A24C)" : "linear-gradient(135deg,#D4A24C,#D4A24C)" }}>
                    <Sparkles className="w-3.5 h-3.5 text-ink" />
                  </div>
                  <span className="font-semibold" style={{ fontSize: 13, color: showAI ? (isIncome ? "#4ADE80" : "#D4A24C") : "color-mix(in srgb, var(--ink) 60%, transparent)" }}>
                    {isIncome ? "AI Detect Income Type" : "AI Suggest Category"}
                  </span>
                </div>
                <Zap className="w-3.5 h-3.5" style={{ color: isIncome ? "#22C55E" : "#D4A24C" }} />
              </button>

              <AnimatePresence>
                {showAI && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="pt-2.5 pb-1">
                      <p className="text-ink/35 mb-2.5" style={{ fontSize: 11 }}>
                        {isIncome ? "Common income sources you might want to track:" : "Common categories based on spending patterns:"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {aiSuggestions.map(s => (
                          <motion.button key={s.name} whileTap={{ scale: 0.92 }}
                            onClick={() => { setName(s.name); setEmoji(s.emoji); setColor(s.color); setShowAI(false); }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl transition-all"
                            style={{ background: `${s.color}18`, border: `1px solid ${s.color}35` }}>
                            <span style={{ fontSize: 14 }}>{s.emoji}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.name}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Emoji */}
          <div className="mb-4">
            <label className="text-ink/40 mb-2.5 block" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.7px" }}>ICON</label>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${btnColor}2A 0%, ${btnColor}10 100%)`,
                  border: `1.5px solid ${btnColor}45`,
                  boxShadow: `0 4px 16px ${btnColor}20`,
                }}>
                {emoji}
              </div>
              <div className="flex-1">
                <input value={emoji}
                  onChange={e => { const v = e.target.value; if (v) setEmoji(v.trim().slice(0, 4)); }}
                  placeholder="Paste or type emoji"
                  className="w-full px-3.5 py-2.5 rounded-xl text-ink placeholder:text-ink/22 focus:outline-none"
                  style={{ background: "color-mix(in srgb, var(--ink) 6%, transparent)", border: "1px solid var(--divider)", fontSize: 14 }}
                />
                <p className="text-ink/28 mt-1" style={{ fontSize: 10 }}>Or pick from grid below</p>
              </div>
            </div>
            <div className="grid grid-cols-9 gap-1">
              {QUICK_EMOJI.map(e => (
                <button key={e} onClick={() => setEmoji(e)}
                  className="h-9 rounded-xl flex items-center justify-center text-lg transition-all"
                  style={{
                    background: emoji === e ? `${btnColor}28` : "color-mix(in srgb, var(--ink) 5%, transparent)",
                    border: emoji === e ? `1px solid ${btnColor}55` : "1px solid transparent",
                    transform: emoji === e ? "scale(1.12)" : "scale(1)",
                  }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="text-ink/40 mb-2 block" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.7px" }}>NAME</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder={isSubModal ? "Subcategory name…" : isIncome ? "Income category name…" : "Category name…"}
              onKeyDown={e => e.key === "Enter" && name.trim() && onSave(name.trim(), emoji, color)}
              className="w-full px-4 py-3.5 rounded-2xl text-ink placeholder:text-ink/22 focus:outline-none"
              style={{
                background: "color-mix(in srgb, var(--ink) 6%, transparent)",
                border: `1px solid ${name ? btnColor + "45" : "var(--divider)"}`,
                fontSize: 15, transition: "border-color 0.2s",
              }}
            />
          </div>

          {/* Color (categories only) */}
          {!isSubModal && (
            <div className="mb-5">
              <label className="text-ink/40 mb-2.5 block" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.7px" }}>ACCENT COLOR</label>
              <div className="grid grid-cols-10 gap-1.5">
                {PALETTE.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className="aspect-square rounded-xl flex items-center justify-center transition-all"
                    style={{
                      background: c, opacity: color === c ? 1 : 0.42,
                      transform: color === c ? "scale(1.15)" : "scale(1)",
                      boxShadow: color === c ? `0 4px 12px ${c}70` : "none",
                      border: color === c ? "2px solid color-mix(in srgb, var(--ink) 85%, transparent)" : "none",
                    }}>
                    {color === c && <Check className="w-3 h-3 text-ink" strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-4 rounded-2xl font-semibold text-ink/50"
              style={{ background: "color-mix(in srgb, var(--ink) 6%, transparent)", border: "1px solid var(--divider)", fontSize: 14 }}>
              Cancel
            </button>
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => name.trim() && onSave(name.trim(), emoji, color)}
              disabled={!name.trim()}
              className="flex-1 py-4 rounded-2xl text-ink font-bold disabled:opacity-35"
              style={{
                fontSize: 14,
                background: isIncome
                  ? "linear-gradient(135deg,#22C55E,#D4A24C)"
                  : `linear-gradient(135deg,${btnColor},${btnColor}bb)`,
                boxShadow: name.trim() ? `0 6px 22px ${isIncome ? "rgba(34,197,94,0.45)" : btnColor + "48"}` : "none",
              }}>
              {modal.kind.startsWith("add") ? "✦ Create" : "Save Changes"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Delete Confirm ─────────────────────────────────────────────────────────────
function DeleteModal({ target, onClose, onConfirm }: { target: DelTarget; onClose: () => void; onConfirm: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(16px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.86, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.86, opacity: 0 }} transition={{ duration: 0.22, ease: [0.4,0,0.2,1] }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl p-6"
        style={{ background: "var(--surface)", border: "1px solid var(--divider)" }}
      >
        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: "rgba(239,68,68,0.14)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <Trash2 className="w-6 h-6 text-rose-400" />
        </div>
        <h3 className="text-ink font-bold text-center mb-2" style={{ fontSize: 17 }}>
          Delete {target.kind === "cat" ? "Category" : "Subcategory"}?
        </h3>
        <p className="text-ink/42 text-center mb-6 leading-relaxed" style={{ fontSize: 13 }}>
          <span className="text-ink/68 font-medium">"{target.name}"</span> will be permanently removed.
          {target.kind === "cat" && <> All its subcategories will also be deleted.</>}
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl font-semibold text-ink/50"
            style={{ background: "color-mix(in srgb, var(--ink) 6%, transparent)", border: "1px solid var(--divider)", fontSize: 14 }}>
            Cancel
          </button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={onConfirm}
            className="flex-1 py-3.5 rounded-2xl font-bold text-ink"
            style={{ background: "linear-gradient(135deg,#F72585,#EF4444)", boxShadow: "0 6px 20px rgba(247,37,133,0.38)", fontSize: 14 }}>
            Delete
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export function CategoriesScreen() {
  // ── All category data comes from the shared context ───────────────────────────
  // Any mutation here is immediately visible in AddTransactionScreen too.
  const {
    categories: cats,
    addCategory, updateCategory, deleteCategory,
    addSubcategory, updateSubcategory, deleteSubcategory,
  } = useCategoryContext();

  const [activeType, setActiveType] = useState<"expense" | "income">("expense");
  const [expanded, setExpanded]     = useState<Set<string>>(new Set());
  const [pinned, setPinned]         = useState<Set<string>>(new Set(["food","transport","bills"]));
  const [primaryIncome, setPrimary] = useState<Set<string>>(new Set());
  const [search, setSearch]         = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [modal, setModal]           = useState<ModalMode | null>(null);
  const [delTarget, setDelTarget]   = useState<DelTarget | null>(null);
  const searchRef                   = useRef<HTMLInputElement>(null);
  const [showUpgradeGate, setShowUpgradeGate] = useState(false);

  const handleAddCategoryClick = () => {
    const user = authAPI.getCurrentUser();
    const isFree = (!user || !user.subscription_tier || user.subscription_tier.toLowerCase() === "free") && user.email?.toLowerCase() !== "nidhiflow.in@gmail.com";
    if (isFree) {
      setShowUpgradeGate(true);
    } else {
      setModal({ kind: "add-cat", activeType });
    }
  };

  const handleAddSubcategoryClick = (parentId: string) => {
    const user = authAPI.getCurrentUser();
    const isFree = (!user || !user.subscription_tier || user.subscription_tier.toLowerCase() === "free") && user.email?.toLowerCase() !== "nidhiflow.in@gmail.com";
    if (isFree) {
      setShowUpgradeGate(true);
    } else {
      setModal({ kind: "add-sub", parentId });
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const toggle = (id: string) => setExpanded(e => { const n = new Set(e); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const togglePin = (id: string) => setPinned(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const togglePrimary = (id: string) => setPrimary(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const closeModal = () => setModal(null);

  // ── All writes delegate to the context so every screen stays in sync ─────────
  const saveModal = (name: string, emoji: string, color: string) => {
    if (!modal) return;
    if (modal.kind === "add-cat") {
      addCategory({ name, emoji, color, type: modal.activeType, subs: [], usage: 1, isCustom: true });
    } else if (modal.kind === "edit-cat") {
      updateCategory(modal.cat.id, { name, emoji, color });
    } else if (modal.kind === "add-sub") {
      addSubcategory(modal.parentId, { name, emoji });
      setExpanded(e => new Set([...e, modal.parentId]));
    } else if (modal.kind === "edit-sub") {
      updateSubcategory(modal.parentId, modal.sub.id, { name, emoji });
    }
    closeModal();
  };

  const confirmDelete = () => {
    if (!delTarget) return;
    if (delTarget.kind === "cat") {
      deleteCategory(delTarget.id);
      setExpanded(e => { const n = new Set(e); n.delete(delTarget.id); return n; });
      setPinned(p =>  { const n = new Set(p); n.delete(delTarget.id); return n; });
      setPrimary(p => { const n = new Set(p); n.delete(delTarget.id); return n; });
    } else {
      deleteSubcategory(delTarget.parentId, delTarget.id);
    }
    setDelTarget(null);
  };

  // ── Filtered ──────────────────────────────────────────────────────────────────
  const isIncome = activeType === "income";
  const q = search.toLowerCase().trim();
  const visible = cats.filter(c =>
    c.type === activeType &&
    (!q || c.name.toLowerCase().includes(q) || c.subs.some(s => s.name.toLowerCase().includes(q)))
  ).sort((a, b) => {
    const aTop = isIncome ? primaryIncome.has(a.id) : pinned.has(a.id);
    const bTop = isIncome ? primaryIncome.has(b.id) : pinned.has(b.id);
    if (aTop && !bTop) return -1;
    if (!aTop && bTop) return 1;
    return 0;
  });
  const expCount = cats.filter(c => c.type === "expense").length;
  const incCount = cats.filter(c => c.type === "income").length;

  // FAB gradient: purple for expense, green for income
  const fabGrad = isIncome
    ? "linear-gradient(135deg,#22C55E 0%,#D4A24C 100%)"
    : "linear-gradient(135deg,#D4A24C 0%,#D4A24C 100%)";
  const fabShadow = isIncome
    ? "0 8px 32px rgba(34,197,94,0.58)"
    : "0 8px 32px rgba(212,162,76,0.58)";

  return (
    <div className="relative pb-32"
      style={{ background: "var(--bg-deep)", minHeight:"calc(100vh - 56px)" }}>

      {/* Top radial glow — shifts color per tab */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-28 pointer-events-none"
        style={{ background: isIncome
          ? "radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.10) 0%, transparent 70%)"
          : "radial-gradient(ellipse at 50% 0%, rgba(212,162,76,0.11) 0%, transparent 70%)" }} />

      {/* ── Search bar ── */}
      <AnimatePresence>
        {showSearch && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
            exit={{ height:0, opacity:0 }} transition={{ duration:0.22 }}
            className="px-4 pt-3 overflow-hidden">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/35" />
              <input ref={searchRef} autoFocus value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search categories & subcategories…"
                className="w-full pl-10 pr-9 py-3 rounded-2xl text-ink placeholder:text-ink/25 focus:outline-none"
                style={{
                  background: "var(--divider)",
                  border: `1px solid ${isIncome ? "rgba(34,197,94,0.28)" : "rgba(212,162,76,0.28)"}`,
                  fontSize: 13,
                }}
              />
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

      {/* ── Type Toggle ── */}
      <div className="px-4 pt-4 pb-1">
        <div className="relative flex p-1 rounded-2xl"
          style={{ background:"color-mix(in srgb, var(--ink) 5%, transparent)", border:"1px solid var(--divider)" }}>
          <motion.div className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl"
            animate={{ left: activeType === "expense" ? 4 : "calc(50%)" }}
            transition={{ duration:0.3, ease:[0.4,0,0.2,1] }}
            style={{
              background: activeType === "expense"
                ? "linear-gradient(135deg,#F72585 0%,#D4A24C 100%)"
                : "linear-gradient(135deg,#22C55E 0%,#D4A24C 100%)",
              boxShadow: activeType === "expense"
                ? "0 4px 16px rgba(247,37,133,0.3)"
                : "0 4px 16px rgba(34,197,94,0.3)",
            }} />
          {(["expense","income"] as const).map(t => (
            <button key={t} onClick={() => setActiveType(t)}
              className="relative flex-1 py-3 rounded-xl flex items-center justify-center gap-2 z-10 transition-all">
              {t === "expense"
                ? <Wallet className="w-3.5 h-3.5" style={{ color: activeType === t ? "white" : "color-mix(in srgb, var(--ink) 35%, transparent)" }} />
                : <TrendingUp className="w-3.5 h-3.5" style={{ color: activeType === t ? "white" : "color-mix(in srgb, var(--ink) 35%, transparent)" }} />}
              <span style={{ fontSize:13, fontWeight:700, color: activeType === t ? "white" : "color-mix(in srgb, var(--ink) 35%, transparent)" }}>
                {t === "expense" ? "Expense" : "Income"}
              </span>
              <span className="rounded-full px-1.5 py-0.5" style={{
                fontSize:10, fontWeight:800,
                background: activeType === t ? "var(--divider)" : "var(--divider)",
                color: activeType === t ? "white" : "color-mix(in srgb, var(--ink) 30%, transparent)",
              }}>{t === "expense" ? expCount : incCount}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: isIncome ? "#22C55E" : "#D4A24C" }} />
          <p className="text-ink/35" style={{ fontSize:11, fontWeight:500 }}>
            {visible.length} categories · {visible.reduce((a,c) => a+c.subs.length, 0)} subcategories
          </p>
        </div>
        <button onClick={() => { setShowSearch(v => !v); if (showSearch) setSearch(""); }}
          className="w-7 h-7 rounded-xl flex items-center justify-center transition-all"
          style={{
            background: showSearch ? (isIncome ? "rgba(34,197,94,0.2)" : "rgba(212,162,76,0.22)") : "color-mix(in srgb, var(--ink) 6%, transparent)",
            border: `1px solid ${showSearch ? (isIncome ? "rgba(34,197,94,0.4)" : "rgba(212,162,76,0.4)") : "var(--divider)"}`,
          }}>
          <Search className="w-3.5 h-3.5" style={{ color: showSearch ? (isIncome ? "#4ADE80" : "#D4A24C") : "color-mix(in srgb, var(--ink) 38%, transparent)" }} />
        </button>
      </div>



      {/* ── Pinned Strip (expense tab only) ── */}
      {!isIncome && (
        <PinnedStrip
          cats={cats.filter(c => c.type === "expense")}
          pinnedIds={pinned}
          onTap={id => toggle(id)}
        />
      )}

      {/* ── Primary Income hint (income tab) ── */}
      {isIncome && primaryIncome.size === 0 && (
        <div className="mx-4 mb-3 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
          style={{ background:"rgba(34,197,94,0.07)", border:"1px dashed rgba(34,197,94,0.22)" }}>
          <Crown className="w-4 h-4 flex-shrink-0" style={{ color:"rgba(34,197,94,0.6)" }} />
          <p className="flex items-center gap-1 flex-wrap" style={{ fontSize:12, color:"color-mix(in srgb, var(--ink) 42%, transparent)", lineHeight:1.4 }}>
            Tap <Crown className="w-3 h-3 inline" style={{ color:"rgba(74,222,128,0.8)" }} /> on a category to mark it as your primary income source
          </p>
        </div>
      )}

      {/* ── Category List ── */}
      <div className="px-4 pb-4 space-y-2.5">
        {visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
              style={{ background:"color-mix(in srgb, var(--ink) 5%, transparent)", border:"1px solid var(--divider)" }}>
              {search
                ? <Search className="w-7 h-7 text-ink/30" />
                : isIncome ? <Wallet className="w-7 h-7 text-ink/30" /> : <FolderOpen className="w-7 h-7 text-ink/30" />}
            </div>
            <p className="text-ink/38 text-center" style={{ fontSize:14 }}>
              {search ? `No results for "${search}"` : isIncome ? "No income categories yet" : "No categories yet"}
            </p>
            {!search && (
              <motion.button whileTap={{ scale:0.96 }} onClick={handleAddCategoryClick}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl"
                style={{ background: fabGrad, boxShadow: fabShadow }}>
                <Plus className="w-4 h-4 text-ink" />
                <span className="text-ink font-bold" style={{ fontSize:14 }}>
                  Add {isIncome ? "Income " : ""}Category
                </span>
              </motion.button>
            )}
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {visible.map(cat => (
            <motion.div key={cat.id} id={`cat-${cat.id}`}
              layout
              initial={{ opacity:0, y:14 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-8, scale:0.95 }}
              transition={{ duration:0.22 }}
            >
              <CategoryCard
                cat={cat}
                isExpanded={expanded.has(cat.id)}
                isPinned={pinned.has(cat.id)}
                isPrimary={primaryIncome.has(cat.id)}
                onToggle={() => toggle(cat.id)}
                onPin={() => togglePin(cat.id)}
                onTogglePrimary={() => togglePrimary(cat.id)}
                onEdit={() => setModal({ kind:"edit-cat", cat })}
                onDelete={() => setDelTarget({ kind:"cat", id:cat.id, name:cat.name })}
                onAddSub={() => handleAddSubcategoryClick(cat.id)}
                onEditSub={sub => setModal({ kind:"edit-sub", parentId:cat.id, sub })}
                onDeleteSub={sub => setDelTarget({ kind:"sub", id:sub.id, name:sub.name, parentId:cat.id })}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── FAB ── */}
      <motion.button
        whileTap={{ scale:0.88 }}
        onClick={handleAddCategoryClick}
        className="fixed z-40 flex items-center justify-center rounded-2xl"
        style={{
          bottom:90, right:20, width:56, height:56,
          background: fabGrad,
          boxShadow: fabShadow,
          animation: "catFabBreathe 3s ease-in-out infinite",
        }}
      >
        <Plus className="w-6 h-6 text-ink" strokeWidth={2.8} />
      </motion.button>

      {/* ── Modals ── */}
      <AnimatePresence>
        {modal && (
          <CategoryModal key="modal" modal={modal} cats={cats} onClose={closeModal} onSave={saveModal} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {delTarget && (
          <DeleteModal key="del" target={delTarget} onClose={() => setDelTarget(null)} onConfirm={confirmDelete} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showUpgradeGate && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm shadow-2xl" onClick={() => setShowUpgradeGate(false)} />
            <div className="relative max-w-sm w-full">
              <PremiumFeatureGate
                featureName="Custom Categories"
                requiredTier="Pro"
                benefits={[
                  "Create unlimited custom categories & subcategories",
                  "Choose from a rich palette of 20+ accent colors",
                  "Personalize with 50+ custom emoji tags",
                  "Organize transactions exactly how you want"
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
        @keyframes catFabBreathe {
          0%,100% { box-shadow: ${fabShadow}; transform: scale(1); }
          50%      { box-shadow: ${isIncome ? "0 8px 48px rgba(34,197,94,0.88), 0 0 0 10px rgba(34,197,94,0.10)" : "0 8px 48px rgba(212,162,76,0.88), 0 0 0 10px rgba(212,162,76,0.10)"}; transform: scale(1.055); }
        }
      `}</style>
    </div>
  );
}




