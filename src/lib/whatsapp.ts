import { DELIVERY_KADUNA, WHATSAPP_NUMBER, formatNaira, type DeliveryZone } from "@/lib/pricing";

// Builds the pre-filled WhatsApp handoff message. WhatsApp is a handoff,
// never the source of truth — the order must already be saved in Postgres
// before this is ever called. Amounts are the server-computed values.

export type OrderForWhatsapp = {
  orderNumber: string;
  customerName: string;
  deliveryAddress: string;
  delivery: DeliveryZone;
  total: number; // kobo
  notes?: string | null;
  items: {
    title: string;
    code: string; // archive code, e.g. "ZS-W05"
    size: string; // e.g. "16×20"
    framed: boolean;
    subjectCount: number;
    unitPrice: number; // kobo
  }[];
};

export function buildWhatsAppMessage(order: OrderForWhatsapp): string {
  const itemLines = order.items.map(
    (i) =>
      `• ${i.title} (${i.code}), ${i.size} in, ${i.framed ? "framed" : "unframed"}` +
      `${i.subjectCount > 1 ? `, ${i.subjectCount} subjects` : ""}: ${formatNaira(i.unitPrice)}`
  );

  return [
    `Hello Zenom Studio, I'd like to place order ${order.orderNumber}:`,
    ...itemLines,
    order.delivery === "kaduna"
      ? `Delivery: Kaduna ${formatNaira(DELIVERY_KADUNA)}`
      : "Delivery: Outside Kaduna (please quote)",
    `Total: ${formatNaira(order.total)}`,
    `Name: ${order.customerName}`,
    `Address: ${order.deliveryAddress}`,
    ...(order.notes ? [`Notes: ${order.notes}`] : []),
  ].join("\n");
}

export function buildWhatsAppLink(order: OrderForWhatsapp): string {
  const number = process.env.WHATSAPP_BUSINESS_NUMBER || WHATSAPP_NUMBER;
  return `https://wa.me/${number}?text=${encodeURIComponent(buildWhatsAppMessage(order))}`;
}
