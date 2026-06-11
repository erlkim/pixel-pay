import { ButtonHTMLAttributes, ReactNode } from "react";
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "danger" | "accent" | "yellow" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}
export default function PixelButton({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}: Props) {
  const v: Record<string, string> = {
    primary:
      "border-px-primary text-px-primary hover:bg-px-primary hover:text-px-bg",
    danger:
      "border-px-secondary text-px-secondary hover:bg-px-secondary hover:text-px-white",
    accent:
      "border-px-accent text-px-accent hover:bg-px-accent hover:text-px-bg",
    yellow:
      "border-px-yellow text-px-yellow hover:bg-px-yellow hover:text-px-bg",
    ghost:
      "border-px-muted text-px-muted hover:border-px-white hover:text-px-white",
  };
  const s: Record<string, string> = {
    sm: "font-pixel text-[6px] px-3 py-1.5",
    md: "font-pixel text-[8px] px-5 py-2.5",
    lg: "font-pixel text-[10px] px-8 py-3.5",
  };
  return (
    <button
      className={`border-[3px] bg-transparent cursor-pointer uppercase tracking-wider transition-all hover:-translate-y-0.5 disabled:opacity-40 ${v[variant]} ${s[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
