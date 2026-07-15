import type { InputHTMLAttributes, ReactNode } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`mt-1 w-full rounded-[12px] border border-hairline bg-white px-3 py-2.5 text-body-md text-on-surface outline-none transition placeholder:text-outline focus:border-primary-action focus:ring-2 focus:ring-primary-action/20 ${className}`}
      {...props}
    />
  );
}

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-medium text-on-surface-variant ${className}`}>
      {label}
      {children}
    </label>
  );
}
