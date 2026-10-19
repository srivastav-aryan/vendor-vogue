// === Order Module Public API ===

export {
  Order,
  type IOrder,
  type IOrderLineItem,
  type IShippingAddressSnapshot,
  ORDER_STATUS,
  type OrderStatus,
  VALID_ORDER_STATUS_TRANSITIONS,
  isValidOrderStatusTransition,
} from "./models/order.model.js";

export { OrderService } from "./services/order.service.js";
export { orderControllerCreator } from "./controllers/order.controller.js";
export { createOrderRouter } from "./routes/order.routes.js";
export {
  OrderError,
  ORDER_ERROR_CODES,
  type OrderErrorCode,
} from "./errors/order.errors.js";
export type {
  IOrderService,
  CreateCheckoutOrderInput,
  GetUserOrdersInput,
  PaginatedOrdersResult,
  MarkOrderPaidInput,
  CancelOrderInput,
  TransitionOrderStatusInput,
} from "./interfaces/order.service.interface.js";
export type { IOrderController } from "./interfaces/order.controller.interface.js";
export { ReservationExpiryWorker } from "./workers/reservation-expiry.worker.js";
export type {
  IReservationExpiryWorker,
  ProcessExpiredOrdersResult,
} from "./interfaces/reservation-worker.interface.js";
