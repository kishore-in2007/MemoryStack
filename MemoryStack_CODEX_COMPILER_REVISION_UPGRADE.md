# Memory Stack v2 — Codex Implementation Guide
## Platform Search Dropdown + AI Practice Problem + Secure Compiler + Previous-Solution Revision Page

> **Purpose:** Extend the existing Memory Stack Expo/React Native + Supabase application. Do not rebuild the app from zero. Preserve the existing authentication, spaced-repetition schedule, navigation style, dark theme, memory-strength engine, and Play Store configuration unless a change is explicitly required below.
>
> **Primary goal:** When a revision reminder is opened, the learner first reviews the original problem and their previously saved solution, then solves a newly generated related problem inside a lightweight compiler. The revision is marked complete only after deterministic hidden tests pass.
>
> **Development priorities:** simple to maintain, low APK size, low device storage usage, secure API keys, minimal dependencies, reliable judging, and clear mobile UX.

---

# 1. Exact Understanding of the Required Upgrade

The required implementation contains three connected features.

## Feature A — Platform-aware problem search dropdown

While adding a solved problem:

1. The user selects a platform: LeetCode, Codeforces, or CodeChef.
2. The user starts typing a problem name.
3. A debounced dropdown displays matching problems only from the selected platform.
4. Each result displays:
   - problem title,
   - difficulty,
   - one or two topic tags,
   - platform name,
   - external problem link.
5. Selecting a result fills the add-problem form.
6. Manual entry must remain available when no result is found.

The mobile application must not download or store the complete platform problem list. It requests only the top matching results from the backend.

## Feature B — AI-generated related problem with in-app compiler

During a due revision:

1. The system uses the original problem, topic, pattern, difficulty, previous performance, and revision number to generate one related coding problem.
2. The AI provider must be configurable and support either a DeepSeek coding model or a Qwen coding model.
3. The generated problem includes a statement, constraints, examples, starter code, and hidden deterministic test cases.
4. The user writes code in a lightweight in-app editor.
5. `Run` executes only visible/sample tests.
6. `Submit` executes hidden tests through a remote sandboxed code-execution service.
7. The revision is marked completed only when all required hidden tests pass.
8. AI must never be the final correctness judge. Correctness is based on compiler/runtime output and deterministic test results.

## Feature C — Previous-solution review page before the compiler

When the reminder is opened:

1. Show the original saved problem.
2. Show the solution from the most recent successful attempt/revision cycle.
3. Show the saved explanation, language, time complexity, space complexity, score, attempts, and date when available.
4. Allow the user to open the original platform link.
5. Require the user to tap `Reviewed — Continue` before opening the generated practice problem.
6. After successful compiler verification, save the new successful solution as the latest revision snapshot.

---

# 2. Analysis of the Existing Project

The existing project already provides:

- Expo + React Native + TypeScript.
- Expo Router navigation.
- Supabase authentication and PostgreSQL storage.
- Problems, revisions, memory strength, and problem queue tables.
- A 10-cycle spaced repetition schedule.
- Groq-based AI classification and recommendation.
- Push notifications.
- A revision page that currently recommends an external problem.
- A result page that currently asks the user to self-report whether the answer was correct.

## Existing gaps that this upgrade must fix

1. **No platform autocomplete:** the add screen accepts free text only.
2. **No saved code snapshot:** the current schema cannot display the learner's previous solution.
3. **No real compiler:** revision currently opens an external URL.
4. **Self-reported correctness:** the result page lets the user select Yes/No, which is not reliable.
5. **AI secrets are exposed:** `EXPO_PUBLIC_GROQ_API_KEY` is bundled into the client and must be removed.
6. **AI recommendation may hallucinate:** a generated title or URL is not guaranteed to exist.
7. **No hidden-test protection:** judge data must never be readable by the client.
8. **RLS policies need `WITH CHECK`:** insert and update ownership must be enforced.
9. **UTC date handling can produce the wrong local day:** all revision date logic should use an explicit app timezone or date-only helpers.
10. **Generated content is not idempotent:** reopening a revision should show the same generated problem rather than generating a different one every time.

---

# 3. Non-negotiable Codex Instructions

Codex must follow these rules during implementation:

1. Modify the existing project incrementally. Do not replace working authentication, navigation, scheduling, or memory-strength code without a migration reason.
2. Never place AI-provider keys, judge-service keys, service-role keys, or platform-sync credentials in `EXPO_PUBLIC_*` variables.
3. All AI and code-execution calls must go through authenticated Supabase Edge Functions.
4. Never execute untrusted user code inside the mobile app, Supabase database, or a general-purpose Edge Function runtime.
5. Use Judge0 CE or Piston as a separate sandboxed execution service. Judge0 is the preferred production option in this guide.
6. Do not bundle Python, Java, GCC, Node, Monaco Editor, or a WebView IDE into the APK.
7. Use deterministic tests for correctness. AI may generate and explain, but cannot decide pass/fail.
8. Hidden tests and reference solutions must be stored in a service-only table that has no client SELECT policy.
9. Every Edge Function must verify the signed-in user and validate ownership of `revision_id`, `problem_id`, and `submission_id`.
10. Use runtime validation for all AI JSON responses. Reject invalid or unsafe output and retry once with a repair prompt.
11. Do not regenerate a practice problem when one already exists for the same revision.
12. Do not mark a revision completed from the client. Completion must happen server-side in a database transaction/RPC after the judge confirms success.
13. Limit response payloads and compiler logs to prevent high storage usage.
14. Keep only the latest drafts locally. Do not cache hidden tests, reference solutions, or full platform catalogs.
15. Retain manual problem entry as a fallback.
16. Add loading, empty, retry, timeout, and offline states to all new screens.
17. Write migrations that preserve existing user data.
18. Add tests before deleting the current self-report revision flow.

---

# 4. Recommended Lightweight Technology Stack

## Existing client stack — retain

- Expo / React Native
- TypeScript with strict mode
- Expo Router
- Supabase JS client
- Zustand only for small session/UI state
- AsyncStorage only for drafts and small same-day caches
- Expo Notifications
- Existing dark theme

## Backend — extend existing Supabase project

- Supabase Auth
- PostgreSQL
- Row Level Security
- PostgreSQL RPC for atomic revision completion
- Supabase Edge Functions using TypeScript/Deno
- Supabase Cron or an external scheduled job only for catalog synchronization

## AI provider abstraction

Create one backend interface that supports:

- `AI_PROVIDER=deepseek`
- `AI_PROVIDER=qwen`

Do not hardcode a model name in the app source. Use:

- `AI_MODEL_CLASSIFIER`
- `AI_MODEL_GENERATOR`
- `AI_MODEL_EXPLAINER`

The provider adapter must use an OpenAI-compatible request shape whenever supported. The requested DeepSeek V2/Coder-V2 or Qwen2-family endpoint may be configured in development, but the exact deployed model must remain environment-controlled so the project is not broken when providers rename or retire models.

## Compiler/judge

Preferred:

- Judge0 CE, self-hosted or managed.

Alternative:

- Piston, behind the same internal `JudgeProvider` interface.

Supported MVP languages:

- Python 3
- C++17
- Java 17

Optional after MVP:

- JavaScript/Node

Do not start with more than three languages. Each additional language increases test-harness complexity and maintenance.

## Lightweight code editor

Use a controlled multiline React Native `TextInput`:

- monospace font,
- auto-capitalization disabled,
- auto-correct disabled,
- horizontal scrolling,
- tab inserts spaces,
- optional simple line-number gutter.

Do not install Monaco, Ace, CodeMirror, or a WebView editor for the first production release.

---

# 5. Final User Flow

```text
Notification / Today's Queue
        |
        v
Revision Review Page
- original problem metadata
- original link
- most recent successful code
- explanation and complexities
- previous score and date
        |
        | tap “Reviewed — Continue”
        v
Practice Problem Page
- stable AI-generated related problem
- constraints and examples
- language selector
        |
        | tap “Start Coding”
        v
Compiler Page
- lightweight code editor
- Run Sample Tests
- Submit Hidden Tests
        |
        +--> failed: show safe diagnostic, remain pending
        |
        +--> all passed
                |
                v
Server-side Completion Transaction
- save successful solution snapshot
- mark revision completed
- calculate score
- update memory strength
- activate/schedule next revision
                |
                v
Verified Revision Result Page
```

## Required route sequence

```text
/revision/[id]/review
/revision/[id]/practice
/revision/[id]/compiler
/revision/[id]/result
```

The existing `/revision/[id].tsx` can be converted into the review page or replaced with a nested route folder.

---

# 6. Updated Project Structure

```text
MemoryStack/
├── app/
│   ├── (auth)/
│   ├── (tabs)/
│   │   ├── index.tsx
│   │   ├── add.tsx
│   │   ├── queue.tsx
│   │   ├── profile.tsx
│   │   └── stats.tsx
│   ├── revision/
│   │   └── [id]/
│   │       ├── _layout.tsx
│   │       ├── review.tsx
│   │       ├── practice.tsx
│   │       ├── compiler.tsx
│   │       └── result.tsx
│   └── _layout.tsx
├── components/
│   ├── problem-search/
│   │   ├── ProblemAutocomplete.tsx
│   │   ├── ProblemSuggestionRow.tsx
│   │   └── PlatformSelector.tsx
│   ├── revision/
│   │   ├── PreviousSolutionCard.tsx
│   │   ├── PracticeProblemCard.tsx
│   │   ├── RevisionProgressHeader.tsx
│   │   └── TestResultList.tsx
│   ├── compiler/
│   │   ├── LightweightCodeEditor.tsx
│   │   ├── LanguageSelector.tsx
│   │   ├── CompilerToolbar.tsx
│   │   └── SubmissionStatusCard.tsx
│   └── common/
│       ├── EmptyState.tsx
│       ├── ErrorState.tsx
│       └── LoadingState.tsx
├── hooks/
│   ├── useDebouncedValue.ts
│   ├── useProblemSearch.ts
│   ├── useRevisionContext.ts
│   ├── usePracticeProblem.ts
│   └── useCodeDraft.ts
├── lib/
│   ├── supabase.ts
│   ├── edgeFunctions.ts
│   ├── dateOnly.ts
│   ├── revisionScore.ts
│   └── validation.ts
├── services/
│   ├── problemSearchService.ts
│   ├── revisionService.ts
│   ├── compilerService.ts
│   └── draftService.ts
├── store/
│   └── useStore.ts
├── types/
│   ├── database.ts
│   ├── problem.ts
│   ├── revision.ts
│   └── compiler.ts
├── supabase/
│   ├── migrations/
│   │   └── 20260803_compiler_revision_upgrade.sql
│   └── functions/
│       ├── _shared/
│       │   ├── auth.ts
│       │   ├── cors.ts
│       │   ├── errors.ts
│       │   ├── aiProvider.ts
│       │   ├── judgeProvider.ts
│       │   ├── schemas.ts
│       │   └── rateLimit.ts
│       ├── search-problems/index.ts
│       ├── add-solved-problem/index.ts
│       ├── get-revision-context/index.ts
│       ├── mark-revision-reviewed/index.ts
│       ├── generate-practice-problem/index.ts
│       ├── run-code/index.ts
│       ├── submit-solution/index.ts
│       └── sync-problem-catalog/index.ts
└── .env.example
```

---

# 7. Database Migration

Create:

```text
supabase/migrations/20260803_compiler_revision_upgrade.sql
```

Use the following migration as the implementation baseline.

```sql
begin;

create extension if not exists pg_trgm;
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- 1. Shared enums/check values are represented as text to
--    avoid difficult enum migrations in early development.
-- ---------------------------------------------------------

-- ---------------------------------------------------------
-- 2. Platform problem metadata catalog
--    Store metadata only. Do not copy copyrighted editorials
--    or complete third-party problem statements.
-- ---------------------------------------------------------
create table if not exists public.problem_catalog (
  id uuid primary key default uuid_generate_v4(),
  platform text not null check (platform in ('LeetCode', 'Codeforces', 'CodeChef')),
  external_id text,
  slug text not null,
  title text not null,
  normalized_title text generated always as (lower(title)) stored,
  difficulty text check (difficulty in ('Easy', 'Medium', 'Hard', 'Unknown')),
  topics text[] not null default '{}',
  url text not null,
  source_version text,
  is_active boolean not null default true,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(platform, slug)
);

create index if not exists idx_problem_catalog_platform_active
  on public.problem_catalog(platform, is_active);

create index if not exists idx_problem_catalog_title_trgm
  on public.problem_catalog using gin (normalized_title gin_trgm_ops);

create index if not exists idx_problem_catalog_topics
  on public.problem_catalog using gin (topics);

alter table public.problem_catalog enable row level security;

-- Deliberately add no authenticated client policy.
-- Search is performed through the authenticated search-problems Edge Function,
-- which uses a service-role client only after verifying the caller.
-- Catalog writes occur through the service-role sync function only.
drop policy if exists "authenticated_read_problem_catalog" on public.problem_catalog;

-- ---------------------------------------------------------
-- 3. Extend original problems table
-- ---------------------------------------------------------
alter table public.problems
  add column if not exists catalog_problem_id uuid references public.problem_catalog(id),
  add column if not exists source_type text not null default 'manual'
    check (source_type in ('catalog', 'manual', 'ai_generated')),
  add column if not exists user_notes text,
  add column if not exists preferred_language text
    check (preferred_language in ('python', 'cpp', 'java', 'javascript')),
  add column if not exists initial_solution_snapshot_id uuid,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_problems_catalog_problem
  on public.problems(catalog_problem_id);

-- ---------------------------------------------------------
-- 4. Solution snapshots
--    Every successful saved solution/revision has a snapshot.
-- ---------------------------------------------------------
create table if not exists public.solution_snapshots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete cascade,
  revision_id uuid references public.revisions(id) on delete set null,
  practice_problem_id uuid,
  submission_id uuid,
  snapshot_type text not null default 'original'
    check (snapshot_type in ('original', 'revision_success', 'manual_update')),
  language text not null check (language in ('python', 'cpp', 'java', 'javascript')),
  source_code text not null,
  explanation text,
  time_complexity text,
  space_complexity text,
  score int check (score between 0 and 100),
  attempts int not null default 1 check (attempts > 0),
  is_successful boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_solution_snapshots_problem_date
  on public.solution_snapshots(user_id, problem_id, created_at desc);

create index if not exists idx_solution_snapshots_revision
  on public.solution_snapshots(revision_id);

alter table public.solution_snapshots enable row level security;

drop policy if exists "own_solution_snapshots_select" on public.solution_snapshots;
create policy "own_solution_snapshots_select"
on public.solution_snapshots for select
to authenticated
using (auth.uid() = user_id);

-- Deliberately add no direct client INSERT/UPDATE/DELETE policy.
-- Original and successful snapshots are created by authenticated backend
-- functions/RPCs after validating ownership of the related problem/revision.
drop policy if exists "own_solution_snapshots_insert" on public.solution_snapshots;

-- ---------------------------------------------------------
-- 5. Public part of generated practice problems
-- ---------------------------------------------------------
create table if not exists public.practice_problems (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_problem_id uuid not null references public.problems(id) on delete cascade,
  revision_id uuid not null references public.revisions(id) on delete cascade,
  title text not null,
  statement text not null,
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  topic text not null,
  subtopic text,
  pattern text,
  input_format text,
  output_format text,
  constraints jsonb not null default '[]'::jsonb,
  examples jsonb not null default '[]'::jsonb,
  starter_code jsonb not null default '{}'::jsonb,
  allowed_languages text[] not null default array['python','cpp','java'],
  ai_provider text not null,
  ai_model text not null,
  prompt_version text not null default 'practice-v1',
  generation_status text not null default 'ready'
    check (generation_status in ('generating', 'ready', 'failed')),
  created_at timestamptz not null default now(),
  unique(revision_id)
);

create index if not exists idx_practice_problems_user_revision
  on public.practice_problems(user_id, revision_id);

alter table public.practice_problems enable row level security;

drop policy if exists "own_practice_problems_select" on public.practice_problems;
create policy "own_practice_problems_select"
on public.practice_problems for select
to authenticated
using (auth.uid() = user_id);

-- No client INSERT/UPDATE/DELETE policy. Generation occurs in Edge Function.

-- ---------------------------------------------------------
-- 6. Private judge data
--    NO authenticated client policies are intentionally added.
-- ---------------------------------------------------------
create table if not exists public.practice_problem_judge_data (
  practice_problem_id uuid primary key references public.practice_problems(id) on delete cascade,
  reference_solutions jsonb not null,
  visible_tests jsonb not null default '[]'::jsonb,
  hidden_tests jsonb not null,
  checker_type text not null default 'exact'
    check (checker_type in ('exact', 'trimmed', 'token', 'float_tolerance')),
  float_tolerance double precision,
  time_limit_ms int not null default 2500 check (time_limit_ms between 250 and 10000),
  memory_limit_kb int not null default 262144 check (memory_limit_kb between 32768 and 524288),
  schema_version text not null default 'judge-v1',
  created_at timestamptz not null default now()
);

alter table public.practice_problem_judge_data enable row level security;
-- Deliberately no policies for authenticated/anon users.

-- ---------------------------------------------------------
-- 7. Code submissions
-- ---------------------------------------------------------
create table if not exists public.code_submissions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  revision_id uuid not null references public.revisions(id) on delete cascade,
  practice_problem_id uuid not null references public.practice_problems(id) on delete cascade,
  language text not null check (language in ('python', 'cpp', 'java', 'javascript')),
  source_code text not null,
  mode text not null check (mode in ('run', 'submit')),
  status text not null default 'queued'
    check (status in (
      'queued', 'processing', 'accepted', 'wrong_answer',
      'compile_error', 'runtime_error', 'time_limit',
      'memory_limit', 'internal_error'
    )),
  judge_provider text not null,
  judge_token text,
  tests_total int not null default 0,
  tests_passed int not null default 0,
  runtime_ms int,
  memory_kb int,
  compiler_output text,
  failure_summary text,
  score int check (score between 0 and 100),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_submissions_revision_created
  on public.code_submissions(user_id, revision_id, created_at desc);

alter table public.code_submissions enable row level security;

drop policy if exists "own_code_submissions_select" on public.code_submissions;
create policy "own_code_submissions_select"
on public.code_submissions for select
to authenticated
using (auth.uid() = user_id);

-- Do not permit direct client insert/update. Edge Functions own this process.

-- ---------------------------------------------------------
-- 8. Extend revisions table
-- ---------------------------------------------------------
alter table public.revisions
  add column if not exists reviewed_at timestamptz,
  add column if not exists started_at timestamptz,
  add column if not exists verified_at timestamptz,
  add column if not exists practice_problem_id uuid references public.practice_problems(id),
  add column if not exists previous_solution_snapshot_id uuid references public.solution_snapshots(id),
  add column if not exists last_submission_id uuid references public.code_submissions(id),
  add column if not exists verification_status text not null default 'not_started'
    check (verification_status in ('not_started', 'reviewed', 'in_progress', 'passed', 'failed'));

-- Replace old status constraint safely.
alter table public.revisions drop constraint if exists revisions_status_check;
alter table public.revisions add constraint revisions_status_check
  check (status in ('pending', 'in_progress', 'completed', 'overdue'));

-- Add ownership checks for existing tables.
drop policy if exists "own_problems" on public.problems;
create policy "own_problems_select"
on public.problems for select to authenticated
using (auth.uid() = user_id);
create policy "own_problems_insert"
on public.problems for insert to authenticated
with check (auth.uid() = user_id);
create policy "own_problems_update"
on public.problems for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
create policy "own_problems_delete"
on public.problems for delete to authenticated
using (auth.uid() = user_id);

-- Keep equivalent complete policies for revisions, memory_strength,
-- and problem_queue. Do not use only FOR ALL USING without WITH CHECK.

-- ---------------------------------------------------------
-- 9. Add delayed foreign keys after all dependent tables exist
-- ---------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'problems_initial_solution_snapshot_fk'
  ) then
    alter table public.problems
      add constraint problems_initial_solution_snapshot_fk
      foreign key (initial_solution_snapshot_id)
      references public.solution_snapshots(id)
      on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'solution_snapshots_practice_problem_fk'
  ) then
    alter table public.solution_snapshots
      add constraint solution_snapshots_practice_problem_fk
      foreign key (practice_problem_id)
      references public.practice_problems(id)
      on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'solution_snapshots_submission_fk'
  ) then
    alter table public.solution_snapshots
      add constraint solution_snapshots_submission_fk
      foreign key (submission_id)
      references public.code_submissions(id)
      on delete set null;
  end if;
end $$;

-- ---------------------------------------------------------
-- 10. Atomic memory-strength helper
-- ---------------------------------------------------------
create or replace function public.update_memory_strength_atomic(
  p_user_id uuid,
  p_topic text,
  p_score int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.memory_strength%rowtype;
  v_new_count int;
  v_new_avg double precision;
  v_success_count double precision;
  v_new_success_rate double precision;
  v_new_strength double precision;
  v_local_date date := (now() at time zone 'Asia/Kolkata')::date;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Not authorized';
  end if;

  select * into v_existing
  from public.memory_strength
  where user_id = p_user_id and topic = p_topic
  for update;

  if not found then
    insert into public.memory_strength (
      user_id,
      topic,
      strength_score,
      revision_count,
      success_rate,
      avg_score,
      last_revision_date,
      updated_at
    ) values (
      p_user_id,
      p_topic,
      greatest(0, least(100, p_score)),
      1,
      case when p_score >= 60 then 100 else 0 end,
      greatest(0, least(100, p_score)),
      v_local_date,
      now()
    );
    return;
  end if;

  v_new_count := v_existing.revision_count + 1;
  v_new_avg := (
    (coalesce(v_existing.avg_score, 0) * v_existing.revision_count)
    + greatest(0, least(100, p_score))
  ) / v_new_count;

  v_success_count :=
    (coalesce(v_existing.success_rate, 0) / 100.0 * v_existing.revision_count)
    + case when p_score >= 60 then 1 else 0 end;

  v_new_success_rate := (v_success_count / v_new_count) * 100.0;
  v_new_strength :=
    (coalesce(v_existing.strength_score, 0) * 0.60)
    + (greatest(0, least(100, p_score)) * 0.40);

  update public.memory_strength
  set strength_score = least(100, greatest(0, v_new_strength)),
      revision_count = v_new_count,
      success_rate = least(100, greatest(0, v_new_success_rate)),
      avg_score = least(100, greatest(0, v_new_avg)),
      last_revision_date = v_local_date,
      updated_at = now()
  where id = v_existing.id;
end;
$$;

revoke all on function public.update_memory_strength_atomic(uuid, text, int) from public;
-- Do not grant this helper to authenticated users. It is invoked only from
-- the security-definer completion transaction owned by the database role.

-- ---------------------------------------------------------
-- 11. Atomic successful-revision completion RPC
-- ---------------------------------------------------------
create or replace function public.complete_verified_revision(
  p_revision_id uuid,
  p_submission_id uuid,
  p_score int,
  p_explanation text default null,
  p_time_complexity text default null,
  p_space_complexity text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_revision public.revisions%rowtype;
  v_submission public.code_submissions%rowtype;
  v_problem public.problems%rowtype;
  v_snapshot_id uuid;
  v_attempt_count int;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_revision
  from public.revisions
  where id = p_revision_id and user_id = v_uid
  for update;

  if not found then
    raise exception 'Revision not found';
  end if;

  if v_revision.status = 'completed' then
    return jsonb_build_object(
      'revision_id', v_revision.id,
      'already_completed', true,
      'score', v_revision.score
    );
  end if;

  select * into v_submission
  from public.code_submissions
  where id = p_submission_id
    and user_id = v_uid
    and revision_id = p_revision_id
    and status = 'accepted'
    and mode = 'submit';

  if not found then
    raise exception 'Accepted submission not found';
  end if;

  select * into v_problem
  from public.problems
  where id = v_revision.problem_id and user_id = v_uid;

  select count(*) into v_attempt_count
  from public.code_submissions
  where revision_id = p_revision_id and user_id = v_uid and mode = 'submit';

  insert into public.solution_snapshots (
    user_id,
    problem_id,
    revision_id,
    practice_problem_id,
    submission_id,
    snapshot_type,
    language,
    source_code,
    explanation,
    time_complexity,
    space_complexity,
    score,
    attempts,
    is_successful
  ) values (
    v_uid,
    v_revision.problem_id,
    p_revision_id,
    v_submission.practice_problem_id,
    v_submission.id,
    'revision_success',
    v_submission.language,
    v_submission.source_code,
    p_explanation,
    p_time_complexity,
    p_space_complexity,
    greatest(0, least(100, p_score)),
    greatest(1, v_attempt_count),
    true
  ) returning id into v_snapshot_id;

  update public.revisions
  set status = 'completed',
      verification_status = 'passed',
      score = greatest(0, least(100, p_score)),
      attempts = greatest(1, v_attempt_count),
      completed_date = (now() at time zone 'Asia/Kolkata')::date,
      verified_at = now(),
      last_submission_id = v_submission.id,
      time_complexity = p_time_complexity,
      space_complexity = p_space_complexity
  where id = p_revision_id;

  -- Existing memory-strength logic should be moved into this transaction
  -- or called by a safe helper function here. Avoid a client-side second step.
  perform public.update_memory_strength_atomic(
    v_uid,
    coalesce(v_problem.topic, 'Uncategorized'),
    greatest(0, least(100, p_score))
  );

  return jsonb_build_object(
    'revision_id', p_revision_id,
    'submission_id', p_submission_id,
    'snapshot_id', v_snapshot_id,
    'score', greatest(0, least(100, p_score)),
    'already_completed', false
  );
end;
$$;

revoke all on function public.complete_verified_revision(uuid, uuid, int, text, text, text) from public;
grant execute on function public.complete_verified_revision(uuid, uuid, int, text, text, text) to authenticated;

commit;
```

## Memory-strength migration note

The migration above already defines `update_memory_strength_atomic` and calls it inside the successful-revision transaction. Codex must remove the old client-side second-step update from the new compiler flow, while retaining it temporarily only for the legacy flow until migration testing is complete.

---

# 8. TypeScript Domain Types

Create `types/problem.ts`:

```typescript
export type Platform = 'LeetCode' | 'Codeforces' | 'CodeChef';
export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Unknown';
export type SupportedLanguage = 'python' | 'cpp' | 'java' | 'javascript';

export interface ProblemCatalogItem {
  id: string;
  platform: Platform;
  externalId?: string | null;
  slug: string;
  title: string;
  difficulty: Difficulty;
  topics: string[];
  url: string;
}

export interface ProblemSearchResponse {
  items: ProblemCatalogItem[];
  query: string;
  platform: Platform;
  hasMore: boolean;
}
```

Create `types/revision.ts`:

```typescript
import type { SupportedLanguage } from './problem';

export interface PreviousSolutionSnapshot {
  id: string;
  language: SupportedLanguage;
  sourceCode: string;
  explanation?: string | null;
  timeComplexity?: string | null;
  spaceComplexity?: string | null;
  score?: number | null;
  attempts: number;
  createdAt: string;
}

export interface RevisionContext {
  revision: {
    id: string;
    revisionNumber: number;
    dueDate: string;
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
    verificationStatus: 'not_started' | 'reviewed' | 'in_progress' | 'passed' | 'failed';
    reviewedAt?: string | null;
  };
  originalProblem: {
    id: string;
    name: string;
    platform: string;
    difficulty?: string | null;
    topic?: string | null;
    subtopic?: string | null;
    pattern?: string | null;
    url?: string | null;
    userNotes?: string | null;
  };
  previousSolution?: PreviousSolutionSnapshot | null;
  practiceProblemId?: string | null;
}

export interface PracticeProblem {
  id: string;
  revisionId: string;
  title: string;
  statement: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  subtopic?: string | null;
  pattern?: string | null;
  inputFormat?: string | null;
  outputFormat?: string | null;
  constraints: string[];
  examples: Array<{ input: string; output: string; explanation?: string }>;
  starterCode: Partial<Record<SupportedLanguage, string>>;
  allowedLanguages: SupportedLanguage[];
}
```

Create `types/compiler.ts`:

```typescript
import type { SupportedLanguage } from './problem';

export type SubmissionStatus =
  | 'queued'
  | 'processing'
  | 'accepted'
  | 'wrong_answer'
  | 'compile_error'
  | 'runtime_error'
  | 'time_limit'
  | 'memory_limit'
  | 'internal_error';

export interface RunCodeRequest {
  revisionId: string;
  practiceProblemId: string;
  language: SupportedLanguage;
  sourceCode: string;
}

export interface TestResult {
  index: number;
  passed: boolean;
  input?: string;
  expected?: string;
  actual?: string;
  runtimeMs?: number;
}

export interface SubmissionResponse {
  submissionId: string;
  status: SubmissionStatus;
  testsPassed: number;
  testsTotal: number;
  runtimeMs?: number;
  memoryKb?: number;
  compilerOutput?: string;
  failureSummary?: string;
  visibleResults?: TestResult[];
  score?: number;
}
```

---

# 9. Feature A — Platform Search Dropdown

## 9.1 Data strategy

Do not search third-party platforms directly from every keystroke.

Use this architecture:

```text
Platform source / approved metadata export
        |
        v
Scheduled backend sync
        |
        v
Supabase problem_catalog metadata table
        |
        v
Authenticated search-problems Edge Function
        |
        v
Top 10 dropdown results in the app
```

### Platform source rules

- **Codeforces:** use its documented problem-set API from the backend sync job.
- **LeetCode and CodeChef:** do not depend on an undocumented client-side API. Use an approved metadata import, an admin-maintained catalog, or another source that the project is permitted to use.
- Store only metadata required for search and deep-linking.
- Do not store platform editorials, premium content, or copied complete statements.
- The user can manually add a problem when catalog metadata is unavailable.

## 9.2 Search endpoint contract

`POST /functions/v1/search-problems`

Request:

```json
{
  "platform": "LeetCode",
  "query": "house rob",
  "limit": 10
}
```

Response:

```json
{
  "items": [
    {
      "id": "uuid",
      "platform": "LeetCode",
      "externalId": "198",
      "slug": "house-robber",
      "title": "House Robber",
      "difficulty": "Medium",
      "topics": ["Dynamic Programming", "Array"],
      "url": "platform-url"
    }
  ],
  "query": "house rob",
  "platform": "LeetCode",
  "hasMore": false
}
```

## 9.3 Edge Function behavior

Create `supabase/functions/search-problems/index.ts`.

Requirements:

1. Verify the user's JWT.
2. Validate platform against the fixed allowlist.
3. Trim query and require at least two characters.
4. Limit results to a maximum of 10.
5. Search only active rows from the selected platform.
6. Rank exact prefix matches before fuzzy matches.
7. Return metadata only.
8. Add a short cache header where safe.
9. Enforce a reasonable per-user rate limit.

SQL ranking baseline:

```sql
select
  id,
  platform,
  external_id,
  slug,
  title,
  difficulty,
  topics,
  url,
  case
    when normalized_title = lower($2) then 1.0
    when normalized_title like lower($2) || '%' then 0.9
    else similarity(normalized_title, lower($2))
  end as rank
from public.problem_catalog
where platform = $1
  and is_active = true
  and (
    normalized_title like '%' || lower($2) || '%'
    or similarity(normalized_title, lower($2)) > 0.18
  )
order by rank desc, title asc
limit $3;
```

## 9.4 Client debounce hook

Create `hooks/useDebouncedValue.ts`:

```typescript
import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
```

## 9.5 `ProblemAutocomplete` behavior

The component must:

- accept the selected platform,
- clear the selected catalog item when platform changes,
- begin search at two characters,
- debounce for 300 ms,
- cancel/ignore stale requests,
- display at most 10 rows,
- hide the dropdown after selection,
- display `No matching problem — continue manually`,
- provide a clear-selection control,
- use a `FlatList`, not a `ScrollView` inside another long list,
- never save all results to AsyncStorage.

Recommended props:

```typescript
interface ProblemAutocompleteProps {
  platform: Platform;
  value: string;
  selectedItem: ProblemCatalogItem | null;
  onChangeText: (text: string) => void;
  onSelect: (item: ProblemCatalogItem) => void;
  onClearSelection: () => void;
}
```

## 9.6 Updated add-problem form

After a dropdown item is selected, populate:

```text
name            <- item.title
platform        <- item.platform
url             <- item.url
difficulty      <- item.difficulty
catalog id      <- item.id
source_type     <- catalog
```

The user must also save their original solved answer:

- language,
- source code,
- short explanation/approach,
- time complexity,
- space complexity.

On submit:

1. Insert into `problems`.
2. Insert the original solution into `solution_snapshots` with `snapshot_type='original'`.
3. Update `problems.initial_solution_snapshot_id`.
4. Generate the existing spaced-repetition schedule.
5. Perform steps 1–4 through the authenticated `add-solved-problem` Edge Function and a transaction/RPC to avoid partial data.

## 9.7 Add-solved-problem endpoint

Request:

```json
{
  "catalogProblemId": "uuid-or-null",
  "name": "House Robber",
  "platform": "LeetCode",
  "difficulty": "Medium",
  "topic": "Dynamic Programming",
  "subtopic": "1D DP",
  "pattern": "Include or exclude",
  "url": "platform-url-or-null",
  "solvedDate": "2026-08-03",
  "userNotes": "Key recurrence...",
  "solution": {
    "language": "python",
    "sourceCode": "...",
    "explanation": "...",
    "timeComplexity": "O(n)",
    "spaceComplexity": "O(1)"
  }
}
```

The endpoint must ignore any client-supplied `userId`, derive the user from the JWT, validate a selected catalog row when `catalogProblemId` is present, and call a database transaction/RPC that creates the problem, original snapshot, initial revision schedule, and initial memory metadata together. On any failure, create none of them.

---

# 10. Feature C — Revision Review Page

Implement this before the AI generation/compiler screens.

## 10.1 Revision context endpoint

Create `get-revision-context` Edge Function.

Request:

```json
{ "revisionId": "uuid" }
```

The function must:

1. verify JWT,
2. query only a revision owned by the user,
3. load its original `problems` row,
4. select the most recent successful `solution_snapshots` row for that original problem created before the current revision completion,
5. return an existing `practice_problem_id` if one has already been generated,
6. never return hidden tests or reference solutions.

Previous solution query:

```sql
select *
from public.solution_snapshots
where user_id = $1
  and problem_id = $2
  and is_successful = true
order by created_at desc
limit 1;
```

## 10.2 Review page sections

`app/revision/[id]/review.tsx` must display:

1. Revision number and due state.
2. Original problem title.
3. Platform, difficulty, topic, subtopic, and pattern.
4. User notes.
5. `Open Original Problem` button when a URL exists.
6. Previous solution language.
7. Previous source code in a read-only code block.
8. Previous explanation.
9. Complexity values.
10. Previous score, attempts, and saved date.
11. Empty state when no previous solution exists.
12. Main CTA: `Reviewed — Continue`.

When the CTA is tapped, call `mark-revision-reviewed`.

Request:

```json
{ "revisionId": "uuid" }
```

The function must verify ownership and update:

```text
reviewed_at = coalesce(reviewed_at, now())
verification_status = reviewed, unless already passed
status = in_progress when current status is pending
status = overdue when current status is overdue
```

The operation must be idempotent. A completed revision must return its existing state without being changed. After success, navigate to `/revision/[id]/practice`.

## 10.3 Navigation guard

The practice/compiler pages must verify `reviewed_at` exists. A user manually opening a compiler deep link without reviewing must be redirected to the review page.

---

# 11. Feature B — AI-generated Related Practice Problem

## 11.1 Generation principles

The AI-generated problem must be:

- related to the original topic and pattern,
- similar learning objective but not a copy,
- solvable within the selected difficulty,
- deterministic,
- compatible with standard input/output judging,
- limited to supported languages,
- free from external files, network calls, databases, or interactive input,
- bounded by safe constraints,
- generated once per revision.

## 11.2 Difficulty adaptation

Suggested logic:

```text
if previous score < 50:
    generated difficulty = one level easier or same with smaller constraints
else if previous score between 50 and 79:
    generated difficulty = same
else:
    generated difficulty = same with one additional edge case
```

Do not increase beyond `Hard` or decrease below `Easy`.

## 11.3 AI provider interface

Create `supabase/functions/_shared/aiProvider.ts`:

```typescript
export interface AiJsonRequest<T> {
  systemPrompt: string;
  userPrompt: string;
  schemaName: string;
  maxTokens: number;
  temperature: number;
}

export interface AiProvider {
  generateJson<T>(request: AiJsonRequest<T>): Promise<T>;
}

export function createAiProvider(): AiProvider {
  const provider = Deno.env.get('AI_PROVIDER');

  if (provider === 'deepseek') return new DeepSeekProvider();
  if (provider === 'qwen') return new QwenProvider();

  throw new Error('Unsupported AI_PROVIDER');
}
```

Provider requirements:

- API key only in Edge Function secrets.
- Request timeout.
- JSON-only output.
- maximum token limit.
- one repair retry for invalid JSON.
- no raw provider error returned to the client.
- log request IDs, not prompts containing user code.

## 11.4 Generated problem JSON schema

The model must return exactly this shape:

```json
{
  "title": "string",
  "statement": "string",
  "difficulty": "Easy | Medium | Hard",
  "topic": "string",
  "subtopic": "string",
  "pattern": "string",
  "inputFormat": "string",
  "outputFormat": "string",
  "constraints": ["string"],
  "examples": [
    {
      "input": "string",
      "output": "string",
      "explanation": "string"
    }
  ],
  "starterCode": {
    "python": "string",
    "cpp": "string",
    "java": "string"
  },
  "referenceSolutions": {
    "python": "string",
    "cpp": "string",
    "java": "string"
  },
  "visibleTests": [
    { "stdin": "string", "expectedStdout": "string" }
  ],
  "hiddenTests": [
    { "stdin": "string", "expectedStdout": "string" }
  ],
  "checker": {
    "type": "trimmed | token | exact | float_tolerance",
    "floatTolerance": null
  },
  "timeLimitMs": 2500,
  "memoryLimitKb": 262144
}
```

## 11.5 Generation prompt

Use a versioned prompt stored in backend source.

```text
SYSTEM:
You create deterministic competitive-programming practice problems for a spaced-repetition learning app.
Return valid JSON only and exactly match the supplied schema.
Do not copy a known platform problem statement.
Do not require files, network access, databases, randomness, interactive input, or non-standard packages.
All tests must match the stated input and output formats.
Reference solutions must read standard input and write standard output.
Generate edge cases and ensure expected outputs are correct.

USER:
Create one new practice problem based on this learning context:
- Original title: {{title}}
- Platform: {{platform}}
- Topic: {{topic}}
- Subtopic: {{subtopic}}
- Pattern: {{pattern}}
- Original difficulty: {{difficulty}}
- Previous score: {{previousScore}}
- Previous attempts: {{previousAttempts}}
- Revision number: {{revisionNumber}}
- Target difficulty: {{targetDifficulty}}

Requirements:
- Test the same core concept without copying the original wording.
- Provide 2 visible tests and 8 to 15 hidden tests.
- Cover minimum, normal, duplicate, boundary, and stress-shaped cases where applicable.
- Keep generated input small enough for low-cost judging.
- Provide Python 3, C++17, and Java 17 starter and reference solutions.
- Use a trimmed or token checker unless exact whitespace is essential.
```

## 11.6 Mandatory server-side validation

Never insert AI output directly.

Validate:

- all required fields exist,
- string lengths are bounded,
- difficulty is allowed,
- 2–4 examples maximum,
- 8–15 hidden tests,
- total test input size is bounded,
- no empty expected output when output is required,
- supported languages only,
- time and memory limits are within database constraints,
- source code length is bounded,
- no suspicious shell/file/network patterns in reference code,
- no Markdown fences remain.

Recommended maximums:

```text
statement: 8,000 characters
source code per language: 20,000 characters
each stdin: 20,000 characters
each stdout: 20,000 characters
total hidden-test payload: 250 KB
```

## 11.7 Reference-solution verification

Before saving a generated problem:

1. Run at least the primary reference solution against every visible and hidden test through the judge.
2. Confirm the actual outputs match the expected outputs.
3. If validation fails:
   - retry generation once with an error-repair prompt, or
   - set generation status to `failed` and show a retry option.
4. Save public fields to `practice_problems`.
5. Save reference solutions and tests to `practice_problem_judge_data` using the service-role client.
6. Link `revisions.practice_problem_id`.

This prevents the user from being judged against AI-created incorrect expected outputs.

## 11.8 Idempotency

The `revision_id` unique constraint is mandatory.

Generation function behavior:

```text
if practice problem exists and status = ready:
    return existing public problem
if row exists and status = generating recently:
    return 202 / generation in progress
if previous generation failed:
    allow controlled retry
otherwise:
    create generating row or lock
    generate exactly once
```

---

# 12. Compiler and Judge Architecture

## 12.1 Security boundary

```text
React Native app
   |
   | authenticated request with source code
   v
Supabase Edge Function
   |
   | server credential
   v
Judge0 / Piston sandbox
```

Never expose the judge API key or direct judge endpoint to the client.

## 12.2 Judge provider interface

Create `supabase/functions/_shared/judgeProvider.ts`:

```typescript
export interface JudgeRunRequest {
  language: 'python' | 'cpp' | 'java' | 'javascript';
  sourceCode: string;
  stdin: string;
  expectedStdout?: string;
  timeLimitMs: number;
  memoryLimitKb: number;
}

export interface JudgeRunResult {
  status:
    | 'accepted'
    | 'wrong_answer'
    | 'compile_error'
    | 'runtime_error'
    | 'time_limit'
    | 'memory_limit'
    | 'internal_error';
  stdout: string;
  stderr: string;
  compileOutput: string;
  runtimeMs?: number;
  memoryKb?: number;
}

export interface JudgeProvider {
  run(request: JudgeRunRequest): Promise<JudgeRunResult>;
}
```

## 12.3 Language mapping

Do not hardcode provider language IDs throughout the project. Store one mapping in the backend:

```typescript
const LANGUAGE_CONFIG = {
  python: {
    displayName: 'Python 3',
    judgeLanguageId: Number(Deno.env.get('JUDGE_LANG_PYTHON_ID')),
    fileName: 'main.py',
  },
  cpp: {
    displayName: 'C++17',
    judgeLanguageId: Number(Deno.env.get('JUDGE_LANG_CPP_ID')),
    fileName: 'main.cpp',
  },
  java: {
    displayName: 'Java 17',
    judgeLanguageId: Number(Deno.env.get('JUDGE_LANG_JAVA_ID')),
    fileName: 'Main.java',
  },
} as const;
```

Judge language IDs vary between deployments; keep them in secrets/configuration.

## 12.4 `Run Sample Tests`

Endpoint: `run-code`

Behavior:

1. Verify JWT and ownership.
2. Validate source code size, language, revision, and practice problem.
3. Load only `visible_tests` from the private table using service role.
4. Run up to two visible tests.
5. Insert a `code_submissions` row with `mode='run'`.
6. Return visible input, expected output, actual output, and status.
7. Do not change revision completion status.
8. Rate limit repeated runs.

## 12.5 `Submit Hidden Tests`

Endpoint: `submit-solution`

Behavior:

1. Verify JWT and ownership.
2. Verify review step is completed.
3. Validate language is allowed.
4. Enforce source-code maximum length.
5. Insert a queued `code_submissions` row with `mode='submit'`.
6. Load hidden tests with service role.
7. Execute tests sequentially or in a small bounded batch.
8. Stop early on compile error, runtime error, timeout, or clear wrong answer.
9. Compare outputs using the configured checker.
10. Update the submission row.
11. If all hidden tests pass:
    - calculate score,
    - call `complete_verified_revision`,
    - return accepted result.
12. If any test fails:
    - set `verification_status='failed'`,
    - keep revision status as `in_progress` or `overdue`,
    - do not expose hidden input or expected output.

## 12.6 Output checking

Implement these checkers:

```typescript
function normalizeTrimmed(value: string): string {
  return value.replace(/\r\n/g, '\n').trim();
}

function tokenList(value: string): string[] {
  return value.trim().split(/\s+/).filter(Boolean);
}

export function compareOutput(
  actual: string,
  expected: string,
  type: 'exact' | 'trimmed' | 'token' | 'float_tolerance',
  tolerance = 1e-6,
): boolean {
  if (type === 'exact') return actual === expected;
  if (type === 'trimmed') return normalizeTrimmed(actual) === normalizeTrimmed(expected);
  if (type === 'token') {
    return JSON.stringify(tokenList(actual)) === JSON.stringify(tokenList(expected));
  }

  const a = tokenList(actual).map(Number);
  const e = tokenList(expected).map(Number);
  if (a.length !== e.length || a.some(Number.isNaN) || e.some(Number.isNaN)) return false;
  return a.every((value, index) => Math.abs(value - e[index]) <= tolerance);
}
```

## 12.7 Do not leak hidden tests

Failure response may include:

```text
Wrong answer on hidden test 4 of 10.
Review boundary cases and output formatting.
```

It must not include:

- hidden stdin,
- hidden expected output,
- reference solution,
- complete internal judge payload.

For compile/runtime errors, a sanitized compiler message may be returned with a strict length cap.

## 12.8 Scoring

Replace the self-reported Boolean score with verified metrics.

Suggested formula:

```typescript
export function calculateVerifiedRevisionScore(params: {
  accepted: boolean;
  submitAttempts: number;
  elapsedMinutes: number;
  sampleRuns: number;
}): number {
  if (!params.accepted) return 0;

  let score = 100;
  score -= Math.max(0, params.submitAttempts - 1) * 8;
  score -= Math.min(12, params.sampleRuns * 2);

  if (params.elapsedMinutes > 60) score -= 12;
  else if (params.elapsedMinutes > 40) score -= 8;
  else if (params.elapsedMinutes > 25) score -= 4;

  return Math.max(50, Math.min(100, score));
}
```

Only accepted submissions can complete a revision. A failed attempt may be stored for analytics but must not update memory strength as a successful revision.

---

# 13. Compiler Screen UX

`app/revision/[id]/compiler.tsx` must include:

1. Compact problem title and constraints summary.
2. Language selector.
3. Lightweight code editor.
4. `Reset Starter Code` action with confirmation.
5. `Run Samples` button.
6. `Submit` button.
7. Visible test result cards.
8. Compile/runtime diagnostic card.
9. Submission status indicator.
10. Autosaved local draft indicator.
11. No previous-solution code automatically inserted into the new problem editor unless the generated starter code is empty.

## Prevent accidental loss

Save a local draft using this key:

```text
compiler_draft:<userId>:<revisionId>:<language>
```

Rules:

- debounce writes by 800 ms,
- store only source code and update timestamp,
- one draft per language per active revision,
- delete drafts after successful completion,
- delete drafts older than 30 days during app startup,
- never store tests or judge data locally.

## Editor limits

```text
maximum source code: 50,000 characters
recommended warning: 20,000 characters
```

## Navigation protection

When leaving with unsaved changes, show:

```text
Your code is saved as a local draft. Leave this screen?
```

Do not block the user permanently; the draft must make leaving safe.

---

# 14. API Client Helpers

Create `lib/edgeFunctions.ts`:

```typescript
import { supabase } from './supabase';

export async function invokeEdge<TResponse>(
  functionName: string,
  body: unknown,
): Promise<TResponse> {
  const { data, error } = await supabase.functions.invoke(functionName, { body });

  if (error) {
    throw new Error(error.message || `Failed to call ${functionName}`);
  }

  return data as TResponse;
}
```

Create `services/compilerService.ts`:

```typescript
import { invokeEdge } from '../lib/edgeFunctions';
import type { RunCodeRequest, SubmissionResponse } from '../types/compiler';

export function runSampleTests(input: RunCodeRequest) {
  return invokeEdge<SubmissionResponse>('run-code', input);
}

export function submitSolution(input: RunCodeRequest) {
  return invokeEdge<SubmissionResponse>('submit-solution', input);
}
```

Create `services/revisionService.ts`:

```typescript
import { invokeEdge } from '../lib/edgeFunctions';
import type { PracticeProblem, RevisionContext } from '../types/revision';

export function getRevisionContext(revisionId: string) {
  return invokeEdge<RevisionContext>('get-revision-context', { revisionId });
}

export function markRevisionReviewed(revisionId: string) {
  return invokeEdge<{ reviewedAt: string }>('mark-revision-reviewed', { revisionId });
}

export function getOrGeneratePracticeProblem(revisionId: string) {
  return invokeEdge<PracticeProblem>('generate-practice-problem', { revisionId });
}
```

---

# 15. Authentication and RLS Requirements

Every authenticated Edge Function must:

1. Read the bearer token from the request.
2. Create a user-scoped Supabase client.
3. call `auth.getUser()` or use the supported Edge Function auth context.
4. reject unauthenticated calls with `401`.
5. use the user-scoped client for ownership checks.
6. use a separate service-role client only for:
   - hidden judge data,
   - catalog synchronization,
   - AI-generated inserts that clients cannot perform,
   - submission status updates.
7. never trust `userId` received from the client.

Example ownership query:

```typescript
const { data: revision, error } = await userClient
  .from('revisions')
  .select('id, user_id, problem_id, reviewed_at, status, verification_status')
  .eq('id', revisionId)
  .single();

if (error || !revision) {
  return jsonError(404, 'Revision not found');
}
```

RLS must remain the second security layer even when functions already check ownership.

---

# 16. Environment Variables and Secrets

## Mobile `.env`

Only public project configuration is allowed:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
EXPO_PUBLIC_APP_TIME_ZONE=Asia/Kolkata
```

Remove:

```env
EXPO_PUBLIC_GROQ_API_KEY=
EXPO_PUBLIC_DEEPSEEK_API_KEY=
EXPO_PUBLIC_QWEN_API_KEY=
EXPO_PUBLIC_JUDGE0_API_KEY=
```

## Supabase Edge Function secrets

```env
AI_PROVIDER=deepseek
AI_BASE_URL=provider-openai-compatible-url
AI_API_KEY=secret
AI_MODEL_CLASSIFIER=environment-selected-model
AI_MODEL_GENERATOR=environment-selected-coding-model
AI_MODEL_EXPLAINER=environment-selected-model

JUDGE_PROVIDER=judge0
JUDGE_BASE_URL=judge-service-url
JUDGE_API_KEY=secret-if-required
JUDGE_LANG_PYTHON_ID=deployment-specific-id
JUDGE_LANG_CPP_ID=deployment-specific-id
JUDGE_LANG_JAVA_ID=deployment-specific-id

APP_TIME_ZONE=Asia/Kolkata
MAX_SOURCE_CODE_CHARS=50000
MAX_COMPILER_OUTPUT_CHARS=4000
```

## Secret management commands

```bash
supabase secrets set AI_PROVIDER=deepseek
supabase secrets set AI_BASE_URL=...
supabase secrets set AI_API_KEY=...
supabase secrets set AI_MODEL_GENERATOR=...
supabase secrets set JUDGE_PROVIDER=judge0
supabase secrets set JUDGE_BASE_URL=...
supabase secrets set JUDGE_API_KEY=...
```

Do not commit `.env`, secret files, Play Store keys, or service-role keys.

---

# 17. Storage and APK-size Optimization

These requirements are mandatory because the app must remain handy and lightweight.

## Do

- use remote sandbox execution,
- use a basic native multiline editor,
- fetch only top 10 search results,
- cache only current drafts and a small revision summary,
- paginate history screens,
- store metadata rather than complete platform content,
- truncate logs before database insertion,
- compress large analytics payloads only if later required,
- use one AI request per revision and reuse the result,
- restrict MVP to three languages,
- use existing icons and dependencies where possible,
- lazy-load revision/compiler routes through Expo Router,
- delete old failed submission source if a retention policy is enabled.

## Do not

- bundle compilers,
- bundle an offline LLM,
- bundle a full problem dataset,
- bundle Monaco or a browser IDE,
- cache hidden tests,
- save every keystroke as a database row,
- poll judge status indefinitely,
- store unlimited stdout/stderr,
- add Redux when Zustand/current hooks are sufficient,
- add a separate Node backend unless Edge Function limitations are proven.

## Suggested retention policy

```text
successful snapshots: keep
accepted submissions: keep latest accepted per revision
failed submission source code: keep 30 days or latest 10 per revision
compiler logs: truncate to 4,000 characters
search cache: memory-only, 5 minutes
practice problems: keep while revision history exists
```

Implement retention as a later scheduled cleanup after the MVP is stable.

---

# 18. Offline Behavior

The compiler and AI generation require internet access.

When offline:

- review page can show cached original metadata and previous solution if already loaded,
- code editor remains usable,
- draft is saved locally,
- `Run` and `Submit` are disabled with a clear message,
- do not claim that code has been verified,
- revision remains pending/in progress,
- retry becomes available when network returns.

Message:

```text
Compiler verification needs an internet connection. Your code is saved on this device and can be submitted when you are online.
```

---

# 19. Error Handling

Use user-friendly error categories.

## Search

- too short query,
- no matches,
- network unavailable,
- rate limited,
- catalog temporarily unavailable.

## AI generation

- already generating,
- invalid AI output,
- reference solution failed validation,
- provider timeout,
- daily generation limit reached.

## Compiler

- compile error,
- runtime error,
- time limit exceeded,
- memory limit exceeded,
- wrong answer,
- judge unavailable,
- source too large,
- unsupported language.

Do not display raw service stack traces, API keys, SQL errors, hidden tests, or provider response bodies.

---

# 20. Rate Limits and Cost Controls

Implement server-side limits per user.

Suggested MVP limits:

```text
problem search: 60 requests / minute
practice generation: 10 / day, one stable problem per revision
sample runs: 30 / hour
hidden submissions: 15 / hour
AI explanation of failure: optional, 5 / day
```

Use database-backed counters or a small rate-limit table if no external rate-limit service is available.

The app must not call AI on every compiler failure. A deterministic compiler message is the default. An optional `Explain Error` button can call AI only after the user requests it.

---

# 21. Notifications and Deep Linking

Update notification payload:

```typescript
{
  screen: 'revision-review',
  revisionId: '<uuid>'
}
```

When tapped, navigate directly to:

```text
/revision/<revisionId>/review
```

Do not navigate directly to the compiler because the review step is mandatory.

When scheduling date-only revisions, calculate the local date using `APP_TIME_ZONE`, not `toISOString().split('T')[0]` from arbitrary local midnight values.

Create date-only helpers and cover them with timezone tests.

---

# 22. Migration of Existing Users

Existing users may have problems but no saved source code.

Required behavior:

1. Existing `problems` rows remain valid with `source_type='manual'`.
2. Existing revisions remain in their current statuses.
3. If no `solution_snapshots` row exists, the review page shows:

```text
No previous code was saved for this problem. Review the problem details and continue. You can save your new verified solution after this revision.
```

4. Do not block the revision because an old solution is missing.
5. Remove the old Yes/No self-report UI only after the compiler flow is working.
6. Existing recommended problem columns may remain temporarily for backward compatibility, but new revisions should use `practice_problem_id`.
7. Add a later cleanup migration only after production data is verified.

---

# 23. Testing Requirements

## 23.1 Unit tests

Test:

- debounce behavior,
- search-result mapping,
- output checkers,
- language mapping,
- verified score calculation,
- AI response schema validation,
- date-only timezone helpers,
- draft expiry logic,
- status mapping from judge provider.

## 23.2 Database tests

Test that:

- users cannot read another user's solution snapshots,
- users cannot read `practice_problem_judge_data`,
- users cannot directly insert accepted submissions,
- users cannot complete a revision using a failed submission,
- the completion RPC is idempotent,
- accepted revision completion creates exactly one snapshot,
- memory strength updates in the same transaction,
- catalog writes are service-only.

## 23.3 Integration tests

Scenarios:

1. Search LeetCode and select a dropdown result.
2. Change platform and confirm old selection is cleared.
3. Add manual problem when no result exists.
4. Add original code and verify snapshot creation.
5. Open a reminder and see previous solution.
6. Deep-link to compiler before review and confirm redirect.
7. Generate one practice problem and reopen it unchanged.
8. Run visible tests successfully.
9. Submit code with compile error.
10. Submit wrong answer without hidden-test leakage.
11. Submit accepted code and verify revision completion.
12. Repeat accepted request and verify no duplicate completion.
13. Lose network while coding and recover local draft.
14. Use two different users and confirm isolation.

## 23.4 Minimum end-to-end acceptance test

```text
Given a signed-in learner has added “House Robber” with a Python solution,
When its revision becomes due,
Then opening the reminder shows the saved Python solution first.
When the learner taps Reviewed — Continue,
Then the same related AI practice problem is returned on every reopen.
When the learner submits an incorrect solution,
Then the revision is not completed.
When the learner submits code that passes every hidden test,
Then the revision is completed, a new solution snapshot is stored,
and memory strength is updated exactly once.
```

---

# 24. Implementation Phases for Codex

Codex must implement in this order. Complete and test each phase before moving to the next.

## Phase 0 — Protect the current app

- create a feature branch,
- run existing lint/type checks,
- record current working routes,
- add `.env.example`,
- remove client-side AI calls only after Edge Function replacements are ready.

## Phase 1 — Database migration

- add catalog, snapshots, practice problems, private judge data, and submissions,
- extend revisions,
- add RLS,
- add atomic completion RPC,
- regenerate Supabase TypeScript types.

## Phase 2 — Secure backend foundation

- shared auth helper,
- shared JSON/error response helper,
- AI provider interface,
- judge provider interface,
- secret configuration,
- rate-limit helper.

## Phase 3 — Search dropdown

- catalog seed/sync mechanism,
- `search-problems` Edge Function,
- debounce hook,
- dropdown UI,
- manual fallback,
- save catalog selection.

## Phase 4 — Save original solutions

- add language/code/explanation/complexity fields,
- transactional add-problem flow,
- snapshot creation,
- migration empty state.

## Phase 5 — Review-first flow

- revision nested routes,
- context endpoint,
- previous solution UI,
- review timestamp,
- navigation guard.

## Phase 6 — AI practice generation

- strict JSON schema,
- provider implementation,
- generation prompt,
- reference-solution verification,
- public/private table split,
- idempotency.

## Phase 7 — Compiler

- lightweight editor,
- draft storage,
- sample-run endpoint,
- hidden-submit endpoint,
- checkers,
- status UI.

## Phase 8 — Verified completion

- score calculation,
- completion RPC,
- memory-strength transaction,
- result page,
- draft cleanup.

## Phase 9 — Notifications and compatibility

- deep link to review page,
- timezone-safe due dates,
- support users without saved old solutions,
- keep old data intact.

## Phase 10 — Hardening

- RLS tests,
- rate limits,
- log truncation,
- error sanitization,
- retry behavior,
- performance checks,
- APK size comparison.

---

# 25. Codex Master Prompt

Copy the following master instruction into Codex together with this file and the existing repository.

```text
You are implementing Memory Stack v2 in an existing Expo React Native TypeScript project backed by Supabase.

Read MemoryStack_CODEX_COMPILER_REVISION_UPGRADE.md completely before editing. Treat it as the implementation contract.

Do not rebuild the project from scratch. Preserve working authentication, Expo Router navigation, spaced-repetition scheduling, memory-strength logic, notifications, styling, and existing user data.

Implement the work phase by phase in the exact order listed in Section 24. At the start of each phase:
1. inspect the current repository,
2. list files that will change,
3. identify compatibility risks,
4. implement the smallest complete change,
5. run TypeScript checks/tests,
6. report what passed and what remains.

Hard requirements:
- Platform-aware debounced search dropdown.
- Manual problem fallback.
- Save original source code and explanation.
- Mandatory previous-solution review page before coding.
- Configurable DeepSeek/Qwen AI provider behind Supabase Edge Functions.
- AI-generated related problem stored once per revision.
- Hidden tests and reference solutions stored in a client-inaccessible table.
- Judge0/Piston remote sandbox behind Edge Functions.
- Lightweight native TextInput code editor; do not add Monaco/WebView/local compilers.
- Correctness determined only by deterministic tests.
- Revision completion performed server-side and atomically.
- No secret keys in EXPO_PUBLIC variables.
- Preserve RLS and add WITH CHECK policies.
- Keep the APK and local storage small.

Never expose hidden tests, reference solutions, service-role keys, AI keys, judge keys, or raw backend errors.

Do not remove the old revision result flow until the new flow passes the end-to-end acceptance test. Then replace self-reported correctness with verified compiler results.

Use strict TypeScript. Avoid any unless a third-party boundary absolutely requires it; validate and convert immediately.

After every phase, update a checklist in IMPLEMENTATION_STATUS.md with:
- completed items,
- files changed,
- migrations applied,
- tests run,
- unresolved issues,
- next phase.
```

---

# 26. Definition of Done

The feature is complete only when all conditions are true.

## Search dropdown

- [ ] Selected platform filters results.
- [ ] Search is debounced.
- [ ] Top results appear in a dropdown.
- [ ] Selecting a result fills metadata.
- [ ] Platform change clears stale selection.
- [ ] Manual entry works.
- [ ] Full catalogs are not stored on the phone.

## Previous solution review

- [ ] Original problem details are shown.
- [ ] Latest successful code is shown when available.
- [ ] Explanation and complexities are shown.
- [ ] Existing users without snapshots receive a safe empty state.
- [ ] Review is recorded.
- [ ] Compiler cannot be opened before review.

## AI practice problem

- [ ] Provider is configurable.
- [ ] Keys are server-side.
- [ ] JSON is schema-validated.
- [ ] Problem is generated once per revision.
- [ ] Reference solution is verified before publishing.
- [ ] Public data is separated from hidden judge data.

## Compiler

- [ ] Three MVP languages work.
- [ ] Code editor remains lightweight.
- [ ] Sample tests show details.
- [ ] Hidden tests remain hidden.
- [ ] Compile/runtime/timeout/wrong-answer states work.
- [ ] Draft survives navigation/app restart.
- [ ] Accepted code completes revision.
- [ ] Failed code does not complete revision.

## Security and reliability

- [ ] No AI/judge/service secrets in client bundle.
- [ ] RLS isolation tests pass.
- [ ] Completion RPC is idempotent.
- [ ] Memory strength updates once.
- [ ] API payloads and logs are bounded.
- [ ] Rate limits are enabled.
- [ ] Offline message is correct.
- [ ] Existing user data remains usable.

## Performance and storage

- [ ] No local compiler installed.
- [ ] No full problem catalog downloaded.
- [ ] No heavy web editor added.
- [ ] Search returns at most 10 items.
- [ ] Old drafts expire.
- [ ] Compiler logs are truncated.
- [ ] APK size increase is measured and documented.

---

# 27. Explicit Out of Scope for the First Release

Do not delay the MVP for these items:

- real-time collaborative coding,
- video or voice revision sessions,
- full IDE debugging,
- package installation inside code execution,
- interactive problems,
- SQL/database problems,
- AI-generated hints on every keystroke,
- plagiarism detection,
- competitive contests,
- offline compilation,
- more than three programming languages,
- automatic submission to LeetCode/Codeforces/CodeChef accounts.

These can be considered only after the secure compiler and review flow are stable.

---

# 28. Final Architecture Summary

```text
MOBILE APP
Expo + React Native + TypeScript
- platform dropdown
- review page
- lightweight editor
- local drafts
- visible results
        |
        | authenticated Supabase function calls
        v
SUPABASE
Auth + Postgres + RLS + Edge Functions
- catalog search
- revision ownership
- AI provider adapter
- judge provider adapter
- private hidden tests
- atomic completion RPC
        |
        +--------------------+
        |                    |
        v                    v
AI PROVIDER              SANDBOX JUDGE
DeepSeek or Qwen         Judge0 or Piston
- generate problem       - compile
- generate tests         - run tests
- optional explanation   - deterministic verdict
```

The implementation is successful when Memory Stack changes from a reminder-and-self-report application into a secure revision platform where the learner reviews their previous work, solves a fresh related problem, receives a real compiler verdict, and earns revision completion only through verified success.
