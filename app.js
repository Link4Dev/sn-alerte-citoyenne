firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();
const reportsRef = db.ref("signalements");

const COLORS = {
  coupure: "#E8A33D", eau: "#5B8FB0", inondation: "#2E6F95",
  voirie: "#8A6D3B", dechets: "#6B7A3F", incendie: "#C1440E",
  securite: "#7A3B69", autre: "#B23A2E"
};
const LABELS = {
  coupure: "Coupure de courant", eau: "Coupure d'eau", inondation: "Zone inondée",
  voirie: "Route endommagée", dechets: "Déchets non collectés", incendie: "Incendie",
  securite: "Insécurité", autre: "Autre incident"
};
const URGENCY = {
  faible: { label: "Faible", color: "#3F6B4D", weight: 0.3 },
  moyenne: { label: "Moyenne", color: "#E0B400", weight: 0.6 },
  elevee: { label: "Élevée", color: "#B23A2E", weight: 1.0 }
};

// ---------- Carte ----------
const map = L.map("map").setView(MAP_CENTER, MAP_ZOOM);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap"
}).addTo(map);

const markersLayer = L.layerGroup().addTo(map);
let heatLayer = null;

document.querySelectorAll(".map-view-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".map-view-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    if (btn.dataset.view === "heat") {
      map.removeLayer(markersLayer);
      if (!heatLayer) heatLayer = L.heatLayer([], { radius: 30, blur: 20 });
      heatLayer.addTo(map);
    } else {
      if (heatLayer) map.removeLayer(heatLayer);
      markersLayer.addTo(map);
    }
  });
});

document.getElementById("contact-whatsapp").href =
  `https://wa.me/${AUTHORITY_WHATSAPP_NUMBER}?text=${encodeURIComponent("Bonjour, je vous contacte au sujet d'Alerte Citoyenne.")}`;

let selectedLatLng = null;
let marker = null;

function setMarker(lat, lng) {
  selectedLatLng = { lat, lng };
  if (marker) map.removeLayer(marker);
  marker = L.marker([lat, lng]).addTo(map);
  document.getElementById("location-status").textContent =
    `Position choisie : ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

map.on("click", (e) => setMarker(e.latlng.lat, e.latlng.lng));

const customTypeInput = document.getElementById("custom-type");
document.querySelectorAll('input[name="type"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    customTypeInput.classList.toggle("hidden", radio.value !== "autre" || !radio.checked);
  });
});

document.getElementById("locate-btn").addEventListener("click", () => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition((pos) => {
    map.setView([pos.coords.latitude, pos.coords.longitude], 15);
    setMarker(pos.coords.latitude, pos.coords.longitude);
  }, () => {
    document.getElementById("location-status").textContent = "Position indisponible, touchez la carte.";
  });
});

function makeIcon(type, urgency) {
  const ring = URGENCY[urgency] ? URGENCY[urgency].color : "#ffffff";
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${COLORS[type]};border:2px solid white;box-shadow:0 0 0 3px ${ring}"></div>`,
    iconSize: [16, 16]
  });
}

// ---------- Formulaire ----------
document.getElementById("report-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const type = document.querySelector('input[name="type"]:checked')?.value;
  const urgency = document.querySelector('input[name="urgency"]:checked')?.value;
  const description = document.getElementById("description").value.trim();
  const customLabel = customTypeInput.value.trim();
  if (!type || !urgency || !description || !selectedLatLng || (type === "autre" && !customLabel)) {
    alert("Merci de choisir un type, un niveau d'urgence, une description et un emplacement sur la carte.");
    return;
  }

  const label = type === "autre" ? customLabel : LABELS[type];

  const report = {
    type, description, label, urgency,
    reponseAutorites: "non",
    statutResolution: "non",
    lat: selectedLatLng.lat, lng: selectedLatLng.lng,
    timestamp: Date.now()
  };

  reportsRef.push(report).then(() => {
    e.target.reset();
    customTypeInput.classList.add("hidden");
    if (marker) map.removeLayer(marker);
    selectedLatLng = null;
    document.getElementById("location-status").textContent = "ou touchez la carte pour placer le repère";

    const msg = encodeURIComponent(
      `Alerte citoyenne — ${label} (urgence : ${URGENCY[urgency].label})\n${description}\nLocalisation : https://www.google.com/maps?q=${report.lat},${report.lng}`
    );
    document.getElementById("whatsapp-link").href = `https://wa.me/${AUTHORITY_WHATSAPP_NUMBER}?text=${msg}`;
    document.getElementById("alert-authorities").classList.remove("hidden");
  });
});

// ---------- Authentification ----------
let isAdmin = false;

document.getElementById("login-btn").addEventListener("click", () => {
  const email = document.getElementById("admin-email").value.trim();
  const password = document.getElementById("admin-password").value;
  const errEl = document.getElementById("login-error");
  errEl.classList.add("hidden");
  auth.signInWithEmailAndPassword(email, password).catch(() => {
    errEl.textContent = "Connexion impossible : e-mail ou mot de passe incorrect.";
    errEl.classList.remove("hidden");
  });
});

document.getElementById("logout-btn").addEventListener("click", () => auth.signOut());

document.getElementById("change-password-btn").addEventListener("click", () => {
  const newPassword = document.getElementById("new-password").value;
  const msgEl = document.getElementById("password-change-msg");
  msgEl.classList.remove("hidden");
  if (newPassword.length < 6) {
    msgEl.textContent = "Le mot de passe doit contenir au moins 6 caractères.";
    return;
  }
  auth.currentUser.updatePassword(newPassword).then(() => {
    msgEl.textContent = "Mot de passe mis à jour avec succès.";
    document.getElementById("new-password").value = "";
  }).catch((err) => {
    msgEl.textContent = err.code === "auth/requires-recent-login"
      ? "Par sécurité, déconnectez-vous puis reconnectez-vous avant de changer le mot de passe."
      : "Erreur : impossible de mettre à jour le mot de passe.";
  });
});

auth.onAuthStateChanged((user) => {
  isAdmin = !!user;
  document.getElementById("login-box").classList.toggle("hidden", isAdmin);
  document.getElementById("account-box").classList.toggle("hidden", !isAdmin);
  if (user) document.getElementById("account-email").textContent = user.email;
  renderList();
});

// ---------- Liste, marqueurs, tableau de bord ----------
const listEl = document.getElementById("report-list");
const countEl = document.getElementById("count-total");
const reportsData = {};

function statusLabel(field, value) {
  if (field === "reponse") return value === "oui" ? "Oui" : "Non";
  if (value === "oui") return "Résolu";
  if (value === "en_cours") return "En cours";
  return "Non";
}

function renderReportItem(id, r) {
  const label = r.label || LABELS[r.type] || "Incident";
  const urg = URGENCY[r.urgency] || URGENCY.faible;
  const time = new Date(r.timestamp).toLocaleString("fr-FR");

  const li = document.createElement("li");
  li.dataset.id = id;

  let controls;
  if (isAdmin) {
    controls = `
      <div class="admin-controls">
        <label>Réponse autorités
          <select class="reponse-select">
            <option value="non" ${r.reponseAutorites !== "oui" ? "selected" : ""}>Non</option>
            <option value="oui" ${r.reponseAutorites === "oui" ? "selected" : ""}>Oui</option>
          </select>
        </label>
        <label>Statut
          <select class="statut-select">
            <option value="non" ${r.statutResolution === "non" || !r.statutResolution ? "selected" : ""}>Non</option>
            <option value="en_cours" ${r.statutResolution === "en_cours" ? "selected" : ""}>En cours</option>
            <option value="oui" ${r.statutResolution === "oui" ? "selected" : ""}>Résolu</option>
          </select>
        </label>
      </div>`;
  } else {
    controls = `
      <div class="status-badges">
        <span class="status-badge">Autorités : ${statusLabel("reponse", r.reponseAutorites)}</span>
        <span class="status-badge">Statut : ${statusLabel("statut", r.statutResolution)}</span>
      </div>`;
  }

  li.innerHTML = `
    <div class="li-top">
      <span class="tag tag-${r.type}">${label}</span>
      <span class="urgency-badge" style="background:${urg.color}">${urg.label}</span>
    </div>
    ${r.description}
    <span class="li-time">${time}</span>
    ${controls}
  `;

  if (isAdmin) {
    li.querySelector(".reponse-select").addEventListener("change", (e) => {
      reportsRef.child(id).update({ reponseAutorites: e.target.value });
    });
    li.querySelector(".statut-select").addEventListener("change", (e) => {
      reportsRef.child(id).update({ statutResolution: e.target.value });
    });
  }

  return li;
}

function renderList() {
  listEl.innerHTML = "";
  Object.entries(reportsData)
    .sort((a, b) => b[1].timestamp - a[1].timestamp)
    .forEach(([id, r]) => listEl.appendChild(renderReportItem(id, r)));
}

function updateDashboard() {
  const values = Object.values(reportsData);
  document.getElementById("dash-total").textContent = values.length;

  const byUrgency = { faible: 0, moyenne: 0, elevee: 0 };
  const byType = {};
  const byDay = {};
  const now = Date.now();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now - i * 86400000);
    byDay[d.toISOString().slice(0, 10)] = 0;
  }

  values.forEach((r) => {
    if (byUrgency[r.urgency] !== undefined) byUrgency[r.urgency]++;
    byType[r.type] = (byType[r.type] || 0) + 1;
    const day = new Date(r.timestamp).toISOString().slice(0, 10);
    if (byDay[day] !== undefined) byDay[day]++;
  });

  document.getElementById("dash-faible").textContent = byUrgency.faible;
  document.getElementById("dash-moyenne").textContent = byUrgency.moyenne;
  document.getElementById("dash-elevee").textContent = byUrgency.elevee;

  const maxType = Math.max(1, ...Object.values(byType));
  const typeBarsEl = document.getElementById("dash-type-bars");
  typeBarsEl.innerHTML = Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `
      <div class="type-bar-row">
        <span class="type-bar-label">${LABELS[type] || type}</span>
        <div class="type-bar-track"><div class="type-bar-fill" style="width:${(count / maxType) * 100}%; background:${COLORS[type]}"></div></div>
        <span class="type-bar-count">${count}</span>
      </div>`).join("") || "<p class='dash-empty'>Aucune donnée pour le moment.</p>";

  const days = Object.keys(byDay).sort();
  const maxDay = Math.max(1, ...Object.values(byDay));
  const trendEl = document.getElementById("dash-trend-chart");
  trendEl.innerHTML = days.map((day) => {
    const count = byDay[day];
    const h = Math.max(4, (count / maxDay) * 100);
    const d = new Date(day);
    return `<div class="trend-bar-wrap" title="${count} le ${d.toLocaleDateString("fr-FR")}">
      <div class="trend-bar" style="height:${h}%"></div>
      <span class="trend-label">${d.getDate()}/${d.getMonth() + 1}</span>
    </div>`;
  }).join("");
}

function refreshMapLayers() {
  markersLayer.clearLayers();
  const heatPoints = [];
  Object.values(reportsData).forEach((r) => {
    const m = L.marker([r.lat, r.lng], { icon: makeIcon(r.type, r.urgency) });
    const urg = URGENCY[r.urgency] || URGENCY.faible;
    m.bindPopup(`<strong>${r.label}</strong><br>${r.description}<br><em>Urgence : ${urg.label}</em>`);
    m.addTo(markersLayer);
    heatPoints.push([r.lat, r.lng, urg.weight]);
  });
  if (heatLayer) heatLayer.setLatLngs(heatPoints);
  countEl.textContent = Object.keys(reportsData).length;
}

reportsRef.limitToLast(500).on("child_added", (snap) => {
  reportsData[snap.key] = snap.val();
  refreshMapLayers();
  renderList();
  updateDashboard();
});

reportsRef.on("child_changed", (snap) => {
  reportsData[snap.key] = snap.val();
  refreshMapLayers();
  renderList();
  updateDashboard();
});

reportsRef.on("child_removed", (snap) => {
  delete reportsData[snap.key];
  refreshMapLayers();
  renderList();
  updateDashboard();
});
