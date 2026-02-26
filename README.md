AutoWakeUp 🌅
Smarter sleep, natural awakenings.

Standard alarms are jarring and often disrupt deep sleep cycles, leaving you feeling groggy and exhausted. AutoWakeUp is an intelligent, Android-first alarm application engineered to solve this problem. By utilizing adaptive wake windows and custom sleep-confidence algorithms, the app calculates the optimal moment to wake you up, maximizing morning freshness.

The core philosophy of this project is that an alarm shouldn't look, feel, or sound like a traditional alarm. It should be a seamless, calming transition from sleep to waking life.

✨ Core Features
Adaptive Wake Windows: Calculates dynamic wake-up candidates based on sleep cycles and user-defined constraints.

Sleep Confidence Bias: Adjusts the wake window timing dynamically (shifting earlier or later) based on the estimated quality of sleep.

Reliable Native Backend: Utilizes Android's AlarmManager for precise scheduling, ensuring alarms fire exactly when needed, even under Doze mode or after a device reboot.

Non-Disruptive UX: Features a custom, full-screen ringing activity designed to be gentle, replacing the aggressive UI of standard device alarms.

Hybrid Architecture: Combines a native Kotlin backend for heavy lifting with a WebView frontend for rapid, highly customizable UI iterations.

🛠️ Technical Stack
Backend: Android SDK, Kotlin, AlarmManager, BroadcastReceiver (Boot & Alarm handling).

Frontend UI: WebView, HTML5, CSS3, Vanilla JavaScript.

Permissions Handled: SCHEDULE_EXACT_ALARM, POST_NOTIFICATIONS, RECEIVE_BOOT_COMPLETED, VIBRATE.

🚧 Current Development Status
Status: Active Development

The foundational hybrid architecture (WebView UI bridging to a native Android backend) is complete. Current engineering efforts are focused on:

Refining the Alarm Lifecycle: Ensuring flawless execution of sound and vibration states (including proper cancellation upon dismissal).

API Compatibility: Hardening exact alarm scheduling for newer Android versions (API 31+).

Logistical Backend: Fine-tuning the mathematical logic that scores and selects the final adaptive wake time.
