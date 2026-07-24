import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  LogOut,
  PackagePlus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserRound
} from "lucide-react";
import { Product, User, api, clearSession, readUser, saveSession } from "./api";

const sampleProducts: Product[] = [
  {
    _id: "sample-1",
    name: "Carnet atelier",
    description: "Carnet cousu main pour organiser idees, commandes et croquis.",
    category: "Papeterie",
    price: 18,
    stock: 12,
    imageUrl:
      "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=80",
    featured: true
  },
  {
    _id: "sample-2",
    name: "Plateau bois doux",
    description: "Piece utile pour le bureau, le cafe ou les rituels creatifs.",
    category: "Maison",
    price: 39,
    stock: 7,
    imageUrl:
      "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=900&q=80",
    featured: true
  },
  {
    _id: "sample-3",
    name: "Trousse productive",
    description: "Accessoire textile pour garder les outils essentiels a portee de main.",
    category: "Accessoires",
    price: 24,
    stock: 15,
    imageUrl:
      "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=900&q=80",
    featured: false
  }
];

function App() {
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [user, setUser] = useState<User | null>(() => readUser());
  const [mode, setMode] = useState<"visitor" | "admin">("visitor");
  const [query, setQuery] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api
      .listProducts()
      .then((items) => {
        if (items.length > 0) setProducts(items);
      })
      .catch(() => {
        setMessage("Mode demo actif: connecte l'API pour charger MongoDB Atlas.");
      });
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const text = `${product.name} ${product.category} ${product.description}`.toLowerCase();
      return text.includes(query.toLowerCase());
    });
  }, [products, query]);

  const isAdmin = user?.role === "admin";

  function logout() {
    clearSession();
    setUser(null);
    setMode("visitor");
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
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
      setMessage(`Bienvenue ${session.user.name}.`);
      event.currentTarget.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Connexion impossible.");
    }
  }

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      const created = await api.createProduct(form);
      setProducts((current) => [created, ...current.filter((item) => !item._id.startsWith("sample"))]);
      setMessage("Produit ajoute avec succes.");
      event.currentTarget.reset();
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
          <button className={mode === "admin" ? "active" : ""} onClick={() => setMode("admin")}>
            <LayoutDashboard size={18} />
            Admin
          </button>
        </nav>

        <div className="account">
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
            Boutique artisanale et productive
          </span>
          <h1>Des objets faits main pour travailler, creer et habiter mieux.</h1>
          <p>
            Une experience e-commerce chaleureuse pour vendre des pieces creatives:
            carnet, textile, bois, decoration et outils de quotidien.
          </p>
          <div className="heroActions">
            <a className="primary" href="#shop">Voir la boutique</a>
            <a className="secondary" href="#account">Creer un compte</a>
          </div>
        </div>
        <div className="heroMedia" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1497219055242-93359eeed651?auto=format&fit=crop&w=1200&q=80"
            alt=""
          />
        </div>
      </section>

      {message && <p className="notice">{message}</p>}

      {mode === "visitor" && (
        <>
          <section className="toolbar" id="shop">
            <div>
              <h2>Collection</h2>
              <p>{filteredProducts.length} produits disponibles</p>
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

          <section className="productGrid">
            {filteredProducts.map((product) => (
              <article className="productCard" key={product._id}>
                <img src={product.imageUrl} alt={product.name} />
                <div>
                  <span className="category">{product.category}</span>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div className="productFooter">
                    <strong>{product.price.toFixed(2)} EUR</strong>
                    <button>Ajouter</button>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <section className="authPanel" id="account">
            <div>
              <h2>Compte visiteur</h2>
              <p>Connecte-toi pour preparer les prochaines commandes et garder ton espace client.</p>
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
              <h2>Gestion des produits</h2>
            </div>
            <p>{isAdmin ? "Acces autorise" : "Connecte un compte admin pour publier."}</p>
          </div>

          <form className="productForm" onSubmit={handleCreateProduct}>
            <input name="name" placeholder="Nom du produit" required disabled={!isAdmin} />
            <input name="category" placeholder="Categorie" required disabled={!isAdmin} />
            <input name="price" type="number" min="0" step="0.01" placeholder="Prix" required disabled={!isAdmin} />
            <input name="stock" type="number" min="0" placeholder="Stock" required disabled={!isAdmin} />
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
                  <p>{product.stock} en stock</p>
                </div>
                <button onClick={() => handleDeleteProduct(product._id)} disabled={!isAdmin && !product._id.startsWith("sample")}>
                  Supprimer
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default App;
