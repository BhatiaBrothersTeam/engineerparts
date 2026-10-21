import type { Metadata } from "next";
import { ListingEnquiryForm } from "@/components/forms/ListingEnquiryForm";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Submit an Enquiry",
  description: "Send Engineerparts.com a product, lot, or equipment enquiry.",
};

export default function EnquiryPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Enquiry" }]}
        eyebrow="Clearance desk"
        title="Submit an enquiry"
        description="Tell us what products, lots or equipment you need. Add a SKU or reference if you have one."
      />
      <section className="section">
        <div className="shell max-w-3xl">
          <ListingEnquiryForm />
        </div>
      </section>
    </>
  );
}
