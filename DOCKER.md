# Déployer le projet avec Docker Compose

## Prérequis

- Docker Engine avec le plugin Docker Compose.
- Une base PostgreSQL existante avec le schéma attendu par l’application.
- Les fichiers téléversés existants, si vous voulez conserver les images et documents déjà associés aux enregistrements.

## Préparer la configuration

1. Si `server/.env` n’existe pas, copiez `.env.example` vers `server/.env`. Ne remplacez pas un fichier déjà configuré.
2. Dans `server/.env`, renseignez `DATABASE_URL` avec l’URL fournie par Neon (incluant `sslmode=require`) ou configurez les variables `PGHOST`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` et `PGPORT` pour PostgreSQL local. Si `DATABASE_URL` est renseignée, elle est prioritaire sur les variables `PG*`. Remplacez aussi `JWT_SECRET` par une longue valeur aléatoire. Ne publiez jamais ce fichier.
3. Configurez `CLIENT_PORT` dans le fichier `.env` Compose à la racine si le port frontend doit changer. Compose transmet directement `DATABASE_URL` au conteneur serveur ; aucune surcharge d’hôte n’est nécessaire pour Neon. L’URL en production doit contenir `sslmode=require` (ou `verify-full`).
4. Pour un déploiement HTTPS, ajoutez `COOKIE_SECURE=true` au fichier `.env` Compose à la racine. Gardez `false` pour un accès HTTP local.
5. Placez les fichiers téléversés dans `server/Uploads`. Ce dossier est monté dans le conteneur et n’est pas inclus dans Git.

## Lancer et contrôler

Depuis la racine du dépôt :

```powershell
docker compose config
docker compose up --build -d
docker compose ps
docker compose logs -f server client
```

Ouvrez `http://localhost:5173` (ou le port défini par `CLIENT_PORT`). Le client Nginx sert les fichiers de production, transmet `/backend/...` à l’API et renvoie les routes React vers `index.html`. L’API n’est pas publiée sur un port hôte séparé. Le contrôle de santé du serveur vérifie également que PostgreSQL répond ; le client reste en attente tant que la base n’est pas joignable.

Pour arrêter les services :

```powershell
docker compose down
```

Cette commande conserve les données PostgreSQL externes ainsi que `server/Uploads`. N’utilisez pas `docker compose down -v` sans vouloir supprimer des volumes Docker.

## Déployer sur un autre serveur

Copiez le dépôt et les fichiers téléversés sur le serveur, créez `server/.env` avec `DATABASE_URL`, un `JWT_SECRET` aléatoire d’au moins 32 caractères et les autres paramètres de cet environnement. Dans le fichier `.env` Compose à la racine, configurez `CLIENT_PORT` et `COOKIE_SECURE=true` quand le site est servi en HTTPS. Configurez un proxy TLS et exposez uniquement le frontend derrière ce proxy. Les appels API et les images utilisent le même domaine via `/backend`, donc aucun nom d’hôte de développement n’est compilé dans le client.

L’application ne crée ni ne migre le schéma PostgreSQL automatiquement. Faites une sauvegarde de la base avant toute migration et préparez le schéma attendu séparément.

## Stocker les fichiers téléversés sur Cloudinary (Render)

Pour éviter d’utiliser le système de fichiers temporaire de Render, ajoutez ces variables dans les paramètres du service Render :

```text
UPLOAD_STORAGE=cloudinary
CLOUDINARY_URL=<URL_API_CLOUDINARY>
CLOUDINARY_FOLDER=gmao
```

La valeur `CLOUDINARY_URL` vient de la console Cloudinary. Vous pouvez à la place fournir `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` et `CLOUDINARY_API_SECRET`. Ne mettez aucun de ces secrets dans Vercel ou dans Git. Supprimez `UPLOAD_DIR` du service Render : ce chemin n’est plus utilisé avec Cloudinary. En développement local, sans ces variables, les fichiers restent stockés localement.

Avant le déploiement, exécutez une fois `server/db/migrations/20261022_cloudinary_asset_urls.sql` dans l’éditeur SQL Neon afin que les colonnes d’images acceptent les URL Cloudinary. Pour migrer les anciens fichiers depuis `server/Uploads`, configurez temporairement les variables Cloudinary et `DATABASE_URL` dans `server/.env`, puis depuis `server` lancez `npm run migrate:uploads` pour un aperçu. Après vérification, lancez `npm run migrate:uploads -- --apply` pour transférer les fichiers référencés et mettre à jour leurs chemins dans Neon. Cette intégration envoie ensuite les nouveaux téléversements directement vers Cloudinary.

## Dépannage : serveur marqué `unhealthy`

Si les journaux indiquent `password authentication failed for user "your_database_user"`, le fichier `server/.env` contient encore la valeur d’exemple. Remplacez `PGDATABASE`, `PGUSER` et `PGPASSWORD` par les paramètres de la base PostgreSQL existante. Ne partagez pas le mot de passe dans les journaux ou dans Git.

Puis recréez les conteneurs avec leur configuration mise à jour :

```powershell
docker compose up --build -d --force-recreate server client
docker compose ps
docker compose logs --tail=50 server
```

Le serveur doit passer à l’état `healthy` et le client à `Up`. Une erreur d’authentification persistante signifie que les identifiants configurés ne sont pas ceux de la base utilisée.
