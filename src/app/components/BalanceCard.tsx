import { Wallet } from "lucide-react";

export function BalanceCard({ balance = 0, income = 0, expense = 0 }) {
  return (
    <div className="relative overflow-hidden rounded-[18px] p-6"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--divider)",
      }}>
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-36 h-36 rounded-full -mr-16 -mt-16"
        style={{ background: "rgba(212,162,76,0.10)", filter: "blur(28px)" }} />
      <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full -ml-12 -mb-12"
        style={{ background: "rgba(212,162,76,0.08)", filter: "blur(22px)" }} />

      <div className="relative z-10">
        {/* Label */}
        <div className="flex items-center gap-1.5 mb-2">
          <Wallet className="w-3.5 h-3.5" strokeWidth={1.75} style={{ color: "var(--gold)" }} />
          <p className="font-semibold" style={{ fontSize: 12, letterSpacing: "0.4px", color: "var(--ink-muted)" }}>
            TOTAL BALANCE
          </p>
        </div>

        {/* Main value */}
        <h2 className="font-fraunces tabular-nums mb-1" style={{ fontSize: 38, fontWeight: 500, letterSpacing: "-1px", color: "var(--ink)" }}>
          ₹ {balance.toLocaleString("en-IN")}
        </h2>

        {/* Sub-label */}
        <p className="mb-5" style={{ fontSize: 13, color: "var(--ink-faint)" }}>
          {balance === 0 ? "No transactions recorded yet" : "Current balance for this period"}
        </p>

        {/* Income / Expense chips */}
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-[14px]"
            style={{ background: "var(--income-chip)" }}>
            <div className="w-2 h-2 rounded-full" style={{ background: "var(--income)" }} />
            <div>
              <p style={{ fontSize: 10, color: "var(--ink-muted)" }}>Income</p>
              <p className="font-semibold tabular-nums" style={{ fontSize: 13, color: "var(--income)" }}>₹{income.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-[14px]"
            style={{ background: "var(--expense-chip)" }}>
            <div className="w-2 h-2 rounded-full" style={{ background: "var(--expense)" }} />
            <div>
              <p style={{ fontSize: 10, color: "var(--ink-muted)" }}>Expense</p>
              <p className="font-semibold tabular-nums" style={{ fontSize: 13, color: "var(--expense)" }}>₹{expense.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


