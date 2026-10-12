begin;
insert into projects(id,name,sponsor,manager,budget,target_finish,status,business_case,expected_benefit,benefit_owner,benefit_due,retention_review) values
('10000000-0000-0000-0000-000000000001','Warehouse renewal','Mere','Aroha',85000,current_date+30,'active','Replace ageing dispatch process','Reduce dispatch rework','Mere',current_date-3,current_date+365),
('10000000-0000-0000-0000-000000000002','Customer portal','Ravi','Priya',50000,current_date+60,'active','Expose shipment status to customers','Reduce status calls','Ravi',current_date+90,current_date+365),
('10000000-0000-0000-0000-000000000003','Legacy reporting','Mere','Aroha',20000,current_date-90,'closed','Historical reporting','Retire spreadsheets','Mere',current_date-30,current_date-1)
on conflict(id) do nothing;
insert into people(id,name,role,weekly_hours,purpose,retention_review) values
('20000000-0000-0000-0000-000000000001','Aroha','Delivery lead',32,'Project allocation',current_date+365),
('20000000-0000-0000-0000-000000000002','Priya','Analyst',40,'Project allocation',current_date+365),
('20000000-0000-0000-0000-000000000003','Former contractor','Consultant',0,'',current_date-30)
on conflict(id) do nothing;
insert into tasks(id,project_id,name,owner,start_date,finish_date,baseline_finish,percent_complete,planned_hours,milestone,last_update) values
('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Dispatch acceptance','Aroha',current_date-20,current_date-2,current_date-10,70,80,true,current_date-18),
('30000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','Portal pilot','Priya',current_date-5,current_date+14,current_date+7,20,120,true,current_date-1),
('30000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','Training sign-off','Aroha',current_date-10,current_date+7,current_date+7,0,24,true,current_date-16)
on conflict(id) do nothing;
insert into dependencies(id,task_id,predecessor_id) values('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001') on conflict(id) do nothing;
insert into allocations(id,project_id,person_id,week_start,hours) values
('50000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',date_trunc('week',current_date)::date,24),
('50000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001',date_trunc('week',current_date)::date,20),
('50000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002',date_trunc('week',current_date)::date,30)
on conflict(id) do nothing;
insert into expenses(id,project_id,name,amount,incurred_on,evidence) values
('60000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Equipment and implementation',81000,current_date-12,'PO-DEMO-001'),
('60000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','Pilot hosting',1200,current_date-5,'')
on conflict(id) do nothing;
insert into time_entries(id,task_id,person_id,worked_on,hours,cost_rate,description) values
('70000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',current_date-2,80,100,'Cumulative demo work') on conflict(id) do nothing;
insert into risks(id,project_id,name,owner,likelihood,impact,mitigation,review_due) values
('80000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Supplier acceptance delay','Aroha',4,5,'Request witnessed acceptance',current_date-4),
('80000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','Pilot support cover','Priya',3,3,'',current_date+4)
on conflict(id) do nothing;
insert into changes(id,project_id,name,requested_by,reason,cost_delta,finish_delta_days) values
('90000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Extra acceptance round','Aroha','Supplier retest',6000,7) on conflict(id) do nothing;
insert into decisions(id,project_id,name,owner,due_date) values
('a0000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','Confirm pilot customer cohort','Ravi',current_date-2) on conflict(id) do nothing;
commit;
