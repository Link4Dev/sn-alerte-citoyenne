firebase.initializeApp(firebaseConfig);
const db = firebase.database();
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

const map = L.map("map").setView(MAP_CENTER, MAP_ZOOM);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap"
}).addTo(map);

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

function makeIcon(type) {
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${COLORS[type]};border:2px solid white;box-shadow:0 0 0 1px ${COLORS[type]}"></div>`,
    iconSize: [16, 16]
  });
}

document.getElementById("report-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const type = document.querySelector('input[name="type"]:checked')?.value;
  const description = document.getElementById("description").value.trim();
  const customLabel = customTypeInput.value.trim();
  if (!type || !description || !selectedLatLng || (type === "autre" && !customLabel)) {
    alert("Merci de choisir un type, une description et un emplacement sur la carte (et de préciser le type si vous avez choisi \"Autre\").");
    return;
  }

  const label = type === "autre" ? customLabel : LABELS[type];

  const report = {
    type, description, label,
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
      `Alerte citoyenne — ${label}\n${description}\nLocalisation : https://www.google.com/maps?q=${report.lat},${report.lng}`
    );
    document.getElementById("whatsapp-link").href = `https://wa.me/${AUTHORITY_WHATSAPP_NUMBER}?text=${msg}`;
    document.getElementById("alert-authorities").classList.remove("hidden");
  });
});

const listEl = document.getElementById("report-list");
const countEl = document.getElementById("count-total");
const markersOnMap = {};

reportsRef.limitToLast(200).on("child_added", (snap) => {
  const r = snap.val();
  const id = snap.key;
  const label = r.label || LABELS[r.type] || "Incident";

  const m = L.marker([r.lat, r.lng], { icon: makeIcon(r.type) }).addTo(map);
  m.bindPopup(`<strong>${label}</strong><br>${r.description}`);
  markersOnMap[id] = m;

  const li = document.createElement("li");
  const time = new Date(r.timestamp).toLocaleString("fr-FR");
  li.innerHTML = `<span class="tag tag-${r.type}">${label}</span>${r.description}<span class="li-time">${time}</span>`;
  listEl.prepend(li);

  countEl.textContent = Object.keys(markersOnMap).length;
});

reportsRef.on("child_removed", (snap) => {
  const id = snap.key;
  if (markersOnMap[id]) {
    map.removeLayer(markersOnMap[id]);
    delete markersOnMap[id];
    countEl.textContent = Object.keys(markersOnMap).length;
  }
});
