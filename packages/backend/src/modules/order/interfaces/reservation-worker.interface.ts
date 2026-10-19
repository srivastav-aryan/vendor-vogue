import { RequestContext } from "../../../shared/types/request-context.js";

export interface ProcessExpiredOrdersResult {
  scanned: number;
  cancelled: number;
  failed: number;
  errors: Array<{ orderId: string; error: string }>;
}

export interface IReservationExpiryWorker {
  start(): void;
  stop(): void;
  processExpiredOrders(ctx?: RequestContext): Promise<ProcessExpiredOrdersResult>;
}
