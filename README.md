# Alerte Citoyenne

Plateforme web **libre et open source** pour signaler des coupures de courant, zones inondées et autres incidents sur une carte partagée, avec possibilité d'alerter les autorités par WhatsApp.

Le projet est pensé pour être dupliqué : chaque commune, quartier ou **Association Sportive et Culturelle (ASC)** peut créer sa propre version indépendante pour animer sa communauté locale.

- 👉 Vous voulez créer la plateforme de votre quartier ou de votre ASC ? Voir **[GUIDE-ASC.md](GUIDE-ASC.md)**
- 👉 Vous voulez contribuer au code d'origine ? Voir **[CONTRIBUTING.md](CONTRIBUTING.md)**
- 📄 Licence : [MIT](LICENSE) — utilisation libre et gratuite

## Installation détaillée (pour le dépôt d'origine)

L'app est un simple site statique, donc il faut un endroit pour stocker les signalements en ligne :

1. Allez sur https://console.firebase.google.com et créez un projet (gratuit).
2. Dans le projet, cliquez sur l'icône **Web (`</>`)** pour ajouter une application web, donnez-lui un nom.
3. Firebase vous montre un objet `firebaseConfig` — copiez ses valeurs dans le fichier `firebase-config.js` fourni ici.
4. Dans le menu de gauche, allez dans **Build > Realtime Database**, cliquez sur **Créer une base de données**, choisissez une région, puis démarrez en **mode test** (pour commencer — vous pourrez sécuriser les règles plus tard).
5. Dans `firebase-config.js`, remplacez aussi `AUTHORITY_WHATSAPP_NUMBER` par le numéro (format international, sans le "+") des autorités à alerter.

## 2. Mettre le code sur votre compte GitHub

Depuis un terminal, dans le dossier `incident-app` :

```bash
git init
git add .
git commit -m "Première version de l'app Alerte Citoyenne"
```

Créez ensuite un nouveau dépôt vide sur GitHub (bouton "New" sur github.com, sans README ni .gitignore), puis :

```bash
git remote add origin https://github.com/VOTRE-COMPTE/alerte-citoyenne.git
git branch -M main
git push -u origin main
```

## 3. Activer l'hébergement gratuit (GitHub Pages)

1. Sur GitHub, ouvrez le dépôt > **Settings > Pages**.
2. Dans "Build and deployment", choisissez **Deploy from a branch**, branche `main`, dossier `/ (root)`.
3. Enregistrez. Après une minute, votre app est en ligne à :
   `https://VOTRE-COMPTE.github.io/alerte-citoyenne/`

## Comment ça marche

- **Carte** (Leaflet + OpenStreetMap) : les utilisateurs cliquent sur la carte ou utilisent leur position pour situer l'incident.
- **Formulaire** : type d'incident (coupure, inondation, autre) + description.
- **Stockage** : chaque signalement est enregistré dans Firebase Realtime Database et apparaît instantanément sur la carte de tous les visiteurs.
- **Alerte aux autorités** : après l'envoi, un bouton ouvre WhatsApp avec un message prérempli (type, description, lien Google Maps) vers le numéro configuré.

## Pour aller plus loin

- Sécuriser les règles Firebase (limiter l'écriture, modérer le contenu).
- Ajouter l'envoi automatique d'un e-mail via un service comme Formspree ou une Cloud Function.
- Ajouter un filtre par type ou par date sur la liste des signalements.
