SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."departments" ("id", "name", "code", "description", "is_active", "created_at", "updated_at") VALUES
	('cd1bf40d-6d5f-48ad-8256-9469eb8692db', '경영지원팀', 'MGMT', '경영 및 행정 지원', true, '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00'),
	('8354d709-a44f-499e-909f-d5ec1a8048c7', '개발팀', 'DEV', '소프트웨어 개발', true, '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00'),
	('2a060f6d-69c1-44d6-942b-0743e46bdca7', '디자인팀', 'DESIGN', '디자인 및 UI/UX', true, '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00'),
	('ce3a48cc-dc02-4c50-97ce-a0b91b996380', '마케팅팀', 'MARKETING', '마케팅 및 홍보', true, '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00'),
	('8d45c20c-7626-416e-9821-882ca9b285dc', '매장운영팀', 'STORE', '매장 운영 및 관리', true, '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00'),
	('0af79f9f-7c9c-4686-a889-1699f0024228', '본사', 'HQ', '본사 직원', true, '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00'),
	('1aa7abe8-15f0-4fbf-bd81-d731516b62c3', 'STE', 'STE', 'STE 부서', true, '2025-08-19 23:48:31.251182+00', '2025-08-19 23:48:31.251182+00');


--
-- Data for Name: positions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."positions" ("id", "name", "level", "description", "created_at", "updated_at") VALUES
	('4c789c18-6e10-462d-820f-7b3d9bfa8eb0', '대표이사', 1, 'CEO', '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00'),
	('1e7e6331-3821-4e56-90d5-f9c958de99e3', '이사', 2, 'Director', '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00'),
	('4c896d6f-f3fb-42b9-97cf-1e22bbc061d9', '부장', 3, 'General Manager', '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00'),
	('12b783c9-e47a-4e10-ae26-b234d3bdb36d', '차장', 4, 'Deputy General Manager', '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00'),
	('ac945681-0023-4de2-99ba-6b3114dcbdc7', '과장', 5, 'Manager', '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00'),
	('79600df3-f6d0-4ba7-a9a5-a1beacfd1445', '대리', 6, 'Assistant Manager', '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00'),
	('dc6992bd-6c84-4b8f-8e13-6f7e4bd53a5d', '주임', 7, 'Senior Staff', '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00'),
	('c9d6b29a-f792-4304-b270-9cfafc47e0b4', '사원', 8, 'Staff', '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00'),
	('1cecfdeb-4291-4976-8feb-2060e4305a5d', '인턴', 9, 'Intern', '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00'),
	('5bd1c281-ab07-4844-b49d-ed738f901056', '파트타임', 10, 'Part-time', '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00');


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."roles" ("id", "name", "description", "permissions", "created_at", "updated_at") VALUES
	('b724ff0c-01f8-4aa4-866f-ac67a616af32', 'admin', '시스템 관리자', '{"all": true}', '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00'),
	('60989e55-424d-40cc-a812-1d142aa1899f', 'manager', '매니저/팀장', '{"tasks": true, "salaries": true, "employees": true, "schedules": true}', '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00'),
	('031acab2-dd14-41d1-bfa2-920cc9a20110', 'team_lead', '팀 리더', '{"team_tasks": true, "team_reports": true, "team_schedules": true}', '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00'),
	('fb0642fb-0384-4319-ab26-e5d954871d4b', 'employee', '일반 직원', '{"self": true, "view_schedules": true}', '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00'),
	('5d42886e-6446-4142-b657-1d45ed508267', 'part_time', '파트타임 직원', '{"self": true, "view_schedules": true}', '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00');


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."employees" ("id", "employee_id", "email", "name", "phone", "password_hash", "department_id", "position_id", "role_id", "birth_date", "address", "emergency_contact", "bank_account", "hire_date", "resignation_date", "employment_type", "hourly_rate", "monthly_salary", "status", "is_active", "profile_image_url", "bio", "skills", "user_meta", "last_login", "created_at", "updated_at", "nickname", "pin_code") VALUES
	('15dd4bca-c08f-45e8-b6b2-7eadad0cc7cc', 'MASLABS-004', 'park.jin@maslabs.kr', '박진(JIN)', '010-9132-4337', '91324337', '8d45c20c-7626-416e-9821-882ca9b285dc', '5bd1c281-ab07-4844-b49d-ed738f901056', '5d42886e-6446-4142-b657-1d45ed508267', NULL, NULL, NULL, NULL, '2025-07-29', NULL, 'full_time', 12000.00, NULL, 'active', true, NULL, NULL, NULL, '{}', '2025-08-19 23:32:48.335+00', '2025-08-19 23:20:20.305507+00', '2025-08-19 23:32:48.349466+00', 'JIN', '1234'),
	('513726f9-d1ff-4fd8-92a0-49ae128ad8e9', 'MASLABS-001', 'admin@maslabs.kr', '시스템 관리자', '010-6669-9000', '66699000', '0af79f9f-7c9c-4686-a889-1699f0024228', '4c789c18-6e10-462d-820f-7b3d9bfa8eb0', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', NULL, NULL, NULL, NULL, '2025-08-19', NULL, 'full_time', NULL, NULL, 'active', true, NULL, NULL, NULL, '{}', '2025-08-19 23:36:30.116+00', '2025-08-19 23:20:19.68522+00', '2025-08-19 23:36:30.121583+00', NULL, '1234'),
	('7cef08a3-3222-46de-825f-5325bbf10c5a', 'MASLABS-002', 'lee.eunjung@maslabs.kr', '이은정(STE)', '010-3243-3099', '32433099', NULL, '1e7e6331-3821-4e56-90d5-f9c958de99e3', '60989e55-424d-40cc-a812-1d142aa1899f', NULL, NULL, NULL, NULL, '2025-01-01', NULL, 'full_time', NULL, NULL, 'active', true, NULL, NULL, NULL, '{}', '2025-08-19 23:50:42.712+00', '2025-08-19 23:48:25.666304+00', '2025-08-19 23:50:42.61596+00', NULL, '1234');


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."audit_logs" ("id", "user_id", "user_name", "user_role", "action", "entity_type", "entity_id", "old_values", "new_values", "ip_address", "user_agent", "request_method", "request_path", "success", "error_message", "created_at") VALUES
	('d0926f89-24c1-4eb4-8599-ac8f180c730d', NULL, NULL, NULL, 'INSERT', 'employees', '513726f9-d1ff-4fd8-92a0-49ae128ad8e9', NULL, '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-0000-0000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": null, "updated_at": "2025-08-19T23:20:19.68522+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": null, "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', NULL, NULL, NULL, NULL, true, NULL, '2025-08-19 23:20:19.68522+00'),
	('b372b5b0-2fc5-4589-878a-df4621699704', NULL, NULL, NULL, 'UPDATE', 'employees', '513726f9-d1ff-4fd8-92a0-49ae128ad8e9', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-0000-0000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": null, "updated_at": "2025-08-19T23:20:19.68522+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": null, "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-0000-0000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": null, "updated_at": "2025-08-19T23:20:20.305507+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', NULL, NULL, NULL, NULL, true, NULL, '2025-08-19 23:20:20.305507+00'),
	('9366faa9-feb9-4d60-ac5b-8fdacd87b64e', NULL, NULL, NULL, 'INSERT', 'employees', '15dd4bca-c08f-45e8-b6b2-7eadad0cc7cc', NULL, '{"id": "15dd4bca-c08f-45e8-b6b2-7eadad0cc7cc", "bio": null, "name": "박진(JIN)", "email": "park.jin@maslabs.kr", "phone": "010-9132-4337", "skills": null, "status": "active", "address": null, "role_id": "5d42886e-6446-4142-b657-1d45ed508267", "hire_date": "2025-07-29", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:20.305507+00:00", "last_login": null, "updated_at": "2025-08-19T23:20:20.305507+00:00", "employee_id": "MASLABS-004", "hourly_rate": 12000.00, "position_id": "5bd1c281-ab07-4844-b49d-ed738f901056", "bank_account": null, "department_id": "8d45c20c-7626-416e-9821-882ca9b285dc", "password_hash": "91324337", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', NULL, NULL, NULL, NULL, true, NULL, '2025-08-19 23:20:20.305507+00'),
	('472c137c-788e-4786-8284-dcac387e81e0', NULL, NULL, NULL, 'UPDATE', 'employees', '15dd4bca-c08f-45e8-b6b2-7eadad0cc7cc', '{"id": "15dd4bca-c08f-45e8-b6b2-7eadad0cc7cc", "bio": null, "name": "박진(JIN)", "email": "park.jin@maslabs.kr", "phone": "010-9132-4337", "skills": null, "status": "active", "address": null, "role_id": "5d42886e-6446-4142-b657-1d45ed508267", "nickname": null, "pin_code": null, "hire_date": "2025-07-29", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:20.305507+00:00", "last_login": null, "updated_at": "2025-08-19T23:20:20.305507+00:00", "employee_id": "MASLABS-004", "hourly_rate": 12000.00, "position_id": "5bd1c281-ab07-4844-b49d-ed738f901056", "bank_account": null, "department_id": "8d45c20c-7626-416e-9821-882ca9b285dc", "password_hash": "91324337", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', '{"id": "15dd4bca-c08f-45e8-b6b2-7eadad0cc7cc", "bio": null, "name": "박진(JIN)", "email": "park.jin@maslabs.kr", "phone": "010-9132-4337", "skills": null, "status": "active", "address": null, "role_id": "5d42886e-6446-4142-b657-1d45ed508267", "nickname": "JIN", "pin_code": "1234", "hire_date": "2025-07-29", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:20.305507+00:00", "last_login": null, "updated_at": "2025-08-19T23:20:20.311825+00:00", "employee_id": "MASLABS-004", "hourly_rate": 12000.00, "position_id": "5bd1c281-ab07-4844-b49d-ed738f901056", "bank_account": null, "department_id": "8d45c20c-7626-416e-9821-882ca9b285dc", "password_hash": "91324337", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', NULL, NULL, NULL, NULL, true, NULL, '2025-08-19 23:20:20.311825+00'),
	('1fbe0220-120c-4524-b707-a75f485835a1', NULL, NULL, NULL, 'UPDATE', 'employees', '513726f9-d1ff-4fd8-92a0-49ae128ad8e9', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-0000-0000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": null, "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": null, "updated_at": "2025-08-19T23:20:20.305507+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-0000-0000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": null, "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": null, "updated_at": "2025-08-19T23:20:20.318707+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', NULL, NULL, NULL, NULL, true, NULL, '2025-08-19 23:20:20.318707+00'),
	('fb9a52c9-35fe-4140-bd0e-1c2ae53365b3', NULL, NULL, NULL, 'UPDATE', 'employees', '15dd4bca-c08f-45e8-b6b2-7eadad0cc7cc', '{"id": "15dd4bca-c08f-45e8-b6b2-7eadad0cc7cc", "bio": null, "name": "박진(JIN)", "email": "park.jin@maslabs.kr", "phone": "010-9132-4337", "skills": null, "status": "active", "address": null, "role_id": "5d42886e-6446-4142-b657-1d45ed508267", "nickname": "JIN", "pin_code": "1234", "hire_date": "2025-07-29", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:20.305507+00:00", "last_login": null, "updated_at": "2025-08-19T23:20:20.311825+00:00", "employee_id": "MASLABS-004", "hourly_rate": 12000.00, "position_id": "5bd1c281-ab07-4844-b49d-ed738f901056", "bank_account": null, "department_id": "8d45c20c-7626-416e-9821-882ca9b285dc", "password_hash": "91324337", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', '{"id": "15dd4bca-c08f-45e8-b6b2-7eadad0cc7cc", "bio": null, "name": "박진(JIN)", "email": "park.jin@maslabs.kr", "phone": "010-9132-4337", "skills": null, "status": "active", "address": null, "role_id": "5d42886e-6446-4142-b657-1d45ed508267", "nickname": "JIN", "pin_code": "1234", "hire_date": "2025-07-29", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:20.305507+00:00", "last_login": null, "updated_at": "2025-08-19T23:20:20.318707+00:00", "employee_id": "MASLABS-004", "hourly_rate": 12000.00, "position_id": "5bd1c281-ab07-4844-b49d-ed738f901056", "bank_account": null, "department_id": "8d45c20c-7626-416e-9821-882ca9b285dc", "password_hash": "91324337", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', NULL, NULL, NULL, NULL, true, NULL, '2025-08-19 23:20:20.318707+00'),
	('655f8787-3f05-40f5-a606-62a3d580155d', NULL, NULL, NULL, 'UPDATE', 'employees', '513726f9-d1ff-4fd8-92a0-49ae128ad8e9', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-0000-0000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": null, "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": null, "updated_at": "2025-08-19T23:20:20.318707+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-6669-9000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": null, "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": null, "updated_at": "2025-08-19T23:20:46.899714+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', NULL, NULL, NULL, NULL, true, NULL, '2025-08-19 23:20:46.899714+00'),
	('50a4989f-0bf9-428f-9372-6a1579dd62f7', NULL, NULL, NULL, 'UPDATE', 'employees', '513726f9-d1ff-4fd8-92a0-49ae128ad8e9', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-6669-9000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": null, "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": null, "updated_at": "2025-08-19T23:20:46.899714+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-6669-9000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": null, "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": null, "updated_at": "2025-08-19T23:20:58.959317+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', NULL, NULL, NULL, NULL, true, NULL, '2025-08-19 23:20:58.959317+00'),
	('e0fa7aad-edc3-4dab-96a4-bbdd44da3177', NULL, NULL, NULL, 'UPDATE', 'employees', '513726f9-d1ff-4fd8-92a0-49ae128ad8e9', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-6669-9000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": null, "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": null, "updated_at": "2025-08-19T23:20:58.959317+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-6669-9000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": null, "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": "2025-08-19T23:21:28.297+00:00", "updated_at": "2025-08-19T23:21:28.32584+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', NULL, NULL, NULL, NULL, true, NULL, '2025-08-19 23:21:28.32584+00'),
	('3b80a98b-0d2b-4de2-a605-4bde73732745', NULL, NULL, NULL, 'UPDATE', 'employees', '513726f9-d1ff-4fd8-92a0-49ae128ad8e9', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-6669-9000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": null, "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": "2025-08-19T23:21:28.297+00:00", "updated_at": "2025-08-19T23:21:28.32584+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-6669-9000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": null, "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": "2025-08-19T23:21:28.479+00:00", "updated_at": "2025-08-19T23:21:28.514977+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', NULL, NULL, NULL, NULL, true, NULL, '2025-08-19 23:21:28.514977+00'),
	('72c65092-8bcd-4144-bd55-8dcd9b7e9a36', NULL, NULL, NULL, 'UPDATE', 'employees', '513726f9-d1ff-4fd8-92a0-49ae128ad8e9', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-6669-9000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": null, "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": "2025-08-19T23:21:28.479+00:00", "updated_at": "2025-08-19T23:21:28.514977+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-6669-9000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": null, "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": "2025-08-19T23:21:28.543+00:00", "updated_at": "2025-08-19T23:21:28.550708+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', NULL, NULL, NULL, NULL, true, NULL, '2025-08-19 23:21:28.550708+00'),
	('7e9398ba-f766-493a-bf9f-96fa82daa986', NULL, NULL, NULL, 'UPDATE', 'employees', '513726f9-d1ff-4fd8-92a0-49ae128ad8e9', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-6669-9000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": null, "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": "2025-08-19T23:21:28.543+00:00", "updated_at": "2025-08-19T23:21:28.550708+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-6669-9000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": null, "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": "2025-08-19T23:21:28.669+00:00", "updated_at": "2025-08-19T23:21:28.696738+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', NULL, NULL, NULL, NULL, true, NULL, '2025-08-19 23:21:28.696738+00'),
	('b1c2afbb-bd41-45b6-a5f5-fb36f3e61d7b', NULL, NULL, NULL, 'UPDATE', 'employees', '513726f9-d1ff-4fd8-92a0-49ae128ad8e9', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-6669-9000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": null, "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": "2025-08-19T23:21:28.669+00:00", "updated_at": "2025-08-19T23:21:28.696738+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-6669-9000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": null, "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": "2025-08-19T23:28:29.532+00:00", "updated_at": "2025-08-19T23:28:29.726624+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', NULL, NULL, NULL, NULL, true, NULL, '2025-08-19 23:28:29.726624+00'),
	('d4f3b432-28ae-4c3a-b5a4-f2bc2530f7cf', NULL, NULL, NULL, 'UPDATE', 'employees', '513726f9-d1ff-4fd8-92a0-49ae128ad8e9', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-6669-9000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": null, "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": "2025-08-19T23:28:29.532+00:00", "updated_at": "2025-08-19T23:28:29.726624+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-6669-9000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": null, "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": "2025-08-19T23:28:29.513+00:00", "updated_at": "2025-08-19T23:28:29.700425+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', NULL, NULL, NULL, NULL, true, NULL, '2025-08-19 23:28:29.700425+00'),
	('db7227be-086a-4bab-b436-e6e613146b2b', NULL, NULL, NULL, 'UPDATE', 'employees', '513726f9-d1ff-4fd8-92a0-49ae128ad8e9', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-6669-9000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": null, "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": "2025-08-19T23:28:29.513+00:00", "updated_at": "2025-08-19T23:28:29.700425+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-6669-9000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": null, "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": "2025-08-19T23:28:29.527+00:00", "updated_at": "2025-08-19T23:28:29.718987+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', NULL, NULL, NULL, NULL, true, NULL, '2025-08-19 23:28:29.718987+00'),
	('ce2e30bb-56fd-4625-8283-37cccc344504', NULL, NULL, NULL, 'UPDATE', 'employees', '513726f9-d1ff-4fd8-92a0-49ae128ad8e9', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-6669-9000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": null, "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": "2025-08-19T23:28:29.527+00:00", "updated_at": "2025-08-19T23:28:29.718987+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-6669-9000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": null, "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": "2025-08-19T23:28:29.519+00:00", "updated_at": "2025-08-19T23:28:29.700333+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', NULL, NULL, NULL, NULL, true, NULL, '2025-08-19 23:28:29.700333+00'),
	('0346359a-f043-4657-8fbb-006d924078a3', NULL, NULL, NULL, 'UPDATE', 'employees', '513726f9-d1ff-4fd8-92a0-49ae128ad8e9', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-6669-9000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": null, "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": "2025-08-19T23:28:29.519+00:00", "updated_at": "2025-08-19T23:28:29.700333+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-6669-9000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": null, "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": "2025-08-19T23:31:24.71+00:00", "updated_at": "2025-08-19T23:31:24.703624+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', NULL, NULL, NULL, NULL, true, NULL, '2025-08-19 23:31:24.703624+00'),
	('f19db0f8-f1e2-4bbf-a04e-bf8eed032820', NULL, NULL, NULL, 'UPDATE', 'employees', '513726f9-d1ff-4fd8-92a0-49ae128ad8e9', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-6669-9000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": null, "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": "2025-08-19T23:31:24.71+00:00", "updated_at": "2025-08-19T23:31:24.703624+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-6669-9000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": "6669", "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": "2025-08-19T23:31:24.71+00:00", "updated_at": "2025-08-19T23:32:19.56117+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', NULL, NULL, NULL, NULL, true, NULL, '2025-08-19 23:32:19.56117+00'),
	('e3328286-1899-422e-aeea-4378dca7fcc7', NULL, NULL, NULL, 'UPDATE', 'employees', '15dd4bca-c08f-45e8-b6b2-7eadad0cc7cc', '{"id": "15dd4bca-c08f-45e8-b6b2-7eadad0cc7cc", "bio": null, "name": "박진(JIN)", "email": "park.jin@maslabs.kr", "phone": "010-9132-4337", "skills": null, "status": "active", "address": null, "role_id": "5d42886e-6446-4142-b657-1d45ed508267", "nickname": "JIN", "pin_code": "1234", "hire_date": "2025-07-29", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:20.305507+00:00", "last_login": null, "updated_at": "2025-08-19T23:20:20.318707+00:00", "employee_id": "MASLABS-004", "hourly_rate": 12000.00, "position_id": "5bd1c281-ab07-4844-b49d-ed738f901056", "bank_account": null, "department_id": "8d45c20c-7626-416e-9821-882ca9b285dc", "password_hash": "91324337", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', '{"id": "15dd4bca-c08f-45e8-b6b2-7eadad0cc7cc", "bio": null, "name": "박진(JIN)", "email": "park.jin@maslabs.kr", "phone": "010-9132-4337", "skills": null, "status": "active", "address": null, "role_id": "5d42886e-6446-4142-b657-1d45ed508267", "nickname": "JIN", "pin_code": "1234", "hire_date": "2025-07-29", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:20.305507+00:00", "last_login": "2025-08-19T23:32:48.335+00:00", "updated_at": "2025-08-19T23:32:48.349466+00:00", "employee_id": "MASLABS-004", "hourly_rate": 12000.00, "position_id": "5bd1c281-ab07-4844-b49d-ed738f901056", "bank_account": null, "department_id": "8d45c20c-7626-416e-9821-882ca9b285dc", "password_hash": "91324337", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', NULL, NULL, NULL, NULL, true, NULL, '2025-08-19 23:32:48.349466+00'),
	('c8cab3b4-d2a1-4e75-a0e3-9572a838a324', NULL, NULL, NULL, 'UPDATE', 'employees', '513726f9-d1ff-4fd8-92a0-49ae128ad8e9', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-6669-9000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": "6669", "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": "2025-08-19T23:31:24.71+00:00", "updated_at": "2025-08-19T23:32:19.56117+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-6669-9000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": "1234", "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": "2025-08-19T23:31:24.71+00:00", "updated_at": "2025-08-19T23:33:45.927159+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', NULL, NULL, NULL, NULL, true, NULL, '2025-08-19 23:33:45.927159+00'),
	('957e0989-4de9-477b-b7fd-3c58ab1a4d84', NULL, NULL, NULL, 'UPDATE', 'employees', '513726f9-d1ff-4fd8-92a0-49ae128ad8e9', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-6669-9000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": "1234", "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": "2025-08-19T23:31:24.71+00:00", "updated_at": "2025-08-19T23:33:45.927159+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', '{"id": "513726f9-d1ff-4fd8-92a0-49ae128ad8e9", "bio": null, "name": "시스템 관리자", "email": "admin@maslabs.kr", "phone": "010-6669-9000", "skills": null, "status": "active", "address": null, "role_id": "b724ff0c-01f8-4aa4-866f-ac67a616af32", "nickname": null, "pin_code": "1234", "hire_date": "2025-08-19", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:20:19.68522+00:00", "last_login": "2025-08-19T23:36:30.116+00:00", "updated_at": "2025-08-19T23:36:30.121583+00:00", "employee_id": "MASLABS-001", "hourly_rate": null, "position_id": "4c789c18-6e10-462d-820f-7b3d9bfa8eb0", "bank_account": null, "department_id": "0af79f9f-7c9c-4686-a889-1699f0024228", "password_hash": "66699000", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', NULL, NULL, NULL, NULL, true, NULL, '2025-08-19 23:36:30.121583+00'),
	('266ad11c-a451-45e6-8c14-21afbfff8ec2', NULL, NULL, NULL, 'INSERT', 'employees', '7cef08a3-3222-46de-825f-5325bbf10c5a', NULL, '{"id": "7cef08a3-3222-46de-825f-5325bbf10c5a", "bio": null, "name": "이은정(STE)", "email": "lee.eunjung@maslabs.kr", "phone": "010-3243-3099", "skills": null, "status": "active", "address": null, "role_id": "60989e55-424d-40cc-a812-1d142aa1899f", "nickname": null, "pin_code": "1234", "hire_date": "2025-01-01", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:48:25.666304+00:00", "last_login": null, "updated_at": "2025-08-19T23:48:25.666304+00:00", "employee_id": "MASLABS-002", "hourly_rate": null, "position_id": "1e7e6331-3821-4e56-90d5-f9c958de99e3", "bank_account": null, "department_id": null, "password_hash": "32433099", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', NULL, NULL, NULL, NULL, true, NULL, '2025-08-19 23:48:25.666304+00'),
	('8c136fd2-4337-4a7b-9408-11844d3c1d2e', NULL, NULL, NULL, 'UPDATE', 'employees', '7cef08a3-3222-46de-825f-5325bbf10c5a', '{"id": "7cef08a3-3222-46de-825f-5325bbf10c5a", "bio": null, "name": "이은정(STE)", "email": "lee.eunjung@maslabs.kr", "phone": "010-3243-3099", "skills": null, "status": "active", "address": null, "role_id": "60989e55-424d-40cc-a812-1d142aa1899f", "nickname": null, "pin_code": "1234", "hire_date": "2025-01-01", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:48:25.666304+00:00", "last_login": null, "updated_at": "2025-08-19T23:48:25.666304+00:00", "employee_id": "MASLABS-002", "hourly_rate": null, "position_id": "1e7e6331-3821-4e56-90d5-f9c958de99e3", "bank_account": null, "department_id": null, "password_hash": "32433099", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', '{"id": "7cef08a3-3222-46de-825f-5325bbf10c5a", "bio": null, "name": "이은정(STE)", "email": "lee.eunjung@maslabs.kr", "phone": "010-3243-3099", "skills": null, "status": "active", "address": null, "role_id": "60989e55-424d-40cc-a812-1d142aa1899f", "nickname": null, "pin_code": "1234", "hire_date": "2025-01-01", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:48:25.666304+00:00", "last_login": "2025-08-19T23:50:42.712+00:00", "updated_at": "2025-08-19T23:50:42.568731+00:00", "employee_id": "MASLABS-002", "hourly_rate": null, "position_id": "1e7e6331-3821-4e56-90d5-f9c958de99e3", "bank_account": null, "department_id": null, "password_hash": "32433099", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', NULL, NULL, NULL, NULL, true, NULL, '2025-08-19 23:50:42.568731+00'),
	('ece362db-1612-4b84-a89d-ce75cdf8b7db', NULL, NULL, NULL, 'UPDATE', 'employees', '7cef08a3-3222-46de-825f-5325bbf10c5a', '{"id": "7cef08a3-3222-46de-825f-5325bbf10c5a", "bio": null, "name": "이은정(STE)", "email": "lee.eunjung@maslabs.kr", "phone": "010-3243-3099", "skills": null, "status": "active", "address": null, "role_id": "60989e55-424d-40cc-a812-1d142aa1899f", "nickname": null, "pin_code": "1234", "hire_date": "2025-01-01", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:48:25.666304+00:00", "last_login": "2025-08-19T23:50:42.712+00:00", "updated_at": "2025-08-19T23:50:42.568731+00:00", "employee_id": "MASLABS-002", "hourly_rate": null, "position_id": "1e7e6331-3821-4e56-90d5-f9c958de99e3", "bank_account": null, "department_id": null, "password_hash": "32433099", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', '{"id": "7cef08a3-3222-46de-825f-5325bbf10c5a", "bio": null, "name": "이은정(STE)", "email": "lee.eunjung@maslabs.kr", "phone": "010-3243-3099", "skills": null, "status": "active", "address": null, "role_id": "60989e55-424d-40cc-a812-1d142aa1899f", "nickname": null, "pin_code": "1234", "hire_date": "2025-01-01", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:48:25.666304+00:00", "last_login": "2025-08-19T23:50:42.712+00:00", "updated_at": "2025-08-19T23:50:42.545198+00:00", "employee_id": "MASLABS-002", "hourly_rate": null, "position_id": "1e7e6331-3821-4e56-90d5-f9c958de99e3", "bank_account": null, "department_id": null, "password_hash": "32433099", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', NULL, NULL, NULL, NULL, true, NULL, '2025-08-19 23:50:42.545198+00'),
	('e9a783af-ccc1-42c5-b85c-6d230ef3d9ad', NULL, NULL, NULL, 'UPDATE', 'employees', '7cef08a3-3222-46de-825f-5325bbf10c5a', '{"id": "7cef08a3-3222-46de-825f-5325bbf10c5a", "bio": null, "name": "이은정(STE)", "email": "lee.eunjung@maslabs.kr", "phone": "010-3243-3099", "skills": null, "status": "active", "address": null, "role_id": "60989e55-424d-40cc-a812-1d142aa1899f", "nickname": null, "pin_code": "1234", "hire_date": "2025-01-01", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:48:25.666304+00:00", "last_login": "2025-08-19T23:50:42.712+00:00", "updated_at": "2025-08-19T23:50:42.545198+00:00", "employee_id": "MASLABS-002", "hourly_rate": null, "position_id": "1e7e6331-3821-4e56-90d5-f9c958de99e3", "bank_account": null, "department_id": null, "password_hash": "32433099", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', '{"id": "7cef08a3-3222-46de-825f-5325bbf10c5a", "bio": null, "name": "이은정(STE)", "email": "lee.eunjung@maslabs.kr", "phone": "010-3243-3099", "skills": null, "status": "active", "address": null, "role_id": "60989e55-424d-40cc-a812-1d142aa1899f", "nickname": null, "pin_code": "1234", "hire_date": "2025-01-01", "is_active": true, "user_meta": {}, "birth_date": null, "created_at": "2025-08-19T23:48:25.666304+00:00", "last_login": "2025-08-19T23:50:42.712+00:00", "updated_at": "2025-08-19T23:50:42.61596+00:00", "employee_id": "MASLABS-002", "hourly_rate": null, "position_id": "1e7e6331-3821-4e56-90d5-f9c958de99e3", "bank_account": null, "department_id": null, "password_hash": "32433099", "monthly_salary": null, "employment_type": "full_time", "resignation_date": null, "emergency_contact": null, "profile_image_url": null}', NULL, NULL, NULL, NULL, true, NULL, '2025-08-19 23:50:42.61596+00');


--
-- Data for Name: contracts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: operation_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."operation_types" ("id", "code", "name", "description", "category", "points", "is_active", "created_at", "updated_at") VALUES
	('220aac96-0a35-427b-bc5f-1b3cb26a0b1d', 'TL_SALES', '팀매출 달성률 측정', '팀 전체 매출 목표 대비 달성률 측정 (월간 기준)', 'team_lead', 50, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('b1fc61a8-d734-40b0-9b1a-9c79f9105560', 'TL_YOY', 'YOY 성장률 측정', '전년 대비 성장률 측정 (분기별 기준)', 'team_lead', 40, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('f46af7ac-c114-4e17-a145-e5d46ac3469e', 'TL_SCHEDULE', '스케줄 컨펌', '팀원 스케줄 승인 및 관리 (일일 기준)', 'team_lead', 20, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('0a9d682c-34aa-41f8-bff9-b3b3e05e1eef', 'TL_CS', 'CS 해결', '고객 서비스 이슈 해결 (응답시간 기준)', 'team_lead', 30, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('8f6e94f1-748f-438b-8aa8-350283189695', 'TL_TRAINING', '교육 이수', '팀원 교육 및 자기계발 (월간 기준)', 'team_lead', 25, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('042b4bcc-3fc3-4195-820d-f77bc35b13c1', 'TM_PHONE_SALE', '전화/온라인 성사', '전화 또는 온라인을 통한 판매 성사 (건당 +20P)', 'team_member', 20, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('1a5b989a-3d47-4b24-87c1-ba48df69276e', 'TM_OFFLINE_SALE', '오프라인 단독 성사', '오프라인에서 단독으로 판매 성사 (건당 +40P)', 'team_member', 40, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('beedbf4d-7d33-481e-8ff6-4805d2dbc269', 'TM_OFFLINE_ASSIST', '오프라인 보조 참여', '오프라인 판매 보조 참여 (건당 +10P)', 'team_member', 10, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('48fa1099-6d63-4aa0-8eeb-928ed063ede2', 'TM_SITA_SATISFACTION', '시타 만족도', '고객 만족도 조사 (주간 +20P)', 'team_member', 20, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('3960eb78-08c4-460e-9582-4f755af604ad', 'TM_RETURN', '반품 발생', '반품 발생 시 KPI 차감 (건당 -20P)', 'team_member', -20, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('fa5f323f-a9c5-450e-973c-fd89e0e1cb85', 'TM_RETURN_DEFENSE', '반품 방어 성공', '반품 방어 성공 시 보너스 (건당 +10P)', 'team_member', 10, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('ff94a46f-3374-4105-abf4-8bb76a4ebfee', 'MGMT_HIRING', '채용 TAT', '채용 프로세스 소요시간 관리', 'management', 30, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('6ed09aae-626b-4fe2-939c-aad7e8180fa1', 'MGMT_FUNNEL', '퍼널 방문자', '마케팅 퍼널 방문자 수 관리', 'management', 25, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('96ee0812-abbe-4c8c-9c03-e92a0f978aa8', 'MGMT_AD_CONVERSION', '광고 전환율', '광고 캠페인 전환율 관리', 'management', 35, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('cd7c93cb-ed00-49ed-a516-ba19eef457e0', 'MGMT_CONTENT_VIEWS', '콘텐츠 조회', '콘텐츠 조회수 관리', 'management', 20, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('7e3bc26b-0459-437d-8eba-e6bca1235b54', 'MGMT_AUTOMATION', '자동화/운영 지표', '업무 자동화 및 운영 효율성', 'management', 40, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('1bbc4bc0-6463-4adc-9cf6-65def34d397c', 'SALE_LEAD', '팀장 리드 판매', '팀장이 리드한 판매 (100% 인정)', 'sales', 100, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('328abbe4-3ab8-41df-8bb2-09f7b11c2b4a', 'SALE_INDIVIDUAL', '팀원 단독 판매', '팀원이 단독으로 성사한 판매', 'sales', 100, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('52a70a47-6466-419a-8147-a1a96be72de1', 'SALE_ASSIST', '보조 참여', '보조 참여 (교육 기회로만 기록)', 'sales', 0, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('f1906632-d97c-48c2-9c4f-2d0bd05428a7', 'RETURN_HANDLE', '반품 처리', '반품 발생 시 인센티브 100% 환수', 'returns', -100, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('7120dc89-edc6-426c-bce3-73411be528fb', 'DEFENSE_SUCCESS', '반품 방어 성공', '반품 방어 성공 시 보너스', 'defense', 10, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('32158c92-5048-4064-97bb-f96436ba4f18', 'DEFENSE_FAIL', '재반품 발생', '재반품 발생 시 방어자 보상 없음', 'defense', 0, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('7f48ac13-b379-4bd1-b0f3-976f6c3039c6', 'SCHEDULE_PROPOSE', '스케줄 제안', '팀원이 스케줄 제안', 'schedule', 5, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('52c6fc64-e849-42e9-a793-0ed5818b7f47', 'SCHEDULE_CONFIRM', '스케줄 컨펌', '팀장이 스케줄 승인', 'schedule', 10, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('b4aa380d-6656-4aa9-b290-a307b9e866fd', 'SCHEDULE_APPROVE', '스케줄 확정', '상위 관리자가 스케줄 최종 확정', 'schedule', 15, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('2dd57ed4-57e1-4624-bf1a-a4d091d300bc', 'ADMIN_DOCUMENT', '문서 작성', '일반 문서 작성', 'admin', 8, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('016d110e-4779-40f0-8e49-4ddc1345345f', 'ADMIN_MEETING', '회의 참석', '업무 회의 참석', 'admin', 5, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('91716b6f-e776-4789-9ed7-cfbd5b23ef46', 'ADMIN_REPORT', '보고서 작성', '업무 보고서 작성', 'admin', 12, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('10f1976c-0085-4cc1-8659-1d536fe699aa', 'TRAINING_ATTEND', '교육 참석', '교육 프로그램 참석', 'training', 10, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('02a2992a-57f7-4a5b-a710-d4384e6a978b', 'TRAINING_CONDUCT', '교육 진행', '교육 프로그램 진행', 'training', 15, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('6b952ed4-a21d-49f2-aee3-393b5031b59f', 'QUALITY_CHECK', '품질 검사', '품질 관리 및 검사', 'quality', 8, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00'),
	('f3673e65-2464-405f-a041-2e68f7b4fa99', 'MAINTENANCE', '시스템 유지보수', '시스템 및 장비 유지보수', 'maintenance', 12, true, '2025-08-19 23:20:20.211982+00', '2025-08-19 23:20:20.235991+00');


--
-- Data for Name: employee_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: operation_type_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."operation_type_permissions" ("id", "operation_type_id", "role_id", "can_create", "can_read", "can_update", "can_delete", "created_at", "updated_at") VALUES
	('1c19e63b-0916-4936-b75a-6a4426c3319c', '220aac96-0a35-427b-bc5f-1b3cb26a0b1d', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('390e243b-8ac6-4567-ba66-bda4e5530ed0', 'b1fc61a8-d734-40b0-9b1a-9c79f9105560', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('56f73c94-a2b5-4176-b4ac-143fa683d57b', 'f46af7ac-c114-4e17-a145-e5d46ac3469e', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('c6a5c5da-d23a-4ed8-b12d-07580be21a87', '0a9d682c-34aa-41f8-bff9-b3b3e05e1eef', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('14ac4c1e-3c8b-4e46-ad00-6e5ac4800ac7', '8f6e94f1-748f-438b-8aa8-350283189695', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('720fdb8c-f391-4c4a-be2a-f5d58e5d01c1', '042b4bcc-3fc3-4195-820d-f77bc35b13c1', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('7edac833-e387-491a-a715-c4bd6f233d32', '1a5b989a-3d47-4b24-87c1-ba48df69276e', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('a8572304-7aba-4d4a-99e3-cdc727020318', 'beedbf4d-7d33-481e-8ff6-4805d2dbc269', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('8d2a592d-63e1-41a6-8e00-cc3e3a737749', '48fa1099-6d63-4aa0-8eeb-928ed063ede2', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('be317413-91bd-4ff6-a293-3c089d691f81', '3960eb78-08c4-460e-9582-4f755af604ad', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('24113ee8-b17a-43e2-bdae-4736506cac4d', 'fa5f323f-a9c5-450e-973c-fd89e0e1cb85', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('b2c42cab-acda-43fb-bbc7-bb10b470231e', 'ff94a46f-3374-4105-abf4-8bb76a4ebfee', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('c1c33062-3cee-4fd7-8b56-c4eb46422eb3', '6ed09aae-626b-4fe2-939c-aad7e8180fa1', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('3673f645-1f98-41cb-ba9a-ecae2e21e15e', '96ee0812-abbe-4c8c-9c03-e92a0f978aa8', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('9fe5d5d7-eeb4-48c3-a012-8f786ed496fc', 'cd7c93cb-ed00-49ed-a516-ba19eef457e0', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('0fa79d8f-8f08-42ee-bb3a-e4de679b33df', '7e3bc26b-0459-437d-8eba-e6bca1235b54', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('73277fce-c574-43eb-b940-2b08fd4e0ea2', '1bbc4bc0-6463-4adc-9cf6-65def34d397c', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('7d654067-2dee-4277-bb93-d06aedcef266', '328abbe4-3ab8-41df-8bb2-09f7b11c2b4a', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('5a85b924-1b66-4b40-9f4d-0e9b33a5bedd', '52a70a47-6466-419a-8147-a1a96be72de1', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('47952076-43a5-4ad5-92ef-dfbdae8ee084', 'f1906632-d97c-48c2-9c4f-2d0bd05428a7', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('5e441f3d-456a-47da-ae2d-78c6b9d876ed', '7120dc89-edc6-426c-bce3-73411be528fb', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('cc26cead-ff5e-4373-9ec0-4e09df090020', '32158c92-5048-4064-97bb-f96436ba4f18', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('8e6e5592-0bbd-46ce-a4d4-08fc29c84afc', '7f48ac13-b379-4bd1-b0f3-976f6c3039c6', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('2cd59a79-2700-4a2d-b8c9-f2ceb16bc2e4', '52c6fc64-e849-42e9-a793-0ed5818b7f47', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('7bbe0edf-c102-475a-9065-b541f3e2f586', 'b4aa380d-6656-4aa9-b290-a307b9e866fd', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('b1f21755-7054-4c2f-9859-0f9759e6711f', '2dd57ed4-57e1-4624-bf1a-a4d091d300bc', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('3e2acb76-f065-4a28-814b-90fc4dfad4f7', '016d110e-4779-40f0-8e49-4ddc1345345f', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('e4a5b2ef-956e-4b15-a31b-1e8e6ca638e4', '91716b6f-e776-4789-9ed7-cfbd5b23ef46', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('9573ce20-e253-4387-88f0-7be9a17ced5b', '10f1976c-0085-4cc1-8659-1d536fe699aa', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('45f46889-322b-4d68-b7b6-c288f9ef1769', '02a2992a-57f7-4a5b-a710-d4384e6a978b', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('2ecdd401-84ba-490d-8b91-f4b7456ed82e', '6b952ed4-a21d-49f2-aee3-393b5031b59f', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('6c296a31-1da9-41d3-86fc-c46fd89d67ab', 'f3673e65-2464-405f-a041-2e68f7b4fa99', 'b724ff0c-01f8-4aa4-866f-ac67a616af32', true, true, true, true, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('074824a3-67db-4a82-9405-da830bdf3b00', '220aac96-0a35-427b-bc5f-1b3cb26a0b1d', '60989e55-424d-40cc-a812-1d142aa1899f', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('b38f5d93-dc50-40c4-a9bd-77976a51c3d8', 'b1fc61a8-d734-40b0-9b1a-9c79f9105560', '60989e55-424d-40cc-a812-1d142aa1899f', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('b6f2236f-eb11-4e5b-b35d-3cd1b6ed13b8', 'f46af7ac-c114-4e17-a145-e5d46ac3469e', '60989e55-424d-40cc-a812-1d142aa1899f', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('e7f080a9-24d3-4c71-99a1-5969e5b1518f', '0a9d682c-34aa-41f8-bff9-b3b3e05e1eef', '60989e55-424d-40cc-a812-1d142aa1899f', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('94a18c57-2405-4aa6-972c-dbe0a386ab31', '8f6e94f1-748f-438b-8aa8-350283189695', '60989e55-424d-40cc-a812-1d142aa1899f', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('e98603df-29eb-4360-ac32-ceb11944e48a', '042b4bcc-3fc3-4195-820d-f77bc35b13c1', '60989e55-424d-40cc-a812-1d142aa1899f', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('31f9c905-cb3a-4e58-bacc-1deed8f7cd67', '1a5b989a-3d47-4b24-87c1-ba48df69276e', '60989e55-424d-40cc-a812-1d142aa1899f', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('080b6d26-b36e-4f1f-ab46-69271c7597d5', 'beedbf4d-7d33-481e-8ff6-4805d2dbc269', '60989e55-424d-40cc-a812-1d142aa1899f', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('b613b704-05c2-4b70-8a00-aac84967eb9a', '48fa1099-6d63-4aa0-8eeb-928ed063ede2', '60989e55-424d-40cc-a812-1d142aa1899f', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('cec49bf4-f006-4cd1-9fb4-9b5816b1e289', '3960eb78-08c4-460e-9582-4f755af604ad', '60989e55-424d-40cc-a812-1d142aa1899f', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('a3c31933-7e38-4209-a7da-334724839e7e', 'fa5f323f-a9c5-450e-973c-fd89e0e1cb85', '60989e55-424d-40cc-a812-1d142aa1899f', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('f97383fb-aede-4340-9886-1979e96ba2fc', 'ff94a46f-3374-4105-abf4-8bb76a4ebfee', '60989e55-424d-40cc-a812-1d142aa1899f', false, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('9531c6aa-cd9c-45db-a430-8454d33309e4', '6ed09aae-626b-4fe2-939c-aad7e8180fa1', '60989e55-424d-40cc-a812-1d142aa1899f', false, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('828eb0fb-32e0-4e84-92a8-12a2e89ff5ac', '96ee0812-abbe-4c8c-9c03-e92a0f978aa8', '60989e55-424d-40cc-a812-1d142aa1899f', false, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('97995d34-0fb5-4d05-a48c-476f4558ddb8', 'cd7c93cb-ed00-49ed-a516-ba19eef457e0', '60989e55-424d-40cc-a812-1d142aa1899f', false, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('47e82350-6d29-4935-8927-628ac5c5296d', '7e3bc26b-0459-437d-8eba-e6bca1235b54', '60989e55-424d-40cc-a812-1d142aa1899f', false, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('fe2d61b1-2643-460b-b1b7-50d8214e9f2a', '1bbc4bc0-6463-4adc-9cf6-65def34d397c', '60989e55-424d-40cc-a812-1d142aa1899f', false, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('d9e7eccd-24b6-4afe-a2a7-9dac8a1c730f', '328abbe4-3ab8-41df-8bb2-09f7b11c2b4a', '60989e55-424d-40cc-a812-1d142aa1899f', false, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('f0056c2a-446b-4775-94fd-55e069b7e798', '52a70a47-6466-419a-8147-a1a96be72de1', '60989e55-424d-40cc-a812-1d142aa1899f', false, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('d825e681-b94c-48cc-9585-330734ecb746', 'f1906632-d97c-48c2-9c4f-2d0bd05428a7', '60989e55-424d-40cc-a812-1d142aa1899f', false, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('432afce4-8af1-4052-9843-5124b38e99d5', '7120dc89-edc6-426c-bce3-73411be528fb', '60989e55-424d-40cc-a812-1d142aa1899f', false, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('40e42797-17cc-4fee-be34-68c7dd3f85e7', '32158c92-5048-4064-97bb-f96436ba4f18', '60989e55-424d-40cc-a812-1d142aa1899f', false, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('0e894756-d6fd-40eb-878d-5d283bf3ef3f', '7f48ac13-b379-4bd1-b0f3-976f6c3039c6', '60989e55-424d-40cc-a812-1d142aa1899f', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('a26068fa-221b-40ca-9805-45316b1f223d', '52c6fc64-e849-42e9-a793-0ed5818b7f47', '60989e55-424d-40cc-a812-1d142aa1899f', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('725b697e-b515-4a6e-8642-3bbb0370961d', 'b4aa380d-6656-4aa9-b290-a307b9e866fd', '60989e55-424d-40cc-a812-1d142aa1899f', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('2e8acbed-31ca-4850-8e79-76a1b4a0f368', '2dd57ed4-57e1-4624-bf1a-a4d091d300bc', '60989e55-424d-40cc-a812-1d142aa1899f', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('77c9e5c3-4924-4e90-a013-170464ab71a4', '016d110e-4779-40f0-8e49-4ddc1345345f', '60989e55-424d-40cc-a812-1d142aa1899f', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('fbf73e42-345f-44e8-80d2-20f04ae395e2', '91716b6f-e776-4789-9ed7-cfbd5b23ef46', '60989e55-424d-40cc-a812-1d142aa1899f', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('05aecebb-4fc0-4694-8888-fa751b64ad82', '10f1976c-0085-4cc1-8659-1d536fe699aa', '60989e55-424d-40cc-a812-1d142aa1899f', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('d857c08f-e1fd-4622-8bba-51fd66a5c808', '02a2992a-57f7-4a5b-a710-d4384e6a978b', '60989e55-424d-40cc-a812-1d142aa1899f', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('cc29600c-bc64-407f-a681-6b31b60c733f', '6b952ed4-a21d-49f2-aee3-393b5031b59f', '60989e55-424d-40cc-a812-1d142aa1899f', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('a83989ea-91c9-4a99-a834-318ae1060144', 'f3673e65-2464-405f-a041-2e68f7b4fa99', '60989e55-424d-40cc-a812-1d142aa1899f', false, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('911fb570-fa3c-4c6e-9652-367e22740a1c', '220aac96-0a35-427b-bc5f-1b3cb26a0b1d', '031acab2-dd14-41d1-bfa2-920cc9a20110', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('23fde328-2b1a-40ae-b995-2989542142cf', 'b1fc61a8-d734-40b0-9b1a-9c79f9105560', '031acab2-dd14-41d1-bfa2-920cc9a20110', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('dffff5f3-03bb-40f0-8ea4-dbffe01dc3b5', 'f46af7ac-c114-4e17-a145-e5d46ac3469e', '031acab2-dd14-41d1-bfa2-920cc9a20110', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('784e7b73-1fa0-4e07-8916-10787ce4ee3c', '0a9d682c-34aa-41f8-bff9-b3b3e05e1eef', '031acab2-dd14-41d1-bfa2-920cc9a20110', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('236a6712-cab4-4680-a4c4-15e912fcf88f', '8f6e94f1-748f-438b-8aa8-350283189695', '031acab2-dd14-41d1-bfa2-920cc9a20110', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('8da52f08-3570-4c8d-b3d8-a0097f19ccb0', '042b4bcc-3fc3-4195-820d-f77bc35b13c1', '031acab2-dd14-41d1-bfa2-920cc9a20110', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('54cdb1f8-4963-4d92-a4bb-1ba261b10e67', '1a5b989a-3d47-4b24-87c1-ba48df69276e', '031acab2-dd14-41d1-bfa2-920cc9a20110', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('f27d934b-a5e3-4d7c-83ea-818a81025ea9', 'beedbf4d-7d33-481e-8ff6-4805d2dbc269', '031acab2-dd14-41d1-bfa2-920cc9a20110', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('0ee11669-a4f4-4bf4-a516-8088b1855088', '48fa1099-6d63-4aa0-8eeb-928ed063ede2', '031acab2-dd14-41d1-bfa2-920cc9a20110', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('47663988-a865-45b3-bbed-45d910dfe1d5', '3960eb78-08c4-460e-9582-4f755af604ad', '031acab2-dd14-41d1-bfa2-920cc9a20110', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('d2e94c9d-383d-4e85-94fb-b3eac286632b', 'fa5f323f-a9c5-450e-973c-fd89e0e1cb85', '031acab2-dd14-41d1-bfa2-920cc9a20110', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('87f948ac-a808-4574-bbb8-e0d11822b3d4', 'ff94a46f-3374-4105-abf4-8bb76a4ebfee', '031acab2-dd14-41d1-bfa2-920cc9a20110', false, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('ceb0bc0e-e05e-46d6-834a-deca7b0713d0', '6ed09aae-626b-4fe2-939c-aad7e8180fa1', '031acab2-dd14-41d1-bfa2-920cc9a20110', false, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('31b0c1d8-79e2-4e81-8345-9c091f3f2269', '96ee0812-abbe-4c8c-9c03-e92a0f978aa8', '031acab2-dd14-41d1-bfa2-920cc9a20110', false, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('b3df1849-7d9d-4730-8e66-c7c4e5b5f072', 'cd7c93cb-ed00-49ed-a516-ba19eef457e0', '031acab2-dd14-41d1-bfa2-920cc9a20110', false, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('8160b408-89d1-4fce-99c4-46f04217ac21', '7e3bc26b-0459-437d-8eba-e6bca1235b54', '031acab2-dd14-41d1-bfa2-920cc9a20110', false, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('bc49f9ad-6af2-4c8e-a7e9-20b3b687c340', '1bbc4bc0-6463-4adc-9cf6-65def34d397c', '031acab2-dd14-41d1-bfa2-920cc9a20110', false, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('cd1d52db-993a-4ffa-9102-4b4fd0665321', '328abbe4-3ab8-41df-8bb2-09f7b11c2b4a', '031acab2-dd14-41d1-bfa2-920cc9a20110', false, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('c9881392-b5e5-4d43-b87b-6b48367bb1e2', '52a70a47-6466-419a-8147-a1a96be72de1', '031acab2-dd14-41d1-bfa2-920cc9a20110', false, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('671a3cf7-59b2-46f0-8505-63c9fa12b2d0', 'f1906632-d97c-48c2-9c4f-2d0bd05428a7', '031acab2-dd14-41d1-bfa2-920cc9a20110', false, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('2acdc413-482a-48f3-8e71-9c2a70a91f0c', '7120dc89-edc6-426c-bce3-73411be528fb', '031acab2-dd14-41d1-bfa2-920cc9a20110', false, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('67231aeb-c9b8-4dd5-94bb-7f39bf890b36', '32158c92-5048-4064-97bb-f96436ba4f18', '031acab2-dd14-41d1-bfa2-920cc9a20110', false, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('81e1a5d8-2e31-4458-b3f4-25e121a7c6e5', '7f48ac13-b379-4bd1-b0f3-976f6c3039c6', '031acab2-dd14-41d1-bfa2-920cc9a20110', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('589c4908-c86e-44d4-b71b-5d8ebafe4f0c', '52c6fc64-e849-42e9-a793-0ed5818b7f47', '031acab2-dd14-41d1-bfa2-920cc9a20110', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('072f516e-ca39-428c-816e-d6ecb19c74e9', 'b4aa380d-6656-4aa9-b290-a307b9e866fd', '031acab2-dd14-41d1-bfa2-920cc9a20110', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('a9be36c4-71a1-41c8-bb0c-ec1f8747b620', '2dd57ed4-57e1-4624-bf1a-a4d091d300bc', '031acab2-dd14-41d1-bfa2-920cc9a20110', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('032500e9-a49c-4dfa-ac1f-0c737eb4ddcf', '016d110e-4779-40f0-8e49-4ddc1345345f', '031acab2-dd14-41d1-bfa2-920cc9a20110', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('c48709cc-e925-4005-a9c5-3c11af10867a', '91716b6f-e776-4789-9ed7-cfbd5b23ef46', '031acab2-dd14-41d1-bfa2-920cc9a20110', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('8cff985b-2363-4811-b05c-fa86fa1a79a1', '10f1976c-0085-4cc1-8659-1d536fe699aa', '031acab2-dd14-41d1-bfa2-920cc9a20110', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('071990c8-6a50-4b44-a8bc-e3dcda888e23', '02a2992a-57f7-4a5b-a710-d4384e6a978b', '031acab2-dd14-41d1-bfa2-920cc9a20110', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('c7218e59-5a27-476b-92f1-73eda65306b2', '6b952ed4-a21d-49f2-aee3-393b5031b59f', '031acab2-dd14-41d1-bfa2-920cc9a20110', true, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('ade4d2c5-b2e6-4e5f-b2b1-e908fc593699', 'f3673e65-2464-405f-a041-2e68f7b4fa99', '031acab2-dd14-41d1-bfa2-920cc9a20110', false, true, true, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('be344d38-a239-4da2-b8c4-5018b6752a92', '220aac96-0a35-427b-bc5f-1b3cb26a0b1d', 'fb0642fb-0384-4319-ab26-e5d954871d4b', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('d12f1ce6-ac63-4bc4-8497-8e78f175e0b3', 'b1fc61a8-d734-40b0-9b1a-9c79f9105560', 'fb0642fb-0384-4319-ab26-e5d954871d4b', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('dbd05841-7188-454a-87b1-c12ddfbd77a1', 'f46af7ac-c114-4e17-a145-e5d46ac3469e', 'fb0642fb-0384-4319-ab26-e5d954871d4b', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('6adf9be8-9cde-4794-9461-2438707843c1', '0a9d682c-34aa-41f8-bff9-b3b3e05e1eef', 'fb0642fb-0384-4319-ab26-e5d954871d4b', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('257b2100-deae-436d-90ec-2c5fd9125320', '8f6e94f1-748f-438b-8aa8-350283189695', 'fb0642fb-0384-4319-ab26-e5d954871d4b', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('23ed9366-404a-4b6b-844b-721b3aaa677e', '042b4bcc-3fc3-4195-820d-f77bc35b13c1', 'fb0642fb-0384-4319-ab26-e5d954871d4b', true, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('f8beecac-c45e-4b63-8a7b-fb4fda8a4bc1', '1a5b989a-3d47-4b24-87c1-ba48df69276e', 'fb0642fb-0384-4319-ab26-e5d954871d4b', true, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('a10cca8a-05bb-41c3-89de-91136204c8c7', 'beedbf4d-7d33-481e-8ff6-4805d2dbc269', 'fb0642fb-0384-4319-ab26-e5d954871d4b', true, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('01e77f9c-9ad3-4b51-992a-91a7fcc09c29', '48fa1099-6d63-4aa0-8eeb-928ed063ede2', 'fb0642fb-0384-4319-ab26-e5d954871d4b', true, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('ef1fc958-8ce1-4eeb-b05f-67403b377dfd', '3960eb78-08c4-460e-9582-4f755af604ad', 'fb0642fb-0384-4319-ab26-e5d954871d4b', true, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('45a2a4c9-073b-4e10-afd5-8b7c98cab4e3', 'fa5f323f-a9c5-450e-973c-fd89e0e1cb85', 'fb0642fb-0384-4319-ab26-e5d954871d4b', true, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('5acdaf50-49b3-4daf-9288-294243dbe08e', 'ff94a46f-3374-4105-abf4-8bb76a4ebfee', 'fb0642fb-0384-4319-ab26-e5d954871d4b', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('1417bbbc-c128-4004-9aa4-a6fc3ff9c0af', '6ed09aae-626b-4fe2-939c-aad7e8180fa1', 'fb0642fb-0384-4319-ab26-e5d954871d4b', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('885573af-8403-40a7-b2d7-0b9da230e9d2', '96ee0812-abbe-4c8c-9c03-e92a0f978aa8', 'fb0642fb-0384-4319-ab26-e5d954871d4b', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('c3a5769b-54c8-4636-9e42-ee0fef225916', 'cd7c93cb-ed00-49ed-a516-ba19eef457e0', 'fb0642fb-0384-4319-ab26-e5d954871d4b', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('198c1a8f-bc06-4b06-a174-42e1876e603d', '7e3bc26b-0459-437d-8eba-e6bca1235b54', 'fb0642fb-0384-4319-ab26-e5d954871d4b', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('60218a10-02fb-482e-bf97-51bf57a1d2da', '1bbc4bc0-6463-4adc-9cf6-65def34d397c', 'fb0642fb-0384-4319-ab26-e5d954871d4b', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('ed144253-3f9e-4c27-8fc4-77b6ee1df3f6', '328abbe4-3ab8-41df-8bb2-09f7b11c2b4a', 'fb0642fb-0384-4319-ab26-e5d954871d4b', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('8b470b48-54bb-4187-a765-c6985172fc3e', '52a70a47-6466-419a-8147-a1a96be72de1', 'fb0642fb-0384-4319-ab26-e5d954871d4b', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('e9a11134-95b7-46b5-b891-0469375f18e5', 'f1906632-d97c-48c2-9c4f-2d0bd05428a7', 'fb0642fb-0384-4319-ab26-e5d954871d4b', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('e0a1c6a9-1013-486b-87b4-7a3976e6496a', '7120dc89-edc6-426c-bce3-73411be528fb', 'fb0642fb-0384-4319-ab26-e5d954871d4b', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('14fe2997-c562-4099-a8a8-61a5fc638a5d', '32158c92-5048-4064-97bb-f96436ba4f18', 'fb0642fb-0384-4319-ab26-e5d954871d4b', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('ff1b8940-8c42-4207-a1a6-2714d2deedfc', '7f48ac13-b379-4bd1-b0f3-976f6c3039c6', 'fb0642fb-0384-4319-ab26-e5d954871d4b', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('b2a87351-4615-4558-b9b1-ea41fa82ca4f', '52c6fc64-e849-42e9-a793-0ed5818b7f47', 'fb0642fb-0384-4319-ab26-e5d954871d4b', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('823a5dd1-9424-42cb-a170-089acd3a5e84', 'b4aa380d-6656-4aa9-b290-a307b9e866fd', 'fb0642fb-0384-4319-ab26-e5d954871d4b', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('120bb0f7-1f9a-4d04-9f8a-ab806aa5fe37', '2dd57ed4-57e1-4624-bf1a-a4d091d300bc', 'fb0642fb-0384-4319-ab26-e5d954871d4b', true, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('d9e15b42-2226-449d-8123-9cc6b2c00581', '016d110e-4779-40f0-8e49-4ddc1345345f', 'fb0642fb-0384-4319-ab26-e5d954871d4b', true, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('d56c9c0a-a973-486c-a0f1-378f12d6b9b1', '91716b6f-e776-4789-9ed7-cfbd5b23ef46', 'fb0642fb-0384-4319-ab26-e5d954871d4b', true, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('b37c7d18-745c-4585-90b3-cfee9d8a86bd', '10f1976c-0085-4cc1-8659-1d536fe699aa', 'fb0642fb-0384-4319-ab26-e5d954871d4b', true, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('9290e440-d7df-4f49-8568-af37a5b7ef8b', '02a2992a-57f7-4a5b-a710-d4384e6a978b', 'fb0642fb-0384-4319-ab26-e5d954871d4b', true, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('8b6df330-a10a-4eb8-9c2f-fbf4c4963d98', '6b952ed4-a21d-49f2-aee3-393b5031b59f', 'fb0642fb-0384-4319-ab26-e5d954871d4b', true, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('2b0db1e2-7c25-4fbb-8e44-9d585ea99be7', 'f3673e65-2464-405f-a041-2e68f7b4fa99', 'fb0642fb-0384-4319-ab26-e5d954871d4b', true, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('f994c31f-8136-4607-b345-8aff39c291c4', '220aac96-0a35-427b-bc5f-1b3cb26a0b1d', '5d42886e-6446-4142-b657-1d45ed508267', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('5490c94c-f0be-45e9-a7b7-acb235d5a096', 'b1fc61a8-d734-40b0-9b1a-9c79f9105560', '5d42886e-6446-4142-b657-1d45ed508267', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('a779e896-912d-4886-80bd-2a821ffcaf55', 'f46af7ac-c114-4e17-a145-e5d46ac3469e', '5d42886e-6446-4142-b657-1d45ed508267', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('dc9743c1-33fc-4aac-a2de-0a5ccbb450fb', '0a9d682c-34aa-41f8-bff9-b3b3e05e1eef', '5d42886e-6446-4142-b657-1d45ed508267', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('b1c812b2-50e4-499d-9407-20be2b095e58', '8f6e94f1-748f-438b-8aa8-350283189695', '5d42886e-6446-4142-b657-1d45ed508267', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('4772a756-c0d9-415c-8f23-62eade74c390', '042b4bcc-3fc3-4195-820d-f77bc35b13c1', '5d42886e-6446-4142-b657-1d45ed508267', true, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('b313e1a5-bb4f-49d6-83e5-0e40eb3ba5cc', '1a5b989a-3d47-4b24-87c1-ba48df69276e', '5d42886e-6446-4142-b657-1d45ed508267', true, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('d4af0cf6-1fc9-410e-8952-58de1b0f3d88', 'beedbf4d-7d33-481e-8ff6-4805d2dbc269', '5d42886e-6446-4142-b657-1d45ed508267', true, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('6d9254a2-d84c-43ab-8409-cc746c1423bb', '48fa1099-6d63-4aa0-8eeb-928ed063ede2', '5d42886e-6446-4142-b657-1d45ed508267', true, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('cab66aa1-d322-4854-8b4b-edf23c968677', '3960eb78-08c4-460e-9582-4f755af604ad', '5d42886e-6446-4142-b657-1d45ed508267', true, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('96388e25-f1eb-40f6-a178-2238cd88cddd', 'fa5f323f-a9c5-450e-973c-fd89e0e1cb85', '5d42886e-6446-4142-b657-1d45ed508267', true, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('d55766f6-045d-4216-817f-0b8d4c7603ce', 'ff94a46f-3374-4105-abf4-8bb76a4ebfee', '5d42886e-6446-4142-b657-1d45ed508267', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('fc13d333-602a-415a-95aa-6f9e893c1cd5', '6ed09aae-626b-4fe2-939c-aad7e8180fa1', '5d42886e-6446-4142-b657-1d45ed508267', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('8c51f538-ad05-414f-b718-5c74179f8862', '96ee0812-abbe-4c8c-9c03-e92a0f978aa8', '5d42886e-6446-4142-b657-1d45ed508267', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('aacc6d66-e2c0-4ff1-902f-251c1e729767', 'cd7c93cb-ed00-49ed-a516-ba19eef457e0', '5d42886e-6446-4142-b657-1d45ed508267', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('be82ef4f-f940-413e-b979-098b8b91bc19', '7e3bc26b-0459-437d-8eba-e6bca1235b54', '5d42886e-6446-4142-b657-1d45ed508267', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('3f4010c1-c301-43b6-bcfa-3544b7309b6a', '1bbc4bc0-6463-4adc-9cf6-65def34d397c', '5d42886e-6446-4142-b657-1d45ed508267', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('2f140558-1ad2-4223-88a1-cfc177d3f88c', '328abbe4-3ab8-41df-8bb2-09f7b11c2b4a', '5d42886e-6446-4142-b657-1d45ed508267', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('915183a5-1ef4-4172-b03e-a458943d76c6', '52a70a47-6466-419a-8147-a1a96be72de1', '5d42886e-6446-4142-b657-1d45ed508267', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('a82b2ff9-9b3e-4e87-aa09-78475bc089ae', 'f1906632-d97c-48c2-9c4f-2d0bd05428a7', '5d42886e-6446-4142-b657-1d45ed508267', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('838354da-1ea9-4a9f-851c-e33d470cabe0', '7120dc89-edc6-426c-bce3-73411be528fb', '5d42886e-6446-4142-b657-1d45ed508267', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('56c551d3-5cdf-44e7-94e6-d079df2dcd3f', '32158c92-5048-4064-97bb-f96436ba4f18', '5d42886e-6446-4142-b657-1d45ed508267', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('b3b5d183-3aaf-410e-b213-9770773d94f3', '7f48ac13-b379-4bd1-b0f3-976f6c3039c6', '5d42886e-6446-4142-b657-1d45ed508267', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('809a2f76-bcf6-4128-8874-bc22384f1dc0', '52c6fc64-e849-42e9-a793-0ed5818b7f47', '5d42886e-6446-4142-b657-1d45ed508267', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('a63d97ef-0b71-47c9-ae93-570c200ce61b', 'b4aa380d-6656-4aa9-b290-a307b9e866fd', '5d42886e-6446-4142-b657-1d45ed508267', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('7fce28b8-eda3-4fe5-9286-a458a0101cb3', '2dd57ed4-57e1-4624-bf1a-a4d091d300bc', '5d42886e-6446-4142-b657-1d45ed508267', true, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('78c097b0-1b29-433c-adae-7fcca5f85722', '016d110e-4779-40f0-8e49-4ddc1345345f', '5d42886e-6446-4142-b657-1d45ed508267', true, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('0180f78a-c2ac-4ddd-8192-460ae6528fce', '91716b6f-e776-4789-9ed7-cfbd5b23ef46', '5d42886e-6446-4142-b657-1d45ed508267', true, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('186f6327-ebc4-435e-98b6-99d9ddaa9ab6', '10f1976c-0085-4cc1-8659-1d536fe699aa', '5d42886e-6446-4142-b657-1d45ed508267', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('af9a1134-af94-429b-a4d7-eb78c534b263', '02a2992a-57f7-4a5b-a710-d4384e6a978b', '5d42886e-6446-4142-b657-1d45ed508267', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('c12654cf-8139-45c9-921b-b01f8d1fe916', '6b952ed4-a21d-49f2-aee3-393b5031b59f', '5d42886e-6446-4142-b657-1d45ed508267', true, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00'),
	('a9631921-3f6c-4dc3-8c25-104cf2f8dd00', 'f3673e65-2464-405f-a041-2e68f7b4fa99', '5d42886e-6446-4142-b657-1d45ed508267', false, true, false, false, '2025-08-19 23:20:20.25325+00', '2025-08-19 23:20:20.25325+00');


--
-- Data for Name: operation_types_backup; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."operation_types_backup" ("id", "code", "name", "description", "category", "points", "is_active", "created_at", "updated_at") VALUES
	('637a4cc8-67b7-4c17-b201-d9ac98446f92', 'OP1', '고객 응대', NULL, 'sales', 10, true, '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00'),
	('2dba5228-f877-44e0-b6ec-412af91d78a6', 'OP2', '재고 관리', NULL, 'admin', 8, true, '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00'),
	('e8e9ded0-2b3e-4486-84af-d6eca6fe233f', 'OP3', '매출 관리', NULL, 'sales', 12, true, '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00'),
	('f4c1a69c-05e3-4d6e-ab83-c787b04e8c38', 'OP4', '문서 작성', NULL, 'admin', 6, true, '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00'),
	('b6a9f915-7563-420e-82b6-1d0bc473abf0', 'OP5', '프로젝트 개발', NULL, 'development', 15, true, '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00'),
	('a7551bd0-bc3f-407e-86bb-94f7d9912e11', 'OP6', '디자인 작업', NULL, 'design', 12, true, '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00'),
	('e3440f7a-8395-476b-a509-78aee55ea5b0', 'OP7', '마케팅 캠페인', NULL, 'marketing', 14, true, '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00'),
	('4c16f483-cd35-4761-bd18-769ec35fb01d', 'OP8', '교육 진행', NULL, 'training', 10, true, '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00'),
	('673e66b9-8918-40d2-9d09-84c24d2c3abd', 'OP9', '품질 검사', NULL, 'quality', 8, true, '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00'),
	('2cf152ae-08be-4800-b6f9-3fd41129f352', 'OP10', '기타 업무', NULL, 'other', 5, true, '2025-08-19 23:20:19.68522+00', '2025-08-19 23:20:19.68522+00');


--
-- Data for Name: performance_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: salaries; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: team_members; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_namespaces; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_tables; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, false);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

RESET ALL;
