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

Le back-office utilise le JWT du compte utilisateur et vérifie ses adhésions à chaque établissement. Le JWT n'est plus lié à un unique `restaurant_id`. Aucun token administrateur ni clé API secrète ne doit être placé dans une variable `NEXT_PUBLIC_*`.

L'inscription propriétaire suit le parcours commercial suivant : choix d'un forfait, enregistrement de la demande de paiement, confirmation par un opérateur ou un fournisseur de paiement, puis envoi d'une clé d'activation temporaire. La clé est liée au contact et au forfait payé ; elle n'est jamais persistée par le frontend. Après son échange, seuls les jetons de session utilisateur sont conservés.

La page `/subscription` permet à un propriétaire connecté de consulter sa consommation, demander un renouvellement ou un changement de forfait, puis activer la clé reçue. Les pages `/establishments` et `/establishments/new` appliquent le plafond renvoyé par le backend. Une confirmation de paiement ne peut jamais être effectuée par le navigateur client.

## Adaptation Kinshasa

Le workspace gère maintenant :

- les prix et encaissements CDF/USD avec un taux configurable par établissement ;
- les paiements mixtes, espèces, M-Pesa, Airtel Money et Orange Money ;
- les demandes d'abonnement par M-Pesa, Airtel Money, Orange Money, virement ou paiement assisté par MEZANI ;
- l'ouverture, le suivi et la clôture de caisse avec écart de comptage ;
- les ardoises clients et leurs remboursements ;
- le stock en bouteille, casier, verre, dose, portion ou autre unité locale ;
- les pertes, casses, corrections et leur journal d'audit ;
- le cycle des commandes cuisine/bar et celui des réservations par table ;
- un tableau de bord et des rapports alimentés par l'API, exportables en CSV ou imprimables ;
- une PWA avec menu en cache et file locale pour les commandes/ventes créées sans connexion.

La file hors ligne est conservée sur l'appareil et rejouée avec une clé d'idempotence au retour du réseau. Les secrets ne sont jamais exposés dans des variables `NEXT_PUBLIC_*`.

## Vérifications

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

Le backend frère doit également être migré et testé après récupération des changements :

```powershell
Set-Location ..\mezani-resto-api
go run ./cmd/migrate
go test ./...
```
