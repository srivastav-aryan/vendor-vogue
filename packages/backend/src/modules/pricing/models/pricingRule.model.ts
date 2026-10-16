import mongoose, { InferSchemaType, HydratedDocument } from "mongoose";

export const DISCOUNT_TYPES = {
  PERCENTAGE: "PERCENTAGE",     // e.g. 10% off
  FLAT_AMOUNT: "FLAT_AMOUNT",   // e.g. ₹100 off
  BOGO: "BOGO",                 // Buy one get one free (50% off per unit when quantity >= 2)
} as const;

export type DiscountType = (typeof DISCOUNT_TYPES)[keyof typeof DISCOUNT_TYPES];

const pricingRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      default: "",
    },
    discountType: {
      type: String,
      required: true,
      enum: Object.values(DISCOUNT_TYPES),
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    // Priority system: When multiple rules match, highest priority number wins
    priority: {
      type: Number,
      required: true,
      default: 0,
      index: true,
    },
    // Conditions
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    applicableBrands: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand",
      },
    ],
    applicableVariants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductVariant",
      },
    ],
    minCartValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    minQuantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validTo: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
);

pricingRuleSchema.index({ isActive: 1, validFrom: 1, validTo: 1, priority: -1 });

export type PricingRuleProps = InferSchemaType<typeof pricingRuleSchema>;

export type LeanPricingRule = PricingRuleProps & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type PricingRuleDocument = HydratedDocument<PricingRuleProps>;

export const PricingRule = mongoose.model<PricingRuleProps>(
  "PricingRule",
  pricingRuleSchema,
);
