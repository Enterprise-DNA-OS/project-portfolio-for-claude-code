#!/usr/bin/env node
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv,pick} from './lib/csv.mjs';
import {table as alignedTable} from './lib/format.mjs';

export const entities={
 projects:['name','sponsor','manager','currency','status','budget','target_finish','business_case','expected_benefit','benefit_owner','benefit_due','benefit_evidence','retention_review','legal_hold'],
 people:['name','role','weekly_hours','purpose','retention_review'],
 tasks:['project_id','external_id','name','owner','start_date','finish_date','baseline_finish','percent_complete','planned_hours','milestone','evidence','last_update'],
 allocations:['project_id','person_id','week_start','hours'],
 time_entries:['task_id','person_id','worked_on','hours','cost_rate','description'],
 expenses:['project_id','name','amount','incurred_on','evidence'],
 risks:['project_id','name','owner','likelihood','impact','mitigation','review_due','status'],
 changes:['project_id','name','reason','cost_delta','finish_delta_days'],
 decisions:['project_id','name','owner','due_date','outcome']
};
export const reads={
 portfolio:'select name,manager,status,currency,approved_budget,actual_cost,approved_finish,overdue_tasks,high_risks,pending_changes from portfolio_status order by name',
 projects:'select * from projects order by name',
 people:'select * from people order by name',
 tasks:'select t.id,p.name project,t.name,t.owner,t.finish_date,t.baseline_finish,t.percent_complete,t.planned_hours from tasks t join projects p on p.id=t.project_id order by t.finish_date,t.name',
 milestones:'select p.name project,t.name,t.owner,t.finish_date,t.finish_date-t.baseline_finish slip_days,t.percent_complete,t.evidence from tasks t join projects p on p.id=t.project_id where t.milestone order by t.finish_date,t.name',
 budgets:'select name,currency,approved_budget,actual_cost,approved_budget-actual_cost remaining_budget,pending_changes from portfolio_status order by name',
 capacity:'select week_start,name,weekly_hours,allocated_hours,overbooked_hours,projects from capacity_week order by week_start,name',
 risks:"select p.name project,r.name,r.owner,r.likelihood*r.impact score,r.mitigation,r.review_due,r.status from risks r join projects p on p.id=r.project_id order by score desc,r.name",
 changes:'select p.name project,c.name,c.requested_by,c.cost_delta,c.finish_delta_days,c.status,c.decided_by,c.decision_note from changes c join projects p on p.id=c.project_id order by c.created_at,c.name',
 decisions:'select p.name project,d.name,d.owner,d.due_date,d.outcome from decisions d join projects p on p.id=d.project_id order by d.due_date,d.name',
 benefits:'select name,expected_benefit,benefit_owner,benefit_due,benefit_evidence from projects order by benefit_due,name',
 dependencies:'select project,task,start_date,predecessor_project,predecessor,predecessor_finish,predecessor_complete,date_conflict from dependency_watch order by project,task',
 attention:'select kind,project,item,owner,due_date from attention_items order by due_date,kind,item',
 compliance:`select 'NZ-IPP9 / AU-APP11' rule,name item,'Review purpose and retention; no automatic deletion' finding from people where purpose='' or retention_review is null or retention_review<current_date
 union all select 'NZ-IPP9 / AU-APP11',name,'Closed project retention review due; legal hold must be checked' from projects where status='closed' and not legal_hold and (retention_review is null or retention_review<current_date)
 union all select 'INTERNAL-CASE',name,'Active project missing business case or benefit owner' from projects where status='active' and (business_case='' or benefit_owner='')
 union all select 'INTERNAL-EVIDENCE',name,'Completed milestone has no acceptance evidence' from tasks where milestone and percent_complete=100 and evidence=''
 union all select 'INTERNAL-RISK',name,'Open risk has no mitigation' from risks where status='open' and mitigation=''
 union all select 'INTERNAL-RECEIPT',name,'Expense evidence missing' from expenses where evidence='' order by rule,item`,
 history:'select actor,action,entity,record_id,created_at from audit_log order by created_at,id'
};
export const commands=[...Object.keys(reads),'show','add','update','log','depend','approve-change','reject-change','close-project','import','export','weekly-review','draft-steering-pack','draft-change-request','help'];
function opts(args){const positional=[],flags={};for(const arg of args){if(arg.startsWith('--')){const i=arg.indexOf('=');flags[(i<0?arg.slice(2):arg.slice(2,i)).replaceAll('-','_')]=i<0?true:arg.slice(i+1);}else positional.push(arg);}return {positional,flags};}
function need(o,k){if(o[k]===undefined||o[k]===true||String(o[k]).trim()==='')throw Error(`Required --${k.replaceAll('_','-')}=<value>`);return String(o[k]).trim();}
export function format(rows){if(!Array.isArray(rows))return JSON.stringify(rows,null,2);if(!rows.length)return 'No records.';return alignedTable(rows,Object.keys(rows[0]).map(key=>({key,label:key.replaceAll('_',' ')})));}
function tableName(name){if(!entities[name])throw Error(`Unknown record type ${name}. Choose ${Object.keys(entities).join(', ')}`);return name;}
export async function resolve(db,table,term){tableName(table);if(!term)throw Error(`Provide a ${table} name or id`);const rows=await db.query(`select * from ${table} where lower(${entities[table].includes('name')?'name':'id::text'})=lower($1) or starts_with(id::text,lower($1)) order by id`,[term]);if(rows.length!==1)throw Error(`${rows.length?'Ambiguous':'No matching'} ${table}: ${term}\n${format(rows.map(r=>({id:r.id,name:r.name||r.id})))}`);return rows[0];}
async function audit(db,actor,action,entity,before,after){await db.query('insert into audit_log(actor,action,entity,record_id,before_data,after_data) values($1,$2,$3,$4,$5,$6)',[actor,action,entity,after?.id||before?.id||null,before?JSON.stringify(before):null,after?JSON.stringify(after):null]);}
async function transaction(db,fn,dry=false){await db.exec('begin');try{const r=await fn();await db.exec(dry?'rollback':'commit');return r;}catch(e){await db.exec('rollback');throw e;}}
async function fields(db,entity,o){const out={};for(const k of entities[entity])if(o[k]!==undefined)out[k]=o[k];for(const [flag,key,ref] of [['project','project_id','projects'],['person','person_id','people'],['task','task_id','tasks']])if(o[flag]){if(!entities[entity].includes(key))throw Error(`${entity} does not accept --${flag}`);out[key]=(await resolve(db,ref,o[flag])).id;}
 const controls=['actor','json','project','person','task'];for(const k of Object.keys(o))if(!controls.includes(k)&&!entities[entity].includes(k))throw Error(`Unknown field --${k}`);
 for(const k of ['milestone','legal_hold'])if(k in out){if(!['true','false',true,false].includes(out[k]))throw Error(`${k} must be true or false`);out[k]=out[k]===true||out[k]==='true';}return out;}
function isoDate(raw,order){if(/^\d{4}-\d{2}-\d{2}$/.test(raw)){const date=new Date(raw+'T00:00:00Z');if(Number.isNaN(date.valueOf())||date.toISOString().slice(0,10)!==raw)throw Error(`Invalid date ${raw}`);return raw;}const m=raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);if(!m||!['dmy','mdy'].includes(order))throw Error(`Ambiguous date ${raw}; use ISO or --date-order=dmy|mdy`);return isoDate(`${m[3]}-${(order==='dmy'?m[2]:m[1]).padStart(2,'0')}-${(order==='dmy'?m[1]:m[2]).padStart(2,'0')}`);}
function decimal(value,label){if(!/^-?\d+(\.\d+)?$/.test(value))throw Error(`Invalid ${label}: ${value}`);const n=Number(value);if(!Number.isFinite(n))throw Error(`Invalid ${label}`);return n;}
async function importCeloxis(db,o){
 const actor=need(o,'actor'),project=await resolve(db,'projects',need(o,'project'));
 if(project.status==='closed')throw Error('Cannot import tasks into a closed project');
 const data=parseCsv(readFileSync(path.resolve(need(o,'file')),'utf8'));
 if(!data.length)throw Error('No import rows');
 const map=o.mapping?JSON.parse(readFileSync(o.mapping,'utf8')):{};
 const get=(r,k,...names)=>map[k]?pick(r,map[k]):pick(r,...names);
 const seen=new Set();
 const rows=data.map((r,i)=>{try{
 const external_id=get(r,'external_id','ID','Task ID'),name=get(r,'name','Name','Task Name');
 if(!external_id||!name)throw Error('ID and Name columns required (include a stable task ID in the export)');
 if(seen.has(external_id))throw Error(`Duplicate task ID ${external_id}`);seen.add(external_id);
 const start=isoDate(get(r,'start_date','Start','Start Date'),o.date_order),finish=isoDate(get(r,'finish_date','Finish','Finish Date'),o.date_order);
 const percent=decimal((get(r,'percent_complete','% Complete','Percent Complete')||'0').replace(/%$/,''),'percent');
 const work=get(r,'planned_hours','Work','Planned Work','Planned Hours')||'0';
 if(!/^\d+(\.\d+)?\s*(h|hr|hrs|hours)?$/i.test(work))throw Error('Work must be hours; export hour units, not days');
 const planned=decimal(work.replace(/\s*(h|hr|hrs|hours)$/i,''),'hours');
 if(start>finish||percent<0||percent>100)throw Error('Invalid dates or percent');
 return {external_id,name,owner:get(r,'owner','Assigned To','Resources','Owner'),start,finish,percent,planned,raw:r};
 }catch(e){throw Error(`Import row ${i+2}: ${e.message}`);}});
 return transaction(db,async()=>{const [locked]=await db.query('select status from projects where id=$1 for update',[project.id]);if(locked.status==='closed')throw Error('Project is closed');let inserted=0,updated=0;
 for(const r of rows){const before=(await db.query('select * from tasks where project_id=$1 and external_id=$2 for update',[project.id,r.external_id]))[0];
 if(before?.milestone&&r.percent===100&&!before.evidence?.trim())throw Error('Completed milestone requires acceptance evidence');
 const result=await db.query(`insert into tasks(project_id,external_id,name,owner,start_date,finish_date,baseline_finish,percent_complete,planned_hours,source_data)
 values($1,$2,$3,$4,$5,$6,$6,$7,$8,$9) on conflict(project_id,external_id) do update set name=excluded.name,owner=excluded.owner,start_date=excluded.start_date,finish_date=excluded.finish_date,percent_complete=excluded.percent_complete,planned_hours=excluded.planned_hours,source_data=excluded.source_data,last_update=current_date returning *`,[project.id,r.external_id,r.name,r.owner,r.start,r.finish,r.percent,r.planned,JSON.stringify(r.raw)]);
 await audit(db,actor,'import celoxis','tasks',before,result[0]);before?updated++:inserted++;
 }return {dry_run:Boolean(o.dry_run),project:project.name,inserted,updated,rows:rows.length};},Boolean(o.dry_run));
}
export async function execute(db,args){const {positional:a,flags:o}=opts(args),[cmd='help',entity,term]=a;
 if(reads[cmd])return db.query(reads[cmd]);
 if(cmd==='help')return {usage:'npm run portfolio -- <command> [--name=value] [--json]',commands,entities,examples:['add projects --name=Example --sponsor=Mere --manager=Aroha --target-finish=2027-01-31 --actor=Mere','update tasks <id> --percent-complete=100 --evidence=acceptance-reference --actor=Aroha','import celoxis --project=Example --file=tasks.csv --actor=Aroha --dry-run']};
 if(cmd==='show')return resolve(db,tableName(entity),term);
 if(cmd==='import'){if(entity!=='celoxis')throw Error('Only import celoxis is supported');return importCeloxis(db,o);}
 if(cmd==='export'){const result={version:1,exported_at:new Date().toISOString()};for(const t of [...Object.keys(entities),'dependencies','notes','audit_log'])result[t]=await db.query(`select * from ${t} order by id`);if(o.file){const f=path.resolve(need(o,'file'));mkdirSync(path.dirname(f),{recursive:true});writeFileSync(f,JSON.stringify(result,null,2)+'\n',{flag:'wx'});return {file:f,counts:Object.fromEntries(Object.entries(result).filter(([,v])=>Array.isArray(v)).map(([k,v])=>[k,v.length]))};}return result;}
 if(['weekly-review','draft-steering-pack','draft-change-request'].includes(cmd)){
 const readNames=cmd==='draft-change-request'?['changes','budgets','milestones']:['portfolio','attention','capacity','risks','decisions','compliance'];
 const chunks=[];for(const name of readNames)chunks.push(`## ${name}\n\n${format(await db.query(reads[name]))}`);
 const content=`# ${cmd.replaceAll('-',' ')}\n\nDraft only. Review figures, scope and decisions before sharing.\n\n${chunks.join('\n\n')}\n`;
 const dir=path.join(REPO_ROOT,'drafts');mkdirSync(dir,{recursive:true});const file=path.join(dir,`${cmd}-${Date.now()}.md`);writeFileSync(file,content,{flag:'wx'});return {file,content};
 }
 if(!['add','update','log','depend','approve-change','reject-change','close-project'].includes(cmd))throw Error(`Unknown command ${cmd}; run help`);
 const actor=need(o,'actor');
 return transaction(db,async()=>{
 if(cmd==='add'||cmd==='update'){
 const t=tableName(entity),out=await fields(db,t,o);let before=null;
 if(cmd==='update'){before=await resolve(db,t,term);before=(await db.query(`select * from ${t} where id=$1 for update`,[before.id]))[0];}
 if(t==='changes'){if(cmd==='update'&&before.status!=='pending')throw Error('Decided change is immutable');if(cmd==='add')out.requested_by=actor;}
 if(before){for(const k of ['project_id','task_id','person_id'])if(k in out&&out[k]!==before[k])throw Error('Cannot move an existing record between parents');}
 if(t==='projects'&&before&&before.status!=='proposed'&&['budget','target_finish','currency'].some(k=>k in out))throw Error('Use a change request for an active baseline; currency is fixed');
 if(t==='projects'&&out.status==='closed')throw Error('Use close-project to check open work');
 if(t==='projects'&&before?.status==='closed')throw Error('Closed projects are immutable; record a new project');
 if(t==='tasks'&&before&&out.baseline_finish)throw Error('Baseline is fixed; propose a change and record the revised finish');
 const projectId=out.project_id||before?.project_id;
 if(projectId){const [p]=await db.query('select * from projects where id=$1 for update',[projectId]);if(!p)throw Error('Project not found');if(p.status==='closed')throw Error('Cannot write records in a closed project');}
 if(t==='time_entries'){const task=await resolve(db,'tasks',out.task_id||before?.task_id);const p=await resolve(db,'projects',task.project_id);if(p.status==='closed')throw Error('Cannot log time in a closed project');}
 if(t==='tasks'){
 if(cmd==='add'&&!out.baseline_finish)out.baseline_finish=out.finish_date;
 const merged={...before,...out};if(merged.milestone===true&&Number(merged.percent_complete)===100&&!merged.evidence?.trim())throw Error('Completed milestone requires acceptance evidence');
 if(cmd==='update')out.last_update=new Date().toISOString().slice(0,10);
 }
 const keys=Object.keys(out);if(!keys.length)throw Error('No fields provided');
 const vals=keys.map(k=>out[k]);const sql=cmd==='add'?`insert into ${t}(${keys.join(',')}) values(${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`:`update ${t} set ${keys.map((k,i)=>k+'=$'+(i+1)).join(',')} where id=$${keys.length+1} returning *`;
 if(before)vals.push(before.id);const [after]=await db.query(sql,vals);await audit(db,actor,cmd,t,before,after);return after;
 }
 if(cmd==='log'){const p=await resolve(db,'projects',need(o,'project'));const [r]=await db.query('insert into notes(project_id,name,actor) values($1,$2,$3) returning *',[p.id,need(o,'text'),actor]);await audit(db,actor,'log','notes',null,r);return r;}
 if(cmd==='depend'){
 const task=await resolve(db,'tasks',need(o,'task')),pre=await resolve(db,'tasks',need(o,'predecessor'));
 await db.exec('lock table dependencies in share row exclusive mode');
 const cycle=await db.query(`with recursive chain(id) as (select predecessor_id from dependencies where task_id=$1 union select d.predecessor_id from dependencies d join chain c on d.task_id=c.id) select id from chain where id=$2`,[pre.id,task.id]);
 if(task.id===pre.id||cycle.length)throw Error('Dependency would create a cycle');
 const [r]=await db.query('insert into dependencies(task_id,predecessor_id) values($1,$2) returning *',[task.id,pre.id]);await audit(db,actor,'depend','dependencies',null,r);return r;
 }
 if(cmd==='approve-change'||cmd==='reject-change'){
 let c=await resolve(db,'changes',entity);[c]=await db.query('select * from changes where id=$1 for update',[c.id]);
 if(c.status!=='pending')throw Error('Change already decided');
 if(c.requested_by.toLowerCase()===actor.toLowerCase())throw Error('A second person must decide a change');
 const [project]=await db.query('select * from projects where id=$1 for update',[c.project_id]);if(project.status==='closed')throw Error('Project is closed');
 if(cmd==='approve-change'){const [p]=await db.query('select approved_budget from portfolio_status where id=$1',[c.project_id]);if(Number(p.approved_budget)+Number(c.cost_delta)<0)throw Error('Approved budget cannot be negative');}
 const [r]=await db.query('update changes set status=$1,decided_by=$2,decision_note=$3,decided_at=now() where id=$4 returning *',[cmd==='approve-change'?'approved':'rejected',actor,need(o,'note'),c.id]);await audit(db,actor,cmd,'changes',c,r);return r;
 }
 if(cmd==='close-project'){
 let p=await resolve(db,'projects',entity);[p]=await db.query('select * from projects where id=$1 for update',[p.id]);if(p.status==='closed')throw Error('Project already closed');
 const [c]=await db.query(`select (select count(*) from tasks where project_id=$1 and (percent_complete<100 or (milestone and evidence=''))) tasks,(select count(*) from risks where project_id=$1 and status='open') risks,(select count(*) from changes where project_id=$1 and status='pending') changes,(select count(*) from decisions where project_id=$1 and outcome='') decisions`,[p.id]);
 if(Object.values(c).some(n=>Number(n)>0))throw Error(`Cannot close: ${JSON.stringify(c)}`);
 if(!p.retention_review||!p.benefit_owner||!p.benefit_due)throw Error('Set retention review and benefit owner/date before closing');
 const [r]=await db.query("update projects set status='closed' where id=$1 returning *",[p.id]);await audit(db,actor,'close-project','projects',p,r);return r;
 }
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{db=await getDb();const result=await execute(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(result,null,2):format(result));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}}
