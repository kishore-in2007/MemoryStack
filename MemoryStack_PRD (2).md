**Memory Stack -- Product Requirements Document**

*MVP \| Version 1.1 \| Mobile Application \| July 2026*

1\. Overview

Memory Stack is an AI-powered DSA revision mobile application (iOS &
Android) that helps students retain concepts using Spaced Repetition. It
complements existing coding platforms (LeetCode, Codeforces, CodeChef)
by scheduling intelligent concept-based revisions for problems students
have already solved --- accessible anytime, anywhere from their phone.

2\. Problem Statement

Students solve hundreds of DSA problems but forget underlying concepts
due to the Ebbinghaus Forgetting Curve. Existing platforms focus on new
problem-solving, not retention. This leads to:

-   Repeated forgetting of core concepts

-   Inability to recognize problem patterns

-   Re-learning before interviews

-   Wasted preparation time

3\. Target Platform

  ----------------------------------- -----------------------------------
  **Attribute**                       **Details**

  Platform                            iOS & Android (React Native)

  Minimum iOS                         iOS 15+

  Minimum Android                     Android 10 (API 29)+

  Connectivity                        Online required; offline read-only
                                      cache

  Screen sizes                        Phones (360dp -- 430dp width)

  Push Notifications                  Daily revision reminders via FCM /
                                      APNs
  ----------------------------------- -----------------------------------

4\. Goals & Success Metrics

  ----------------------------------- -----------------------------------
  **Goal**                            **Metric**

  Improve long-term retention         Memory strength score ≥ 80% after
                                      30 days

  Reduce re-learning time             Users report 40% faster concept
                                      recall

  Increase interview readiness        90-day revision completion rate ≥
                                      70%

  Mobile engagement                   Daily active users open app ≥ 5
                                      days/week
  ----------------------------------- -----------------------------------

5\. User Stories

-   As a student, I want to add solved problems from my phone so I can
    log them right after solving.

-   As a student, I want push notifications for due revisions so I never
    miss a revision day.

-   As a student, I want a simple mobile dashboard showing today\'s
    revision queue at a glance.

-   As a student, I want problems auto-classified by topic so I don\'t
    spend time categorizing.

-   As a student, I want new problems recommended each session so I
    build deeper understanding.

-   As a student, I want to see my memory strength per topic so I can
    prioritize weak areas.

6\. Core Features (MVP)

6.1 Problem Import

-   Manual entry via mobile form: name, platform, difficulty, solved
    date

-   Supported platforms: LeetCode, Codeforces, CodeChef

-   Mobile-optimized input with dropdowns and date picker

6.2 AI Concept Classification

-   Auto-classify into: Main Topic → Subtopic → Algorithmic Pattern

-   Difficulty estimation if not provided

-   Classification result shown as a card on mobile after import

6.3 Spaced Repetition Schedule

  ----------------------- ----------------------- -----------------------
  **Revision**            **Interval**            **Purpose**

  R1                      Immediately             Reinforce initial
                                                  understanding

  R2                      1 Day                   Prevent rapid
                                                  forgetting

  R3                      3 Days                  Strengthen short-term
                                                  memory

  R4                      7 Days                  Build medium-term
                                                  retention

  R5                      15 Days                 Reinforce pattern
                                                  recognition

  R6                      30 Days                 Improve long-term
                                                  recall

  R7                      60 Days                 Verify long-term
                                                  retention

  R8                      90 Days                 Interview readiness
                                                  check

  R9                      180 Days                Long-term reinforcement

  R10                     365 Days                Annual knowledge
                                                  refresh
  ----------------------- ----------------------- -----------------------

6.4 Daily Revision Queue (Home Screen)

-   Home screen widget showing today\'s due revisions grouped by concept

-   Tap concept → see previously solved problems → start recommended
    problem

-   Overdue revisions shown with visual badge/alert

-   Push notification sent each morning for pending revisions

6.5 Intelligent Problem Recommendation

-   Recommends a new problem from same concept --- never a repeat

-   Considers: subtopic, difficulty progression, revision stage, history

-   Deep link or redirect to the coding platform in browser

6.6 Performance Evaluation

-   Mobile form to log: correctness, time taken, complexity, attempts

-   Output: revision score (0--100) + performance label

-   Weak performance triggers additional reinforcement

6.7 Memory Strength Profile

-   Per-concept card: strength score, revision count, success rate, avg
    score

-   Visual progress bar per concept on profile screen

-   Next revision date displayed prominently

6.8 Push Notifications

-   Daily morning reminder: \'You have X revisions due today\'

-   Overdue alert: \'You missed a revision for \[Topic\]\'

-   User can set preferred notification time in settings

7\. Mobile UX Requirements

-   Bottom navigation: Home \| Queue \| Add Problem \| Profile \| Stats

-   All tap targets minimum 48×48dp (accessibility standard)

-   Dark mode support

-   Maximum 3 taps to reach any core action

-   Skeleton loaders for AI classification (async)

-   Offline mode: read-only access to queue and history

8\. AI Model Responsibilities

-   Classify imported problems into topic/subtopic/pattern

-   Estimate difficulty if unavailable

-   Select revision problems avoiding duplicates

-   Update memory strength after each revision

9\. Problem Queue Schema

  ----------------------------------- -----------------------------------
  **Field**                           **Description**

  problem_id                          Unique identifier

  name                                Problem title

  platform                            LeetCode / Codeforces / CodeChef

  topic / subtopic / pattern          AI-classified hierarchy

  difficulty                          Easy / Medium / Hard

  revision_number                     Current revision (1--10)

  due_date                            When revision is due

  status                              Pending / Completed / Overdue

  priority                            Boosted for overdue items
  ----------------------------------- -----------------------------------

10\. Out of Scope (MVP)

-   Web or desktop application

-   Direct platform API integration (auto-import)

-   In-app code editor

-   Social or leaderboard features

-   Custom spaced repetition interval tuning

-   Tablet-optimized layouts

11\. Technical Stack

  ----------------------------------- -----------------------------------
  **Layer**                           **Technology**

  Mobile Framework                    React Native (Expo)

  AI Classification                   Claude API (claude-sonnet-4-6)

  Backend                             Node.js / Python REST API

  Database                            PostgreSQL (problems, revisions,
                                      profiles)

  Push Notifications                  Firebase FCM (Android) + APNs (iOS)

  Auth                                Email/password + Google OAuth

  Offline Cache                       AsyncStorage / SQLite
  ----------------------------------- -----------------------------------

12\. MVP Success Criteria

-   User can add a problem on mobile and receive AI classification
    within 5 seconds

-   Daily revision queue loads correctly on app open

-   Push notification delivered at user\'s preferred time

-   Recommended problem redirects correctly to coding platform

-   Memory strength updates after performance evaluation

-   10-revision spaced repetition cycle completes without errors

-   App runs smoothly on Android 10+ and iOS 15+ devices

---

# Full Tech Stack

## 📱 Frontend (Mobile App)

| Tool | Purpose | Why |
|---|---|---|
| **React Native** | Mobile framework | Single codebase for iOS & Android |
| **Expo** | RN toolchain | Zero native config, free OTA updates |
| **Expo Router** | Navigation | File-based routing |
| **NativeWind** | Styling | Tailwind CSS for React Native |
| **Zustand** | State management | Lightweight, simple |
| **Expo Notifications** | Push notifications | Built-in, free |
| **AsyncStorage** | Offline cache | Local key-value storage |

## ⚙️ Backend

| Tool | Purpose | Why |
|---|---|---|
| **Supabase** | Database + Auth + API | Free tier, PostgreSQL, real-time |
| **Supabase Edge Functions** | Serverless API | Runs AI calls server-side securely |
| **PostgreSQL** | Database | Via Supabase |
| **Supabase Auth** | Authentication | Email + Google OAuth built-in |

## 🤖 AI

| Tool | Purpose | Why |
|---|---|---|
| **Claude API** (claude-sonnet-4-6) | Problem classification + recommendations | Fast, accurate, affordable |

## 🔔 Notifications

| Tool | Purpose |
|---|---|
| **Expo Push Notifications** | Local + remote daily reminders |
| **FCM** (Firebase) | Android remote push (via Expo) |
| **APNs** (Apple) | iOS remote push (via Expo) |

## 🛠 Dev Tools

| Tool | Purpose |
|---|---|
| **Cursor IDE** | AI-assisted coding (vibe coding) |
| **GitHub** | Version control |
| **Expo Go** | Test on real device instantly |
| **EAS Build** | Build APK / IPA for distribution |
| **Postman** | Test API / edge functions |

## 📦 Key Libraries

```json
{
  "expo": "~51.0",
  "react-native": "0.74",
  "expo-router": "^3.0",
  "nativewind": "^4.0",
  "@supabase/supabase-js": "^2.0",
  "zustand": "^4.0",
  "expo-notifications": "^0.28",
  "@react-native-async-storage/async-storage": "^1.23",
  "expo-linking": "^6.0",
  "react-native-reanimated": "^3.0"
}
```

## 🗄 Database Schema

```
auth.users          → Supabase built-in
problems            → imported DSA problems
revisions           → spaced repetition schedule
memory_strength     → per-topic scores
problem_queue       → recommended problems
```

## 🏗 Architecture Overview

```
Mobile App (Expo)
    │
    ├── Supabase Auth (login/signup)
    ├── Supabase DB  (CRUD operations)
    └── Supabase Edge Functions
              │
              └── Claude API (AI classification)
```

## 💰 Cost Summary

| Tool | Free Tier |
|---|---|
| Expo / EAS | Free (limited builds/month) |
| Supabase | 500MB DB, 50K MAU |
| Claude API | Pay-per-use (~$0.003/call) |
| GitHub | Free |
| Cursor | Free trial |

**Total infrastructure cost = ~$0 for MVP** ✅

---

# AI Model Selection

## 🏆 Best Model for MVP: Llama 3.3 70B on Groq

| Factor | Detail |
|---|---|
| **Cost** | Free tier |
| **Speed** | ~750 tokens/sec (sub-1 sec response) |
| **Classification accuracy** | Strong structured JSON output |
| **Code awareness** | Understands DSA concepts well |
| **API format** | OpenAI-compatible (easy swap) |
| **Rate limit** | 6000 req/day free |

## Per Task Assignment

| AI Responsibility | Model | Provider |
|---|---|---|
| Problem Classification | Llama 3.3 70B | Groq (free) |
| Difficulty Estimation | Llama 3.3 70B | Groq (free) |
| Problem Recommendation | Llama 3.3 70B | Groq (free) |
| Memory Strength Update | Llama 3.3 8B | Groq (free) |

## Why Not the Others?

| Model | Issue for MVP |
|---|---|
| Qwen3-Coder 480B | Needs multiple GPUs, not free API |
| DeepSeek V4 | Pay-per-use, no meaningful free tier |
| Gemma 2 27B | Weaker on DSA-specific pattern recognition |
| Phi-4 | Better for math, not classification + recommendation combo |
| Claude API | Paid — save for production upgrade |

## Sample API Call

```js
const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${GROQ_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "llama-3.3-70b-versatile",
    messages: [{
      role: "user",
      content: `Classify this DSA problem: ${problemName}.
                Return JSON only: {topic, subtopic, pattern, difficulty}`
    }]
  })
});
```

## Upgrade Path

> Start with **Groq free** → upgrade to **Claude Sonnet** only when scale exceeds Groq's free limits.
