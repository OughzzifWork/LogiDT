# GUIDE DE DÉPLOIEMENT ON-PREMISE & EXPLOITATION — LogiTrack

## 1. Prérequis Système

- **Système d'exploitation recommandé** : Linux Ubuntu 22.04 LTS ou Debian 12
- **Ressources minimales** : 2 vCPU, 2 Go RAM, 20 Go disque SSD
- **Runtimes** : Node.js version 20+ ou 22+ LTS et npm
- **Certificat TLS / HTTPS obligatoire** : Les navigateurs mobiles exigent impérativement une connexion **HTTPS sécurisée** pour autoriser l'accès aux API caméra (`getUserMedia`) et au Service Worker PWA.

---

## 2. Déploiement Natif (Systemd)

### 2.1 Installation des Fichiers

```bash
# Cloner ou extraire les sources dans /opt
sudo mkdir -p /opt/logitrack
sudo chown -R $USER:$USER /opt/logitrack
cd /opt/logitrack

# Installation des dépendances
npm ci --omit=dev

# Compilation des assets frontend PWA
npm run build
```

### 2.2 Configuration du Service Systemd

Créez le fichier de service `/etc/systemd/system/logitrack.service` :

```ini
[Unit]
Description=LogiTrack Logistics PWA Server
After=network.target

[Service]
Type=simple
User=logitrack
WorkingDirectory=/opt/logitrack
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

# Durcissement du processus
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=/opt/logitrack/data

[Install]
WantedBy=multi-user.target
```

Activez et démarrez le service :

```bash
sudo systemctl daemon-reload
sudo systemctl enable logitrack
sudo systemctl start logitrack
sudo systemctl status logitrack
```

---

## 3. Configuration du Reverse Proxy Nginx (avec HTTPS)

Créez le fichier `/etc/nginx/sites-available/logitrack.conf` :

```nginx
server {
    listen 80;
    server_name logitrack.entreprise.local;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name logitrack.entreprise.local;

    ssl_certificate /etc/ssl/certs/logitrack.crt;
    ssl_certificate_key /etc/ssl/private/logitrack.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Limite de taille pour les photos de livraison (15 Mo)
    client_max_body_size 15M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activez le site et rechargez Nginx :

```bash
sudo ln -s /etc/nginx/sites-available/logitrack.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 4. Déploiement Conteneurisé avec Docker

Un fichier `docker-compose.yml` est disponible à la racine du projet pour un démarrage immédiat :

```bash
# Démarrage de la stack conteneurisée
docker compose up -d

# Consultation des journaux
docker compose logs -f
```

---

## 5. Procédure de Sauvegarde et Restauration

Toutes les données métier et les preuves photographiques résident dans le répertoire `./data/` :
- `data/db.json` : Base de données relationnelle et journal d'audit immuable.
- `data/proofs/` : Ensemble des fichiers photos infalsifiables.

### 5.1 Script de Sauvegarde Quotidienne

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/logitrack"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

# Création d'une archive tar.gz avec somme de contrôle sha256
tar -czf "$BACKUP_DIR/logitrack_backup_$DATE.tar.gz" -C /opt/logitrack/data .
sha256sum "$BACKUP_DIR/logitrack_backup_$DATE.tar.gz" > "$BACKUP_DIR/logitrack_backup_$DATE.sha256"

# Conservation des sauvegardes sur 30 jours
find "$BACKUP_DIR" -type f -mtime +30 -delete
echo "Sauvegarde LogiTrack générée : logitrack_backup_$DATE.tar.gz"
```

### 5.2 Procédure de Restauration

```bash
# 1. Arrêter le service
sudo systemctl stop logitrack

# 2. Restaurer l'archive
cd /opt/logitrack/data
tar -xzf /var/backups/logitrack/logitrack_backup_20260929_080000.tar.gz

# 3. Vérifier les droits
sudo chown -R logitrack:logitrack /opt/logitrack/data

# 4. Redémarrer le service
sudo systemctl start logitrack
```
