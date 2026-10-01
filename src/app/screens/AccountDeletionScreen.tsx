import { Link } from "react-router";
import { Trash2 } from "lucide-react";
import { LegalPage, LegalSection as Section, ContactLink, CONTACT_EMAIL } from "../components/LegalPage";
import { authAPI } from "../services/api";

const LAST_UPDATED = "September 25, 2026";

const B = ({ children }: { children: React.ReactNode }) => (
  <strong className="text-ink/85">{children}</strong>
);

export function AccountDeletionScreen() {
  // The settings screen needs a signed-in session, so send signed-out visitors to sign in first.
  const settingsTarget = authAPI.isAuthenticated() ? "/dashboard/settings" : "/login";

  return (
    <LegalPage title="Delete your Finly account" icon={<Trash2 className="w-6 h-6" />} lastUpdated={LAST_UPDATED}>
      <p className="text-ink/70 text-sm leading-relaxed mt-6 mb-8">
        You can delete your Finly account, and the data in it, yourself from inside the app at any time. If you
        cannot sign in or no longer have the app, you can ask us to do it by email instead.
      </p>

      <Section title="Delete your account in the app">
        <ol className="list-decimal list-inside space-y-2 ml-1">
          <li>Sign in to Finly.</li>
          <li>Open the menu (<B>More</B>) and choose <B>Settings</B>.</li>
          <li>Scroll to the <B>Danger Zone</B> at the bottom and tap <B>Delete Account</B>.</li>
          <li>Read the warning and tap <B>Delete</B>. Wait while the request completes.</li>
          <li>When the deletion succeeds you will see "Account deleted" and be signed out. If it fails, you will see an error message, your account stays as it was, and you can try again or email us.</li>
        </ol>
        <p>
          <Link
            to={settingsTarget}
            className="inline-block mt-1 px-4 py-2.5 bg-[var(--surface)] border border-[var(--divider)] rounded-xl text-ink text-sm font-medium hover:border-[#D4A24C]/40 transition-colors"
          >
            {settingsTarget === "/login" ? "Sign in to delete your account" : "Open Settings"}
          </Link>
        </p>
      </Section>

      <Section title="Can't sign in? Ask us by email">
        <p>
          Email <ContactLink /> with the subject "Delete my Finly account", sent from the email address
          registered to the account, so we can confirm the account is yours. If we cannot confirm that, we may ask
          for more information before deleting anything.
        </p>
        <p>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Delete my Finly account")}`}
            className="inline-block px-4 py-2.5 bg-[var(--surface)] border border-[var(--divider)] rounded-xl text-ink text-sm font-medium hover:border-[#D4A24C]/40 transition-colors"
          >
            Email a deletion request
          </a>
        </p>
      </Section>

      <Section title="What deleting your account does">
        <p>Deleting your account is permanent. It cannot be undone and we cannot recover the data afterwards. When you confirm, Finly removes from its live database:</p>
        <ul className="list-disc list-inside space-y-2 ml-1">
          <li>Your account and profile: name, email address, phone number, profile photo, and your password hash or Google account ID.</li>
          <li>Your transactions (including recurring ones), accounts and balances, categories, budgets, savings goals, and app settings.</li>
          <li>Your AI chat messages stored on our servers.</li>
          <li>Your sign-in device records (User-Agent and IP address) and your screen-visit records.</li>
          <li>Your subscription, promo-code and payment records.</li>
          <li>Any pending verification codes for your email address.</li>
        </ul>
        <p>Finly also tries to clean up data held outside its database:</p>
        <ul className="list-disc list-inside space-y-2 ml-1">
          <li><B>Images attached to transactions</B> (stored in Cloudinary) are deleted as part of the process. This is a best-effort step: if Cloudinary cannot be reached at that moment, the image may stay there — email us and we will remove it.</li>
          <li><B>Automatic Google Drive backup:</B> the stored Google token is deleted with your account, and we ask Google to revoke Finly's access.</li>
        </ul>
        <p>The Finly app on your device also clears your sign-in session, app-lock PIN, and Google Drive connection details.</p>
      </Section>

      <Section title="What is not deleted, or may remain for a while">
        <ul className="list-disc list-inside space-y-2 ml-1">
          <li><B>Backup files in your own Google Drive</B> (manual or automatic). They belong to your Google account; delete them in Google Drive. You can also review Finly's access in your Google Account's third-party access settings.</li>
          <li><B>Files you exported</B> (CSV, PDF or backup files) and saved on your own devices.</li>
          <li><B>Copies held by our providers.</B> Our hosting, database and network providers may keep backups or logs for a limited period under their own retention rules, and the AI and email providers may hold the messages, files or emails Finly sent them earlier. Deleting your Finly account does not reach into those. See the <Link to="/privacy" className="text-[#D4A24C] hover:underline">Privacy Policy</Link> for which providers handle what.</li>
        </ul>
        <p>Deleting your Finly account does not delete your Google account.</p>
      </Section>

      <Section title="Questions">
        <p>For anything about your data that is not covered here, email <ContactLink />. See also our <Link to="/privacy" className="text-[#D4A24C] hover:underline">Privacy Policy</Link> and <Link to="/terms" className="text-[#D4A24C] hover:underline">Terms of Service</Link>.</p>
      </Section>
    </LegalPage>
  );
}
