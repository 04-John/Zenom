"use client";

import Link from "next/link";
import { Cta, Icon, copyText, useLightToast } from "@/components/mobile/ui";
import { useStudioInfo } from "@/components/StudioInfoProvider";
import { useReducedMotion } from "../hooks";

export type CommissionResult = { id: string; orderNumber: string; whatsappUrl: string; total: number; deposit: number };

const CONF_COLORS = ["#E58A52", "#9A4A1F", "#1A1714", "#E58A52", "#DDD4C5"];
const CONFETTI = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  const r = 70 + (i % 3) * 18;
  return {
    width: i % 2 ? 6 : 8,
    height: i % 2 ? 10 : 6,
    background: CONF_COLORS[i % 5],
    "--dx": `${Math.round(Math.cos(a) * r)}px`,
    "--dy": `${Math.round(Math.sin(a) * r)}px`,
    "--r": `${i * 47}deg`,
  } as React.CSSProperties;
});

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Request received: ripple rings + confetti, ZS-#### with Copy, 5-step timeline, next actions. */
export function CommissionDone({
  result,
  phone,
  framed,
  signedIn,
  email,
  onNew,
}: {
  result: CommissionResult;
  phone: string;
  framed: boolean;
  signedIn: boolean;
  /** the email given on the form (guests): their request joins an account made with it */
  email: string;
  onNew: () => void;
}) {
  const { say } = useLightToast();
  const reduced = useReducedMotion();
  const { quoteTurnaround } = useStudioInfo();

  const timeline: [string, string, string, 0 | 1 | 2][] = [
    ["Received", "Your request is in", "Now", 2],
    ["Reviewing", "Samuel looks at your photo and size", "Next", 1],
    ["Quote sent", signedIn ? "On WhatsApp and in your orders" : "On WhatsApp", cap(quoteTurnaround), 0],
    ["Deposit & drawing", "After you accept", "", 0],
    ["Delivered", framed ? "Framed, to your door" : "To your door", "", 0],
  ];

  return (
    <section className="enter-fade" aria-labelledby="done-title" style={{ minHeight: "100dvh", padding: "calc(var(--m-top) + 48px) 20px calc(40px + var(--m-bottom))", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 22, background: "#ffffff" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
        <div style={{ position: "relative", width: 96, height: 96 }} aria-hidden="true">
          <span className="ring" />
          <span className="ring" style={{ animationDelay: ".7s" }} />
          {!reduced && CONFETTI.map((style, i) => <span key={i} className="conf" style={style} />)}
          <span className="badge" style={{ position: "absolute", inset: 14, borderRadius: "50%", background: "#E58A52", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 30px rgba(229,138,82,.45)" }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#1A1714" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path className="chk" d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
        </div>
        <h1 id="done-title" className="h1" style={{ fontSize: 36 }}>
          Request received
        </h1>
        <p className="sub" style={{ maxWidth: 320 }}>
          {signedIn ? "Samuel will message you on WhatsApp" : "Samuel will reply on WhatsApp"}
          {phone ? (
            <>
              {" "}
              at <strong style={{ color: "#1A1714" }}>{phone}</strong>
            </>
          ) : null}{" "}
          with your quote.
        </p>
      </div>

      <div style={{ alignSelf: "center", display: "flex", alignItems: "center", gap: 10, padding: "4px 4px 4px 14px", borderRadius: 999, border: "1px solid #E8E2D8", background: "#ffffff" }}>
        <span style={{ fontSize: 13, color: "#4A433B" }}>Ref</span>
        <strong style={{ fontSize: 16 }}>{result.orderNumber}</strong>
        <button
          type="button"
          onClick={async () => say((await copyText(result.orderNumber)) ? "Reference copied" : `Reference: ${result.orderNumber}`)}
          aria-label={`Copy reference ${result.orderNumber}`}
          style={{ height: 44, padding: "0 14px", borderRadius: 999, border: 0, background: "#F6F2EB", font: "600 13px 'Instrument Sans', sans-serif", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: "#1A1714" }}
        >
          <Icon name="copy" size={14} stroke={2} />
          Copy
        </button>
      </div>

      <ol style={{ margin: 0, padding: 16, listStyle: "none", border: "1px solid #E8E2D8", borderRadius: 18, display: "flex", flexDirection: "column", gap: 14 }}>
        {timeline.map(([title, body, when, state], i) => (
          <li key={title} style={{ display: "flex", gap: 12, alignItems: "flex-start", animation: "m-rise .5s cubic-bezier(.22,1,.36,1) both", animationDelay: `${0.5 + i * 0.12}s` }}>
            <span
              className={state === 1 ? "pulse" : undefined}
              aria-hidden="true"
              style={{
                width: 18,
                height: 18,
                flex: "none",
                boxSizing: "border-box",
                borderRadius: "50%",
                marginTop: 1,
                ...(state === 2 ? { background: "#E58A52", border: 0 } : state === 1 ? { border: "5px solid #E58A52", background: "#ffffff" } : { border: "2px solid #CFC8BD" }),
              }}
            />
            <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: state ? "#1A1714" : "#4A433B" }}>{title}</span>
              <span style={{ fontSize: 12, color: "#4A433B" }}>{body}</span>
            </span>
            {when && <span style={{ fontSize: 12, fontWeight: 600, color: state === 2 ? "#9A4A1F" : "#4A433B" }}>{when}</span>}
          </li>
        ))}
      </ol>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {signedIn ? (
          <>
            <Cta href={`/account/orders?new=${encodeURIComponent(result.id)}`} arrow>
              Go to my orders
            </Cta>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
              <a href={result.whatsappUrl} target="_blank" rel="noopener noreferrer" className="sec" style={{ color: "#1A1714" }}>
                <Icon name="whatsapp" size={16} stroke={2} />
                Message Samuel
              </a>
              <button type="button" className="sec" onClick={onNew}>
                New request
              </button>
            </div>
          </>
        ) : (
          <>
            <a href={result.whatsappUrl} target="_blank" rel="noopener noreferrer" className="cta" style={{ color: "#ffffff" }}>
              Message Samuel on WhatsApp
            </a>
            {email ? (
              <>
                <Link href="/signup" className="sec" style={{ color: "#1A1714" }}>
                  Create an account to track it
                </Link>
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "#4A433B", textAlign: "center", overflowWrap: "anywhere" }}>
                  Sign up or sign in with {email} and this request appears in your orders. Updates also arrive by email.
                </p>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "#4A433B", textAlign: "center" }}>
                Samuel will reply on WhatsApp. Add your email next time to track requests in your account.
              </p>
            )}
            <button type="button" className="lnk" onClick={onNew} style={{ alignSelf: "center", minHeight: 44 }}>
              Start a new request
            </button>
          </>
        )}
      </div>
    </section>
  );
}
