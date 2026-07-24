import { Readable } from "node:stream";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/Product.js";

function uploadToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "fekihhome/products",
        resource_type: "image"
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    Readable.from(file.buffer).pipe(stream);
  });
}

function parseColors(body) {
  if (body.colors) {
    try {
      const parsed = JSON.parse(body.colors);
      if (Array.isArray(parsed)) {
        return parsed.filter((color) => color?.name).map((color) => ({
          name: String(color.name),
          hex: String(color.hex || "#1f6f5b")
        }));
      }
    } catch {
      return [];
    }
  }

  const names = String(body.colorNames || "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  const hexes = String(body.colorHexes || "")
    .split(",")
    .map((hex) => hex.trim())
    .filter(Boolean);

  return names.map((name, index) => ({
    name,
    hex: hexes[index] || "#1f6f5b"
  }));
}

export async function listProducts(_request, response, next) {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    response.json(products);
  } catch (error) {
    next(error);
  }
}

export async function createProduct(request, response, next) {
  try {
    if (!request.file) {
      return response.status(400).json({ message: "Image produit requise." });
    }

    const uploaded = await uploadToCloudinary(request.file);
    const product = await Product.create({
      name: request.body.name,
      description: request.body.description,
      category: request.body.category,
      purchasePrice: Number(request.body.purchasePrice || 0),
      sellingPrice: Number(request.body.sellingPrice || request.body.price),
      promotion: {
        enabled: request.body.promotionEnabled === "on" || request.body.promotionEnabled === "true",
        price: Number(request.body.promotionPrice || 0)
      },
      colors: parseColors(request.body),
      stock: Number(request.body.stock),
      featured: request.body.featured === "on" || request.body.featured === "true",
      imageUrl: uploaded.secure_url,
      cloudinaryId: uploaded.public_id
    });

    response.status(201).json(product);
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(request, response, next) {
  try {
    const product = await Product.findById(request.params.id);

    if (!product) {
      return response.status(404).json({ message: "Produit introuvable." });
    }

    product.name = request.body.name ?? product.name;
    product.description = request.body.description ?? product.description;
    product.category = request.body.category ?? product.category;
    product.purchasePrice =
      request.body.purchasePrice !== undefined ? Number(request.body.purchasePrice) : product.purchasePrice;
    product.sellingPrice =
      request.body.sellingPrice !== undefined ? Number(request.body.sellingPrice) : product.sellingPrice;
    product.promotion = {
      enabled:
        request.body.promotionEnabled !== undefined
          ? request.body.promotionEnabled === "on" ||
            request.body.promotionEnabled === "true" ||
            request.body.promotionEnabled === true
          : product.promotion?.enabled || false,
      price:
        request.body.promotionPrice !== undefined
          ? Number(request.body.promotionPrice || 0)
          : product.promotion?.price || 0
    };
    if (request.body.colors !== undefined || request.body.colorNames !== undefined || request.body.colorHexes !== undefined) {
      product.colors = parseColors(request.body);
    }
    product.stock = request.body.stock !== undefined ? Number(request.body.stock) : product.stock;
    product.featured =
      request.body.featured !== undefined
        ? request.body.featured === "on" || request.body.featured === "true" || request.body.featured === true
        : product.featured;

    if (request.file) {
      await cloudinary.uploader.destroy(product.cloudinaryId);
      const uploaded = await uploadToCloudinary(request.file);
      product.imageUrl = uploaded.secure_url;
      product.cloudinaryId = uploaded.public_id;
    }

    await product.save();
    response.json(product);
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(request, response, next) {
  try {
    const product = await Product.findById(request.params.id);

    if (!product) {
      return response.status(404).json({ message: "Produit introuvable." });
    }

    await cloudinary.uploader.destroy(product.cloudinaryId);
    await product.deleteOne();
    response.json({ message: "Produit supprime." });
  } catch (error) {
    next(error);
  }
}
