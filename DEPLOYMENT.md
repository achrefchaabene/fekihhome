# Deploiement Vercel + Render

## 1. Render: backend API

Creer un nouveau **Web Service** Render depuis le repo GitHub.

Parametres:

- Root Directory: `server`
- Runtime: `Node`
- Build Command: `npm install`
- Start Command: `npm start`

Variables d'environnement Render:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
CLIENT_URL=https://ton-site.vercel.app
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Apres deploiement, tester:

```text
https://ton-api.onrender.com/api/health
```

## 2. Vercel: frontend

Creer un nouveau projet Vercel depuis le meme repo GitHub.

Parametres:

- Root Directory: `client`
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

Variable d'environnement Vercel:

```env
VITE_API_URL=https://ton-api.onrender.com/api
```

## 3. Connexion finale

Quand Vercel donne l'URL du site, revenir dans Render et mettre:

```env
CLIENT_URL=https://ton-site.vercel.app
```

Puis redeployer l'API.
