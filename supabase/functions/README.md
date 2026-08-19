# Memory Stack secure backend configuration

Deploy the database migration first, then deploy every function in this directory. Store every value below as a Supabase Edge Function secret; never place provider or judge secrets in the mobile app `.env` file.

## Recommended production configuration

```text
AI_PROVIDER=kimi
AI_BASE_URL=<Kimi OpenAI-compatible API base URL>
AI_API_KEY=<Kimi server API key>
AI_MODEL_GENERATOR=<Kimi coding model>
AI_MODEL_CLASSIFIER=<Kimi fast/cheap model>

# Optional fallback deployment profile
# AI_PROVIDER=deepseek
# AI_BASE_URL=<DeepSeek OpenAI-compatible API base URL>
# AI_API_KEY=<DeepSeek server API key>

JUDGE_PROVIDER=judge0
JUDGE_BASE_URL=<your managed or self-hosted Judge0 CE URL>
JUDGE_API_KEY=<Judge0 access token, if required>
JUDGE_LANG_PYTHON_ID=<Judge0 Python 3 language id>
JUDGE_LANG_CPP_ID=<Judge0 C++17 language id>
JUDGE_LANG_JAVA_ID=<Judge0 Java 17 language id>
MAX_SOURCE_CODE_CHARS=50000
MAX_COMPILER_OUTPUT_CHARS=4000
CATALOG_SYNC_SECRET=<random long secret>
APP_TIME_ZONE=Asia/Kolkata
```

The app cannot complete AI generation or remote compilation until this backend is configured. This is intentional: code and keys never run on the phone, hidden tests are never sent to the app, and accepted revisions are completed through a protected database RPC.
