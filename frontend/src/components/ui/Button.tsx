import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "accent" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium tracking-tight " +
  "rounded-md transition-transform " +
  "active:translate-y-px " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral " +
  "disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper border border-ink hover:bg-ink-soft",
  secondary: "bg-paper text-ink border border-ink hover:bg-paper-deep",
  accent: "bg-coral text-paper border border-coral hover:bg-coral-deep",
  ghost: "bg-transparent text-ink border border-transparent hover:bg-paper-deep",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-body-sm",
  md: "h-10 px-5 text-body",
  lg: "h-12 px-6 text-body-lg",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
});
