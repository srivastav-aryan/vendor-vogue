import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/checkout-view";

export const metadata: Metadata = {
  title: "Secure Luxury Checkout | Vendor Vogue",
  description:
    "Complete your bespoke apparel acquisition with secure payment gateway, verified address selection, and fast express dispatch.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutPage() {
  return <CheckoutView />;
}
