export const metadata = { title: "Terms of Service | Zenom Studio" };

// First-draft terms — written to match how this codebase's checkout
// flow actually works (order saved, then confirmed with the customer
// over WhatsApp before production starts; basePrice/size pricing in
// prisma/seed.ts is currently a placeholder). Have this reviewed
// against Nigerian consumer-protection law before relying on it.
export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 lg:px-10">
      <h1 className="font-display text-4xl text-navy">Terms of Service</h1>
      <p className="mt-2 text-sm text-charcoal/50">Last updated: 30 September 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-charcoal/80">
        <Section title="Commissioned work">
          <p>
            Every piece is made to order. Placing an order on the Site starts the commission process; it is
            not a guarantee of final price or delivery date until we&rsquo;ve confirmed both with you
            directly on WhatsApp, as described at checkout.
          </p>
        </Section>

        <Section title="Pricing and payment">
          <p>
            Prices shown on the Site are our current base pricing and may be adjusted once we&rsquo;ve
            reviewed your specific commission (size, complexity, reference material). We will always confirm
            final pricing with you before starting production, and you may cancel at no cost if you don&rsquo;t
            wish to proceed at the confirmed price. Payment terms are communicated during that confirmation.
          </p>
        </Section>

        <Section title="Cancellations and refunds">
          <p>
            Because each piece is made specifically for you, we generally don&rsquo;t offer refunds once
            production has started. You may cancel free of charge before production begins. If a finished
            piece arrives damaged or doesn&rsquo;t match the confirmed brief, contact us — we&rsquo;ll make it
            right with a redo or refund at our discretion.
          </p>
        </Section>

        <Section title="Reference images">
          <p>
            If you submit a reference photo for your commission, you confirm you have the right to use it
            (e.g. it&rsquo;s your own photo, or you have the subject&rsquo;s permission) and that using it
            doesn&rsquo;t infringe anyone else&rsquo;s rights. We use reference images only to produce your
            commission.
          </p>
        </Section>

        <Section title="Ownership and portfolio use">
          <p>
            Ownership of the physical artwork transfers to you once it&rsquo;s paid for and delivered. We
            retain the right to photograph finished work and reference images and use those photographs in
            our own portfolio, website, and social media, unless you ask us in writing not to before we
            start production.
          </p>
        </Section>

        <Section title="Delivery">
          <p>
            Delivery timelines and logistics are confirmed with you directly for each order, since they
            depend on the piece and your location.
          </p>
        </Section>

        <Section title="Accounts">
          <p>
            If you create an account, you&rsquo;re responsible for keeping your login details confidential
            and for activity under your account. You must be able to receive email at the address you sign
            up with, since we use it to verify your account and send order updates.
          </p>
        </Section>

        <Section title="Liability">
          <p>
            We aren&rsquo;t liable for delays or issues caused by events outside our reasonable control. Our
            liability for any issue with an order is limited to the amount you paid for that order.
          </p>
        </Section>

        <Section title="Governing law">
          <p>These terms are governed by the laws of the Federal Republic of Nigeria.</p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about these terms:{" "}
            <a href="mailto:zenomart.studio@gmail.com" className="text-copper underline">
              zenomart.studio@gmail.com
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl text-navy">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}
