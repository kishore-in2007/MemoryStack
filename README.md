# Memory Stack

Production-oriented Expo SDK 57 mobile app for retaining DSA concepts with a 10-stage spaced-repetition cycle.

## Implemented

- Expo Router authentication, five-tab navigation, revision session, and performance result routes
- Supabase email/password client with persisted sessions and a complete RLS-protected SQL schema
- Credential-free offline demo mode so the APK is usable immediately
- Groq classification and recommendation integration with deterministic offline fallbacks
- Duplicate-safe recommendations based on topic, subtopic, difficulty, and solved history
- Immediate, 1, 3, 7, 15, 30, 60, 90, 180, and 365-day revision scheduling
- Due and overdue queues, correctness/time/complexity/attempt evaluation, 0–100 scores, performance labels, and weak-score reinforcement
- Weighted per-topic memory strength, success rate, average score, revision count, and next-review date
- Zustand state with AsyncStorage persistence, NetInfo offline status, and cached queue access
- Configurable daily notifications and overdue alerts using Expo Notifications
- Android 10/API 29 minimum, API 36 target, EAS preview APK and production AAB profiles
- Privacy policy and Play Store credential exclusions

## Configuration

Copy `.env.example` to `.env` and provide Supabase and Groq values. The `.env` file, Google services file, and Play Store service-account key are excluded from Git.

Run [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL editor before enabling cloud mode. The app remains fully navigable with persisted local data through **Explore demo offline** when credentials are absent.

## Commands

```bash
npm install
npm start
npm run typecheck
npx expo-doctor
npm run build:apk
```

The verified ARM64 release APK is available at `output/MemoryStack-v1.0.0-full.apk`. For Play Store delivery, add an EAS project ID and run `eas build --platform android --profile production`; EAS will create the all-device AAB and manage production signing.

## Security note

The implementation guide places a Groq key in an `EXPO_PUBLIC_` variable, which would expose it inside a distributed app. This repository supports that variable for local validation, but production should proxy Groq calls through a Supabase Edge Function and keep the provider key server-side.
