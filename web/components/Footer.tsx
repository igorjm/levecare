import type { Dictionary } from "@/lib/i18n";

export function Footer({ dict }: { dict: Dictionary }) {
  return (
    <footer className="mt-auto border-t border-hairline bg-surface">
      <div className="container-marketing space-y-5 py-10 text-center">
        <p className="font-display text-xl font-bold text-primary">LeveCare</p>
        <div className="flex flex-wrap items-center justify-center gap-6 text-caption text-on-surface-variant">
          <a href="#disclaimer" className="hover:text-primary">
            {dict.footer.terms}
          </a>
          <a href="#disclaimer" className="hover:text-primary">
            {dict.footer.privacy}
          </a>
          <a href="mailto:hello@igorjm.github.io" className="hover:text-primary">
            {dict.footer.support}
          </a>
        </div>
        <p id="disclaimer" className="mx-auto max-w-3xl text-xs leading-relaxed text-amber-800/90">
          {dict.footer.disclaimer}
        </p>
        <p className="text-xs text-outline">
          {dict.footer.compliance}
        </p>
        <p className="text-xs text-on-surface-variant">
          {dict.footer.built}{" "}
          <a href="https://igorjm.github.io" className="text-primary underline">
            Igor Melo
          </a>
          {" · "}
          <a href="https://github.com/igorjm/levecare" className="text-primary underline">
            GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
