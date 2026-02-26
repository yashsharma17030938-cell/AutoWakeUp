<div align="center">
  
  <h1>🌅 AutoWakeUp</h1>
  
  <p><em>Smarter sleep, natural awakenings.</em></p>

</div>

---

> **The Philosophy:** An alarm shouldn't look, feel, or sound like a traditional, jarring alarm. It should be a seamless, calming transition from sleep to waking life.

Standard alarms disrupt deep sleep cycles, leaving you feeling groggy and exhausted. **AutoWakeUp** is an intelligent, Android-first alarm application engineered to solve this problem. By utilizing adaptive wake windows and custom sleep-confidence algorithms, the app calculates the optimal moment to wake you up, maximizing your morning freshness.

## ✨ Core Features

* **⏱️ Adaptive Wake Windows:** Calculates dynamic wake-up candidates based on your sleep cycles and user-defined constraints.
* **🧠 Sleep Confidence Bias:** Adjusts the wake window timing dynamically (shifting earlier or later) based on the estimated quality of your sleep.
* **⚙️ Reliable Native Backend:** Utilizes Android's `AlarmManager` for precise scheduling. Alarms fire exactly when needed, even under Doze mode or after a device reboot.
* **🔕 Non-Disruptive UX:** Features a custom, full-screen ringing activity designed to be gentle, replacing the aggressive UI of standard device alarms.
* **📱 Hybrid Architecture:** Combines a native Kotlin backend for heavy lifting with a WebView frontend for rapid, highly customizable UI iterations.

## 🛠️ Technical Stack

| Category | Technologies |
| :--- | :--- |
| **Backend** | Android SDK, Kotlin, `AlarmManager`, `BroadcastReceiver` |
| **Frontend UI** | WebView, HTML5, CSS3, Vanilla JavaScript |
| **Permissions** | `SCHEDULE_EXACT_ALARM`, `POST_NOTIFICATIONS`, `VIBRATE` |

## 🚧 Current Development Status

**🔴 Status: Active Development**

The foundational hybrid architecture (WebView UI bridging to a native Android backend) is complete. My current engineering efforts are focused on:

1.  **Refining the Alarm Lifecycle:** Ensuring flawless execution of sound and vibration states (including proper cancellation upon dismissal).
2.  **API Compatibility:** Hardening exact alarm scheduling for newer Android versions (API 31+).
3.  **Logistical Backend:** Fine-tuning the mathematical logic that scores and selects the final adaptive wake time.

---
<div align="center">
  <p>Built with ☕ and late-night coding.</p>
</div>
