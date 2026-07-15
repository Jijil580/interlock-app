# Mobile App Build

This project is wrapped with Capacitor for Android and iOS.

## Android APK

Requirements:

- JDK 17 or newer
- Android Studio with Android SDK

Commands:

```bash
npm install
npm run cap:sync
cd android
gradlew.bat assembleDebug
```

Debug APK output:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

For Play Store, build a signed release AAB from Android Studio.

## iOS

Requirements:

- Mac
- Xcode
- Apple Developer account

Commands:

```bash
npm install
npm run cap:sync
npm run cap:open:ios
```

Final iOS build and App Store/TestFlight upload must be done from Xcode on macOS.
