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
    promotion: {
      enabled: {
        type: Boolean,
        default: false
      },
      price: {
        type: Number,
        min: 0,
        default: 0
      }
    },
    colors: {
      type: [
        {
          name: {
            type: String,
            trim: true,
            required: true
          },
          hex: {
            type: String,
            trim: true,
            default: "#1f6f5b"
          }
        }
      ],
      default: []
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
  return this.promotion?.enabled && this.promotion.price > 0 ? this.promotion.price : this.sellingPrice;
});

productSchema.pre("validate", function validatePrices(next) {
  if (this.purchasePrice >= this.sellingPrice) {
    return next(new Error("Le prix d'achat doit etre inferieur au prix a vendre."));
  }

  if (this.promotion?.enabled) {
    if (!this.promotion.price || this.promotion.price <= 0) {
      return next(new Error("Le prix promotionnel est requis."));
    }

    if (this.promotion.price >= this.sellingPrice) {
      return next(new Error("Le prix promotionnel doit etre inferieur au prix a vendre."));
    }

    if (this.promotion.price <= this.purchasePrice) {
      return next(new Error("Le prix promotionnel doit rester superieur au prix d'achat."));
    }
  }

  next();
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

export default mongoose.model("Product", productSchema);
