import { Link } from "react-router";
import { RotateCcw } from "lucide-react";
import { LegalPage, LegalSection as Section, ContactLink } from "../components/LegalPage";
import { PAYMENTS_ENABLED } from "../services/features";

const LAST_UPDATED = "October 6, 2026";

const B = ({ children }: { children: React.ReactNode }) => (
  <strong className="text-ink/85">{children}</strong>
);

export function RefundPolicyScreen() {
  return (
    <LegalPage title="Refund & Cancellation Policy" icon={<RotateCcw className="w-6 h-6" />} lastUpdated={LAST_UPDATED}>
      <p className="text-ink/70 text-sm leading-relaxed mt-6 mb-8">
        This policy explains how cancellations and refunds work for Finly Premium. It should be read with our{" "}
        <Link to="/terms" className="text-[#D4A24C] hover:underline">Terms of Service</Link>.
      </p>

      {!PAYMENTS_ENABLED && (
        <Section title="Current status">
          <p><B>Paid plans are not being sold at the moment.</B> All features are free for every user, so there is nothing to cancel or refund. The rules below apply once Premium can be purchased.</p>
        </Section>
      )}

      <Section title="Cancellation">
        <p>Premium is bought as a <B>one-time payment</B> for a fixed period (monthly or yearly). It does not auto-renew and your payment method is never charged again automatically, so there is no subscription to cancel. Access simply ends when the paid period ends and your account returns to the free Basic plan. Your data is kept.</p>
        <p>You can delete your account at any time from Settings (see <Link to="/account-deletion" className="text-[#D4A24C] hover:underline">account deletion</Link>).</p>
      </Section>

      <Section title="When we refund">
        <p>We refund the full amount in these cases:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>You were charged but Premium was not activated on your account.</li>
          <li>You were charged more than once for the same purchase.</li>
          <li>The payment was made without your authorisation.</li>
        </ul>
        <p>Report the problem within <B>7 days</B> of the payment.</p>
      </Section>

      <Section title="When we do not refund">
        <p>Once Premium access has been granted and works as described, the payment is non-refundable, including for unused time and for changing your mind, except where the law requires otherwise.</p>
      </Section>

      <Section title="How to request a refund">
        <p>Email <ContactLink /> from the address on your Finly account. Include the payment ID or UPI/transaction reference and the date of payment. We will reply with a decision.</p>
      </Section>

      <Section title="How long refunds take">
        <p>Approved refunds are sent back to the original payment method through Razorpay. They typically arrive within <B>5 to 7 working days</B>, depending on your bank or card issuer.</p>
      </Section>
    </LegalPage>
  );
}
