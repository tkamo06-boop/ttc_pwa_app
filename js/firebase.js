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
    document.getElementById("authSubmitBtn").textContent = isLogin ? "ログイン" : "新規登録";
    document.getElementById("authModeToggle").textContent = isLogin ? "新規登録" : "ログインへ戻る";
    document.querySelector(".auth-switch-text").textContent = isLogin
      ? "アカウントをお持ちでない方は"
      : "すでにアカウントをお持ちの方は";
    // パスワード再設定リンクはログインモードのみ表示
    document.getElementById("forgotPasswordWrap").style.display = isLogin ? "" : "none";
    this.clearError();
  },

  async sendPasswordReset() {
    const email = document.getElementById("authEmail").value.trim();
    if (!email) {
      this.showError("メールアドレスを入力してください");
      return;
    }
    this.clearError();
    try {
      await auth.sendPasswordResetEmail(email);
      this.showSuccess("パスワード再設定メールを送信しました。メールをご確認ください。");
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
      "auth/user-not-found": "メールアドレスが見つかりません",
      "auth/wrong-password": "パスワードが間違っています",
      "auth/invalid-credential": "メールアドレスまたはパスワードが正しくありません",
      "auth/email-already-in-use": "このメールアドレスはすでに使用されています",
      "auth/invalid-email": "メールアドレスの形式が正しくありません",
      "auth/weak-password": "パスワードは6文字以上にしてください",
      "auth/popup-closed-by-user": "ログインがキャンセルされました",
      "auth/redirect-cancelled-by-user": "ログインがキャンセルされました",
      "auth/unauthorized-domain": "このドメインはFirebaseに未登録です（Consoleで要追加）",
      "auth/operation-not-allowed": "このログイン方法は無効です",
      "auth/network-request-failed": "ネットワークエラーが発生しました",
    };
    return map[code] || (fallback ? `エラー: ${fallback}` : "エラーが発生しました");
  }
};

window.addEventListener("load", () => Auth.init());
