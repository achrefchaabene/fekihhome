export type Role = "admin" | "visitor";

export type Product = {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
  cloudinaryId?: string;
  featured: boolean;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export function getToken() {
  return localStorage.getItem("fekihhome_token");
}

export function saveSession(token: string, user: User) {
  localStorage.setItem("fekihhome_token", token);
  localStorage.setItem("fekihhome_user", JSON.stringify(user));
}

export function readUser(): User | null {
  const raw = localStorage.getItem("fekihhome_user");
  return raw ? JSON.parse(raw) : null;
}

export function clearSession() {
  localStorage.removeItem("fekihhome_token");
  localStorage.removeItem("fekihhome_user");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? "Une erreur est survenue.");
  }

  return data as T;
}

export const api = {
  listProducts: () => request<Product[]>("/products"),
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),
  register: (name: string, email: string, password: string) =>
    request<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    }),
  createProduct: (form: FormData) =>
    request<Product>("/products", {
      method: "POST",
      body: form
    }),
  deleteProduct: (id: string) =>
    request<{ message: string }>(`/products/${id}`, {
      method: "DELETE"
    })
};
