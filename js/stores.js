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

    const waveBadges = s.waves.map(w =>
      `<span class="wave-badge">${w}</span>`
    ).join("");

    const links = this.buildLinks(s);

    li.innerHTML = `
      <div class="store-item-header">
        <span class="store-name">${s.name}</span>
        <span class="store-distance">${distText}</span>
      </div>
      <div class="store-area">${s.area}</div>
      <div class="store-waves">${waveBadges}</div>
      <div class="store-links">${links}</div>
    `;

    return li;
  },

  buildLinks(s) {
    const buttons = [];

    if (s.ec_url) {
      buttons.push(`<button class="store-link-btn ec" onclick="window.open('${s.ec_url}','_blank')">オンライン購入</button>`);
    }
    if (s.url) {
      buttons.push(`<button class="store-link-btn web" onclick="window.open('${s.url}','_blank')">店舗サイト</button>`);
    }
    if (!s.ec_url && !s.url) {
      const mapUrl = `https://maps.google.com/?q=${encodeURIComponent(s.address)}`;
      buttons.push(`<button class="store-link-btn map" onclick="window.open('${mapUrl}','_blank')">Google Map</button>`);
    }

    return buttons.join("");
  }

};
