create table projects (
 id uuid primary key default gen_random_uuid(), name text not null unique, sponsor text not null,
 manager text not null, currency text not null default 'NZD' check(currency ~ '^[A-Z]{3}$'),
 status text not null default 'proposed' check(status in ('proposed','active','on-hold','closed')),
 budget numeric(14,2) not null default 0 check(budget>=0), target_finish date not null,
 business_case text not null default '', expected_benefit text not null default '',
 benefit_owner text not null default '', benefit_due date, benefit_evidence text not null default '',
 retention_review date, legal_hold boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table people (
 id uuid primary key default gen_random_uuid(), name text not null unique, role text not null default '',
 weekly_hours numeric(8,2) not null default 40 check(weekly_hours>=0),
 purpose text not null default '', retention_review date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table tasks (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references projects,
 external_id text, name text not null, owner text not null default '', start_date date not null,
 finish_date date not null, baseline_finish date not null, percent_complete numeric(5,2) not null default 0 check(percent_complete between 0 and 100),
 planned_hours numeric(10,2) not null default 0 check(planned_hours>=0),
 milestone boolean not null default false, evidence text not null default '',
 source_data jsonb not null default '{}', last_update date not null default current_date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(project_id,external_id), check(finish_date>=start_date)
);
create table dependencies (
 id uuid primary key default gen_random_uuid(), task_id uuid not null references tasks,
 predecessor_id uuid not null references tasks, unique(task_id,predecessor_id), check(task_id<>predecessor_id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table allocations (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references projects,
 person_id uuid not null references people, week_start date not null check(extract(isodow from week_start)=1),
 hours numeric(8,2) not null check(hours>=0), unique(project_id,person_id,week_start),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table time_entries (
 id uuid primary key default gen_random_uuid(), task_id uuid not null references tasks,
 person_id uuid not null references people, worked_on date not null, hours numeric(8,2) not null check(hours>0),
 cost_rate numeric(12,2) not null check(cost_rate>=0), description text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table expenses (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references projects,
 name text not null, amount numeric(14,2) not null check(amount>=0), incurred_on date not null, evidence text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table risks (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references projects, name text not null,
 owner text not null, likelihood integer not null check(likelihood between 1 and 5), impact integer not null check(impact between 1 and 5),
 mitigation text not null default '', review_due date not null,
 status text not null default 'open' check(status in ('open','closed')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table changes (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references projects, name text not null,
 requested_by text not null, reason text not null, cost_delta numeric(14,2) not null default 0,
 finish_delta_days integer not null default 0, status text not null default 'pending' check(status in ('pending','approved','rejected')),
 decided_by text, decision_note text, decided_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table decisions (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references projects, name text not null,
 owner text not null, due_date date not null, outcome text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table notes (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references projects, name text not null, actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table audit_log (
 id uuid primary key default gen_random_uuid(), actor text not null, action text not null, entity text not null,
 record_id uuid, before_data jsonb, after_data jsonb,
 created_at timestamptz not null default now()
);
create function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
do $$ declare t text; begin
 foreach t in array array['projects','people','tasks','dependencies','allocations','time_entries','expenses','risks','changes','decisions','notes'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated_at()',t);
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
 end loop;
end $$;
alter table audit_log enable row level security;
revoke all on audit_log from public;
create view portfolio_status as
select p.id,p.name,p.manager,p.status,p.currency,p.budget,
 p.budget+coalesce((select sum(cost_delta) from changes c where c.project_id=p.id and status='approved'),0) approved_budget,
 coalesce((select sum(e.amount) from expenses e where e.project_id=p.id),0)+coalesce((select sum(t.hours*t.cost_rate) from time_entries t join tasks a on a.id=t.task_id where a.project_id=p.id),0) actual_cost,
 p.target_finish+coalesce((select sum(finish_delta_days)::int from changes c where c.project_id=p.id and status='approved'),0) approved_finish,
 (select count(*) from tasks t where t.project_id=p.id and percent_complete<100 and finish_date<current_date) overdue_tasks,
 (select count(*) from risks r where r.project_id=p.id and status='open' and likelihood*impact>=15) high_risks,
 (select count(*) from changes c where c.project_id=p.id and status='pending') pending_changes,
 (select count(*) from decisions d where d.project_id=p.id and outcome='' and due_date<current_date) overdue_decisions
from projects p;
create view capacity_week as
select a.week_start,p.id person_id,p.name,p.weekly_hours,sum(a.hours) allocated_hours,
 greatest(sum(a.hours)-p.weekly_hours,0) overbooked_hours,
 string_agg(j.name,', ' order by j.name) projects
from allocations a join people p on p.id=a.person_id join projects j on j.id=a.project_id
where j.status in ('active','proposed') group by a.week_start,p.id,p.name,p.weekly_hours;
create view dependency_watch as
select t.id,t.name task,p.name project,t.start_date,pre.name predecessor,j.name predecessor_project,
 pre.finish_date predecessor_finish,pre.percent_complete predecessor_complete,
 pre.finish_date>=t.start_date date_conflict
from dependencies d join tasks t on t.id=d.task_id join tasks pre on pre.id=d.predecessor_id
join projects p on p.id=t.project_id join projects j on j.id=pre.project_id
where t.percent_complete<100 and pre.percent_complete<100;
create view attention_items as
select 'late task' kind,t.id,p.name project,t.name item,t.owner,t.finish_date due_date from tasks t join projects p on p.id=t.project_id where t.percent_complete<100 and t.finish_date<current_date and p.status<>'closed'
union all select 'stale update',t.id,p.name,t.name,t.owner,t.last_update from tasks t join projects p on p.id=t.project_id where t.percent_complete<100 and t.last_update<current_date-14 and p.status='active'
union all select 'risk review',r.id,p.name,r.name,r.owner,r.review_due from risks r join projects p on p.id=r.project_id where r.status='open' and r.review_due<=current_date
union all select 'decision',d.id,p.name,d.name,d.owner,d.due_date from decisions d join projects p on p.id=d.project_id where d.outcome='' and d.due_date<=current_date
union all select 'benefit review',p.id,p.name,p.expected_benefit,p.benefit_owner,p.benefit_due from projects p where p.benefit_due<=current_date and p.benefit_evidence='';
revoke all on portfolio_status,capacity_week,dependency_watch,attention_items from public;
