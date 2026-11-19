"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { art } from "@/lib/catalog";
import { initials, studioWhatsApp } from "@/lib/zenom-mobile";
import { Chip, Cta, Icon, LightPage, Sheet, TabHeader, useLightToast, useLocalState, useShake } from "@/components/mobile/ui";
import { CustomerHeaderButtons, useCustomer } from "./CustomerChrome";
import { SignOutSheet } from "./SignOutSheet";

const RING = 138.2; // 2πr for r = 22

/** Account tab (/account/profile): profile, completion ring, addresses, links, sign out. */
export function ProfileScreen({ account }: { account: { name: string | null; email: string | null; memberSince: string | null } }) {
  const { orders } = useCustomer();
  const { say } = useLightToast();
  const [saved, setSaved] = useLocalState<string[]>("zs.addresses", []);
  const [sheet, setSheet] = useState<"address" | "signout" | null>(null);
  const [draft, setDraft] = useState("");
  const shake = useShake();

  const latest = orders[0];
  const name = account.name || latest?.customerName || "";
  const email = account.email || latest?.customerEmail || "";
  const phone = orders.find((o) => o.customerPhone)?.customerPhone ?? "";
  const pieces = orders.filter((o) => o.status !== "CANCELLED").length;

  // Addresses used on orders (newest first), then ones saved on this phone.
  const orderAddresses = useMemo(() => {
    const seen = new Map<string, string>();
    for (const o of orders) if (o.deliveryAddress && !seen.has(o.deliveryAddress)) seen.set(o.deliveryAddress, o.orderNumber);
    return Array.from(seen, ([address, ref]) => ({ address, ref }));
  }, [orders]);
  const localAddresses = saved.filter((a) => !orderAddresses.some((x) => x.address === a));
  const mainAddress = orderAddresses[0]?.address ?? localAddresses[0] ?? "";

  const checks: { label: string; done: boolean; cta: ReactNode }[] = [
    { label: "Your details", done: !!name && !!email, cta: <Link href="/commission?start=1" className="lnk" style={{ padding: "12px 2px" }}>Add →</Link> },
    { label: "WhatsApp number", done: !!phone, cta: <Link href="/commission?start=1" className="lnk" style={{ padding: "12px 2px" }}>Add →</Link> },
    {
      label: "Delivery address",
      done: !!mainAddress,
      cta: (
        <button type="button" className="lnk" onClick={() => setSheet("address")} style={{ padding: "12px 2px" }}>
          Add →
        </button>
      ),
    },
    { label: "First commission", done: orders.length > 0, cta: <Link href="/commission?start=1" className="lnk" style={{ padding: "12px 2px" }}>Start →</Link> },
  ];
  const pct = Math.round((checks.filter((c) => c.done).length / checks.length) * 100);

  // Animate the ring from empty once mounted.
  const [ring, setRing] = useState(RING);
  useEffect(() => {
    const id = requestAnimationFrame(() => setRing(RING * (1 - pct / 100)));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  const saveAddress = () => {
    const a = draft.trim();
    if (a.length < 5) {
      shake.shake();
      return;
    }
    setSaved((prev) => [a, ...prev.filter((x) => x !== a)].slice(0, 5));
    setDraft("");
    shake.clear();
    setSheet(null);
    say("Address saved on this phone");
  };

  return (
    <LightPage desktop="column" tabBar className="min-[900px]:pt-24">
      <TabHeader kicker={name || email || "Your studio"} title="Account" right={<CustomerHeaderButtons />} />
      <div className="enter-fade" style={{ padding: "4px 20px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ padding: 16, borderRadius: 20, background: "#12100E", color: "#ffffff", display: "flex", alignItems: "center", gap: 14, position: "relative", overflow: "hidden" }}>
          <span aria-hidden="true" style={{ position: "absolute", right: -20, top: -30, width: 140, height: 175, opacity: 0.22, transform: "rotate(8deg)" }}>
            <Image src={art("w07")} alt="" fill sizes="140px" style={{ objectFit: "cover" }} />
          </span>
          <span aria-hidden="true" style={{ width: 48, height: 48, borderRadius: 14, background: "#E58A52", color: "#1A1714", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 17, position: "relative", flex: "none" }}>
            {initials(name || email)}
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: 2, position: "relative", minWidth: 0 }}>
            <strong style={{ fontSize: 17, overflowWrap: "anywhere" }}>{name || email || "Your account"}</strong>
            <span style={{ fontSize: 13, color: "#C9C1B5" }}>
              {pieces > 0 ? `Collector · ${pieces} ${pieces === 1 ? "commission" : "commissions"}` : account.memberSince ? `Member since ${account.memberSince}` : "Collector"}
            </span>
          </span>
        </div>

        <section className="grp" aria-labelledby="acct-details">
          <h2 className="gh" id="acct-details">
            Your details
          </h2>
          <div className="gl">
            <dl style={{ margin: 0 }}>
              <Detail k="Name" v={name} />
              <Detail k="WhatsApp" v={phone} />
              <Detail k="Email" v={email} />
              <Detail k="Address" v={mainAddress} last />
            </dl>
            <p style={{ margin: 0, padding: "10px 0", borderTop: "1px solid #EFEAE2", fontSize: 12, lineHeight: 1.5, color: "#4A433B" }}>
              Your WhatsApp number and address come from your latest request.
            </p>
            <a
              href={studioWhatsApp("Hello Samuel, please update my details: ")}
              target="_blank"
              rel="noopener noreferrer"
              className="glink"
              style={{ color: "#9A4A1F" }}
            >
              Update them on WhatsApp <Icon name="external" size={16} stroke={2} />
            </a>
          </div>
        </section>

        <div style={{ background: "#ffffff", border: "1px solid #E8E2D8", borderRadius: 18, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 6 }}>
            <span style={{ position: "relative", width: 52, height: 52, flex: "none" }}>
              <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="26" cy="26" r="22" fill="none" stroke="#EFEAE2" strokeWidth="5" />
                <circle className="ringp" cx="26" cy="26" r="22" fill="none" stroke="#E58A52" strokeWidth="5" strokeLinecap="round" strokeDasharray={RING} strokeDashoffset={ring} />
              </svg>
              <span aria-hidden="true" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                {pct}%
              </span>
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <strong style={{ fontSize: 15 }}>Profile {pct}% complete</strong>
              <span style={{ fontSize: 12, color: "#4A433B" }}>Finish these so Samuel can deliver faster.</span>
            </span>
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {checks.map((c) => (
              <li key={c.label} className="pci" style={{ minHeight: 44 }}>
                <span className={"pcd" + (c.done ? " on" : "")}>
                  {c.done && <Icon name="check" size={12} stroke={3.5} style={{ color: "#ffffff" }} />}
                </span>
                <span style={{ flex: 1, fontSize: 14 }}>
                  {c.label}
                  <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{c.done ? ", done" : ", to do"}</span>
                </span>
                {c.done ? <span style={{ fontSize: 14, fontWeight: 600, color: "#4A433B" }}>Done</span> : c.cta}
              </li>
            ))}
          </ul>
        </div>

        <section className="grp" aria-labelledby="acct-addresses">
          <h2 className="gh" id="acct-addresses">
            Delivery addresses
          </h2>
          <div className="gl">
            {orderAddresses.map((a, i) => (
              <div key={a.address} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "12px 0", borderTop: i ? "1px solid #EFEAE2" : 0 }}>
                <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <strong style={{ fontSize: 14, overflowWrap: "anywhere" }}>{a.address}</strong>
                  <span style={{ fontSize: 12, color: "#4A433B" }}>{i === 0 ? "Used on your last order" : `Used on ${a.ref}`}</span>
                </span>
                {i === 0 && (
                  <Chip bg="#F6F2EB" fg="#4A433B">
                    Default
                  </Chip>
                )}
              </div>
            ))}
            {localAddresses.map((a, i) => (
              <div key={a} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "12px 0", borderTop: i || orderAddresses.length ? "1px solid #EFEAE2" : 0 }}>
                <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <strong style={{ fontSize: 14, overflowWrap: "anywhere" }}>{a}</strong>
                  <span style={{ fontSize: 12, color: "#4A433B" }}>Saved on this phone</span>
                </span>
                <button type="button" className="lnk" aria-label={`Remove ${a}`} onClick={() => setSaved((prev) => prev.filter((x) => x !== a))} style={{ minHeight: 44 }}>
                  Remove
                </button>
              </div>
            ))}
            {orderAddresses.length + localAddresses.length === 0 && (
              <p style={{ margin: 0, padding: "12px 0", fontSize: 14, color: "#4A433B" }}>No address yet. Add one with your next request.</p>
            )}
            <button type="button" className="glink" onClick={() => setSheet("address")}>
              Add an address <Icon name="plus" size={16} stroke={2} />
            </button>
          </div>
        </section>

        <section className="grp" aria-labelledby="acct-more">
          <h2 className="gh" id="acct-more">
            More
          </h2>
          <div className="gl">
            <Link href="/account/settings" className="glink" style={{ borderTop: 0, color: "#1A1714" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon name="settings" size={18} style={{ color: "#9A4A1F" }} />
                Settings
              </span>
              <Icon name="chevronRight" size={16} stroke={2} />
            </Link>
            <Link href="/account/help" className="glink" style={{ color: "#1A1714" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon name="help" size={18} style={{ color: "#9A4A1F" }} />
                Help &amp; support
              </span>
              <Icon name="chevronRight" size={16} stroke={2} />
            </Link>
          </div>
        </section>

        <button type="button" className="sec danger" onClick={() => setSheet("signout")}>
          Sign out
        </button>
      </div>

      <Sheet open={sheet === "address"} onClose={() => setSheet(null)} label="Add an address">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            saveAddress();
          }}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <label className="lbl" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            Address
            <input
              className={"field " + shake.cls}
              type="text"
              autoComplete="street-address"
              placeholder="Street, area, city"
              value={draft}
              aria-invalid={shake.error || undefined}
              aria-describedby={shake.error ? "addr-err" : undefined}
              onChange={(e) => {
                setDraft(e.target.value);
                if (shake.error) shake.clear();
              }}
            />
            {shake.error && (
              <span id="addr-err" className="errmsg" role="alert">
                Add a street, area and city.
              </span>
            )}
          </label>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "#4A433B" }}>
            Saved on this phone only. Add it to your next request so Samuel has it for delivery.
          </p>
          <Cta type="submit">Save address</Cta>
        </form>
      </Sheet>

      <SignOutSheet open={sheet === "signout"} onClose={() => setSheet(null)} name={name || email || "Your account"} detail={[phone, "Collector"].filter(Boolean).join(" · ")} />
    </LightPage>
  );
}

function Detail({ k, v, last }: { k: string; v: string; last?: boolean }) {
  return (
    <div className="kv" style={last ? { borderBottom: 0 } : undefined}>
      <dt>{k}</dt>
      <dd style={v ? undefined : { color: "#6E665C", fontWeight: 500 }}>{v || "Not added yet"}</dd>
    </div>
  );
}
