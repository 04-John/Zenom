"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { DELIVERY_KADUNA, formatNaira, startingPrice } from "@/lib/pricing";
import { EXTRA_PERSON, PRICE_ABSTRACT, PRICE_FRAME, PRICE_PORTRAIT, SIZE_INCHES } from "@/lib/zenom-mobile";
import { Cta, LightPage, ListCard, SegSmall, TabHeader, copyText, useLightToast } from "@/components/mobile/ui";
import { CustomerHeaderButtons } from "./CustomerChrome";
import { sizeText, usePrefs } from "./hooks";
import type { RoomInfo } from "./server";

type Kind = "portrait" | "abstract";
const PPI = 2.6; // px per inch on the mini wall (prototype)

/** Pricing tab (/account/pricing): price table with the chosen size drawn to scale on a wall. */
export function PricingScreen({ rooms }: { rooms: RoomInfo[] }) {
  const [kind, setKind] = useState<Kind>("portrait");
  const [size, setSize] = useState(2);
  const { prefs } = usePrefs();
  const { say } = useLightToast();

  const table = kind === "portrait" ? PRICE_PORTRAIT : PRICE_ABSTRACT;
  const room = rooms.find((r) => r.key === (kind === "portrait" ? "portrait" : "geometric")) ?? rooms[0];
  const img = room?.thumbs[0];
  const [pw, ph] = SIZE_INCHES[size];
  const W = pw * PPI + 12;
  const H = ph * PPI + 12;
  const label = kind === "portrait" ? "Portrait" : "Abstract";
  const total = rooms.reduce((n, r) => n + r.count, 0);

  const share = async () => {
    const text = `Zenom Studio · ${label}, ${sizeText(size, "in")}: ${formatNaira(table[size])} (framing +${formatNaira(PRICE_FRAME[size])})`;
    const url = `${window.location.origin}/pricing`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Zenom Studio pricing", text, url });
        return;
      } catch (e) {
        if ((e as Error)?.name === "AbortError") return;
      }
    }
    const ok = await copyText(`${text} ${url}`);
    say(ok ? "Price copied" : "Couldn't copy the price", ok ? undefined : { tone: "error" });
  };

  return (
    <LightPage desktop="column" tabBar className="min-[900px]:pt-24">
      <TabHeader kicker="Zenom Studio · indicative" title="Pricing" right={<CustomerHeaderButtons />} />
      <div className="enter-fade" style={{ padding: "4px 20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "#ffffff", border: "1px solid #E8E2D8", borderRadius: 22, padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              {img && <Image src={img} alt="" width={80} height={100} sizes="40px" style={{ width: 40, height: 50, objectFit: "cover", borderRadius: 8, flex: "none" }} />}
              <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <strong style={{ fontSize: 16 }}>{label}</strong>
                <span style={{ fontSize: 12, color: "#4A433B" }}>Artwork price · per piece</span>
              </span>
            </span>
            <SegSmall
              label="Price list"
              value={kind}
              onChange={setKind}
              items={[
                { key: "portrait", label: "Portrait" },
                { key: "abstract", label: "Abstract" },
              ]}
            />
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }} aria-live="polite">
            <span key={`${kind}-${size}`} className="artin" style={{ fontFamily: "'Instrument Serif', serif", fontSize: 44, lineHeight: 1 }}>
              {formatNaira(table[size])}
            </span>
            <span style={{ fontSize: 13, color: "#4A433B" }}>{sizeText(size, prefs.unit)}</span>
          </div>

          <div
            role="img"
            aria-label={`${sizeText(size, prefs.unit)} drawn to scale on a wall`}
            style={{ position: "relative", height: 150, borderRadius: 16, background: "linear-gradient(180deg, #DDD4C5, #CFC5B4)", overflow: "hidden" }}
          >
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 28, background: "#7E644B" }} />
            <div
              style={{
                position: "absolute",
                boxSizing: "border-box",
                left: `calc(50% - ${Math.round(W / 2)}px)`,
                top: Math.round(110 - H),
                width: Math.round(W),
                height: Math.round(H),
                border: "3px solid #2B211A",
                padding: 3,
                background: "#F2EDE4",
                boxShadow: "0 8px 18px rgba(0,0,0,.25)",
                transition: "all .6s cubic-bezier(.22,1,.36,1)",
              }}
            >
              <div style={{ position: "relative", width: "100%", height: "100%" }}>
                {img && <Image src={img} alt="" fill sizes="110px" style={{ objectFit: "cover" }} />}
              </div>
            </div>
            <span className="kick" style={{ position: "absolute", right: 10, bottom: 36, fontSize: 9, color: "#4A433B" }}>
              To scale
            </span>
          </div>

          <div role="group" aria-label="Size" style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 6 }}>
            {SIZE_INCHES.map((_, i) => (
              <button
                key={i}
                type="button"
                className={"rng" + (size === i ? " on" : "")}
                aria-pressed={size === i}
                aria-label={sizeText(i, prefs.unit)}
                onClick={() => setSize(i)}
                style={{ minHeight: 44, padding: 0, fontSize: prefs.unit === "cm" ? 10 : 12 }}
              >
                {sizeText(i, prefs.unit, false)}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
            {[
              ["Framing", `+${formatNaira(PRICE_FRAME[size])}`],
              ["Kaduna delivery", formatNaira(DELIVERY_KADUNA)],
              ["Deposit", "50%"],
            ].map(([k, v]) => (
              <span key={k} style={{ padding: "10px 12px", borderRadius: 12, background: "#F6F2EB", display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 11, color: "#4A433B" }}>{k}</span>
                <strong style={{ fontSize: 14 }}>{v}</strong>
              </span>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
            <button type="button" className="sec" onClick={share} style={{ height: 46, fontSize: 14 }}>
              Share price
            </button>
            <Cta href={`/commission?start=1&room=${kind === "portrait" ? "portrait" : "geometric"}&size=${size}`} style={{ height: 46, fontSize: 14 }}>
              Commission this
            </Cta>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>The rooms</h2>
          <span style={{ fontSize: 12, color: "#4A433B" }}>{total} works</span>
        </div>
        <ListCard>
          {rooms.map((r) => (
            <Link key={r.key} href={`/commission?start=1&room=${r.key}`} className="mrow">
              {r.thumbs[0] && (
                <Image src={r.thumbs[0]} alt="" width={80} height={100} sizes="40px" style={{ width: 40, height: 50, objectFit: "cover", borderRadius: 8, flex: "none" }} />
              )}
              <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{r.title}</span>
                <span style={{ fontSize: 12, color: "#4A433B" }}>
                  {r.count} works · {r.key === "portrait" ? "charcoal & pencil" : "colour pencil & ink"}
                </span>
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" }}>from {formatNaira(startingPrice(r.key))}</span>
            </Link>
          ))}
        </ListCard>
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "#4A433B" }}>
          Indicative prices per piece. Extra people on a portrait add {formatNaira(EXTRA_PERSON)} each. Outside Kaduna, delivery is quoted on WhatsApp.
        </p>
      </div>
    </LightPage>
  );
}
