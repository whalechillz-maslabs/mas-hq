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
8d45c20c-7626-416e-9821-882ca9b285dc	매장운영팀	STORE	매장 운영 및 관리	t	2025-08-19 23:20:19.68522+00	2025-08-19 23:20:19.68522+00
0af79f9f-7c9c-4686-a889-1699f0024228	본사	HQ	본사 직원	t	2025-08-19 23:20:19.68522+00	2025-08-19 23:20:19.68522+00
1aa7abe8-15f0-4fbf-bd81-d731516b62c3	STE	STE	STE 부서	t	2025-08-19 23:48:31.251182+00	2025-08-19 23:48:31.251182+00
\.


--
-- Data for Name: positions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.positions (id, name, level, description, created_at, updated_at) FROM stdin;
4c789c18-6e10-462d-820f-7b3d9bfa8eb0	대표이사	1	CEO	2025-08-19 23:20:19.68522+00	2025-08-19 23:20:19.68522+00
1e7e6331-3821-4e56-90d5-f9c958de99e3	이사	2	Director	2025-08-19 23:20:19.68522+00	2025-08-19 23:20:19.68522+00
4c896d6f-f3fb-42b9-97cf-1e22bbc061d9	부장	3	General Manager	2025-08-19 23:20:19.68522+00	2025-08-19 23:20:19.68522+00
12b783c9-e47a-4e10-ae26-b234d3bdb36d	차장	4	Deputy General Manager	2025-08-19 23:20:19.68522+00	2025-08-19 23:20:19.68522+00
ac945681-0023-4de2-99ba-6b3114dcbdc7	과장	5	Manager	2025-08-19 23:20:19.68522+00	2025-08-19 23:20:19.68522+00
79600df3-f6d0-4ba7-a9a5-a1beacfd1445	대리	6	Assistant Manager	2025-08-19 23:20:19.68522+00	2025-08-19 23:20:19.68522+00
dc6992bd-6c84-4b8f-8e13-6f7e4bd53a5d	주임	7	Senior Staff	2025-08-19 23:20:19.68522+00	2025-08-19 23:20:19.68522+00
c9d6b29a-f792-4304-b270-9cfafc47e0b4	사원	8	Staff	2025-08-19 23:20:19.68522+00	2025-08-19 23:20:19.68522+00
1cecfdeb-4291-4976-8feb-2060e4305a5d	인턴	9	Intern	2025-08-19 23:20:19.68522+00	2025-08-19 23:20:19.68522+00
5bd1c281-ab07-4844-b49d-ed738f901056	파트타임	10	Part-time	2025-08-19 23:20:19.68522+00	2025-08-19 23:20:19.68522+00
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
15dd4bca-c08f-45e8-b6b2-7eadad0cc7cc	MASLABS-004	park.jin@maslabs.kr	박진(JIN)	010-9132-4337	91324337	8d45c20c-7626-416e-9821-882ca9b285dc	5bd1c281-ab07-4844-b49d-ed738f901056	5d42886e-6446-4142-b657-1d45ed508267	\N	\N	\N	\N	2025-07-29	\N	full_time	12000.00	\N	active	t	\N	\N	\N	{}	2025-08-19 23:32:48.335+00	2025-08-19 23:20:20.305507+00	2025-08-19 23:32:48.349466+00	JIN	1234
513726f9-d1ff-4fd8-92a0-49ae128ad8e9	MASLABS-001	admin@maslabs.kr	시스템 관리자	010-6669-9000	66699000	0af79f9f-7c9c-4686-a889-1699f0024228	4c789c18-6e10-462d-820f-7b3d9bfa8eb0	b724ff0c-01f8-4aa4-866f-ac67a616af32	\N	\N	\N	\N	2025-08-19	\N	full_time	\N	\N	active	t	\N	\N	\N	{}	2025-08-19 23:36:30.116+00	2025-08-19 23:20:19.68522+00	2025-08-19 23:36:30.121583+00	\N	1234
7cef08a3-3222-46de-825f-5325bbf10c5a	MASLABS-002	lee.eunjung@maslabs.kr	이은정(STE)	010-3243-3099	32433099	\N	1e7e6331-3821-4e56-90d5-f9c958de99e3	60989e55-424d-40cc-a812-1d142aa1899f	\N	\N	\N	\N	2025-01-01	\N	full_time	\N	\N	active	t	\N	\N	\N	{}	2025-08-19 23:50:42.712+00	2025-08-19 23:48:25.666304+00	2025-08-19 23:50:42.61596+00	\N	1234
\.


--
-- PostgreSQL database dump complete
--

