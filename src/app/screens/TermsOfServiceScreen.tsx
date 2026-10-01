import { Link } from "react-router";
import { FileText } from "lucide-react";
import { LegalPage, LegalSection as Section, ContactLink } from "../components/LegalPage";
import { PAYMENTS_ENABLED } from "../services/features";

const LAST_UPDATED = "September 25, 2026";

const B = ({ children }: { children: React.ReactNode }) => (
  <strong className="text-ink/85">{children}</strong>
);

export function TermsOfServiceScreen() {
  return (
    <LegalPage title="Terms of Service" icon={<FileText className="w-6 h-6" />} lastUpdated={LAST_UPDATED}>
      <p className="text-ink/70 text-sm leading-relaxed mt-6 mb-8">
        These terms cover your use of Finly. By creating an account, you agree to them. If anything
        here is unclear, contact us before you rely on it — see the bottom of this page.
      </p>

      <Section title="What Finly is">
        <p>Finly is a personal finance tracking app: you record income and expenses, organize them into accounts and categories, set budgets and savings goals, and optionally use AI features to chat about your finances or scan receipts and statements.</p>
        <p><B>Finly is not a bank, is not a financial advisor, and does not move or hold your money.</B> Every number in the app is based entirely on what you (or the receipt scanner, on your behalf) enter — Finly has no live connection to your actual bank accounts. AI-generated replies, summaries and suggestions are informational only, can be wrong, and are not financial advice; decisions you make based on them are your own.</p>
      </Section>

      <Section title="Your account">
        <p>You must be 18 or older to use Finly. You're responsible for keeping your password and device secure, and for everything that happens under your account. Tell us immediately if you believe your account has been compromised.</p>
        <p>You can delete your account at any time from Settings. This permanently removes your data and cannot be undone — see our <Link to="/account-deletion" className="text-[#D4A24C] hover:underline">account deletion page</Link> and <Link to="/privacy" className="text-[#D4A24C] hover:underline">Privacy Policy</Link> for exactly what that includes.</p>
      </Section>

      <Section title="Basic and Premium plans">
        <p><B>Finly Basic</B> is free and includes core expense tracking with some limits (fewer accounts, no AI features, no recurring transactions).</p>
        <p><B>Finly Premium</B> unlocks the full feature set.</p>
        {PAYMENTS_ENABLED ? (
          <>
            <p>Premium is purchased as a one-time payment through Razorpay, at the monthly or yearly price shown at checkout. It is not a recurring auto-renewing subscription, and your card is not automatically charged again. Payment is processed entirely by Razorpay; Finly's servers never receive or store your card, UPI, or bank details.</p>
            <p><B>Refunds:</B> payments are generally non-refundable once Premium access has been granted, except where required by applicable law. If something went wrong with a payment, contact us at the email below.</p>
          </>
        ) : (
          <p><B>Payments are currently switched off.</B> While they are, every feature, including those that belong to Premium, is available to all users at no charge and nothing can be purchased. If we start charging in the future, the price and terms will be shown before you pay, and some features may move to a paid plan.</p>
        )}
        <p><B>Promo codes,</B> where offered, may grant Premium access for a limited, stated period. Access reverts to Basic automatically once that period ends.</p>
      </Section>

      <Section title="Acceptable use">
        <p>Don't use Finly to store or process data you don't have the right to, don't attempt to break, overload, or reverse-engineer the service, and don't use the AI features for anything unrelated to your own personal finance. We may suspend or terminate accounts that abuse the service or its AI/email features.</p>
      </Section>

      <Section title="Third-party services">
        <p>Finly's features depend on external providers — Groq and Google Gemini for AI features, Brevo for email, Neon, Render and Cloudflare to run and deliver the service, Cloudinary for images attached to transactions, Razorpay for payments when they are switched on, and, if you choose to use them, Google for sign-in and Drive backup. Your use of those specific features is also subject to those providers' own terms. See our <Link to="/privacy" className="text-[#D4A24C] hover:underline">Privacy Policy</Link> for what each one receives.</p>
      </Section>

      <Section title="No warranty">
        <p>Finly is provided "as is." We work to keep it accurate and available, but we don't guarantee the app will be error-free, uninterrupted, or fit for any particular purpose — including tax, accounting, or investment decisions. Always double-check anything financially significant. Features may change or be withdrawn over time.</p>
      </Section>

      <Section title="Limitation of liability">
        <p>To the extent permitted by law, Finly and its developer aren't liable for indirect, incidental, or consequential damages arising from your use of the app, including decisions made based on AI-generated replies or suggestions.</p>
      </Section>

      <Section title="Changes to these terms">
        <p>If these terms change materially, we'll update the date at the top of this page. Continuing to use Finly after a change means you accept the updated terms.</p>
      </Section>

      <Section title="Governing law">
        <p>These terms are governed by the laws of India.</p>
      </Section>

      <Section title="Contact us">
        <p>Questions about these terms, or problems with your account, can be sent to <ContactLink />. We read what we receive but don't guarantee a response time.</p>
      </Section>
    </LegalPage>
  );
}
