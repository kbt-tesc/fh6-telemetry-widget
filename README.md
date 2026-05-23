# FH6 Telemetry Widget

Forza Horizon 6 のテレメトリデータをリアルタイム表示する配信向けオーバーレイウィジェットです。
ウィジェットをダブルクリックすると設定画面が開き、透明度・常に最前面表示・受信 IP/ポートなどを変更できます。

> このプロジェクトは [Claude Code](https://claude.ai/) で作成されました。

## Download

ビルド済み exe は [Releases ページ](https://github.com/kbt-tesc/fh6-telemetry-widget/releases) からダウンロードできます。

## Forza Horizon 6 Data Out 仕様

公式ドキュメント: https://support.forza.net/hc/en-us/articles/51744149102611-Forza-Horizon-6-Data-Out-Documentation

FH6 は 324 バイト固定パケットを UDP で送信します (ゲームのフレームレート = 約 60Hz)。
詳細なフィールド定義は [.claude/spec/fh6-data-out.md](.claude/spec/fh6-data-out.md) を参照してください。

## 使い方

### 1. Forza Horizon 6 側の設定

ゲーム内の **SETTINGS > HUD AND GAMEPLAY** で以下を設定:

- **Data Out**: `On`
- **Data Out IP Address**: `127.0.0.1`
- **Data Out IP Port**: `34598`

### 2. ウィジェットの起動

#### ビルド済み exe を使う場合

`dist/FH6-Telemetry-Widget.exe` を実行するだけです。

#### ソースから起動する場合

```bash
pnpm install
pnpm widget
```

#### exe をビルドする場合

```bash
pnpm build
```

`dist/FH6-Telemetry-Widget.exe` が生成されます。

### 3. 操作

- **ドラッグ移動**: タイトルバー部分をドラッグ
- **リサイズ**: ウィンドウ端をドラッグ
- **設定画面**: ウィジェット本体をダブルクリック
- **最小化 / 閉じる**: ウィジェット下部のボタン

## 表示項目

| セクション | 内容 |
|-----------|------|
| Car Info | クラス (D〜X)、PI 値、駆動方式 (FWD/RWD/AWD) |
| Steer | ステアリング入力 (中央基準の横バー) |
| Accel | アクセル入力 (緑の縦バー) |
| Brake | ブレーキ入力 (赤の縦バー) |
| Clutch | クラッチ入力 (青ランプ) |
| H.Brake | ハンドブレーキ (赤ランプ) |

## 設定項目

ウィジェットをダブルクリックすると設定画面が開きます。

| 設定 | 説明 | デフォルト |
|------|------|-----------|
| 背景を完全透明 | 背景を完全に透明にする | OFF |
| 背景透明度 | 背景の透明度 (10%〜100%) | 82% |
| 常に最前面 | ウィンドウを最前面に固定 | ON |
| メニュー時非表示 | メニュー/ポーズ中にウィジェットをフェードアウト | OFF |
| 非表示までの秒数 | フェードアウトまでの待機時間 (1〜10秒) | 3秒 |
| Port | UDP 受信ポート | 34598 |
| IP Address | UDP 受信 IP (「IP指定」ボタンで表示) | 127.0.0.1 |

設定は `%APPDATA%/fh6-telemetry-widget/widget-settings.json` に自動保存されます。
ウィンドウのサイズと位置も記憶されます。

## 技術構成

```
FH6 ──(UDP)──> widget.js ──(IPC 60fps)──> widget.html
```

- `widget.js` — Electron メインプロセス。UDP 受信 + パケットデコード
- `widget-preload.js` — contextBridge で API を公開
- `widget.html` — ウィジェット UI (フレームレス・背景透過)
