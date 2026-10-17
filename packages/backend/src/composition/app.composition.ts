import { env } from "../shared/config/env.js";
import {
  authControllerCreator,
  AuthServices,
  RateLimiterService,
  UserServices,
  SessionService,
  TokenService,
  AuthControllerInterface,
  createAuthMiddleware,
  UserServiceInterface,
  SessionServiceInterface,
  TokenServiceInterface,
  IAuthService,
  createAuthRouter,
} from "../modules/identity/index.js";
import {
  BrandService,
  brandControllerCreator,
  BrandControllerInterface,
  createBrandRouter,
  CategoryService,
  categoryControllerCreator,
  ICategoryControllerInterface,
  createCategoryRouter,
  ProductService,
  productControllerCreator,
  ProductControllerInterface,
  createProductRouter,
  VariantService,
  variantControllerCreator,
  VariantControllerInterface,
  createVariantRouter,
} from "../modules/catalog/index.js";

// ******** Identity Module ********
// --- Services ---
const userServices: UserServiceInterface= new UserServices();
const sessionService: SessionServiceInterface = new SessionService();
const tokenService: TokenServiceInterface = new TokenService();
const authServices: IAuthService = new AuthServices(
  userServices,
  sessionService,
  tokenService,
);
// --- Rate Limiter ---
const loginLimiter = new RateLimiterService(
  Number(env.LOGIN_WINDOW_MS),
  Number(env.LOGIN_MAX_ATTEMPTS),
);
// --- Controllers ---
export const authController: AuthControllerInterface = authControllerCreator(authServices, loginLimiter, tokenService);
// --- Middleware ---
export const authenticateMiddleware = createAuthMiddleware(tokenService, userServices);
 // -- Router ---
 export const authRouter = createAuthRouter(authController) 


// *********** Catalog Module**********
// --- Brand ---
const brandService = new BrandService();
export const brandController: BrandControllerInterface = brandControllerCreator(brandService);
export const brandRouter = createBrandRouter(brandController, authenticateMiddleware);

// --- Category ---
const categoryService = new CategoryService();
export const categoryController: ICategoryControllerInterface = categoryControllerCreator(categoryService);
export const categoryRouter = createCategoryRouter(categoryController, authenticateMiddleware);

// --- Product & Variants ---
const variantService = new VariantService();
export const variantController: VariantControllerInterface = variantControllerCreator(variantService);
export const variantRouter = createVariantRouter(variantController, authenticateMiddleware);

const productService = new ProductService();
export const productController: ProductControllerInterface = productControllerCreator(productService);
export const productRouter = createProductRouter(productController, variantController, authenticateMiddleware);

// *********** Inventory Module **********
import { InventoryService } from "../modules/inventory/index.js";
export const inventoryService = new InventoryService();

// *********** Pricing Module **********
import { PricingService } from "../modules/pricing/index.js";
export const pricingService = new PricingService();

// *********** Cart Module **********
import {
  CartService,
  cartControllerCreator,
  createCartRouter,
  ICartController,
  ICartService,
} from "../modules/cart/index.js";
export const cartService: ICartService = new CartService(pricingService);
export const cartController: ICartController = cartControllerCreator(cartService);
export const cartRouter = createCartRouter(cartController, authenticateMiddleware);

// *********** Payment Gateway Module **********
import { RazorpayPaymentService } from "../modules/payment/index.js";
export const paymentGatewayService = new RazorpayPaymentService(
  env.RAZORPAY_KEY_ID,
  env.RAZORPAY_KEY_SECRET,
  env.RAZORPAY_WEBHOOK_SECRET,
);

// *********** Order Module **********
import {
  OrderService,
  orderControllerCreator,
  createOrderRouter,
  IOrderController,
  IOrderService,
} from "../modules/order/index.js";
export const orderService: IOrderService = new OrderService(
  pricingService,
  inventoryService,
  paymentGatewayService,
);
export const orderController: IOrderController = orderControllerCreator(orderService);
export const orderRouter = createOrderRouter(orderController, authenticateMiddleware);



