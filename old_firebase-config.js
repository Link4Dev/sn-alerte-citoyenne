// 1) Créez un projet gratuit sur https://console.firebase.google.com
// 2) Ajoutez une "Web App" et copiez ici la config qu'on vous donne
// 3) Activez "Realtime Database" (mode test) dans la console Firebase
// 4) Remplacez les valeurs ci-dessous par les vôtres

const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJET.firebaseapp.com",
  databaseURL: "https://VOTRE_PROJET-default-rtdb.firebaseio.com",
  projectId: "VOTRE_PROJET",
  storageBucket: "VOTRE_PROJET.appspot.com",
  messagingSenderId: "000000000000",
  appId: "VOTRE_APP_ID"
};

// Numéro WhatsApp des autorités locales à alerter (format international, sans "+")
const AUTHORITY_WHATSAPP_NUMBER = "221771234567";

// Centre par défaut de la carte (Dakar). Changez si votre zone est différente.
const MAP_CENTER = [14.6928, -17.4467];
const MAP_ZOOM = 12;
