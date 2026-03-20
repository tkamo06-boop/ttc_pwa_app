
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
    this.bindEvents();
    await this.loadState();
    this.render();
    this.updateProgress();
    this.bindWaveButtons();
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
        this.dom.list.appendChild(this.createColorItem(c, isWaveLocked));
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

  createColorItem(c, isLocked) {
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

    return li;
  },

  async toggleOwned(id, li) {
    if (this.state.owned.has(id)) {
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

  saveState() {
    localStorage.setItem("ttcState", JSON.stringify([...this.state.owned]));
  },

  async loadState() {
    if (this.state.plan === "paid" && this.state.userId) {
      try {
        this.state.owned = await Store.loadPaints(this.state.userId);
      } catch (e) {
        console.warn("Firestore load error:", e);
        this.loadFromLocalStorage();
      }
    } else {
      this.loadFromLocalStorage();
    }
  },

  loadFromLocalStorage() {
    const saved = localStorage.getItem("ttcState");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.owned && Array.isArray(parsed.owned)) {
        this.state.owned = new Set(parsed.owned);
      } else if (Array.isArray(parsed)) {
        this.state.owned = new Set(parsed);
      }
    } catch (e) {
      console.warn("State parse error:", e);
    }
  }

};

App._initialized = false;
window.setType = (...args) => App.setType(...args);
window.setWave = (...args) => App.setWave(...args);
