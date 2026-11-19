import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ART_GROUPS } from "@/lib/catalog";
import { WHATSAPP_NUMBER, formatNaira } from "@/lib/pricing";
import { BANK_DETAILS, ORDER_LABEL, fmtDate } from "@/lib/zenom-mobile";
import { ZenomMark } from "@/components/brand/ZenomMark";
import { BackBar, LightPage } from "@/components/mobile/ui";
import { PrintButton } from "@/components/mobile/customer/PrintButton";
import { getCustomerOrder } from "@/components/mobile/customer/server";
import { DOC_META, balanceOf, docReady, isDocKind, prettyPhone, type CustomerOrder, type DocKind } from "@/components/mobile/customer/model";

export const metadata = { title: "Document | Zenom Studio", robots: { index: false } };
export const dynamic = "force-dynamic";

// A plain, printable invoice / deposit receipt / certificate for one order.
// Same ownership check as the order page; a document only opens once the
// order has reached its stage (invoice: quote sent, receipt: deposit
// received, certificate: delivered). "Print / Save as PDF" uses the browser.
const PRINT_CSS = `
@media print {
  @page { margin: 14mm; }
  html, body { background: #ffffff !important; }
  body * { visibility: hidden !important; }
  [data-print-doc], [data-print-doc] * { visibility: visible !important; }
  [data-print-doc] { position: absolute; left: 0; top: 0; width: 100%; border: 0 !important; box-shadow: none !important; padding: 0 !important; }
}
`;

export default async function OrderDocumentPage({ params }: { params: { id: string; kind: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");
  if (!isDocKind(params.kind)) notFound();
  const kind: DocKind = params.kind;

  const order = await getCustomerOrder(userId, params.id);
  if (!order) notFound();
  const meta = DOC_META[kind];
  const ready = docReady(order.status, kind);

  return (
    <LightPage desktop="column" className="min-[900px]:pt-24">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <div style={{ padding: "0 16px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
        <BackBar href={`/account/orders/${order.id}?tab=docs`} label={order.orderNumber} />

        {!ready ? (
          <div style={{ background: "#ffffff", border: "1px solid #E8E2D8", borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 10 }}>
            <span className="kick" style={{ color: "#9A4A1F" }}>
              {meta.title}
            </span>
            <h1 className="h1" style={{ fontSize: 28 }}>
              Not ready yet
            </h1>
            <p className="sub" style={{ fontSize: 14 }}>
              {order.status === "CANCELLED"
                ? "This order was cancelled, so there is no document to show."
                : `This document unlocks ${meta.locked.toLowerCase()}. Order ${order.orderNumber} is ${ORDER_LABEL[order.status].toLowerCase()}.`}
            </p>
          </div>
        ) : (
          <>
            <article
              data-print-doc
              aria-label={`${meta.title} for ${order.orderNumber}`}
              style={{ background: "#ffffff", border: "1px solid #E8E2D8", borderRadius: 20, padding: "22px 20px", display: "flex", flexDirection: "column", gap: 20, color: "#1A1714" }}
            >
              <DocHeader title={meta.title} order={order} />
              {kind === "invoice" && <Invoice o={order} />}
              {kind === "receipt" && <Receipt o={order} />}
              {kind === "certificate" && <Certificate o={order} />}
              <p style={{ margin: 0, fontSize: 11, color: "#6E665C", borderTop: "1px solid #EFEAE2", paddingTop: 12 }}>
                Zenom Studio · Kaduna, Nigeria · WhatsApp {prettyPhone(WHATSAPP_NUMBER)} · zenomstudio.netlify.app
              </p>
            </article>
            <PrintButton />
          </>
        )}
      </div>
    </LightPage>
  );
}

function DocHeader({ title, order }: { title: string; order: CustomerOrder }) {
  return (
    <header style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span aria-hidden="true" style={{ display: "flex" }}>
          <ZenomMark size={30} ink="#1A1714" title="" />
        </span>
        <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: 24 }}>Zenom Studio</span>
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-end", textAlign: "right" }}>
        <span className="kick" style={{ color: "#9A4A1F" }}>
          {title}
        </span>
        <strong style={{ fontSize: 16 }}>{order.orderNumber}</strong>
        <span style={{ fontSize: 12, color: "#4A433B" }}>Issued {fmtDate(Date.now())}</span>
      </span>
    </header>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <h2 style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#4A433B" }}>{label}</h2>
      {children}
    </section>
  );
}

function Line({ k, v, strong }: { k: ReactNode; v: ReactNode; strong?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: "1px solid #EFEAE2", fontSize: 14, fontWeight: strong ? 700 : 400 }}>
      <span style={{ minWidth: 0 }}>{k}</span>
      <span style={{ flex: "none", textAlign: "right" }}>{v}</span>
    </div>
  );
}

const itemSpec = (it: CustomerOrder["items"][number]) =>
  [it.size && `${it.size} in`, it.framed ? "framed" : "paper only", it.subjectCount > 1 && `${it.subjectCount} people`, it.medium].filter(Boolean).join(" · ");

function Customer({ o }: { o: CustomerOrder }) {
  return (
    <div style={{ fontSize: 14, lineHeight: 1.6 }}>
      <strong>{o.customerName}</strong>
      <br />
      {o.customerPhone}
      {o.customerEmail && (
        <>
          <br />
          {o.customerEmail}
        </>
      )}
      {o.deliveryAddress && (
        <>
          <br />
          {o.deliveryAddress}
        </>
      )}
    </div>
  );
}

function Invoice({ o }: { o: CustomerOrder }) {
  return (
    <>
      <Section label="Billed to">
        <Customer o={o} />
      </Section>
      <Section label="Order">
        <div>
          {o.items.map((it) => (
            <Line
              key={it.id}
              k={
                <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontWeight: 600 }}>{it.title}</span>
                  <span style={{ fontSize: 12, color: "#4A433B" }}>{itemSpec(it)}</span>
                </span>
              }
              v={formatNaira(it.unitPrice)}
            />
          ))}
          <Line k={o.delivery === "KADUNA" ? "Delivery · Kaduna" : "Delivery · outside Kaduna"} v={o.delivery === "KADUNA" ? formatNaira(o.deliveryFee) : "Quoted on WhatsApp"} />
          <Line k="Total" v={formatNaira(o.total)} strong />
          <Line k="Deposit · 50%, starts the work" v={formatNaira(o.deposit)} />
          <Line k="Balance · on delivery" v={formatNaira(balanceOf(o))} />
        </div>
      </Section>
      <Section label="Payment">
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
          Bank transfer to <strong>{BANK_DETAILS.accountName}</strong>
          {BANK_DETAILS.placeholder ? (
            <> · bank and account number to confirm with Samuel on WhatsApp</>
          ) : (
            <>
              {" "}
              · {BANK_DETAILS.bank} · {BANK_DETAILS.accountNumber}
            </>
          )}
          . Use the reference <strong>{o.orderNumber}</strong>. The deposit is non-refundable.
        </p>
      </Section>
    </>
  );
}

function Receipt({ o }: { o: CustomerOrder }) {
  const settled = o.status === "COMPLETED";
  return (
    <>
      <Section label="Received from">
        <Customer o={o} />
      </Section>
      <div style={{ padding: 16, borderRadius: 16, background: "#F6F2EB", display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 13, color: "#4A433B" }}>Deposit received · 50%</span>
        <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 36, lineHeight: 1 }}>{formatNaira(o.deposit)}</span>
      </div>
      <Section label="For">
        <div>
          {o.items.map((it) => (
            <Line key={it.id} k={`${it.title} · ${itemSpec(it)}`} v={formatNaira(it.unitPrice)} />
          ))}
          <Line k="Order total" v={formatNaira(o.total)} />
          <Line k="Balance" v={settled ? "Settled" : `${formatNaira(balanceOf(o))} · due on delivery`} strong />
        </div>
      </Section>
      <p style={{ margin: 0, fontSize: 13, color: "#4A433B" }}>The deposit is non-refundable: it starts the work on order {o.orderNumber}.</p>
    </>
  );
}

function Certificate({ o }: { o: CustomerOrder }) {
  return (
    <>
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 10, padding: "8px 0" }}>
        <h1 className="h1" style={{ fontSize: 32 }}>
          Certificate of authenticity
        </h1>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#4A433B" }}>
          This certifies that the work described below is an original drawing, made by hand by Samuel at Zenom Studio in Kaduna, Nigeria.
        </p>
      </div>
      {o.items.map((it) => {
        const medium = it.medium ?? (it.category ? ART_GROUPS.find((g) => g.category === it.category)?.medium : undefined);
        return (
          <Section key={it.id} label="The work">
            <div>
              <Line k="Title" v={it.title} />
              {medium && <Line k="Medium" v={medium} />}
              {it.size && <Line k="Size" v={`${it.size} in`} />}
              <Line k="Finish" v={it.framed ? "Framed" : "Paper only"} />
              <Line k="Archive no." v={it.code ?? o.orderNumber} />
            </div>
          </Section>
        );
      })}
      <Section label="Commissioned by">
        <div>
          <Line k="Collector" v={o.customerName} />
          <Line k="Order" v={o.orderNumber} />
          <Line k="Delivered" v={fmtDate(o.updatedAt)} />
        </div>
      </Section>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 12 }}>
        <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: 26 }}>Samuel</span>
        <span style={{ borderTop: "1px solid #1A1714", width: 180, paddingTop: 4, fontSize: 12, color: "#4A433B" }}>Artist · Zenom Studio</span>
      </div>
    </>
  );
}
