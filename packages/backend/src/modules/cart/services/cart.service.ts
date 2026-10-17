import mongoose from "mongoose";
import { Cart, ICart } from "../../inventory/models/Cart.model.js";
import { ProductVariant } from "../../catalog/models/productVariant.model.js";
import { Product } from "../../catalog/models/product.model.js";
import { IPricingService } from "../../pricing/interfaces/pricing.service.interface.js";
import {
  AddToCartInput,
  CartItemSummary,
  CartSummary,
  ICartService,
  UpdateCartItemInput,
} from "../interfaces/cart.service.interface.js";
import { CartError } from "../errors/cart.errors.js";
import { RequestContext } from "../../../shared/types/request-context.js";
import { EvaluateCartItemInput } from "../../pricing/interfaces/pricing.service.interface.js";
import { roundToTwoDecimals } from "../../../shared/utils/gst.utils.js";

export class CartService implements ICartService {
  constructor(private readonly pricingService: IPricingService) {}

  /**
   * Retrieves or initializes the user's cart.
   */
  private async getOrCreateCart(
    userId: string,
    session?: mongoose.ClientSession,
  ): Promise<ICart> {
    let cart = await Cart.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    }).session(session ?? null);

    if (!cart) {
      const [newCart] = await Cart.create(
        [
          {
            userId: new mongoose.Types.ObjectId(userId),
            items: [],
          },
        ],
        { session },
      );
      cart = newCart;
    }

    return cart;
  }

  /**
   * Builds dynamic live cart summary with variant details, pricing rules, and GST calculations.
   */
  private async buildCartSummary(
    cart: ICart,
    couponCode?: string,
    ctx?: RequestContext,
  ): Promise<CartSummary> {
    if (!cart.items || cart.items.length === 0) {
      return {
        cartId: cart._id.toString(),
        userId: cart.userId.toString(),
        items: [],
        itemCount: 0,
        cartSubtotal: 0,
        totalDiscount: 0,
        totalTaxableAmount: 0,
        totalGst: 0,
        finalPayableAmount: 0,
        appliedRuleCodes: [],
      };
    }

    const variantIds = cart.items.map((i) => i.productVariant);
    const variants = await ProductVariant.find({
      _id: { $in: variantIds },
    });
    const variantMap = new Map(variants.map((v) => [v._id.toString(), v]));

    const productIds = variants.map((v) => v.productId);
    const products = await Product.find({
      _id: { $in: productIds },
    });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const evalItems: EvaluateCartItemInput[] = [];
    const validCartItems: {
      item: (typeof cart.items)[0];
      variant: (typeof variants)[0];
      product: (typeof products)[0];
    }[] = [];

    for (const cartItem of cart.items) {
      const vId = cartItem.productVariant.toString();
      const variant = variantMap.get(vId);
      if (!variant) continue;

      const product = productMap.get(variant.productId.toString());
      if (!product) continue;

      validCartItems.push({ item: cartItem, variant, product });

      evalItems.push({
        variantId: variant._id.toString(),
        productId: product._id.toString(),
        categoryId: product.category.toString(),
        brandId: product.brand.toString(),
        hsnCode: product.hsnCode,
        unitPrice: variant.sellingPrice,
        quantity: cartItem.quantity,
      });
    }

    if (evalItems.length === 0) {
      return {
        cartId: cart._id.toString(),
        userId: cart.userId.toString(),
        items: [],
        itemCount: 0,
        cartSubtotal: 0,
        totalDiscount: 0,
        totalTaxableAmount: 0,
        totalGst: 0,
        finalPayableAmount: 0,
        appliedRuleCodes: [],
      };
    }

    // Connect to PricingService for live dynamic discount & GST calculation
    const evaluation = await this.pricingService.evaluatePricing(
      evalItems,
      couponCode,
      ctx,
    );

    const evaluatedMap = new Map(
      evaluation.items.map((ev) => [ev.variantId, ev]),
    );

    const itemSummaries: CartItemSummary[] = validCartItems.map(
      ({ item, variant, product }) => {
        const vId = variant._id.toString();
        const evaluated = evaluatedMap.get(vId)!;
        const availableStock = Math.max(
          0,
          variant.stockQuantity - variant.reservedQuantity,
        );

        return {
          variantId: vId,
          productId: product._id.toString(),
          productName: product.name,
          variantName: variant.name,
          sku: variant.sku,
          image: variant.images?.[0] || product.images?.[0] || "",
          attributes: (variant.attributes || []).map((a) => ({
            name: a.name,
            value: a.value,
            meta: a.meta,
          })),
          quantity: item.quantity,
          availableStock,
          originalUnitPrice: evaluated.originalUnitPrice,
          discountPerUnit: evaluated.discountPerUnit,
          discountedUnitPrice: evaluated.discountedUnitPrice,
          appliedRuleCode: evaluated.appliedRuleCode,
          gstRate: evaluated.gstRate,
          gstAmountPerUnit: evaluated.gstAmountPerUnit,
          taxableAmountPerUnit: evaluated.taxableAmountPerUnit,
          lineTaxTotal: evaluated.lineTaxTotal,
          lineSubtotal: evaluated.lineSubtotal,
          lineTaxableTotal: evaluated.lineTaxableTotal,
        };
      },
    );

    const totalItemCount = itemSummaries.reduce(
      (acc, it) => acc + it.quantity,
      0,
    );

    return {
      cartId: cart._id.toString(),
      userId: cart.userId.toString(),
      items: itemSummaries,
      itemCount: totalItemCount,
      cartSubtotal: evaluation.cartSubtotal,
      totalDiscount: evaluation.totalDiscount,
      totalTaxableAmount: evaluation.totalTaxableAmount,
      totalGst: evaluation.totalGst,
      finalPayableAmount: evaluation.finalPayableAmount,
      appliedRuleCodes: evaluation.appliedRuleCodes,
    };
  }

  /**
   * View live dynamic cart summary with pricing rules and GST.
   */
  async getCartSummary(
    userId: string,
    couponCode?: string,
    ctx?: RequestContext,
  ): Promise<CartSummary> {
    ctx?.logger?.info({ userId, couponCode }, "Fetching cart summary");
    const cart = await this.getOrCreateCart(userId);
    return this.buildCartSummary(cart, couponCode, ctx);
  }

  /**
   * Add a product variant to the cart.
   */
  async addItem(
    input: AddToCartInput,
    couponCode?: string,
    ctx?: RequestContext,
  ): Promise<CartSummary> {
    const { userId, variantId, quantity } = input;

    if (!quantity || quantity <= 0) {
      throw new CartError(
        "INVALID_QUANTITY",
        "Quantity must be a positive integer",
        400,
      );
    }

    const variant = await ProductVariant.findById(variantId);
    if (!variant || !variant.isActive) {
      throw new CartError(
        "VARIANT_NOT_FOUND",
        "Product variant not found or unavailable",
        404,
      );
    }

    const availableStock = variant.stockQuantity - variant.reservedQuantity;
    if (availableStock < quantity) {
      throw new CartError(
        "INSUFFICIENT_STOCK",
        `Only ${Math.max(0, availableStock)} unit(s) available in stock`,
        409,
      );
    }

    const cart = await this.getOrCreateCart(userId);

    const existingItemIndex = cart.items.findIndex(
      (i) => i.productVariant.toString() === variantId,
    );

    if (existingItemIndex > -1) {
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      if (newQuantity > availableStock) {
        throw new CartError(
          "INSUFFICIENT_STOCK",
          `Cannot add ${quantity} more. Total in cart would exceed available stock (${availableStock})`,
          409,
        );
      }
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      cart.items.push({
        productVariant: new mongoose.Types.ObjectId(variantId),
        quantity,
        addedAt: new Date(),
      });
    }

    await cart.save();
    return this.buildCartSummary(cart, couponCode, ctx);
  }

  /**
   * Updates the quantity of a variant in the cart.
   * If quantity is 0, removes the item.
   */
  async updateItemQuantity(
    input: UpdateCartItemInput,
    couponCode?: string,
    ctx?: RequestContext,
  ): Promise<CartSummary> {
    const { userId, variantId, quantity } = input;

    if (quantity < 0) {
      throw new CartError(
        "INVALID_QUANTITY",
        "Quantity cannot be negative",
        400,
      );
    }

    const cart = await this.getOrCreateCart(userId);

    const existingItemIndex = cart.items.findIndex(
      (i) => i.productVariant.toString() === variantId,
    );

    if (existingItemIndex === -1) {
      throw new CartError(
        "ITEM_NOT_IN_CART",
        "Item is not present in the cart",
        404,
      );
    }

    if (quantity === 0) {
      cart.items.splice(existingItemIndex, 1);
    } else {
      const variant = await ProductVariant.findById(variantId);
      if (!variant || !variant.isActive) {
        throw new CartError(
          "VARIANT_NOT_FOUND",
          "Product variant not found or inactive",
          404,
        );
      }

      const availableStock = variant.stockQuantity - variant.reservedQuantity;
      if (quantity > availableStock) {
        throw new CartError(
          "INSUFFICIENT_STOCK",
          `Requested quantity (${quantity}) exceeds available stock (${Math.max(0, availableStock)})`,
          409,
        );
      }

      cart.items[existingItemIndex].quantity = quantity;
    }

    await cart.save();
    return this.buildCartSummary(cart, couponCode, ctx);
  }

  /**
   * Removes an item from the cart.
   */
  async removeItem(
    userId: string,
    variantId: string,
    couponCode?: string,
    ctx?: RequestContext,
  ): Promise<CartSummary> {
    const cart = await this.getOrCreateCart(userId);

    cart.items = cart.items.filter(
      (i) => i.productVariant.toString() !== variantId,
    );

    await cart.save();
    return this.buildCartSummary(cart, couponCode, ctx);
  }

  /**
   * Clears all items from the cart.
   */
  async clearCart(userId: string, ctx?: RequestContext): Promise<void> {
    ctx?.logger?.info({ userId }, "Clearing user cart");
    await Cart.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $set: { items: [] } },
    );
  }
}
