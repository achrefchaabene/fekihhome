import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    colorName: {
      type: String,
      trim: true,
      default: ""
    },
    colorHex: {
      type: String,
      trim: true,
      default: ""
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 0
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0
    },
    lineProfit: {
      type: Number,
      required: true
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true }
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator(items) {
          return items.length > 0;
        },
        message: "La commande doit contenir au moins un article."
      }
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "refused"],
      default: "pending"
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0
    },
    profit: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
