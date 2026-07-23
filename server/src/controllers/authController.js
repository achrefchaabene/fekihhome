import jwt from "jsonwebtoken";
import User from "../models/User.js";

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });
}

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

export async function register(request, response, next) {
  try {
    const { name, email, password } = request.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return response.status(409).json({ message: "Email deja utilise." });
    }

    const user = await User.create({ name, email, password });
    response.status(201).json({
      token: signToken(user),
      user: serializeUser(user)
    });
  } catch (error) {
    next(error);
  }
}

export async function login(request, response, next) {
  try {
    const { email, password } = request.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return response.status(401).json({ message: "Email ou mot de passe incorrect." });
    }

    response.json({
      token: signToken(user),
      user: serializeUser(user)
    });
  } catch (error) {
    next(error);
  }
}

export async function me(request, response) {
  response.json({ user: serializeUser(request.user) });
}
