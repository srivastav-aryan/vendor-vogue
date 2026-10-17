import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";
import { InventoryService } from "../../src/modules/inventory/services/inventory.service.js";
import { ProductVariant } from "../../src/modules/catalog/models/productVariant.model.js";
import { Product } from "../../src/modules/catalog/models/product.model.js";
import { Brand } from "../../src/modules/catalog/models/brand.model.js";
import { Category } from "../../src/modules/catalog/models/category.model.js";
import { CartReservation } from "../../src/modules/inventory/models/cartReservation.model.js";
import { InventoryEvent } from "../../src/modules/inventory/models/inventoryEvent.model.js";
import { InventoryError } from "../../src/modules/inventory/errors/inventory.errors.js";

describe("Integration: Inventory Integrity System", () => {
  const inventoryService = new InventoryService();

  let testVariantId: string;
  let testUserIdA: string;
  let testUserIdB: string;

  beforeEach(async () => {
    testUserIdA = new mongoose.Types.ObjectId().toString();
    testUserIdB = new mongoose.Types.ObjectId().toString();

    const brand = await Brand.create({
      name: "Inventory Test Brand",
      slug: "inv-brand",
      description: "Brand for testing inventory",
      isActive: true,
    });

    const category = await Category.create({
      name: "Inventory Test Category",
      slug: "inv-category",
      description: "Category for testing inventory",
      isActive: true,
    });

    const product = await Product.create({
      name: "Inventory Test Shirt",
      slug: "inv-shirt",
      description: "High quality test shirt with exact inventory counts",
      category: category.id,
      brand: brand.id,
      hsnCode: "620520",
      gstRate: 5,
      isActive: true,
    });

    // Create a variant with exactly 1 unit in physical stock
    const variant = await ProductVariant.create({
      productId: product.id,
      name: "Test Shirt - Navy M",
      slug: "inv-navy-m",
      sku: "INV-NVY-M",
      sellingPrice: 999,
      mrp: 1499,
      stockQuantity: 1, // Only 1 physical unit
      reservedQuantity: 0,
      attributes: [{ name: "Size", value: "M" }],
      images: [],
      isActive: true,
    });

    testVariantId = variant.id;

    // Seed the initial opening stock event in ledger
    await InventoryEvent.create({
      productVariantId: variant.id,
      eventType: "RESTOCK",
      delta: 1,
      ResultingStockQuantity: 1,
      ResultingReservedQuantity: 0,
      reason: "Initial opening stock",
    });
  });

  describe("Atomic Stock Operations & Concurrency (Cannot Oversell)", () => {
    it("reserves stock atomically and creates CartReservation document and audit event", async () => {
      const reservation = await inventoryService.reserveStock({
        userId: testUserIdA,
        variantId: testVariantId,
        quantity: 1,
        ttlMinutes: 15,
      });

      expect(reservation).toBeDefined();
      expect(reservation.reservedQuantity).toBe(1);

      const variant = await ProductVariant.findById(testVariantId);
      expect(variant?.stockQuantity).toBe(1);
      expect(variant?.reservedQuantity).toBe(1);

      const available = await inventoryService.getAvailableStock(testVariantId);
      expect(available).toBe(0);

      const event = await InventoryEvent.findOne({
        productVariantId: testVariantId,
        eventType: "RESERVATION_CREATED",
      });
      expect(event).toBeDefined();
      expect(event?.ResultingReservedQuantity).toBe(1);
    });

    it("two concurrent buyers attempting to reserve the last 1 item: only one succeeds, other fails", async () => {
      const results = await Promise.allSettled([
        inventoryService.reserveStock({
          userId: testUserIdA,
          variantId: testVariantId,
          quantity: 1,
        }),
        inventoryService.reserveStock({
          userId: testUserIdB,
          variantId: testVariantId,
          quantity: 1,
        }),
      ]);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      const rejectedError = (rejected[0] as PromiseRejectedResult).reason;
      expect(rejectedError).toBeInstanceOf(InventoryError);
      expect(rejectedError.code).toBe("INSUFFICIENT_STOCK");

      const variant = await ProductVariant.findById(testVariantId);
      expect(variant?.stockQuantity).toBe(1);
      expect(variant?.reservedQuantity).toBe(1);
    });

    it("rejects reservation if requested quantity exceeds available stock", async () => {
      await expect(
        inventoryService.reserveStock({
          userId: testUserIdA,
          variantId: testVariantId,
          quantity: 5,
        }),
      ).rejects.toThrow(InventoryError);
    });
  });

  describe("Reservation Expiry & Rollback", () => {
    it("releases reserved stock when customer cancels or abandons, returning stock to the pool", async () => {
      await inventoryService.reserveStock({
        userId: testUserIdA,
        variantId: testVariantId,
        quantity: 1,
      });

      expect(await inventoryService.getAvailableStock(testVariantId)).toBe(0);

      await inventoryService.releaseReservation({
        userId: testUserIdA,
        variantId: testVariantId,
        reason: "Customer cancelled checkout",
      });

      const available = await inventoryService.getAvailableStock(testVariantId);
      expect(available).toBe(1);

      const reservationDoc = await CartReservation.findOne({
        userId: testUserIdA,
        productVariantId: testVariantId,
      });
      expect(reservationDoc).toBeNull();

      const releaseEvent = await InventoryEvent.findOne({
        productVariantId: testVariantId,
        eventType: "RESERVATION_EXPIRED",
      });
      expect(releaseEvent).toBeDefined();
      expect(releaseEvent?.ResultingReservedQuantity).toBe(0);
    });
  });

  describe("Sale Commitment & Inventory Ledger", () => {
    it("commits sale after successful payment, decrementing both physical stock and reservedQuantity", async () => {
      const orderId = new mongoose.Types.ObjectId().toString();

      await inventoryService.reserveStock({
        userId: testUserIdA,
        variantId: testVariantId,
        quantity: 1,
      });

      const saleEvent = await inventoryService.commitSale({
        variantId: testVariantId,
        quantity: 1,
        userId: testUserIdA,
        orderId,
      });

      expect(saleEvent).toBeDefined();
      expect(saleEvent.delta).toBe(-1);
      expect(saleEvent.ResultingStockQuantity).toBe(0);
      expect(saleEvent.ResultingReservedQuantity).toBe(0);

      const variant = await ProductVariant.findById(testVariantId);
      expect(variant?.stockQuantity).toBe(0);
      expect(variant?.reservedQuantity).toBe(0);

      const reservation = await CartReservation.findOne({
        userId: testUserIdA,
        productVariantId: testVariantId,
      });
      expect(reservation).toBeNull();
    });

    it("rejects commitSale when physical stock is 0", async () => {
      const orderId = new mongoose.Types.ObjectId().toString();

      await inventoryService.commitSale({
        variantId: testVariantId,
        quantity: 1,
        orderId,
      });

      await expect(
        inventoryService.commitSale({
          variantId: testVariantId,
          quantity: 1,
          orderId: new mongoose.Types.ObjectId().toString(),
        }),
      ).rejects.toThrow(InventoryError);
    });
  });

  describe("Restock & Nightly Integrity Audit", () => {
    it("restocks physical units and records positive delta in ledger", async () => {
      const restockEvent = await inventoryService.restock({
        variantId: testVariantId,
        quantity: 10,
        reason: "Supplier batch PO-2026-10",
      });

      expect(restockEvent.delta).toBe(10);
      expect(restockEvent.ResultingStockQuantity).toBe(11);

      const variant = await ProductVariant.findById(testVariantId);
      expect(variant?.stockQuantity).toBe(11);
    });

    it("nightly integrity check detects discrepancies when stock diverges from ledger sum", async () => {
      const orderId = new mongoose.Types.ObjectId().toString();
      await inventoryService.commitSale({
        variantId: testVariantId,
        quantity: 1,
        orderId,
      });
      await inventoryService.restock({
        variantId: testVariantId,
        quantity: 5,
      });

      const cleanCheck = await inventoryService.runNightlyIntegrityCheck();
      expect(cleanCheck.discrepancies).toHaveLength(0);

      // Corrupt stockQuantity manually (simulating a direct bypass bug)
      await ProductVariant.updateOne(
        { _id: testVariantId },
        { $set: { stockQuantity: 99 } },
      );

      const alertCheck = await inventoryService.runNightlyIntegrityCheck();
      expect(alertCheck.discrepancies).toHaveLength(1);
      expect(alertCheck.discrepancies[0].variantId).toBe(testVariantId);
      expect(alertCheck.discrepancies[0].stockQuantity).toBe(99);
      expect(alertCheck.discrepancies[0].ledgerSum).toBe(5);
      expect(alertCheck.discrepancies[0].diff).toBe(94);
    });
  });
});
