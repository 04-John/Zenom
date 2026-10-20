export const metadata = { title: "Terms of Service | Zenom Studio" };

// Terms matching the real Zenom Studios brand doc (Oct 2026): 50%
// non-refundable deposit before production, 50% on completion before
// release, delivery NGN 1,500 in Kaduna, quoted outside, 3-4 day minimum turnaround,
// Strathmore paper with graphite/charcoal/gouache/color pencil. Have
// this reviewed against Nigerian consumer-protection law before relying
// on it in production.
export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 pb-24 pt-[140px] lg:px-10">
      <h1 className="h-page" style={{ fontSize: "clamp(44px, 7vw, 80px)" }}>Terms of Service</h1>
      <p className="label-mono mt-5">Last updated: 2 October 2026</p>

      <div className="mt-12 space-y-10 text-[15px] leading-[1.7] text-ink-2">
        <Section title="Commissioned work">
          <p>
            Every piece is made to order, by hand, on Strathmore paper in graphite, charcoal, gouache, or
            color pencil depending on the piece. A Custom Portrait or Abstract Pencil Art order is a
            recreation of the photo or reference image as submitted — we do not combine people from separate
            photos, change clothing, or add or remove elements.
          </p>
        </Section>

        <Section title="Pricing and payment">
          <p>
            Prices shown on the Site are our current pricing by category and size, from 8&times;12 up to
            24&times;36 inches, with optional framing priced by size. An additional subject on a portrait
            is +NGN 10,000 per person; larger group
            portraits are quoted individually. A 50% deposit is required before production begins and is
            non-refundable once paid. The remaining 50% is due on completion, before your piece is released
            for delivery or collection.
          </p>
        </Section>

        <Section title="Cancellations and refunds">
          <p>
            You may cancel free of charge before paying the deposit. Once the deposit is paid and production
            begins, it is non-refundable. If a finished piece arrives damaged or doesn&rsquo;t match the
            confirmed reference, contact us — we&rsquo;ll make it right with a redo or refund at our
            discretion.
          </p>
        </Section>

        <Section title="Reference images">
          <p>
            If you submit a reference photo or image for your commission, you confirm you have the right to
            use it (e.g. it&rsquo;s your own photo, or you have the subject&rsquo;s permission) and that using
            it doesn&rsquo;t infringe anyone else&rsquo;s rights. We use reference images only to produce your
            commission.
          </p>
        </Section>

        <Section title="Ownership and portfolio use">
          <p>
            Ownership of the physical artwork transfers to you once it&rsquo;s paid for in full and delivered.
            We retain the right to photograph finished work and reference images and use those photographs in
            our own portfolio, website, and social media, unless you ask us in writing not to before we
            start production.
          </p>
        </Section>

        <Section title="Turnaround and delivery">
          <p>
            Minimum turnaround is 3 to 4 days for the smallest size, longer for larger or more detailed
            pieces, confirmed with your quote. Delivery within Kaduna is a flat NGN 1,500, added to your
            order total; delivery outside Kaduna is quoted on WhatsApp based on your address. Framing is
            optional and priced by size.
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
            <a href="mailto:zenomart.studio@gmail.com" className="text-ember underline">
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
      <h2 className="font-display text-2xl italic text-ink">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}
