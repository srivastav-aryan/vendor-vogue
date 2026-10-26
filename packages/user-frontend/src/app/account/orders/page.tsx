import type { Metadata } from "next";
import { OrdersList } from "@/components/account/orders-list";

export const metadata: Metadata = {
  title: "Client Orders Archive | Vendor Vogue",
  description: "View and track your previous and active Vendor Vogue orders and receipts.",
};

export default function AccountOrdersPage() {
  return <OrdersList />;
}
