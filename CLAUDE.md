# TTC（TWO THIN COATS）iOSアプリ化プロジェクト

## プロジェクト概要

ミニチュア塗料ブランド「TWO THIN COATS」の日本向け公式アプリ開発プロジェクト。
既存のWebアプリをiOSネイティブアプリ化し、App Storeで配布することを目標とする。

---

## ビジネス背景

- オーナーは日本国内の**公式ディストリビューター（総代理店）**
- B2B（卸売り）とB2C（一般ユーザー）の2層構造
- 国内取扱販売店は現在**5店舗**
- 販売店との関係上、アプリからECへの直販導線は**NG**（不公平感が出る）
- 本家（TTC）とは発注で定期的にやり取りがある

---

## 既存Webアプリの仕様

- **技術スタック**：HTML / CSS / JavaScript（静的・フレームワークなし）
- **画面数**：1画面
- **データ保持**：localStorage（所持フラグのON/OFF）
- **外部API**：なし
- **主な機能**：
  - 塗料リスト表示（ID・名前・カテゴリ・カラー）
  - フィルター機能（Shadow / Mid / Hi / Metal / Wash）
  - Wave別グルーピング（W1 / W2 / W3）
  - 所持管理（プログレスバーで所持率を表示）

---

## 今後の開発方針

### フェーズ1：本家への許諾取得（最優先）
1. 既存WebアプリをGitHub Pages または Netlify で公開
2. 本家にURLを共有し、Web版・ネイティブ版の許諾を取得
3. 確認事項：
   - TTCブランド名・ロゴの使用可否
   - 塗料カラーデータの使用権
   - 「公式日本版」表記の可否
   - App Store掲載の可否
   - 本家による将来的な公式アプリ展開の予定

### フェーズ2：Web版の強化 + Firebase導入
- **Firebase Authentication**
  - メール＆パスワード認証
  - Googleログイン（iOS環境では `signInWithRedirect` を使用）
- **Firestore** によるデータ移行
  - localStorageから移行し、機種変更・複数端末に対応
  - データ構造：`users/{userId}/paints/{paintId}: { owned: bool }`

### フェーズ3：Capacitorでネイティブ化
- **Capacitor** を使用（既存HTML/CSS/JSをそのまま流用可能）
- `@capacitor/ios` でiOSビルド
- 既存ファイルを `www/` フォルダに配置するだけで動作
- localStorage → Firestore移行済みなのでデータ面の問題なし

### フェーズ4：追加機能
- **FCM（Firebase Cloud Messaging）** によるプッシュ通知
  - 新Wave・新色発売情報を全ユーザーに配信
  - 管理者がFirebase Consoleから手動送信（バックエンド不要）
  - Capacitorプラグイン：`@capacitor/push-notifications`
- **取扱店ロケーター**
  - 静的データで5店舗を表示（Firestore不要）
  - 販売店への送客 → 販売店との関係強化

---

## マネタイズ戦略

```
無料ティア    Wave1のみ所持管理 + 取扱店ロケーター + プッシュ通知
有料ティア    全Wave解放 + フィルター全機能 + クラウド同期
価格          ¥600〜¥980（買い切り）
収益構造      App Store経由（ECとは無関係）→ 販売店との利益相反なし
```

- **RevenueCat** でフリーミアム実装を管理
- 広告（AdMob）は**採用しない**（コレクター層のUXを損なうため）

---

## 技術スタック（確定版）

| 領域 | 技術 |
|------|------|
| フロントエンド | HTML / CSS / JavaScript（既存） |
| 認証 | Firebase Authentication |
| データベース | Firestore |
| プッシュ通知 | Firebase Cloud Messaging（FCM） |
| ネイティブ化 | Capacitor |
| 課金管理 | RevenueCat |
| ホスティング | GitHub Pages または Netlify（Web版） |

---

## 開発ステップ

```
STEP 1  WebアプリをGitHub Pages / Netlify で公開
STEP 2  本家へ許諾申請（URLを共有）
STEP 3  Firebase Authentication 実装（メール＋Google）
STEP 4  localStorage → Firestore 移行
STEP 5  フリーミアム実装（RevenueCat）
STEP 6  取扱店ロケーター実装
STEP 7  Capacitor 環境構築・iOS化
STEP 8  FCM プッシュ通知実装
STEP 9  App Store 申請
```

---

## 環境・前提条件

- 開発者：一人開発（自分でコーディング）
- 開発PC：Windows（VSCode + Claude Code）
- iOSビルドにはMacが必要（要確認または外部サービス利用）
- Apple Developer Program登録（年$99）が必要

---

## 注意事項

- iOSでGoogleログインを使う場合は `signInWithPopup` ではなく `signInWithRedirect` を使うこと
- Capacitor環境では `www/` フォルダに既存ファイルを配置する
- コード変更後のファイル保存は手動で行う（自動保存しない）
