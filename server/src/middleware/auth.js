import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function protect(request, response, next) {
  try {
    const header = request.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      return response.status(401).json({ message: "Authentification requise." });
    }

    const token = header.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select("-password");

    if (!user) {
      return response.status(401).json({ message: "Utilisateur introuvable." });
    }

    request.user = user;
    next();
  } catch {
    response.status(401).json({ message: "Session invalide." });
  }
}

export function requireAdmin(request, response, next) {
  if (request.user?.role !== "admin") {
    return response.status(403).json({ message: "Acces admin requis." });
  }

  next();
}
