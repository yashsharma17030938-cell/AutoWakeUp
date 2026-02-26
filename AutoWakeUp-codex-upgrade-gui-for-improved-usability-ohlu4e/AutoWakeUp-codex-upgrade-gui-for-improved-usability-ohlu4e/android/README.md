# Android Studio Project (Primary Target)

This project is Android-first with a WebView UI and a native alarm backend.

## Key upgrades

- Native scheduling via `AlarmManager` (more reliable than Web timers in background).
- Real alarm experience:
  - `AlarmReceiver` launches `AlarmRingingActivity` (full-screen),
  - high-priority alarm notification remains available,
  - alarm sound + vibration are handled as alarm behavior.
- Boot reschedule support (`BOOT_COMPLETED` receiver).
- JS bridge (`AndroidBridge`) to schedule/cancel/query native alarms.
- Wake window sliders + adaptive target selection logic.
- Manual-armed test mode to avoid accidental 5s trigger on ordinary app exit.

## Open and run

1. Open Android Studio.
2. Open the `android/` folder.
3. Wait for Gradle sync.
4. Run on a device/emulator.

## Permissions used

- `POST_NOTIFICATIONS`
- `RECEIVE_BOOT_COMPLETED`
- `SCHEDULE_EXACT_ALARM`
- `USE_EXACT_ALARM`
- `VIBRATE`
- `WAKE_LOCK`
