# Zeemax ERP — Android App

This is the same Zeemax ERP React app used on desktop, wrapped for
Android with [Capacitor](https://capacitorjs.com) instead of Electron.
Business logic, forms, and document templates are unchanged —
`src/ZeemaxERP.jsx` is a straight copy of the desktop app's source file.

**This app works fully offline**, exactly like the desktop version.
Data lives in a local file on the phone. To move data between your
phone and your desktop, use **Settings → Export Backup** on one device
and **Settings → Merge Backup…** on the other — this combines both
sides without losing anything, the same feature already built into
the desktop app.

## ⚠️ Important: I could not compile the actual .apk for you

Building an Android app requires downloading the Android SDK and
Gradle's build tools from Google's and Gradle's own servers. The
sandbox I built this project in has no access to those servers (it's
restricted to a small allow-list of domains for security), so I
could get everything **ready to build** — the full source code, the
storage layer, the native Android project — but I could not run the
final compile step myself. This is different from the desktop
Windows build, where a compiler (Wine) was available locally.

There are two ways to get the actual `.apk` file from here — pick
whichever is easier for you.

---

## Option A — GitHub Actions (recommended, no installs needed)

This builds the real APK in the cloud automatically. You don't need
Android Studio, a fast computer, or any local setup at all.

1. Create a free account at [github.com](https://github.com) if you
   don't have one already.
2. Create a new **private** repository (e.g. `zeemax-erp-mobile`).
3. Upload this entire `mobile/` folder's contents into that repository
   (drag-and-drop works fine on github.com, or use `git push` if
   you're comfortable with Git).
4. Go to the **Actions** tab of your new repository. A workflow called
   "Build Zeemax ERP Android APK" will already be there (it's the file
   at `.github/workflows/build-android.yml`) — it runs automatically
   the moment you push code, or you can click **"Run workflow"** to
   trigger it manually any time.
5. Wait for the green checkmark (usually 3–5 minutes).
6. Click into the finished run, scroll down to **Artifacts**, and
   download `zeemax-erp-debug-apk` — that's a `.zip` containing the
   real `app-debug.apk`.
7. Transfer that `.apk` to your phone (email it to yourself, Google
   Drive, USB cable — any way you'd normally get a file onto your
   phone) and tap it to install.

**One extra step Android will ask for:** since this isn't from the
Play Store, Android will show a warning the first time — go to
**Settings → Apps → Special access → Install unknown apps**, find
whichever app you used to open the file (Files, Chrome, Gmail, etc.)
and allow it. This is completely normal for any app installed outside
the Play Store, and only needs doing once.

## Option B — Build it yourself locally

If you'd rather not use GitHub, or want to open the project in Android
Studio to poke around:

1. Install [Android Studio](https://developer.android.com/studio)
   (free, from Google) — this includes everything needed: the Android
   SDK, Gradle, and an emulator if you want to test without a physical
   phone.
2. Install [Node.js](https://nodejs.org) (18+) if you don't have it.
3. From this `mobile/` folder:
   ```bash
   npm install
   npm run build
   npx cap sync android
   npx cap open android
   ```
4. Android Studio will open the native project. Let it finish indexing
   (first time only, can take a few minutes), then click the green
   ▶ **Run** button — this builds the APK and installs it directly on
   a connected phone (via USB with "USB debugging" enabled) or an
   emulator.
5. To get a standalone `.apk` file instead of running it directly:
   **Build → Build Bundle(s) / APK(s) → Build APK(s)** — Android
   Studio will show a notification with a link to the finished file
   once it's done (`android/app/build/outputs/apk/debug/app-debug.apk`).

---

## Project layout

```
capacitor.config.json    App ID, name, and Capacitor settings
package.json              Build scripts + dependencies
src/
  index.jsx                Mounts the app — installs the storage/native
                            bridges first, then renders ZeemaxERP
  storage-bridge.js         Implements window.storage using Capacitor's
                            Filesystem plugin (mirrors desktop's storage.js)
  native-bridge.js          Implements window.zeemaxNative — backup export
                            (via the Android Share sheet) and merge/import
                            (via a native file picker)
  ZeemaxERP.jsx              The actual app — identical business logic to
                            desktop, shared verbatim
  assets/
    zeemax.png               Company logo
www/
  index.html                 HTML shell loaded into the app
  app.bundle.js               Built by `npm run build` (esbuild) — not
                            committed to git, regenerated on every build
android/                    The native Android project (Capacitor-generated)
.github/workflows/
  build-android.yml           The GitHub Actions workflow described above
```

## How storage differs from desktop (and why it's compatible)

The React app only ever calls `window.storage.get/set/delete/list()` —
it has no idea whether it's running on desktop or mobile. On desktop,
that's implemented by talking to Electron's main process over IPC,
which writes to a file via Node's `fs` module. Here, `storage-bridge.js`
implements the exact same four functions using Capacitor's `Filesystem`
plugin instead, writing to the phone's private app-data directory
(invisible to other apps, removed if the app is uninstalled — the
normal, expected behavior for local app data on Android). Same
temp-file-then-rename pattern as desktop, so a crash mid-save can't
corrupt existing data.

This is also exactly why the **same backup file** you export from
desktop can be merged into the phone (and vice-versa) — both sides
serialize their data into the same JSON shape under the same
`zeemax_db` key.

## What was verified before this was handed off

- `storage-bridge.js` — 8/8 unit tests pass against a realistic mock
  of Capacitor's Filesystem API (missing keys, persistence across
  restarts, multiple keys coexisting, prefix filtering, deletion,
  atomic writes, and graceful handling of a corrupted store file).
- The production bundle (`npm run build`) was built successfully —
  307KB minified — and boot-tested: the app renders all 9 navigation
  tabs with no crash.
- `npx cap add android` and `npx cap sync android` both completed
  successfully, producing a real, complete native Android project with
  the app bundle correctly copied into
  `android/app/src/main/assets/public/`.
- The GitHub Actions workflow YAML was validated for correct syntax.
- What could **not** be verified here: the actual Gradle build
  succeeding, and the app running on a real device/emulator — both
  require the Android SDK/Gradle downloads this sandbox can't reach.
  Option A or B above is how to close that gap.
