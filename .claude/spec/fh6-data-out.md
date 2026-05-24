# Forza Horizon 6 "Data Out" Telemetry Specification

Source: https://support.forza.net/hc/en-us/articles/51744149102611-Forza-Horizon-6-Data-Out-Documentation

## Overview

One-way UDP telemetry sent at the game's frame rate (~60Hz).
Single fixed packet format: **324 bytes**.
Data is only sent while actively driving (not during menus, pauses, replays, rewinds, or after finishing).

## Configuration (in-game: SETTINGS > HUD AND GAMEPLAY)

- **Data Out**: On/Off toggle
- **Data Out IP Address**: Target IP (127.0.0.1 supported)
- **Data Out IP Port**: Target port (avoid 5200-5300, game uses those internally)

## Type Notation

- `S8` / `S32` = Signed integer (8-bit / 32-bit)
- `U8` / `U16` / `U32` = Unsigned integer
- `F32` = 32-bit float (IEEE 754, little-endian)

## Packet Format (324 bytes, all little-endian)

| Offset | Type | Name | Description | メモ |
|--------|------|------|-------------|------|
| 0 | S32 | IsRaceOn | 1 = driving, 0 = menus/stopped | 走行中=1, メニュー/停止=0 |
| 4 | U32 | TimestampMS | Millisecond timestamp (can overflow) | ミリ秒タイムスタンプ(オーバーフローあり) |
| 8 | F32 | EngineMaxRpm | | エンジン最大回転数 |
| 12 | F32 | EngineIdleRpm | | アイドリング回転数 |
| 16 | F32 | CurrentEngineRpm | | 現在の回転数 |
| 20 | F32 | AccelerationX | Car local space: X=right | 加速度 右方向 (車両ローカル座標) |
| 24 | F32 | AccelerationY | Car local space: Y=up | 加速度 上方向 |
| 28 | F32 | AccelerationZ | Car local space: Z=forward | 加速度 前方向 |
| 32 | F32 | VelocityX | Car local space: X=right | 速度 右方向 (車両ローカル座標) |
| 36 | F32 | VelocityY | Car local space: Y=up | 速度 上方向 |
| 40 | F32 | VelocityZ | Car local space: Z=forward | 速度 前方向 |
| 44 | F32 | AngularVelocityX | rad/s, X=pitch | 角速度 ピッチ (rad/s) |
| 48 | F32 | AngularVelocityY | rad/s, Y=yaw | 角速度 ヨー |
| 52 | F32 | AngularVelocityZ | rad/s, Z=roll | 角速度 ロール |
| 56 | F32 | Yaw | Radians | ヨー角 (ラジアン) 車の向き |
| 60 | F32 | Pitch | Radians | ピッチ角 前後の傾き |
| 64 | F32 | Roll | Radians | ロール角 左右の傾き |
| 68 | F32 | NormalizedSuspensionTravelFL | 0.0=max stretch, 1.0=max compression | サス伸縮率 左前 (0=最大伸び, 1=最大縮み) |
| 72 | F32 | NormalizedSuspensionTravelFR | | サス伸縮率 右前 |
| 76 | F32 | NormalizedSuspensionTravelRL | | サス伸縮率 左後 |
| 80 | F32 | NormalizedSuspensionTravelRR | | サス伸縮率 右後 |
| 84 | F32 | TireSlipRatioFL | 0=100% grip, \|ratio\|>1.0=loss of grip | タイヤ滑り率 左前 (0=グリップ, >1=グリップ喪失) |
| 88 | F32 | TireSlipRatioFR | | タイヤ滑り率 右前 |
| 92 | F32 | TireSlipRatioRL | | タイヤ滑り率 左後 |
| 96 | F32 | TireSlipRatioRR | | タイヤ滑り率 右後 |
| 100 | F32 | WheelRotationSpeedFL | rad/s | ホイール回転速度 左前 (rad/s) |
| 104 | F32 | WheelRotationSpeedFR | | ホイール回転速度 右前 |
| 108 | F32 | WheelRotationSpeedRL | | ホイール回転速度 左後 |
| 112 | F32 | WheelRotationSpeedRR | | ホイール回転速度 右後 |
| 116 | S32 | WheelOnRumbleStripFL | 1=on, 0=off | 縁石上フラグ 左前 |
| 120 | S32 | WheelOnRumbleStripFR | | 縁石上フラグ 右前 |
| 124 | S32 | WheelOnRumbleStripRL | | 縁石上フラグ 左後 |
| 128 | S32 | WheelOnRumbleStripRR | | 縁石上フラグ 右後 |
| 132 | S32 | WheelInPuddleFL | 1=in puddle, 0=not | 水たまりフラグ 左前 |
| 136 | S32 | WheelInPuddleFR | | 水たまりフラグ 右前 |
| 140 | S32 | WheelInPuddleRL | | 水たまりフラグ 左後 |
| 144 | S32 | WheelInPuddleRR | | 水たまりフラグ 右後 |
| 148 | F32 | SurfaceRumbleFL | Controller force feedback value | 路面振動値 左前 (コントローラFF用) |
| 152 | F32 | SurfaceRumbleFR | | 路面振動値 右前 |
| 156 | F32 | SurfaceRumbleRL | | 路面振動値 左後 |
| 160 | F32 | SurfaceRumbleRR | | 路面振動値 右後 |
| 164 | F32 | TireSlipAngleFL | 0=100% grip, \|angle\|>1.0=loss of grip | タイヤ横滑り角 左前 |
| 168 | F32 | TireSlipAngleFR | | タイヤ横滑り角 右前 |
| 172 | F32 | TireSlipAngleRL | | タイヤ横滑り角 左後 |
| 176 | F32 | TireSlipAngleRR | | タイヤ横滑り角 右後 |
| 180 | F32 | TireCombinedSlipFL | 0=100% grip, \|slip\|>1.0=loss of grip | タイヤ複合滑り 左前 (縦+横の合成) |
| 184 | F32 | TireCombinedSlipFR | | タイヤ複合滑り 右前 |
| 188 | F32 | TireCombinedSlipRL | | タイヤ複合滑り 左後 |
| 192 | F32 | TireCombinedSlipRR | | タイヤ複合滑り 右後 |
| 196 | F32 | SuspensionTravelMetersFL | Actual travel in meters | サスストローク実測値 左前 (m) |
| 200 | F32 | SuspensionTravelMetersFR | | サスストローク実測値 右前 |
| 204 | F32 | SuspensionTravelMetersRL | | サスストローク実測値 左後 |
| 208 | F32 | SuspensionTravelMetersRR | | サスストローク実測値 右後 |
| 212 | S32 | CarOrdinal | Unique car make/model ID | 車種固有ID |
| 216 | S32 | CarClass | 0=D, 1=C, 2=B, 3=A, 4=S1, 5=S2, 6=R, 7=X | 車両クラス |
| 220 | S32 | CarPerformanceIndex | 100 (worst) to 999 (best) | PI値 (性能指数) |
| 224 | S32 | DrivetrainType | 0=FWD, 1=RWD, 2=AWD | 駆動方式 (前輪/後輪/四輪) |
| 228 | S32 | NumCylinders | | シリンダー数 |
| 232 | U32 | CarGroup | Car group identifier (FH6 new) | 車両グループID (FH6新規) |
| 236 | F32 | SmashableVelDiff | Velocity loss from smashable collision m/s (FH6 new) | 破壊物衝突時の速度ロス m/s (FH6新規) |
| 240 | F32 | SmashableMass | Mass of hit smashable object kg (FH6 new) | 衝突した破壊物の質量 kg (FH6新規) |
| 244 | F32 | PositionX | World space meters | ワールド座標X (m) |
| 248 | F32 | PositionY | World space meters | ワールド座標Y 高さ (m) |
| 252 | F32 | PositionZ | World space meters | ワールド座標Z (m) |
| 256 | F32 | Speed | m/s | 車速 (m/s, ×3.6でkm/h) |
| 260 | F32 | Power | Watts | 出力 (W, ÷745.7でHP) |
| 264 | F32 | Torque | Nm | トルク (Nm) |
| 268 | F32 | TireTempFL | | タイヤ温度 左前 |
| 272 | F32 | TireTempFR | | タイヤ温度 右前 |
| 276 | F32 | TireTempRL | | タイヤ温度 左後 |
| 280 | F32 | TireTempRR | | タイヤ温度 右後 |
| 284 | F32 | Boost | PSI above atmospheric | 過給圧 (大気圧上PSI) |
| 288 | F32 | Fuel | 0.0=empty, 1.0=full | 燃料残量 (0=空, 1=満タン) |
| 292 | F32 | DistanceTraveled | Meters | 走行距離 (m) |
| 296 | F32 | BestLap | Seconds (0.0 if N/A) | ベストラップタイム (秒) |
| 300 | F32 | LastLap | Seconds (0.0 if N/A) | 前回ラップタイム (秒) |
| 304 | F32 | CurrentLap | Seconds | 現在ラップ経過時間 (秒) |
| 308 | F32 | CurrentRaceTime | Seconds since driving started | レース経過時間 (秒) |
| 312 | U16 | LapNumber | Laps completed | 完走ラップ数 |
| 314 | U8 | RacePosition | | 順位 |
| 315 | U8 | Accel | 0-255 | アクセル入力量 |
| 316 | U8 | Brake | 0-255 | ブレーキ入力量 |
| 317 | U8 | Clutch | 0-255 | クラッチ入力量 |
| 318 | U8 | HandBrake | 0-255 | サイドブレーキ入力量 |
| 319 | U8 | Gear | | 現在のギア |
| 320 | S8 | Steer | -127=full left, 0=center, 127=full right | ステアリング (-127=左全切り, 127=右全切り) |
| 321 | S8 | NormalizedDrivingLine | -127 to 127 | 走行ライン位置 (正規化) |
| 322 | S8 | NormalizedAIBrakeDifference | -127 to 127 | AIブレーキ差分 (正規化) |
| 323 | | (padding) | 1 byte | パディング |
