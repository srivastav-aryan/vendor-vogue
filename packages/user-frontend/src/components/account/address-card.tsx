"use client";

import * as React from "react";
import { MapPin, Phone, Check, Trash2, Edit2, Loader2, Home, Building2, Briefcase } from "lucide-react";
import type { UserAddress } from "@e-com/shared/schemas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface AddressCardProps {
  address: UserAddress;
  onEdit: (address: UserAddress) => void;
  onDelete: (addressId: string) => Promise<void>;
  onSetDefault: (address: UserAddress) => Promise<void>;
}

export function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: AddressCardProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSettingDefault, setIsSettingDefault] = React.useState(false);

  const addressId = address.id || address._id || "";

  const handleSetDefault = async () => {
    if (address.isDefault || isSettingDefault) return;
    try {
      setIsSettingDefault(true);
      await onSetDefault(address);
    } finally {
      setIsSettingDefault(false);
    }
  };

  const handleDelete = async () => {
    if (!addressId || isDeleting) return;
    try {
      setIsDeleting(true);
      await onDelete(addressId);
      setDeleteConfirmOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const TypeIcon =
    address.addressType === "OFFICE"
      ? Building2
      : address.addressType === "OTHER"
      ? Briefcase
      : Home;

  return (
    <>
      <div
        className={`relative p-6 sm:p-7 bg-white border transition-all flex flex-col justify-between ${
          address.isDefault
            ? "border-black shadow-sm ring-1 ring-black"
            : "border-neutral-200/90 hover:border-neutral-400"
        }`}
      >
        <div>
          {/* Card Header: Badges */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-neutral-100 text-neutral-800 border border-neutral-200">
                <TypeIcon className="w-3 h-3" />
                <span>{address.addressType}</span>
              </span>

              {address.isDefault && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-black text-white">
                  <Check className="w-3 h-3" />
                  <span>DEFAULT SHIPPING</span>
                </span>
              )}
            </div>

            {/* Edit & Delete Action Icons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onEdit(address)}
                className="p-1.5 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-none transition-colors"
                title="Edit address"
                aria-label="Edit address"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-none transition-colors"
                title="Delete address"
                aria-label="Delete address"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Recipient Details */}
          <h3 className="text-sm font-bold uppercase tracking-wider text-black">
            {address.name}
          </h3>

          {/* Full Address Block */}
          <div className="mt-3 text-xs text-neutral-600 leading-relaxed font-light space-y-0.5">
            <p>{address.addressLine1}</p>
            {address.addressLine2 && <p>{address.addressLine2}</p>}
            <p>
              {address.locality}, {address.city}
            </p>
            <p>
              {address.state} — <span className="font-mono font-medium">{address.pincode}</span>
            </p>
            <p className="text-neutral-500 font-mono text-[11px] pt-1">{address.country}</p>
          </div>

          {/* Contact Phone */}
          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center gap-2 text-xs font-mono text-neutral-700">
            <Phone className="w-3.5 h-3.5 text-neutral-400" />
            <span>{address.phone}</span>
          </div>
        </div>

        {/* Card Footer: Set Default Action */}
        <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between">
          {!address.isDefault ? (
            <button
              type="button"
              onClick={handleSetDefault}
              disabled={isSettingDefault}
              className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-500 hover:text-black transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isSettingDefault ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>SETTING AS DEFAULT...</span>
                </>
              ) : (
                <span>SET AS DEFAULT</span>
              )}
            </button>
          ) : (
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400">
              PRIMARY SHIPPING DESTINATION
            </span>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md bg-white border border-neutral-200 rounded-none p-6 text-neutral-900 shadow-2xl">
          <DialogHeader className="text-left space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-rose-600">
              CONFIRM REMOVAL
            </span>
            <DialogTitle className="text-base font-bold uppercase tracking-wider text-black">
              DELETE SAVED ADDRESS
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-600 font-light leading-relaxed">
              Are you sure you wish to remove this address ({address.name}, {address.city}) from your shipping address book? This action cannot be reversed.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(false)}
              className="px-4 py-2.5 text-xs font-mono uppercase tracking-wider border border-neutral-200 text-neutral-700 hover:text-black transition-colors cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>DELETING...</span>
                </>
              ) : (
                <span>CONFIRM DELETE</span>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
