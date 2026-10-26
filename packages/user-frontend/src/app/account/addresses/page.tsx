import type { Metadata } from "next";
import { AddressList } from "@/components/account/address-list";

export const metadata: Metadata = {
  title: "Saved Addresses",
  description: "Manage your default delivery addresses and shipping destinations.",
};

export default function AccountAddressesPage() {
  return (
    <div className="space-y-6">
      <AddressList />
    </div>
  );
}
