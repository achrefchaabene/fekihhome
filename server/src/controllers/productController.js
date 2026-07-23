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
      price: Number(request.body.price),
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
