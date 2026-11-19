"use client";

import Image from "next/image";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { ChangePasswordSheet, Cta, Icon, LightPage, SwitchRow, useLightToast } from "@/components/mobile/ui";
import { art } from "@/lib/catalog";
import { DELIVERY_KADUNA, DEPOSIT_RATE, PRICE_PER_ADDITIONAL_SUBJECT, formatNaira } from "@/lib/pricing";
import { PRICE_ABSTRACT, PRICE_FRAME, PRICE_PORTRAIT, SIZE_LABELS, initials, kfmt } from "@/lib/zenom-mobile";
import { ConfirmSheet } from "./ConfirmSheet";
import { StudioHeader } from "./StudioHeader";
import { useStudio } from "./StudioMobileProvider";
import { useStudioSettings, type StudioSettingsField, type StudioSettingsValues } from "./useStudioSettings";

const cell: React.CSSProperties = { padding: "9px 6px 9px 0", textAlign: "left", verticalAlign: "top" };
const head: React.CSSProperties = { ...cell, padding: "12px 6px 6px 0", fontSize: 11, fontWeight: 700, color: "#4A433B" };

// Studio tab of the light studio app: profile, live site, payments & timings
// (bank details, quote and drawing times; PUT /api/studio/settings), price
// list (read from pricing.ts), alert switches (stored in this browser) and
// sign out.
export function SettingsMobile({ name, email, settings }: { name: string; email: string; settings: StudioSettingsValues }) {
  const { prefs, setPref } = useStudio();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const first = name.trim().split(/\s+/)[0] || "Samuel";

  return (
    <LightPage desktop="hide" tabBar>
      <StudioHeader kicker={`Signed in as ${first}`} title="Studio" />
      <div className="enter-fade" style={{ padding: "4px 20px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ padding: 16, borderRadius: 20, background: "#12100E", color: "#ffffff", display: "flex", alignItems: "center", gap: 14, position: "relative", overflow: "hidden" }}>
          <span aria-hidden="true" style={{ position: "absolute", right: -24, top: -30, width: 140, height: 175, opacity: 0.2, transform: "rotate(8deg)" }}>
            <Image src={art("g01")} alt="" fill sizes="140px" style={{ objectFit: "cover" }} />
          </span>
          <span aria-hidden="true" style={{ width: 48, height: 48, flex: "none", borderRadius: 14, background: "#E58A52", color: "#1A1714", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, position: "relative" }}>
            {initials(name)}
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: 2, position: "relative", minWidth: 0 }}>
            <strong style={{ fontSize: 17 }}>{name} · Zenom Studio</strong>
            <span style={{ fontSize: 13, color: "#C9C1B5", overflowWrap: "anywhere" }}>Admin · {email}</span>
          </span>
        </div>

        <a href="/" target="_blank" rel="noopener noreferrer" className="sec" style={{ color: "#1A1714" }}>
          <Icon name="external" size={16} stroke={2} />
          View the live site
          <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>(opens in a new tab)</span>
        </a>

        <PaymentsForm initial={settings} />

        <div className="grp">
          <h2 className="gh">Price list</h2>
          <div className="gl">
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: 13 }}>
              <caption style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Prices by size, in naira</caption>
              <thead>
                <tr>
                  <th scope="col" style={head}>Size</th>
                  <th scope="col" style={head}>Portrait</th>
                  <th scope="col" style={head}>Abstract</th>
                  <th scope="col" style={head}>Frame</th>
                </tr>
              </thead>
              <tbody>
                {SIZE_LABELS.map((s, i) => (
                  <tr key={s} style={{ borderTop: "1px solid #EFEAE2" }}>
                    <th scope="row" style={{ ...cell, fontWeight: 700 }}>
                      {s}
                    </th>
                    <td style={cell}>{kfmt(PRICE_PORTRAIT[i])}</td>
                    <td style={cell}>{kfmt(PRICE_ABSTRACT[i])}</td>
                    <td style={cell}>{kfmt(PRICE_FRAME[i])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ margin: 0, padding: "10px 0", borderTop: "1px solid #EFEAE2", fontSize: 12, color: "#4A433B" }}>
              Extra person {formatNaira(PRICE_PER_ADDITIONAL_SUBJECT)} · Kaduna delivery {formatNaira(DELIVERY_KADUNA)} · {Math.round(DEPOSIT_RATE * 100)}% deposit
            </p>
            <p style={{ margin: 0, padding: "10px 0 12px", borderTop: "1px solid #EFEAE2", fontSize: 12, color: "#4A433B" }}>
              Prices are set in the site&rsquo;s code, so changing them is a job for your developer.
            </p>
          </div>
        </div>

        <div className="grp">
          <h2 className="gh">Alerts</h2>
          <div className="gl">
            <SwitchRow
              title="New request alert"
              body="A banner in this app when a new order arrives"
              checked={prefs.newRequest}
              onChange={(v) => setPref("newRequest", v)}
            />
            <SwitchRow title="Deposit reminders" body="Nudge customers after 48 hours · not sent yet" checked={prefs.deposit} onChange={(v) => setPref("deposit", v)} />
            <SwitchRow title="Daily summary" body="Sales and pipeline at 8 pm · not sent yet" checked={prefs.daily} onChange={(v) => setPref("daily", v)} last />
          </div>
          <p style={{ margin: 0, padding: "0 4px", fontSize: 12, color: "#6E665C" }}>Saved on this phone only.</p>
        </div>

        <div className="grp">
          <h2 className="gh">Security</h2>
          <div className="gl">
            <button type="button" className="glink" onClick={() => setPwOpen(true)} style={{ borderTop: 0 }}>
              Change password
              <Icon name="chevronRight" size={18} stroke={2} />
            </button>
          </div>
        </div>

        <button type="button" className="sec danger" onClick={() => setSignOutOpen(true)}>
          Sign out
        </button>
      </div>

      <ChangePasswordSheet open={pwOpen} onClose={() => setPwOpen(false)} />

      <ConfirmSheet
        open={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        title="Sign out?"
        body="You will need to sign in again to manage orders and artworks."
        cta="Sign out"
        keepLabel="Stay"
        busy={leaving}
        onConfirm={() => {
          setLeaving(true);
          signOut({ callbackUrl: "/" });
        }}
      />
    </LightPage>
  );
}

/** "Payments & timings": what customers see on their order, in the quote email and on the commission page. */
function PaymentsForm({ initial }: { initial: StudioSettingsValues }) {
  const { say } = useLightToast();
  const f = useStudioSettings(initial);
  const field = (k: StudioSettingsField, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => {
    const err = f.fieldErrors[k];
    return (
      <label className="lbl" style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
        {label}
        <input
          className={"field" + (err ? " err-a" : "")}
          type="text"
          autoComplete="off"
          value={f.values[k]}
          onChange={(e) => f.set(k, e.target.value)}
          disabled={f.saving}
          aria-invalid={!!err}
          aria-describedby={err ? `st-${k}-err` : undefined}
          {...extra}
        />
        {err && (
          <span id={`st-${k}-err`} className="errmsg" role="alert" style={{ fontWeight: 400 }}>
            {err}
          </span>
        )}
      </label>
    );
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (await f.save()) say("Payments & timings saved");
  }

  return (
    <form className="grp" onSubmit={submit} noValidate aria-labelledby="st-pay">
      <h2 id="st-pay" className="gh">
        Payments &amp; timings
      </h2>
      <div className="gl" style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
        {field("bankName", "Bank name", { maxLength: 80, placeholder: "e.g. GTBank" })}
        {field("bankAccountName", "Account name", { maxLength: 120 })}
        {field("bankAccountNumber", "Account number", { inputMode: "numeric", maxLength: 24 })}
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.45, color: f.bankFilled > 0 && f.bankFilled < 3 ? "#9A4A1F" : "#4A433B" }}>
          {f.bankFilled === 3
            ? "Customers see these on their order and in the quote email."
            : "Customers see the bank details on their order and in the quote email once all three are filled."}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, alignItems: "start", borderTop: "1px solid #EFEAE2", paddingTop: 14 }}>
          {field("quoteHours", "Quote time (hours)", { inputMode: "numeric", maxLength: 3 })}
          {field("drawingDays", "Drawing time (days)", { inputMode: "numeric", maxLength: 3 })}
        </div>
        {f.preview && <p style={{ margin: 0, fontSize: 12, lineHeight: 1.45, color: "#4A433B" }}>Customers read: {f.preview}.</p>}
      </div>
      {f.error && (
        <p className="errmsg" role="alert" style={{ margin: 0, padding: "0 4px" }}>
          {f.error}
        </p>
      )}
      <Cta type="submit" loading={f.saving} disabled={!f.dirty} style={{ height: 52, fontSize: 15, opacity: f.dirty || f.saving ? 1 : 0.45 }}>
        Save changes
      </Cta>
    </form>
  );
}
