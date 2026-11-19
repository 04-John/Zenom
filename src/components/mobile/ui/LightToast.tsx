"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

type SayOptions = { undo?: () => void; tone?: "error" };
type Ctx = { say: (text: string, opts?: SayOptions) => void };

const LightToastContext = createContext<Ctx | null>(null);

// The light app's toast: an ink pill that springs up above the tab bar for
// 2s (3.5s when it offers Undo). Mounted once in the root layout.
export function LightToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ text: string; on: boolean; undo?: () => void; tone?: "error" }>({ text: "", on: false });
  const [mounted, setMounted] = useState(false);
  const timer = useRef<number>();

  useEffect(() => {
    setMounted(true);
    return () => window.clearTimeout(timer.current);
  }, []);

  const say = useCallback((text: string, opts?: SayOptions) => {
    window.clearTimeout(timer.current);
    setState({ text, on: true, undo: opts?.undo, tone: opts?.tone });
    timer.current = window.setTimeout(() => setState((s) => ({ ...s, on: false, undo: undefined })), opts?.undo ? 3500 : opts?.tone === "error" ? 3200 : 2000);
  }, []);

  return (
    <LightToastContext.Provider value={{ say }}>
      {children}
      {mounted &&
        createPortal(
          <div className="m">
            <div className={"toast" + (state.on ? " on" : "")} role="status" aria-live="polite" style={state.tone === "error" ? { background: "#B42318" } : undefined}>
              {state.tone !== "error" && <Icon name="check" size={16} stroke={3} style={{ color: "#E58A52" }} />}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{state.text}</span>
              {state.undo && state.on && (
                <button
                  type="button"
                  className="undo"
                  onClick={() => {
                    state.undo?.();
                    window.clearTimeout(timer.current);
                    setState((s) => ({ ...s, on: false, undo: undefined }));
                  }}
                >
                  Undo
                </button>
              )}
            </div>
          </div>,
          document.body
        )}
    </LightToastContext.Provider>
  );
}

export function useLightToast(): Ctx {
  const ctx = useContext(LightToastContext);
  if (!ctx) throw new Error("useLightToast must be used within LightToastProvider");
  return ctx;
}
