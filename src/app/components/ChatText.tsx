import { Fragment, type ReactNode } from "react";

// Minimal, safe renderer for the markdown the AI tends to emit (**bold**, *italic*,
// `code`, "- " bullets, "1." lists). Builds React nodes only — no HTML injection.
function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\n]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return <code key={i} className="px-1 rounded bg-ink/10 text-[0.9em]">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function ChatText({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        const heading = trimmed.match(/^#{1,6}\s+(.*)$/);
        if (heading) return <p key={i} className="font-semibold">{renderInline(heading[1])}</p>;

        const bullet = trimmed.match(/^[-*•]\s+(.*)$/);
        if (bullet) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-ink/50">•</span>
              <span className="flex-1">{renderInline(bullet[1])}</span>
            </div>
          );
        }

        const numbered = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
        if (numbered) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-ink/50 min-w-[1.1em]">{numbered[1]}.</span>
              <span className="flex-1">{renderInline(numbered[2])}</span>
            </div>
          );
        }

        return <p key={i}>{renderInline(trimmed)}</p>;
      })}
    </div>
  );
}
