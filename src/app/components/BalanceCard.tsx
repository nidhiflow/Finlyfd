import { Wallet } from "lucide-react";

export function BalanceCard() {
  return (
    <div className="relative overflow-hidden rounded-3xl p-6"
      style={{
        background: "linear-gradient(135deg,#7C5CFF 0%,#4CC9F0 100%)",
        boxShadow: "0 12px 36px rgba(124,92,255,0.32)",
      }}>
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-36 h-36 rounded-full -mr-16 -mt-16"
        style={{ background: "rgba(255,255,255,0.10)", filter: "blur(28px)" }} />
      <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full -ml-12 -mb-12"
        style={{ background: "rgba(76,201,240,0.18)", filter: "blur(22px)" }} />

      <div className="relative z-10">
        {/* Label */}
        <div className="flex items-center gap-1.5 mb-2">
          <Wallet className="w-3.5 h-3.5 text-white/70" />
          <p className="text-white/70 font-semibold" style={{ fontSize: 12, letterSpacing: "0.4px" }}>
            TOTAL BALANCE
          </p>
        </div>

        {/* Main zero value */}
        <h2 className="text-white font-bold mb-1" style={{ fontSize: 38, letterSpacing: "-1px" }}>
          ₹ 0.00
        </h2>

        {/* Empty state sub-label */}
        <p className="text-white/55 mb-5" style={{ fontSize: 13 }}>
          No transactions recorded yet
        </p>

        {/* Income / Expense chips */}
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl"
            style={{ background: "rgba(34,197,94,0.18)", border: "1px solid rgba(34,197,94,0.28)", backdropFilter: "blur(8px)" }}>
            <div className="w-2 h-2 rounded-full" style={{ background: "#22C55E" }} />
            <div>
              <p className="text-white/60" style={{ fontSize: 10 }}>Income</p>
              <p className="text-white font-bold" style={{ fontSize: 13 }}>₹0</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl"
            style={{ background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.28)", backdropFilter: "blur(8px)" }}>
            <div className="w-2 h-2 rounded-full" style={{ background: "#EF4444" }} />
            <div>
              <p className="text-white/60" style={{ fontSize: 10 }}>Expense</p>
              <p className="text-white font-bold" style={{ fontSize: 13 }}>₹0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
