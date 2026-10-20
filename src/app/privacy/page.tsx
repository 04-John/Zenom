export const metadata = { title: "Privacy Policy | Zenom Studio" };

// First-draft privacy policy — accurately reflects what this codebase
// actually collects and which third parties it sends data to as of the
// date below. Reviewed against the Nigeria Data Protection Act, 2023
// (NDPA) — see the lawful-basis, cross-border-transfer, and NDPC
// complaint sections below, added to satisfy sections 25/27/41-43/46.
// Still have this reviewed by counsel (and against GDPR, if serving EU
// customers) before relying on it in production; update the "Last
// updated" date and this list whenever a new integration is added.
export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 pb-24 pt-[140px] lg:px-10">
      <h1 className="h-page" style={{ fontSize: "clamp(44px, 7vw, 80px)" }}>Privacy Policy</h1>
      <p className="label-mono mt-5">Last updated: 30 September 2026</p>

      <div className="mt-12 space-y-10 text-[15px] leading-[1.7] text-ink-2">
        <Section title="Who we are">
          <p>
            Zenom Studio (&ldquo;we&rdquo;, &ldquo;us&rdquo;) offers commissioned charcoal and pencil
            portraits made to order. This policy explains what personal information we collect through
            zenomstudio.com (the &ldquo;Site&rdquo;), why we collect it, and who we share it with. Contact
            us at{" "}
            <a href="mailto:zenomart.studio@gmail.com" className="text-ember underline">
              zenomart.studio@gmail.com
            </a>{" "}
            with any question or request about your data. We process personal data in accordance with the
            Nigeria Data Protection Act, 2023 (NDPA).
          </p>
        </Section>

        <Section title="What we collect">
          <ul className="list-disc space-y-1 pl-5">
            <li>Account details: name and email address, if you create an account.</li>
            <li>
              Order details: name, email, phone number, delivery address, order notes, and the items you
              order (size, framing, quantity).
            </li>
            <li>
              Reference images you submit for a commission, once the upload feature is live (currently
              handled manually via WhatsApp).
            </li>
            <li>
              Basic technical data collected automatically for error monitoring (see Sentry, below) —
              things like browser type, page URL, and error stack traces. We do not use analytics or
              advertising trackers.
            </li>
          </ul>
        </Section>

        <Section title="Why we collect it, and our legal basis">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              To create and fulfil your order, including contacting you to confirm final pricing and
              details — necessary for performance of a contract with you (NDPA s.25(1)(b)(i)).
            </li>
            <li>To send order confirmation and status emails — same basis.</li>
            <li>To let you sign in and view your order history — same basis.</li>
            <li>
              To detect and fix bugs on the Site — our legitimate interest in keeping the Site working
              (NDPA s.25(1)(b)(v)).
            </li>
          </ul>
          <p className="mt-2">We do not sell your personal information, and we do not use it for advertising.</p>
        </Section>

        <Section title="Who we share it with">
          <p>We use the following third-party services to run the Site. Each only receives what it needs to do its job:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong className="font-semibold text-ink">Neon</strong> (database hosting, USA) — stores your account and order records.
            </li>
            <li>
              <strong className="font-semibold text-ink">Resend</strong> (email delivery) — sends order confirmation emails on our behalf.
            </li>
            <li>
              <strong className="font-semibold text-ink">Cloudinary</strong> (image hosting) — stores product and reference images.
            </li>
            <li>
              <strong className="font-semibold text-ink">Sentry</strong> (error monitoring) — receives technical error reports to help us fix
              bugs; configured not to collect user identity, cookies, or request bodies.
            </li>
            <li>
              <strong className="font-semibold text-ink">WhatsApp / Meta</strong> — after you place an order, we hand off order details to
              WhatsApp to confirm your commission with you directly. WhatsApp&rsquo;s own privacy policy
              applies to that conversation.
            </li>
          </ul>
        </Section>

        <Section title="Sending your data outside Nigeria">
          <p>
            Neon, Resend, Cloudinary, and Sentry each process data outside Nigeria. Under NDPA s.43(1)(b),
            we rely on the fact that this transfer is necessary to perform our contract with you — we
            can&rsquo;t create your account, save your order, email your confirmation, or host your images
            without it. We only send these providers what they need to do that job.
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            We use one essential cookie to keep you signed in (via NextAuth). We don&rsquo;t use marketing,
            advertising, or analytics cookies.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            We keep order records indefinitely for accounting and customer-service purposes, unless you ask
            us to delete them. Account data is kept until you ask us to delete your account.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            Under Part VI of the NDPA, you can ask us to confirm what we hold about you, access or export a
            copy of it, correct it, restrict or object to its processing, or erase it, by emailing{" "}
            <a href="mailto:zenomart.studio@gmail.com" className="text-ember underline">
              zenomart.studio@gmail.com
            </a>
            . We&rsquo;ll respond within a reasonable time. Deleting your data may mean we can no longer
            fulfil an order in progress. If you&rsquo;re not satisfied with how we&rsquo;ve handled a
            request, you can lodge a complaint with the{" "}
            <strong className="font-semibold text-ink">Nigeria Data Protection Commission (NDPC)</strong> under NDPA s.46.
          </p>
        </Section>

        <Section title="Automated decision-making">
          <p>
            We don&rsquo;t use automated decision-making or profiling that produces legal or similarly
            significant effects for you (NDPA s.37) — every order is reviewed and confirmed by a person on
            WhatsApp before production starts.
          </p>
        </Section>

        <Section title="If something goes wrong">
          <p>
            If a security incident affects your personal data, we&rsquo;ll notify the NDPC and, where the
            law requires it, you directly, as set out in NDPA s.40.
          </p>
        </Section>

        <Section title="Children">
          <p>
            The Site is not directed at children, and we do not knowingly collect data from anyone under
            13. Where NDPA s.31 requires a parent or guardian&rsquo;s consent, we do not process a
            child&rsquo;s data without it.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If we change what we collect or who we share it with, we&rsquo;ll update this page and the
            &ldquo;Last updated&rdquo; date above.
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
