# LogiTrack PWA — Gestion des Commandes et Livraisons

> Application PWA professionnelle, mobile-first, sécurisée et installable pour la gestion de la chaîne de transport, des chauffeurs et de la certification des livraisons par preuve photo infalsifiable.

---

## 📋 Table des Matières

- [1. Présentation du Projet](#1-présentation-du-projet)
- [2. Workflow Opérationnel](#2-workflow-opérationnel)
- [3. Rôles et Périmètres (RBAC)](#3-rôles-et-périmètres-rbac)
- [4. Fonctionnalités Clés](#4-fonctionnalités-clés)
- [5. Architecture et Stack Technique](#5-architecture-et-stack-technique)
- [6. Démarrage Rapide](#6-démarrage-rapide)
- [7. Documentation Complète](#7-documentation-complète)

---

## 1. Présentation du Projet

LogiTrack répond aux impératifs critiques de la logistique industrielle et du transport de marchandises :
- **Autonomie complète sans dépendance SaaS cloud payante** : Déployable à 100% on-premise sur l'infrastructure interne de l'entreprise.
- **Ergonomie Mobile-First Chauffeur** : Interface conçue pour une utilisation rapide sur smartphone (gros boutons, contrastes élevés, retours haptiques et sonores, scan et appareil photo en accès direct).
- **Inviolabilité des Preuves de Livraison** : Capture directe via le flux vidéo de la caméra (sans sélection de galerie), horodatage UTC certifié par le serveur, calcul d'empreinte SHA-256 et géolocalisation.
- **Sécurité et Isolation Multi-Tenant (Anti-IDOR)** : Chaque transporteur ne peut accéder qu'à ses propres ordres de transport et à ses propres chauffeurs.

---

## 2. Workflow Opérationnel

Le workflow opérationnel suit strictement la machine d'état serveur :

```
[ Commande Métier ERP ]
         ↓
Affectation au transporteur (Logistique / AIA)
         ↓
Affectation au chauffeur (Transporteur)
         ↓
[ SUR SITE ] — Arrivée sur site de chargement & Vérification de l'affectation
         ↓  (Scan BC / Saisie manuelle du numéro de commande)
[ CHARGÉ ]   — Validation de la prise en charge
         ↓  (Scan du Document de Transport DT)
[ LIVRÉ ]    — Déchargement chez le client destinataire
         ↓  (Capture photo directe caméra + Empreinte SHA-256 + GPS)
[ PREUVE CERTIFIÉE ] & Synchronisation ERP Facturation
```

---

## 3. Rôles et Périmètres (RBAC)

1. **AIA / Administrateur (`ADMIN`)** :
   - Accès global sans restriction (commandes, transporteurs, chauffeurs, audit complet).
   - Contrôle du banc de test de sécurité DevSecOps.
2. **Responsable Logistique (`LOGISTICS`)** :
   - Suivi opérationnel global, affectation des transporteurs.
   - Filtre ciblé sur les commandes *non facturées / non livrées*.
   - Déclenchement de l'import/export vers le système ERP.
3. **Transporteur Partenaire (`CARRIER`)** :
   - Périmètre cloisonné (multi-tenant hermétique).
   - Ne voit que ses commandes et ses chauffeurs.
   - Affectation de ses chauffeurs sur ses commandes.
4. **Chauffeur (`DRIVER`)** :
   - Ergonomie smartphone à une main.
   - Accès restreint uniquement à ses commandes affectées.
   - Actions étape par étape : Scan BC → Scan DT → Photo caméra directe.

---

## 4. Fonctionnalités Clés

- 📱 **PWA Installable** : Manifest Web standard, icônes conformes, mode hors-ligne avec Service Worker et prompt d'installation in-app pour Android, Chromium et iOS Safari.
- 📷 **Caméra et Preuves Inviolables** : Flux WebRTC direct via `getUserMedia({ facingMode: "environment" })`, watermark dynamique incrusté (Commande, Date, Chauffeur, GPS), hash SHA-256 certifié serveur.
- 🔍 **Scanner Universel** : Prise en charge des codes-barres 1D (Code 128, EAN) et QR Codes via BarcodeDetector API et saisie manuelle de secours.
- 🛡️ **DevSecOps & Anti-IDOR** : Middlewares de sécurité, contrôle systématique du tenant en base, headers HTTP stricts, stockage privé des photos non exposé au web.
- 📜 **Audit Log Immuable** : Registre d'audit append-only traçant chaque changement de statut, adresse IP, identifiant d'opérateur et alertes de sécurité.

---

## 5. Architecture et Stack Technique

- **Frontend** : React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend API** : Node.js, Express, tsx.
- **Stockage Données** : Moteur de stockage transactionnel local avec persistance atomique `./data/db.json` et répertoire privé `./data/proofs/`.
- **Intégration** : Connecteur ERP découplé en lecture/écriture avec réconciliation des facturations.

---

## 6. Démarrage Rapide

### Prérequis
- Node.js 20+ ou 22+
- npm ou npx

### Installation et Lancement

```bash
# Installation des dépendances
npm install

# Lancement du serveur full-stack dev (port 3000)
npm run dev

# Exécution de la suite complète de tests (Unitaires, Sécurité IDOR, E2E, ERP)
npm test

# Build de production
npm run build
npm start
```

---

## 7. Documentation Complète

- [ARCHITECTURE.md](./ARCHITECTURE.md) : Diagrammes d'architecture, couches logicielles et flux.
- [DATABASE.md](./DATABASE.md) : Modèle de données normalisé, clés, index et contraintes.
- [API.md](./API.md) : Référentiel des endpoints REST, codes d'erreur et schémas.
- [SECURITY.md](./SECURITY.md) : Modèle de menaces, DevSecOps, tests anti-IDOR et intégrité des preuves.
- [DEPLOYMENT.md](./DEPLOYMENT.md) : Guide de déploiement on-premise, Docker et sauvegardes.
- [TESTING.md](./TESTING.md) : Stratégie de tests et rapports d'exécution.
- [USER-GUIDE.md](./USER-GUIDE.md) : Guide d'utilisation par profil (Chauffeur, Transporteur, Logistique, Admin).
- [CHANGELOG.md](./CHANGELOG.md) : Historique des versions et évolutions.
- [PROJECT-FINAL-REPORT.md](./PROJECT-FINAL-REPORT.md) : Rapport final d'architecture et de livraison.
