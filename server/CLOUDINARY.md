# Stockage Cloudinary

En production, les nouveaux fichiers (images, PDF et autres documents) doivent être enregistrés sur Cloudinary. Le serveur refuse désormais de les écrire sur le disque éphémère de Render si Cloudinary n'est pas configuré. En développement local, le disque reste disponible par défaut.

## Configuration Render

Dans **Render → service backend → Environment**, définir :

- `UPLOAD_STORAGE=cloudinary`
- `CLOUDINARY_URL` : copier la valeur **API Environment variable** depuis le tableau de bord Cloudinary.

Ne pas publier cette valeur dans Git ni dans le frontend/Vercel. Après l'ajout, redéployer le service. La route `/health` doit renvoyer `"uploadStorage":"cloudinary"`.

## Migration des anciens fichiers

La migration doit être lancée sur l'ordinateur qui contient les anciens fichiers dans `server/Uploads`, avec l'URL Neon de production et Cloudinary dans `server/.env` (ce fichier est ignoré par Git).

1. Dans **Neon → SQL Editor**, exécuter `server/db/migrations/20261024_cloudinary_asset_columns.sql`.
2. Ajouter `CLOUDINARY_URL` à `server/.env`, sans la partager ni la committer. Vérifier que `DATABASE_URL` pointe vers la même base Neon que Render.
3. Dans PowerShell :

   ```powershell
   cd C:\Users\Aya\Desktop\pfe_project1\server
   npm run migrate:uploads
   npm run migrate:uploads -- --apply
   ```

La première commande affiche un aperçu. La seconde envoie sur Cloudinary les anciens fichiers locaux référencés dans `equipement.image`, `equipement.fichier`, `employee.documents`, `composant.fichier` et `nomlogo.image`, puis remplace leurs références Neon par les URL Cloudinary. Les références dont le fichier source n'existe plus localement sont signalées et nécessitent de récupérer le fichier avant de pouvoir le migrer.

Les documents non reconnus comme image ou vidéo sont détectés automatiquement et stockés comme fichiers bruts par Cloudinary. Les URL de livraison renvoyées par Cloudinary sont conservées telles quelles dans Neon.
