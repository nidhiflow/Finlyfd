import { Mail } from "lucide-react";
import { LegalPage, LegalSection as Section, ContactLink, CONTACT_PHONE, CONTACT_ADDRESS } from "../components/LegalPage";

export function ContactScreen() {
  return (
    <LegalPage title="Contact Us" icon={<Mail className="w-6 h-6" />}>
      <p className="text-ink/70 text-sm leading-relaxed mt-6 mb-8">
        Questions about Finly, problems with your account or a payment, or privacy requests: get in touch using the details below.
      </p>

      <Section title="Email">
        <p><ContactLink /></p>
        <p>We read everything we receive. We aim to reply within 2 to 3 working days, but do not guarantee a response time.</p>
      </Section>

      {CONTACT_PHONE && (
        <Section title="Phone">
          <p><a href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`} className="text-[#D4A24C] hover:underline">{CONTACT_PHONE}</a></p>
        </Section>
      )}

      {CONTACT_ADDRESS && (
        <Section title="Address">
          <p>{CONTACT_ADDRESS}</p>
        </Section>
      )}

      <Section title="What to include">
        <p>For account help, write from the email address you signed up with. For payment problems, include the payment ID and date. To delete your account, use Settings in the app or see the account deletion page.</p>
      </Section>
    </LegalPage>
  );
}
