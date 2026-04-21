import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onSelect: (start: Date, end: Date) => void;
  onClose: () => void;
}

export function DateRangePicker({ startDate, endDate, onSelect, onClose }: DateRangePickerProps) {
  const [view, setView] = useState(new Date(startDate || new Date()));
  const [start, setStart] = useState<Date | null>(startDate);
  const [end, setEnd] = useState<Date | null>(endDate);
  const today = new Date();

  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const firstDay = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1);

  const handleDayTap = (day: number) => {
    const picked = new Date(view.getFullYear(), view.getMonth(), day);
    if (!start || (start && end) || picked < start) {
      setStart(picked);
      setEnd(null);
    } else {
      setEnd(picked);
    }
  };

  const handleConfirm = () => {
    if (start && end) {
      onSelect(start, end);
      onClose();
    }
  };

  const handleQuickSelect = (days: number, label: string) => {
    const e = new Date();
    const s = new Date();
    s.setDate(s.getDate() - days);
    setStart(s);
    setEnd(e);
    setView(new Date(e.getFullYear(), e.getMonth(), 1));
  };

  const isInRange = (day: number) => {
    if (!start || !end) return false;
    const d = new Date(view.getFullYear(), view.getMonth(), day);
    return d >= start && d <= end;
  };

  const isStart = (day: number) => {
    if (!start) return false;
    const d = new Date(view.getFullYear(), view.getMonth(), day);
    return d.toDateString() === start.toDateString();
  };

  const isEnd = (day: number) => {
    if (!end) return false;
    const d = new Date(view.getFullYear(), view.getMonth(), day);
    return d.toDateString() === end.toDateString();
  };

  const formatDate = (d: Date | null) => d ? `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}` : "—";

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
        className="w-full max-w-md mx-auto rounded-t-3xl p-5"
        style={{ background: "linear-gradient(180deg,#16203A 0%,#0E1424 100%)", border: "1px solid rgba(255,255,255,0.09)", borderBottom: "none" }}>
        <div className="flex justify-center mb-3">
          <div className="w-9 h-1 rounded-full bg-white/15" />
        </div>

        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-bold" style={{ fontSize: 17 }}>Select Date Range</p>
          <button onClick={onClose}
            className="w-8 h-8 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.07)" }}>
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        {/* Selected range preview */}
        <div className="mb-4 py-2.5 px-4 rounded-xl flex items-center justify-center gap-3"
          style={{ background: "rgba(124,92,255,0.12)", border: "1px solid rgba(124,92,255,0.25)" }}>
          <span className="text-white font-semibold" style={{ fontSize: 13 }}>{formatDate(start)}</span>
          <span className="text-white/30" style={{ fontSize: 12 }}>→</span>
          <span className="text-white font-semibold" style={{ fontSize: 13 }}>{formatDate(end)}</span>
        </div>

        {/* Quick selects */}
        <div className="flex gap-2 mb-4">
          {[
            { label: "Last 7 days", days: 7 },
            { label: "Last 30 days", days: 30 },
            { label: "Last 90 days", days: 90 },
          ].map(q => (
            <button key={q.label} onClick={() => handleQuickSelect(q.days, q.label)}
              className="flex-1 py-2 rounded-xl text-center active:scale-95 transition-transform"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.55)",
              }}>
              {q.label}
            </button>
          ))}
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setView(v => new Date(v.getFullYear(), v.getMonth() - 1, 1))}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/7 active:scale-90 transition-transform">
            <ChevronLeft className="w-4 h-4 text-white/55" />
          </button>
          <p className="text-white font-bold" style={{ fontSize: 16 }}>
            {MONTHS_SHORT[view.getMonth()]} {view.getFullYear()}
          </p>
          <button onClick={() => setView(v => new Date(v.getFullYear(), v.getMonth() + 1, 1))}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/7 active:scale-90 transition-transform">
            <ChevronRight className="w-4 h-4 text-white/55" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => (
            <p key={d} className="text-center text-white/30 font-semibold" style={{ fontSize: 11 }}>{d}</p>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-y-1 mb-4">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const sel = isStart(day) || isEnd(day);
            const inRange = isInRange(day);
            const isToday = new Date(view.getFullYear(), view.getMonth(), day).toDateString() === today.toDateString();
            return (
              <motion.button key={day} whileTap={{ scale: 0.85 }}
                onClick={() => handleDayTap(day)}
                className="aspect-square rounded-full flex items-center justify-center relative"
                style={{
                  background: sel ? "linear-gradient(135deg,#7C5CFF,#4CC9F0)"
                    : inRange ? "rgba(124,92,255,0.18)"
                    : isToday ? "rgba(124,92,255,0.10)"
                    : "transparent",
                  boxShadow: sel ? "0 4px 12px rgba(124,92,255,0.45)" : "none",
                }}>
                <span style={{
                  fontSize: 13,
                  fontWeight: sel || isToday ? 700 : 400,
                  color: sel ? "white" : inRange ? "#9D7EFF" : isToday ? "#9D7EFF" : "rgba(255,255,255,0.65)",
                }}>
                  {day}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl font-semibold text-white/50"
            style={{ background: "rgba(255,255,255,0.055)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 14 }}>
            Cancel
          </button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleConfirm}
            disabled={!start || !end}
            className="flex-1 py-3.5 rounded-2xl text-white font-bold"
            style={{
              fontSize: 14,
              background: start && end ? "linear-gradient(135deg,#7C5CFF 0%,#4CC9F0 100%)" : "rgba(255,255,255,0.1)",
              boxShadow: start && end ? "0 6px 22px rgba(124,92,255,0.48)" : "none",
              opacity: start && end ? 1 : 0.5,
            }}>
            Apply Range
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
