
const App = {

  state: {
    owned: new Set(),
    wave: "all",
    type: "all"
  },

  init(){
    this.hideSplash();
      this.cacheDOM();
    this.bindEvents();
    this.loadState();
    this.render();
    this.updateProgress();
    this.bindWaveButtons();
  },
hideSplash(){
  const el = document.getElementById("bootSplash");
  if(!el) return;

  setTimeout(()=>{
    el.classList.add("hide");

    setTimeout(()=>{
      if(el && el.parentNode){
        el.parentNode.removeChild(el);
      }
    },300);

  },600);
},

  dom: {},

  bindWaveButtons(){
    document.querySelectorAll(".wave-btn").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const wave = btn.dataset.wave;
        this.setWave(wave);
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
    // リスト全体でクリック検出（イベント委譲）
    this.dom.list.addEventListener("click", (e) => {
      const li = e.target.closest("li");
      if (!li) return;

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

      w.colors.forEach(c => {
        if (this.state.type !== "all" && c.type !== this.state.type) return;
        this.dom.list.appendChild(this.createColorItem(c));
      });

    });
  },

  createWaveHeader(name) {
    const div = document.createElement("div");
    div.className = "wave-header";
    div.textContent = name;
    return div;
  },

  createColorItem(c) {
    const li = document.createElement("li");
    li.dataset.id = c.id;

    if (this.state.owned.has(c.id)) {
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
    `;

    return li;
  },

  toggleOwned(id, li) {
    if (this.state.owned.has(id)) {
      this.state.owned.delete(id);
      li.classList.remove("owned");
    } else {
      this.state.owned.add(id);
      li.classList.add("owned");
    }

    this.saveState();
    this.updateProgress();
  },

  setWave(w){
    this.state.wave = w;

    document.querySelectorAll(".wave-btn").forEach(btn=>{
      btn.classList.remove("active");
      if(btn.dataset.wave === w){
        btn.classList.add("active");
      }
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
    const total = data.waves.reduce((sum, w) => sum + w.colors.length, 0);
    if (!total) return;

    const percent = Math.round((this.state.owned.size / total) * 100);

    this.dom.progressText.textContent = percent + "%";
    this.dom.progressFill.style.width = percent + "%";
  },

  saveState() {
    localStorage.setItem("ttcState", JSON.stringify([...this.state.owned]));
  },

  loadState() {
    const saved = localStorage.getItem("ttcState");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);

      // 旧形式 { owned:[...] }
      if (parsed.owned && Array.isArray(parsed.owned)) {
        this.state.owned = new Set(parsed.owned);
      }
      // 新形式 [...]
      else if (Array.isArray(parsed)) {
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
