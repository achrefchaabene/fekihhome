import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    imageUrl: {
      type: String,
      required: true
    },
    cloudinaryId: {
      type: String,
      required: true
    },
    featured: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

productSchema.virtual("price").get(function price() {
  return this.sellingPrice;
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

export default mongoose.model("Product", productSchema);
