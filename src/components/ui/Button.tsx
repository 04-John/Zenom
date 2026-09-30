"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "bg-navy text-ivory hover:bg-navy-light",
  secondary: "border border-navy text-navy hover:bg-navy hover:text-ivory",
  ghost: "text-navy hover:text-copper",
};

// Buttons acknowledge interaction immediately: subtle press scale +
// disabled/loading state text swap, never waiting on an animation
// before confirming the action actually happened.
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", loading, disabled, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-btn px-6 py-3 text-sm font-medium tracking-wide transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none min-h-[44px]",
          variants[variant],
          className
        )}
        {...(props as any)}
      >
        {loading ? "Please wait…" : children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
