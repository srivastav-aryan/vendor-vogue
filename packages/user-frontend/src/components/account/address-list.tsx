"use client";

import * as React from "react";
import { Plus, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";
import type { UserAddress } from "@e-com/shared/schemas";
import { useAuthStore } from "@/lib/store/auth-store";
import { AddressCard } from "./address-card";
import { AddressFormDialog } from "./address-form-dialog";

export function AddressList() {
  const { user, addAddress, updateAddresses, deleteAddress } = useAuthStore();
  const addresses = user?.addresses || [];

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedAddress, setSelectedAddress] = React.useState<UserAddress | null>(null);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleOpenAdd = () => {
    setSelectedAddress(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (addr: UserAddress) => {
    setSelectedAddress(addr);
    setDialogOpen(true);
  };

  const handleSaveAddress = async (formData: UserAddress) => {
    try {
      if (selectedAddress) {
        // Edit existing address
        const targetId = selectedAddress.id || selectedAddress._id;
        const updatedList = addresses.map((addr) => {
          const currentId = addr.id || addr._id;
          if (currentId === targetId) {
            return {
              ...formData,
              id: targetId,
              _id: targetId,
            };
          }
          // If edited address is set to default, unset on others
          if (formData.isDefault) {
            return { ...addr, isDefault: false };
          }
          return addr;
        });

        await updateAddresses(updatedList);
        showFeedback("success", "Shipping address updated successfully.");
      } else {
        // Add new address
        await addAddress(formData);
        showFeedback("success", "New shipping address added to address book.");
      }
    } catch (err: any) {
      showFeedback(
        "error",
        err?.data?.message || err?.message || "Failed to save shipping address."
      );
      throw err;
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      await deleteAddress(addressId);
      showFeedback("success", "Shipping address removed from address book.");
    } catch (err: any) {
      showFeedback(
        "error",
        err?.data?.message || err?.message || "Failed to delete shipping address."
      );
    }
  };

  const handleSetDefault = async (targetAddress: UserAddress) => {
    try {
      const targetId = targetAddress.id || targetAddress._id;
      const updatedList = addresses.map((addr) => {
        const currentId = addr.id || addr._id;
        return {
          ...addr,
          isDefault: currentId === targetId,
        };
      });

      await updateAddresses(updatedList);
      showFeedback("success", `Default shipping address set to ${targetAddress.name}.`);
    } catch (err: any) {
      showFeedback(
        "error",
        err?.data?.message || err?.message || "Failed to update default address."
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* List Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200/80">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-neutral-400">
              SHIPPING DIRECTORY
            </span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-neutral-200/70 text-neutral-800 font-semibold">
              {addresses.length} {addresses.length === 1 ? "RECORD" : "RECORDS"}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold uppercase tracking-[0.1em] text-neutral-900 mt-1">
            SAVED ADDRESSES
          </h2>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-black text-white hover:bg-neutral-800 text-xs font-bold uppercase tracking-[0.2em] transition-all cursor-pointer shadow-xs active:scale-[0.99] group"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
          <span>ADD NEW ADDRESS</span>
        </button>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 flex items-start gap-3 border text-xs font-mono animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Address Cards Grid */}
      {addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((address, idx) => (
            <AddressCard
              key={address.id || address._id || idx}
              address={address}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteAddress}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 sm:p-16 text-center border border-neutral-200/90 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5">
          <div className="w-12 h-12 mx-auto bg-neutral-100 flex items-center justify-center text-neutral-500 rounded-none">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-black">
              NO SHIPPING ADDRESSES SAVED
            </h3>
            <p className="text-xs text-neutral-500 font-light max-w-sm mx-auto leading-relaxed">
              Save your residential or corporate delivery coordinates for instant priority checkout across private drops.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-7 py-3 bg-black text-white hover:bg-neutral-800 text-xs font-bold uppercase tracking-[0.22em] transition-all cursor-pointer group shadow-xs active:scale-[0.99]"
            >
              <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-200" />
              <span>ADD YOUR FIRST ADDRESS</span>
            </button>
          </div>
        </div>
      )}

      {/* Address Form Dialog Modal */}
      <AddressFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        addressToEdit={selectedAddress}
        onSave={handleSaveAddress}
      />
    </div>
  );
}
