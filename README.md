# MEZANI Back-Office Restauration

Interface d'administration Next.js pour le module restauration du backend `mezani-resto-api`.

## Stack

- Next.js App Router
- Tailwind CSS
- Redux Toolkit pour l'état applicatif
- RTK Query (`@reduxjs/toolkit/query`) pour les requêtes API
- Recharts pour les visualisations

## Lancement local

```powershell
npm.cmd install
npm.cmd run dev
```

Le frontend proxifie les appels API via `/api/resto/*` vers `MEZANI_RESTO_API_URL` afin d'éviter les soucis CORS en développement.

```env
MEZANI_RESTO_API_URL=http://localhost:8080
NEXT_PUBLIC_RESTO_API_BASE_PATH=/api/resto
```

Le backend autorise les routes admin en local quand `ADMIN_TOKENS` est vide. Si un token est configuré, renseigner `NEXT_PUBLIC_MEZANI_ADMIN_TOKEN` pour les tests locaux.
