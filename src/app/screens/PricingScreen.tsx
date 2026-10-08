import { Link } from "react-router";
import { Tag } from "lucide-react";
import { LegalPage, LegalSection as Section } from "../components/LegalPage";
import { PAYMENTS_ENABLED } from "../services/features";

export function PricingScreen() {
  const card = "rounded-xl border border-[var(--divider)] p-4";
  return (
    <LegalPage title="Pricing" icon={<Tag className="w-6 h-6" />}>
      <p className="text-ink/70 text-sm leading-relaxed mt-6 mb-8">
        Finly has a free plan and a paid Premium plan. All prices are in Indian rupees (INR) and include all applicable taxes unless stated otherwise.
      </p>

      {!PAYMENTS_ENABLED && (
        <Section title="Current status">
          <p><strong className="text-ink/85">Paid plans are not on sale yet.</strong> For now every feature, including Premium features, is free for all users. The prices below apply from the day payments are switched on, and will be shown before you pay.</p>
        </Section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 mb-8 text-sm text-ink/70">
        <div className={card}>
          <h2 className="text-ink font-semibold text-lg">Basic</h2>
          <p className="text-ink text-2xl font-semibold my-2">₹0</p>
          <p>Core expense tracking with some limits: fewer accounts, no AI features, no recurring transactions.</p>
        </div>
        <div className={card}>
          <h2 className="text-ink font-semibold text-lg">Premium</h2>
          <p className="text-ink text-2xl font-semibold my-2">₹99 <span className="text-sm font-normal">per month</span></p>
          <p className="text-ink text-lg font-semibold mb-2">₹999 <span className="text-sm font-normal">per year</span></p>
          <p>The full feature set, including AI features, receipt scanning and recurring transactions.</p>
        </div>
      </div>

      <Section title="How payment works">
        <p>Premium is a one-time payment for the period you choose. It does not auto-renew. Payments are processed by Razorpay; Finly never sees or stores your card, UPI or bank details.</p>
        <p>See the <Link to="/refund-policy" className="text-[#D4A24C] hover:underline">Refund &amp; Cancellation Policy</Link> and <Link to="/terms" className="text-[#D4A24C] hover:underline">Terms of Service</Link>.</p>
      </Section>
    </LegalPage>
  );
}
