# Guide — Activer la connexion sécurisée (Admin / Démo)

Ce guide vous accompagne pas à pas pour que seuls vos relais désignés puissent modifier le statut d'un signalement (réponse des autorités, résolution). Aucune connaissance technique n'est nécessaire — suivez simplement les étapes dans l'ordre.

---

## Avant de commencer : 3 mots à connaître

- **Authentification** : le système qui vérifie qu'une personne est bien qui elle prétend être (e-mail + mot de passe), avant de la laisser faire une action réservée.
- **Base de données** : l'endroit (Firebase) où sont stockés tous les signalements envoyés par les citoyens.
- **Règles de sécurité** : les instructions qui disent à la base de données qui a le droit de lire, créer ou modifier une information.

Aujourd'hui, tout le monde peut créer un signalement, mais **personne ne peut encore modifier son statut** de façon sécurisée. Ce guide corrige cela.

---

## Étape 1 — Activer l'authentification par e-mail

1. Allez sur [console.firebase.google.com](https://console.firebase.google.com) et ouvrez votre projet **snalertes-citoyennes**.
2. Dans le menu de gauche, cliquez sur **Build**, puis sur **Authentication**.
3. Cliquez sur le bouton **Get started** (Commencer).
4. Dans la liste des méthodes de connexion proposées, cliquez sur **E-mail/Mot de passe**.
5. Activez le premier interrupteur (« Email/Password ») et cliquez sur **Enregistrer**.

✅ *À ce stade, Firebase sait qu'il peut authentifier des utilisateurs par e-mail et mot de passe.*

---

## Étape 2 — Créer les deux comptes (Admin et Démo)

Toujours dans **Authentication**, cliquez sur l'onglet **Users** (Utilisateurs) en haut de la page.

1. Cliquez sur **Add user** (Ajouter un utilisateur).
2. Créez le **compte Admin** :
   - E-mail : par exemple `admin@snalertes.sn` (ou votre propre adresse)
   - Mot de passe : choisissez un mot de passe fort, que vous seul connaissez
   - Cliquez sur **Add user**
3. Recommencez pour créer le **compte Démo** :
   - E-mail : par exemple `demo@snalertes.sn`
   - Mot de passe : un mot de passe simple, que vous pourrez partager lors de démonstrations publiques (par exemple à des partenaires ou des ASC), sans exposer le vrai compte admin

✅ *Notez ces deux e-mails et mots de passe quelque part en sécurité — vous en aurez besoin pour vous connecter sur le site.*

---

## Étape 3 — Sécuriser la base de données (les règles)

C'est l'étape la plus technique, mais il suffit de copier-coller.

1. Toujours dans la console Firebase, allez dans **Build > Realtime Database**.
2. Cliquez sur l'onglet **Rules** (Règles) en haut de la page.
3. Vous allez voir un bloc de texte qui ressemble à ceci (les vraies règles actuelles peuvent différer légèrement) :

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

4. **Sélectionnez tout ce texte et supprimez-le**, puis collez exactement ceci à la place :

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

5. Cliquez sur **Publish** (Publier) en haut à droite.

### Que fait cette règle, concrètement ?

- `".read": true` → tout le monde peut voir les signalements sur la carte (normal, c'est le principe de la plateforme).
- `"!data.exists() || auth != null"` → un signalement peut être **créé** par n'importe qui (`!data.exists()` = "s'il n'existe pas encore"), mais pour le **modifier** une fois créé, il faut être connecté (`auth != null`).

✅ *À partir de maintenant, seuls les comptes connectés peuvent changer le statut d'un signalement — les signalements citoyens restent, eux, ouverts à tous.*

---

## Étape 4 — Mettre à jour le site en ligne

Si ce n'est pas déjà fait, uploadez les fichiers `index.html`, `style.css` et `app.js` les plus récents sur votre dépôt GitHub (Add file > Upload files > Commit changes), puis patientez une minute avant de tester.

---

## Étape 5 — Se connecter sur le site

1. Ouvrez votre site : `https://link4dev.github.io/sn-alerte-citoyenne/`
2. Dans le menu, cliquez sur **Communauté > Connexion**
3. Entrez l'e-mail et le mot de passe du compte **Admin** ou **Démo**
4. Cliquez sur **Se connecter**

Une fois connecté, vous verrez :
- Votre adresse e-mail affichée, avec un bouton **Se déconnecter**
- Un formulaire pour **changer votre mot de passe**
- Dans la liste des signalements, deux menus déroulants (« Réponse autorités » et « Statut ») apparaissent maintenant à la place des simples étiquettes — c'est là que vous mettez à jour le suivi.

---

## Changer le mot de passe du compte Admin

Une fois connecté avec le compte Admin :

1. Descendez jusqu'à **Changer mon mot de passe**
2. Entrez le nouveau mot de passe (au moins 6 caractères)
3. Cliquez sur **Mettre à jour le mot de passe**

⚠️ Si un message dit *« déconnectez-vous puis reconnectez-vous »* : c'est une mesure de sécurité normale si vous étiez connecté depuis longtemps. Déconnectez-vous, reconnectez-vous avec l'ancien mot de passe, puis réessayez immédiatement.

---

## En cas de problème

| Symptôme | Cause probable | Solution |
|---|---|---|
| "Connexion impossible" | E-mail ou mot de passe incorrect | Vérifiez l'orthographe, ou recréez l'utilisateur dans Firebase > Authentication > Users |
| Les menus déroulants n'apparaissent pas après connexion | Le fichier `app.js` en ligne n'est pas à jour | Re-uploadez les fichiers sur GitHub, puis Ctrl+F5 |
| Un visiteur non connecté arrive à modifier un statut | Les règles de la base de données n'ont pas été publiées correctement | Reprenez l'Étape 3 et vérifiez que vous avez bien cliqué sur "Publish" |

---

Besoin d'aide à une étape précise ? Dites-le simplement, on peut la refaire ensemble pas à pas.
