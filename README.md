# Fekih Home

Site e-commerce artisanal avec:

- Frontend React/Vite deployable sur Vercel
- Backend Express deployable sur Render
- MongoDB Atlas
- Cloudinary pour les images produit
- Comptes `admin` et `visitor`

## Installation

```bash
npm install
npm run dev
```

## Variables d'environnement

Copier les fichiers d'exemple:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Configurer ensuite MongoDB Atlas, Cloudinary et le secret JWT.

## Comptes

Le backend permet l'inscription avec le role `visitor`.
Pour creer le premier compte admin, renseigne `ADMIN_NAME`, `ADMIN_EMAIL`
et `ADMIN_PASSWORD` dans `server/.env`, puis lance:

```bash
npm run create-admin --workspace server
```

## Deploiement

- Vercel: dossier racine `client`
- Render Web Service: dossier racine `server`
- Details: voir `DEPLOYMENT.md`
