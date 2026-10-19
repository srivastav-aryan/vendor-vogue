import { IOrderService } from "../interfaces/order.service.interface.js";
import {
  IReservationExpiryWorker,
  ProcessExpiredOrdersResult,
} from "../interfaces/reservation-worker.interface.js";
import { Order, ORDER_STATUS } from "../models/order.model.js";
import { RequestContext } from "../../../shared/types/request-context.js";
import { logger } from "../../../shared/utils/logging.utils.js";

export interface ReservationExpiryWorkerOptions {
  intervalMs?: number;
  batchSize?: number;
}

export class ReservationExpiryWorker implements IReservationExpiryWorker {
  private timer: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private readonly intervalMs: number;
  private readonly batchSize: number;

  constructor(
    private readonly orderService: IOrderService,
    options?: ReservationExpiryWorkerOptions,
  ) {
    this.intervalMs = options?.intervalMs ?? 2 * 60 * 1000; // 2 minutes default
    this.batchSize = options?.batchSize ?? 50; // 50 orders per sweep
  }

  /**
   * Starts the background scheduler loop.
   */
  start(): void {
    if (this.timer) {
      logger.warn("ReservationExpiryWorker is already running");
      return;
    }

    logger.info(
      { intervalMs: this.intervalMs, batchSize: this.batchSize },
      "Starting ReservationExpiryWorker",
    );

    this.timer = setInterval(() => {
      this.processExpiredOrders().catch((err) => {
        logger.error({ err }, "Unhandled error in ReservationExpiryWorker tick");
      });
    }, this.intervalMs);

    // Allow process to exit cleanly without keeping event loop artificially alive if unreferenced
    this.timer.unref();
  }

  /**
   * Stops the background scheduler loop gracefully.
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info("ReservationExpiryWorker stopped");
    }
  }

  /**
   * Finds orders in PENDING_PAYMENT whose reservationExpiresAt has passed,
   * and cancels them to return reserved stock to the active pool.
   *
   * Can be invoked directly on-demand (e.g. in integration tests or manual admin trigger).
   */
  async processExpiredOrders(
    ctx?: RequestContext,
  ): Promise<ProcessExpiredOrdersResult> {
    const log = ctx?.logger || logger;

    // Overlap guard: Prevent concurrent overlapping sweeps
    if (this.isProcessing) {
      log.warn("ReservationExpiryWorker sweep skipped: previous sweep still in progress");
      return { scanned: 0, cancelled: 0, failed: 0, errors: [] };
    }

    this.isProcessing = true;
    const now = new Date();

    const result: ProcessExpiredOrdersResult = {
      scanned: 0,
      cancelled: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Find candidate orders using compound index { status: 1, reservationExpiresAt: 1 }
      const expiredOrders = await Order.find({
        status: ORDER_STATUS.PENDING_PAYMENT,
        reservationExpiresAt: { $lt: now },
      })
        .select("_id userId status reservationExpiresAt")
        .limit(this.batchSize)
        .lean();

      result.scanned = expiredOrders.length;

      if (expiredOrders.length === 0) {
        return result;
      }

      log.info(
        { count: expiredOrders.length, before: now.toISOString() },
        "Processing expired pending reservations",
      );

      for (const order of expiredOrders) {
        const orderIdStr = order._id.toString();
        try {
          await this.orderService.cancelOrder(
            {
              orderId: orderIdStr,
              reason: "Payment window expired (15m checkout TTL exceeded)",
            },
            ctx,
          );
          result.cancelled++;
        } catch (err: any) {
          result.failed++;
          result.errors.push({
            orderId: orderIdStr,
            error: err?.message || String(err),
          });

          // Log at warn level: might be a race condition where payment was confirmed concurrently
          log.warn(
            { orderId: orderIdStr, err: err?.message },
            "Failed to cancel expired reservation order (likely paid or cancelled concurrently)",
          );
        }
      }

      log.info(
        {
          scanned: result.scanned,
          cancelled: result.cancelled,
          failed: result.failed,
        },
        "Reservation expiry sweep completed",
      );

      return result;
    } finally {
      this.isProcessing = false;
    }
  }
}
