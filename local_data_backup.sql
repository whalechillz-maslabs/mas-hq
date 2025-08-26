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
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, name, code, description, is_active, created_at, updated_at) FROM stdin;
cd1bf40d-6d5f-48ad-8256-9469eb8692db	경영지원팀	MGMT	경영 및 행정 지원	t	2025-08-19 23:20:19.68522+00	2025-08-19 23:20:19.68522+00
8354d709-a44f-499e-909f-d5ec1a8048c7	개발팀	DEV	소프트웨어 개발	t	2025-08-19 23:20:19.68522+00	2025-08-19 23:20:19.68522+00
2a060f6d-69c1-44d6-942b-0743e46bdca7	디자인팀	DESIGN	디자인 및 UI/UX	t	2025-08-19 23:20:19.68522+00	2025-08-19 23:20:19.68522+00
ce3a48cc-dc02-4c50-97ce-a0b91b996380	마케팅팀	MARKETING	마케팅 및 홍보	t	2025-08-19 23:20:19.68522+00	2025-08-19 23:20:19.68522+00
0af79f9f-7c9c-4686-a889-1699f0024228	본사	HQ	본사 직원	t	2025-08-19 23:20:19.68522+00	2025-08-19 23:20:19.68522+00
b01ab0e6-66ee-4a8d-818e-1e167effb597	마스팀	MAS	마스팀 운영	t	2025-08-20 13:24:13.310563+00	2025-08-20 13:24:13.310563+00
b0bff302-f3c9-4086-b814-db8a2f871b11	싱싱팀	SING	싱싱팀 운영	t	2025-08-20 13:24:13.310563+00	2025-08-20 13:24:13.310563+00
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, description, permissions, created_at, updated_at) FROM stdin;
b724ff0c-01f8-4aa4-866f-ac67a616af32	admin	시스템 관리자	{"all": true}	2025-08-19 23:20:19.68522+00	2025-08-19 23:20:19.68522+00
60989e55-424d-40cc-a812-1d142aa1899f	manager	매니저/팀장	{"tasks": true, "salaries": true, "employees": true, "schedules": true}	2025-08-19 23:20:19.68522+00	2025-08-19 23:20:19.68522+00
031acab2-dd14-41d1-bfa2-920cc9a20110	team_lead	팀 리더	{"team_tasks": true, "team_reports": true, "team_schedules": true}	2025-08-19 23:20:19.68522+00	2025-08-19 23:20:19.68522+00
fb0642fb-0384-4319-ab26-e5d954871d4b	employee	일반 직원	{"self": true, "view_schedules": true}	2025-08-19 23:20:19.68522+00	2025-08-19 23:20:19.68522+00
5d42886e-6446-4142-b657-1d45ed508267	part_time	파트타임 직원	{"self": true, "view_schedules": true}	2025-08-19 23:20:19.68522+00	2025-08-19 23:20:19.68522+00
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employees (id, employee_id, email, name, phone, password_hash, department_id, position_id, role_id, birth_date, address, emergency_contact, bank_account, hire_date, resignation_date, employment_type, hourly_rate, monthly_salary, status, is_active, profile_image_url, bio, skills, user_meta, last_login, created_at, updated_at, nickname, pin_code) FROM stdin;
513726f9-d1ff-4fd8-92a0-49ae128ad8e9	MASLABS-001	admin@maslabs.kr	시스템 관리자	010-6669-9000	66699000	0af79f9f-7c9c-4686-a889-1699f0024228	4c789c18-6e10-462d-820f-7b3d9bfa8eb0	b724ff0c-01f8-4aa4-866f-ac67a616af32	\N	\N	\N	\N	2025-08-19	\N	full_time	\N	\N	active	t	\N	\N	\N	{}	2025-08-24 05:21:13.228+00	2025-08-19 23:20:19.68522+00	2025-08-24 05:21:13.25555+00	\N	1234
7cef08a3-3222-46de-825f-5325bbf10c5a	MASLABS-002	lee.eunjung@maslabs.kr	이은정(STE)	010-3243-3099	32433099	cd1bf40d-6d5f-48ad-8256-9469eb8692db	1e7e6331-3821-4e56-90d5-f9c958de99e3	60989e55-424d-40cc-a812-1d142aa1899f	\N	\N	\N	\N	2025-01-01	\N	full_time	\N	\N	active	t	\N	\N	\N	{}	2025-08-22 13:41:17.104+00	2025-08-19 23:48:25.666304+00	2025-08-22 13:41:17.106269+00	\N	1234
15dd4bca-c08f-45e8-b6b2-7eadad0cc7cc	MASLABS-004	park.jin@maslabs.kr	박진(JIN)	010-9132-4337	91324337	b01ab0e6-66ee-4a8d-818e-1e167effb597	5bd1c281-ab07-4844-b49d-ed738f901056	5d42886e-6446-4142-b657-1d45ed508267	\N	\N	\N	\N	2025-07-29	\N	full_time	12000.00	\N	active	t	\N	\N	\N	{}	2025-08-21 06:34:41.982+00	2025-08-19 23:20:20.305507+00	2025-08-21 06:34:41.996148+00	JIN	1234
\.


--
-- Data for Name: schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schedules (id, employee_id, schedule_date, scheduled_start, scheduled_end, actual_start, actual_end, break_minutes, total_hours, overtime_hours, status, approved_by, approved_at, check_in_location, check_out_location, employee_note, manager_note, created_at, updated_at) FROM stdin;
ced75be7-dc12-4686-93ef-b66fa991897f	513726f9-d1ff-4fd8-92a0-49ae128ad8e9	2025-08-25	14:00:00	15:00:00	\N	\N	0	\N	\N	approved	\N	\N	\N	\N	클릭으로 추가됨	\N	2025-08-24 02:22:36.601977+00	2025-08-24 02:22:36.601977+00
77b2838c-40db-4e51-ad99-03cfda421ae9	513726f9-d1ff-4fd8-92a0-49ae128ad8e9	2025-08-26	14:00:00	15:00:00	\N	\N	0	\N	\N	approved	\N	\N	\N	\N	클릭으로 추가됨	\N	2025-08-24 02:22:37.645372+00	2025-08-24 02:22:37.645372+00
bd686bbd-43c0-469e-bd29-3e65cef9006e	513726f9-d1ff-4fd8-92a0-49ae128ad8e9	2025-08-27	14:00:00	15:00:00	\N	\N	0	\N	\N	approved	\N	\N	\N	\N	클릭으로 추가됨	\N	2025-08-24 02:22:38.707864+00	2025-08-24 02:22:38.707864+00
52aebeee-962f-4e6e-b6d7-101a9145afba	7cef08a3-3222-46de-825f-5325bbf10c5a	2025-08-25	10:00:00	11:00:00	\N	\N	0	\N	\N	approved	\N	\N	\N	\N	관리자가 추가함	\N	2025-08-23 15:31:57.079268+00	2025-08-23 15:31:57.079268+00
4723d77c-bcb5-4c63-89e8-d9b30f159014	7cef08a3-3222-46de-825f-5325bbf10c5a	2025-08-25	11:00:00	12:00:00	\N	\N	0	\N	\N	approved	\N	\N	\N	\N	관리자가 추가함	\N	2025-08-23 15:31:57.726098+00	2025-08-23 15:31:57.726098+00
77e53c10-dee5-40d0-84a7-5af2da528782	7cef08a3-3222-46de-825f-5325bbf10c5a	2025-08-25	12:00:00	13:00:00	\N	\N	0	\N	\N	approved	\N	\N	\N	\N	관리자가 추가함	\N	2025-08-23 15:31:58.537197+00	2025-08-23 15:31:58.537197+00
a5148cbc-00a9-46c2-b4e0-4d3942c53b65	513726f9-d1ff-4fd8-92a0-49ae128ad8e9	2025-08-25	13:00:00	14:00:00	\N	\N	0	\N	\N	approved	\N	\N	\N	\N	클릭으로 추가됨	\N	2025-08-24 05:18:47.375772+00	2025-08-24 05:18:47.375772+00
e9b03767-2dd2-4bde-8de0-dcf978bb3be6	513726f9-d1ff-4fd8-92a0-49ae128ad8e9	2025-08-26	13:00:00	14:00:00	\N	\N	0	\N	\N	approved	\N	\N	\N	\N	클릭으로 추가됨	\N	2025-08-24 05:18:48.250586+00	2025-08-24 05:18:48.250586+00
88187cfc-fb39-4451-bb3b-585147d81971	513726f9-d1ff-4fd8-92a0-49ae128ad8e9	2025-08-27	13:00:00	14:00:00	\N	\N	0	\N	\N	approved	\N	\N	\N	\N	클릭으로 추가됨	\N	2025-08-24 05:18:49.021086+00	2025-08-24 05:18:49.021086+00
a531ac9b-0c32-4204-a921-e2c81db12ae1	513726f9-d1ff-4fd8-92a0-49ae128ad8e9	2025-08-27	12:00:00	13:00:00	\N	\N	0	\N	\N	approved	\N	\N	\N	\N	클릭으로 추가됨	\N	2025-08-24 05:18:51.743619+00	2025-08-24 05:18:51.743619+00
d0882f6a-39b7-416a-aed9-ece79dd2209f	513726f9-d1ff-4fd8-92a0-49ae128ad8e9	2025-08-26	12:00:00	13:00:00	\N	\N	0	\N	\N	approved	\N	\N	\N	\N	클릭으로 추가됨	\N	2025-08-24 05:18:52.982446+00	2025-08-24 05:18:52.982446+00
3c841f24-f4d3-404a-86a0-55767d177f92	15dd4bca-c08f-45e8-b6b2-7eadad0cc7cc	2025-08-26	10:00:00	11:00:00	\N	\N	0	\N	\N	approved	\N	\N	\N	\N	관리자가 추가함	\N	2025-08-24 02:18:32.757103+00	2025-08-24 02:18:32.757103+00
264ab800-3e1a-4a9c-9f82-8a2c6f6e8a61	15dd4bca-c08f-45e8-b6b2-7eadad0cc7cc	2025-08-26	11:00:00	12:00:00	\N	\N	0	\N	\N	approved	\N	\N	\N	\N	관리자가 추가함	\N	2025-08-24 02:18:33.477992+00	2025-08-24 02:18:33.477992+00
981d2703-1196-49cb-9549-b65bece1b5e5	15dd4bca-c08f-45e8-b6b2-7eadad0cc7cc	2025-08-26	12:00:00	13:00:00	\N	\N	0	\N	\N	approved	\N	\N	\N	\N	관리자가 추가함	\N	2025-08-24 02:18:34.578482+00	2025-08-24 02:18:34.578482+00
44971edb-a54a-4a1b-bb0d-d41d84190fb7	513726f9-d1ff-4fd8-92a0-49ae128ad8e9	2025-08-27	10:00:00	11:00:00	\N	\N	0	\N	\N	approved	\N	\N	\N	\N	관리자가 추가함	\N	2025-08-24 02:19:44.74816+00	2025-08-24 02:19:44.74816+00
87cdb23e-ec6b-48c5-a275-a5883c7b411f	513726f9-d1ff-4fd8-92a0-49ae128ad8e9	2025-08-27	11:00:00	12:00:00	\N	\N	0	\N	\N	approved	\N	\N	\N	\N	관리자가 추가함	\N	2025-08-24 02:19:45.493913+00	2025-08-24 02:19:45.493913+00
\.


--
-- Data for Name: team_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.team_members (id, team_lead_id, team_member_id, department_id, start_date, end_date, is_active, created_at, updated_at) FROM stdin;
\.


--
-- PostgreSQL database dump complete
--

