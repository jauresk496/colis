# Déploiement sur InfinityFree

## Étape 1: Créer la base de données MySQL

1. Connectez-vous sur https://dash.infinityfree.com
2. Allez dans **MySQL Databases** (ou **Online MySQL**)
3. Créez une nouvelle base de données (ex: `if0_42314164_collis`)
4. Notez les informations:
   - **Hôte**: `sqlXXX.infinityfree.com` (visible dans le panneau)
   - **Base**: `if0_42314164_collis`
   - **Utilisateur**: `if0_42314164`
   - **Mot de passe**: celui que vous avez défini

## Étape 2: Importer le schéma SQL

1. Ouvrez **phpMyAdmin** depuis le panneau InfinityFree
2. Sélectionnez votre base de données
3. Onglet **Importer**
4. Importez `reset.sql` puis `insert_data.sql`

## Étape 3: Configurer l'API

1. Copiez `config.example.php` en `config.php`
2. Modifiez les valeurs avec vos identifiants InfinityFree:
   ```php
   define('DB_HOST', 'sqlXXX.infinityfree.com');
   define('DB_NAME', 'if0_42314164_collis');
   define('DB_USER', 'if0_42314164');
   define('DB_PASS', 'votre_mot_de_passe');
   ```

## Étape 4: Uploader les fichiers API

1. Ouvrez le **File Manager** ou utilisez **FTP** (FileZilla)
2. Allez dans le dossier `htdocs/`
3. Créez un dossier `collis-api/api/`
4. Uploadez tous les fichiers du dossier `api/` dans `htdocs/collis-api/api/`
   - `index.php`
   - `db.php`
   - `util.php`
   - `router.php`
   - `.htaccess`
   - `config.php`

## Étape 5: Tester l'API

Visitez: `https://VOTRE-DOMAIN.infinityfreeapp.com/collis-api/api/`
Vous devriez voir: `{"ok":true,"service":"collis-api"}`

## Étape 6: Configurer Netlify

Dans Netlify, allez dans **Site settings > Environment variables**:
- Ajoutez `API_URL` = `https://VOTRE-DOMAIN.infinityfreeapp.com/collis-api/api`

Redéployez le site. L'app Angular utilisera automatiquement cette URL.
