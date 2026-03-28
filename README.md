# DistriPain — Frontend

Application web Angular pour la gestion des tournées de livraison de pain.

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Framework | Angular 19 (standalone components) |
| Styles | TailwindCSS |
| State | Angular Signals |
| HTTP | HttpClient + interceptors |
| Auth | JWT access token en mémoire + refresh cookie |
| Dark mode | Tailwind dark class strategy |

## Installation

```bash
cd distripainfe
npm install
```

## Lancement

```bash
# Développement
ng serve
# → http://localhost:4200

# Build production
ng build
# → dist/distripainfe/
```

> L'URL de l'API backend est configurée dans `src/environments/environment.ts`.

## Structure du projet

```
src/app/
├── core/
│   ├── auth/
│   │   ├── auth.interceptor.ts      # Injecte le token JWT (sauf routes /admin/)
│   │   └── auth.guard.ts            # Protège les routes authentifiées
│   ├── models/                      # Interfaces TypeScript
│   │   ├── auth.models.ts           # CurrentUser, LoginRequest…
│   │   ├── client.models.ts         # Client, ClientCreate…
│   │   ├── tournee.models.ts
│   │   ├── encaissement.models.ts
│   │   ├── dette.models.ts
│   │   ├── abonnement.models.ts     # Formules, paiements, moyens
│   │   ├── pays.models.ts
│   │   └── admin.models.ts
│   └── services/
│       ├── auth.service.ts          # Login, refresh, currentUser signal
│       ├── api.service.ts           # Tous les appels API livreur
│       └── admin-api.service.ts     # Appels API admin (token Bearer)
├── features/
│   ├── auth/                        # Login, inscription, must-change-password
│   ├── dashboard/                   # Tableau de bord livreur
│   ├── clients/                     # Liste, détail, formulaire client
│   ├── tournees/                    # Liste, détail, nouvelle tournée
│   ├── encaissements/               # Liste, formulaire encaissement
│   ├── dettes/                      # Liste et gestion des dettes
│   ├── boulangeries/                # Liste et formulaire boulangerie
│   ├── zones/                       # Gestion des zones
│   ├── portions/                    # Catalogue portions de pain
│   ├── statistiques/                # Dashboard statistiques multi-période
│   ├── profil/                      # Profil livreur (lecture pays, MDP)
│   ├── abonnement/                  # Abonnement livreur (souscription, paiement)
│   └── admin/
│       ├── admin-layout/            # Shell admin avec sidebar
│       ├── admin-dashboard/         # KPIs plateforme
│       ├── admin-livreurs/          # Liste livreurs + performances
│       ├── admin-livreur-detail/    # Détail livreur (stats, graphe revenus)
│       ├── admin-livreur-permissions/ # Gestion permissions acolytes
│       ├── admin-pays/              # CRUD pays et devises
│       ├── admin-formules/          # CRUD formules d'abonnement
│       ├── admin-abonnements/       # Validation des paiements
│       └── admin-moyens-paiement/   # CRUD moyens de paiement
└── shared/
    └── components/                  # Composants réutilisables
        ├── page-header/
        ├── loading-spinner/
        ├── status-badge/
        └── confirm-dialog/
```

## Authentification

- Le token JWT est stocké en mémoire (`AuthService`) — jamais dans `localStorage`
- Le refresh token est un cookie HttpOnly géré automatiquement par le navigateur
- L'intercepteur `auth.interceptor.ts` injecte le Bearer token sur toutes les requêtes **sauf** `/admin/`
- L'admin utilise un token séparé stocké dans `localStorage` via `AdminApiService`

## Multi-devises

Chaque livreur et chaque client peut être rattaché à un pays. La devise s'affiche dynamiquement partout (montants, labels de formulaires) à partir de `currentUser().pays?.devise_code` ou `client.pays?.devise_code`.

## Dark mode

Activé via la classe `.dark` sur le `<html>`. Persisté dans `localStorage`. Bascule disponible dans la sidebar.
