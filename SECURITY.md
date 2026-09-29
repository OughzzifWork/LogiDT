# POLITIQUE DE SÉCURITÉ & DEVSECOPS — LogiTrack

## 1. Modèle de Menaces (Threat Model)

Dans le secteur du transport logistique, les risques majeurs identifiés et neutralisés par LogiTrack sont :

| Menace | Vecteur d'Attaque | Solution Implémentée |
|---|---|---|
| **Fuite de données concurrentielle (IDOR)** | Un transporteur A modifie l'identifiant dans une requête pour lire les prix ou commandes du transporteur B. | Contrôle d'accès objet strict côté serveur : vérification systématique de `order.carrierId === user.carrierId` sur chaque route. Événement tracé dans l'audit en cas de tentative. |
| **Usurpation d'identité chauffeur** | Un chauffeur tente de valider la livraison d'un collègue ou d'une autre entreprise. | Vérification stricte de `order.driverId === user.driverId`. |
| **Saut d'étapes frauduleux** | Envoi d'une requête `delivered` directement sans être passé sur site ni avoir chargé la marchandise. | Machine d'état serveur rigide : rejet automatique (HTTP 400) si la commande n'est pas dans l'état préconditionnel requis. |
| **Falsification de preuve** | Réutilisation d'une photo ancienne de la galerie ou d'une image générée. | Flux direct WebRTC `getUserMedia`, désactivation de l'upload galerie, calcul d'empreinte SHA-256 certifiée serveur et horodatage UTC serveur. |
| **Exécution de code malveillant (Upload)** | Envoi d'un script ou binaire déguisé en photo JPEG. | Validation stricte du type MIME, contrôle de taille (2 Ko à 8 Mo), transcodage du buffer binaire et stockage hors de la racine web. |
| **Accès direct aux photos de livraison** | Téléchargement non authentifié d'une preuve via une URL statique prédictible. | Stockage dans un répertoire privé (`./data/proofs/`), aucun fichier public direct, diffusion uniquement via un endpoint API authentifié vérifiant les permissions du demandeur. |
| **Altération du journal d'audit** | Un utilisateur malveillant supprime les traces d'un litige. | Registre d'audit append-only sans endpoint d'effacement ou de mise à jour. |

---

## 2. Analyse et Niveau Réel de Garantie Juridique des Preuves

> **Avertissement de transparence** : Une application web ou mobile ne peut, à elle seule, offrir une « garantie absolue » de présence physique sans dispositif matériel sécurisé inviolable (Secure Enclave / HSM certifié). Voici le niveau de garantie réel et transparent fourni par LogiTrack :

1. **Intégrité Cryptographique (Non-répudiation du fichier)** :
   - L'application calcule une empreinte **SHA-256** unique dès la réception serveur.
   - Toute altération ultérieure d'un seul pixel du fichier modifierait ce hash et révélerait la falsification.
2. **Horodatage Certifié Serveur** :
   - La date et l'heure ne reposent pas sur l'horloge du téléphone (qui peut être modifiée par le chauffeur), mais sur l'horloge système du serveur en temps UTC (`serverReceivedAt`).
3. **Cartouche d'Inviolabilité Visuelle (Watermarking)** :
   - Le cartouche est incrusté directement dans les pixels de l'image (N° commande, DT, nom chauffeur, date, coordonnées GPS).
4. **Géolocalisation Assistée** :
   - Les coordonnées GPS et le rayon de précision (accuracy) sont collectés via l'API Geolocation HTML5 avec consentement explicite.

---

## 3. Contrôles d'Accès et Multi-Tenant (Anti-IDOR)

### Matrice des Permissions (RBAC)

| Ressource / Action | ADMIN | LOGISTICS | CARRIER | DRIVER |
|---|---|---|---|---|
| Voir toutes les commandes | ✅ | ✅ | ❌ (Ses commandes uniquement) | ❌ (Ses affectations uniquement) |
| Créer une commande | ✅ | ✅ | ❌ | ❌ |
| Affecter au transporteur | ✅ | ✅ | ❌ | ❌ |
| Affecter au chauffeur | ✅ | ❌ | ✅ (Ses chauffeurs uniquement) | ❌ |
| Confirmer Sur Site (BC) | ✅ (Secours) | ❌ | ❌ | ✅ (Chauffeur assigné) |
| Confirmer Chargé (DT) | ✅ (Secours) | ❌ | ❌ | ✅ (Chauffeur assigné) |
| Confirmer Livré (Caméra) | ✅ (Secours) | ❌ | ❌ | ✅ (Chauffeur assigné) |
| Voir la preuve photo | ✅ | ✅ | ✅ (Si son compte) | ✅ (Si sa livraison) |
| Consulter le journal d'audit| ✅ | ✅ | ❌ | ❌ |
| Lancer les tests de sécurité| ✅ | ❌ | ❌ | ❌ |

---

## 4. Mesures de Durcissement Serveur (Hardening)

- **Headers HTTP Sécurisés** :
  - `X-Content-Type-Options: nosniff` (Empêche le MIME sniffing).
  - `X-Frame-Options: SAMEORIGIN` (Protection contre le clickjacking).
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy: camera=*, geolocation=*`.
- **Limitation de Débit (Rate Limiting)** :
  - 300 requêtes par minute par adresse IP, renvoyant un code HTTP `429 Too Many Requests` en cas de dépassement.
- **Stockage Privé des Fichiers** :
  - Les fichiers de preuve sont enregistrés dans un dossier système non accessible directement par le serveur web (`./data/proofs/`).

---

## 5. Procédure de Signalement des Vulnérabilités

Tout incident ou faille potentielle doit être adressé à l'équipe DevSecOps interne à : `security@logitrack.internal`.
