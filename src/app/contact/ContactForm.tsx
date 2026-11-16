"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { WHATSAPP_NUMBER } from "@/lib/pricing";
import { CONTACT_EMAIL } from "@/lib/site";

// The message is emailed to the studio inbox by /api/contact. If that fails
// (or email isn't configured yet) the visitor is pointed to WhatsApp instead,
// which is also how every commission starts.
export function ContactForm() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone: phone || undefined, message, website }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      toast("Message sent. We’ll reply by email.");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (err: any) {
      setError(err.message);
      toast(err.message, "error");
    } finally {
      setSending(false);
    }
  }

  const whatsapp = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    ["Hello Zenom Studio,", "", message.trim(), "", `Name: ${name.trim()}`].join("\n")
  )}`;

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-[28px] bg-night-raised p-[clamp(22px,4vw,40px)] min-[700px]:grid-cols-2"
    >
      <h2 className="font-display text-[34px] italic min-[700px]:col-span-2">Or send us an email</h2>
      <input
        className="field bg-night"
        placeholder="Your name"
        required
        minLength={2}
        autoComplete="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="field bg-night"
        type="email"
        placeholder="Your email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="field bg-night min-[700px]:col-span-2"
        type="tel"
        placeholder="Phone (optional)"
        autoComplete="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <textarea
        className="field resize-y bg-night min-[700px]:col-span-2"
        rows={4}
        placeholder="What would you like made?"
        required
        minLength={5}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      {/* Honeypot, hidden from people and assistive tech. */}
      <input
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
      />
      <div className="min-[700px]:col-span-2">
        <Button type="submit" loading={sending}>
          Send message
        </Button>
        {error && (
          <p className="mt-3 text-sm text-ember">
            {error}{" "}
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="underline">
              Message us on WhatsApp
            </a>
          </p>
        )}
        <p className="mt-3 text-xs text-ink-3">
          Goes straight to {CONTACT_EMAIL}. For a faster reply, use WhatsApp.
        </p>
      </div>
    </form>
  );
}
