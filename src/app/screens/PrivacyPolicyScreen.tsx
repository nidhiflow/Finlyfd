import { Link } from "react-router";
import { Shield } from "lucide-react";
import { LegalPage, LegalSection as Section, ContactLink } from "../components/LegalPage";

const LAST_UPDATED = "September 25, 2026";

const B = ({ children }: { children: React.ReactNode }) => (
  <strong className="text-ink/85">{children}</strong>
);

export function PrivacyPolicyScreen() {
  return (
    <LegalPage title="Privacy Policy" icon={<Shield className="w-6 h-6" />} lastUpdated={LAST_UPDATED}>
      <p className="text-ink/70 text-sm leading-relaxed mt-6 mb-8">
        Finly ("we," "us," "our") is a personal finance tracking app available at nidhiflow.in. This page explains
        what information Finly collects, why, where it is stored, which other companies handle it, and what control
        you have over it. It describes what the app actually does today. Where we cannot say for certain what a
        third-party provider does with data, we only state what Finly sends to that provider.
      </p>

      <Section title="Information we collect">
        <p><B>Account information:</B> your name, email address, and a password — stored only as an irreversible bcrypt hash, never in plain text (accounts created with Google have no password). You may also add a phone number and a profile photo. Each account has a randomly generated user ID, a creation date, and a subscription status.</p>
        <p><B>Google Sign-In:</B> if you use "Continue with Google," Google gives us your Google account ID, name, email address, and a link to your profile picture. We never receive your Google password.</p>
        <p><B>Financial information you enter:</B> transactions (income, expenses and transfers, with amount, date, title or note, category and account), accounts with their names and balances, categories, budgets, savings goals, recurring transactions, and preferences such as your currency. This is the core data the app exists to manage.</p>
        <p><B>Receipts and uploaded files:</B> if you use receipt scanning, the photo you take, or the image, PDF, Excel or CSV file you choose, is sent to our server and on to an AI provider (see "AI features and receipt scanning") so the amount, merchant, date and category can be read. The result is used to pre-fill the transaction form. Finly does not keep the file you upload for scanning, and the current app does not attach the scanned image to the saved transaction. Our servers are able to store an image attached to a transaction (in Cloudinary); if a transaction in your account has one, it is stored that way.</p>
        <p><B>AI chat messages:</B> the messages you send to the AI assistant and its replies are saved in our database.</p>
        <p><B>Device and security information:</B> when you sign in, we record your device's User-Agent string (which identifies your browser and operating system), a short hash of it, your IP address, and when the device was first and last seen. Each device has one record; the IP address on it is updated at each sign-in.</p>
        <p><B>Usage analytics:</B> while you are signed in, Finly records which screen you open (for example "dashboard" or "budget") together with your user ID and the time. We use this to see which parts of the app are used. Finly does not include any third-party analytics or advertising tools.</p>
        <p><B>Google Drive backup information:</B> if you turn on automatic backup, we store a Google refresh token for your account (see "Google Drive backup"). If you use manual backup, a short-lived Google access token is kept in your browser on that device.</p>
        <p><B>Payment and subscription records:</B> your subscription plan and, for promo codes, the code you redeemed, when, and when the access expires. If paid plans are switched on, we also keep a record of each order — plan, billing period, amount, status, payment method type and Razorpay payment ID. Your card, UPI or bank details are entered on Razorpay's screens and never reach Finly's servers. Payments are currently switched off.</p>
        <p><B>Information stored on your device:</B> your sign-in session, a cached copy of your profile, and preferences such as theme and dashboard settings. If you set an app-lock PIN, only a hash of it is kept, on your device — it is never sent to us. To load faster, the app may also keep app files and recent responses from our API in your browser's cache.</p>
        <p><B>Camera and microphone:</B> the camera is used only when you choose to scan a receipt with it. Voice input in the AI chat uses your browser's built-in speech recognition; Finly's servers do not receive the audio, but depending on your browser, the browser's maker may process it.</p>
      </Section>

      <Section title="How we use your information">
        <p><B>To run the app:</B> sign you in, store and show your financial data, and produce the reports, charts and totals you ask for.</p>
        <p><B>To keep your account secure:</B> recognise new devices and, when needed, ask for an emailed one-time code — for example when you sign in from a new device or after a period of inactivity — and limit repeated sign-in attempts.</p>
        <p><B>To power AI features:</B> answer your chat messages and read receipts and files you choose to scan.</p>
        <p><B>To back up your data,</B> if you ask us to, to your own Google Drive.</p>
        <p><B>To send essential emails:</B> verification codes and a welcome message. We do not send marketing email.</p>
        <p><B>To process payments and subscriptions,</B> when they are switched on, and to apply promo codes.</p>
        <p><B>To understand how the app is used,</B> through the screen-visit records described above.</p>
        <p>We do not use your data for advertising and we do not sell it.</p>
      </Section>

      <Section title="Where your data is stored and who else handles it">
        <p>Finly's own systems run on the providers below. Each is listed with what Finly sends to it. Beyond that, we cannot describe how a provider handles data on its own systems; their own policies apply. Some providers are based outside India, so your data may be processed in other countries.</p>
        <ul className="list-disc list-inside space-y-2 ml-1">
          <li><B>Neon (PostgreSQL)</B> — the database where your account and financial data are stored: everything described in "Information we collect" except items kept only on your device.</li>
          <li><B>Render</B> — hosts the Finly website and the API. All traffic between the app and our servers passes through it.</li>
          <li><B>Cloudflare</B> — sits in front of the website and the API as a network and security layer, so requests to Finly pass through it.</li>
          <li><B>Groq</B> — AI provider for the chat assistant (and a fallback for receipt scanning). See "AI features and receipt scanning" for exactly what it receives.</li>
          <li><B>Google Gemini</B> — AI provider for receipt and document scanning. Receives the image, PDF, or spreadsheet/CSV content you choose to scan.</li>
          <li><B>Cloudinary</B> — stores images attached to transactions, if any. It is not used for images you only scan.</li>
          <li><B>Brevo</B> — sends our emails. Receives your email address, your name (welcome email) and the email content, such as your verification code.</li>
          <li><B>Google Identity (Sign-In)</B> — used on the sign-in and sign-up screens. Loading it means Google's servers receive standard request information from your browser.</li>
          <li><B>Google Drive API</B> — used only for the backup features you turn on (see "Google Drive backup").</li>
          <li><B>Razorpay</B> — payment processor, used only if paid plans are switched on. Its checkout script is loaded whenever the app opens, so Razorpay's servers receive standard request information from your browser (such as your IP address) even when you are not paying. When checkout is opened, it may load a logo image from Flaticon's servers.</li>
          <li><B>Google Fonts</B> — the app's fonts are loaded from Google's servers, which receive standard request information from your browser.</li>
        </ul>
      </Section>

      <Section title="AI features and receipt scanning">
        <p><B>AI chat:</B> when you send a message, our server sends Groq your message together with a summary of your finances so the answer can be specific to you: your account names, types and balances; your budgets (category, amount, period); your savings goals (name, target, progress, target month); your 50 most recent transactions (date, type, amount, category and note); and your list of categories and accounts with their IDs. It does not send your name, email address, phone number or password. Other AI summaries or budget suggestions, where offered, send spending totals by category and month.</p>
        <p><B>Receipt scanning:</B> the photo, PDF, image, CSV or Excel file you choose is sent to Google Gemini or, if Gemini is not available, to Groq (used only for images and spreadsheet/CSV data, not PDFs) along with instructions asking for the amount, merchant, date and a category. Excel files are converted to CSV text first. We do not keep the file.</p>
        <p>AI responses are generated automatically and can be wrong. They are information, not financial advice. Only use scanning and chat with content you are comfortable sending to these providers.</p>
      </Section>

      <Section title="Google Drive backup">
        <p>Both backup options are off unless you turn them on, and both use Google's "drive.file" permission, which lets Finly see and manage only the files it created in your Drive — not the rest of your Drive.</p>
        <p><B>Manual backup:</B> you sign in to Google in your browser and Finly uploads a backup file directly from your browser to your Google Drive. The Google access token is stored in your browser on that device. You can disconnect at any time in Settings, which removes it from the device.</p>
        <p><B>Automatic daily backup:</B> you connect your Google account once. We then store a Google refresh token in our database, and once a day our server builds a backup of your transactions, accounts, categories, budgets and savings goals and uploads it to your Google Drive as a file. You can disconnect in Settings, which deletes the stored token from our database.</p>
        <p>Backup files live in your Google account, not with Finly. Deleting your Finly account does not delete the backup files already in your Drive — delete those in Google Drive if you no longer want them. You can also review or remove Finly's access at any time in your Google Account's third-party access settings.</p>
      </Section>

      <Section title="Data retention">
        <p>Where we have not set a fixed retention period, this policy says so rather than inventing one.</p>
        <ul className="list-disc list-inside space-y-2 ml-1">
          <li><B>Account, financial and profile data</B> is kept until you delete it or delete your account.</li>
          <li><B>AI chat messages</B> are saved on our servers. Messages older than 7 days are removed the next time you send a chat message. They are all removed when you delete your account.</li>
          <li><B>Verification codes</B> expire after 5 minutes and work once. A code, and any pending sign-up details stored with it (name, phone number, hashed password), are removed when it is used or replaced by a new one, and when the account is deleted.</li>
          <li><B>Device records and screen-visit records</B> are kept until you delete your account. No shorter period is currently set.</li>
          <li><B>Payment and promo-code records</B> are kept until you delete your account.</li>
          <li><B>Backups in your Google Drive</B> stay there until you delete them.</li>
          <li><B>Our providers</B> (hosting, database, network, AI, email) may keep logs or copies for their own periods, which we do not control.</li>
        </ul>
      </Section>

      <Section title="Deleting your account">
        <p>You can delete your account yourself from Settings. Full steps, what is removed, and what may remain are on our <Link to="/account-deletion" className="text-[#D4A24C] hover:underline">account deletion page</Link>. If you cannot sign in, email us at <ContactLink /> from the address on your account.</p>
      </Section>

      <Section title="Your rights and choices">
        <p><B>Access and correction:</B> you can view and edit almost all of your data directly in the app, including your name, email, phone number and profile photo.</p>
        <p><B>Export:</B> you can export your data as CSV or PDF and download a backup file from Settings.</p>
        <p><B>Backups and connections:</B> you can disconnect Google Drive backup at any time.</p>
        <p><B>Deletion:</B> you can delete your account from Settings.</p>
        <p>For anything you cannot do in the app — including questions or requests about your data — email <ContactLink />.</p>
      </Section>

      <Section title="Security">
        <p>Traffic between the app and our servers is encrypted in transit (HTTPS). Passwords are hashed with bcrypt and are not stored or logged in plain text. Sign-in and verification-code attempts are rate-limited, and access to your data through the API is limited to your own account. Payment card details never reach our servers. No online service can be guaranteed completely secure, so please choose a strong, unique password and keep your device secure.</p>
      </Section>

      <Section title="Children's privacy">
        <p>Finly is not directed at, and should not be used by, anyone under the age of 18. We do not knowingly collect data from children. If you believe a child has an account, contact us so we can remove it.</p>
      </Section>

      <Section title="Changes to this policy">
        <p>If this policy changes in a way that affects how your data is used, we will update the date at the top of this page. Continued use of Finly after a change means you accept the updated policy.</p>
      </Section>

      <Section title="Contact us">
        <p>Questions about this policy, or requests about your data, can be sent to <ContactLink />.</p>
      </Section>
    </LegalPage>
  );
}
