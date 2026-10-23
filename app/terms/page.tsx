import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { CONTACT_EMAIL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for Engineerparts.com.",
};

export default function TermsPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Terms & Conditions" }]}
        eyebrow="Legal"
        title="Terms & Conditions"
        description="Review the terms that apply before placing an order or submitting an enquiry."
        tone="light"
      />
      <section className="section pt-8">
        <div className="shell max-w-3xl space-y-8 text-sm leading-relaxed text-steel-700">
          <div>
            <h2 className="text-lg font-bold text-navy-900">1. Acceptance of terms</h2>
            <p className="mt-2">
              By browsing Engineerparts.com, submitting an enquiry, or placing an order, you agree
              to these terms and conditions.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900">2. Eligibility and accounts</h2>
            <p className="mt-2">
              You must be able to form a legally binding contract to place an order. You are
              responsible for the accuracy of the details you provide and for keeping your account
              credentials secure.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900">3. Products, listings and pricing</h2>
            <p className="mt-2">
              Product information, specifications, condition, pricing and stock availability are
              shown as supplied and may change without notice. Clearance stock, lots and equipment
              are sold subject to the condition and notes stated on the listing. We may correct
              obvious pricing or description errors even after an order has been placed.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900">4. Orders</h2>
            <p className="mt-2">
              Placing an order is an offer to buy, which we accept when we send order or dispatch
              confirmation. We may decline or cancel an order where an item is unavailable, a
              pricing or listing error has occurred, payment cannot be verified, or delivery to the
              requested location is not possible.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900">5. Payment</h2>
            <p className="mt-2">
              Payment methods accepted are shown at checkout or confirmed with you directly for
              enquiry-based and bulk orders. Full payment, or any deposit agreed for an equipment or
              lot order, is due before dispatch unless otherwise agreed in writing.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900">6. Delivery</h2>
            <p className="mt-2">
              Delivery timelines are estimates and depend on stock, location and courier or freight
              schedules. Risk in the goods passes to you on delivery, and title passes once payment
              has been received in full. Our{" "}
              <a className="underline" href="/shipping-delivery">Shipping &amp; Delivery Policy</a>{" "}
              sets out further detail.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900">7. Returns and refunds</h2>
            <p className="mt-2">
              Returns, replacements and refunds are governed by our{" "}
              <a className="underline" href="/returns-refunds">Returns &amp; Refunds Policy</a>.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900">8. Acceptable use</h2>
            <p className="mt-2">
              You agree not to misuse the website, interfere with its operation or security, submit
              false orders or enquiries, or infringe the intellectual property or other rights of
              Engineerparts.com or any third party.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900">9. Intellectual property</h2>
            <p className="mt-2">
              All site content, including text, images and branding, belongs to Engineerparts.com or
              its licensors and may not be reproduced without written permission.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900">10. Third-party links</h2>
            <p className="mt-2">
              Engineerparts.com is not responsible for the content or practices of any third-party
              site linked from this website.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900">11. Liability</h2>
            <p className="mt-2">
              Nothing in these terms limits liability for death or personal injury caused by
              negligence, or for fraud, or excludes any right that cannot be excluded under
              applicable law. Subject to that, Engineerparts.com&apos;s liability for any order is
              limited to the value of that order.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900">12. Changes to these terms</h2>
            <p className="mt-2">
              We may update these terms from time to time. Continued use of the website after a
              change is posted constitutes acceptance of the revised terms.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900">13. Contact</h2>
            <p className="mt-2">
              Questions about these terms can be sent through our{" "}
              <a className="underline" href="/contact">contact form</a>
              {CONTACT_EMAIL ? <> or to <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></> : null}.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
