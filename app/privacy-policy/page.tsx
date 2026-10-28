import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Engineerparts.com handles enquiry, order and website data.",
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Privacy Policy" }]}
        eyebrow="Legal"
        title="Privacy Policy"
        description="Engineerparts.com enquiry and order details are used only to fulfil and respond to your request."
        tone="light"
      />
      <section className="section pt-8">
        <div className="shell reading space-y-6 text-base leading-relaxed text-steel-700">
          <p>
            When you submit an enquiry, bulk request or order, we collect your name, company,
            email, phone, country and the product, lot or equipment references you provide. This
            information is stored so the clearance desk can respond, confirm stock and arrange
            collection or freight.
          </p>
          <p>
            Essential browser storage is used for sign-in, cart, saved-product and checkout
            functions. These features cannot operate correctly without it.
          </p>
          <p>
            If you allow analytics, events such as product views, searches, add-to-cart, purchases,
            enquiries, WhatsApp clicks and document downloads are recorded in a structured form for
            reporting. They do not include payment card details. Analytics remains disabled when
            you choose essential storage only, and you can change your choice through Cookie
            settings in the website footer. We do not currently use advertising cookies.
          </p>
          <p>
            We do not sell personal data. Trade enquiries are used only to confirm stock, logistics
            and to respond to your request.
          </p>
          <p>
            To request a copy or deletion of your enquiry records, contact
            use the contact form and quote your lead or order reference.
          </p>
        </div>
      </section>
    </>
  );
}
