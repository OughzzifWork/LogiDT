# JOURNAL DES MODIFICATIONS (CHANGELOG) — LogiTrack

Toutes les modifications notables apportées à ce projet sont documentées dans ce fichier.
Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/) et ce projet adhère à [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-09-29
### Added
- **Sélecteur de Thème Sombre / Clair (`ThemeContext`, `ThemeToggleButton`)** :
  - Bouton interactif permettant de basculer instantanément entre le mode sombre et le mode clair.
  - Détection automatique des préférences système (`prefers-color-scheme`) et mémorisation du choix dans le `localStorage`.
  - Bouton accessible dans l'en-tête principal, sur la page de connexion et dans la barre latérale.
  - Styles CSS adaptés pour le mode clair (fonds blanc/ardoise clair, cartes nettes, contrastes et lisibilité renforcés pour les chauffeurs en extérieur).

## [1.1.0] - 2026-09-29
### Added
- **Page de Connexion Dédiée (`LoginPage.tsx`)** :
  - Écran d'accueil avant tout accès aux fonctionnalités protégées.
  - Sélecteur rapide par profil (Chauffeur, Transporteur, Logistique, Admin AIA) et saisie par email professionnel.
  - Persistance de la session locale (`localStorage`) et bouton de déconnexion.
- **Barre Latérale de Navigation avec Onglets (`Sidebar.tsx`)** :
  - Sidebar fixe sur écran desktop et tiroir coulissant fluide sur écran smartphone.
  - Onglets personnalisés par rôle (ex: Ma Tournée, Historique & Preuves, Profil Conducteur, Commandes Reçues, Flotte, Passerelle ERP, Banc de tests de sécurité).
  - Badge utilisateur, identifiant tenant et bouton d'installation PWA intégrés.

## [1.0.0] - 2026-09-29

### Initial Release — Production & PWA Complete

#### Ajouté
- **Workflow & Machine d'État Opérationnelle** :
  - Cycle strict : `AFFECTE` → `SUR_SITE` → `CHARGE` → `LIVRE`.
  - Contrôle d'accès basé sur les rôles (RBAC) pour les profils `ADMIN`, `LOGISTICS`, `CARRIER`, `DRIVER`.
  - Validation serveur des préconditions métier et concordance des documents BC et DT.
- **PWA (Progressive Web App)** :
  - Web App Manifest standardisé (`/public/manifest.webmanifest`) avec affichage `standalone`.
  - Service Worker (`/public/sw.js`) pour mise en cache des assets statiques et fonctionnement dégradé hors-ligne.
  - Détecteur de connectivité réseau et bannière d'état hors-ligne non intrusive (`OfflineIndicator`).
  - Composant de proposition d'installation in-app (`PWAInstallButton`) avec guide interactif dédié pour iOS Safari.
  - Icônes vectorielles SVG haute fidélité (`/public/icon.svg`).
- **Caméra & Preuve de Livraison Inviolable** :
  - Modal caméra directe utilisant `navigator.mediaDevices.getUserMedia` avec préférence caméra arrière (`facingMode: environment`).
  - Désactivation complète de l'import depuis la galerie de fichiers.
  - Incrustation sur Canvas d'un cartouche de filigrane infalsifiable (N° Commande, DT, Nom Chauffeur, Horodatage UTC certifié serveur, Coordonnées GPS).
  - Calcul d'empreinte cryptographique `SHA-256` sur les octets du fichier image.
  - Répertoire privé sécurisé `./data/proofs/` accessible uniquement via un endpoint HTTP authentifié vérifiant les permissions de l'utilisateur.
- **Scanner Mobile Universel** :
  - Moteur de lecture de codes-barres 1D (Code 128, EAN-13, Code 39) et 2D QR Codes via l'API standard `BarcodeDetector`.
  - Mode de saisie manuelle de repli en cas de dégradation physique du document imprimé.
  - Retours sensoriels immédiats : bips sonores synthétisés via l'API Web Audio et vibrations haptiques (`navigator.vibrate`).
- **Isolation Multi-Tenant & DevSecOps (Anti-IDOR)** :
  - Cloisonnement hermétique des transporteurs : impossibilité de lire ou modifier les commandes et chauffeurs d'un tiers (HTTP 403 Forbidden).
  - Filtrage automatique des requêtes au niveau de la couche d'accès aux données.
  - Limitation de débit in-memory (Rate Limiter) et en-têtes HTTP de sécurité renforcés.
  - Banc d'essais de sécurité interactif intégré (`SecurityTestPanel`) pour exécuter et prouver la résistance aux attaques IDOR à la demande.
- **Journal d'Audit Immuable (WORM)** :
  - Registre d'audit append-only consignant chaque transition d'état, adresse IP, agent utilisateur et tentative de violation.
  - Tiroir d'inspection détaillé avec filtrage par commande et recherche textuelle.
- **Passerelle d'Intégration ERP Découplée** :
  - Service modulaire (`ErpService`) simulant l'importation de lots de commandes depuis la base SQL métier et l'exportation des statuts clôturés vers la comptabilité / facturation.
- **Suite de Tests Complète** :
  - 16 tests automatisés couvrant les aspects unitaires, d'intégration, de sécurité IDOR et le scénario complet de bout en bout (`npm test`).
