# GUIDE UTILISATEUR — LogiTrack PWA

Ce guide détaille le fonctionnement de LogiTrack pour chacun des 4 profils utilisateurs.

---

## 1. Page de Connexion & Authentification

Au premier lancement, l'utilisateur est accueilli par la **page de connexion dédiée** :
- **Sélection rapide (Démo)** : Permet de se connecter en un clic selon le rôle souhaité (Chauffeur Marc, Chauffeur Pierre, Transporteur Dupont, Transporteur Sud, Logistique Sophie, Admin AIA Paul).
- **Email professionnel** : Saisie classique d'un email professionnel.
- La session est mémorisée localement (`localStorage`). Le bouton **Se déconnecter** présent au bas de la barre latérale permet de revenir à tout moment à la page de connexion.

---

## 2. Navigation par Barre Latérale (Sidebar avec Onglets)

Une barre latérale ergonomique (fixe sur ordinateur, tiroir coulissant sur mobile via l'icône menu) structure l'accès aux fonctionnalités par onglets dédiés selon le profil connecté :

### 2.1 Espace Chauffeur
- **Ma Tournée en Cours** : Commandes actives à livrer avec indicateurs d'étapes (Arrivé sur site BC → Chargé DT → Livré Caméra).
- **Historique & Preuves** : Liste des livraisons clôturées avec consultation de la photo certifiée et du hash SHA-256.
- **Mon Véhicule & Permis** : Fiche conducteur avec numéro de permis, immatriculation et téléphone.

### 2.2 Espace Transporteur (Multi-Tenant)
- **Commandes Reçues** : Ordres de transport confiés par la logistique et affectation aux chauffeurs.
- **Flotte de Chauffeurs** : Ajout de nouveaux chauffeurs, activation/désactivation et suivi des véhicules.
- **Isolation Tenant** : Statut d'étanchéité anti-IDOR garantissant la confidentialité vis-à-vis des transporteurs concurrents.

### 2.3 Espace Logistique
- **Synthèse & Indicateurs** : Métriques opérationnelles globales.
- **Suivi des Commandes** : Référentiel des commandes, recherche et affectation aux transporteurs partenaires.
- **Non Facturées / Non Livrées** : Filtre d'alerte ciblé.
- **Passerelle ERP Découplée** : Importation des flux de commandes et exportation des clôtures vers la comptabilité.

### 2.4 Espace AIA / Administrateur
- **Toutes les Commandes** : Supervision complète et création manuelle de commandes.
- **Transporteurs & Flottes** : Gestion globale des partenaires de transport.
- **Banc de Tests Anti-IDOR** : Exécution automatisée des tests de sécurité en conditions réelles.
- **Grand Livre d'Audit** : Registre immuable de traçabilité.

### Étape 1 : Consulter sa tournée
- Connectez-vous avec votre profil (ex: *Marc Leclerc*).
- Seules les commandes qui vous sont personnellement assignées s'affichent.
- Chaque carte indique le numéro de commande, le client, l'adresse de déchargement et la nature des colis.

### Étape 2 : Confirmer la présence sur site (`SUR SITE`)
- À votre arrivée sur le quai d'expédition, touchez le bouton orange **ARRIVÉ SUR SITE (SCAN BC)**.
- Pointez la caméra vers le code-barres du Bon de Commande (BC) ou touchez l'onglet **Saisie manuelle** pour taper le numéro.
- Un double bip sonore et une vibration confirment la validation. Le statut passe immédiatement à `SUR SITE`.

### Étape 3 : Valider le chargement (`CHARGÉ`)
- Après vérification et arrimage physique des palettes dans votre camion, touchez le bouton violet **MARCHANDISE CHARGÉE (SCAN DT)**.
- Scannez le code-barres du Document de Transport (DT).
- Le statut passe à `CHARGÉ (EN ROUTE)`.

### Étape 4 : Déchargement et Preuve Caméra (`LIVRÉ`)
- Arrivé chez le client destinataire, après déchargement des marchandises, touchez le gros bouton bleu **LIVRAISON : PRENDRE LA PHOTO DU DÉCHARGEMENT**.
- La caméra s'ouvre directement (sans passer par la galerie photos).
- Cadrez les colis déchargés sur le quai du client et touchez **PRENDRE LA PHOTO DU DÉCHARGEMENT**.
- Vérifiez l'aperçu affichant le filigrane d'inviolabilité et touchez **Valider la preuve**.
- La livraison est certifiée avec horodatage serveur et hash SHA-256 !

---

## 2. Guide Transporteur (Périmètre Cloisonné)

Le transporteur gère son compte, ses commandes et ses conducteurs sans jamais voir les données de ses confrères.

### 2.1 Affectation des commandes
1. Dans l'onglet **Commandes**, consultez les ordres de transport confiés par la logistique.
2. Touchez **Affecter à un chauffeur**.
3. Sélectionnez un chauffeur disponible dans votre équipe et validez.

### 2.2 Gestion de la flotte
1. Dans l'onglet **Chauffeurs**, visualisez l'état de vos conducteurs (Actif / Inactif) et leurs plaques d'immatriculation.
2. Pour ajouter un chauffeur, cliquez sur **Nouveau Chauffeur** et renseignez son identité et véhicule.

---

## 3. Guide Logistique

Le responsable logistique dispose d'une vision d'ensemble des expéditions de l'entreprise.

### 3.1 Filtres et Recherche
- **Filtre rapide « Non Facturées & Non Livrées »** : Identifie immédiatement les commandes à risque de retard ou de litige.
- **Recherche globale** : Tapez un numéro de commande, de DT, de BC ou le nom d'un client.

### 3.2 Affectation Transporteur
- Pour chaque commande créée ou importée de l'ERP, cliquez sur **Affecter**.
- Sélectionnez le transporteur partenaire adéquat.

### 3.3 Consultation des Preuves & Passerelle ERP
- Cliquez sur le bouton vert **Preuve** pour vérifier la photo prise par le chauffeur, l'heure UTC certifiée et les coordonnées GPS.
- Utilisez les boutons **Importer les flux ERP** et **Exporter clôtures & preuves** pour synchroniser la facturation.

---

## 4. Guide AIA / Administrateur

L'administrateur dispose de privilèges globaux :
- **Création manuelle de commandes** : Formulaire complet avec n° BC, DT, adresses et poids.
- **Création de transporteurs partenaires** : Enregistrement de nouvelles entreprises de fret.
- **Grand Livre d'Audit** : Traçabilité immuable de chaque transition, IP cliente et terminal.
- **Banc de Tests Sécurité (Anti-IDOR)** : Onglet permettant d'exécuter à la demande une tentative de violation de frontière multi-tenant pour vérifier que le serveur retourne bien un code HTTP 403 Forbidden.
- **Réinitialisation des données de test** : Bouton permettant de remettre la base dans son état initial pour une nouvelle démonstration.
