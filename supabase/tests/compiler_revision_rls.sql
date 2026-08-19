begin;
do $$ begin
  if exists(select 1 from pg_policies where schemaname='public' and tablename='practice_problem_judge_data' and ('authenticated'=any(roles) or 'public'=any(roles))) then raise exception 'hidden judge data has a client policy'; end if;
  if exists(select 1 from pg_policies where schemaname='public' and tablename='code_submissions' and cmd in ('INSERT','ALL')) then raise exception 'clients can insert submissions'; end if;
  if exists(select 1 from pg_policies where schemaname='public' and tablename='problem_catalog' and cmd in ('INSERT','UPDATE','DELETE','ALL')) then raise exception 'clients can write catalog'; end if;
  if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='complete_verified_revision' and p.prosecdef) then raise exception 'secure completion RPC missing'; end if;
end $$;
rollback;
