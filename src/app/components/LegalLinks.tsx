import { Link } from "react-router";

/**
 * Privacy / Terms / Account-deletion links, used on the public and authentication
 * screens (and the legal pages themselves). Real anchors rather than click handlers so
 * they work for crawlers, keyboard users and "open in new tab".
 */
export function LegalLinks({ className = "" }: { className?: string }) {
  const link = "hover:text-ink/70 transition-colors";
  return (
    <nav
      aria-label="Legal"
      className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-ink/40 ${className}`}
    >
      <Link to="/privacy" className={link}>Privacy Policy</Link>
      <span aria-hidden="true">&middot;</span>
      <Link to="/terms" className={link}>Terms of Service</Link>
      <span aria-hidden="true">&middot;</span>
      <Link to="/refund-policy" className={link}>Refunds</Link>
      <span aria-hidden="true">&middot;</span>
      <Link to="/pricing" className={link}>Pricing</Link>
      <span aria-hidden="true">&middot;</span>
      <Link to="/about" className={link}>About</Link>
      <span aria-hidden="true">&middot;</span>
      <Link to="/contact" className={link}>Contact</Link>
      <span aria-hidden="true">&middot;</span>
      <Link to="/account-deletion" className={link}>Delete account</Link>
    </nav>
  );
}
