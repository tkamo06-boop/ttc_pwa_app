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

    // リダイレクト後の認証結果を処理
    auth.getRedirectResult().then(result => {
      if (result && result.user) {
        this.showApp();
      }
    }).catch(e => {
      this.showError(this.errorMessage(e.code));
    });

    auth.onAuthStateChanged(user => {
      if (user) {
        this.showApp();
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
    document.getElementById("logoutBtn").addEventListener("click", () => {
      auth.signOut();
    });
  },

  toggleMode() {
    this.mode = this.mode === "login" ? "register" : "login";
    const isLogin = this.mode === "login";
    document.getElementById("authSubmitBtn").textContent = isLogin ? "ログイン" : "新規登録";
    document.getElementById("authModeToggle").textContent = isLogin ? "新規登録" : "ログインへ戻る";
    document.querySelector(".auth-switch-text").textContent = isLogin
      ? "アカウントをお持ちでない方は"
      : "すでにアカウントをお持ちの方は";
    this.clearError();
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
    } catch (e) {
      this.showError(this.errorMessage(e.code));
    }
  },

  async signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await auth.signInWithRedirect(provider);
    } catch (e) {
      this.showError(this.errorMessage(e.code));
    }
  },

  showApp() {
    if (App._initialized) return;
    const user = auth.currentUser;
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
    document.getElementById("authError").textContent = msg;
  },

  clearError() {
    document.getElementById("authError").textContent = "";
  },

  errorMessage(code) {
    const map = {
      "auth/user-not-found": "メールアドレスが見つかりません",
      "auth/wrong-password": "パスワードが間違っています",
      "auth/invalid-credential": "メールアドレスまたはパスワードが正しくありません",
      "auth/email-already-in-use": "このメールアドレスはすでに使用されています",
      "auth/invalid-email": "メールアドレスの形式が正しくありません",
      "auth/weak-password": "パスワードは6文字以上にしてください",
      "auth/popup-closed-by-user": "ログインがキャンセルされました",
    };
    return map[code] || "エラーが発生しました";
  }
};

window.addEventListener("load", () => Auth.init());
