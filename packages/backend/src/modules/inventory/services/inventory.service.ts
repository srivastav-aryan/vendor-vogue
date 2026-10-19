import mongoose from "mongoose";
import { ProductVariant } from "../../catalog/models/productVariant.model.js";
import { CartReservation, ICartReservation } from "../models/cartReservation.model.js";
import { InventoryEvent, IInventoryEvent } from "../models/inventoryEvent.model.js";
import {
  CommitSaleInput,
  IInventoryService,
  ReleaseReservationInput,
  ReserveStockInput,
  RestockInput,
} from "../interfaces/inventory.service.interface.js";
import { InventoryError } from "../errors/inventory.errors.js";
import { RequestContext } from "../../../shared/types/request-context.js";

export class InventoryService implements IInventoryService {
  /**
   * Soft reservation at checkout intent ("Proceed to Pay").
   * Guaranteed atomic with $inc and $expr check to prevent overselling.
   */
  async reserveStock(
    input: ReserveStockInput,
    ctx?: RequestContext,
    session?: mongoose.ClientSession,
  ): Promise<ICartReservation> {
    const { userId, variantId, quantity, ttlMinutes = 15 } = input;

    if (!quantity || quantity <= 0) {
      throw new InventoryError(
        "INVALID_QUANTITY",
        "Reservation quantity must be greater than zero",
        400,
      );
    }

    ctx?.logger?.info(
      { userId, variantId, quantity },
      "Reserving stock for checkout intent",
    );

    // Atomically find variant where (stockQuantity - reservedQuantity) >= quantity
    // and increment reservedQuantity. If stock unavailable, returns null immediately.
    const query = {
      _id: variantId,
      isActive: true,
      $expr: {
        $gte: [
          { $subtract: ["$stockQuantity", "$reservedQuantity"] },
          quantity,
        ],
      },
    };

    const updatedVariant = await ProductVariant.findOneAndUpdate(
      query,
      { $inc: { reservedQuantity: quantity } },
      { new: true, session },
    );

    if (!updatedVariant) {
      // Check if variant exists to give precise error
      const exists = await ProductVariant.findById(variantId).session(
        session ?? null,
      );
      if (!exists) {
        ctx?.logger?.warn({ variantId }, "Variant not found for reservation");
        throw new InventoryError(
          "VARIANT_NOT_FOUND",
          "Product variant not found",
          404,
        );
      }

      ctx?.logger?.warn(
        {
          variantId,
          requested: quantity,
          available: exists.stockQuantity - exists.reservedQuantity,
        },
        "Insufficient available stock for reservation",
      );
      throw new InventoryError(
        "INSUFFICIENT_STOCK",
        "Insufficient stock available for this item",
        409,
      );
    }

    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    // Upsert or create CartReservation document for user + variant
    const reservation = await CartReservation.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId), productVariantId: new mongoose.Types.ObjectId(variantId) },
      {
        $inc: { reservedQuantity: quantity },
        $set: { expiresAt },
      },
      { upsert: true, new: true, session },
    );

    // Record immutable audit event
    await InventoryEvent.create(
      [
        {
          productVariantId: variantId,
          eventType: "RESERVATION_CREATED",
          delta: 0, // stockQuantity not yet deducted, reservedQuantity increased
          ResultingStockQuantity: updatedVariant.stockQuantity,
          ResultingReservedQuantity: updatedVariant.reservedQuantity,
          reason: `Reserved ${quantity} units for user ${userId}`,
          refId: reservation._id as mongoose.Types.ObjectId,
        },
      ],
      { session },
    );

    ctx?.logger?.info(
      { variantId, reservationId: reservation._id },
      "Stock reserved successfully",
    );

    return reservation;
  }

  /**
   * Release reservation when user cancels, changes cart, or reservation expires.
   */
  async releaseReservation(
    input: ReleaseReservationInput,
    ctx?: RequestContext,
    session?: mongoose.ClientSession,
  ): Promise<void> {
    const { userId, variantId, reason = "User cancelled or cart modified" } = input;

    ctx?.logger?.info({ userId, variantId }, "Releasing reservation");

    const reservation = await CartReservation.findOneAndDelete(
      { userId: new mongoose.Types.ObjectId(userId), productVariantId: new mongoose.Types.ObjectId(variantId) },
      { session },
    );

    let qtyToRelease = reservation ? reservation.reservedQuantity : (input.quantity || 0);

    if (qtyToRelease <= 0) {
      ctx?.logger?.info({ userId, variantId }, "No active reservation to release");
      return;
    }

    // Atomically decrement reservedQuantity
    const variant = await ProductVariant.findOneAndUpdate(
      { _id: variantId },
      { $inc: { reservedQuantity: -qtyToRelease } },
      { new: true, session },
    );

    if (variant) {
      await InventoryEvent.create(
        [
          {
            productVariantId: variantId,
            eventType: "RESERVATION_EXPIRED",
            delta: 0,
            ResultingStockQuantity: variant.stockQuantity,
            ResultingReservedQuantity: Math.max(0, variant.reservedQuantity),
            reason,
            refId: (reservation?._id as mongoose.Types.ObjectId) || undefined,
          },
        ],
        { session },
      );
    }

    ctx?.logger?.info(
      { variantId, released: qtyToRelease },
      "Reservation released and stock returned to pool",
    );
  }

  /**
   * Commit sale after successful payment.
   * Decrements stockQuantity and reservedQuantity (if reserved).
   */
  async commitSale(
    input: CommitSaleInput,
    ctx?: RequestContext,
    session?: mongoose.ClientSession,
  ): Promise<IInventoryEvent> {
    const { variantId, quantity, userId, orderId } = input;

    if (!quantity || quantity <= 0) {
      throw new InventoryError(
        "INVALID_QUANTITY",
        "Sale quantity must be positive",
        400,
      );
    }

    ctx?.logger?.info(
      { variantId, quantity, orderId, userId },
      "Committing inventory sale",
    );

    let updatedVariant;

    if (userId) {
      // Find and remove cart reservation if one exists for this user
      const reservation = await CartReservation.findOneAndDelete(
        { userId: new mongoose.Types.ObjectId(userId), productVariantId: new mongoose.Types.ObjectId(variantId) },
        { session },
      );

      const reservedToDeduct = reservation ? reservation.reservedQuantity : 0;

      // Atomically decrement stockQuantity and reservedQuantity
      updatedVariant = await ProductVariant.findOneAndUpdate(
        {
          _id: variantId,
          stockQuantity: { $gte: quantity },
        },
        {
          $inc: {
            stockQuantity: -quantity,
            reservedQuantity: -reservedToDeduct,
          },
        },
        { new: true, session },
      );
    } else {
      // Direct sale without prior user reservation (e.g. guest or POS)
      updatedVariant = await ProductVariant.findOneAndUpdate(
        {
          _id: variantId,
          $expr: {
            $gte: [
              { $subtract: ["$stockQuantity", "$reservedQuantity"] },
              quantity,
            ],
          },
        },
        {
          $inc: { stockQuantity: -quantity },
        },
        { new: true, session },
      );
    }

    if (!updatedVariant) {
      ctx?.logger?.error(
        { variantId, quantity, orderId },
        "Failed to commit sale: insufficient stock",
      );
      throw new InventoryError(
        "INSUFFICIENT_STOCK",
        "Insufficient stock to complete sale",
        409,
      );
    }

    // Append to immutable audit ledger
    const [event] = await InventoryEvent.create(
      [
        {
          productVariantId: variantId,
          eventType: "SALE",
          delta: -quantity,
          ResultingStockQuantity: updatedVariant.stockQuantity,
          ResultingReservedQuantity: updatedVariant.reservedQuantity,
          reason: `Order confirmed #${orderId}`,
          refId: new mongoose.Types.ObjectId(orderId),
        },
      ],
      { session },
    );

    ctx?.logger?.info(
      { variantId, orderId, newStock: updatedVariant.stockQuantity },
      "Sale committed to ledger successfully",
    );

    return event;
  }

  /**
   * Restock units from supplier arrival or return.
   */
  async restock(
    input: RestockInput,
    ctx?: RequestContext,
    session?: mongoose.ClientSession,
  ): Promise<IInventoryEvent> {
    const { variantId, quantity, reason = "Shipment received", refId } = input;

    if (!quantity || quantity <= 0) {
      throw new InventoryError(
        "INVALID_QUANTITY",
        "Restock quantity must be positive",
        400,
      );
    }

    ctx?.logger?.info({ variantId, quantity, reason }, "Restocking variant");

    const updatedVariant = await ProductVariant.findOneAndUpdate(
      { _id: variantId },
      { $inc: { stockQuantity: quantity } },
      { new: true, session },
    );

    if (!updatedVariant) {
      throw new InventoryError(
        "VARIANT_NOT_FOUND",
        "Product variant not found for restock",
        404,
      );
    }

    const [event] = await InventoryEvent.create(
      [
        {
          productVariantId: variantId,
          eventType: "RESTOCK",
          delta: quantity,
          ResultingStockQuantity: updatedVariant.stockQuantity,
          ResultingReservedQuantity: updatedVariant.reservedQuantity,
          reason,
          refId: refId ? new mongoose.Types.ObjectId(refId) : undefined,
        },
      ],
      { session },
    );

    ctx?.logger?.info(
      { variantId, newStock: updatedVariant.stockQuantity },
      "Restock recorded to ledger",
    );

    return event;
  }

  /**
   * Current available stock: physical stockQuantity minus reservedQuantity
   */
  async getAvailableStock(
    variantId: string,
    ctx?: RequestContext,
  ): Promise<number> {
    const variant = await ProductVariant.findById(variantId).select(
      "stockQuantity reservedQuantity",
    );

    if (!variant) {
      throw new InventoryError(
        "VARIANT_NOT_FOUND",
        "Product variant not found",
        404,
      );
    }

    return Math.max(0, variant.stockQuantity - variant.reservedQuantity);
  }

  /**
   * Nightly integrity check:
   * Sums all InventoryEvent delta values for every variant and compares against stockQuantity.
   */
  async runNightlyIntegrityCheck(ctx?: RequestContext): Promise<{
    checkedCount: number;
    discrepancies: Array<{
      variantId: string;
      stockQuantity: number;
      ledgerSum: number;
      diff: number;
    }>;
  }> {
    ctx?.logger?.info("Starting nightly inventory integrity check");

    // Aggregate deltas from InventoryEvent grouped by productVariantId
    const ledgerAggregations = await InventoryEvent.aggregate([
      {
        $group: {
          _id: "$productVariantId",
          totalDelta: { $sum: "$delta" },
        },
      },
    ]);

    const ledgerMap = new Map<string, number>();
    for (const entry of ledgerAggregations) {
      ledgerMap.set(entry._id.toString(), entry.totalDelta);
    }

    // Fetch all variants
    const allVariants = await ProductVariant.find({}).select("_id stockQuantity");

    const discrepancies: Array<{
      variantId: string;
      stockQuantity: number;
      ledgerSum: number;
      diff: number;
    }> = [];

    for (const v of allVariants) {
      const vId = v._id.toString();
      const ledgerSum = ledgerMap.get(vId) ?? 0;

      if (v.stockQuantity !== ledgerSum) {
        discrepancies.push({
          variantId: vId,
          stockQuantity: v.stockQuantity,
          ledgerSum,
          diff: v.stockQuantity - ledgerSum,
        });
      }
    }

    ctx?.logger?.info(
      { totalChecked: allVariants.length, discrepanciesFound: discrepancies.length },
      "Nightly inventory integrity check completed",
    );

    return {
      checkedCount: allVariants.length,
      discrepancies,
    };
  }
}
