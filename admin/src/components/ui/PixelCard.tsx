import { ReactNode } from "react";
export default function PixelCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-px-card border-[3px] border-px-border ${className}`}>
      {children}
    </div>
  );
}
