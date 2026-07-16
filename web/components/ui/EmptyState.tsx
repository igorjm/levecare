import type { ReactNode } from "react";
import { Icon } from "@/components/ui/DemoBadge";
import { Button } from "@/components/ui/Button";

export function EmptyState({
  icon = "inbox",
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center animate-fade-in">
      <span className="flex size-14 items-center justify-center rounded-full bg-surface-container text-primary">
        <Icon name={icon} className="text-[28px]" />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold text-on-background">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-on-surface-variant">{description}</p>
      {actionLabel && onAction && (
        <Button type="button" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse" aria-busy>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="size-10 shrink-0 rounded-full bg-outline-variant/40" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 rounded bg-outline-variant/40" />
            <div className="h-3 w-1/2 rounded bg-outline-variant/30" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  retryLabel,
  onRetry,
}: {
  title: string;
  description: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-error/10 text-error">
        <Icon name="error" className="text-[28px] text-error" />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold text-on-background">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-on-surface-variant">{description}</p>
      <Button type="button" variant="secondary" className="mt-5" onClick={onRetry}>
        <Icon name="refresh" className="text-[18px]" />
        {retryLabel}
      </Button>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-on-background/40 p-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-modal
        className="w-full max-w-md rounded-[16px] border border-hairline bg-white p-6 shadow-soft animate-fade-in"
      >
        <div className="flex gap-3">
          <Icon name="warning" className="text-[28px] text-disclaimer" />
          <div>
            <h3 className="font-display text-xl font-semibold text-on-background">{title}</h3>
            <p className="mt-2 text-sm text-on-surface-variant">{description}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function StatusChip({
  tone = "neutral",
  children,
}: {
  tone?: "success" | "neutral" | "warn" | "danger";
  children: ReactNode;
}) {
  const styles = {
    success: "bg-secondary-container/40 text-primary",
    neutral: "bg-surface-container text-on-surface-variant",
    warn: "bg-disclaimer-bg text-amber-800",
    danger: "bg-error/10 text-error",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${styles[tone]}`}>
      {children}
    </span>
  );
}
