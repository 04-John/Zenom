// Builds the pre-filled WhatsApp handoff message. WhatsApp is a handoff,
// never the source of truth — the order must already be saved in Postgres
// before this is ever called.

type OrderForWhatsapp = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  notes?: string | null;
  items: {
    productName: string;
    size?: string;
    backgroundTrack?: string;
    quantity: number;
  }[];
};

export function buildWhatsAppMessage(order: OrderForWhatsapp): string {
  const itemLines = order.items
    .map(
      (i) =>
        `• ${i.productName}${i.size ? ` — ${i.size}` : ""}${
          i.backgroundTrack ? ` — ${i.backgroundTrack}` : ""
        } x${i.quantity}`
    )
    .join("\n");

  return [
    "Hello Zenom Studio,",
    "",
    "I'd like to place an order.",
    "",
    `Order: ${order.orderNumber}`,
    "",
    "Items:",
    itemLines,
    "",
    "Customer:",
    order.customerName,
    order.customerPhone,
    "",
    "Delivery:",
    order.deliveryAddress,
    "",
    ...(order.notes ? ["Additional notes:", order.notes, ""] : []),
    "Please confirm availability, final pricing and next steps.",
  ].join("\n");
}

export function buildWhatsAppLink(order: OrderForWhatsapp): string {
  const number = process.env.WHATSAPP_BUSINESS_NUMBER;
  const text = encodeURIComponent(buildWhatsAppMessage(order));
  return `https://wa.me/${number}?text=${text}`;
}
