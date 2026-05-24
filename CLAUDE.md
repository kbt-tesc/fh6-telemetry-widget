# FH6 Telemetry Widget

Forza Horizon 6 のテレメトリデータ (UDP "Data Out") をリアルタイム表示する Electron 製オーバーレイウィジェット。

## Architecture

- `widget.js` — Electron メインプロセス。UDP受信 + パケットデコード + IPC でレンダラーに60fps配信
- `widget-preload.js` — contextBridge でテレメトリ受信・ウィンドウ操作・設定変更 API を公開
- `widget.html` — ウィジェットUI (CSS/JS埋め込み、フレームレス・背景透過)

## Data Format

FH6 Data Out: 324 bytes/packet, ~60Hz, one-way UDP.
詳細仕様: `.claude/spec/fh6-data-out.md`

## Commands

- `pnpm widget` — 開発時の起動
- `pnpm build` — ポータブル exe をビルド (`dist/FH6-Telemetry-Widget.exe`)

## Widget Features

- 常に最前面表示 (設定でOFF可)
- フレームレス・背景透過 (透明度調整 / 完全透明)
- 表示: Car Info (Class, PI, 駆動方式) / ステアリング / アクセル / ブレーキ / クラッチ / ハンドブレーキ
- メニュー時/停止時自動非表示 (設定で有効化、秒数指定可。`isRaceOn !== 1` のメニュー状態に加え、走行中でも `accel==0 && brake==0 && |steer|≦5 && |speed|≦0.5 m/s` なら同様に非表示。加速度は重力成分の懸念があり判定に未使用)
- IP/ポート設定可能
- ウィンドウサイズ・位置を記憶
- 設定は `%APPDATA%/fh6-telemetry-widget/widget-settings.json` に保存
