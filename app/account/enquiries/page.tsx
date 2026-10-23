import { EnquiriesView } from "@/components/account/AccountViews";
import { AccountSectionHeader } from "@/components/account/AccountSectionHeader";
import { getAccountResource } from "@/lib/auth-server";
import type { CustomerEnquiry } from "@/lib/account";

export default async function EnquiriesPage() {
  const data = await getAccountResource<{ ok: true; enquiries: CustomerEnquiry[] }>("enquiries");
  return (
    <div>
      <AccountSectionHeader
        eyebrow="Requests for quote"
        title="Enquiries / RFQs"
        description="Your submitted enquiries, saved to your verified customer account."
      />
      {data ? <EnquiriesView enquiries={data.enquiries} /> : <p className="card p-5 text-sm text-signal-700">Enquiries are temporarily unavailable.</p>}
    </div>
  );
}
