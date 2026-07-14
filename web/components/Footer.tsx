import type { Dictionary } from "@/lib/i18n";

export function Footer({ dict }: { dict: Dictionary }) {
  return (
    <footer className="border-t border-slate-100 bg-slate-50">
      <div className="mx-auto max-w-5xl space-y-3 px-4 py-8 text-xs text-slate-500">
        <p className="font-medium text-amber-700">{dict.footer.disclaimer}</p>
        <p>
          {dict.footer.built}{" "}
          <a href="https://igorjm.github.io" className="text-teal-700 underline">
            Igor Melo
          </a>
          {" · "}
          <a href="https://github.com/igorjm/levecare" className="text-teal-700 underline">
            GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
