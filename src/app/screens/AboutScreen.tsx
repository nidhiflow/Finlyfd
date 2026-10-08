import { Link } from "react-router";
import { Info } from "lucide-react";
import { LegalPage, LegalSection as Section, ContactLink } from "../components/LegalPage";

export function AboutScreen() {
  return (
    <LegalPage title="About Finly" icon={<Info className="w-6 h-6" />}>
      <p className="text-ink/70 text-sm leading-relaxed mt-6 mb-8">
        Finly is a personal expense-tracking app, available as a web app at nidhiflow.in and on Android.
      </p>

      <Section title="What Finly does">
        <p>You record your income and expenses, organise them into accounts and categories, set budgets and savings goals, and see where your money goes in charts and summaries. Optional extras include receipt scanning, recurring transactions, an AI assistant for questions about your own entries, and backup to your own Google Drive.</p>
      </Section>

      <Section title="What Finly is not">
        <p>Finly is a software tool. It is <strong className="text-ink/85">not a bank, lender, investment adviser or payment service</strong>. It does not hold, lend, invest or move your money, and it does not connect to your bank accounts. Everything in the app is based on what you enter.</p>
      </Section>

      <Section title="Plans">
        <p>Finly has a free Basic plan and a paid Premium plan for the full feature set. See <Link to="/pricing" className="text-[#D4A24C] hover:underline">Pricing</Link> for details.</p>
      </Section>

      <Section title="Contact">
        <p>Write to us at <ContactLink /> or see the <Link to="/contact" className="text-[#D4A24C] hover:underline">contact page</Link>.</p>
      </Section>
    </LegalPage>
  );
}
