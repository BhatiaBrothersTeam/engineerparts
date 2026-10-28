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
        <p role="alert" className="card p-5 text-sm text-signal-700">Security information could not be loaded. Refresh to retry, sign in again if your session expired, or use Forgot password to reset your password.</p>
      )}
    </div>
  );
}
