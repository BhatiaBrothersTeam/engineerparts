import { ProfileForm } from "@/components/account/AccountForms";
import { AccountSectionHeader } from "@/components/account/AccountSectionHeader";
import { getAccountResource } from "@/lib/auth-server";
import type { AccountCustomer } from "@/lib/account";

export default async function ProfilePage() {
  const data = await getAccountResource<{ ok: true; customer: AccountCustomer }>();
  return (
    <div>
      <AccountSectionHeader eyebrow="Your details" title="Profile" description="Manage your contact and B2B company details." />
      {data ? <ProfileForm customer={data.customer} /> : <Unavailable />}
    </div>
  );
}

function Unavailable() {
  return <p className="card p-5 text-sm text-signal-700">Account details are temporarily unavailable.</p>;
}
