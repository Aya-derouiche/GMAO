# Déployer le projet avec Docker Compose

## Prérequis

- Docker Engine avec le plugin Docker Compose.
- Une base PostgreSQL existante avec le schéma attendu par l’application.
- Les fichiers téléversés existants, si vous voulez conserver les images et documents déjà associés aux enregistrements.

## Préparer la configuration

1. Si `server/.env` n’existe pas, copiez `.env.example` vers `server/.env`. Ne remplacez pas un fichier déjà configuré.
2. Dans `server/.env`, renseignez les vrais identifiants de la base PostgreSQL qui contient vos données (ne laissez pas les valeurs `your_*` de l’exemple) et remplacez `JWT_SECRET` par une longue valeur aléatoire. Ne publiez jamais ce fichier. Si ce fichier a été remplacé par le modèle, restaurez les identifiants de votre PostgreSQL existant.
3. Facultatif : copiez `.env.compose.example` vers `.env` à la racine. Pour PostgreSQL sur la même machine que Docker, gardez `DOCKER_PGHOST=host.docker.internal`. Pour une base hébergée ailleurs, remplacez cette valeur par son nom DNS ou son adresse IP. Si la base est un service du même réseau Compose, utilisez son nom de service.
4. Réglez `COOKIE_SECURE=true` dans `server/.env` lorsque le site est servi en HTTPS. Gardez `false` pour un accès HTTP local.
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

Copiez le dépôt et les fichiers téléversés sur le serveur, créez `server/.env` avec les secrets et paramètres DB de cet environnement, puis configurez `DOCKER_PGHOST` et `CLIENT_PORT` dans le fichier `.env` Compose à la racine. Réglez `COOKIE_SECURE` dans `server/.env` selon le proxy HTTPS. Configurez le pare-feu ou le proxy TLS pour exposer le port frontend choisi. Les appels API et les images utilisent le même domaine via `/backend`, donc aucun nom d’hôte de développement n’est compilé dans le client.

L’application ne crée ni ne migre le schéma PostgreSQL automatiquement. Faites une sauvegarde de la base avant toute migration et préparez le schéma attendu séparément.

## Dépannage : serveur marqué `unhealthy`

Si les journaux indiquent `password authentication failed for user "your_database_user"`, le fichier `server/.env` contient encore la valeur d’exemple. Remplacez `PGDATABASE`, `PGUSER` et `PGPASSWORD` par les paramètres de la base PostgreSQL existante. Ne partagez pas le mot de passe dans les journaux ou dans Git.

Puis recréez les conteneurs avec leur configuration mise à jour :

```powershell
docker compose up --build -d --force-recreate server client
docker compose ps
docker compose logs --tail=50 server
```

Le serveur doit passer à l’état `healthy` et le client à `Up`. Une erreur d’authentification persistante signifie que les identifiants configurés ne sont pas ceux de la base utilisée.
