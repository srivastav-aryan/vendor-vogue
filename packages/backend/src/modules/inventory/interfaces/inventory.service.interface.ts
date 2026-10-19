import mongoose from "mongoose";
import { ICartReservation } from "../models/cartReservation.model.js";
import { IInventoryEvent } from "../models/inventoryEvent.model.js";
import { RequestContext } from "../../../shared/types/request-context.js";

export interface ReserveStockInput {
  userId: string;
  variantId: string;
  quantity: number;
  ttlMinutes?: number;
}

export interface CommitSaleInput {
  variantId: string;
  quantity: number;
  userId?: string;
  orderId: string;
}

export interface ReleaseReservationInput {
  userId: string;
  variantId: string;
  reason?: string;
  quantity?: number;
}

export interface RestockInput {
  variantId: string;
  quantity: number;
  reason?: string;
  refId?: string;
}

export interface IInventoryService {
  reserveStock(
    input: ReserveStockInput,
    ctx?: RequestContext,
    session?: mongoose.ClientSession,
  ): Promise<ICartReservation>;

  releaseReservation(
    input: ReleaseReservationInput,
    ctx?: RequestContext,
    session?: mongoose.ClientSession,
  ): Promise<void>;

  commitSale(
    input: CommitSaleInput,
    ctx?: RequestContext,
    session?: mongoose.ClientSession,
  ): Promise<IInventoryEvent>;

  restock(
    input: RestockInput,
    ctx?: RequestContext,
    session?: mongoose.ClientSession,
  ): Promise<IInventoryEvent>;

  getAvailableStock(
    variantId: string,
    ctx?: RequestContext,
  ): Promise<number>;

  runNightlyIntegrityCheck(
    ctx?: RequestContext,
  ): Promise<{
    checkedCount: number;
    discrepancies: Array<{
      variantId: string;
      stockQuantity: number;
      ledgerSum: number;
      diff: number;
    }>;
  }>;
}
