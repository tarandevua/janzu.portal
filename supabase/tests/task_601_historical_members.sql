\set ON_ERROR_STOP on
begin;
insert into auth.users(id,email,raw_user_meta_data)
select ('16010000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'task601-'||n||'@example.test','{"full_name":"Historical fixture"}'::jsonb
from generate_series(1,7) n;
insert into public.user_roles(user_id,role_id)
select ('16010000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,r.id
from generate_series(3,6) n join public.roles r on r.name::text=case when n in (3,6) then 'instructor' else 'admin' end
on conflict do nothing;
insert into public.practitioners(id,user_id) values('26010000-0000-4000-8000-000000000001','16010000-0000-4000-8000-000000000001') on conflict(user_id) do nothing;
create temp table t601_data(payload jsonb);
insert into t601_data values ('[{"source":"test-roster","key":"training-1","memberId":"16010000-0000-4000-8000-000000000001","email":"task601-1@example.test","kind":"training","details":{"period":"2020","location":"Madrid","teachingInstructor":"Historical teacher","cohort":"2020","identityEvidence":"restricted:identity","declaration":"restricted:signed-declaration","evidence":[{"reference":"restricted:roster","source":"training-school","type":"primary"}],"level":"level_1","startedOn":"2020-01-01","completedOn":"2020-01-05","courseworkComplete":true,"attendanceComplete":true}}]');
grant select,update on t601_data to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub','16010000-0000-4000-8000-000000000004',true);
do $$ declare report jsonb; rows jsonb; count_before integer; begin
 select payload into rows from t601_data;
 select count(*) into count_before from public.historical_member_claims;
 report:=public.import_historical_members(auth.uid(),rows,false);
 assert report->'rows'->0->>'code'='ready';
 assert (select count(*) from public.historical_member_claims)=count_before,'dry run mutated claims';
 assert not exists(select 1 from public.historical_member_events),'dry run wrote audit';
 report:=public.import_historical_members(auth.uid(),rows||rows,true);
 assert report->>'committed'='false';
 assert report->'rows'->0->>'code' in ('duplicate_identity','source_conflict');
 assert (select count(*) from public.historical_member_claims)=count_before;
 report:=public.import_historical_members(auth.uid(),rows,true);
 assert report->>'committed'='true';
 report:=public.import_historical_members(auth.uid(),rows,true);
 assert report->'rows'->0->>'code'='replay';
 perform set_config('task601.claim_id',report->'rows'->0->>'claimId',true);
 assert (select count(*) from public.historical_member_events)=1,'replay duplicated audit';
 report:=public.import_historical_members(auth.uid(),jsonb_set(rows,'{0,details,period}','"Changed"'),true);
 assert report->'rows'->0->>'code'='source_conflict';
 report:=public.import_historical_members(auth.uid(),jsonb_set(jsonb_set(rows,'{0,key}','"new"'),'{0,memberId}','"16010000-0000-4000-8000-000000000002"'),true);
 assert report->'rows'->0->>'code'='identity_mismatch';
 assert (select count(*) from public.historical_member_events)=1;
 begin perform public.import_historical_members('16010000-0000-4000-8000-000000000005',rows,true); raise exception 'forged actor accepted'; exception when insufficient_privilege then null; end;
 begin perform import_payload from public.historical_member_claims; raise exception 'identity email exposed'; exception when insufficient_privilege then null; end;
end $$;
-- Independent designation. Neither member nor final Administrator can be senior reviewer.
do $$ declare c record; begin
 select id,revision into c from public.historical_member_claims where source_key='training-1';
 begin perform public.act_on_historical_claim(auth.uid(),jsonb_build_object('action','assign','id',c.id,'revision',c.revision,'reviewerId',auth.uid(),'reason','Self designation')); raise exception 'self designation accepted'; exception when insufficient_privilege then null; end;
 perform public.act_on_historical_claim(auth.uid(),jsonb_build_object('action','assign','id',c.id,'revision',c.revision,'reviewerId','16010000-0000-4000-8000-000000000003','reason','Designated senior Instructor; credential checked.'));
end $$;
select set_config('request.jwt.claim.sub','16010000-0000-4000-8000-000000000007',true);
do $$ begin
 assert not exists(select 1 from public.historical_member_claims),'unrelated read';
 assert not exists(select 1 from public.historical_member_events),'unrelated evidence read';
 begin perform public.act_on_historical_claim(auth.uid(),jsonb_build_object('action','review','id',current_setting('task601.claim_id'),'revision',2,'decision','approved','approvedTotal',0,'reason','Forged target','noConflict',true)); raise exception 'unrelated mutation accepted'; exception when insufficient_privilege then null; end;
 begin perform public.import_historical_members(auth.uid(),(select payload from t601_data),false); raise exception 'unrelated import accepted'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','16010000-0000-4000-8000-000000000003',true);
do $$ declare c record; begin
 select id,revision into c from public.historical_member_claims where source_key='training-1';
 begin perform public.act_on_historical_claim(auth.uid(),jsonb_build_object('action','review','id',c.id,'revision',c.revision,'decision','approved','approvedTotal',0,'reason','Evidence checked','noConflict',false)); raise exception 'missing conflict declaration accepted'; exception when insufficient_privilege then null; end;
 perform public.act_on_historical_claim(auth.uid(),jsonb_build_object('action','review','id',c.id,'revision',c.revision,'decision','approved','approvedTotal',0,'reason','Primary evidence and declaration checked','noConflict',true));
 assert not exists(select 1 from public.training_history where historical_claim_id=c.id),'senior alone activated training';
end $$;
select set_config('request.jwt.claim.sub','16010000-0000-4000-8000-000000000004',true);
do $$ declare c record; begin
 select id,revision into c from public.historical_member_claims where source_key='training-1';
 perform public.act_on_historical_claim(auth.uid(),jsonb_build_object('action','review','id',c.id,'revision',c.revision,'decision','approved','approvedTotal',0,'reason','Independent completeness and identity check','noConflict',true));
 assert exists(select 1 from public.training_history where historical_claim_id=c.id and status='verified');

 begin perform public.act_on_historical_claim(auth.uid(),jsonb_build_object('action','review','id',c.id,'revision',c.revision,'decision','approved','approvedTotal',0,'reason','Retry','noConflict',true)); raise exception 'stale revision accepted'; exception when check_violation then null; end;
 begin perform public.review_training_record(auth.uid(),(select id from public.training_history where historical_claim_id=c.id),true,null); raise exception 'ordinary review bypass'; exception when insufficient_privilege then null; end;
end $$;
-- Aggregate claim, partial support and conservative overlap handling.
update t601_data set payload=jsonb_build_array(jsonb_build_object('source','test-roster','key','sessions-1','memberId','16010000-0000-4000-8000-000000000001','email','task601-1@example.test','kind','sessions','details',
 (payload->0->'details') - array['level','startedOn','completedOn','courseworkComplete','attendanceComplete'] || '{"coveredFrom":"2020-02-01","cutoff":"2020-12-31","claimedTotal":30,"calculationMethod":"Qualifying one-to-one sessions, at least 60 minutes, after Level 1; no duplicates."}'::jsonb));
select public.import_historical_members(auth.uid(),(select payload from t601_data),true);
do $$ declare c record; begin
 select id,revision into c from public.historical_member_claims where source_key='sessions-1';
 perform public.act_on_historical_claim(auth.uid(),jsonb_build_object('action','assign','id',c.id,'revision',c.revision,'reviewerId','16010000-0000-4000-8000-000000000003','reason','Senior qualification verified.'));
end $$;
select set_config('request.jwt.claim.sub','16010000-0000-4000-8000-000000000003',true);
do $$ declare c record; begin
 select id,revision into c from public.historical_member_claims where source_key='sessions-1';
 perform public.act_on_historical_claim(auth.uid(),jsonb_build_object('action','review','id',c.id,'revision',c.revision,'decision','partially_approved','approvedTotal',25,'reason','Only 25 supported','noConflict',true));
end $$;
select set_config('request.jwt.claim.sub','16010000-0000-4000-8000-000000000004',true);
do $$ declare c record; begin
 select id,revision into c from public.historical_member_claims where source_key='sessions-1';
 begin perform public.act_on_historical_claim(auth.uid(),jsonb_build_object('action','review','id',c.id,'revision',c.revision,'decision','approved','approvedTotal',30,'reason','Overclaim','noConflict',true)); raise exception 'Administrator exceeded senior support'; exception when check_violation then null; end;
 perform public.act_on_historical_claim(auth.uid(),jsonb_build_object('action','review','id',c.id,'revision',c.revision,'decision','partially_approved','approvedTotal',25,'reason','Minimum independently checked','noConflict',true));
 assert (select counted_sessions_count from public.certification_journeys where trainee_user_id='16010000-0000-4000-8000-000000000001')=25;
end $$;
-- A new source key cannot double-credit an already approved date range.
select public.import_historical_members(auth.uid(),jsonb_set((select payload from t601_data),'{0,key}','"overlap"'),true);
do $$ declare c record; begin
 select id,revision into c from public.historical_member_claims where source_key='overlap';
 perform public.act_on_historical_claim(auth.uid(),jsonb_build_object('action','assign','id',c.id,'revision',c.revision,'reviewerId','16010000-0000-4000-8000-000000000003','reason','Check potential overlapping evidence'));
 perform set_config('request.jwt.claim.sub','16010000-0000-4000-8000-000000000003',true);
 select id,revision into c from public.historical_member_claims where source_key='overlap';
 begin perform public.act_on_historical_claim(auth.uid(),jsonb_build_object('action','review','id',c.id,'revision',c.revision,'decision','approved','approvedTotal',30,'reason','Potential duplicate','noConflict',true)); raise exception 'overlap approved'; exception when check_violation then null; end;
 perform set_config('request.jwt.claim.sub','16010000-0000-4000-8000-000000000004',true);
end $$;
reset role;
insert into public.sessions(practitioner_id,session_date,duration_minutes,is_validated)
select id,'2020-03-01',60,true from public.practitioners where user_id='16010000-0000-4000-8000-000000000001';
do $$ begin assert (select counted_sessions_count from public.certification_journeys where trainee_user_id='16010000-0000-4000-8000-000000000001')=25,'overlapping native session double counted'; end $$;
-- A professional claim can be independently verified without role or certificate activation.
set local role authenticated;
select set_config('request.jwt.claim.sub','16010000-0000-4000-8000-000000000004',true);
update t601_data set payload=jsonb_build_array(jsonb_build_object('source','test-roster','key','professional-2','memberId','16010000-0000-4000-8000-000000000002','email','task601-2@example.test','kind','facilitator','details',
  (payload->0->'details') || '{"historicalRecognitionEvidence":"restricted:historical-assessment"}'::jsonb));
select public.import_historical_members(auth.uid(),(select payload from t601_data),true);
do $$ declare c record; begin
 select id,revision into c from public.historical_member_claims where source_key='professional-2';
 perform public.act_on_historical_claim(auth.uid(),jsonb_build_object('action','assign','id',c.id,'revision',c.revision,'reviewerId','16010000-0000-4000-8000-000000000003','reason','Senior credential verified'));
 perform set_config('request.jwt.claim.sub','16010000-0000-4000-8000-000000000003',true);
 select id,revision into c from public.historical_member_claims where source_key='professional-2';
 perform public.act_on_historical_claim(auth.uid(),jsonb_build_object('action','review','id',c.id,'revision',c.revision,'decision','approved','approvedTotal',0,'reason','Historical assessment evidence checked','noConflict',true));
 perform set_config('request.jwt.claim.sub','16010000-0000-4000-8000-000000000004',true);
 select id,revision into c from public.historical_member_claims where source_key='professional-2';
 perform public.act_on_historical_claim(auth.uid(),jsonb_build_object('action','review','id',c.id,'revision',c.revision,'decision','approved','approvedTotal',0,'reason','Independent historical recognition','noConflict',true));
 assert (select status from public.historical_member_claims where id=c.id)='approved';
end $$;
reset role;
-- Revoked designation immediately removes read and review access.
delete from public.user_roles where user_id='16010000-0000-4000-8000-000000000003' and role_id=(select id from public.roles where name='instructor');
set local role authenticated;
select set_config('request.jwt.claim.sub','16010000-0000-4000-8000-000000000003',true);
do $$ begin assert not exists(select 1 from public.historical_member_claims); assert not exists(select 1 from public.historical_member_events); end $$;
-- Owner may appeal and suspend old credit but cannot approve or alter canonical historical training.
select set_config('request.jwt.claim.sub','16010000-0000-4000-8000-000000000001',true);
do $$ declare c record; begin
 select id,revision,details into c from public.historical_member_claims where source_key='sessions-1';
 begin perform public.act_on_historical_claim(auth.uid(),jsonb_build_object('action','review','id',c.id,'revision',c.revision,'decision','approved','approvedTotal',30,'reason','Self approval','noConflict',true)); raise exception 'self approval accepted'; exception when insufficient_privilege then null; end;
 perform public.act_on_historical_claim(auth.uid(),jsonb_build_object('action','revise','id',c.id,'revision',c.revision,'details',c.details,'reason','Appeal: please check another source.'));
 assert (select counted_sessions_count from public.certification_journeys where trainee_user_id=auth.uid())=1,'revision left stale historical credit';
 assert (select count(*) from public.historical_member_events where claim_id=c.id)>=5,'history lost';
 select id,revision,details into c from public.historical_member_claims where source_key='training-1';
 perform public.act_on_historical_claim(auth.uid(),jsonb_build_object('action','revise','id',c.id,'revision',c.revision,'details',c.details,'reason','Corrected training evidence.'));
 assert (select counted_sessions_count from public.certification_journeys where trainee_user_id=auth.uid())=0,'training invalidation left credit';
 assert exists(select 1 from public.list_training_history(auth.uid(),auth.uid()) t where t.historical_claim_id=c.id),'historical source link missing';
 begin update public.training_history set status='claimed',verified_by=null,verified_at=null where historical_claim_id=c.id; raise exception 'direct historical correction bypass'; exception when insufficient_privilege then null; end;
end $$;
-- No trusted role, certificate, profile consent, or fictional session was created by imports.
reset role;
do $$ begin
 assert (select count(*) from public.notifications where type='historical_claim_updated' and user_id='16010000-0000-4000-8000-000000000001')=2;
 assert not exists(select 1 from public.user_roles ur join public.roles r on r.id=ur.role_id where ur.user_id='16010000-0000-4000-8000-000000000002' and r.name='facilitator');
 assert not exists(select 1 from public.user_roles ur join public.roles r on r.id=ur.role_id where ur.user_id='16010000-0000-4000-8000-000000000001' and r.name in ('facilitator','instructor'));
 assert not exists(select 1 from public.certificates where member_user_id='16010000-0000-4000-8000-000000000001');
 assert (select count(*) from public.sessions s join public.practitioners p on p.id=s.practitioner_id where p.user_id='16010000-0000-4000-8000-000000000001')=1;
end $$;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$ begin
 begin perform public.import_historical_members(null,'[]',false); raise exception 'anonymous import'; exception when insufficient_privilege then null; end;
 begin perform id from public.historical_member_claims; raise exception 'anonymous claim access'; exception when insufficient_privilege then null; end;
end $$;
rollback;
