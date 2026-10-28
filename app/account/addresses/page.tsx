import { AddressesForm } from "@/components/account/AccountForms";
import { AccountSectionHeader } from "@/components/account/AccountSectionHeader";
import { getAccountResource } from "@/lib/auth-server";
import { getWooCommerceCountries } from "@/lib/woocommerce";
import type { AccountCustomer } from "@/lib/account";

export default async function AddressesPage() {
  const [data, countries] = await Promise.all([
    getAccountResource<{ ok: true; customer: AccountCustomer }>(),
    getWooCommerceCountries(),
  ]);
  return (
    <div>
      <AccountSectionHeader eyebrow="Delivery details" title="Addresses" description="Manage the billing and delivery addresses used for your orders." />
      {data ? (
        <AddressesForm customer={data.customer} countries={countries} />
      ) : (
        <p role="alert" className="card p-5 text-sm text-signal-700">Addresses could not be loaded. Refresh to retry, sign in again if your session expired, or contact support. You can enter delivery details manually at checkout.</p>
      )}
    </div>
  );
}
