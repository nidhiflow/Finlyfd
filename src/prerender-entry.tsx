// Build-time only (used by prerender.mjs, never shipped to the browser). Renders the public
// pages to plain HTML so crawlers that do not run JavaScript — e.g. Razorpay's website
// review, link previews — see the real text instead of an empty app shell.
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { PrivacyPolicyScreen } from "./app/screens/PrivacyPolicyScreen";
import { TermsOfServiceScreen } from "./app/screens/TermsOfServiceScreen";
import { AccountDeletionScreen } from "./app/screens/AccountDeletionScreen";
import { RefundPolicyScreen } from "./app/screens/RefundPolicyScreen";
import { PricingScreen } from "./app/screens/PricingScreen";
import { AboutScreen } from "./app/screens/AboutScreen";
import { ContactScreen } from "./app/screens/ContactScreen";

export const pages = [
  { path: "privacy", title: "Privacy Policy — Finly", description: "How Finly collects, stores and protects your data.", Screen: PrivacyPolicyScreen },
  { path: "terms", title: "Terms of Service — Finly", description: "The terms for using Finly, a personal expense-tracking app.", Screen: TermsOfServiceScreen },
  { path: "account-deletion", title: "Delete your account — Finly", description: "How to delete your Finly account and what happens to your data.", Screen: AccountDeletionScreen },
  { path: "refund-policy", title: "Refund & Cancellation Policy — Finly", description: "How cancellations and refunds work for Finly Premium.", Screen: RefundPolicyScreen },
  { path: "pricing", title: "Pricing — Finly", description: "Finly Basic is free; Finly Premium is ₹99 per month or ₹999 per year.", Screen: PricingScreen },
  { path: "about", title: "About Finly", description: "Finly is a personal expense-tracking app. It is not a bank, lender or investment adviser.", Screen: AboutScreen },
  { path: "contact", title: "Contact Us — Finly", description: "Contact the Finly team by email.", Screen: ContactScreen },
];

export function render(path: string) {
  const page = pages.find((p) => p.path === path)!;
  const html = renderToString(
    <StaticRouter location={`/${path}`}>
      <page.Screen />
    </StaticRouter>
  );
  return { html, title: page.title, description: page.description };
}
