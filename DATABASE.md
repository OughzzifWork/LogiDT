# MODÈLE DE DONNÉES & BASE DE DONNÉES — LogiTrack

## 1. Schéma Relationnel Normalisé

Le schéma de données de LogiTrack est normalisé en troisième forme normale (3NF) et comprend les entités suivantes :

```
┌──────────────┐       ┌─────────────────┐       ┌────────────────┐
│   Carriers   │1     *│     Drivers     │1     *│     Orders     │
│──────────────│───────│─────────────────│───────│────────────────│
│ id (PK)      │       │ id (PK)         │       │ id (PK)        │
│ code (UQ)    │       │ carrierId (FK)  │       │ orderNumber(UQ)│
│ name         │       │ firstName       │       │ bcNumber (IDX) │
│ contactEmail │       │ lastName        │       │ dtNumber (IDX) │
│ contactPhone │       │ licenseNumber   │       │ blFcNumber     │
│ active       │       │ vehiclePlate    │       │ carrierId (FK) │
│ createdAt    │       │ active          │       │ driverId (FK)  │
└──────────────┘       │ createdAt       │       │ opStatus (IDX) │
                       └─────────────────┘       │ billStatus     │
                                                 │ createdAt      │
                                                 └───────┬────────┘
                                                         │ 1
                                                         │
                                                         │ 1
                                                 ┌───────▼────────┐
                                                 │ DeliveryProofs │
                                                 │────────────────│
                                                 │ id (PK)        │
                                                 │ orderId (FK,UQ)│
                                                 │ driverId (FK)  │
                                                 │ sha256Hash     │
                                                 │ fileSizeBytes  │
                                                 │ mimeType       │
                                                 │ gpsLatitude    │
                                                 │ gpsLongitude   │
                                                 │ capturedAt     │
                                                 │ serverReceived │
                                                 │ storedPath     │
                                                 └────────────────┘

┌─────────────────┐       ┌────────────────────────┐
│      Users      │       │       AuditLogs        │
│─────────────────│       │────────────────────────│
│ id (PK)         │       │ id (PK)                │
│ email (UQ)      │       │ orderId (FK, NULLABLE) │
│ name            │       │ eventType (IDX)        │
│ role (IDX)      │       │ actorId (FK)           │
│ carrierId (FK)  │       │ actorRole              │
│ driverId (FK)   │       │ previousStatus         │
│ active          │       │ newStatus              │
│ createdAt       │       │ ipAddress              │
└─────────────────┘       │ userAgent              │
                          │ timestamp (IDX)        │
                          │ details (JSON)         │
                          └────────────────────────┘
```

---

## 2. Dictionnaire des Entités

### 2.1 Table `Carriers` (Transporteurs)
| Champ | Type | Contraintes | Description |
|---|---|---|---|
| `id` | VARCHAR(64) | PK | Identifiant unique du transporteur (`carr_...`) |
| `code` | VARCHAR(32) | UNIQUE, NOT NULL | Code interne entreprise (`DUPONT-01`) |
| `name` | VARCHAR(128) | NOT NULL | Raison sociale du transporteur |
| `contactEmail`| VARCHAR(128) | NOT NULL | Adresse de contact opérationnelle |
| `contactPhone`| VARCHAR(32) | NOT NULL | Ligne téléphonique de contact |
| `active` | BOOLEAN | DEFAULT TRUE | Indicateur d'activité commerciale |
| `createdAt` | TIMESTAMP | ISO 8601 UTC | Date d'enregistrement |

### 2.2 Table `Drivers` (Chauffeurs)
| Champ | Type | Contraintes | Description |
|---|---|---|---|
| `id` | VARCHAR(64) | PK | Identifiant unique du chauffeur (`drv_...`) |
| `carrierId` | VARCHAR(64) | FK -> Carriers.id | Transporteur employeur / tenant |
| `firstName` | VARCHAR(64) | NOT NULL | Prénom du conducteur |
| `lastName` | VARCHAR(64) | NOT NULL | Nom de famille |
| `phone` | VARCHAR(32) | NULLABLE | Numéro de téléphone portable |
| `licenseNumber`| VARCHAR(64)| NULLABLE | Numéro du permis de conduire |
| `vehiclePlate`| VARCHAR(32) | NULLABLE | Immatriculation du véhicule affecté |
| `active` | BOOLEAN | DEFAULT TRUE | Statut de disponibilité opérationnelle |
| `createdAt` | TIMESTAMP | ISO 8601 UTC | Date de création |

### 2.3 Table `Orders` (Commandes & Documents Métier)
| Champ | Type | Contraintes | Description |
|---|---|---|---|
| `id` | VARCHAR(64) | PK | Identifiant unique interne (`ord_...`) |
| `orderNumber` | VARCHAR(64) | UNIQUE, INDEX | Numéro de commande métier (`CMD-10254`) |
| `bcNumber` | VARCHAR(64) | INDEX | Numéro du Bon de Commande (`BC-10254`) |
| `dtNumber` | VARCHAR(64) | INDEX | Numéro du Document de Transport (`DT-10254`) |
| `blFcNumber` | VARCHAR(64) | INDEX | Référence Bon de Livraison / Facturation |
| `clientName` | VARCHAR(128)| NOT NULL | Raison sociale du client destinataire |
| `deliveryAddress`| TEXT | NOT NULL | Adresse physique de déchargement |
| `destinationCity`| VARCHAR(64)| INDEX | Ville de destination |
| `postalCode` | VARCHAR(16) | NOT NULL | Code postal |
| `cargoDescription`| TEXT | NOT NULL | Nature des marchandises transportées |
| `packagesCount`| INTEGER | CHECK (> 0) | Nombre total de colis ou palettes |
| `weightKg` | FLOAT | CHECK (> 0) | Poids total brut en kilogrammes |
| `billingStatus`| ENUM | FACTUREE / NON_FACTUREE | Statut de facturation ERP |
| `operationalStatus`| ENUM | AFFECTE / SUR_SITE / CHARGE / LIVRE | Statut de la machine d'état |
| `adminStatus`| ENUM | Cycle complet administratif |
| `carrierId` | VARCHAR(64) | FK -> Carriers.id, NULLABLE | Transporteur assigné |
| `driverId` | VARCHAR(64) | FK -> Drivers.id, NULLABLE | Chauffeur assigné |
| `createdAt` | TIMESTAMP | ISO 8601 UTC | Horodatage d'importation |
| `updatedAt` | TIMESTAMP | ISO 8601 UTC | Dernière modification |

### 2.4 Table `DeliveryProofs` (Preuves de Déchargement Certifiées)
| Champ | Type | Contraintes | Description |
|---|---|---|---|
| `id` | VARCHAR(64) | PK | Identifiant unique de la preuve (`prf_...`) |
| `orderId` | VARCHAR(64) | FK -> Orders.id, UNIQUE | Commande liée (relation 1-to-1) |
| `driverId` | VARCHAR(64) | FK -> Drivers.id | Chauffeur ayant pris la photo |
| `fileName` | VARCHAR(128)| NOT NULL | Nom du fichier stocké en privé |
| `fileSizeBytes`| INTEGER | NOT NULL | Taille du fichier en octets |
| `mimeType` | VARCHAR(32) | IN ('image/jpeg','image/png','image/webp') | Format de la photo |
| `sha256Hash` | CHAR(64) | NOT NULL, INDEX | Empreinte cryptographique de non-répudiation |
| `gpsLatitude` | FLOAT | NULLABLE | Latitude au moment de la prise |
| `gpsLongitude`| FLOAT | NULLABLE | Longitude au moment de la prise |
| `gpsAccuracy` | INTEGER | NULLABLE | Précision GPS en mètres |
| `capturedAt` | TIMESTAMP | Horodatage terminal mobile | Date/heure sur l'appareil |
| `serverReceivedAt`| TIMESTAMP | ISO 8601 UTC certifié | Horodatage officiel serveur |
| `watermarkText`| TEXT | NOT NULL | Texte du filigrane incrusté |
| `storedPath` | TEXT | NOT NULL | Chemin absolu dans le stockage privé |

### 2.5 Table `AuditLogs` (Journal Immuable d'Audit)
| Champ | Type | Contraintes | Description |
|---|---|---|---|
| `id` | VARCHAR(64) | PK | Identifiant de l'événement (`aud_...`) |
| `orderId` | VARCHAR(64) | FK -> Orders.id, NULLABLE | Commande concernée |
| `eventType` | VARCHAR(64) | INDEX | Type d'action (CARRIER_ASSIGNED, etc.) |
| `previousStatus`| VARCHAR(64)| NULLABLE | Ancien statut opérationnel |
| `newStatus` | VARCHAR(64) | NULLABLE | Nouveau statut validé |
| `actorId` | VARCHAR(64) | FK -> Users.id | Utilisateur ayant exécuté l'action |
| `actorName` | VARCHAR(128)| NOT NULL | Nom complet de l'acteur |
| `actorRole` | VARCHAR(32) | NOT NULL | Rôle de l'acteur (DRIVER, CARRIER, etc.) |
| `ipAddress` | VARCHAR(45) | NOT NULL | Adresse IP cliente |
| `userAgent` | TEXT | NOT NULL | Navigateur ou terminal émetteur |
| `timestamp` | TIMESTAMP | ISO 8601 UTC | Horodatage précis |
| `details` | JSON | NOT NULL | Contexte et données complémentaires |

---

## 3. Stratégie d'Indexation & Performance

Pour garantir des temps de réponse inférieurs à 15 ms même sur une base contenant des dizaines de milliers de lignes :
- `idx_orders_search` : Sur `(orderNumber, bcNumber, dtNumber, clientName)`.
- `idx_orders_tenant_status` : Sur `(carrierId, operationalStatus)` pour les requêtes filtrées des transporteurs.
- `idx_orders_driver_status` : Sur `(driverId, operationalStatus)` pour le chargement instantané de la tournée chauffeur.
- `idx_orders_billing_status` : Sur `(billingStatus, operationalStatus)` pour les alertes logistiques.
- `idx_audit_order_timestamp` : Sur `(orderId, timestamp DESC)` pour l'historique complet d'une commande.

---

## 4. Immuabilité et Principe Write-Once-Read-Many (WORM)

1. La table `AuditLogs` n'expose **aucune méthode de modification (UPDATE) ni de suppression (DELETE)**.
2. Tout événement de sécurité ou tentative d'accès illégitime génère immédiatement une entrée `SECURITY_VIOLATION_ATTEMPT`.
3. Les photos stockées dans `data/proofs/` ont des permissions de fichiers en lecture seule après écriture.
