"use client";

import { useState } from "react";
import { ChangePasswordSheet, Chip, Icon, LightPage, SegSmall, SwitchRow } from "@/components/mobile/ui";
import { useCustomer } from "./CustomerChrome";
import { usePrefs, type Prefs } from "./hooks";
import { SignOutSheet } from "./SignOutSheet";
import { SubHeader } from "./SubHeader";

const SOON = (
  <Chip bg="#EFEAE2" fg="#4A433B">
    Coming soon
  </Chip>
);

/** Settings (/account/settings): display preferences kept on this device, order emails, password, sign out. */
export function SettingsScreen() {
  const { user, orders } = useCustomer();
  const { prefs, setPrefs } = usePrefs();
  const [signout, setSignout] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const phone = orders.find((o) => o.customerPhone)?.customerPhone ?? "";
  const name = user.name || orders[0]?.customerName || user.email || "Your account";
  const set = <K extends keyof Prefs>(k: K, v: Prefs[K]) => setPrefs((p) => ({ ...p, [k]: v }));

  return (
    <LightPage desktop="column" tabBar className="min-[900px]:pt-24">
      <div className="enter-fwd" style={{ padding: "0 20px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
        <SubHeader href="/account/profile" back="Account" title="Settings" />

        <section className="grp" aria-labelledby="set-prefs">
          <h2 className="gh" id="set-prefs">
            Preferences
          </h2>
          <div className="gl">
            <div className="swrow">
              <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <strong style={{ fontSize: 14 }}>Currency</strong>
                <span style={{ fontSize: 12, color: "#4A433B" }}>USD display coming soon</span>
              </span>
              <span className="sg2" role="group" aria-label="Currency">
                <button type="button" className="sg on" aria-pressed="true">
                  ₦ NGN
                </button>
                <button type="button" className="sg" disabled aria-disabled="true" title="Coming soon" style={{ opacity: 0.45, cursor: "default" }}>
                  $ USD
                </button>
              </span>
            </div>
            <div className="swrow" style={{ borderBottom: 0 }}>
              <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <strong style={{ fontSize: 14 }}>Sizes in</strong>
                <span style={{ fontSize: 12, color: "#4A433B" }}>Used on the Pricing tab</span>
              </span>
              <SegSmall
                label="Sizes in"
                value={prefs.unit}
                onChange={(v) => set("unit", v)}
                items={[
                  { key: "in", label: "Inches" },
                  { key: "cm", label: "cm" },
                ]}
              />
            </div>
          </div>
          <p style={{ margin: 0, padding: "0 4px", fontSize: 12, lineHeight: 1.5, color: "#4A433B" }}>
            Saved on this phone. Prices are always quoted and paid in naira, and orders are made in inches.
          </p>
        </section>

        <section className="grp" aria-labelledby="set-updates">
          <h2 className="gh" id="set-updates">
            Updates
          </h2>
          <div className="gl">
            {/* Order emails are sent by the studio for every step (see PATCH /api/orders/[id]); they are not optional. */}
            <div className="swrow">
              <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <strong style={{ fontSize: 15 }}>Order updates by email</strong>
                <span style={{ fontSize: 12, color: "#4A433B", overflowWrap: "anywhere" }}>
                  {user.email ? `Quote, deposit, ready and delivered, sent to ${user.email}` : "Quote, deposit, ready and delivered"}
                </span>
              </span>
              <Chip bg="#E3EFE4" fg="#1F4D24">
                Always on
              </Chip>
            </div>
            <SwitchRow title="WhatsApp updates" body={phone ? `Sent to ${phone}` : "To the number on your request"} checked={prefs.whatsapp} onChange={(v) => set("whatsapp", v)} />
            <SwitchRow title="New work from Samuel" body="One message a month" checked={prefs.newwork} onChange={(v) => set("newwork", v)} last />
          </div>
          <p style={{ margin: 0, padding: "0 4px", fontSize: 12, lineHeight: 1.5, color: "#4A433B" }}>
            The two switches are saved on this phone for now. Samuel still confirms every step of an order with you on WhatsApp.
          </p>
        </section>

        <section className="grp" aria-labelledby="set-security">
          <h2 className="gh" id="set-security">
            Security
          </h2>
          <div className="gl">
            <button type="button" className="glink" onClick={() => setPwOpen(true)} style={{ borderTop: 0 }}>
              Change password
              <Icon name="chevronRight" size={18} stroke={2} />
            </button>
            <div className="swrow" style={{ borderBottom: 0 }}>
              <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <strong style={{ fontSize: 14 }}>Two-step verification</strong>
                <span style={{ fontSize: 12, color: "#4A433B" }}>A code by WhatsApp when you sign in</span>
              </span>
              {SOON}
            </div>
          </div>
        </section>

        <button type="button" className="sec danger" onClick={() => setSignout(true)}>
          Sign out
        </button>
      </div>
      <ChangePasswordSheet open={pwOpen} onClose={() => setPwOpen(false)} />
      <SignOutSheet open={signout} onClose={() => setSignout(false)} name={name} detail={[phone, "Collector"].filter(Boolean).join(" · ")} />
    </LightPage>
  );
}
