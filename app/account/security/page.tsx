import { SecurityForm } from "@/components/account/AccountForms";
import { AccountSectionHeader } from "@/components/account/AccountSectionHeader";
import { getAccountResource } from "@/lib/auth-server";
import type { AccountCustomer } from "@/lib/account";

export default async function SecurityPage() {
  const data = await getAccountResource<{ ok: true; customer: AccountCustomer }>();
  return (
    <div>
      <AccountSectionHeader eyebrow="Stay protected" title="Account security" description="Manage your password and active EngineerParts sessions." />
      {data ? (
        <SecurityForm activeSessionCount={data.customer.activeSessionCount} />
      ) : (
        <p className="card p-5 text-sm text-signal-700">Security information is temporarily unavailable.</p>
      )}
    </div>
  );
}
