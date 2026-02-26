# AutoWakeUp (Android-first)

AutoWakeUp helps people sleep with less stress and wake up fresher by choosing wake times in healthy sleep-cycle windows.

## Why this app is useful

- Reduces wake-up anxiety by giving a clear **wake range** instead of one rigid alarm minute.
- Supports better mornings by selecting an adaptive wake target aligned with sleep cycles.
- Uses native Android alarms for reliability even when the app is closed.
- Keeps test behavior safe and predictable (manual arm only; no surprise test alarm on normal app exit).

## Core improvements in this build

- Drag-friendly wake-window sliders + time inputs.
- Native Android alarm ringing flow (full-screen alarm activity + high-priority alarm notification).
- Better screen-off interpretation:
  - short checks at night are treated as brief checks,
  - meaningful usage requires longer active duration,
  - test mode requires manual arming before screen-off.

## Web preview (UI only)

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.

## Android build

```bash
cd android
./gradlew assembleDebug
```

Install APK from `android/app/build/outputs/apk/debug/`.
