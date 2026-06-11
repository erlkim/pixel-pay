export default function PixelBadge({
  variant,
  children,
}: {
  variant: "success" | "pending" | "failed" | "info";
  children: React.ReactNode;
}) {
  const v: Record<string, string> = {
    success: "border-px-primary text-px-primary",
    pending: "border-px-yellow text-px-yellow",
    failed: "border-px-secondary text-px-secondary",
    info: "border-px-accent text-px-accent",
  };
  return (
    <span
      className={`font-pixel text-[6px] px-3 py-1.5 border-[2px] uppercase tracking-wider inline-block ${v[variant]}`}
    >
      {children}
    </span>
  );
}
