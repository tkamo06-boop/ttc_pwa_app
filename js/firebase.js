const firebaseConfig = {
  apiKey: "AIzaSyCpnczpXUbHnI8J9wX4pwWk3itKsAkWaSI",
  authDomain: "ttc-color-manager.firebaseapp.com",
  projectId: "ttc-color-manager",
  storageBucket: "ttc-color-manager.firebasestorage.app",
  messagingSenderId: "691225949985",
  appId: "1:691225949985:web:f49e86633fefecb531f060",
  measurementId: "G-ZSR5V38V77"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const analytics = firebase.analytics();

// JSエラーをAnalyticsに送信
window.onerror = function(msg, url, line) {
  analytics.logEvent("app_error", {
    error_message: msg,
    error_location: url + ":" + line
  });
};

// 未処理のPromiseエラーも捕捉
window.addEventListener("unhandledrejection", e => {
  analytics.logEvent("app_error", {
    error_message: e.reason?.message || String(e.reason),
    error_location: "unhandledrejection"
  });
});

const Auth = {
  mode: "login",

  init() {
    this.bindEvents();

    auth.onAuthStateChanged(user => {
      console.log("[Auth] onAuthStateChanged:", user ? user.email : "null");
      if (user) {
        this.showApp(user);
      } else {
        this.showLogin();
      }
    });
  },

  bindEvents() {
    document.getElementById("authForm").addEventListener("submit", e => {
      e.preventDefault();
      this.submitForm();
    });
    document.getElementById("googleSignInBtn").addEventListener("click", () => {
      this.signInWithGoogle();
    });
    document.getElementById("authModeToggle").addEventListener("click", e => {
      e.preventDefault();
      this.toggleMode();
    });
    document.getElementById("forgotPasswordLink").addEventListener("click", e => {
      e.preventDefault();
      this.sendPasswordReset();
    });
    document.getElementById("logoutBtn").addEventListener("click", () => {
      auth.signOut();
    });

    // 目アイコン：パスワード表示/非表示
    document.getElementById("togglePassword").addEventListener("click", () => {
      const input = document.getElementById("authPassword");
      const icon = document.getElementById("eyeIcon");
      if (input.type === "password") {
        input.type = "text";
        icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>';
      } else {
        input.type = "password";
        icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
      }
    });

    // メールアドレスを保存済みなら復元
    const savedEmail = localStorage.getItem("ttcSavedEmail");
    if (savedEmail) {
      document.getElementById("authEmail").value = savedEmail;
      document.getElementById("rememberMe").checked = true;
    }
  },

  toggleMode() {
    this.mode = this.mode === "login" ? "register" : "login";
    const isLogin = this.mode === "login";
    document.getElementById("authSubmitBtn").textContent = isLogin ? i18n.t("login_btn") : i18n.t("register_btn");
    document.getElementById("authModeToggle").textContent = isLogin ? i18n.t("register_link") : i18n.t("login_back");
    document.querySelector(".auth-switch-text").textContent = isLogin
      ? i18n.t("no_account")
      : i18n.t("have_account");
    // パスワード再設定リンクはログインモードのみ表示
    document.getElementById("forgotPasswordWrap").style.display = isLogin ? "" : "none";
    this.clearError();
  },

  async sendPasswordReset() {
    const email = document.getElementById("authEmail").value.trim();
    if (!email) {
      this.showError(i18n.t("email_required"));
      return;
    }
    this.clearError();
    try {
      await auth.sendPasswordResetEmail(email);
      this.showSuccess(i18n.t("password_reset_sent"));
    } catch (e) {
      this.showError(this.errorMessage(e.code));
    }
  },

  async submitForm() {
    const email = document.getElementById("authEmail").value;
    const password = document.getElementById("authPassword").value;
    this.clearError();
    try {
      if (this.mode === "login") {
        await auth.signInWithEmailAndPassword(email, password);
      } else {
        await auth.createUserWithEmailAndPassword(email, password);
      }
      // ログイン成功後にメールを保存/削除
      if (document.getElementById("rememberMe").checked) {
        localStorage.setItem("ttcSavedEmail", email);
      } else {
        localStorage.removeItem("ttcSavedEmail");
      }
    } catch (e) {
      this.showError(this.errorMessage(e.code));
    }
  },

  async signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await auth.signInWithPopup(provider);
    } catch (e) {
      this.showError(this.errorMessage(e.code));
    }
  },

  showApp(user) {
    if (App._initialized) return;
    if (!user) user = auth.currentUser;
    if (!user) return;

    // Firestoreを待たずに即座にログイン画面を非表示
    App._initialized = true;
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("mainApp").style.display = "";

    Store.initUser(user.uid).then(plan => {
      App.init(user.uid, plan);
    }).catch(e => {
      console.warn("Store.initUser failed, falling back to free:", e);
      App.init(user.uid, "free");
    });
  },

  showLogin() {
    // 次回ログイン時に再初期化できるようリセット
    App._initialized = false;
    App.state.owned = new Set();
    App.state.userId = null;
    App.state.plan = "free";

    const splash = document.getElementById("bootSplash");
    if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
    document.getElementById("loginScreen").style.display = "flex";
    document.getElementById("mainApp").style.display = "none";
  },

  showError(msg) {
    const el = document.getElementById("authError");
    el.textContent = msg;
    el.className = "auth-error";
  },

  showSuccess(msg) {
    const el = document.getElementById("authError");
    el.textContent = msg;
    el.className = "auth-success";
  },

  clearError() {
    const el = document.getElementById("authError");
    el.textContent = "";
    el.className = "auth-error";
  },

  errorMessage(code, fallback) {
    const map = {
      "auth/user-not-found":           "error_user_not_found",
      "auth/wrong-password":           "error_wrong_password",
      "auth/invalid-credential":       "error_invalid_credential",
      "auth/email-already-in-use":     "error_email_in_use",
      "auth/invalid-email":            "error_invalid_email",
      "auth/weak-password":            "error_weak_password",
      "auth/popup-closed-by-user":     "error_popup_closed",
      "auth/redirect-cancelled-by-user": "error_popup_closed",
      "auth/unauthorized-domain":      "error_unauthorized_domain",
      "auth/operation-not-allowed":    "error_operation_not_allowed",
      "auth/network-request-failed":   "error_network",
    };
    const key = map[code];
    return key ? i18n.t(key) : (fallback ? `${i18n.t("error_generic")}: ${fallback}` : i18n.t("error_generic"));
  }
};

window.addEventListener("load", () => Auth.init());
