import { useNavigate } from "react-router";
import { ChevronLeft, FileText } from "lucide-react";

const LAST_UPDATED = "August 14, 2026";
const CONTACT_EMAIL = "nidhiflow.in@gmail.com";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-ink font-semibold text-lg mb-3">{title}</h2>
      <div className="text-ink/70 text-sm leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export function TermsOfServiceScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--bg-deep)]">
      <div className="max-w-2xl mx-auto px-5 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-ink/60 text-sm mb-6 hover:text-ink transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-start gap-3 mb-2">
          <FileText className="w-6 h-6 text-[#D4A24C] flex-shrink-0 mt-1" />
          <div>
            <h1 className="text-ink font-semibold text-2xl">Terms of Service</h1>
            <p className="text-ink/50 text-xs mt-1">Last updated {LAST_UPDATED}</p>
          </div>
        </div>

        <p className="text-ink/70 text-sm leading-relaxed mt-6 mb-8">
          These terms cover your use of Finly. By creating an account, you agree to them. If anything
          here is unclear, contact us before you rely on it — see the bottom of this page.
        </p>

        <Section title="What Finly is">
          <p>Finly is a personal finance tracking app: you record income and expenses, organize them into accounts and categories, set budgets and savings goals, and optionally use AI features to get insights or scan receipts.</p>
          <p><strong className="text-ink/85">Finly is not a bank, is not a financial advisor, and does not move or hold your money.</strong> Every number in the app is based entirely on what you (or the receipt scanner, on your behalf) enter — Finly has no live connection to your actual bank accounts. AI-generated insights, budget suggestions, and chat responses are informational only and are not financial advice; decisions you make based on them are your own.</p>
        </Section>

        <Section title="Your account">
          <p>You must be 18 or older to use Finly. You're responsible for keeping your password and device secure, and for everything that happens under your account. Tell us immediately if you believe your account has been compromised.</p>
          <p>You can delete your account at any time from Settings. This permanently removes your data and cannot be undone — see our Privacy Policy for exactly what that includes.</p>
        </Section>

        <Section title="Free and Premium plans">
          <p><strong className="text-ink/85">Finly Basic</strong> is free and includes core expense tracking with some limits (fewer accounts, no AI features, no recurring transactions).</p>
          <p><strong className="text-ink/85">Finly Premium</strong> unlocks the full feature set. It's purchased as a one-time payment through Razorpay, shown at a monthly or yearly price point — this is a one-time purchase for continued access, not a recurring auto-renewing subscription, and your card is not automatically charged again. Payment is processed entirely by Razorpay; Finly's servers never receive or store your card, UPI, or bank details.</p>
          <p><strong className="text-ink/85">Promo codes</strong> may grant Premium access for a limited, stated period. Access reverts to Basic automatically once that period ends.</p>
          <p><strong className="text-ink/85">Refunds:</strong> payments are generally non-refundable once Premium access has been granted, except where required by applicable law. If something went wrong with a payment, contact us and we'll sort it out.</p>
        </Section>

        <Section title="Acceptable use">
          <p>Don't use Finly to store or process data you don't have the right to, don't attempt to break, overload, or reverse-engineer the service, and don't use the AI features to generate content unrelated to your own personal finance. We may suspend or terminate accounts that abuse the service or its AI/email features.</p>
        </Section>

        <Section title="Third-party services">
          <p>Finly's features depend on external providers — Razorpay for payments, Groq and Google Gemini for AI features, Cloudinary for receipt photos, Brevo for email, and optionally Google for sign-in and Drive backup. Your use of those specific features is also subject to those providers' own terms. See our Privacy Policy for the full list and what each one receives.</p>
        </Section>

        <Section title="No warranty">
          <p>Finly is provided "as is." We work to keep it accurate and available, but we don't guarantee the app will be error-free, uninterrupted, or fit for any particular purpose — including tax, accounting, or investment decisions. Always double-check anything financially significant.</p>
        </Section>

        <Section title="Limitation of liability">
          <p>To the extent permitted by law, Finly and its developer aren't liable for indirect, incidental, or consequential damages arising from your use of the app, including decisions made based on AI-generated insights or budget suggestions.</p>
        </Section>

        <Section title="Changes to these terms">
          <p>If these terms change materially, we'll update the date at the top of this page. Continuing to use Finly after a change means you accept the updated terms.</p>
        </Section>

        <Section title="Governing law">
          <p>These terms are governed by the laws of India.</p>
        </Section>

        <Section title="Contact us">
          <p>Questions about these terms can be sent to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#D4A24C] hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </Section>
      </div>
    </div>
  );
}
