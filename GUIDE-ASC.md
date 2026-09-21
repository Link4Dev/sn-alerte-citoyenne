# Créer la plateforme de votre quartier ou de votre commune

Ce projet est **libre et gratuit**. Chaque commune ou Association Sportive et Culturelle (ASC) peut créer sa propre version indépendante — sa propre carte, ses propres couleurs, son propre numéro d'alerte — en quelques étapes, sans rien connaître au code.

Chaque plateforme est indépendante : les signalements de votre quartier ne se mélangent pas avec ceux des autres.

## Étape 1 — Copier le projet (« Fork »)

1. Allez sur [github.com/Link4dev/sn-alerte-citoyenne](https://github.com/Link4dev/sn-alerte-citoyenne)
2. Cliquez sur le bouton **Fork** en haut à droite de la page
3. Donnez un nom à votre copie, par exemple `alerte-quartier-ngor` ou `asc-medina-alerte`
4. Cliquez sur **Create fork** — vous avez maintenant votre propre copie du projet

## Étape 2 — Créer votre propre base de données (gratuite)

Chaque quartier doit avoir sa propre base Firebase, pour que ses signalements restent séparés des autres :

1. Créez un projet sur [console.firebase.google.com](https://console.firebase.google.com) (gratuit)
2. Ajoutez une application Web (icône `</>`) et copiez les clés fournies
3. Activez **Realtime Database** (Build > Realtime Database > mode test)
4. Dans votre copie du projet sur GitHub, ouvrez le fichier `firebase-config.js` et remplacez les valeurs par les vôtres, ainsi que le numéro WhatsApp de vos propres responsables ou de votre mairie

## Étape 3 — Personnaliser le nom et les couleurs (facultatif)

Dans `index.html`, changez le titre "Alerte Citoyenne" par le nom de votre quartier ou de votre ASC. Dans `style.css`, les couleurs sont regroupées en haut du fichier (variables `--coupure`, `--inondation`, etc.) — modifiez-les selon l'identité visuelle de votre association.

## Étape 4 — Publier votre site (gratuit)

1. Dans votre copie du dépôt : **Settings > Pages**
2. Source : **Deploy from a branch**, branche `main`, dossier `/ (root)`
3. Votre site sera en ligne à `https://VOTRE-COMPTE.github.io/VOTRE-DEPOT/`

## Animer votre communauté

Une fois la plateforme en ligne, quelques idées pour la faire vivre au sein de votre ASC ou quartier :
- Partagez le lien sur les groupes WhatsApp et Facebook du quartier
- Désignez 1 ou 2 relais au sein de l'ASC pour suivre les signalements et faire le lien avec les autorités
- Affichez le QR code du site dans les lieux publics du quartier (marché, mosquée, église, terrain de sport)

## Besoin d'aide ou envie de contribuer au code d'origine ?

Voir [CONTRIBUTING.md](CONTRIBUTING.md), ou ouvrez une "Issue" sur le dépôt GitHub d'origine pour poser une question.
