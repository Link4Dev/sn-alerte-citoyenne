firebase.initializeApp(firebaseConfig);

if (typeof RECAPTCHA_SITE_KEY !== "undefined" && RECAPTCHA_SITE_KEY && RECAPTCHA_SITE_KEY !== "VOTRE_CLE_RECAPTCHA_V3") {
  firebase.appCheck().activate(RECAPTCHA_SITE_KEY, true);
}

const db = firebase.database();
const reportsRef = db.ref("signalements");

const COLORS = {
  coupure: "#E8A33D", eau: "#5B8FB0", inondation: "#2E6F95",
  voirie: "#8A6D3B", dechets: "#6B7A3F", incendie: "#C1440E",
  securite: "#7A3B69", police: "#1D3557", gendarmerie: "#4A5568", autre: "#B23A2E"
};
const LABELS = {
  coupure: "Coupure de courant", eau: "Coupure d'eau", inondation: "Zone inondée",
  voirie: "Route endommagée", dechets: "Déchets non collectés", incendie: "Incendie",
  securite: "Insécurité", police: "Police Nationale", gendarmerie: "Gendarmerie Nationale", autre: "Autre incident"
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

const photoInput = document.getElementById("photo-input");
const photoPreview = document.getElementById("photo-preview");
const photoPreviewImg = document.getElementById("photo-preview-img");

photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];
  if (!file) { photoPreview.classList.add("hidden"); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    photoPreviewImg.src = e.target.result;
    photoPreview.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
});

function compressImage(file, maxWidth = 700, quality = 0.6) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    reader.readAsDataURL(file);
  });
}

function makeIcon(type, urgency) {
  const ring = URGENCY[urgency] ? URGENCY[urgency].color : "#ffffff";
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${COLORS[type]};border:2px solid white;box-shadow:0 0 0 3px ${ring}"></div>`,
    iconSize: [16, 16]
  });
}

// ---------- Formulaire ----------
document.getElementById("report-form").addEventListener("submit", async (e) => {
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
  const file = photoInput.files[0];
  const photoBase64 = file ? await compressImage(file) : null;

  const report = {
    type, description, label, urgency,
    reponseAutorites: "non",
    statutResolution: "non",
    lat: selectedLatLng.lat, lng: selectedLatLng.lng,
    timestamp: Date.now()
  };
  if (photoBase64) report.photoBase64 = photoBase64;

  reportsRef.push(report).then(() => {
    e.target.reset();
    customTypeInput.classList.add("hidden");
    photoPreview.classList.add("hidden");
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

// Connexion des relais/autorités désactivée pour le moment.
// Tous les signalements s'affichent en lecture seule (voir isAdmin ci-dessous).
const isAdmin = false;

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

// ---------- Regroupement des doublons (agent de détection) ----------
const CLUSTER_DISTANCE_M = 150;      // deux signalements à moins de 150 m...
const CLUSTER_TIME_WINDOW_MS = 72 * 3600 * 1000; // ...et à moins de 72h l'un de l'autre...
const URGENCY_RANK = { faible: 1, moyenne: 2, elevee: 3 };

function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ...même type d'incident sont considérés comme le même événement et regroupés.
function buildClusters(data) {
  const clusters = [];
  Object.entries(data).forEach(([id, r]) => {
    const match = clusters.find((c) =>
      c.type === r.type &&
      distanceMeters(c.lat, c.lng, r.lat, r.lng) <= CLUSTER_DISTANCE_M &&
      c.reports.some((m) => Math.abs(m.timestamp - r.timestamp) <= CLUSTER_TIME_WINDOW_MS)
    );
    if (match) {
      match.reports.push({ id, ...r });
      match.lat = match.reports.reduce((s, x) => s + x.lat, 0) / match.reports.length;
      match.lng = match.reports.reduce((s, x) => s + x.lng, 0) / match.reports.length;
    } else {
      clusters.push({ type: r.type, lat: r.lat, lng: r.lng, reports: [{ id, ...r }] });
    }
  });

  return clusters.map((c) => {
    const reports = c.reports.sort((a, b) => b.timestamp - a.timestamp);
    const urgency = reports.reduce((max, r) =>
      URGENCY_RANK[r.urgency] > URGENCY_RANK[max] ? r.urgency : max, reports[0].urgency);
    return {
      ids: reports.map((r) => r.id),
      type: c.type,
      lat: c.lat, lng: c.lng,
      label: reports[0].label,
      urgency,
      count: reports.length,
      lastTimestamp: reports[0].timestamp,
      description: reports[0].description,
      photoBase64: reports.find((r) => r.photoBase64)?.photoBase64 || null,
      reponseAutorites: reports.some((r) => r.reponseAutorites === "oui") ? "oui" : "non",
      statutResolution: reports.some((r) => r.statutResolution === "oui") ? "oui"
        : reports.some((r) => r.statutResolution === "en_cours") ? "en_cours" : "non",
      allDescriptions: reports.map((r) => r.description),
    };
  });
}

function renderReportItem(cluster) {
  const { label, type, urgency, count } = cluster;
  const urg = URGENCY[urgency] || URGENCY.faible;
  const time = new Date(cluster.lastTimestamp).toLocaleString("fr-FR");

  const li = document.createElement("li");

  let controls;
  if (isAdmin) {
    controls = `
      <div class="admin-controls">
        <label>Réponse autorités
          <select class="reponse-select">
            <option value="non" ${cluster.reponseAutorites !== "oui" ? "selected" : ""}>Non</option>
            <option value="oui" ${cluster.reponseAutorites === "oui" ? "selected" : ""}>Oui</option>
          </select>
        </label>
        <label>Statut
          <select class="statut-select">
            <option value="non" ${cluster.statutResolution === "non" ? "selected" : ""}>Non</option>
            <option value="en_cours" ${cluster.statutResolution === "en_cours" ? "selected" : ""}>En cours</option>
            <option value="oui" ${cluster.statutResolution === "oui" ? "selected" : ""}>Résolu</option>
          </select>
        </label>
      </div>`;
  } else {
    controls = `
      <div class="status-badges">
        <span class="status-badge">Autorités : ${statusLabel("reponse", cluster.reponseAutorites)}</span>
        <span class="status-badge">Statut : ${statusLabel("statut", cluster.statutResolution)}</span>
      </div>`;
  }

  const descriptionBlock = count > 1
    ? `<details class="cluster-details">
        <summary>${count} signalements combinés — voir le détail</summary>
        <ul class="cluster-list">${cluster.allDescriptions.map((d) => `<li>${d}</li>`).join("")}</ul>
      </details>`
    : cluster.description;

  li.innerHTML = `
    <div class="li-top">
      <span class="tag tag-${type}">${label}</span>
      <span class="urgency-badge" style="background:${urg.color}">${urg.label}</span>
      ${count > 1 ? `<span class="count-badge">×${count}</span>` : ""}
    </div>
    ${descriptionBlock}
    <span class="li-time">Dernier signalement : ${time}</span>
    ${cluster.photoBase64 ? `<img class="li-photo" src="${cluster.photoBase64}" alt="Photo du signalement">` : ""}
    ${controls}
    <div class="share-row">
      <a class="share-btn" target="_blank" href="https://wa.me/?text=${encodeURIComponent(`🚨 ${label} signalé via Alerte Citoyenne${count > 1 ? ` (par ${count} personnes)` : ""} : ${cluster.description} — ${window.location.href.split('#')[0]}`)}">Partager WhatsApp</a>
      <a class="share-btn" target="_blank" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href.split('#')[0])}">Partager Facebook</a>
    </div>
  `;

  if (isAdmin) {
    li.querySelector(".reponse-select").addEventListener("change", (e) => {
      cluster.ids.forEach((id) => reportsRef.child(id).update({ reponseAutorites: e.target.value }));
    });
    li.querySelector(".statut-select").addEventListener("change", (e) => {
      cluster.ids.forEach((id) => reportsRef.child(id).update({ statutResolution: e.target.value }));
    });
  }

  return li;
}

function renderList() {
  listEl.innerHTML = "";
  buildClusters(reportsData)
    .sort((a, b) => b.lastTimestamp - a.lastTimestamp)
    .forEach((cluster) => listEl.appendChild(renderReportItem(cluster)));
}

function updateDashboard() {
  const clusters = buildClusters(reportsData);
  const rawTotal = Object.keys(reportsData).length;

  document.getElementById("dash-total").textContent = clusters.length;
  document.getElementById("dash-total-sub").textContent = `sur ${rawTotal} signalement${rawTotal > 1 ? "s" : ""} reçu${rawTotal > 1 ? "s" : ""}`;

  const total = clusters.length || 1;
  const responded = clusters.filter((c) => c.reponseAutorites === "oui").length;
  const resolved = clusters.filter((c) => c.statutResolution === "oui").length;
  document.getElementById("dash-response-rate").textContent = `${Math.round((responded / total) * 100)} %`;
  document.getElementById("dash-resolution-rate").textContent = `${Math.round((resolved / total) * 100)} %`;

  const byUrgency = { faible: 0, moyenne: 0, elevee: 0 };
  const byType = {};
  const byDay = {};
  const now = Date.now();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now - i * 86400000);
    byDay[d.toISOString().slice(0, 10)] = 0;
  }

  clusters.forEach((c) => {
    if (byUrgency[c.urgency] !== undefined) byUrgency[c.urgency]++;
    byType[c.type] = (byType[c.type] || 0) + 1;
    const day = new Date(c.lastTimestamp).toISOString().slice(0, 10);
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
  const clusters = buildClusters(reportsData);

  clusters.forEach((c) => {
    const m = L.marker([c.lat, c.lng], { icon: makeIcon(c.type, c.urgency) });
    const urg = URGENCY[c.urgency] || URGENCY.faible;
    const countLine = c.count > 1 ? `<br><strong>${c.count} signalements combinés</strong>` : "";
    m.bindPopup(`<strong>${c.label}</strong>${countLine}<br>${c.description}<br><em>Urgence : ${urg.label}</em>${c.photoBase64 ? `<br><img src="${c.photoBase64}" style="max-width:180px;border-radius:6px;margin-top:6px;">` : ""}`);
    m.addTo(markersLayer);
  });

  Object.values(reportsData).forEach((r) => {
    const w = URGENCY[r.urgency] ? URGENCY[r.urgency].weight : 0.3;
    heatPoints.push([r.lat, r.lng, w]);
  });
  if (heatLayer) heatLayer.setLatLngs(heatPoints);
  countEl.textContent = clusters.length;
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

// ---------- Copilote de synthèse (règles, sans IA ni coût) ----------
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16`);
    const data = await res.json();
    const a = data.address || {};
    return a.suburb || a.neighbourhood || a.quarter || a.village || a.town || a.city_district
      || (data.display_name ? data.display_name.split(",")[0] : null);
  } catch {
    return null;
  }
}

async function generateSynthesis() {
  const outputEl = document.getElementById("synthesis-output");
  const btn = document.getElementById("generate-synthesis-btn");
  const clusters = buildClusters(reportsData);
  const rawTotal = Object.keys(reportsData).length;

  if (clusters.length === 0) {
    outputEl.innerHTML = "<p>Pas encore assez de signalements pour générer une synthèse.</p>";
    return;
  }

  btn.disabled = true;
  outputEl.innerHTML = "<p>Analyse en cours…</p>";

  const typeCounts = {};
  clusters.forEach((c) => { typeCounts[c.type] = (typeCounts[c.type] || 0) + 1; });
  const [topType, topTypeCount] = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
  const topTypePct = Math.round((topTypeCount / clusters.length) * 100);

  const eleveeCount = clusters.filter((c) => c.urgency === "elevee").length;
  const urgencePct = Math.round((eleveeCount / clusters.length) * 100);

  const now = Date.now(), DAY = 86400000;
  const last7 = Object.values(reportsData).filter((r) => now - r.timestamp <= 7 * DAY).length;
  const prev7 = Object.values(reportsData).filter((r) => now - r.timestamp > 7 * DAY && now - r.timestamp <= 14 * DAY).length;
  let trendPhrase;
  if (prev7 === 0 && last7 === 0) trendPhrase = "stable, sans signalement sur les deux dernières semaines";
  else if (prev7 === 0) trendPhrase = "en forte hausse par rapport à la semaine précédente (aucun signalement alors)";
  else {
    const change = Math.round(((last7 - prev7) / prev7) * 100);
    if (change > 20) trendPhrase = `en hausse de ${change} % par rapport à la semaine précédente`;
    else if (change < -20) trendPhrase = `en baisse de ${Math.abs(change)} % par rapport à la semaine précédente`;
    else trendPhrase = "globalement stable par rapport à la semaine précédente";
  }

  const responsePct = Math.round((clusters.filter((c) => c.reponseAutorites === "oui").length / clusters.length) * 100);
  const resolutionPct = Math.round((clusters.filter((c) => c.statutResolution === "oui").length / clusters.length) * 100);

  const hotspot = clusters.reduce((max, c) => (c.count > max.count ? c : max), clusters[0]);
  let hotspotPhrase = "";
  if (hotspot.count > 1) {
    const place = await reverseGeocode(hotspot.lat, hotspot.lng);
    hotspotPhrase = place
      ? ` Le point le plus signalé concerne une « ${LABELS[hotspot.type].toLowerCase()} » près de ${place}, avec ${hotspot.count} signalements distincts au même endroit.`
      : ` Le point le plus signalé concerne une « ${LABELS[hotspot.type].toLowerCase()} », avec ${hotspot.count} signalements distincts au même endroit.`;
  }

  const paragraphs = [
    `Sur la période observée, <strong>${clusters.length} incident${clusters.length > 1 ? "s" : ""} unique${clusters.length > 1 ? "s" : ""}</strong> ${clusters.length > 1 ? "ont" : "a"} été recensé${clusters.length > 1 ? "s" : ""} (${rawTotal} signalement${rawTotal > 1 ? "s" : ""} au total en comptant les doublons).`,
    `Le type le plus fréquent est « <strong>${LABELS[topType]}</strong> », représentant ${topTypePct} % des incidents.${hotspotPhrase}`,
    `<strong>${urgencePct} %</strong> des incidents sont classés en urgence élevée${urgencePct >= 30 ? " — une part importante qui mérite une attention prioritaire." : "."}`,
    `Le volume de signalements est <strong>${trendPhrase}</strong>.`,
    `Les autorités ont répondu à ${responsePct} % des incidents, et ${resolutionPct} % ont été marqués comme résolus.${responsePct < 30 ? " Le taux de réponse reste faible — un axe d'amélioration prioritaire." : ""}`,
  ];

  outputEl.innerHTML = paragraphs.map((p) => `<p>${p}</p>`).join("");
  btn.disabled = false;
}

document.getElementById("generate-synthesis-btn").addEventListener("click", generateSynthesis);
