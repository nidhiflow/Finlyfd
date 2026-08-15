import { useNavigate } from "react-router";
import { ChevronLeft, Shield } from "lucide-react";

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

export function PrivacyPolicyScreen() {
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
          <Shield className="w-6 h-6 text-[#D4A24C] flex-shrink-0 mt-1" />
          <div>
            <h1 className="text-ink font-semibold text-2xl">Privacy Policy</h1>
            <p className="text-ink/50 text-xs mt-1">Last updated {LAST_UPDATED}</p>
          </div>
        </div>

        <p className="text-ink/70 text-sm leading-relaxed mt-6 mb-8">
          Finly ("we," "us," "our") is a personal finance tracking app. This page explains, in plain
          terms, what information Finly collects, why, who it's shared with, and what control you have
          over it. This policy describes what the app actually does — nothing here is aspirational.
        </p>

        <Section title="Information we collect">
          <p><strong className="text-ink/85">Account information:</strong> your name, email address, password (stored as an irreversible bcrypt hash — we never store or transmit your password in plain text), and optionally a phone number. If you sign in with Google, we receive your Google account ID, name, email, and profile photo instead.</p>
          <p><strong className="text-ink/85">Financial data you enter:</strong> transactions, accounts, categories, budgets, savings goals, and recurring bills — this is the core data the app is built to manage, and it's yours.</p>
          <p><strong className="text-ink/85">Receipt photos:</strong> if you use receipt scanning, the photo you upload is processed to extract amounts and merchant details, then stored so you can view it later.</p>
          <p><strong className="text-ink/85">AI chat messages:</strong> if you use the AI assistant, your messages and the assistant's replies are stored temporarily to keep the conversation coherent.</p>
          <p><strong className="text-ink/85">Device and security information:</strong> when you sign in, we record a one-way hash of your device's browser identifier, your IP address, and the timestamp. This is used only to detect sign-ins from a new device and trigger extra email verification, and to power the login-alert emails you can see in Settings.</p>
          <p><strong className="text-ink/85">Payment information:</strong> if you upgrade to Pro, payment is handled entirely by Razorpay. Finly's servers never receive or store your card, UPI, or bank details — only the payment confirmation and subscription status.</p>
        </Section>

        <Section title="How we use your information">
          <p>To run the app: authenticate you, store and display your financial data, generate the reports and insights you ask for, and process payments.</p>
          <p>To keep your account secure: detect unfamiliar sign-ins, send OTP verification codes, and alert you by email when your account is accessed from a new device.</p>
          <p>To power optional AI features: if you use AI chat, insights, budget suggestions, or receipt scanning, the relevant financial data (not your password, and not your email) is sent to the AI provider needed to generate that response.</p>
          <p>We do not use your data for advertising, and we do not sell your data to anyone, ever.</p>
        </Section>

        <Section title="Third parties we share data with">
          <p>Finly relies on a small number of service providers to function. Each only receives the minimum data needed for its purpose:</p>
          <ul className="list-disc list-inside space-y-2 ml-1">
            <li><strong className="text-ink/85">Groq and Google Gemini</strong> (AI providers) — receive your financial data (transactions, budgets, goals) or receipt photos when you use an AI feature, in order to generate a response. They do not receive your password or contact details.</li>
            <li><strong className="text-ink/85">Cloudinary</strong> — stores receipt photos you upload.</li>
            <li><strong className="text-ink/85">Razorpay</strong> — processes Pro subscription payments. Governed by Razorpay's own privacy policy for anything you enter on their payment screen.</li>
            <li><strong className="text-ink/85">Brevo</strong> — sends OTP, welcome, and login-alert emails on our behalf; receives your email address and name.</li>
            <li><strong className="text-ink/85">Google</strong> — used for Google Sign-In, and separately, if you turn on Automatic Drive Backup, to upload a backup of your data to <em>your own</em> Google Drive. Finly never receives or stores your Drive files — the backup only exists in your account.</li>
          </ul>
          <p>We do not use any advertising, analytics, or tracking services. There are no ad trackers, no analytics pixels, and no data brokers involved anywhere in Finly.</p>
        </Section>

        <Section title="Data retention">
          <p>Your financial data (transactions, accounts, budgets, goals) is kept for as long as your account exists.</p>
          <p>AI chat history is automatically deleted after 7 days.</p>
          <p>OTP verification codes expire after 5 minutes and are single-use.</p>
          <p>Device sign-in records are kept to support account security and are removed when you delete your account.</p>
        </Section>

        <Section title="Your rights and choices">
          <p><strong className="text-ink/85">Access and correction:</strong> you can view and edit almost all of your data directly in the app.</p>
          <p><strong className="text-ink/85">Deletion:</strong> you can permanently delete your account and all associated data at any time from Settings. This is a real deletion, not a deactivation — your transactions, accounts, receipts, chat history, and login records are all permanently removed and cannot be recovered.</p>
          <p><strong className="text-ink/85">Data export:</strong> you can export your transactions and reports as PDF or CSV at any time from within the app.</p>
          <p>To request anything not covered above, contact us at the email below.</p>
        </Section>

        <Section title="Security">
          <p>Passwords are hashed with bcrypt and never stored or logged in plain text. All traffic between the app and our servers is encrypted in transit (HTTPS). Payment card details never touch our servers — Razorpay handles that directly. Access to your data within the app is scoped strictly to your own account.</p>
        </Section>

        <Section title="Children's privacy">
          <p>Finly is not directed at, and should not be used by, anyone under the age of 18. We do not knowingly collect data from children.</p>
        </Section>

        <Section title="Changes to this policy">
          <p>If this policy changes in a way that affects how your data is used, we'll update the date at the top of this page. Continued use of Finly after a change means you accept the updated policy.</p>
        </Section>

        <Section title="Contact us">
          <p>Questions about this policy, or requests about your data, can be sent to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#D4A24C] hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </Section>
      </div>
    </div>
  );
}
