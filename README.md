# Memory Stack

Memory Stack is a mobile-first DSA revision app built with React Native and Expo. It turns solved problems into a 10-stage spaced-repetition plan and keeps the daily revision queue available offline.

## Included MVP flows

- Five-tab mobile experience: Home, Queue, Add Problem, Profile, and Stats
- Local problem import with concept, subtopic, pattern, and difficulty classification
- 10-step spaced-repetition cycle: immediate, 1, 3, 7, 15, 30, 60, 90, 180, and 365 days
- Revision evaluation using correctness, time, and attempts
- Memory-strength calculation and per-topic progress
- Overdue prioritization and platform deep links
- Persistent offline data with AsyncStorage
- Daily 9:00 AM revision notifications
- Automatic light/dark system support plus an in-app dark-mode preference
- Android 10 (API 29) minimum target

The classification logic is intentionally local for this distributable MVP, so no API key is embedded in the APK. A production deployment can replace it with the Groq/Supabase Edge Function described in the PRD without changing the user flow.

## Run locally

```bash
npm install
npm start
```

Use `npm run android` to launch on an Android emulator/device.

## Validation and APK

```bash
npm run typecheck
npx expo prebuild --platform android
cd android
gradlew.bat assembleRelease
```

The packaged artifact is copied to `output/MemoryStack-v1.0.0.apk` after a successful release build.
