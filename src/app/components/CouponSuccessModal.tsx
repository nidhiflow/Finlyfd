import { motion, AnimatePresence } from "motion/react";
import { Crown, Sparkles, CheckCircle2, Zap, Bot, PieChart, Repeat, FileSpreadsheet, X } from "lucide-react";

interface CouponSuccessModalProps {
  isOpen: boolean;
  couponCode?: string;
  expiresAt?: string;
  onClose: () => void;
}

export function CouponSuccessModal({
  isOpen,
  couponCode = "PG1011",
  expiresAt,
  onClose,
}: CouponSuccessModalProps) {
  if (!isOpen) return null;

  // Calculate formatted 6-month expiry date if not passed
  const formattedExpiryDate = (() => {
    if (expiresAt) {
      try {
        return new Date(expiresAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      } catch {
        // fallback below
      }
    }
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  })();

  const features = [
    { icon: Bot, label: "AI Financial Agent", color: "#4285F4" },
    { icon: PieChart, label: "Unlimited Budgets", color: "#D4A24C" },
    { icon: Repeat, label: "Recurring Transactions", color: "#C77DFF" },
    { icon: FileSpreadsheet, label: "Receipt Scanner (Multi-Format)", color: "#6FBE9B" },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-[var(--surface)] border border-[#D4A24C]/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 overflow-hidden text-center z-10"
        >
          {/* Top Decorative Radial Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-48 bg-gradient-to-b from-[#D4A24C]/25 to-transparent blur-2xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-ink/40 hover:text-ink hover:bg-ink/10 transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Crown & Celebration Icon */}
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="absolute inset-0 rounded-full bg-[#D4A24C]/20 blur-lg animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#D4A24C] to-[#F3E5AB] p-0.5 shadow-xl shadow-[#D4A24C]/30 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-[#18181b] flex items-center justify-center">
                <Crown className="w-10 h-10 text-[#D4A24C]" />
              </div>
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-[#F3E5AB] animate-bounce" />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4A24C]/15 border border-[#D4A24C]/40 text-[#D4A24C] text-[11px] font-bold uppercase tracking-wider mb-3">
            <Zap className="w-3 h-3 fill-current" />
            <span>06 Months Premium Granted</span>
          </div>

          {/* Main Headline */}
          <h2 className="text-2xl font-bold text-ink mb-2">
            Finly Premium Unlocked!
          </h2>

          {/* Selected Quote Card */}
          <div className="my-4 p-4 rounded-2xl bg-gradient-to-br from-[#D4A24C]/10 via-[var(--bg-deep)] to-[#6FBE9B]/10 border border-[#D4A24C]/30 text-left relative">
            <div className="text-xs text-ink/90 font-medium leading-relaxed">
              🎉 <strong>Congratulations!</strong> You&apos;ve unlocked <strong>6 Months of Finly Premium for Free!</strong> Enjoy full access to AI Agent, Budgets, Recurring Transactions &amp; Scan Receipt.
            </div>
            <div className="mt-2.5 pt-2 border-t border-ink/10 flex items-center justify-between text-[11px] text-ink/60">
              <span>Promo Code: <strong className="text-[#D4A24C] font-mono">{couponCode}</strong></span>
              <span className="text-[#6FBE9B] font-semibold">Valid until {formattedExpiryDate}</span>
            </div>
          </div>

          {/* Unlocked Features List */}
          <div className="space-y-2 text-left mb-6">
            <p className="text-[11px] font-semibold text-ink/50 uppercase tracking-wider px-1">
              Included Premium Benefits:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--bg-deep)] border border-[var(--divider)] text-xs font-medium text-ink/80"
                >
                  <f.icon className="w-4 h-4 flex-shrink-0" style={{ color: f.color }} />
                  <span className="truncate text-[11px]">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={onClose}
            className="w-full py-4 bg-gradient-to-r from-[#D4A24C] to-[#E5C158] text-[#1a1409] font-extrabold text-sm rounded-2xl shadow-xl shadow-[#D4A24C]/25 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Awesome! Start Exploring</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
