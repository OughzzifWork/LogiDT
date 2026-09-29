# ARCHITECTURE TECHNIQUE & LOGICIELLE — LogiTrack

## 1. Vue d'Ensemble du Système

LogiTrack est architecturé pour un déploiement sécurisé sur infrastructure interne d'entreprise (on-premise ou cloud privé), éliminant toute dépendance obligatoire à un service SaaS tiers payant.

```
┌─────────────────────────────────────────────────────────────┐
│                 PWA FRONTEND (Mobile-First)                 │
│  - React 19 + TypeScript + Tailwind CSS                    │
│  - Service Worker (Cache offline & assets)                  │
│  - WebRTC Camera Stream & Barcode Scanner                   │
│  - Web Audio & Vibration API (Feedback immédiat)            │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON (Bearer Token)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 BACKEND EXPRESS API (Node.js)               │
│  - DevSecOps Middlewares (Rate Limiter, Security Headers)   │
│  - RBAC & Multi-Tenant Scoping Middleware                   │
│  - Router REST API (/api/*)                                 │
└──────────┬───────────────────┬───────────────────┬──────────┘
           │                   │                   │
           ▼                   ▼                   ▼
┌─────────────────────┐ ┌───────────────┐ ┌───────────────────┐
│   WORKFLOW ENGINE   │ │ PERSISTENT DB │ │  SECURE STORAGE   │
│ - Machine d'état    │ │ - Users       │ │ - Private Proofs  │
│ - Préconditions     │ │ - Orders      │ │ - Non-public disk │
│ - Validation BC/DT  │ │ - Carriers    │ │ - SHA-256 Hash    │
│ - Audit Append-Only │ │ - Drivers     │ │ - RBAC stream     │
└─────────────────────┘ └───────┬───────┘ └───────────────────┘
                                │
                                ▼
                ┌───────────────────────────────┐
                │   ERP INTEGRATION CONNECTOR   │
                │ - Import batch commandes      │
                │ - Export statuts & preuves    │
                │ - Base métier SQL isolée      │
                └───────────────────────────────┘
```

---

## 2. Machine d'État Opérationnelle

Le cycle de vie d'une commande est strictement contrôlé par le `WorkflowEngine` côté serveur. Aucune modification directe de statut n'est permise au frontend.

```
[ÉTAT: AFFECTE]
    │
    │ Action: Chauffeur arrive sur site de chargement
    │ Précondition: Commande assignée au chauffeur + Saisie/Scan BC ou N° Commande valide
    ▼
[ÉTAT: SUR_SITE]
    │
    │ Action: Chargement et validation de la marchandise
    │ Précondition: Commande en état SUR_SITE + Scan réussi du Document de Transport DT
    ▼
[ÉTAT: CHARGE]
    │
    │ Action: Déchargement chez le client destinataire
    │ Précondition: Commande en état CHARGE + Photo prise directement avec la caméra
    │               (Contrôle MIME, >2KB, SHA-256 certifié serveur, GPS)
    ▼
[ÉTAT: LIVRE]
    │
    │ Événement: Génération de l'empreinte d'intégrité, stockage privé
    ▼
[SYNCHRONISATION ERP / FACTURATION]
```

### Table des Transitions

| État Initial | Événement Déclencheur | Acteur Autorisé | Préconditions Vérifiées Côté Serveur | État Final |
|---|---|---|---|---|
| `CREEE` | Affectation Transporteur | ADMIN, LOGISTICS | Transporteur actif existant | `AFFECTEE_TRANSPORTEUR` |
| `AFFECTEE_TRANSPORTEUR` | Affectation Chauffeur | CARRIER (ou ADMIN) | Chauffeur appartient au transporteur assigné | `AFFECTEE_CHAUFFEUR` |
| `AFFECTE` | Arrivée sur site (`on-site`) | DRIVER assigné (ou ADMIN) | Code BC ou N° commande concorde avec la commande | `SUR_SITE` |
| `SUR_SITE` | Chargement effectué (`loaded`) | DRIVER assigné (ou ADMIN) | Code DT concorde avec le document de transport | `CHARGE` |
| `CHARGE` | Livraison terminée (`delivered`)| DRIVER assigné (ou ADMIN) | Flux photo valide, type MIME autorisé, hash calculé | `LIVRE` |

---

## 3. Découpage Modulaire du Backend

- **`src/server/db.ts`** :
  - Moteur de base de données transactionnel autonome avec persistance atomique sous forme de fichier structuré (`./data/db.json`).
  - Écritures protégées contre les corruptions par écriture temporaire et renommage atomique (`fs.renameSync`).
  - Indexation et méthodes de filtrage tenant-aware.
- **`src/server/workflow.ts`** :
  - Moteur de transitions d'état immuable.
  - Vérification systématique des préconditions métier et des droits du chauffeur/transporteur.
  - Déclenchement automatique des entrées dans le journal d'audit.
- **`src/server/erpService.ts`** :
  - Couche d'intégration ERP découplée avec interfaces modulaires pour import des commandes en attente et export des clôtures de livraison vers le système de facturation.
- **`server.ts`** :
  - Point d'entrée HTTP Express.
  - Middlewares de sécurité (CORS strict, Helmet headers, Rate Limiting in-memory).
  - Gestion des flux sécurisés pour les photos (stream authentifié sous contrôle RBAC).
  - Intégration Vite Middleware pour le développement à chaud.

---

## 4. Architecture Frontend et PWA

- **PWA Service Worker (`/public/sw.js`)** :
  - Cache statique pour les ressources critiques (HTML, CSS, JS, icônes SVG).
  - Stratégie `Network-Only` pour les actions logistiques sensibles afin de garantir la fraîcheur absolue des statuts opérationnels.
  - Gestion des états dégradés via notification hors ligne non intrusive (`OfflineIndicator`).
- **Composants Métier Dédiés** :
  - `DriverView.tsx` : UI optimisée pour smartphone, contrastes lisibles en extérieur, actions à une main.
  - `CarrierView.tsx` : Console de gestion de flotte et d'affectation de tournées, isolée par identifiant transporteur.
  - `LogisticsView.tsx` : Suivi global, identification des commandes en retard ou non facturées, passerelle ERP.
  - `AdminView.tsx` : Supervision, création des partenaires, journal d'audit et banc de tests de sécurité.
- **Capture Caméra Certifiée (`CameraCaptureModal.tsx`)** :
  - Utilise l'API standard `navigator.mediaDevices.getUserMedia` avec préférence caméra arrière (`facingMode: { ideal: "environment" }`).
  - Pas de balise `<input type="file">` permettant l'upload depuis la galerie.
  - Incrustation sur Canvas d'un cartouche filigrané infalsifiable (N° Commande, DT, Nom Chauffeur, Horodatage UTC, Coordonnées GPS).
- **Scanner Documents (`BarcodeScannerModal.tsx`)** :
  - Détection native par `BarcodeDetector` (formats 1D Code 128, EAN-13 et 2D QR).
  - Mode manuel de secours en cas d'endommagement du document imprimé.
  - Retours sensoriels : bip audio synthétique et vibration haptique.
