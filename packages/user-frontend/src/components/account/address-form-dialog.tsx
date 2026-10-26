"use client";

import * as React from "react";
import { Loader2, AlertCircle } from "lucide-react";
import type { UserAddress } from "@e-com/shared/schemas";
import { userAddressSchema } from "@e-com/shared/schemas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AddressFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addressToEdit?: UserAddress | null;
  onSave: (address: UserAddress) => Promise<void>;
}

export function AddressFormDialog({
  open,
  onOpenChange,
  addressToEdit,
  onSave,
}: AddressFormDialogProps) {
  const isEditing = Boolean(addressToEdit);

  const [formData, setFormData] = React.useState<UserAddress>({
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    locality: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    addressType: "HOME",
    isDefault: false,
  });

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Sync state whenever dialog opens or edit target changes
  React.useEffect(() => {
    if (addressToEdit) {
      setFormData({
        id: addressToEdit.id,
        _id: addressToEdit._id,
        name: addressToEdit.name || "",
        phone: addressToEdit.phone || "",
        addressLine1: addressToEdit.addressLine1 || "",
        addressLine2: addressToEdit.addressLine2 || "",
        landmark: addressToEdit.landmark || "",
        locality: addressToEdit.locality || "",
        city: addressToEdit.city || "",
        state: addressToEdit.state || "",
        pincode: addressToEdit.pincode || "",
        country: addressToEdit.country || "India",
        addressType: addressToEdit.addressType || "HOME",
        isDefault: Boolean(addressToEdit.isDefault),
      });
    } else {
      setFormData({
        name: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        landmark: "",
        locality: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
        addressType: "HOME",
        isDefault: false,
      });
    }
    setFieldErrors({});
    setServerError(null);
  }, [addressToEdit, open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});

    const validation = userAddressSchema.safeParse(formData);

    const errors: Record<string, string> = {};
    if (!validation.success) {
      validation.error.issues.forEach((err) => {
        const fieldName = err.path[0] as string;
        if (fieldName && !errors[fieldName]) {
          errors[fieldName] = err.message;
        }
      });
    }

    // Strict validation for Indian phone and PIN code matching checkout requirements
    const phoneClean = formData.phone.trim();
    if (!/^(?:(?:\+|0{0,2})91(\s*[- ]\s*)?)?[6789]\d{9}$/.test(phoneClean)) {
      errors.phone = "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)";
    }

    const pincodeClean = formData.pincode.trim();
    if (!/^[1-9][0-9]{5}$/.test(pincodeClean)) {
      errors.pincode = "PIN code must be exactly 6 digits (e.g. 400026)";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      if (!validation.success) {
        setServerError("Invalid address information.");
        return;
      }

      setIsSubmitting(true);
      await onSave(validation.data);
      onOpenChange(false);
    } catch (err: any) {
      setServerError(
        err?.data?.message || err?.message || "Failed to save address details. Please verify all fields."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-white border border-neutral-200 rounded-none p-6 sm:p-8 text-neutral-900 shadow-2xl">
        <DialogHeader className="text-left space-y-1.5 pb-4 border-b border-neutral-100">
          <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-neutral-400">
            {isEditing ? "UPDATE DESTINATION" : "NEW SHIPPING RECORD"}
          </span>
          <DialogTitle className="text-lg font-bold uppercase tracking-wider text-black">
            {isEditing ? "EDIT ADDRESS" : "ADD SHIPPING ADDRESS"}
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-500 font-light">
            Please provide accurate delivery coordinates for courier dispatch.
          </DialogDescription>
        </DialogHeader>

        {serverError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 flex items-start gap-2 text-xs font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2" noValidate>
          {/* Address Type Selector */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-700">
              ADDRESS TYPE
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["HOME", "OFFICE", "OTHER"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, addressType: type }))}
                  className={`py-2 text-xs font-mono uppercase tracking-wider border transition-all ${
                    formData.addressType === type
                      ? "border-black bg-black text-white font-bold"
                      : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-400"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Name & Phone Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="name" className="block text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-700">
                RECIPIENT NAME <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                className={`w-full px-3.5 py-2.5 bg-neutral-50 border text-xs focus:outline-none focus:border-black focus:bg-white transition-all ${
                  fieldErrors.name ? "border-red-500 bg-red-50/20" : "border-neutral-300"
                }`}
              />
              {fieldErrors.name && (
                <p className="text-[10px] font-mono text-red-600">{fieldErrors.name}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="phone" className="block text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-700">
                CONTACT PHONE <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
                className={`w-full px-3.5 py-2.5 bg-neutral-50 border text-xs focus:outline-none focus:border-black focus:bg-white transition-all ${
                  fieldErrors.phone ? "border-red-500 bg-red-50/20" : "border-neutral-300"
                }`}
              />
              {fieldErrors.phone && (
                <p className="text-[10px] font-mono text-red-600">{fieldErrors.phone}</p>
              )}
            </div>
          </div>

          {/* Address Line 1 */}
          <div className="space-y-1">
            <label htmlFor="addressLine1" className="block text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-700">
              STREET ADDRESS / BUILDING / FLAT <span className="text-red-500">*</span>
            </label>
            <input
              id="addressLine1"
              name="addressLine1"
              type="text"
              value={formData.addressLine1}
              onChange={handleChange}
              placeholder="Suite 401, Tower A, Luxury Heights"
              className={`w-full px-3.5 py-2.5 bg-neutral-50 border text-xs focus:outline-none focus:border-black focus:bg-white transition-all ${
                fieldErrors.addressLine1 ? "border-red-500 bg-red-50/20" : "border-neutral-300"
              }`}
            />
            {fieldErrors.addressLine1 && (
              <p className="text-[10px] font-mono text-red-600">{fieldErrors.addressLine1}</p>
            )}
          </div>

          {/* Address Line 2 */}
          <div className="space-y-1">
            <label htmlFor="addressLine2" className="block text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-700">
              APARTMENT, SUITE, ETC. (OPTIONAL)
            </label>
            <input
              id="addressLine2"
              name="addressLine2"
              type="text"
              value={formData.addressLine2 || ""}
              onChange={handleChange}
              placeholder="Near Central Avenue"
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 text-xs focus:outline-none focus:border-black focus:bg-white transition-all"
            />
          </div>

          {/* Locality & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="locality" className="block text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-700">
                LOCALITY / AREA <span className="text-red-500">*</span>
              </label>
              <input
                id="locality"
                name="locality"
                type="text"
                value={formData.locality}
                onChange={handleChange}
                placeholder="Bandra West"
                className={`w-full px-3.5 py-2.5 bg-neutral-50 border text-xs focus:outline-none focus:border-black focus:bg-white transition-all ${
                  fieldErrors.locality ? "border-red-500 bg-red-50/20" : "border-neutral-300"
                }`}
              />
              {fieldErrors.locality && (
                <p className="text-[10px] font-mono text-red-600">{fieldErrors.locality}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="city" className="block text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-700">
                CITY <span className="text-red-500">*</span>
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
                placeholder="Mumbai"
                className={`w-full px-3.5 py-2.5 bg-neutral-50 border text-xs focus:outline-none focus:border-black focus:bg-white transition-all ${
                  fieldErrors.city ? "border-red-500 bg-red-50/20" : "border-neutral-300"
                }`}
              />
              {fieldErrors.city && (
                <p className="text-[10px] font-mono text-red-600">{fieldErrors.city}</p>
              )}
            </div>
          </div>

          {/* State, Pincode & Country */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label htmlFor="state" className="block text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-700">
                STATE <span className="text-red-500">*</span>
              </label>
              <input
                id="state"
                name="state"
                type="text"
                value={formData.state}
                onChange={handleChange}
                placeholder="Maharashtra"
                className={`w-full px-3.5 py-2.5 bg-neutral-50 border text-xs focus:outline-none focus:border-black focus:bg-white transition-all ${
                  fieldErrors.state ? "border-red-500 bg-red-50/20" : "border-neutral-300"
                }`}
              />
              {fieldErrors.state && (
                <p className="text-[10px] font-mono text-red-600">{fieldErrors.state}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="pincode" className="block text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-700">
                PINCODE <span className="text-red-500">*</span>
              </label>
              <input
                id="pincode"
                name="pincode"
                type="text"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="400050"
                className={`w-full px-3.5 py-2.5 bg-neutral-50 border text-xs focus:outline-none focus:border-black focus:bg-white transition-all ${
                  fieldErrors.pincode ? "border-red-500 bg-red-50/20" : "border-neutral-300"
                }`}
              />
              {fieldErrors.pincode && (
                <p className="text-[10px] font-mono text-red-600">{fieldErrors.pincode}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="country" className="block text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-700">
                COUNTRY
              </label>
              <input
                id="country"
                name="country"
                type="text"
                value={formData.country}
                onChange={handleChange}
                placeholder="India"
                className="w-full px-3.5 py-2.5 bg-neutral-100/70 border border-neutral-300 text-xs focus:outline-none focus:border-black focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Default Address Checkbox */}
          <div className="pt-2 flex items-center gap-3">
            <input
              id="isDefault"
              name="isDefault"
              type="checkbox"
              checked={formData.isDefault}
              onChange={handleChange}
              className="w-4 h-4 accent-black rounded-none cursor-pointer"
            />
            <label htmlFor="isDefault" className="text-xs text-neutral-700 select-none cursor-pointer">
              Set as primary default shipping address for all future purchases
            </label>
          </div>

          {/* Form Actions */}
          <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2.5 text-xs font-mono uppercase tracking-wider border border-neutral-200 text-neutral-700 hover:text-black transition-colors cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs font-bold uppercase tracking-[0.2em] bg-black text-white hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>SAVING...</span>
                </>
              ) : (
                <span>{isEditing ? "UPDATE ADDRESS" : "SAVE ADDRESS"}</span>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
