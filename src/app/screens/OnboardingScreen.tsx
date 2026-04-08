import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, ArrowUpRight, ArrowDownRight } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════
// SLIDE 1 ── Cash Flow Visualization
// Animated money flowing in (income) → balance node → expenses out
// ═══════════════════════════════════════════════════════════════════
function CashFlowAnim() {
  return (
    <div className="relative w-full h-full flex items-center justify-center select-none">
      {/* Ambient background glows */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-32 h-20 bg-emerald-500/12 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-6 left-1/5 w-24 h-16 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-6 right-1/5 w-24 h-16 bg-sky-400/10 rounded-full blur-2xl pointer-events-none" />

      <svg
        viewBox="0 0 320 270"
        className="w-full max-w-[340px] h-auto"
        style={{ overflow: "visible" }}
      >
        <defs>
          <filter id="cf-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="cf-glow-lg" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="incomePathGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.15" />
          </linearGradient>
          <radialGradient id="balanceNodeGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2D1B69" />
            <stop offset="100%" stopColor="#0F0B2A" />
          </radialGradient>
        </defs>

        {/* ── Flow Lines ── */}
        {/* Income → Balance */}
        <path d="M 160,68 C 160,90 160,100 160,122"
          stroke="#10B981" strokeWidth="1.5" strokeOpacity="0.28"
          strokeDasharray="6,5" fill="none" />
        {/* Balance → Food (left) */}
        <path d="M 143,166 C 115,188 88,205 70,218"
          stroke="#F72585" strokeWidth="1.5" strokeOpacity="0.28"
          strokeDasharray="5,4" fill="none" />
        {/* Balance → Bills (center) */}
        <path d="M 160,170 L 160,215"
          stroke="#FF8C00" strokeWidth="1.5" strokeOpacity="0.28"
          strokeDasharray="5,4" fill="none" />
        {/* Balance → Travel (right) */}
        <path d="M 177,166 C 205,188 232,205 250,218"
          stroke="#4CC9F0" strokeWidth="1.5" strokeOpacity="0.28"
          strokeDasharray="5,4" fill="none" />

        {/* ── Income Particles (3 staggered) ── */}
        {[0, 0.55, 1.1].map((begin, i) => (
          <circle key={i} r={5 - i} fill="#10B981" filter="url(#cf-glow)" opacity={0.9 - i * 0.2}>
            <animateMotion dur="1.6s" begin={`${begin}s`} repeatCount="indefinite"
              path="M 160,68 C 160,90 160,100 160,122" />
            <animate attributeName="opacity" values="0;0.9;0.9;0" dur="1.6s" begin={`${begin}s`} repeatCount="indefinite" />
          </circle>
        ))}

        {/* ── Expense Particles ── */}
        <circle r="4.5" fill="#F72585" filter="url(#cf-glow)">
          <animateMotion dur="1.5s" begin="0.3s" repeatCount="indefinite"
            path="M 143,166 C 115,188 88,205 70,218" />
          <animate attributeName="opacity" values="0;1;1;0" dur="1.5s" begin="0.3s" repeatCount="indefinite" />
        </circle>
        <circle r="4.5" fill="#FF8C00" filter="url(#cf-glow)">
          <animateMotion dur="1.5s" begin="0.9s" repeatCount="indefinite"
            path="M 160,170 L 160,215" />
          <animate attributeName="opacity" values="0;1;1;0" dur="1.5s" begin="0.9s" repeatCount="indefinite" />
        </circle>
        <circle r="4.5" fill="#4CC9F0" filter="url(#cf-glow)">
          <animateMotion dur="1.5s" begin="1.5s" repeatCount="indefinite"
            path="M 177,166 C 205,188 232,205 250,218" />
          <animate attributeName="opacity" values="0;1;1;0" dur="1.5s" begin="1.5s" repeatCount="indefinite" />
        </circle>

        {/* ── Income Node ── */}
        <circle cx="160" cy="36" r="32" fill="#071E12" stroke="#10B981" strokeWidth="1.5" filter="url(#cf-glow)" />
        <text x="160" y="30" textAnchor="middle" fill="#4ADE80" fontSize="7.5" fontWeight="700" fontFamily="system-ui,sans-serif" letterSpacing="0.5">INCOME</text>
        <text x="160" y="44" textAnchor="middle" fill="#4ADE80" fontSize="11.5" fontWeight="800" fontFamily="system-ui,sans-serif">+₹3,500</text>

        {/* ── Balance Node (center, pulsing ring) ── */}
        {/* Outer pulse ring */}
        <circle cx="160" cy="144" r="46" fill="none" stroke="#7C5CFF" strokeWidth="1">
          <animate attributeName="r" values="46;58;46" dur="2.8s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="0.35;0;0.35" dur="2.8s" repeatCount="indefinite" />
        </circle>
        {/* Second pulse ring (offset) */}
        <circle cx="160" cy="144" r="46" fill="none" stroke="#7C5CFF" strokeWidth="0.8">
          <animate attributeName="r" values="46;62;46" dur="2.8s" begin="0.7s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="0.2;0;0.2" dur="2.8s" begin="0.7s" repeatCount="indefinite" />
        </circle>
        {/* Main node */}
        <circle cx="160" cy="144" r="44" fill="url(#balanceNodeGrad)" stroke="#7C5CFF" strokeWidth="2" filter="url(#cf-glow-lg)" />
        <text x="160" y="138" textAnchor="middle" fill="white" fontSize="15" fontWeight="800" fontFamily="system-ui,sans-serif">₹12,450</text>
        <text x="160" y="155" textAnchor="middle" fill="#9D7EFF" fontSize="8.5" fontFamily="system-ui,sans-serif">Balance</text>

        {/* ── Expense Nodes ── */}
        {/* Food */}
        <circle cx="58" cy="234" r="24" fill="#200A16" stroke="#F72585" strokeWidth="1.5" />
        <text x="58" y="230" textAnchor="middle" fontSize="15" fontFamily="sans-serif">🍕</text>
        <text x="58" y="244" textAnchor="middle" fill="#F92A8B" fontSize="8" fontFamily="system-ui,sans-serif">₹850</text>

        {/* Bills */}
        <circle cx="160" cy="237" r="24" fill="#1C1306" stroke="#FF8C00" strokeWidth="1.5" />
        <text x="160" y="233" textAnchor="middle" fontSize="15" fontFamily="sans-serif">🏠</text>
        <text x="160" y="247" textAnchor="middle" fill="#FF8C00" fontSize="8" fontFamily="system-ui,sans-serif">₹1,200</text>

        {/* Travel */}
        <circle cx="262" cy="234" r="24" fill="#081420" stroke="#4CC9F0" strokeWidth="1.5" />
        <text x="262" y="230" textAnchor="middle" fontSize="15" fontFamily="sans-serif">✈️</text>
        <text x="262" y="244" textAnchor="middle" fill="#4CC9F0" fontSize="8" fontFamily="system-ui,sans-serif">₹450</text>

        {/* ── Floating ₹ particles (ambient) ── */}
        {[
          { x: 100, begin: "0s", dur: "3s", dx: -20 },
          { x: 220, begin: "1s", dur: "3.5s", dx: 18 },
          { x: 155, begin: "2s", dur: "3.2s", dx: 0 },
        ].map((p, i) => (
          <text key={i} fontSize="10" fill="#7C5CFF" fontFamily="system-ui,sans-serif"
            opacity="0" fontWeight="700" textAnchor="middle">
            <animateMotion dur={p.dur} begin={p.begin} repeatCount="indefinite"
              path={`M ${p.x},180 C ${p.x + p.dx},160 ${p.x + p.dx * 2},140 ${p.x + p.dx * 1.5},100`} />
            <animate attributeName="opacity" values="0;0.4;0.4;0" dur={p.dur} begin={p.begin} repeatCount="indefinite" />
            ₹
          </text>
        ))}
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 2 ── Expense Tracking
// Staggered category cards with animated progress bars
// ═══════════════════════════════════════════════════════════════════
const EXPENSE_CATEGORIES = [
  { emoji: "🍕", name: "Food & Dining", amount: "₹850", pct: 34, color: "#F72585", gradFrom: "#F72585" },
  { emoji: "✈️", name: "Travel", amount: "₹450", pct: 18, color: "#4CC9F0", gradFrom: "#4CC9F0" },
  { emoji: "🏠", name: "Housing", amount: "₹700", pct: 28, color: "#7C5CFF", gradFrom: "#7C5CFF" },
  { emoji: "🎬", name: "Entertainment", amount: "₹320", pct: 13, color: "#FF8C00", gradFrom: "#FF8C00" },
];

function ExpenseTrackingAnim() {
  const [bars, setBars] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBars(true), 350);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="w-full h-full px-5 py-2 flex flex-col gap-2.5">
      {/* Header strip */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between bg-white/4 border border-white/8 rounded-xl px-4 py-2.5"
      >
        <div>
          <p className="text-white/40" style={{ fontSize: 10, lineHeight: 1.2 }}>TOTAL TRACKED</p>
          <p className="text-white font-bold" style={{ fontSize: 15, lineHeight: 1.3 }}>₹2,320 / month</p>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/25 rounded-full px-2.5 py-1">
          <ArrowDownRight className="w-3 h-3 text-emerald-400" />
          <span className="text-emerald-400" style={{ fontSize: 11 }}>–8% vs last mo.</span>
        </div>
      </motion.div>

      {/* 2×2 Grid */}
      <div className="grid grid-cols-2 gap-2.5 flex-1">
        {EXPENSE_CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.name}
            initial={{ y: 24, opacity: 0, scale: 0.94 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            className="rounded-2xl p-3.5 flex flex-col justify-between border"
            style={{
              background: `linear-gradient(135deg, ${cat.color}18 0%, ${cat.color}06 100%)`,
              borderColor: `${cat.color}30`,
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <span style={{ fontSize: 22, lineHeight: 1 }}>{cat.emoji}</span>
              <span style={{ color: cat.color, fontSize: 11, fontWeight: 700 }}>{cat.pct}%</span>
            </div>
            <div>
              <p className="text-white font-semibold" style={{ fontSize: 12 }}>{cat.name}</p>
              <p className="text-white/50" style={{ fontSize: 11 }}>{cat.amount}</p>
              {/* Animated bar */}
              <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: bars ? `${cat.pct * 2.5}%` : "0%",
                    background: `linear-gradient(to right, ${cat.color}80, ${cat.color})`,
                    transitionDuration: "1.1s",
                    transitionDelay: `${i * 0.15 + 0.2}s`,
                    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom total bar */}
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="bg-white/4 border border-white/8 rounded-xl px-4 py-2 flex items-center gap-3"
      >
        <span className="text-white/40" style={{ fontSize: 10 }}>TOTAL BREAKDOWN</span>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden flex gap-0.5" style={{ background: "rgba(255,255,255,0.06)" }}>
          {EXPENSE_CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              className="h-full rounded-full transition-all"
              style={{
                width: bars ? `${cat.pct}%` : "0%",
                background: cat.color,
                transitionDuration: "1.2s",
                transitionDelay: "0.6s",
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 3 ── Smart Savings & Goals
// Animated circular progress ring + goal progress bars
// ═══════════════════════════════════════════════════════════════════
const RING_RADIUS = 70;
const RING_CIRCUM = 2 * Math.PI * RING_RADIUS;

const GOALS = [
  { name: "Vacation 🏖️", pct: 55, current: "₹2,750", target: "₹5,000", color: "#4CC9F0" },
  { name: "New Laptop 💻", pct: 38, current: "₹760", target: "₹2,000", color: "#F72585" },
];

function SavingsGoalsAnim() {
  const [ringPct, setRingPct] = useState(0);
  const [barsOn, setBarsOn] = useState(false);
  const [countUp, setCountUp] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setRingPct(72), 200);
    const t2 = setTimeout(() => setBarsOn(true), 600);

    // count-up animation for percentage
    let start = 0;
    const end = 72;
    const duration = 1600;
    const step = duration / end;
    const t3 = setTimeout(() => {
      const interval = setInterval(() => {
        start += 1;
        setCountUp(start);
        if (start >= end) clearInterval(interval);
      }, step);
    }, 200);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const dashoffset = RING_CIRCUM * (1 - ringPct / 100);

  return (
    <div className="w-full h-full px-5 flex flex-col items-center gap-5 justify-center py-2">
      {/* Ring */}
      <div className="relative flex-shrink-0">
        {/* Outer ambient glow */}
        <div className="absolute inset-0 rounded-full blur-2xl"
          style={{ background: "radial-gradient(circle, rgba(124,92,255,0.25) 0%, transparent 70%)", transform: "scale(1.4)" }} />

        <svg width="170" height="170" viewBox="0 0 170 170">
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7C5CFF" />
              <stop offset="60%" stopColor="#9D7EFF" />
              <stop offset="100%" stopColor="#4CC9F0" />
            </linearGradient>
            <filter id="ring-glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Track */}
          <circle cx="85" cy="85" r={RING_RADIUS} fill="none" stroke="#1B2130" strokeWidth="14" />
          {/* Glow layer */}
          <circle cx="85" cy="85" r={RING_RADIUS}
            fill="none" stroke="#7C5CFF" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUM}
            strokeDashoffset={dashoffset}
            style={{
              transition: "stroke-dashoffset 1.9s cubic-bezier(0.4, 0, 0.2, 1)",
              filter: "blur(8px)", opacity: 0.45,
              transformOrigin: "85px 85px",
              transform: "rotate(-90deg)",
            }}
          />
          {/* Main progress arc */}
          <circle cx="85" cy="85" r={RING_RADIUS}
            fill="none" stroke="url(#ringGrad)" strokeWidth="13"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUM}
            strokeDashoffset={dashoffset}
            style={{
              transition: "stroke-dashoffset 1.9s cubic-bezier(0.4, 0, 0.2, 1)",
              transformOrigin: "85px 85px",
              transform: "rotate(-90deg)",
            }}
          />
          {/* Sparkle dot at arc tip — computed position for 72% */}
          {ringPct > 0 && (() => {
            const angle = (-90 + ringPct * 3.6) * (Math.PI / 180);
            const tx = 85 + RING_RADIUS * Math.cos(angle);
            const ty = 85 + RING_RADIUS * Math.sin(angle);
            return (
              <g>
                <circle cx={tx} cy={ty} r={8} fill="#9D7EFF" opacity={0.3} filter="url(#ring-glow)">
                  <animate attributeName="r" values="8;13;8" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx={tx} cy={ty} r={5} fill="#9D7EFF" filter="url(#ring-glow)" />
              </g>
            );
          })()}

          {/* Coin particles animating into ring */}
          {[0, 0.8, 1.6].map((begin, i) => (
            <circle key={i} r={4 - i * 0.8} fill="#4CC9F0" opacity={0.7 - i * 0.15}>
              <animateMotion dur="2.2s" begin={`${begin}s`} repeatCount="indefinite"
                path="M 50,20 C 65,50 75,65 85,72" />
              <animate attributeName="opacity" values="0;0.7;0.5;0" dur="2.2s" begin={`${begin}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-white font-black" style={{ fontSize: 30, lineHeight: 1 }}>{countUp}%</p>
          <p className="text-white/45" style={{ fontSize: 10, lineHeight: 1.4, marginTop: 2 }}>Emergency Fund</p>
          <p style={{ color: "#9D7EFF", fontSize: 11, fontWeight: 700, marginTop: 2 }}>₹14,400 / ₹20K</p>
        </div>
      </div>

      {/* Goal progress bars */}
      <div className="w-full space-y-3">
        {GOALS.map((goal, i) => (
          <motion.div
            key={goal.name}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.15, duration: 0.4 }}
          >
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-white font-medium" style={{ fontSize: 13 }}>{goal.name}</span>
              <span style={{ color: goal.color, fontSize: 11, fontWeight: 700 }}>{goal.pct}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
              <div className="h-full rounded-full transition-all"
                style={{
                  width: barsOn ? `${goal.pct}%` : "0%",
                  background: `linear-gradient(to right, ${goal.color}60, ${goal.color})`,
                  transitionDuration: "1.1s",
                  transitionDelay: `${i * 0.2 + 0.7}s`,
                  transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-white/35" style={{ fontSize: 10 }}>{goal.current}</span>
              <span className="text-white/35" style={{ fontSize: 10 }}>of {goal.target}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 4 ── AI Insights & Financial Control
// Animated sparkline chart + staggered AI insight cards appearing
// ══════════════════════════════════════════════════════════════════
const LINE_PATH = "M 8,72 C 28,58 42,80 62,44 S 88,24 108,46 S 134,68 156,36 S 182,14 202,26 S 228,38 248,20 S 272,14 306,26";
const FILL_PATH = "M 8,72 C 28,58 42,80 62,44 S 88,24 108,46 S 134,68 156,36 S 182,14 202,26 S 228,38 248,20 S 272,14 306,26 L 306,90 L 8,90 Z";
const PATH_LEN = 360;

const AI_INSIGHTS = [
  { icon: "📉", text: "Spending down 12% vs last month", color: "#10B981", label: "Positive" },
  { icon: "💡", text: "Save ₹245 more by reducing dining", color: "#7C5CFF", label: "Tip" },
  { icon: "🎯", text: "Vacation goal on track for July", color: "#4CC9F0", label: "On track" },
];

const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function AIInsightsAnim() {
  const [drawn, setDrawn] = useState(false);
  const [visibleInsights, setVisibleInsights] = useState(0);

  useEffect(() => {
    const t0 = setTimeout(() => setDrawn(true), 150);
    const t1 = setTimeout(() => setVisibleInsights(1), 800);
    const t2 = setTimeout(() => setVisibleInsights(2), 1250);
    const t3 = setTimeout(() => setVisibleInsights(3), 1700);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="w-full h-full px-4 flex flex-col gap-3 py-2">
      {/* Sparkline chart */}
      <div className="relative rounded-2xl border border-white/8 overflow-hidden flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #0F1623 0%, #111827 100%)" }}>
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: "linear-gradient(to right,rgba(124,92,255,0.06) 1px,transparent 1px),linear-gradient(to bottom,rgba(124,92,255,0.06) 1px,transparent 1px)",
          backgroundSize: "44px 22px",
        }} />

        <svg width="100%" viewBox="0 0 314 98" preserveAspectRatio="none" style={{ display: "block", height: 90 }}>
          <defs>
            <linearGradient id="ai-line-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7C5CFF" />
              <stop offset="50%" stopColor="#4CC9F0" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <linearGradient id="ai-fill-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#7C5CFF" stopOpacity="0.0" />
            </linearGradient>
            <filter id="ai-glow-line">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* Area fill */}
          <path d={FILL_PATH} fill="url(#ai-fill-grad)" />
          {/* Glow line */}
          <path d={LINE_PATH} stroke="#7C5CFF" strokeWidth="5" fill="none"
            strokeOpacity="0.45" filter="url(#ai-glow-line)"
            strokeDasharray={PATH_LEN}
            strokeDashoffset={drawn ? 0 : PATH_LEN}
            style={{ transition: `stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)` }}
          />
          {/* Main line */}
          <path d={LINE_PATH} stroke="url(#ai-line-grad)" strokeWidth="2.5" fill="none"
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={PATH_LEN}
            strokeDashoffset={drawn ? 0 : PATH_LEN}
            style={{ transition: `stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)` }}
          />
          {/* Live endpoint dot */}
          {drawn && (
            <g>
              <circle cx="306" cy="26" r="6" fill="#10B981" opacity="0.25">
                <animate attributeName="r" values="6;10;6" dur="1.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.25;0;0.25" dur="1.8s" repeatCount="indefinite" />
              </circle>
              <circle cx="306" cy="26" r="4" fill="#10B981" filter="url(#ai-glow-line)" />
            </g>
          )}
        </svg>

        {/* Week labels */}
        <div className="flex justify-between px-2 pb-2 -mt-1">
          {WEEK_LABELS.map((d) => (
            <span key={d} className="text-white/25" style={{ fontSize: 9 }}>{d}</span>
          ))}
        </div>

        {/* AI badge */}
        <div className="absolute top-2.5 left-3 flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {[0, 0.3, 0.6].map((d, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-[#7C5CFF]"
                style={{ animation: `pulse 1.5s ${d}s infinite` }} />
            ))}
          </div>
          <span className="text-white/50" style={{ fontSize: 9, letterSpacing: "0.5px", fontWeight: 600 }}>AI ANALYSIS</span>
        </div>

        {/* Current value badge */}
        <div className="absolute top-2 right-3 bg-[#7C5CFF]/15 border border-[#7C5CFF]/25 rounded-lg px-2 py-1">
          <span style={{ color: "#9D7EFF", fontSize: 11, fontWeight: 700 }}>₹1,234 this week</span>
        </div>
      </div>

      {/* AI Insight Cards */}
      <div className="space-y-2 flex-1">
        {AI_INSIGHTS.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ x: 32, opacity: 0 }}
            animate={visibleInsights > i
              ? { x: 0, opacity: 1 }
              : { x: 32, opacity: 0 }
            }
            transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
            className="flex items-center gap-3 rounded-xl border border-white/8 px-3.5 py-2.5"
            style={{ background: `linear-gradient(135deg, ${insight.color}10 0%, rgba(27,33,48,0.8) 100%)` }}
          >
            <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{insight.icon}</span>
            <p className="text-white/80 flex-1" style={{ fontSize: 12, lineHeight: 1.4 }}>{insight.text}</p>
            <span className="rounded-full px-2 py-0.5 flex-shrink-0"
              style={{ background: `${insight.color}20`, color: insight.color, fontSize: 9, fontWeight: 700 }}>
              {insight.label}
            </span>
          </motion.div>
        ))}

        {/* Neural node ambient decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
          {[
            { cx: "15%", cy: "20%", r: 2, delay: "0s" },
            { cx: "85%", cy: "15%", r: 1.5, delay: "0.7s" },
            { cx: "92%", cy: "60%", r: 2, delay: "1.4s" },
          ].map((dot, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-[#7C5CFF]"
              style={{
                left: dot.cx, top: dot.cy,
                width: dot.r * 2 * 4, height: dot.r * 2 * 4,
                animation: `pulse 2s ${dot.delay} infinite`,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN ONBOARDING SCREEN
// ═══════════════════════════════════════════════════════════════════
const SLIDES = [
  {
    id: 0,
    Animation: CashFlowAnim,
    title: "Know Your\nCash Flow",
    description:
      "See exactly where every dollar comes from and where it goes — income, savings, and expenses in one beautiful view.",
    accent: "#10B981",
    gradFrom: "#10B981",
    gradTo: "#4ADE80",
  },
  {
    id: 1,
    Animation: ExpenseTrackingAnim,
    title: "Track Every\nExpense",
    description:
      "AI automatically categorizes your spending in real-time, giving you instant clarity with zero manual effort.",
    accent: "#4CC9F0",
    gradFrom: "#4CC9F0",
    gradTo: "#7C5CFF",
  },
  {
    id: 2,
    Animation: SavingsGoalsAnim,
    title: "Grow Your\nSavings",
    description:
      "Set meaningful goals and watch your progress build up day by day. Every deposit takes you closer to financial freedom.",
    accent: "#9D7EFF",
    gradFrom: "#7C5CFF",
    gradTo: "#9D7EFF",
  },
  {
    id: 3,
    Animation: AIInsightsAnim,
    title: "AI-Powered\nInsights",
    description:
      "Finly learns your habits and delivers smart, personalized recommendations to optimize spending and hit your goals faster.",
    accent: "#F72585",
    gradFrom: "#F72585",
    gradTo: "#7C5CFF",
  },
];

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? "70%" : "-70%",
    opacity: 0,
    scale: 0.93,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.42, ease: [0.4, 0, 0.2, 1] },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? "-70%" : "70%",
    opacity: 0,
    scale: 0.93,
    transition: { duration: 0.38, ease: [0.4, 0, 0.2, 1] },
  }),
};

const textVariants = {
  enter: { y: 20, opacity: 0 },
  center: { y: 0, opacity: 1, transition: { duration: 0.38, ease: "easeOut" } },
  exit: { y: -20, opacity: 0, transition: { duration: 0.28, ease: "easeIn" } },
};

export function OnboardingScreen() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  const goTo = (next: number) => {
    setDirection(next > current ? 1 : -1);
    setCurrent(next);
  };

  const goNext = () => {
    if (!isLast) goTo(current + 1);
  };

  /** Mark onboarding done so the root redirect skips it on next launch */
  const finishOnboarding = () => {
    localStorage.setItem("finly_onboarding_done", "true");
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && !isLast) goTo(current + 1);
      else if (diff < 0 && current > 0) goTo(current - 1);
    }
    setTouchStart(null);
  };

  return (
    <div
      className="min-h-screen bg-[#0D0F14] flex flex-col overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="max-w-md mx-auto w-full flex flex-col min-h-screen relative">

        {/* ── Ambient background that shifts per slide ── */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-700"
          style={{
            background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${slide.accent}14 0%, transparent 70%)`,
          }}
        />

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-6 pt-12 pb-3 flex-shrink-0 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C5CFF] to-[#4CC9F0] flex items-center justify-center shadow-lg shadow-[#7C5CFF]/35">
              <span className="text-white font-black" style={{ fontSize: 15 }}>F</span>
            </div>
            <span className="text-white font-bold" style={{ fontSize: 17 }}>Finly</span>
          </div>

          <button
            onClick={() => { finishOnboarding(); navigate("/login"); }}
            className="text-white/40 font-medium hover:text-white/70 transition-colors"
            style={{ fontSize: 14 }}
          >
            Skip
          </button>
        </div>

        {/* ── Animation Canvas ── */}
        <div className="relative flex-shrink-0 overflow-hidden z-10" style={{ height: 290 }}>
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={current}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0"
            >
              <slide.Animation />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Text Content ── */}
        <div className="flex-1 px-6 relative z-10 flex flex-col justify-start pt-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${current}`}
              variants={textVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {/* Slide tag */}
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px w-6 rounded-full" style={{ background: slide.accent }} />
                <span className="font-semibold tracking-widest" style={{ color: slide.accent, fontSize: 10 }}>
                  {["CASH FLOW", "EXPENSES", "SAVINGS", "AI INSIGHTS"][current]}
                </span>
              </div>

              <h1
                className="text-white font-black mb-3 whitespace-pre-line"
                style={{ fontSize: 32, lineHeight: 1.15 }}
              >
                {slide.title}
              </h1>
              <p className="text-white/55 leading-relaxed" style={{ fontSize: 14 }}>
                {slide.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Bottom: Dots + CTA ── */}
        <div className="px-6 pb-10 flex-shrink-0 relative z-10">

          {/* Dots */}
          <div className="flex items-center gap-2 mb-6">
            {SLIDES.map((s, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="h-2 rounded-full transition-all duration-350"
                style={{
                  width: i === current ? 28 : 8,
                  background: i === current
                    ? `linear-gradient(to right, ${slide.gradFrom}, ${slide.gradTo})`
                    : "rgba(255,255,255,0.18)",
                }}
              />
            ))}
            <span className="ml-auto text-white/30" style={{ fontSize: 12 }}>{current + 1} / {SLIDES.length}</span>
          </div>

          {/* CTA */}
          <AnimatePresence mode="wait">
            {!isLast ? (
              <motion.button
                key="next"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                onClick={goNext}
                className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
                style={{
                  background: `linear-gradient(135deg, ${slide.gradFrom} 0%, ${slide.gradTo} 100%)`,
                  boxShadow: `0 10px 28px ${slide.accent}40`,
                  fontSize: 16,
                }}
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            ) : (
              <motion.div
                key="last"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-3"
              >
                <button
                  onClick={() => { finishOnboarding(); navigate("/signup"); }}
                  className="w-full py-4 rounded-2xl text-white font-bold active:scale-[0.97] transition-transform flex items-center justify-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, #7C5CFF 0%, #9D7EFF 100%)",
                    boxShadow: "0 10px 28px rgba(124,92,255,0.42)",
                    fontSize: 16,
                  }}
                >
                  Get Started — It's Free
                  <ArrowUpRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => { finishOnboarding(); navigate("/login"); }}
                  className="w-full py-3.5 rounded-2xl text-white/65 font-medium border border-white/10 hover:border-white/20 transition-colors"
                  style={{ fontSize: 15 }}
                >
                  I Already Have an Account
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Global keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}