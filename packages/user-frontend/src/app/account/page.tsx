import type { Metadata } from "next";
import { ProfileForm } from "@/components/account/profile-form";

export const metadata: Metadata = {
  title: "Client Profile",
  description: "Manage your personal information and contact preferences.",
};

export default function AccountPage() {
  return (
    <div className="space-y-6">
      <ProfileForm />
    </div>
  );
}
