import mongoose from "mongoose";

export interface ICartItem {
  productVariant: mongoose.Types.ObjectId;
  quantity: number;
  addedAt: Date;
}

export interface ICart extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export const CartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        productVariant: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ProductVariant",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        addedAt: {
          type: Date,
          required: true,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true },
);

CartSchema.index({ userId: 1 }, { unique: true });

export const Cart = mongoose.model<ICart>("Cart", CartSchema);


