"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { art } from "@/lib/catalog";
import { WHATSAPP_NUMBER } from "@/lib/pricing";
import { DRAWING_TIME, QUOTE_TURNAROUND, studioWhatsApp } from "@/lib/zenom-mobile";
import { Icon, LightPage } from "@/components/mobile/ui";
import { prettyPhone } from "./model";
import { SubHeader } from "./SubHeader";

// The prototype's TOPICS copy. Two answers are adjusted to what the app does
// today: there is no in-app transfer button or proof upload (that happens on
// WhatsApp), and the quote time uses the studio's QUOTE_TURNAROUND.
const TOPICS: [string, [string, string][]][] = [
  [
    "Commissioning",
    [
      ["How do I commission a piece?", `Tap Start a commission, pick a room and size, add your photo and details. You get a reference number straight away and Samuel sends your quote on WhatsApp ${QUOTE_TURNAROUND}.`],
      ["Can I send my own photo?", "Yes. For portraits, a clear, well-lit photo works best. You can also send it later on WhatsApp."],
      ["How long does a piece take?", `Most pieces take 10 to 21 days after the deposit, depending on size and detail. Once drawing starts, expect ${DRAWING_TIME}.`],
    ],
  ],
  [
    "Payments",
    [
      ["When do I pay?", "Nothing is charged until you accept the quote. A 50% non-refundable deposit starts the work; the balance is due on delivery."],
      ["How do I pay the deposit?", "By bank transfer, using your order reference. Then tap I've made the transfer on the order to tell Samuel on WhatsApp, and send proof there if you have it."],
      ["Is the deposit refundable?", "No. Samuel starts sketching as soon as it clears, so the deposit is non-refundable."],
    ],
  ],
  [
    "Sizes & framing",
    [
      ["Which size should I choose?", "Open Pricing to see each size to scale on a wall. 16×20 in is the most popular for living rooms."],
      ["What does framing include?", "A dark wood frame with a cream mat, ready to hang."],
    ],
  ],
  [
    "Delivery",
    [
      ["Do you deliver outside Kaduna?", "Yes. Delivery outside Kaduna is quoted on WhatsApp with your order."],
      ["How is the piece packed?", "Wrapped, corner-protected and boxed. Framed pieces travel with the glass taped."],
    ],
  ],
];

/** Help (/account/help): search, topic cards, FAQ accordion, message Samuel. */
export function HelpScreen() {
  const [topic, setTopic] = useState(0);
  const [open, setOpen] = useState<string | null>(TOPICS[0][1][0][0]);
  const [q, setQ] = useState("");
  const uid = useId();

  const needle = q.trim().toLowerCase();
  const faqs: [string, string][] = needle
    ? TOPICS.flatMap(([, list]) => list).filter(([qq, a]) => (qq + " " + a).toLowerCase().includes(needle))
    : TOPICS[topic][1];
  const heading = needle ? `Results for “${q.trim()}”` : TOPICS[topic][0];

  return (
    <LightPage desktop="column" tabBar className="min-[900px]:pt-24">
      <div className="enter-fwd" style={{ padding: "0 20px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
        <SubHeader href="/account/profile" back="Account" title="Help" />

        <div style={{ position: "relative", overflow: "hidden", padding: 18, borderRadius: 22, background: "#12100E", color: "#ffffff", display: "flex", flexDirection: "column", gap: 12 }}>
          <span aria-hidden="true" style={{ position: "absolute", right: -30, top: -20, width: 150, height: 188, opacity: 0.2, transform: "rotate(-8deg)" }}>
            <Image src={art("g01")} alt="" fill sizes="150px" style={{ objectFit: "cover" }} />
          </span>
          <h2 style={{ margin: 0, fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400, fontSize: 28, position: "relative" }}>How can we help?</h2>
          <label style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, height: 46, padding: "0 14px", borderRadius: 999, background: "#ffffff", color: "#1A1714" }}>
            <Icon name="search" size={16} stroke={2} style={{ color: "#4A433B", flex: "none" }} />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search, e.g. deposit, framing"
              aria-label="Search help"
              style={{ flex: 1, minWidth: 0, border: 0, outline: "none", background: "none", font: "400 16px 'Instrument Sans', sans-serif", color: "#1A1714" }}
            />
          </label>
        </div>

        {!needle && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
            {TOPICS.map(([title, list], i) => (
              <button
                key={title}
                type="button"
                className={"topic" + (topic === i ? " on" : "")}
                aria-pressed={topic === i}
                onClick={() => {
                  setTopic(i);
                  setOpen(list[0][0]);
                }}
              >
                <span aria-hidden="true" style={{ width: 32, height: 32, borderRadius: 10, background: "#FBEBDD", display: "flex", alignItems: "center", justifyContent: "center", color: "#9A4A1F", fontWeight: 700 }}>
                  {i + 1}
                </span>
                <strong style={{ fontSize: 14 }}>{title}</strong>
                <span style={{ fontSize: 12, color: "#4A433B" }}>{list.length} articles</span>
              </button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{heading}</h2>
          <span style={{ fontSize: 12, color: "#4A433B", whiteSpace: "nowrap" }} aria-live="polite">
            {faqs.length} {faqs.length === 1 ? "question" : "questions"}
          </span>
        </div>

        {faqs.length > 0 ? (
          <div key={heading} style={{ background: "#ffffff", border: "1px solid #E8E2D8", borderRadius: 18, overflow: "hidden" }}>
            {faqs.map(([question, answer], i) => {
              const isOpen = open === question;
              const panel = `${uid}-faq-${i}`;
              return (
                <div key={question} className="faq">
                  <h3 style={{ margin: 0 }}>
                    <button type="button" className="faqq" aria-expanded={isOpen} aria-controls={panel} onClick={() => setOpen(isOpen ? null : question)}>
                      <span style={{ flex: 1 }}>{question}</span>
                      <Icon name="chevronDown" size={16} stroke={2} className={"chev" + (isOpen ? " up" : "")} />
                    </button>
                  </h3>
                  {isOpen && (
                    <div id={panel} className="faqa">
                      <span>{answer}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="sub" role="status" style={{ textAlign: "center", padding: "8px 0" }}>
            Nothing found. Ask Samuel directly below.
          </p>
        )}

        <div style={{ padding: 16, borderRadius: 20, background: "#ffffff", border: "1px solid #E8E2D8", display: "flex", flexDirection: "column", gap: 12 }}>
          <span className="kick" style={{ color: "#9A4A1F" }}>
            Your artist
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span aria-hidden="true" style={{ width: 40, height: 40, borderRadius: "50%", background: "#E58A52", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flex: "none" }}>
              S
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <strong style={{ fontSize: 15 }}>Samuel · Zenom Studio</strong>
              <span style={{ fontSize: 12, color: "#4A433B" }}>{prettyPhone(WHATSAPP_NUMBER)} · replies within a day</span>
            </span>
          </span>
          <a href={studioWhatsApp("Hello Samuel, I have a question.")} target="_blank" rel="noopener noreferrer" className="cta" style={{ height: 50, fontSize: 15 }}>
            Message Samuel on WhatsApp
          </a>
        </div>
      </div>
    </LightPage>
  );
}
