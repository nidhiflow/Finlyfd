import { useState } from "react";
import { motion } from "motion/react";
import { X, Check } from "lucide-react";

const EMOJIS = [
  "💰","🏠","🚗","✈️","🍔","🛒","💊","🏋️","💻","📱",
  "🎮","🎬","📚","💳","🎁","❤️","⭐","🔥","💡","🛍️",
  "🔧","🎯","💼","🎓","🍕","☕","🎨","🐾","🌱","🧹",
];

const COLORS = [
  "#FF6B35","#06D6A0","#F72585","#F7931A","#845EC2",
  "#2EC4B6","#22C55E","#4895EF","#C77DFF","#FFB703",
];

interface Props {
  type: "expense" | "income";
  accent: string;
  onClose: () => void;
  onCreate: (name: string, emoji: string, color: string) => void;
}

/** Bottom sheet for creating a custom category without leaving Add Transaction. */
export function QuickCategorySheet({ type, accent, onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(type === "income" ? "💰" : "📝");
  const [color, setColor] = useState(type === "income" ? "#22C55E" : COLORS[0]);
  const canSave = name.trim().length > 0;
  const submit = () => canSave && onCreate(name.trim(), emoji, color);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        onClick={e => e.stopPropagation()}
        role="dialog" aria-label="New category"
        className="w-full max-w-md mx-auto rounded-t-3xl px-5 pt-3 pb-8"
        style={{ background: "var(--surface)", border: "1px solid var(--divider)", borderBottom: "none", maxHeight: "90vh", overflowY: "auto" }}
      >
        <div className="flex justify-center pb-3">
          <div className="w-9 h-1 rounded-full" style={{ background: "var(--divider)" }} />
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[var(--ink)] font-bold" style={{ fontSize: 18 }}>
            New {type === "income" ? "income" : "expense"} category
          </h2>
          <button onClick={onClose} aria-label="Close"
            className="w-8 h-8 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--divider)" }}>
            <X className="w-4 h-4 text-[var(--ink-muted)]" />
          </button>
        </div>

        <label className="text-[11px] tracking-[0.07em] uppercase text-[var(--ink-muted)] block mb-2">Name</label>
        <input
          autoFocus value={name} maxLength={30}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="e.g. Pet Care"
          className="w-full px-4 py-3 rounded-2xl text-[var(--ink)] outline-none mb-4"
          style={{ background: "var(--surface-raised)", border: `1px solid ${name ? color + "66" : "var(--divider)"}`, fontSize: 15 }}
        />

        <label className="text-[11px] tracking-[0.07em] uppercase text-[var(--ink-muted)] block mb-2">Icon</label>
        <div className="grid grid-cols-10 gap-1 mb-4">
          {EMOJIS.map(e => (
            <button key={e} onClick={() => setEmoji(e)} aria-label={`Icon ${e}`}
              className="h-9 rounded-xl flex items-center justify-center text-lg"
              style={{
                background: emoji === e ? `${color}33` : "var(--surface-raised)",
                border: emoji === e ? `1px solid ${color}` : "1px solid transparent",
              }}>
              {e}
            </button>
          ))}
        </div>

        <label className="text-[11px] tracking-[0.07em] uppercase text-[var(--ink-muted)] block mb-2">Colour</label>
        <div className="grid grid-cols-10 gap-1.5 mb-6">
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} aria-label={`Colour ${c}`}
              className="aspect-square rounded-xl flex items-center justify-center"
              style={{ background: c, opacity: color === c ? 1 : 0.45, border: color === c ? "2px solid var(--ink)" : "none" }}>
              {color === c && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </button>
          ))}
        </div>

        <button onClick={submit} disabled={!canSave}
          className="w-full py-3.5 rounded-2xl font-bold text-white disabled:opacity-40"
          style={{ background: accent, fontSize: 14 }}>
          Create category
        </button>
      </motion.div>
    </motion.div>
  );
}
