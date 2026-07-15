import type { ReactNode } from "react";

export function SurfaceCard({
  children,
  className = "",
  padding = true,
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div
      className={`rounded-[16px] border border-hairline bg-white shadow-soft ${padding ? "p-6" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
