"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { WHATSAPP_NUMBER } from "@/lib/pricing";

// There is no message backend: the form composes a WhatsApp message and hands
// it off to wa.me, which is also how every commission starts. The toast only
// shows once that hand-off has actually been opened.
export function ContactForm() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = [
      "Hello Zenom Studio,",
      "",
      message.trim(),
      "",
      `Name: ${name.trim()}`,
      `Phone or email: ${contact.trim()}`,
    ].join("\n");
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    // No "noopener" feature here: it makes window.open always return null, which
    // would hide whether the pop-up was blocked. wa.me is a trusted target.
    const win = window.open(url, "_blank");
    if (!win) {
      toast("Your browser blocked WhatsApp. Allow pop-ups and try again.", "error");
      return;
    }
    win.opener = null;
    toast("Message sent. We’ll be in touch.");
    setName("");
    setContact("");
    setMessage("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-[28px] bg-night-raised p-[clamp(22px,4vw,40px)] min-[700px]:grid-cols-2"
    >
      <h2 className="font-display text-[34px] italic min-[700px]:col-span-2">Or leave a message</h2>
      <input
        className="field bg-night"
        placeholder="Your name"
        required
        autoComplete="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="field bg-night"
        placeholder="Phone or email"
        required
        value={contact}
        onChange={(e) => setContact(e.target.value)}
      />
      <textarea
        className="field resize-y bg-night min-[700px]:col-span-2"
        rows={4}
        placeholder="What would you like made?"
        required
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <div className="min-[700px]:col-span-2">
        <Button type="submit">Send message</Button>
        <p className="mt-3 text-xs text-ink-3">Opens WhatsApp with your message ready to send.</p>
      </div>
    </form>
  );
}
