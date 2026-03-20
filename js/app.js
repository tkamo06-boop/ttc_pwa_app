
const App = {

  state: {
    owned: new Set(),
    wave: "all",
    type: "all",
    plan: "free",
    userId: null
  },

  async init(userId, plan) {
    this.state.userId = userId || null;
    this.state.plan = plan || "free";
    this.hideSplash();
    this.cacheDOM();
    if (!this._eventsBound) {
      this.bindEvents();
      this.bindWaveButtons();
      this._eventsBound = true;
    }
    await this.loadState();
    this.render();
    this.updateProgress();
    Stores.init();
  },

  hideSplash() {
    const el = document.getElementById("bootSplash");
    if (!el) return;
    setTimeout(() => {
      el.classList.add("hide");
      setTimeout(() => {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      }, 300);
    }, 600);
  },

  dom: {},

  bindWaveButtons() {
    document.querySelectorAll(".wave-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        this.setWave(btn.dataset.wave);
      });
    });
  },

  cacheDOM() {
    this.dom.list = document.getElementById("colorList");
    this.dom.progressText = document.getElementById("progressText");
    this.dom.progressFill = document.getElementById("progressFill");
    this.dom.chips = document.querySelectorAll(".chip");
  },

  bindEvents() {
    this.dom.list.addEventListener("click", (e) => {
      const li = e.target.closest("li");
      if (!li) return;
      if (li.classList.contains("locked")) return;
      const id = Number(li.dataset.id);
      this.toggleOwned(id, li);
    });
  },

  render() {
    this.renderList();
  },

  renderList() {
    this.dom.list.innerHTML = "";

    data.waves.forEach(w => {
      if (this.state.wave !== "all" && w.name !== this.state.wave) return;

      this.dom.list.appendChild(this.createWaveHeader(w.name));

      const isWaveLocked = this.state.plan === "free" && w.name !== "WAVE1";

      w.colors.forEach(c => {
        if (this.state.type !== "all" && c.type !== this.state.type) return;
        this.dom.list.appendChild(this.createColorItem(c, isWaveLocked, w.name));
      });
    });
  },

  createWaveHeader(name) {
    const div = document.createElement("div");
    div.className = "wave-header";
    const isLocked = this.state.plan === "free" && name !== "WAVE1";
    div.innerHTML = isLocked
      ? `${name} <span class="wave-lock-badge">PREMIUM</span>`
      : name;
    return div;
  },

  createColorItem(c, isLocked, waveName) {
    const li = document.createElement("li");
    li.dataset.id = c.id;

    if (isLocked) {
      li.classList.add("locked");
    } else if (this.state.owned.has(c.id)) {
      li.classList.add("owned");
    }

    li.innerHTML = `
      <div class="color-swatch" style="background:${c.hex}"></div>
      <div class="color-info">
        <div class="color-name-line">
          <span class="color-id">[${c.id}]</span>
          <span>${c.name}</span>
        </div>
        <div class="color-type">${c.type}</div>
      </div>
      ${isLocked ? '<span class="lock-icon">🔒</span>' : ''}
    `;

    const cartBtn = document.createElement("button");
    cartBtn.className = "item-cart-btn";
    cartBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`;
    cartBtn.addEventListener("click", e => {
      e.stopPropagation();
      const waveKey = waveName.replace("WAVE", "W");
      Stores.open(waveKey);
    });
    li.appendChild(cartBtn);

    return li;
  },

  async toggleOwned(id, li) {
    if (this.state.owned.has(id)) {
      if (!await this.showConfirm("所持を解除しますか？")) return;
      this.state.owned.delete(id);
      li.classList.remove("owned");
      if (this.state.plan === "paid") {
        await Store.deletePaint(this.state.userId, id);
      }
    } else {
      this.state.owned.add(id);
      li.classList.add("owned");
      if (this.state.plan === "paid") {
        await Store.savePaint(this.state.userId, id);
      }
    }

    if (this.state.plan !== "paid") this.saveState();
    this.updateProgress();
  },

  setWave(w) {
    this.state.wave = w;
    document.querySelectorAll(".wave-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.wave === w);
    });
    this.render();
  },

  setType(type, el) {
    this.state.type = type;
    this.dom.chips.forEach(btn => btn.classList.remove("active"));
    if (el) el.classList.add("active");
    this.render();
  },

  updateProgress() {
    let total, ownedCount;

    if (this.state.plan === "free") {
      const wave1 = data.waves.find(w => w.name === "WAVE1");
      total = wave1 ? wave1.colors.length : 0;
      const wave1Ids = new Set(wave1 ? wave1.colors.map(c => c.id) : []);
      ownedCount = [...this.state.owned].filter(id => wave1Ids.has(id)).length;
    } else {
      total = data.waves.reduce((sum, w) => sum + w.colors.length, 0);
      ownedCount = this.state.owned.size;
    }

    if (!total) return;
    const percent = Math.round((ownedCount / total) * 100);
    this.dom.progressText.textContent = percent + "%";
    this.dom.progressFill.style.width = percent + "%";
  },

  showConfirm(msg) {
    return new Promise(resolve => {
      const sheet = document.getElementById("confirmSheet");
      document.querySelector(".confirm-msg").textContent = msg;
      sheet.classList.add("active");

      const done = result => {
        sheet.classList.remove("active");
        resolve(result);
      };

      document.getElementById("confirmOk").addEventListener("click", () => done(true), { once: true });
      document.getElementById("confirmCancel").addEventListener("click", () => done(false), { once: true });
      sheet.addEventListener("click", e => { if (e.target === sheet) done(false); }, { once: true });
    });
  },

  saveState() {
    localStorage.setItem("ttcState", JSON.stringify([...this.state.owned]));
  },

  async loadState() {
    if (this.state.plan === "paid" && this.state.userId) {
      try {
        const firestoreOwned = await Store.loadPaints(this.state.userId);

        if (firestoreOwned.size === 0) {
          // Firestoreが空 → localStorageにデータがあれば移行
          const localOwned = this.readLocalStorage();
          if (localOwned.size > 0) {
            await Store.migrateFromLocal(this.state.userId, localOwned);
            this.state.owned = localOwned;
            localStorage.removeItem("ttcState");
          } else {
            this.state.owned = firestoreOwned;
          }
        } else {
          this.state.owned = firestoreOwned;
        }
      } catch (e) {
        console.warn("Firestore load error:", e);
        this.state.owned = this.readLocalStorage();
      }
    } else {
      this.state.owned = this.readLocalStorage();
    }
  },

  readLocalStorage() {
    const saved = localStorage.getItem("ttcState");
    if (!saved) return new Set();
    try {
      const parsed = JSON.parse(saved);
      if (parsed.owned && Array.isArray(parsed.owned)) return new Set(parsed.owned);
      if (Array.isArray(parsed)) return new Set(parsed);
    } catch (e) {
      console.warn("State parse error:", e);
    }
    return new Set();
  }

};

App._initialized = false;
App._eventsBound = false;
window.setType = (...args) => App.setType(...args);
window.setWave = (...args) => App.setWave(...args);
