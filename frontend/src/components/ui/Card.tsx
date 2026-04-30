import { type HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type Variant = "outlined" | "surface" | "accent";

const variants: Record<Variant, string> = {
  outlined:
    "bg-paper border border-ink/15 hover:border-ink/40 transition-colors",
  surface: "bg-paper-deep border border-transparent",
  accent: "bg-coral text-paper border border-coral",
};

export interface CardProps extends HTMLAttributes<HTMLElement> {
  variant?: Variant;
  as?: "div" | "article" | "section";
}

export function Card({
  variant = "outlined",
  as: Tag = "div",
  className,
  ...props
}: CardProps) {
  return (
    <Tag
      className={cn("rounded-md p-6", variants[variant], className)}
      {...props}
    />
  );
}
