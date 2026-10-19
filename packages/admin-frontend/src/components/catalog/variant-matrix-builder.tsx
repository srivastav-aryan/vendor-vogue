"use client";

import React, { useState } from "react";
import { Plus, Trash2, Wand2, AlertTriangle, Layers } from "lucide-react";

export interface VariantDraft {
  id: string; // client-side temporary id
  name: string;
  size: string;
  color: string;
  sku: string;
  mrp: number;
  sellingPrice: number;
  stockQuantity: number;
  weightInGrams: number;
}

interface VariantMatrixBuilderProps {
  variants: VariantDraft[];
  onChange: (variants: VariantDraft[]) => void;
  productName: string;
}

const COMMON_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

export function VariantMatrixBuilder({
  variants,
  onChange,
  productName,
}: VariantMatrixBuilderProps) {
  // Generator State
  const [genColor, setGenColor] = useState("Black");
  const [selectedSizes, setSelectedSizes] = useState<string[]>(["S", "M", "L", "XL"]);
  const [genMrp, setGenMrp] = useState<number>(1999);
  const [genSellingPrice, setGenSellingPrice] = useState<number>(1499);
  const [genStock, setGenStock] = useState<number>(20);
  const [genWeight, setGenWeight] = useState<number>(250);
  const [showGenerator, setShowGenerator] = useState(false);

  // Toggle size in generator
  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  // Helper to build default SKU
  const generateSku = (pName: string, color: string, size: string) => {
    const pSlug = pName
      .trim()
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 4)
      .toUpperCase() || "VV";
    const cSlug = color
      .trim()
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 3)
      .toUpperCase() || "CLR";
    return `${pSlug}-${cSlug}-${size}`.toUpperCase();
  };

  // Run Bulk Matrix Generation
  const handleBulkGenerate = () => {
    if (selectedSizes.length === 0) return;

    const newVariants: VariantDraft[] = selectedSizes.map((size) => {
      const sku = generateSku(productName, genColor, size);
      return {
        id: crypto.randomUUID(),
        name: `${productName || "Product"} - ${genColor} - ${size}`,
        size,
        color: genColor,
        sku,
        mrp: Number(genMrp) || 0,
        sellingPrice: Number(genSellingPrice) || 0,
        stockQuantity: Number(genStock) || 0,
        weightInGrams: Number(genWeight) || 200,
      };
    });

    onChange([...variants, ...newVariants]);
    setShowGenerator(false);
  };

  // Add a blank single row
  const handleAddSingleRow = () => {
    const size = "M";
    const color = "Default";
    const sku = generateSku(productName, color, size);
    const newVariant: VariantDraft = {
      id: crypto.randomUUID(),
      name: `${productName || "Product"} - ${size}`,
      size,
      color,
      sku,
      mrp: 1499,
      sellingPrice: 999,
      stockQuantity: 10,
      weightInGrams: 200,
    };
    onChange([...variants, newVariant]);
  };

  const handleUpdateRow = (
    id: string,
    field: keyof VariantDraft,
    value: string | number
  ) => {
    onChange(
      variants.map((v) => {
        if (v.id !== id) return v;
        const updated = { ...v, [field]: value };
        if (field === "size" || field === "color") {
          updated.name = `${productName || "Product"} - ${updated.color} - ${updated.size}`;
        }
        return updated;
      })
    );
  };

  const handleDeleteRow = (id: string) => {
    onChange(variants.filter((v) => v.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            Product Variant Matrix
          </h3>
          <p className="text-xs text-slate-500">
            Define sizes, colors, SKUs, inventory stock, and Indian MRP/Selling Price tiers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGenerator(!showGenerator)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition-colors"
          >
            <Wand2 className="w-3.5 h-3.5" />
            {showGenerator ? "Hide Matrix Tool" : "Auto-Generate Matrix"}
          </button>
          <button
            type="button"
            onClick={handleAddSingleRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Row
          </button>
        </div>
      </div>

      {/* Bulk Matrix Generator Panel */}
      {showGenerator && (
        <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200/80 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-indigo-200/60">
            <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
              Quick Size Matrix Generator
            </span>
            <span className="text-xs text-indigo-700">
              Select apparel sizes to bulk-populate variants
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-indigo-900 mb-1">
                Color Name
              </label>
              <input
                type="text"
                value={genColor}
                onChange={(e) => setGenColor(e.target.value)}
                placeholder="e.g. Navy Blue"
                className="w-full px-3 py-1.5 bg-white text-xs rounded-lg border border-indigo-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-indigo-900 mb-1">
                Base MRP (₹)
              </label>
              <input
                type="number"
                value={genMrp}
                onChange={(e) => setGenMrp(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white text-xs rounded-lg border border-indigo-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-indigo-900 mb-1">
                Selling Price (₹)
              </label>
              <input
                type="number"
                value={genSellingPrice}
                onChange={(e) => setGenSellingPrice(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white text-xs rounded-lg border border-indigo-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-indigo-900 mb-1">
                Opening Stock
              </label>
              <input
                type="number"
                value={genStock}
                onChange={(e) => setGenStock(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white text-xs rounded-lg border border-indigo-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-indigo-900 mb-1">
                Weight (grams)
              </label>
              <input
                type="number"
                value={genWeight}
                onChange={(e) => setGenWeight(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white text-xs rounded-lg border border-indigo-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-indigo-900 mb-2">
              Select Sizes to Generate:
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_SIZES.map((size) => {
                const isSelected = selectedSizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold border transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-white text-slate-700 border-indigo-200 hover:border-indigo-400"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleBulkGenerate}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              Populate {selectedSizes.length} Variants
            </button>
          </div>
        </div>
      )}

      {/* Variant Rows Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Size</th>
                <th className="py-3 px-3">Color</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">MRP (₹)</th>
                <th className="py-3 px-3">Selling Price (₹)</th>
                <th className="py-3 px-3">Stock Units</th>
                <th className="py-3 px-3">Weight (g)</th>
                <th className="py-3 px-3 text-center">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {variants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No variants drafted yet. Use "Auto-Generate Matrix" or "Add Row".
                  </td>
                </tr>
              ) : (
                variants.map((v) => {
                  const hasPriceViolation = v.sellingPrice > v.mrp;

                  return (
                    <tr
                      key={v.id}
                      className={
                        hasPriceViolation
                          ? "bg-rose-50/50 hover:bg-rose-50"
                          : "hover:bg-slate-50"
                      }
                    >
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          required
                          value={v.size}
                          onChange={(e) =>
                            handleUpdateRow(v.id, "size", e.target.value)
                          }
                          placeholder="M"
                          className="w-16 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800"
                        />
                      </td>

                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          required
                          value={v.color}
                          onChange={(e) =>
                            handleUpdateRow(v.id, "color", e.target.value)
                          }
                          placeholder="Navy"
                          className="w-24 px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
                        />
                      </td>

                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          required
                          value={v.sku}
                          onChange={(e) =>
                            handleUpdateRow(
                              v.id,
                              "sku",
                              e.target.value.toUpperCase()
                            )
                          }
                          placeholder="SKU"
                          className="w-32 px-2 py-1 bg-white border border-slate-200 rounded font-mono text-xs text-slate-800"
                        />
                      </td>

                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          required
                          min={1}
                          value={v.mrp}
                          onChange={(e) =>
                            handleUpdateRow(v.id, "mrp", Number(e.target.value))
                          }
                          className="w-24 px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
                        />
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            required
                            min={1}
                            value={v.sellingPrice}
                            onChange={(e) =>
                              handleUpdateRow(
                                v.id,
                                "sellingPrice",
                                Number(e.target.value)
                              )
                            }
                            className={`w-24 px-2 py-1 bg-white border rounded text-xs text-slate-800 ${
                              hasPriceViolation
                                ? "border-rose-500 focus:ring-rose-500"
                                : "border-slate-200"
                            }`}
                          />
                          {hasPriceViolation && (
                            <div
                              title="Legal Metrology Act: Selling Price cannot exceed MRP"
                              className="text-rose-500"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          required
                          min={0}
                          value={v.stockQuantity}
                          onChange={(e) =>
                            handleUpdateRow(
                              v.id,
                              "stockQuantity",
                              Number(e.target.value)
                            )
                          }
                          className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
                        />
                      </td>

                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          min={0}
                          value={v.weightInGrams}
                          onChange={(e) =>
                            handleUpdateRow(
                              v.id,
                              "weightInGrams",
                              Number(e.target.value)
                            )
                          }
                          className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
                        />
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(v.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
