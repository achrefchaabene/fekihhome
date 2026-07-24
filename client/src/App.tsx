import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Check,
  Eye,
  LayoutDashboard,
  LogOut,
  PackagePlus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  UserRound,
  X
} from "lucide-react";
import {
  Category,
  Order,
  OrderStats,
  Product,
  User,
  api,
  clearSession,
  readUser,
  saveSession
} from "./api";

type CartItem = {
  product: Product;
  quantity: number;
  colorName?: string;
  colorHex?: string;
};

const sampleProducts: Product[] = [
  {
    _id: "sample-1",
    name: "Sac filet artisanal",
    description: "Sac fait main pour sorties, courses et pieces creatives du quotidien.",
    category: "Sacs",
    purchasePrice: 18,
    sellingPrice: 35,
    promotion: { enabled: true, price: 29 },
    colors: [
      { name: "Menthe", hex: "#9ddfca" },
      { name: "Noir", hex: "#171717" },
      { name: "Creme", hex: "#f1e8d5" }
    ],
    price: 35,
    stock: 12,
    imageUrl: "/home-hero.png",
    featured: true
  },
  {
    _id: "sample-2",
    name: "Carnet atelier",
    description: "Carnet cousu main pour organiser idees, commandes et croquis.",
    category: "Papeterie",
    purchasePrice: 8,
    sellingPrice: 18,
    promotion: { enabled: false, price: 0 },
    colors: [
      { name: "Kraft", hex: "#b9854f" },
      { name: "Ivoire", hex: "#f7f0df" }
    ],
    price: 18,
    stock: 14,
    imageUrl:
      "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=80",
    featured: true
  },
  {
    _id: "sample-3",
    name: "Plateau bois doux",
    description: "Piece utile pour le bureau, le cafe ou les rituels creatifs.",
    category: "Maison",
    purchasePrice: 22,
    sellingPrice: 39,
    promotion: { enabled: false, price: 0 },
    colors: [
      { name: "Bois clair", hex: "#d4a15f" },
      { name: "Noyer", hex: "#6c4427" }
    ],
    price: 39,
    stock: 7,
    imageUrl:
      "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=900&q=80",
    featured: false
  }
];

const fallbackStats: OrderStats = {
  period: "month",
  totals: { orders: 0, revenue: 0, cost: 0, profit: 0, items: 0 },
  stats: []
};

const DELIVERY_FEE = 8;

function money(value: number) {
  return `${value.toFixed(2)} TND`;
}

function productPrice(product: Product) {
  return product.promotion?.enabled && product.promotion.price > 0 ? product.promotion.price : product.sellingPrice;
}

function App() {
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>(fallbackStats);
  const [statsPeriod, setStatsPeriod] = useState<"month" | "year">("month");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(() => readUser());
  const [mode, setMode] = useState<"visitor" | "admin">(() =>
    readUser()?.role === "admin" ? "admin" : "visitor"
  );
  const [adminTab, setAdminTab] = useState<"orders" | "products" | "categories" | "stats">("orders");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedColors, setSelectedColors] = useState<Record<string, number>>({});
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState("");

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    loadPublicData();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadAdminData(statsPeriod);
    }
  }, [isAdmin, statsPeriod]);

  async function loadPublicData() {
    try {
      const [productItems, categoryItems] = await Promise.all([api.listProducts(), api.listCategories()]);
      if (productItems.length > 0) setProducts(productItems);
      setCategories(categoryItems);
    } catch {
      setMessage("");
    }
  }

  async function loadAdminData(period = statsPeriod) {
    try {
      const [orderItems, statItems] = await Promise.all([api.listOrders(), api.listOrderStats(period)]);
      setOrders(orderItems);
      setStats(statItems);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement admin impossible.");
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const text = `${product.name} ${product.category} ${product.description}`.toLowerCase();
      const price = productPrice(product);
      const matchesText = text.includes(query.toLowerCase());
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
      const matchesMin = minPrice === "" || price >= Number(minPrice);
      const matchesMax = maxPrice === "" || price <= Number(maxPrice);
      return matchesText && matchesCategory && matchesMin && matchesMax;
    });
  }, [products, query, categoryFilter, minPrice, maxPrice]);

  const categoryOptions = useMemo(() => {
    const apiCategories = categories.map((category) => category.name);
    const productCategories = products.map((product) => product.category);
    return Array.from(new Set([...apiCategories, ...productCategories])).filter(Boolean).sort();
  }, [categories, products]);

  const cartTotal = cart.reduce((sum, item) => sum + productPrice(item.product) * item.quantity, 0);
  const orderTotal = cart.length > 0 ? cartTotal + DELIVERY_FEE : 0;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  function logout() {
    clearSession();
    setUser(null);
    setMode("visitor");
  }

  function selectedColor(product: Product) {
    const colors = product.colors || [];
    return colors[selectedColors[product._id] || 0];
  }

  function addToCart(product: Product) {
    const color = selectedColor(product);
    setCart((current) => {
      const existing = current.find(
        (item) => item.product._id === product._id && (item.colorName || "") === (color?.name || "")
      );
      if (existing) {
        return current.map((item) =>
          item.product._id === product._id && (item.colorName || "") === (color?.name || "")
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...current, { product, quantity: 1, colorName: color?.name, colorHex: color?.hex }];
    });
  }

  function buyNow(product: Product) {
    addToCart(product);
    window.setTimeout(() => document.getElementById("cart")?.scrollIntoView({ behavior: "smooth" }), 80);
  }

  function changeQuantity(productId: string, colorName: string | undefined, quantity: number) {
    if (quantity < 1) {
      setCart((current) =>
        current.filter((item) => !(item.product._id === productId && (item.colorName || "") === (colorName || "")))
      );
      return;
    }

    setCart((current) =>
      current.map((item) =>
        item.product._id === productId && (item.colorName || "") === (colorName || "")
          ? { ...item, quantity }
          : item
      )
    );
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    try {
      const session =
        authMode === "login"
          ? await api.login(email, password)
          : await api.register(name, email, password);
      saveSession(session.token, session.user);
      setUser(session.user);
      setMode(session.user.role === "admin" ? "admin" : "visitor");
      setAdminTab("orders");
      setMessage(
        session.user.role === "admin"
          ? `Bienvenue ${session.user.name}, espace admin ouvert.`
          : `Bienvenue ${session.user.name}, espace visiteur ouvert.`
      );
      formElement.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Connexion impossible.");
    }
  }

  async function handleOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (cart.length === 0) {
      setMessage("Ajoute au moins un article au panier.");
      return;
    }

    const form = new FormData(formElement);

    try {
      await api.createOrder({
        customer: {
          firstName: String(form.get("firstName") ?? ""),
          lastName: String(form.get("lastName") ?? ""),
          phone: String(form.get("phone") ?? ""),
          address: String(form.get("address") ?? "")
        },
        items: cart.map((item) => ({
          productId: item.product._id,
          quantity: item.quantity,
          colorName: item.colorName,
          colorHex: item.colorHex
        }))
      });
      setCart([]);
      setMessage("Commande envoyee a l'admin avec succes.");
      formElement.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Commande non envoyee.");
    }
  }

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const purchasePrice = Number(form.get("purchasePrice"));
    const sellingPrice = Number(form.get("sellingPrice"));
    const promotionEnabled = form.get("promotionEnabled") === "on";
    const promotionPrice = Number(form.get("promotionPrice") || 0);

    if (purchasePrice >= sellingPrice) {
      setMessage("Le prix d'achat doit etre inferieur au prix a vendre.");
      return;
    }

    if (promotionEnabled && (promotionPrice <= purchasePrice || promotionPrice >= sellingPrice)) {
      setMessage("Le prix promotionnel doit etre entre le prix d'achat et le prix a vendre.");
      return;
    }

    try {
      const created = await api.createProduct(form);
      setProducts((current) => [created, ...current.filter((item) => !item._id.startsWith("sample"))]);
      setMessage("Produit ajoute avec succes.");
      formElement.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Produit non ajoute.");
    }
  }

  async function handleDeleteProduct(id: string) {
    if (id.startsWith("sample")) {
      setProducts((current) => current.filter((product) => product._id !== id));
      return;
    }

    try {
      await api.deleteProduct(id);
      setProducts((current) => current.filter((product) => product._id !== id));
      setMessage("Produit supprime.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Suppression impossible.");
    }
  }

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    try {
      const category = await api.createCategory(
        String(form.get("name") ?? ""),
        String(form.get("description") ?? "")
      );
      setCategories((current) => [...current, category].sort((a, b) => a.name.localeCompare(b.name)));
      setMessage("Categorie ajoutee.");
      formElement.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Categorie non ajoutee.");
    }
  }

  async function handleDeleteCategory(id: string) {
    try {
      await api.deleteCategory(id);
      setCategories((current) => current.filter((category) => category._id !== id));
      setMessage("Categorie supprimee.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Suppression impossible.");
    }
  }

  async function handleOrderStatus(id: string, status: "accepted" | "refused") {
    try {
      const updated = await api.updateOrderStatus(id, status);
      setOrders((current) => current.map((order) => (order._id === id ? updated : order)));
      await loadAdminData(statsPeriod);
      setMessage(status === "accepted" ? "Commande acceptee." : "Commande refusee.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Statut non modifie.");
    }
  }

  async function handleDeleteOrder(id: string) {
    try {
      await api.deleteOrder(id);
      setOrders((current) => current.filter((order) => order._id !== id));
      await loadAdminData(statsPeriod);
      setMessage("Commande supprimee.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Commande non supprimee.");
    }
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Accueil Fekih Home">
          <img src="/logo-fkh-home.jpg" alt="" />
          <span>Fekih Home</span>
        </a>

        <nav className="nav">
          <button className={mode === "visitor" ? "active" : ""} onClick={() => setMode("visitor")}>
            <ShoppingBag size={18} />
            Boutique
          </button>
          {isAdmin && (
            <button className={mode === "admin" ? "active" : ""} onClick={() => setMode("admin")}>
              <LayoutDashboard size={18} />
              Admin
            </button>
          )}
        </nav>

        <div className="account">
          {mode === "visitor" && (
            <a className="cartButton" href="#cart" aria-label={`Panier, ${cartCount} article(s)`}>
              <ShoppingBag size={16} />
              <span>{cartCount}</span>
            </a>
          )}
          {user ? (
            <>
              <span>
                <UserRound size={16} />
                {user.name}
              </span>
              <button className="iconButton" onClick={logout} aria-label="Se deconnecter">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <a href="#account">Compte</a>
          )}
        </div>
      </header>

      <section className="hero" id="home">
        <div className="heroText">
          <span className="eyebrow">
            <Sparkles size={16} />
            Collection artisanale
          </span>
          <h1>Lamsa</h1>
          <p dir="rtl" className="heroCopy">
            اكتشفي لمسة فريدة من الإبداع اليدوي: حقائب، إكسسوارات وقطع منزلية أنيقة
            تختارينها بسهولة وتطلبينها بسرعة.
          </p>
          <div className="heroStats" aria-label="Avantages boutique">
            <span>تصاميم مختارة</span>
            <span>طلب سريع</span>
            <span>توصيل 8 TND</span>
          </div>
          <div className="heroActions">
            <a className="primary" href="#shop">Découvrir la collection</a>
            <a className="secondary" href="#cart">Voir le panier</a>
          </div>
        </div>
        <div className="heroMedia">
          <img src="/home-hero.png" alt="" />
          <div className="heroMediaLabel">
            <span>Nouvelle sélection</span>
            <strong>Sacs & accessoires faits main</strong>
          </div>
        </div>
      </section>

      <section className="signatureBand" aria-label="Services Lamsa">
        <article>
          <strong>01</strong>
          <span>Choisir</span>
          <p>Filtres par catégorie, prix et couleurs pour trouver rapidement la bonne pièce.</p>
        </article>
        <article>
          <strong>02</strong>
          <span>Commander</span>
          <p>Achat invité sans création de compte, avec formulaire simple et clair.</p>
        </article>
        <article>
          <strong>03</strong>
          <span>Suivre</span>
          <p>Commande reçue par l’admin, puis acceptée ou refusée depuis l’espace gestion.</p>
        </article>
      </section>

      {message && <p className="notice">{message}</p>}

      {mode === "visitor" && (
        <>
          <section className="toolbar" id="shop">
            <div>
              <span className="eyebrow">
                <SlidersHorizontal size={16} />
                Selection boutique
              </span>
              <h2>Produits</h2>
              <p>{filteredProducts.length} article(s) selon tes filtres</p>
            </div>
            <label className="search">
              <Search size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher une piece..."
              />
            </label>
          </section>

          <section className="filtersBar" aria-label="Filtres produits">
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">Toutes categories</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <input
              value={minPrice}
              min="0"
              type="number"
              placeholder="Prix min"
              onChange={(event) => setMinPrice(event.target.value)}
            />
            <input
              value={maxPrice}
              min="0"
              type="number"
              placeholder="Prix max"
              onChange={(event) => setMaxPrice(event.target.value)}
            />
          </section>

          <section className="categoryStrip" aria-label="Categories principales">
            <button className={categoryFilter === "all" ? "active" : ""} onClick={() => setCategoryFilter("all")}>
              Tous
            </button>
            {categoryOptions.map((category) => (
              <button
                key={`strip-${category}`}
                className={categoryFilter === category ? "active" : ""}
                onClick={() => setCategoryFilter(category)}
              >
                {category}
              </button>
            ))}
          </section>

          <section className="productGrid">
            {filteredProducts.map((product) => (
              <article className="productCard" key={product._id}>
                <button className="productImageButton" onClick={() => setDetailProduct(product)}>
                  <img src={product.imageUrl} alt={product.name} />
                  {product.promotion?.enabled && (
                    <span className="promoBadge">
                      <Tag size={14} />
                      Promo
                    </span>
                  )}
                </button>
                <div>
                  <span className="category">{product.category}</span>
                  <button className="productTitle" onClick={() => setDetailProduct(product)}>{product.name}</button>
                  <p>{product.description}</p>
                  <div className="productMeta">
                    <span>{product.stock > 0 ? `${product.stock} en stock` : "Rupture"}</span>
                    {selectedColor(product) && <span>{selectedColor(product)?.name}</span>}
                  </div>
                  {(product.colors?.length || 0) > 0 && (
                    <div className="colorSwatches" aria-label={`Couleurs ${product.name}`}>
                      {product.colors?.map((color, index) => (
                        <button
                          key={`${product._id}-${color.name}`}
                          className={selectedColors[product._id] === index || (!selectedColors[product._id] && index === 0) ? "active" : ""}
                          onClick={() => setSelectedColors((current) => ({ ...current, [product._id]: index }))}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                          aria-label={color.name}
                        />
                      ))}
                    </div>
                  )}
                  <div className="productFooter">
                    <div className="priceStack">
                      {product.promotion?.enabled && <span>{money(product.sellingPrice)}</span>}
                      <strong>{money(productPrice(product))}</strong>
                    </div>
                    <div className="productActions">
                      <button className="quietButton" onClick={() => setDetailProduct(product)}>
                        <Eye size={16} />
                      </button>
                      <button onClick={() => buyNow(product)} disabled={product.stock <= 0}>Acheter</button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
            {filteredProducts.length === 0 && (
              <article className="emptyProducts">
                <Search size={28} />
                <h3>Aucun produit trouvé</h3>
                <p>Essaie une autre catégorie ou ajuste le filtre de prix.</p>
              </article>
            )}
          </section>

          <section className="cartPanel" id="cart">
            <div>
              <h2>Panier</h2>
              <p>{cartCount} article(s), sous-total {money(cartTotal)}</p>
              {cart.length > 0 && (
                <div className="cartSummary">
                  <span>Sous-total <strong>{money(cartTotal)}</strong></span>
                  <span>Livraison <strong>{money(DELIVERY_FEE)}</strong></span>
                  <span>Total <strong>{money(orderTotal)}</strong></span>
                </div>
              )}
              <div className="cartList">
                {cart.length === 0 && <p>Ton panier est vide.</p>}
                {cart.map((item) => (
                  <article key={`${item.product._id}-${item.colorName || "default"}`}>
                    <img src={item.product.imageUrl} alt={item.product.name} />
                    <div>
                      <h3>{item.product.name}</h3>
                      <p>{money(productPrice(item.product))} / piece</p>
                      {item.colorName && (
                        <span className="cartColor">
                          <i style={{ backgroundColor: item.colorHex }} />
                          {item.colorName}
                        </span>
                      )}
                    </div>
                    <input
                      aria-label={`Quantite ${item.product.name}`}
                      min="1"
                      type="number"
                      value={item.quantity}
                      onChange={(event) => changeQuantity(item.product._id, item.colorName, Number(event.target.value))}
                    />
                    <button className="iconButton" onClick={() => changeQuantity(item.product._id, item.colorName, 0)} aria-label="Retirer">
                      <Trash2 size={18} />
                    </button>
                  </article>
                ))}
              </div>
            </div>
            {cart.length > 0 ? (
              <form className="checkoutForm" onSubmit={handleOrder}>
                <div>
                  <h3>Informations de livraison</h3>
                  <p>Livraison fixe {money(DELIVERY_FEE)}. Total commande {money(orderTotal)}.</p>
                </div>
                <input name="firstName" placeholder="Prenom" required />
                <input name="lastName" placeholder="Nom" required />
                <input name="phone" placeholder="Numero telephone" required />
                <textarea name="address" placeholder="Adresse complete" required />
                <button className="primary" type="submit">Envoyer la commande</button>
              </form>
            ) : (
              <aside className="checkoutEmpty">
                <ShoppingBag size={24} />
                <h3>Choisis d'abord tes articles</h3>
                <p>Le formulaire de commande apparait ici des que ton panier contient au moins un produit.</p>
                <a className="secondary" href="#shop">Voir les produits</a>
              </aside>
            )}
          </section>

          <section className="authPanel" id="account">
            <div>
              <h2>Compte</h2>
              <p>
                Connecte-toi avec un compte visiteur pour commander, ou avec un compte admin pour
                gerer produits, categories, commandes et statistiques.
              </p>
            </div>
            <form onSubmit={handleAuth}>
              <div className="toggle">
                <button type="button" className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>
                  Connexion
                </button>
                <button type="button" className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>
                  Inscription
                </button>
              </div>
              {authMode === "register" && <input name="name" placeholder="Nom" required />}
              <input name="email" type="email" placeholder="Email" required />
              <input name="password" type="password" placeholder="Mot de passe" minLength={6} required />
              <button className="primary" type="submit">
                {authMode === "login" ? "Entrer" : "Creer le compte"}
              </button>
            </form>
          </section>
        </>
      )}

      {mode === "admin" && (
        <section className="adminPanel">
          <div className="adminHeader">
            <div>
              <span className="eyebrow">
                <ShieldCheck size={16} />
                Espace admin
              </span>
              <h2>Gestion complete</h2>
            </div>
            <p>{isAdmin ? "Acces autorise" : "Connecte un compte admin pour gerer la boutique."}</p>
          </div>

          <div className="adminTabs">
            <button className={adminTab === "orders" ? "active" : ""} onClick={() => setAdminTab("orders")}>Commandes</button>
            <button className={adminTab === "products" ? "active" : ""} onClick={() => setAdminTab("products")}>Produits</button>
            <button className={adminTab === "categories" ? "active" : ""} onClick={() => setAdminTab("categories")}>Categories</button>
            <button className={adminTab === "stats" ? "active" : ""} onClick={() => setAdminTab("stats")}>
              <BarChart3 size={17} />
              Statistiques
            </button>
          </div>

          {adminTab === "orders" && (
            <div className="orderList">
              {orders.length === 0 && <p>Aucune commande pour le moment.</p>}
              {orders.map((order) => (
                <article key={order._id} className={`orderCard ${order.status}`}>
                  <div>
                    <h3>{order.customer.firstName} {order.customer.lastName}</h3>
                    <p>{order.customer.phone} - {order.customer.address}</p>
                    <span className="status">{order.status}</span>
                  </div>
                  <ul>
                    {order.items.map((item) => (
                      <li key={`${order._id}-${item.product}`}>
                        {item.quantity} x {item.name} - {money(item.lineTotal)}
                        {item.colorName ? ` - ${item.colorName}` : ""}
                      </li>
                    ))}
                  </ul>
                  <div className="orderTotals">
                    <strong>Total {money(order.totalAmount)}</strong>
                    <span>Livraison {money(order.deliveryFee ?? DELIVERY_FEE)}</span>
                    <span>Benefice {money(order.profit)}</span>
                  </div>
                  <div className="rowActions">
                    <button onClick={() => handleOrderStatus(order._id, "accepted")} disabled={!isAdmin || order.status === "accepted"}>
                      <Check size={17} />
                      Accepter
                    </button>
                    <button onClick={() => handleOrderStatus(order._id, "refused")} disabled={!isAdmin || order.status === "refused"}>
                      <X size={17} />
                      Refuser
                    </button>
                    <button onClick={() => handleDeleteOrder(order._id)} disabled={!isAdmin}>
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {adminTab === "products" && (
            <>
              <form className="productForm" onSubmit={handleCreateProduct}>
                <input name="name" placeholder="Nom du produit" required disabled={!isAdmin} />
                <select name="category" required disabled={!isAdmin}>
                  <option value="">Categorie</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category.name}>{category.name}</option>
                  ))}
                </select>
                <input name="purchasePrice" type="number" min="0" step="0.01" placeholder="Prix d'achat" required disabled={!isAdmin} />
                <input name="sellingPrice" type="number" min="0" step="0.01" placeholder="Prix a vendre" required disabled={!isAdmin} />
                <label className="check">
                  <input name="promotionEnabled" type="checkbox" disabled={!isAdmin} />
                  Promotion
                </label>
                <input name="promotionPrice" type="number" min="0" step="0.01" placeholder="Prix promotionnel" disabled={!isAdmin} />
                <input name="stock" type="number" min="0" placeholder="Stock" required disabled={!isAdmin} />
                <input name="colorNames" placeholder="Couleurs: Noir, Beige, Rouge" disabled={!isAdmin} />
                <input name="colorHexes" placeholder="Codes: #111111, #eadfcf, #b43a32" disabled={!isAdmin} />
                <textarea name="description" placeholder="Description" required disabled={!isAdmin} />
                <input name="image" type="file" accept="image/*" required disabled={!isAdmin} />
                <label className="check">
                  <input name="featured" type="checkbox" disabled={!isAdmin} />
                  Mettre en avant
                </label>
                <button className="primary" type="submit" disabled={!isAdmin}>
                  <PackagePlus size={18} />
                  Ajouter le produit
                </button>
              </form>

              <div className="adminList">
                {products.map((product) => (
                  <article key={product._id}>
                    <img src={product.imageUrl} alt={product.name} />
                    <div>
                      <h3>{product.name}</h3>
                      <p>
                        Achat {money(product.purchasePrice)} - Vente {money(product.sellingPrice)} - Stock {product.stock}
                        {product.promotion?.enabled ? ` - Promo ${money(product.promotion.price)}` : ""}
                      </p>
                      {(product.colors?.length || 0) > 0 && (
                        <div className="adminColors">
                          {product.colors?.map((color) => (
                            <span key={`${product._id}-${color.name}`}>
                              <i style={{ backgroundColor: color.hex }} />
                              {color.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={() => handleDeleteProduct(product._id)} disabled={!isAdmin && !product._id.startsWith("sample")}>
                      Supprimer
                    </button>
                  </article>
                ))}
              </div>
            </>
          )}

          {adminTab === "categories" && (
            <>
              <form className="categoryForm" onSubmit={handleCreateCategory}>
                <input name="name" placeholder="Nom categorie" required disabled={!isAdmin} />
                <input name="description" placeholder="Description" disabled={!isAdmin} />
                <button className="primary" type="submit" disabled={!isAdmin}>Ajouter categorie</button>
              </form>
              <div className="adminList">
                {categories.map((category) => (
                  <article key={category._id}>
                    <div>
                      <h3>{category.name}</h3>
                      <p>{category.description || "Sans description"}</p>
                    </div>
                    <button onClick={() => handleDeleteCategory(category._id)} disabled={!isAdmin}>Supprimer</button>
                  </article>
                ))}
              </div>
            </>
          )}

          {adminTab === "stats" && (
            <div className="statsPanel">
              <div className="toggle">
                <button className={statsPeriod === "month" ? "active" : ""} onClick={() => setStatsPeriod("month")}>Par mois</button>
                <button className={statsPeriod === "year" ? "active" : ""} onClick={() => setStatsPeriod("year")}>Par annee</button>
              </div>
              <div className="statGrid">
                <article><span>Commandes</span><strong>{stats.totals.orders}</strong></article>
                <article><span>Articles vendus</span><strong>{stats.totals.items}</strong></article>
                <article><span>Chiffre d'affaires</span><strong>{money(stats.totals.revenue)}</strong></article>
                <article><span>Benefice</span><strong>{money(stats.totals.profit)}</strong></article>
              </div>
              <div className="statsTable">
                {stats.stats.map((row) => (
                  <article key={row.period}>
                    <strong>{row.period}</strong>
                    <span>{row.orders} commandes</span>
                    <span>CA {money(row.revenue)}</span>
                    <span>Cout {money(row.cost)}</span>
                    <span>Benefice {money(row.profit)}</span>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {detailProduct && (
        <div className="productModal" role="dialog" aria-modal="true" aria-label={detailProduct.name}>
          <article>
            <button className="modalClose" onClick={() => setDetailProduct(null)} aria-label="Fermer">
              <X size={20} />
            </button>
            <img src={detailProduct.imageUrl} alt={detailProduct.name} />
            <div>
              <span className="category">{detailProduct.category}</span>
              <h2>{detailProduct.name}</h2>
              <p>{detailProduct.description}</p>
              {(detailProduct.colors?.length || 0) > 0 && (
                <div className="detailColors">
                  {detailProduct.colors?.map((color, index) => (
                    <button
                      key={`${detailProduct._id}-detail-${color.name}`}
                      className={selectedColors[detailProduct._id] === index || (!selectedColors[detailProduct._id] && index === 0) ? "active" : ""}
                      onClick={() => setSelectedColors((current) => ({ ...current, [detailProduct._id]: index }))}
                    >
                      <i style={{ backgroundColor: color.hex }} />
                      {color.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="modalPrice">
                <div className="priceStack">
                  {detailProduct.promotion?.enabled && <span>{money(detailProduct.sellingPrice)}</span>}
                  <strong>{money(productPrice(detailProduct))}</strong>
                </div>
                <button className="primary" onClick={() => { buyNow(detailProduct); setDetailProduct(null); }}>
                  Acheter maintenant
                </button>
              </div>
            </div>
          </article>
        </div>
      )}
    </main>
  );
}

export default App;
