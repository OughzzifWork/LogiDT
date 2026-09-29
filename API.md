# RÉFÉRENTIEL DES API REST — LogiTrack

## 1. Conventions Générales

- **Format des échanges** : `application/json` (encodage UTF-8)
- **Authentification** : Header HTTP `Authorization: Bearer <token>`
- **Gestion des erreurs** : Retourne un objet JSON au format :
  ```json
  {
    "error": "Message explicatif en français",
    "code": "CODE_ERREUR_TECHNIQUE"
  }
  ```
- **Codes HTTP utilisés** :
  - `200 OK` : Opération réussie.
  - `201 Created` : Ressource créée.
  - `400 Bad Request` : Erreur de validation de données ou violation de la machine d'état.
  - `401 Unauthorized` : Token manquant ou invalide.
  - `403 Forbidden` : Violation des permissions RBAC ou tentative d'accès cross-tenant (Anti-IDOR).
  - `404 Not Found` : Ressource introuvable.
  - `429 Too Many Requests` : Seuil de débit dépassé (Rate Limiter).
  - `500 Internal Server Error` : Erreur interne non gérée.

---

## 2. Authentification & Profils

### `POST /api/auth/login`
Authentifie un utilisateur ou bascule de profil.
- **Corps de la requête** :
  ```json
  { "userId": "usr_drv_marc" }
  ```
- **Réponse (`200 OK`)** :
  ```json
  {
    "token": "usr_drv_marc",
    "user": {
      "id": "usr_drv_marc",
      "name": "Marc Leclerc (Chauffeur)",
      "email": "marc.leclerc@transports-dupont.fr",
      "role": "DRIVER",
      "carrierId": "carr_dupont",
      "driverId": "drv_marc",
      "active": true
    }
  }
  ```

### `GET /api/auth/me`
Retourne le profil de l'utilisateur actuellement authentifié.

### `GET /api/users`
Liste les utilisateurs disponibles (utilisé pour la démonstration et le basculement rapide).

---

## 3. Commandes & Filtres

### `GET /api/orders`
Retourne la liste des commandes, **filtrée automatiquement selon le rôle de l'utilisateur** :
- `ADMIN` & `LOGISTICS` : Accès à toutes les commandes.
- `CARRIER` : Commandes où `carrierId === user.carrierId`.
- `DRIVER` : Commandes où `driverId === user.driverId`.

**Paramètres Query optionnels** :
- `operationalStatus` : `AFFECTE` | `SUR_SITE` | `CHARGE` | `LIVRE`
- `billingStatus` : `FACTUREE` | `NON_FACTUREE`
- `search` : Recherche textuelle (N° Commande, Client, BC, DT, Ville).

### `GET /api/orders/:id`
Récupère les détails complets d'une commande.
- **Sécurité Multi-Tenant** : Si un transporteur tente d'accéder à une commande n'appartenant pas à son `carrierId`, l'API répond systématiquement par un code **`403 Forbidden`** et consigne l'incident dans le journal d'audit.

### `POST /api/orders`
Création manuelle d'une commande (Réservé à `ADMIN` et `LOGISTICS`).

---

## 4. Machine d'État & Workflow Opérationnel

### `POST /api/orders/:id/assign-carrier`
Affecte une commande à un transporteur.
- **Rôles autorisés** : `ADMIN`, `LOGISTICS`
- **Corps de la requête** :
  ```json
  { "carrierId": "carr_dupont" }
  ```

### `POST /api/orders/:id/assign-driver`
Affecte un chauffeur à la commande.
- **Rôles autorisés** : `CARRIER` (sur ses commandes uniquement) ou `ADMIN`.
- **Corps de la requête** :
  ```json
  { "driverId": "drv_marc" }
  ```

### `POST /api/orders/:id/on-site`
Valide l'arrivée sur site de chargement.
- **Rôles autorisés** : `DRIVER` assigné à la commande ou `ADMIN`.
- **Précondition** : Commande en état `AFFECTE`.
- **Corps de la requête** :
  ```json
  {
    "bcInput": "BC-10254",
    "isManual": false
  }
  ```
- **Validation serveur** : Le code `bcInput` doit correspondre exactement au `bcNumber` ou au `orderNumber`. En cas de succès, le statut passe à `SUR_SITE`.

### `POST /api/orders/:id/loaded`
Valide le chargement effectif de la marchandise.
- **Rôles autorisés** : `DRIVER` assigné à la commande ou `ADMIN`.
- **Précondition** : Commande en état `SUR_SITE`.
- **Corps de la requête** :
  ```json
  { "dtInput": "DT-10254" }
  ```
- **Validation serveur** : Le code `dtInput` doit correspondre au `dtNumber`. En cas de succès, le statut passe à `CHARGE`.

### `POST /api/orders/:id/delivered`
Enregistre la preuve de déchargement et clôture la livraison.
- **Rôles autorisés** : `DRIVER` assigné à la commande ou `ADMIN`.
- **Précondition** : Commande en état `CHARGE`.
- **Corps de la requête** :
  ```json
  {
    "imageBase64": "data:image/jpeg;base64,...",
    "mimeType": "image/jpeg",
    "gpsLatitude": 50.3708,
    "gpsLongitude": 3.0768,
    "gpsAccuracy": 12,
    "capturedAt": "2026-09-29T10:15:30.000Z",
    "deviceInfo": "Chrome Mobile / Android PWA"
  }
  ```
- **Contrôles appliqués** :
  1. Vérification du format MIME (`image/jpeg`, `image/png`, `image/webp`).
  2. Vérification de la taille (>2 Ko, <8 Mo).
  3. Calcul de l'empreinte `SHA-256`.
  4. Sauvegarde dans le stockage privé `./data/proofs/`.
  5. Passage de la commande à l'état `LIVRE`.
- **Réponse (`200 OK`)** :
  ```json
  {
    "order": { "id": "ord_10254", "operationalStatus": "LIVRE", ... },
    "proof": {
      "id": "prf_...",
      "sha256Hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "serverReceivedAt": "2026-09-29T10:15:32.411Z"
    }
  }
  ```

---

## 5. Preuves de Livraison & Sécurité des Fichiers

### `GET /api/orders/:id/proof`
Récupère les métadonnées de la preuve de livraison (hash, horodatage, GPS).

### `GET /api/proofs/:id/file`
Diffuse le flux binaire de l'image de preuve.
- **Sécurité** : Endpoint soumis au contrôle RBAC. Un transporteur ne peut pas visionner la preuve d'un tiers.
- **Headers HTTP émis** :
  - `Content-Type: image/jpeg`
  - `Cache-Control: private, no-cache, no-store, must-revalidate`
  - `X-Proof-SHA256: <hash>`

---

## 6. Journal d'Audit & Conformité

### `GET /api/audit-logs`
Récupère le registre d'audit immuable.
- **Rôles autorisés** : `ADMIN`, `LOGISTICS`.
- **Filtres Query** : `orderId`, `limit`.

---

## 7. Passerelle d'Intégration ERP

### `GET /api/erp/status`
État de synchronisation avec le système ERP central.

### `POST /api/erp/sync`
Déclenche l'import des commandes en attente depuis l'ERP.

### `POST /api/erp/export`
Exporte les preuves de livraison et clôtures opérationnelles vers la comptabilité / facturation ERP.

---

## 8. Tests de Sécurité Automatisés

### `POST /api/security/test-idor`
Exécute un test de pénétration simulé où un transporteur tente d'accéder à la commande d'un concurrent et retourne la preuve du blocage HTTP 403.
