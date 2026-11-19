"use client";

import { useState } from "react";
import { Cta, Sheet } from "@/components/mobile/ui";
import { feedbackError } from "./useOrderActions";

/**
 * "Ask for changes" on the sketch: a note for Samuel. `onSend` posts it
 * (request-changes) and resolves an error message, or null when it went
 * through (the sheet then clears and closes).
 */
export function SketchChangesSheet({
  open,
  onClose,
  onSend,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  onSend: (feedback: string) => Promise<string | null>;
  busy: boolean;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (busy) return;
    setError(null);
    onClose();
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const invalid = feedbackError(text);
    if (invalid) return setError(invalid);
    setError(null);
    const err = await onSend(text.trim());
    if (err) return setError(err);
    setText("");
    onClose();
  }

  return (
    <Sheet open={open} onClose={close} label="Ask for changes">
      <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <p className="sub" style={{ fontSize: 14 }}>
          Tell Samuel what you&apos;d like changed. He revises the sketch and shares the new one here for you to approve.
        </p>
        <label htmlFor="sketch-changes" className="lbl" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          Your changes
          <textarea
            id="sketch-changes"
            className={"field" + (error ? " err-a" : "")}
            rows={4}
            maxLength={1000}
            placeholder="For example: make the smile a little softer, and add my mum's earrings."
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
          />
        </label>
        {error && (
          <p role="alert" className="errmsg" style={{ margin: 0 }}>
            {error}
          </p>
        )}
        <Cta type="submit" loading={busy}>
          Send to Samuel
        </Cta>
      </form>
    </Sheet>
  );
}
