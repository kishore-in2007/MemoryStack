begin;

create extension if not exists pg_trgm;
create extension if not exists "uuid-ossp";

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
create index if not exists idx_problem_catalog_platform_active on public.problem_catalog(platform, is_active);
create index if not exists idx_problem_catalog_title_trgm on public.problem_catalog using gin (normalized_title gin_trgm_ops);
create index if not exists idx_problem_catalog_topics on public.problem_catalog using gin (topics);
alter table public.problem_catalog enable row level security;
drop policy if exists "authenticated_read_problem_catalog" on public.problem_catalog;

alter table public.problems
  add column if not exists catalog_problem_id uuid references public.problem_catalog(id),
  add column if not exists source_type text not null default 'manual' check (source_type in ('catalog', 'manual', 'ai_generated')),
  add column if not exists user_notes text,
  add column if not exists preferred_language text check (preferred_language in ('python', 'cpp', 'java', 'javascript')),
  add column if not exists initial_solution_snapshot_id uuid,
  add column if not exists updated_at timestamptz not null default now();
create index if not exists idx_problems_catalog_problem on public.problems(catalog_problem_id);

create table if not exists public.solution_snapshots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete cascade,
  revision_id uuid references public.revisions(id) on delete set null,
  practice_problem_id uuid,
  submission_id uuid,
  snapshot_type text not null default 'original' check (snapshot_type in ('original', 'revision_success', 'manual_update')),
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
create index if not exists idx_solution_snapshots_problem_date on public.solution_snapshots(user_id, problem_id, created_at desc);
create index if not exists idx_solution_snapshots_revision on public.solution_snapshots(revision_id);
alter table public.solution_snapshots enable row level security;
drop policy if exists "own_solution_snapshots_select" on public.solution_snapshots;
create policy "own_solution_snapshots_select" on public.solution_snapshots for select to authenticated using (auth.uid() = user_id);
drop policy if exists "own_solution_snapshots_insert" on public.solution_snapshots;

create table if not exists public.practice_problems (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  source_problem_id uuid not null references public.problems(id) on delete cascade,
  revision_id uuid not null references public.revisions(id) on delete cascade,
  title text not null, statement text not null, difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  topic text not null, subtopic text, pattern text, input_format text, output_format text,
  constraints jsonb not null default '[]'::jsonb, examples jsonb not null default '[]'::jsonb,
  starter_code jsonb not null default '{}'::jsonb, allowed_languages text[] not null default array['python','cpp','java'],
  ai_provider text not null, ai_model text not null, prompt_version text not null default 'practice-v1',
  generation_status text not null default 'ready' check (generation_status in ('generating', 'ready', 'failed')),
  created_at timestamptz not null default now(), unique(revision_id)
);
create index if not exists idx_practice_problems_user_revision on public.practice_problems(user_id, revision_id);
alter table public.practice_problems enable row level security;
drop policy if exists "own_practice_problems_select" on public.practice_problems;
create policy "own_practice_problems_select" on public.practice_problems for select to authenticated using (auth.uid() = user_id);

create table if not exists public.practice_problem_judge_data (
  practice_problem_id uuid primary key references public.practice_problems(id) on delete cascade,
  reference_solutions jsonb not null, visible_tests jsonb not null default '[]'::jsonb, hidden_tests jsonb not null,
  checker_type text not null default 'exact' check (checker_type in ('exact', 'trimmed', 'token', 'float_tolerance')),
  float_tolerance double precision, time_limit_ms int not null default 2500 check (time_limit_ms between 250 and 10000),
  memory_limit_kb int not null default 262144 check (memory_limit_kb between 32768 and 524288),
  schema_version text not null default 'judge-v1', created_at timestamptz not null default now()
);
alter table public.practice_problem_judge_data enable row level security;

create table if not exists public.code_submissions (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  revision_id uuid not null references public.revisions(id) on delete cascade,
  practice_problem_id uuid not null references public.practice_problems(id) on delete cascade,
  language text not null check (language in ('python', 'cpp', 'java', 'javascript')),
  source_code text not null, mode text not null check (mode in ('run', 'submit')),
  status text not null default 'queued' check (status in ('queued','processing','accepted','wrong_answer','compile_error','runtime_error','time_limit','memory_limit','internal_error')),
  judge_provider text not null, judge_token text, tests_total int not null default 0, tests_passed int not null default 0,
  runtime_ms int, memory_kb int, compiler_output text, failure_summary text, score int check (score between 0 and 100),
  created_at timestamptz not null default now(), completed_at timestamptz
);
create index if not exists idx_submissions_revision_created on public.code_submissions(user_id, revision_id, created_at desc);
alter table public.code_submissions enable row level security;
drop policy if exists "own_code_submissions_select" on public.code_submissions;
create policy "own_code_submissions_select" on public.code_submissions for select to authenticated using (auth.uid() = user_id);

alter table public.revisions
  add column if not exists reviewed_at timestamptz, add column if not exists started_at timestamptz,
  add column if not exists verified_at timestamptz, add column if not exists practice_problem_id uuid references public.practice_problems(id),
  add column if not exists previous_solution_snapshot_id uuid references public.solution_snapshots(id),
  add column if not exists last_submission_id uuid references public.code_submissions(id),
  add column if not exists verification_status text not null default 'not_started' check (verification_status in ('not_started','reviewed','in_progress','passed','failed'));
alter table public.revisions drop constraint if exists revisions_status_check;
alter table public.revisions add constraint revisions_status_check check (status in ('pending','in_progress','completed','overdue'));

do $$ begin
  if not exists (select 1 from pg_constraint where conname='problems_initial_solution_snapshot_fk') then alter table public.problems add constraint problems_initial_solution_snapshot_fk foreign key(initial_solution_snapshot_id) references public.solution_snapshots(id) on delete set null; end if;
  if not exists (select 1 from pg_constraint where conname='solution_snapshots_practice_problem_fk') then alter table public.solution_snapshots add constraint solution_snapshots_practice_problem_fk foreign key(practice_problem_id) references public.practice_problems(id) on delete set null; end if;
  if not exists (select 1 from pg_constraint where conname='solution_snapshots_submission_fk') then alter table public.solution_snapshots add constraint solution_snapshots_submission_fk foreign key(submission_id) references public.code_submissions(id) on delete set null; end if;
end $$;

create table if not exists public.api_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade, action text not null,
  window_started_at timestamptz not null, request_count int not null default 1, primary key(user_id, action, window_started_at)
);
alter table public.api_rate_limits enable row level security;

do $$ declare t text; begin
  foreach t in array array['problems','revisions','memory_strength','problem_queue'] loop
    execute format('drop policy if exists "own_%s" on public.%I', case when t='memory_strength' then 'memory' when t='problem_queue' then 'queue' else t end, t);
    execute format('drop policy if exists "own_%s_select" on public.%I', t, t);
    execute format('drop policy if exists "own_%s_insert" on public.%I', t, t);
    execute format('drop policy if exists "own_%s_update" on public.%I', t, t);
    execute format('drop policy if exists "own_%s_delete" on public.%I', t, t);
    execute format('create policy "own_%s_select" on public.%I for select to authenticated using (auth.uid()=user_id)', t, t);
    execute format('create policy "own_%s_insert" on public.%I for insert to authenticated with check (auth.uid()=user_id)', t, t);
    execute format('create policy "own_%s_update" on public.%I for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id)', t, t);
    execute format('create policy "own_%s_delete" on public.%I for delete to authenticated using (auth.uid()=user_id)', t, t);
  end loop;
end $$;

create or replace function public.update_memory_strength_atomic(p_user_id uuid,p_topic text,p_score int) returns void language plpgsql security definer set search_path=public as $$
declare v_existing public.memory_strength%rowtype; v_count int; v_avg double precision; v_success double precision; v_strength double precision; v_date date := (now() at time zone 'Asia/Kolkata')::date;
begin
  if auth.uid() is null or auth.uid()<>p_user_id then raise exception 'Not authorized'; end if;
  select * into v_existing from public.memory_strength where user_id=p_user_id and topic=p_topic for update;
  if not found then insert into public.memory_strength(user_id,topic,strength_score,revision_count,success_rate,avg_score,last_revision_date,updated_at) values(p_user_id,p_topic,greatest(0,least(100,p_score)),1,case when p_score>=60 then 100 else 0 end,greatest(0,least(100,p_score)),v_date,now()); return; end if;
  v_count:=v_existing.revision_count+1; v_avg:=((coalesce(v_existing.avg_score,0)*v_existing.revision_count)+greatest(0,least(100,p_score)))/v_count;
  v_success:=(((coalesce(v_existing.success_rate,0)/100.0*v_existing.revision_count)+case when p_score>=60 then 1 else 0 end)/v_count)*100.0;
  v_strength:=coalesce(v_existing.strength_score,0)*0.60+greatest(0,least(100,p_score))*0.40;
  update public.memory_strength set strength_score=least(100,greatest(0,v_strength)),revision_count=v_count,success_rate=least(100,greatest(0,v_success)),avg_score=least(100,greatest(0,v_avg)),last_revision_date=v_date,updated_at=now() where id=v_existing.id;
end $$;
revoke all on function public.update_memory_strength_atomic(uuid,text,int) from public;

create or replace function public.complete_verified_revision(p_revision_id uuid,p_submission_id uuid,p_score int,p_explanation text default null,p_time_complexity text default null,p_space_complexity text default null) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid(); v_revision public.revisions%rowtype; v_submission public.code_submissions%rowtype; v_problem public.problems%rowtype; v_snapshot uuid; v_attempts int;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_revision from public.revisions where id=p_revision_id and user_id=v_uid for update;
  if not found then raise exception 'Revision not found'; end if;
  if v_revision.status='completed' then return jsonb_build_object('revision_id',v_revision.id,'already_completed',true,'score',v_revision.score); end if;
  select * into v_submission from public.code_submissions where id=p_submission_id and user_id=v_uid and revision_id=p_revision_id and status='accepted' and mode='submit';
  if not found then raise exception 'Accepted submission not found'; end if;
  select * into v_problem from public.problems where id=v_revision.problem_id and user_id=v_uid;
  select count(*) into v_attempts from public.code_submissions where revision_id=p_revision_id and user_id=v_uid and mode='submit';
  insert into public.solution_snapshots(user_id,problem_id,revision_id,practice_problem_id,submission_id,snapshot_type,language,source_code,explanation,time_complexity,space_complexity,score,attempts,is_successful)
  values(v_uid,v_revision.problem_id,p_revision_id,v_submission.practice_problem_id,v_submission.id,'revision_success',v_submission.language,v_submission.source_code,p_explanation,p_time_complexity,p_space_complexity,greatest(0,least(100,p_score)),greatest(1,v_attempts),true) returning id into v_snapshot;
  update public.revisions set status='completed',verification_status='passed',score=greatest(0,least(100,p_score)),attempts=greatest(1,v_attempts),completed_date=(now() at time zone 'Asia/Kolkata')::date,verified_at=now(),last_submission_id=v_submission.id,time_complexity=p_time_complexity,space_complexity=p_space_complexity where id=p_revision_id;
  perform public.update_memory_strength_atomic(v_uid,coalesce(v_problem.topic,'Uncategorized'),greatest(0,least(100,p_score)));
  return jsonb_build_object('revision_id',p_revision_id,'submission_id',p_submission_id,'snapshot_id',v_snapshot,'score',greatest(0,least(100,p_score)),'already_completed',false);
end $$;
revoke all on function public.complete_verified_revision(uuid,uuid,int,text,text,text) from public;
grant execute on function public.complete_verified_revision(uuid,uuid,int,text,text,text) to authenticated;

create or replace function public.add_solved_problem_atomic(
  p_name text, p_platform text, p_difficulty text, p_topic text, p_subtopic text, p_pattern text,
  p_url text, p_solved_date date, p_catalog_problem_id uuid, p_language text, p_source_code text,
  p_explanation text default null, p_time_complexity text default null, p_space_complexity text default null
) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid(); v_problem uuid; v_snapshot uuid; v_intervals int[]:=array[1,3,7,14,30,60,90,120,180,365]; v_i int;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if p_platform not in ('LeetCode','Codeforces','CodeChef') or p_difficulty not in ('Easy','Medium','Hard') or p_language not in ('python','cpp','java') then raise exception 'Invalid input'; end if;
  if char_length(p_source_code)>50000 then raise exception 'Source code too large'; end if;
  if p_catalog_problem_id is not null and not exists(select 1 from public.problem_catalog where id=p_catalog_problem_id and platform=p_platform and is_active) then raise exception 'Catalog problem not found'; end if;
  insert into public.problems(user_id,name,platform,difficulty,topic,subtopic,pattern,url,solved_date,catalog_problem_id,source_type,preferred_language)
  values(v_uid,p_name,p_platform,p_difficulty,p_topic,p_subtopic,p_pattern,p_url,p_solved_date,p_catalog_problem_id,case when p_catalog_problem_id is null then 'manual' else 'catalog' end,p_language) returning id into v_problem;
  insert into public.solution_snapshots(user_id,problem_id,snapshot_type,language,source_code,explanation,time_complexity,space_complexity)
  values(v_uid,v_problem,'original',p_language,p_source_code,p_explanation,p_time_complexity,p_space_complexity) returning id into v_snapshot;
  update public.problems set initial_solution_snapshot_id=v_snapshot where id=v_problem;
  for v_i in 1..10 loop insert into public.revisions(problem_id,user_id,revision_number,due_date,status) values(v_problem,v_uid,v_i,p_solved_date+v_intervals[v_i],'pending'); end loop;
  return jsonb_build_object('problemId',v_problem,'snapshotId',v_snapshot);
end $$;
revoke all on function public.add_solved_problem_atomic(text,text,text,text,text,text,text,date,uuid,text,text,text,text,text) from public;
grant execute on function public.add_solved_problem_atomic(text,text,text,text,text,text,text,date,uuid,text,text,text,text,text) to authenticated;

commit;
