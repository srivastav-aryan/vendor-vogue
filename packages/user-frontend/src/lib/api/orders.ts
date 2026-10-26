import { apiClient } from "@/lib/api/client";
import type {
  CreateCheckoutOrderInputDto,
  VerifyPaymentInputDto,
} from "@e-com/shared/schemas";
import type { OrderDto } from "@e-com/shared/types";

export interface OrderApiResponse<T = OrderDto> {
  success: boolean;
  data: T;
  pagination?: {
    total: number;
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  message?: string;
}

export interface UserOrdersListResponse {
  success: boolean;
  data: OrderDto[];
  pagination: {
    total: number;
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Creates a checkout order from the user's active backend cart,
 * locking pricing and reserving inventory for 15 minutes.
 */
export async function createCheckoutOrder(
  input: CreateCheckoutOrderInputDto
): Promise<OrderDto> {
  const res = await apiClient.post<OrderApiResponse>("/api/orders/checkout", input);
  if (!res.success || !res.data) {
    throw new Error(res.message || "Failed to create checkout order");
  }
  return res.data;
}

/**
 * Verifies Razorpay payment signature and transitions order to PAID status.
 */
export async function verifyPayment(
  input: VerifyPaymentInputDto
): Promise<OrderDto> {
  const res = await apiClient.post<OrderApiResponse>(
    "/api/orders/payment/verify",
    input
  );
  if (!res.success || !res.data) {
    throw new Error(res.message || "Payment signature verification failed");
  }
  return res.data;
}

/**
 * Fetches an order by its ID with authorization check.
 */
export async function getOrderById(orderId: string): Promise<OrderDto | null> {
  try {
    const res = await apiClient.get<OrderApiResponse>(`/api/orders/${orderId}`);
    return res.data || null;
  } catch (error) {
    console.warn(`[Order API] Failed to fetch order ${orderId}:`, error);
    return null;
  }
}

/**
 * Fetches the current user's paginated orders list.
 */
export async function getUserOrders(params: {
  page?: number;
  limit?: number;
  status?: string;
} = {}): Promise<{ items: OrderDto[]; pagination: UserOrdersListResponse["pagination"] }> {
  try {
    const res = await apiClient.get<UserOrdersListResponse>("/api/orders", {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        status: params.status,
      },
    });

    return {
      items: res.data || [],
      pagination: res.pagination || {
        total: (res.data || []).length,
        totalCount: (res.data || []).length,
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  } catch (error) {
    console.warn("[Order API] Failed to fetch user orders:", error);
    return {
      items: [],
      pagination: {
        total: 0,
        totalCount: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }
}
