const i18n = {
  locale: 'en',

  strings: {
    ja: {
      // ログイン画面
      email_placeholder:      'メールアドレス',
      password_placeholder:   'パスワード（6文字以上）',
      toggle_password_aria:   'パスワードを表示',
      remember_me:            'メールアドレスを保存する',
      login_btn:              'ログイン',
      forgot_password:        'パスワードをお忘れですか？',
      or_divider:             'または',
      google_signin:          'Googleでログイン',
      no_account:             'アカウントをお持ちでない方は',
      register_link:          '新規登録',
      // モード切替
      register_btn:           '新規登録',
      login_back:             'ログインへ戻る',
      have_account:           'すでにアカウントをお持ちの方は',
      // メインアプリ
      logout_btn:             'ログアウト',
      // 確認シート
      confirm_ok:             '解除する',
      confirm_cancel:         'キャンセル',
      confirm_unown:          '所持を解除しますか？',
      // 販売店
      store_title:            '取扱販売店',
      store_locating:         '現在地を取得中…',
      // 認証メッセージ
      email_required:         'メールアドレスを入力してください',
      password_reset_sent:    'パスワード再設定メールを送信しました。メールをご確認ください。',
      // エラーメッセージ
      error_user_not_found:        'メールアドレスが見つかりません',
      error_wrong_password:        'パスワードが間違っています',
      error_invalid_credential:    'メールアドレスまたはパスワードが正しくありません',
      error_email_in_use:          'このメールアドレスはすでに使用されています',
      error_invalid_email:         'メールアドレスの形式が正しくありません',
      error_weak_password:         'パスワードは6文字以上にしてください',
      error_popup_closed:          'ログインがキャンセルされました',
      error_unauthorized_domain:   'このドメインはFirebaseに未登録です（Consoleで要追加）',
      error_operation_not_allowed: 'このログイン方法は無効です',
      error_network:               'ネットワークエラーが発生しました',
      error_generic:               'エラーが発生しました',
    },
    en: {
      // Login screen
      email_placeholder:      'Email address',
      password_placeholder:   'Password (6+ characters)',
      toggle_password_aria:   'Show password',
      remember_me:            'Remember email',
      login_btn:              'Log In',
      forgot_password:        'Forgot your password?',
      or_divider:             'or',
      google_signin:          'Sign in with Google',
      no_account:             "Don't have an account?",
      register_link:          'Sign Up',
      // Mode toggle
      register_btn:           'Sign Up',
      login_back:             'Back to Log In',
      have_account:           'Already have an account?',
      // Main app
      logout_btn:             'Log Out',
      // Confirm sheet
      confirm_ok:             'Remove',
      confirm_cancel:         'Cancel',
      confirm_unown:          'Remove from collection?',
      // Stores
      store_title:            'Retailers',
      store_locating:         'Getting your location…',
      // Auth messages
      email_required:         'Please enter your email address',
      password_reset_sent:    'A password reset email has been sent. Please check your inbox.',
      // Error messages
      error_user_not_found:        'Email address not found',
      error_wrong_password:        'Incorrect password',
      error_invalid_credential:    'Invalid email or password',
      error_email_in_use:          'This email address is already in use',
      error_invalid_email:         'Invalid email format',
      error_weak_password:         'Password must be at least 6 characters',
      error_popup_closed:          'Sign in was cancelled',
      error_unauthorized_domain:   'This domain is not registered in Firebase (add it in Console)',
      error_operation_not_allowed: 'This sign-in method is not enabled',
      error_network:               'A network error occurred',
      error_generic:               'An error occurred',
    }
  },

  init() {
    const lang = navigator.language || 'en';
    this.locale = lang.startsWith('ja') ? 'ja' : 'en';
    document.documentElement.lang = this.locale;
    this.apply();
  },

  t(key) {
    return (this.strings[this.locale] || {})[key]
      || this.strings.en[key]
      || key;
  },

  apply() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = this.t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = this.t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      el.setAttribute('aria-label', this.t(el.dataset.i18nAria));
    });
  }
};

i18n.init();
