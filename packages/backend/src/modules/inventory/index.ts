// === Inventory Module Public API ===
// Other modules should ONLY import from this file, never reach into internals.

export { Cart, type ICart, type ICartItem } from "./models/Cart.model.js";
export { CartReservation, type ICartReservation } from "./models/cartReservation.model.js";
export { InventoryEvent, type IInventoryEvent, type InventoryEventType } from "./models/inventoryEvent.model.js";
export { InventoryService } from "./services/inventory.service.js";
export type {
  IInventoryService,
  ReserveStockInput,
  CommitSaleInput,
  ReleaseReservationInput,
  RestockInput,
} from "./interfaces/inventory.service.interface.js";
export {
  InventoryError,
  type InventoryErrorCode,
  INVENTORY_ERROR_CODES,
} from "./errors/inventory.errors.js";

