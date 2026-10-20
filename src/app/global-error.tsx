"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { ZenomMark } from "@/components/brand/ZenomMark";

// Replaces the root layout when it throws, so no app stylesheet or fonts are
// guaranteed here: styles are inline and use the brand colours directly.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#12100E",
          color: "#EFE9DF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: 24,
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
        }}
      >
        <main>
          <div aria-hidden style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <ZenomMark size={64} title="" />
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: "ui-monospace, Menlo, Consolas, monospace",
              fontSize: 11,
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: "#E58A52",
            }}
          >
            Zenom Studio
          </p>
          <h1
            style={{
              margin: "16px 0 0",
              fontFamily: "'Instrument Serif', Georgia, 'Times New Roman', serif",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "clamp(44px, 8vw, 96px)",
              lineHeight: 0.95,
            }}
          >
            Something went wrong.
          </h1>
          <p style={{ margin: "20px auto 0", maxWidth: 380, fontSize: 15, lineHeight: 1.7, color: "#A39B90" }}>
            We hit an unexpected error. Please try again, and if it keeps happening, message us on WhatsApp.
          </p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: 28,
              minHeight: 44,
              padding: "12px 24px",
              borderRadius: 999,
              border: 0,
              background: "#EFE9DF",
              color: "#12100E",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
