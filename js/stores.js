const Stores = {

  data: null,

  async init() {
    document.getElementById("storeBtn").addEventListener("click", () => this.open());
    document.getElementById("storeBackBtn").addEventListener("click", () => this.close());
  },

  async open() {
    document.getElementById("storeScreen").style.display = "flex";
    document.getElementById("storeList").innerHTML = "";
    document.getElementById("storeLocating").style.display = "block";

    if (!this.data) {
      const res = await fetch("data/stores.json");
      this.data = (await res.json()).stores;
    }

    this.getLocation()
      .then(pos => this.render(this.data, pos))
      .catch(() => this.render(this.data, null));
  },

  close() {
    document.getElementById("storeScreen").style.display = "none";
  },

  getLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject();
      navigator.geolocation.getCurrentPosition(
        p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => reject(),
        { timeout: 8000 }
      );
    });
  },

  distance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },

  formatDistance(km) {
    return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
  },

  render(stores, pos) {
    document.getElementById("storeLocating").style.display = "none";

    const sorted = [...stores].map(s => ({
      ...s,
      dist: pos ? this.distance(pos.lat, pos.lng, s.lat, s.lng) : null
    })).sort((a, b) => {
      if (a.dist === null) return 0;
      return a.dist - b.dist;
    });

    const list = document.getElementById("storeList");
    sorted.forEach(s => list.appendChild(this.createItem(s)));
  },

  createItem(s) {
    const li = document.createElement("li");
    li.className = "store-item";

    const distText = s.dist !== null ? this.formatDistance(s.dist) : "";
    const mapUrl = `https://maps.google.com/?q=${encodeURIComponent(s.address)}`;

    const iconMap = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
    const iconWeb = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
    const iconEc = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`;

    const siteBtn = s.url
      ? `<button class="store-icon-btn" onclick="window.open('${s.url}','_blank')">${iconWeb}</button>`
      : `<button class="store-icon-btn" disabled>${iconWeb}</button>`;

    const ecBtn = s.ec_url
      ? `<button class="store-icon-btn ec" onclick="window.open('${s.ec_url}','_blank')">${iconEc}</button>`
      : `<button class="store-icon-btn" disabled>${iconEc}</button>`;

    const mapBtn = `<button class="store-icon-btn map" onclick="window.open('${mapUrl}','_blank')">${iconMap}</button>`;

    const allWaves = ["W1", "W2", "W3"];
    const waveBadges = allWaves.map(w =>
      s.waves.includes(w)
        ? `<span class="wave-badge">${w}</span>`
        : `<span class="wave-badge disabled">${w}</span>`
    ).join("");

    li.innerHTML = `
      <div class="store-name-row">
        <span class="store-name">${s.name}</span>
        <span class="store-name-icons">${siteBtn}${ecBtn}</span>
      </div>
      <div class="store-address-row">
        <span class="store-address">${s.address}</span>
        ${mapBtn}
      </div>
      <div class="store-waves">${waveBadges}${distText ? `<span class="store-distance">${distText}</span>` : ""}</div>
    `;

    return li;
  }

};
