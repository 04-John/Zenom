"use client";

import { ButtonHTMLAttributes, forwardRef, useCallback, useLayoutEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ZenomSpinner } from "@/components/brand/ZenomSpinner";
import { buttonClass, type ButtonVariant } from "@/lib/button-class";

export { buttonClass };
export type { ButtonVariant };

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

// Spinner line colour that contrasts with each variant's fill.
const SPINNER_TONE: Record<ButtonVariant, "dark" | "paper"> = {
  primary: "paper", // light pill
  secondary: "dark",
  ghost: "dark",
  ember: "paper", // ember pill
  paper: "dark", // dark pill
};

// Buttons acknowledge interaction immediately: subtle press scale +
// the Zenom mark drawing in place of the label while pending. The width is
// locked on the transition to loading so the button never jumps.
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", loading, disabled, children, style, ...props }, ref) => {
    const innerRef = useRef<HTMLButtonElement | null>(null);
    const widthRef = useRef<number | undefined>(undefined);

    const setRefs = useCallback(
      (el: HTMLButtonElement | null) => {
        innerRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      },
      [ref]
    );

    // Remember the label's width while idle; when loading flips on, the
    // button keeps that width (the label is already gone from the DOM then).
    useLayoutEffect(() => {
      if (!loading) {
        const w = innerRef.current?.getBoundingClientRect().width;
        if (w) widthRef.current = Math.ceil(w);
      }
    });
    const lockedWidth = loading ? widthRef.current : undefined;

    return (
      <motion.button
        ref={setRefs}
        whileTap={{ scale: 0.97 }}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={buttonClass(variant, loading ? `${className ?? ""} disabled:opacity-100` : className)}
        style={lockedWidth ? { ...style, minWidth: lockedWidth } : style}
        {...(props as any)}
      >
        {loading ? <ZenomSpinner size={20} tone={SPINNER_TONE[variant]} /> : children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
