import mongoose from "mongoose";

export interface ICartReservation extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  productVariantId: mongoose.Types.ObjectId;
  reservedQuantity: number;
  expiresAt: Date;
}

const cartReservationSchema = new mongoose.Schema<ICartReservation>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productVariantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },
    reservedQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);


cartReservationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
cartReservationSchema.index({ userId: 1, productVariantId: 1 }, { unique: true });


export const CartReservation = mongoose.model<ICartReservation>("CartReservation", cartReservationSchema);

