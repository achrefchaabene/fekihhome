import Category from "../models/Category.js";

export async function listCategories(_request, response, next) {
  try {
    const categories = await Category.find().sort({ name: 1 });
    response.json(categories);
  } catch (error) {
    next(error);
  }
}

export async function createCategory(request, response, next) {
  try {
    const category = await Category.create({
      name: request.body.name,
      description: request.body.description || ""
    });
    response.status(201).json(category);
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(request, response, next) {
  try {
    const category = await Category.findByIdAndUpdate(
      request.params.id,
      {
        name: request.body.name,
        description: request.body.description || ""
      },
      { new: true, runValidators: true }
    );

    if (!category) {
      return response.status(404).json({ message: "Categorie introuvable." });
    }

    response.json(category);
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(request, response, next) {
  try {
    const category = await Category.findByIdAndDelete(request.params.id);

    if (!category) {
      return response.status(404).json({ message: "Categorie introuvable." });
    }

    response.json({ message: "Categorie supprimee." });
  } catch (error) {
    next(error);
  }
}
