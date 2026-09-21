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

- **Carte** (Leaflet + OpenStreetMap) : les utilisateurs cliquent sur la carte ou utilisent leur position pour situer l'incident. Une carte de chaleur est disponible en alternative aux points.
- **Formulaire** : type d'incident, niveau d'urgence (faible/moyenne/élevée) + description.
- **Stockage** : chaque signalement est enregistré dans Firebase Realtime Database et apparaît instantanément sur la carte de tous les visiteurs.
- **Tableau de bord** : total des signalements, répartition par urgence et par type, tendance sur 14 jours.
- **Alerte aux autorités** : après l'envoi, un bouton ouvre WhatsApp avec un message prérempli vers le numéro configuré.
- **Suivi du traitement** : les relais connectés (voir ci-dessous) peuvent indiquer si les autorités ont répondu et si une solution a été trouvée.

## Activer la connexion des relais (Admin / Démo)

Pour que seuls vos relais désignés puissent modifier le statut d'un signalement :

1. Dans la console Firebase : **Build > Authentication > Get started**.
2. Onglet **Sign-in method** > activez **E-mail/Mot de passe**.
3. Onglet **Users** > **Add user** : créez un compte `admin`, par exemple `admin@votredomaine.sn` avec un mot de passe fort. Créez aussi un compte `demo@votredomaine.sn` avec un mot de passe simple si vous voulez faire des démonstrations sans exposer le vrai compte admin.
4. Dans **Build > Realtime Database > Rules**, remplacez les règles par :

```json
{
  "rules": {
    "signalements": {
      ".read": true,
      ".indexOn": ["timestamp"],
      "$id": {
        ".write": "!data.exists() || auth != null"
      }
    }
  }
}
```

Cela permet à tout le monde de créer un signalement, mais seuls les comptes connectés peuvent le modifier (réponse des autorités, statut).

5. Sur le site, dans le menu **Communauté > Connexion**, connectez-vous avec le compte admin ou démo. Une fois connecté, vous pouvez changer votre mot de passe directement depuis cette section.

## Pour aller plus loin

- Ajouter l'envoi automatique d'un e-mail via un service comme Formspree ou une Cloud Function.
- Ajouter un filtre par type, par urgence ou par date sur la liste des signalements.
- Exporter les données du tableau de bord en CSV pour les partenaires.
