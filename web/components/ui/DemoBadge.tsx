export function DemoBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-disclaimer-border bg-disclaimer-bg px-3 py-1 text-xs font-medium text-amber-800">
      {children}
    </span>
  );
}

export function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span className={`icon-material text-primary ${className}`} aria-hidden>
      {name}
    </span>
  );
}
