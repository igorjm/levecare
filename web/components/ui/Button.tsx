import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary-action text-on-primary hover:bg-primary-hover disabled:opacity-50 shadow-soft",
  secondary:
    "border border-primary-action bg-transparent text-primary-action hover:bg-primary-action/5 disabled:opacity-50",
  ghost: "border border-hairline bg-white text-on-surface-variant hover:border-primary-action hover:text-primary",
  danger: "border border-outline-variant bg-white text-on-surface-variant hover:border-error hover:text-error",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children: ReactNode }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-[12px] px-5 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
