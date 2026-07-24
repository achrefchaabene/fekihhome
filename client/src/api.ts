export type Role = "admin" | "visitor";

export type Product = {
  _id: string;
  name: string;
  description: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  price: number;
  stock: number;
  imageUrl: string;
  cloudinaryId?: string;
  featured: boolean;
};

export type Category = {
  _id: string;
  name: string;
  description: string;
};

export type OrderStatus = "pending" | "accepted" | "refused";

export type Order = {
  _id: string;
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
  };
  items: Array<{
    product: string;
    name: string;
    quantity: number;
    purchasePrice: number;
    sellingPrice: number;
    lineTotal: number;
    lineProfit: number;
  }>;
  status: OrderStatus;
  totalAmount: number;
  totalCost: number;
  profit: number;
  createdAt: string;
};

export type OrderStats = {
  period: "month" | "year";
  totals: {
    orders: number;
    revenue: number;
    cost: number;
    profit: number;
    items: number;
  };
  stats: Array<OrderStats["totals"] & { period: string }>;
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

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers
    });
  } catch {
    throw new Error("API inaccessible. Verifie VITE_API_URL sur Vercel et l'etat du backend Render.");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? "Une erreur est survenue.");
  }

  return data as T;
}

export const api = {
  listProducts: () => request<Product[]>("/products"),
  listCategories: () => request<Category[]>("/categories"),
  listOrders: () => request<Order[]>("/orders"),
  listOrderStats: (period: "month" | "year") => request<OrderStats>(`/orders/stats?period=${period}`),
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
  updateProduct: (id: string, form: FormData) =>
    request<Product>(`/products/${id}`, {
      method: "PUT",
      body: form
    }),
  deleteProduct: (id: string) =>
    request<{ message: string }>(`/products/${id}`, {
      method: "DELETE"
    }),
  createCategory: (name: string, description: string) =>
    request<Category>("/categories", {
      method: "POST",
      body: JSON.stringify({ name, description })
    }),
  updateCategory: (id: string, name: string, description: string) =>
    request<Category>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name, description })
    }),
  deleteCategory: (id: string) =>
    request<{ message: string }>(`/categories/${id}`, {
      method: "DELETE"
    }),
  createOrder: (payload: {
    customer: { firstName: string; lastName: string; phone: string; address: string };
    items: Array<{ productId: string; quantity: number }>;
  }) =>
    request<Order>("/orders", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateOrderStatus: (id: string, status: OrderStatus) =>
    request<Order>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    }),
  deleteOrder: (id: string) =>
    request<{ message: string }>(`/orders/${id}`, {
      method: "DELETE"
    })
};
