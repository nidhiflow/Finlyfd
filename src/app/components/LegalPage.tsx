import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";
import { LegalLinks } from "./LegalLinks";

export const CONTACT_EMAIL = "nidhiflow.in@gmail.com";

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-ink font-semibold text-lg mb-3">{title}</h2>
      <div className="text-ink/70 text-sm leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export function ContactLink() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#D4A24C] hover:underline">
      {CONTACT_EMAIL}
    </a>
  );
}

interface LegalPageProps {
  title: string;
  icon: React.ReactNode;
  lastUpdated?: string;
  children: React.ReactNode;
}

/**
 * Shared shell for the public pages (Privacy, Terms, Account deletion). These are opened
 * directly by URL — from the Play Store listing, emails, the login screen — so the back
 * button must work even when there is no in-app history to go back to.
 */
export function LegalPage({ title, icon, lastUpdated, children }: LegalPageProps) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const previous = document.title;
    document.title = `${title} — Finly`;
    return () => {
      document.title = previous;
    };
  }, [title]);

  // location.key is "default" for the first entry of a session, i.e. a direct visit.
  const handleBack = () => (location.key === "default" ? navigate("/") : navigate(-1));

  return (
    <div className="min-h-screen bg-[var(--bg-deep)]">
      <div className="max-w-2xl mx-auto px-5 py-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-ink/60 text-sm mb-6 hover:text-ink transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-start gap-3 mb-2">
          <span className="flex-shrink-0 mt-1 text-[#D4A24C]">{icon}</span>
          <div>
            <h1 className="text-ink font-semibold text-2xl">{title}</h1>
            {lastUpdated && <p className="text-ink/50 text-xs mt-1">Last updated {lastUpdated}</p>}
          </div>
        </div>

        {children}

        <div className="border-t border-[var(--divider)] pt-6 mt-10">
          <LegalLinks />
          <p className="text-center text-xs text-ink/30 mt-3">
            <Link to="/" className="hover:text-ink/60 transition-colors">Finly</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
