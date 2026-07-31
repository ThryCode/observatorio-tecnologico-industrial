--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13
-- Dumped by pg_dump version 15.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


--
-- Name: indicatorperiod; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.indicatorperiod AS ENUM (
    'MONTHLY',
    'QUARTERLY',
    'ANNUAL'
);


--
-- Name: patentstatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.patentstatus AS ENUM (
    'FILED',
    'EXAMINATION',
    'GRANTED',
    'EXPIRED',
    'REJECTED'
);


--
-- Name: regulationcategory; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.regulationcategory AS ENUM (
    'LAW',
    'DECREE',
    'RESOLUTION',
    'STANDARD',
    'NORM'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


--
-- Name: alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo character varying(200) NOT NULL,
    descripcion text,
    severidad character varying(10) DEFAULT 'media'::character varying NOT NULL,
    fecha timestamp with time zone DEFAULT now() NOT NULL,
    sector_codigo character varying(3),
    leida boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    action character varying(20) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id character varying(36) NOT NULL,
    changes jsonb,
    ip_address character varying(45),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: bulletins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bulletins (
    titulo character varying(300) NOT NULL,
    resumen text,
    fecha_publicacion timestamp without time zone NOT NULL,
    categoria character varying(50) NOT NULL,
    autor character varying(200),
    archivo_url character varying(500),
    sector_codigo character varying(3),
    id character varying(36) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: competitiveness_indices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.competitiveness_indices (
    sector character varying(200) NOT NULL,
    sector_codigo character varying(3),
    indicador character varying(200) NOT NULL,
    valor numeric(10,2) NOT NULL,
    pais character varying(100) NOT NULL,
    periodo character varying(20) NOT NULL,
    fuente character varying(300),
    id character varying(36) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: follows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.follows (
    id uuid NOT NULL,
    follower_id uuid NOT NULL,
    follower_type character varying(20) NOT NULL,
    organization_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: indicators; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.indicators (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(200) NOT NULL,
    code character varying(50) NOT NULL,
    description text,
    unit character varying(50) NOT NULL,
    value numeric(14,4) NOT NULL,
    source character varying(200) NOT NULL,
    period character varying(20) NOT NULL,
    sector_codigo character varying(3),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: industrial_sectores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.industrial_sectores (
    codigo character varying(3) NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion text
);


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(200) NOT NULL,
    siglas character varying(20) NOT NULL,
    tipo character varying(30) NOT NULL,
    sector_codigo character varying(3),
    pais character varying(100),
    provincia character varying(100),
    sitio_web character varying(255),
    email_contacto character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    fecha_creacion date,
    contacto character varying(50)
);


--
-- Name: patent_map_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patent_map_entries (
    tecnologia character varying(200) NOT NULL,
    pais character varying(100) NOT NULL,
    sector_codigo character varying(3),
    total_patentes integer NOT NULL,
    periodo character varying(20) NOT NULL,
    tendencia character varying(20) NOT NULL,
    id character varying(36) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: patents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(300) NOT NULL,
    patent_number character varying(50) NOT NULL,
    applicant character varying(200) NOT NULL,
    inventor character varying(200) NOT NULL,
    filing_date date NOT NULL,
    publication_date date,
    status character varying(20) NOT NULL,
    abstract text,
    technological_sector character varying(100),
    country character varying(50) NOT NULL,
    technology_id uuid,
    organization_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    file_url character varying(500)
);


--
-- Name: professional_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.professional_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    especialidad character varying(100) NOT NULL,
    grado_cientifico character varying(50),
    cv_url character varying(255),
    biografia text,
    intereses character varying[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    linkedin_url character varying(255),
    twitter_url character varying(255),
    researchgate_url character varying(255),
    orcid character varying(50)
);


--
-- Name: regulations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.regulations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(300) NOT NULL,
    regulation_number character varying(50) NOT NULL,
    issuing_body character varying(200) NOT NULL,
    publication_date date NOT NULL,
    effective_date date,
    category character varying(20) NOT NULL,
    summary text,
    sector_codigo character varying(3),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    file_url character varying(500)
);


--
-- Name: research_publications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.research_publications (
    titulo character varying(300) NOT NULL,
    autores text NOT NULL,
    resumen text,
    doi character varying(100),
    journal character varying(200),
    fecha_publicacion timestamp without time zone NOT NULL,
    palabras_clave character varying(50)[],
    sector_codigo character varying(3),
    url character varying(500),
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
);


--
-- Name: technologies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.technologies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(200) NOT NULL,
    descripcion text,
    sector_codigo character varying(3),
    trl_nivel integer,
    referencia_ontologia character varying(50),
    palabras_clave character varying(50)[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    full_name character varying(150) NOT NULL,
    role character varying(20) DEFAULT 'visitante'::character varying NOT NULL,
    phone character varying(20),
    job_title character varying(100),
    organization_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    is_superuser boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    account_type character varying(20),
    status character varying(20) DEFAULT 'pending'::character varying,
    rejection_reason character varying(255),
    approved_by uuid,
    approved_at timestamp with time zone
);


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.alembic_version (version_num) FROM stdin;
4cb0cc2ebd70
\.


--
-- Data for Name: alerts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.alerts (id, titulo, descripcion, severidad, fecha, sector_codigo, leida, created_at, updated_at) FROM stdin;
5ba21f06-c622-45dc-9e74-5c8cc0487bdf	Nueva patente en biotecnología	Se ha registrado una patente clave para fermentación de precisión.	alta	2026-07-28 08:45:30.063934-04	\N	f	2026-07-28 08:45:30.063934-04	2026-07-28 08:45:30.063934-04
8e3c9be5-63ee-45b3-bcb0-f1d5e27b14ec	Actualización regulatoria sector energético	Nueva normativa para eficiencia energética publicada por el MINEM.	media	2026-07-28 08:45:30.063934-04	\N	f	2026-07-28 08:45:30.063934-04	2026-07-28 08:45:30.063934-04
825c2fc1-028e-496d-b7e4-380f78013a86	Indicador de innovación en ascenso	El índice de innovación industrial subió 3 puntos este trimestre.	baja	2026-07-28 08:45:30.063934-04	\N	t	2026-07-28 08:45:30.063934-04	2026-07-28 08:45:30.063934-04
64ccdadb-2d91-4769-ae1d-b496f461e778	Tendencia: Automatización en manufactura	La adopción de robots industriales crece un 15% anual en la región.	media	2026-07-28 08:45:30.063934-04	\N	f	2026-07-28 08:45:30.063934-04	2026-07-28 08:45:30.063934-04
136f8ebf-8116-4253-a8cd-05226449c49d	Fondo de innovación disponible	Nuevo fondo concursable para proyectos de I+D industrial.	alta	2026-07-28 08:45:30.063934-04	\N	f	2026-07-28 08:45:30.063934-04	2026-07-28 08:45:30.063934-04
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, user_id, action, entity_type, entity_id, changes, ip_address, created_at) FROM stdin;
\.


--
-- Data for Name: bulletins; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bulletins (titulo, resumen, fecha_publicacion, categoria, autor, archivo_url, sector_codigo, id, created_at, updated_at) FROM stdin;
Boletin Trimestral de Ciencia y Tecnologia Q2 2026	Tendencias tecnologicas emergentes en sectores siderurgico, metalurgico y quimico.	2026-07-01 00:00:00	boletin	OCyT	\N	SID	82c775a1-7614-479e-a603-d6ec1163c455	2026-07-29 11:22:12.320954-04	2026-07-29 11:22:12.320954-04
Estudio de Prospectiva: IA en Manufactura	Potencial de adopcion de IA en procesos productivos del sector industrial cubano.	2026-06-01 00:00:00	estudio	ICT	\N	ELE	0510c185-061a-4d8d-8ace-38ebc77cb900	2026-07-29 11:22:12.320954-04	2026-07-29 11:22:12.320954-04
Alerta Tecnologica: Nuevos Materiales para Hidrogeno	Innovaciones en materiales de hidruros metalicos para almacenamiento de energia.	2026-05-15 00:00:00	alerta	CIB	\N	\N	64cf2073-7b5d-456a-877b-c3ec2f7fb272	2026-07-29 11:22:12.320954-04	2026-07-29 11:22:12.320954-04
Mapa de Patentes: Tecnologias de Energia Renovable	Actividad patentaria en energia solar, eolica y biomasa con relevancia para Cuba.	2026-04-01 00:00:00	mapa	EDI	\N	\N	103e8639-17c6-45de-afac-87a7863486d2	2026-07-29 11:22:12.320954-04	2026-07-29 11:22:12.320954-04
\.


--
-- Data for Name: competitiveness_indices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.competitiveness_indices (sector, sector_codigo, indicador, valor, pais, periodo, fuente, id, created_at, updated_at) FROM stdin;
Siderurgia	SID	Indice de competitividad	42.00	Cuba	2026-Q2	BCG	51270734-c56a-464e-a087-20467ddd2ff2	2026-07-29 11:22:12.320954-04	2026-07-29 11:22:12.320954-04
Siderurgia	SID	Indice de competitividad	78.00	Chile	2026-Q2	BCG	356845cd-4b6c-427b-b872-b8363e180865	2026-07-29 11:22:12.320954-04	2026-07-29 11:22:12.320954-04
Siderurgia	SID	Indice de competitividad	65.00	Mexico	2026-Q2	BCG	efc1b9e4-012a-4a25-b4fd-95e6090342db	2026-07-29 11:22:12.320954-04	2026-07-29 11:22:12.320954-04
Siderurgia	SID	Indice de competitividad	91.00	Brasil	2026-Q2	BCG	7829de52-db36-4fe0-b892-f459f591f519	2026-07-29 11:22:12.320954-04	2026-07-29 11:22:12.320954-04
Metalurgia	MET	Indice de competitividad	38.00	Cuba	2026-Q2	BCG	e7665563-d478-493d-99f6-7bc8fc2066fe	2026-07-29 11:22:12.320954-04	2026-07-29 11:22:12.320954-04
Metalurgia	MET	Indice de competitividad	72.00	Chile	2026-Q2	BCG	b04ee4e8-8ba8-4638-ac41-72223053af26	2026-07-29 11:22:12.320954-04	2026-07-29 11:22:12.320954-04
Metalurgia	MET	Indice de competitividad	58.00	Mexico	2026-Q2	BCG	017b8537-a647-4695-93c2-111570279175	2026-07-29 11:22:12.320954-04	2026-07-29 11:22:12.320954-04
Metalurgia	MET	Indice de competitividad	85.00	Brasil	2026-Q2	BCG	7bf424e1-3215-4b7d-a3cf-438ad764473c	2026-07-29 11:22:12.320954-04	2026-07-29 11:22:12.320954-04
Quimica	QUI	Indice de competitividad	55.00	Cuba	2026-Q2	BCG	7e706da4-50e0-49dc-ae41-0bae30bec711	2026-07-29 11:22:12.320954-04	2026-07-29 11:22:12.320954-04
Quimica	QUI	Indice de competitividad	60.00	Chile	2026-Q2	BCG	398312d7-a769-4c6f-9241-a9b8b86d0772	2026-07-29 11:22:12.320954-04	2026-07-29 11:22:12.320954-04
Quimica	QUI	Indice de competitividad	70.00	Mexico	2026-Q2	BCG	edc301ae-bc9c-4be9-8f96-26a4615457b8	2026-07-29 11:22:12.320954-04	2026-07-29 11:22:12.320954-04
Quimica	QUI	Indice de competitividad	88.00	Brasil	2026-Q2	BCG	2a77bdfa-485f-485c-b02a-3a4596968567	2026-07-29 11:22:12.320954-04	2026-07-29 11:22:12.320954-04
Electronica	ELE	Indice de competitividad	28.00	Cuba	2026-Q2	BCG	3edfd7b1-df22-40d4-b01d-ded9a1206fe5	2026-07-29 11:22:12.320954-04	2026-07-29 11:22:12.320954-04
Electronica	ELE	Indice de competitividad	55.00	Chile	2026-Q2	BCG	a0d4c277-2a00-42a2-8a72-15ff24d074d8	2026-07-29 11:22:12.320954-04	2026-07-29 11:22:12.320954-04
Electronica	ELE	Indice de competitividad	62.00	Mexico	2026-Q2	BCG	68ba3a89-0e53-4ed1-b736-47624e8135c8	2026-07-29 11:22:12.320954-04	2026-07-29 11:22:12.320954-04
Electronica	ELE	Indice de competitividad	70.00	Brasil	2026-Q2	BCG	22f7be0b-4e64-490c-845e-1b6a4029d37d	2026-07-29 11:22:12.320954-04	2026-07-29 11:22:12.320954-04
\.


--
-- Data for Name: follows; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.follows (id, follower_id, follower_type, organization_id, created_at) FROM stdin;
d7b16689-7cf6-4741-8a3a-66756d5d0755	4960f9bd-8c94-4f8c-92fb-1e4685719de8	user	85fa07b0-01ef-4de6-8f3b-85274e9b8e65	2026-07-24 12:28:32.682457-04
e8acb6af-76e6-4849-93a3-16934a1e7790	4960f9bd-8c94-4f8c-92fb-1e4685719de8	user	87f2bb74-64fa-42f2-a08d-e04753c23133	2026-07-24 13:00:00.776867-04
91784dd4-2786-4758-aa7b-9335007e7b85	4960f9bd-8c94-4f8c-92fb-1e4685719de8	user	e74387e7-b579-4271-836b-fc7856b3ffd2	2026-07-28 09:48:57.484904-04
4acd9cd9-94f9-4a91-a893-3561190b86ea	4960f9bd-8c94-4f8c-92fb-1e4685719de8	user	8c0ff2ea-817f-405e-b501-8071ca78e775	2026-07-28 09:49:19.820221-04
4f590cd2-d0ea-4091-9016-25e0aa28e1cf	4960f9bd-8c94-4f8c-92fb-1e4685719de8	user	78eab764-d745-4987-80af-e11db7ff7d88	2026-07-28 09:49:22.459865-04
f648577a-8000-4200-b228-f65625cb18a7	4960f9bd-8c94-4f8c-92fb-1e4685719de8	user	10f135e9-2a51-487b-ab88-bb8a63d6d278	2026-07-28 09:49:28.548012-04
e2bfb1e8-cf96-4993-a0b2-9d7619a0b911	367b6059-8601-4706-9f83-fe9d241d4638	user	e290e6f8-5c11-4959-a470-6dfe8271ad91	2026-07-28 09:52:13.580647-04
b9faca9d-6da2-4fcd-a042-36733ce2223b	4960f9bd-8c94-4f8c-92fb-1e4685719de8	user	da424081-7494-4023-8b31-b57fb5114d87	2026-07-30 09:43:59.022899-04
a1cd851a-02b4-4965-9412-76d4b9c0c533	8c3da74c-fbce-43d9-9e76-fd68dcca3811	user	35fcc164-0b41-47ab-8bb0-a7e70b39021b	2026-07-30 09:49:50.904183-04
e98ad7b5-4da9-4231-b8ac-429a988f9241	3aad5dfa-d731-449a-96b4-684567d8535a	user	35fcc164-0b41-47ab-8bb0-a7e70b39021b	2026-07-30 09:50:12.654124-04
aa5c5555-f1a8-4db0-a3de-ac09580dc366	3aad5dfa-d731-449a-96b4-684567d8535a	user	85fa07b0-01ef-4de6-8f3b-85274e9b8e65	2026-07-30 09:50:21.727219-04
89edd317-0954-4a56-a809-3d133d67cd0c	3a2f8438-3ff8-445e-aad4-ca4a258276ba	user	35fcc164-0b41-47ab-8bb0-a7e70b39021b	2026-07-30 09:53:22.246037-04
\.


--
-- Data for Name: indicators; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.indicators (id, name, code, description, unit, value, source, period, sector_codigo, created_at, updated_at) FROM stdin;
524dab91-a126-4980-b0a6-422cda295465	Producción mensual de acero crudo	STEEL_PRODUCTION_MONTHLY	\N	toneladas	12500.0000	ONEI	MONTHLY	SID	2026-07-28 08:43:35.789035-04	2026-07-28 08:43:35.789035-04
a43e2950-92d9-4fc4-81dc-75d3b576b3e6	Índice de confianza empresarial del sector eléctrico	ELECTRIC_CONFIDENCE_INDEX	\N	índice	72.5000	MINEM	QUARTERLY	ELE	2026-07-28 08:43:35.789035-04	2026-07-28 08:43:35.789035-04
491865bb-efa6-401d-89de-3df25fb02ab3	Inversión en I+D metalúrgica	MET_RD_INVESTMENT	\N	USD miles	3400.0000	CITMA	ANNUAL	MET	2026-07-28 08:43:35.789035-04	2026-07-28 08:43:35.789035-04
27c308c0-5158-4068-b9b8-7e8d64742a8a	Capacidad instalada de automatización	AUTO_INSTALLED_CAPACITY	\N	unidades	1580.0000	CIEA	ANNUAL	AUT	2026-07-28 08:43:35.789035-04	2026-07-28 08:43:35.789035-04
dbafae62-b611-43aa-b7a5-b525d5ea6cfb	Producción química básica mensual	CHEM_BASE_PRODUCTION_MONTHLY	\N	toneladas	8750.0000	QUIMICUBA	MONTHLY	QUI	2026-07-28 08:43:35.789035-04	2026-07-28 08:43:35.789035-04
\.


--
-- Data for Name: industrial_sectores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.industrial_sectores (codigo, nombre, descripcion) FROM stdin;
SID	Siderurgia	Industria del acero y derivados
MET	Metalurgia	Transformación de metales no ferrosos
ELE	Electrónica	Componentes y sistemas electrónicos
QUI	Química	Industria química y petroquímica
AUT	Automatización	Automatización industrial y robótica
BIO	Biotecnologia	Sector biotecnologico industrial
ENE	Energia	Sector energetico industrial
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.organizations (id, nombre, siglas, tipo, sector_codigo, pais, provincia, sitio_web, email_contacto, created_at, updated_at, fecha_creacion, contacto) FROM stdin;
35fcc164-0b41-47ab-8bb0-a7e70b39021b	EmpresaNEW	ENW	empresa	AUT	Cuba	Villa Clara	https://prueba.cu	\N	2026-07-23 13:24:45.910498-04	2026-07-24 10:18:05.023436-04	2026-01-21	51234567
85fa07b0-01ef-4de6-8f3b-85274e9b8e65	BioNova Cuba	BNC	empresa	BIO	Cuba	La Habana	https://bionova.cu	\N	2026-07-24 11:24:48.827684-04	2026-07-24 11:24:48.827684-04	2018-05-12	78654321
87f2bb74-64fa-42f2-a08d-e04753c23133	AutoTech Solutions	ATS	empresa	AUT	Cuba	Villa Clara	https://autotech.cu	\N	2026-07-24 11:24:48.85424-04	2026-07-24 11:24:48.85424-04	2020-01-20	42234567
e290e6f8-5c11-4959-a470-6dfe8271ad91	QuimiCuba Industrial	QCI	empresa	QUI	Cuba	Matanzas	https://quimicuba.cu	\N	2026-07-24 11:24:48.860103-04	2026-07-24 11:24:48.860103-04	2015-09-03	45234567
8c0ff2ea-817f-405e-b501-8071ca78e775	Centro de Investigaciones de Energía y Automatización	CIEA	AUT	AUT	Cuba	La Habana	\N	\N	2026-07-28 08:43:35.789035-04	2026-07-28 08:43:35.789035-04	\N	\N
78eab764-d745-4987-80af-e11db7ff7d88	Empresa de Metalurgia y Equipo Técnico Camagüey	METCAM	MET	MET	Cuba	Camagüey	\N	\N	2026-07-28 08:43:35.789035-04	2026-07-28 08:43:35.789035-04	\N	\N
10f135e9-2a51-487b-ab88-bb8a63d6d278	Instituto Nacional de Siderurgia y Industria del Dunque	INSID	SID	SID	Cuba	La Habana	\N	\N	2026-07-28 08:43:35.789035-04	2026-07-28 08:43:35.789035-04	\N	\N
da424081-7494-4023-8b31-b57fb5114d87	Empresa Eléctrica de Villa Clara	ELEVC	ELE	ELE	Cuba	Villa Clara	\N	\N	2026-07-28 08:43:35.789035-04	2026-07-28 08:43:35.789035-04	\N	\N
e74387e7-b579-4271-836b-fc7856b3ffd2	Centro de Biotecnología Industrial	CBI	QUI	QUI	Cuba	La Habana	\N	\N	2026-07-28 08:43:35.789035-04	2026-07-28 08:43:35.789035-04	\N	\N
48fb33ef-429a-4550-a434-8e0c00be96a7	TechnoSol Industriales	TECHNO	empresa	ELE	Cuba	La Habana	\N	\N	2026-07-30 10:22:54.695843-04	2026-07-30 10:22:54.695843-04	\N	\N
\.


--
-- Data for Name: patent_map_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.patent_map_entries (tecnologia, pais, sector_codigo, total_patentes, periodo, tendencia, id, created_at, updated_at) FROM stdin;
Reduccion Directa	Cuba	SID	34	2026-Q2	creciente	25c75a4d-2cad-4fee-b017-04c109356baf	2026-07-29 11:22:12.320954-04	2026-07-29 11:22:12.320954-04
Sensores IoT	Cuba	ELE	28	2026-Q2	creciente	877fcd58-c53b-42a8-857e-cc1ed205d2b7	2026-07-29 11:22:12.320954-04	2026-07-29 11:22:12.320954-04
Bioprocesos	Cuba	\N	22	2026-Q2	estable	23ac3573-5a7f-4a78-93a3-1e8988e079f7	2026-07-29 11:22:12.320954-04	2026-07-29 11:22:12.320954-04
Energia Solar	Cuba	\N	19	2026-Q2	creciente	3f377981-9c1c-4d65-8513-ab8ab3cd5a78	2026-07-29 11:22:12.320954-04	2026-07-29 11:22:12.320954-04
Materiales Compuestos	Cuba	MET	15	2026-Q2	estable	895608cf-b44f-4c82-bcd7-e72756f881f0	2026-07-29 11:22:12.320954-04	2026-07-29 11:22:12.320954-04
Hidrogeno Verde	Cuba	\N	12	2026-Q2	creciente	af297bbc-fd4d-4b34-8311-803c1188fc36	2026-07-29 11:22:12.320954-04	2026-07-29 11:22:12.320954-04
Automatizacion	Cuba	AUT	10	2026-Q2	estable	5afb532f-0816-4fc7-a574-b515f2f86953	2026-07-29 11:22:12.320954-04	2026-07-29 11:22:12.320954-04
Nanomateriales	Cuba	MET	8	2026-Q2	decreciente	e7352b71-9893-4339-a7e6-77870cb3f8b1	2026-07-29 11:22:12.320954-04	2026-07-29 11:22:12.320954-04
\.


--
-- Data for Name: patents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.patents (id, title, patent_number, applicant, inventor, filing_date, publication_date, status, abstract, technological_sector, country, technology_id, organization_id, created_at, updated_at, file_url) FROM stdin;
2c8147b5-0e4d-48c3-b8e2-6aa9efeb635c	Sistema de detección temprana de fallos en motores de vehículos mediante análisis de vibraciones	CU202600001	AutoTech Solutions	Pérez, G.; Rodríguez, L.; Hernández, M.	2024-08-15	2025-12-10	GRANTED	Sistema embebido basado en redes neuronales convolutional para el monitoreo en tiempo real de vibraciones en motores de combustión interna, capaz de detectar anomalías con un 94% de precisión antes de que ocurra una falla catastrófica.	AUT	Cuba	\N	8c0ff2ea-817f-405e-b501-8071ca78e775	2026-07-29 12:01:45.944475-04	2026-07-31 08:58:27.238297-04	\N
9db2c509-dd97-49b1-9f8f-0a436d72b71d	Composición catalítica para la producción de amoníaco verde a baja temperatura	CU202600005	QuimiCuba Industrial	Medina, O.; Ramírez, E.; Sánchez, L.	2025-02-14	\N	EXAMINATION	Nuevo catalizador heterogéneo basado en nitruros metálicos soportados sobre carbón activado que permite la síntesis de amoníaco a temperaturas de 250-350°C, reduciendo significativamente el consumo energético del proceso Haber-Bosch.	QUI	Cuba	\N	e74387e7-b579-4271-836b-fc7856b3ffd2	2026-07-29 12:01:45.944475-04	2026-07-31 08:58:27.238297-04	\N
bce64f02-9801-45b2-afcd-d2c105b1f225	Dispositivo de iluminación LED de alta eficiencia con gestión inteligente de energía	CU202600003	Empresa Eléctrica de Villa Clara	López, D.; Torres, S.; Cruz, R.	2024-01-10	2025-06-20	GRANTED	Luminaria LED con módulo IoT integrado que ajusta automáticamente el flujo luminoso según la presencia de personas y la luz ambiental, logrando un ahorro energético superior al 60% respecto a luminarias convencionales.	ELE	Cuba	\N	da424081-7494-4023-8b31-b57fb5114d87	2026-07-29 12:01:45.944475-04	2026-07-31 08:58:27.238297-04	\N
c1790b3e-d83d-4d2a-8f98-7afb5174b4f7	Método de recuperación de metales raros a partir de escorias metalúrgicas	CU202600004	Empresa de Metalurgia y Equipo Técnico Camagüey	Herrera, J.; Castillo, P.; Vega, M.	2024-11-05	2026-02-28	GRANTED	Proceso hidrometalúrgico combinado con extracción por solvente para la recuperación selectiva de metales de tierras raras contenidos en escorias de la industria metalúrgica, con una eficiencia de extracción del 91%.	MET	Cuba	\N	10f135e9-2a51-487b-ab88-bb8a63d6d278	2026-07-29 12:01:45.944475-04	2026-07-31 08:58:27.238297-04	\N
c4b26a4c-b7bc-44c3-8d45-fcfbae465205	Procedimiento de laminación en caliente para aceros de alta resistencia soldables	CU202600006	Instituto Nacional de Siderurgia y Industria del Duque	González, R.; Díaz, F.; Álvarez, P.	2024-09-30	2025-11-18	GRANTED	Procedimiento termomecánico de laminación en caliente controlada que produce aceros microaleados con límite elástico superior a 700 MPa y excelente soldabilidad, aptos para construcciones sismorresistentes.	SID	Cuba	\N	78eab764-d745-4987-80af-e11db7ff7d88	2026-07-29 12:01:45.944475-04	2026-07-31 08:58:27.238297-04	\N
dc1149c3-e926-4682-9079-7f669f6ea653	Proceso de obtención de biopolímeros a partir de residuos de la industria azucarera	CU202600002	Centro de Biotecnología Industrial	García, A.; Martínez, R.; Fernández, T.	2024-05-20	2025-09-15	GRANTED	Método innovador para la conversión de bagazo de caña y otros residuos lignocelulósicos en biopolímeros biodegradables mediante fermentación bacteriana, con aplicaciones en empaques y dispositivos médicos.	BIO	Cuba	\N	e74387e7-b579-4271-836b-fc7856b3ffd2	2026-07-29 12:01:45.944475-04	2026-07-31 08:58:27.238297-04	\N
\.


--
-- Data for Name: professional_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.professional_profiles (id, user_id, especialidad, grado_cientifico, cv_url, biografia, intereses, created_at, updated_at, linkedin_url, twitter_url, researchgate_url, orcid) FROM stdin;
f28cd9cf-8e67-4a51-b012-d567b346bf2d	503feeb7-d8f4-4903-9d5c-badc07923627	Biotecnología	Dr.C	\N	\N	\N	2026-07-31 09:29:33.310315-04	2026-07-31 09:29:33.310315-04	https://es.linkedin.com/	https://x.com/?lang=es	https://www.researchgate.net/	
5d41230d-61ba-4704-a66e-5097f09a9144	d8a8aa4f-458f-4a8c-9071-ab09baa9eb3f	Inteligencia Artificial	Doctora en Ciencias Técnicas	\N	\N	\N	2026-07-31 11:46:42.242845-04	2026-07-31 11:46:42.242845-04	\N	\N	\N	\N
e1b15e95-0ec0-4575-93cb-cb216212bd08	e00f5c60-acfc-459d-9819-c8cb88ad06ef	Manufactura Aditiva	Master en Ingeniería Mecánica	\N	\N	\N	2026-07-31 11:46:42.464888-04	2026-07-31 11:46:42.464888-04	\N	\N	\N	\N
4c6d6d41-2c22-49ac-9da2-fd16012fb4ab	dc0cd4cc-62d4-45fc-9cb1-0e14a13b977e	Biotecnología Industrial	Doctora en Ciencias Químicas	\N	\N	\N	2026-07-31 11:46:42.677125-04	2026-07-31 11:46:42.677125-04	\N	\N	\N	\N
a90c4b59-2182-409c-ac88-5e1d2dc663f7	26ca44bf-abdf-4ef7-bad0-690b661b40d5	Energías Renovables	Doctor en Ciencias Energéticas	\N	\N	\N	2026-07-31 11:46:42.885274-04	2026-07-31 11:46:42.885274-04	\N	\N	\N	\N
2b21c7db-0f2e-4c9f-aaff-ac903bb5779e	2ea0b94d-b909-43dd-b0ce-d4a24bc5ef4a	Materiales Avanzados	Doctora en Ciencia de Materiales	\N	\N	\N	2026-07-31 11:46:43.088349-04	2026-07-31 11:46:43.088349-04	\N	\N	\N	\N
\.


--
-- Data for Name: regulations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.regulations (id, title, regulation_number, issuing_body, publication_date, effective_date, category, summary, sector_codigo, created_at, updated_at, file_url) FROM stdin;
\.


--
-- Data for Name: research_publications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.research_publications (titulo, autores, resumen, doi, journal, fecha_publicacion, palabras_clave, sector_codigo, url, id, created_at, updated_at, created_by) FROM stdin;
Aplicación de redes neuronales artificiales para la optimización de procesos de manufactura en la industria azucarera cubana	María Elena García López, Carlos Alejandro Rodríguez Pérez	Se presenta un modelo de red neuronal artificial para la predicción y optimización de parámetros críticos en la producción de azúcar, logrando una reducción del 15% en el consumo de energía.	10.1016/j.compchemeng.2025.108234	Computers & Chemical Engineering	2025-03-15 00:00:00	{"inteligencia artificial",manufactura,azúcar,optimización}	BIO	https://doi.org/10.1016/j.compchemeng.2025.108234	c0a23163-f91e-411a-bf61-30b5344b9c42	2026-07-31 16:18:12.384031-04	2026-07-31 16:18:12.384031-04	d8a8aa4f-458f-4a8c-9071-ab09baa9eb3f
Manufactura aditiva de piezas metálicas mediante impresión 3D para la reparación de equipos industriales	Carlos Alejandro Rodríguez Pérez, Pedro Manuel Sánchez Díaz	Evaluación de técnicas de fabricación aditiva con metales para la producción de repuestos industriales, demostrando viabilidad técnica y económica para la industria cubana.	10.1016/j.addma.2025.03.012	Additive Manufacturing	2025-05-20 00:00:00	{"manufactura aditiva","impresión 3D",repuestos,metalurgia}	MET	https://doi.org/10.1016/j.addma.2025.03.012	ed345bc6-1734-4e9d-8fb7-1423480238e4	2026-07-31 16:18:12.415305-04	2026-07-31 16:18:12.415305-04	e00f5c60-acfc-459d-9819-c8cb88ad06ef
Biorrefinería sostenible: producción de bioplásticos a partir de residuos agrícolas en Cuba	Ana Lucía Martínez Fernández, Laura Isabel Hernández Torres	Investigación sobre la obtención de polihidroxialcanoatos (PHA) a partir de subproductos de la agricultura cubana, como alternativa biodegradable a los plásticos convencionales.	10.1016/j.biortech.2025.130456	Bioresource Technology	2025-02-10 00:00:00	{bioplásticos,biorrefinería,"residuos agrícolas",sostenibilidad}	BIO	https://doi.org/10.1016/j.biortech.2025.130456	3654b231-e026-4903-9b84-12bb99d64504	2026-07-31 16:18:12.415305-04	2026-07-31 16:18:12.415305-04	dc0cd4cc-62d4-45fc-9cb1-0e14a13b977e
Evaluación del potencial eólico para la generación distribuida en zonas industriales del occidente cubano	Pedro Manuel Sánchez Díaz, María Elena García López	Análisis de recursos eólicos y diseño de sistemas de generación distribuida para zonas industriales, logrando una factibilidad técnica del 78% para la integración de energía eólica.	10.1016/j.rser.2025.114789	Renewable and Sustainable Energy Reviews	2025-06-01 00:00:00	{"energía eólica","generación distribuida","zonas industriales",Cuba}	ENE	https://doi.org/10.1016/j.rser.2025.114789	ac613a32-e352-4ec3-893c-e589e7bd040a	2026-07-31 16:18:12.415305-04	2026-07-31 16:18:12.415305-04	26ca44bf-abdf-4ef7-bad0-690b661b40d5
Nanocomposites de celulosa microcristalina: aplicaciones en la industria alimentaria cubana	Laura Isabel Hernández Torres, Ana Lucía Martínez Fernández	Desarrollo de nanocomposites derivados de celulosa microcristalina para envases alimentarios activos con propiedades antimicrobianas y barrera al oxígeno.	10.1016/j.carbpol.2025.122345	Carbohydrate Polymers	2025-04-18 00:00:00	{nanocomposites,celulosa,envases,"industria alimentaria"}	QUI	https://doi.org/10.1016/j.carbpol.2025.122345	7ef80744-1c70-41ac-97e8-2d1c3101226d	2026-07-31 16:18:12.415305-04	2026-07-31 16:18:12.415305-04	2ea0b94d-b909-43dd-b0ce-d4a24bc5ef4a
Sistema de visión artificial para control de calidad en la producción de componentes electrónicos	María Elena García López, Ana Lucía Martínez Fernández, Carlos Alejandro Rodríguez Pérez	Implementación de un sistema de inspección automática basado en deep learning para la detección de defectos en líneas de ensamblaje electrónico, alcanzando un 97.3% de precisión.	10.1016/j.engappai.2025.110234	Engineering Applications of Artificial Intelligence	2025-07-05 00:00:00	{"visión artificial","deep learning","control de calidad",electrónica}	ELE	https://doi.org/10.1016/j.engappai.2025.110234	d44256a2-ef54-4746-af59-66251c709831	2026-07-31 16:18:12.415305-04	2026-07-31 16:18:12.415305-04	d8a8aa4f-458f-4a8c-9071-ab09baa9eb3f
Optimización de procesos de fermentación para la producción de bioetanol de segunda generación	Ana Lucía Martínez Fernández, Pedro Manuel Sánchez Díaz	Optimización de condiciones de fermentación usando cepas mejoradas de Saccharomyces cerevisiae con residuos lignocelulósicos como sustrato, incrementando el rendimiento en un 23%.	10.1016/j.biombioe.2025.107890	Biomass and Bioenergy	2025-01-22 00:00:00	{bioetanol,fermentación,biomasa,"segunda generación"}	BIO	https://doi.org/10.1016/j.biombioe.2025.107890	43c1e27f-b05b-4585-b75a-20481b756c30	2026-07-31 16:18:12.415305-04	2026-07-31 16:18:12.415305-04	dc0cd4cc-62d4-45fc-9cb1-0e14a13b977e
Recubrimientos anticorrosivos auto-reparables basados en microcápsulas para la protección de infraestructura industrial	Laura Isabel Hernández Torres, Carlos Alejandro Rodríguez Pérez	Diseño de recubrimientos inteligentes con microcápsulas de agentes reparadores que se activan ante daño mecánico, prolongando la vida útil de estructuras metálicas en ambientes agresivos.	10.1016/j.progpolymsci.2025.101890	Progress in Polymer Science	2025-08-12 00:00:00	{recubrimientos,auto-reparables,anticorrosivo,microcápsulas}	QUI	https://doi.org/10.1016/j.progpolymsci.2025.101890	fc8e0133-46c6-4141-93dc-04725e1abab3	2026-07-31 16:18:12.415305-04	2026-07-31 16:18:12.415305-04	2ea0b94d-b909-43dd-b0ce-d4a24bc5ef4a
Simulación de procesos térmicos para la mejora de eficiencia en hornos industriales cubanos	Pedro Manuel Sánchez Díaz, María Elena García López, Laura Isabel Hernández Torres	Modelo de simulación computacional para la optimización del flujo de calor y la distribución de temperatura en hornos industriales, logrando ahorros energéticos del 18%.	10.1016/j.apenergy.2025.124567	Applied Energy	2025-05-30 00:00:00	{simulación,"hornos industriales","eficiencia energética","transferencia de calor"}	ENE	https://doi.org/10.1016/j.apenergy.2025.124567	a9eaeb64-eeab-437a-8cba-68cec174605b	2026-07-31 16:18:12.415305-04	2026-07-31 16:18:12.415305-04	26ca44bf-abdf-4ef7-bad0-690b661b40d5
Plataforma IoT para el monitoreo en tiempo real de variables ambientales en plantas de procesamiento de alimentos	María Elena García López, Ana Lucía Martínez Fernández	Diseño e implementación de una plataforma de Internet de las Cosas para el monitoreo continuo de temperatura, humedad y calidad del aire en instalaciones de procesamiento alimentario.	10.1016/j.compag.2025.109876	Computers and Electronics in Agriculture	2025-03-08 00:00:00	{IoT,"monitoreo ambiental","industria alimentaria",sensores}	AUT	https://doi.org/10.1016/j.compag.2025.109876	e431d53b-cf12-4dcb-ac5d-2922d004e090	2026-07-31 16:18:12.415305-04	2026-07-31 16:18:12.415305-04	d8a8aa4f-458f-4a8c-9071-ab09baa9eb3f
Hidrógeno verde como vector energético para la industria química cubana: análisis de viabilidad	Pedro Manuel Sánchez Díaz, Carlos Alejandro Rodríguez Pérez, Ana Lucía Martínez Fernández	Estudio de viabilidad técnica y económica para la producción de hidrógeno verde mediante electrólisis solar en la industria química cubana, con proyección a 2030.	10.1016/j.ijhydrogen.2025.04.023	International Journal of Hydrogen Energy	2025-06-25 00:00:00	{"hidrógeno verde",electrólisis,"energía solar","industria química"}	ENE	https://doi.org/10.1016/j.ijhydrogen.2025.04.023	fa53ea77-24e7-43d3-b89d-bc0b85ac82a5	2026-07-31 16:18:12.415305-04	2026-07-31 16:18:12.415305-04	26ca44bf-abdf-4ef7-bad0-690b661b40d5
Materiales compuestos de fibra de coco para aplicaciones estructurales en la construcción civil cubana	Laura Isabel Hernández Torres, Pedro Manuel Sánchez Díaz	Caracterización mecánica de materiales compuestos reforzados con fibra de coco natural para uso en elementos estructurales no convencionales, con propiedades comparables a materiales sintéticos.	10.1016/j.compositesb.2025.110567	Composites Part B: Engineering	2025-04-02 00:00:00	{"materiales compuestos","fibra de coco",construcción,sostenibilidad}	SID	https://doi.org/10.1016/j.compositesb.2025.110567	563fcc6a-8fdd-43c6-93e1-299c2138d7d4	2026-07-31 16:18:12.415305-04	2026-07-31 16:18:12.415305-04	2ea0b94d-b909-43dd-b0ce-d4a24bc5ef4a
\.


--
-- Data for Name: technologies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.technologies (id, nombre, descripcion, sector_codigo, trl_nivel, referencia_ontologia, palabras_clave, created_at, updated_at) FROM stdin;
dd2cec24-a3df-410f-aac3-5272b0f1e7a5	Sistema de Control de Planta de Automatización	Sistema SCADA para control y monitoreo de procesos industriales automatizados en plantas de energía.	AUT	6	\N	{SCADA,automatización,"control industrial"}	2026-07-28 08:43:35.789035-04	2026-07-28 08:43:35.789035-04
06227e6e-be3c-4021-be00-b95835872040	Procesamiento de Aleaciones de Aluminio	Tecnología de fundición y laminado de aleaciones ligeras para componentes estructurales.	MET	7	\N	{aleaciones,aluminio,fundición,laminado}	2026-07-28 08:43:35.789035-04	2026-07-28 08:43:35.789035-04
fc7d272a-1352-48ea-aa9a-951daa966869	Recubrimiento Anti-Corrosivo para Estructuras Siderúrgicas	Recubrimientos nanotecnológicos que prolongan la vida útil de estructuras de acero en ambientes hostiles.	SID	5	\N	{anti-corrosión,nanotecnología,acero}	2026-07-28 08:43:35.789035-04	2026-07-28 08:43:35.789035-04
dd9677d0-151e-488d-b322-2e26fcf862c7	Micro-Red Inteligente con Integración Solar	Red eléctrica distribuida con gestión inteligente de demanda y fuentes renovables fotovoltaicas.	ELE	4	\N	{micro-red,solar,"gestión inteligente",renovable}	2026-07-28 08:43:35.789035-04	2026-07-28 08:43:35.789035-04
0fe546be-1b14-4708-b4fc-1595265ce3a6	Biotransformación de Biomasa Agrícola	Procesos enzimáticos para conversión de residuos agrícolas en bioproductos de valor agregado.	QUI	3	\N	{biomasa,biotransformación,enzimas,bioproductos}	2026-07-28 08:43:35.789035-04	2026-07-28 08:43:35.789035-04
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, email, hashed_password, full_name, role, phone, job_title, organization_id, is_active, is_superuser, created_at, updated_at, account_type, status, rejection_reason, approved_by, approved_at) FROM stdin;
3c831c5f-a56d-4a88-812d-3e1ce8203ada	usuario	usuario@mindus.gob.cu	$2b$12$XJXlzy9fiWmh2P.9HjgLa.Tn86ikPdcziYPwS.Bi35zlD6SPamx/S	Juan Perez Garcia	rep_cti	\N	\N	\N	t	f	2026-07-28 11:05:53.714639-04	2026-07-28 11:05:53.714639-04	representante	approved	\N	\N	\N
72b209cd-2f89-4fac-a9a7-15075fefb133	analista	analista@mindus.gob.cu	$2b$12$yXM5ylh1DEM./9sydZxH2OqEbNPRn7yn3YjigBagBuKW0tvTG01Gm	Ana analista	analista	\N	\N	\N	t	f	2026-07-28 11:05:53.714639-04	2026-07-28 11:05:53.714639-04	analista	approved	\N	\N	\N
7a72d5e0-b057-4150-9e25-dc1d8df40788	admin@mindus.gob.cu	admin@mindus.gob.cu	$2b$12$gccfufGji49dFvC820IMxeopiuES1KQlQYSRacxNHYOyGZYWBgvUe	Administrador MINDUS	admin_mindus	\N	\N	\N	t	t	2026-07-20 12:22:20.10449-04	2026-07-23 13:22:40.094292-04	\N	approved	\N	\N	\N
4960f9bd-8c94-4f8c-92fb-1e4685719de8	enmanuel	prueba@gmail.com	$2b$12$HAqjAcW5cYYL7b5fQJlusO31SmaieZYwpGGmbCzr4w3o0iJOkacG.	Enmanuel Perez 	rep_cti	51234567	CEO	35fcc164-0b41-47ab-8bb0-a7e70b39021b	t	f	2026-07-23 10:07:40.286901-04	2026-07-23 13:24:45.910498-04	representante	approved	\N	7a72d5e0-b057-4150-9e25-dc1d8df40788	2026-07-23 10:07:54.345644-04
367b6059-8601-4706-9f83-fe9d241d4638	carlos_mendez	carlos@bionova.cu	$2b$12$ajbN7XwtGpuiH3Yxymz4mOaJfDpjVbxdkrVz0MHH5sBzPu7Ex9bfO	Carlos Mendez	rep_cti	51234501	Director Tecnico	85fa07b0-01ef-4de6-8f3b-85274e9b8e65	t	f	2026-07-24 11:32:13.316937-04	2026-07-24 11:32:13.316937-04	representante	approved	\N	\N	2026-07-24 11:32:13.316937-04
3aad5dfa-d731-449a-96b4-684567d8535a	ana_rodriguez	ana@autotech.cu	$2b$12$ajbN7XwtGpuiH3Yxymz4mOaJfDpjVbxdkrVz0MHH5sBzPu7Ex9bfO	Ana Rodriguez	rep_cti	51234502	Jefa de I+D	87f2bb74-64fa-42f2-a08d-e04753c23133	t	f	2026-07-24 11:32:13.316937-04	2026-07-24 11:32:13.316937-04	representante	approved	\N	\N	2026-07-24 11:32:13.316937-04
8c3da74c-fbce-43d9-9e76-fd68dcca3811	pedro_castillo	pedro@quimicuba.cu	$2b$12$ajbN7XwtGpuiH3Yxymz4mOaJfDpjVbxdkrVz0MHH5sBzPu7Ex9bfO	Pedro Castillo	rep_cti	51234503	Gerente General	e290e6f8-5c11-4959-a470-6dfe8271ad91	t	f	2026-07-24 11:32:13.316937-04	2026-07-24 11:32:13.316937-04	representante	approved	\N	\N	2026-07-24 11:32:13.316937-04
3a2f8438-3ff8-445e-aad4-ca4a258276ba	raul	raul@elevc.cu	$2b$12$Ah0D/28ntHSZeB90mbapF.ekSYgSxxPQ.NBwKTiuHEdthzS2tP6Fa	Raul Gutierrez	rep_cti	\N	\N	da424081-7494-4023-8b31-b57fb5114d87	t	f	2026-07-30 09:52:24.03706-04	2026-07-30 09:52:24.03706-04	representante	approved	\N	\N	\N
545f87a5-a46b-4eea-99da-d4f6bbc490ef	maria	maria@techno.cu	$2b$12$bSO8IA73X1w6caUfN.13CuiK/IT76mr5KvCL69qKi0k53XV2aQmOe	Maria Elena Garcia	rep_cti	\N	\N	48fb33ef-429a-4550-a434-8e0c00be96a7	t	f	2026-07-30 10:22:54.695843-04	2026-07-30 10:22:54.695843-04	representante	approved	\N	\N	\N
cabd30a6-0330-4427-a575-1dba74f8c18d	paco	paco@gmail.com	$2b$12$CJQIzXfpmwfMt865dou5jOKRpWzUx0tjXUt1R0uSA3T7RrHVXQDO6	Paco Perez	profesional	\N	\N	\N	t	f	2026-07-28 11:05:53.714639-04	2026-07-28 11:05:53.714639-04	profesional	approved	\N	\N	\N
503feeb7-d8f4-4903-9d5c-badc07923627	mario	profecional@gmail.com	$2b$12$5yFfAMQIDW/QMh2AfvZrbeONtEoP43TaBAEkk4NmmK0o.0DL.7auq	Mario Rodriguez	profesional	52345678	\N	\N	t	f	2026-07-31 09:29:33.310315-04	2026-07-31 09:30:10.850465-04	profesional	approved	\N	7a72d5e0-b057-4150-9e25-dc1d8df40788	2026-07-31 09:30:10.843761-04
dc0cd4cc-62d4-45fc-9cb1-0e14a13b977e	ana.martinez	ana.martinez@mindus.gob.cu	$2b$12$B6CkJeQoikiaA0saQ0RpcOl3mP0kmNdu7vjafeskrTCIYr61Wxnja	Ana Lucía Martínez Fernández	profesional	\N	\N	\N	t	f	2026-07-31 11:46:42.677125-04	2026-07-31 11:46:42.677125-04	profesional	approved	\N	\N	\N
e00f5c60-acfc-459d-9819-c8cb88ad06ef	carlos.rodriguez	carlos.rodriguez@mindus.gob.cu	$2b$12$B6CkJeQoikiaA0saQ0RpcOl3mP0kmNdu7vjafeskrTCIYr61Wxnja	Carlos Alejandro Rodríguez Pérez	profesional	\N	\N	\N	t	f	2026-07-31 11:46:42.464888-04	2026-07-31 11:46:42.464888-04	profesional	approved	\N	\N	\N
2ea0b94d-b909-43dd-b0ce-d4a24bc5ef4a	laura.hernandez	laura.hernandez@mindus.gob.cu	$2b$12$B6CkJeQoikiaA0saQ0RpcOl3mP0kmNdu7vjafeskrTCIYr61Wxnja	Laura Isabel Hernández Torres	profesional	\N	\N	\N	t	f	2026-07-31 11:46:43.088349-04	2026-07-31 11:46:43.088349-04	profesional	approved	\N	\N	\N
d8a8aa4f-458f-4a8c-9071-ab09baa9eb3f	maria.garcia	maria.garcia@mindus.gob.cu	$2b$12$B6CkJeQoikiaA0saQ0RpcOl3mP0kmNdu7vjafeskrTCIYr61Wxnja	María Elena García López	profesional	\N	\N	\N	t	f	2026-07-31 11:46:42.242845-04	2026-07-31 11:46:42.242845-04	profesional	approved	\N	\N	\N
26ca44bf-abdf-4ef7-bad0-690b661b40d5	pedro.sanchez	pedro.sanchez@mindus.gob.cu	$2b$12$B6CkJeQoikiaA0saQ0RpcOl3mP0kmNdu7vjafeskrTCIYr61Wxnja	Pedro Manuel Sánchez Díaz	profesional	\N	\N	\N	t	f	2026-07-31 11:46:42.885274-04	2026-07-31 11:46:42.885274-04	profesional	approved	\N	\N	\N
\.


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: bulletins bulletins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bulletins
    ADD CONSTRAINT bulletins_pkey PRIMARY KEY (id);


--
-- Name: competitiveness_indices competitiveness_indices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competitiveness_indices
    ADD CONSTRAINT competitiveness_indices_pkey PRIMARY KEY (id);


--
-- Name: follows follows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_pkey PRIMARY KEY (id);


--
-- Name: indicators indicators_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.indicators
    ADD CONSTRAINT indicators_pkey PRIMARY KEY (id);


--
-- Name: industrial_sectores industrial_sectores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.industrial_sectores
    ADD CONSTRAINT industrial_sectores_pkey PRIMARY KEY (codigo);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_siglas_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_siglas_key UNIQUE (siglas);


--
-- Name: patent_map_entries patent_map_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patent_map_entries
    ADD CONSTRAINT patent_map_entries_pkey PRIMARY KEY (id);


--
-- Name: patents patents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patents
    ADD CONSTRAINT patents_pkey PRIMARY KEY (id);


--
-- Name: professional_profiles professional_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professional_profiles
    ADD CONSTRAINT professional_profiles_pkey PRIMARY KEY (id);


--
-- Name: professional_profiles professional_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professional_profiles
    ADD CONSTRAINT professional_profiles_user_id_key UNIQUE (user_id);


--
-- Name: regulations regulations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regulations
    ADD CONSTRAINT regulations_pkey PRIMARY KEY (id);


--
-- Name: research_publications research_publications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_publications
    ADD CONSTRAINT research_publications_pkey PRIMARY KEY (id);


--
-- Name: technologies technologies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technologies
    ADD CONSTRAINT technologies_pkey PRIMARY KEY (id);


--
-- Name: follows uq_follow; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT uq_follow UNIQUE (follower_id, follower_type, organization_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_alerts_leida; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_alerts_leida ON public.alerts USING btree (leida);


--
-- Name: ix_alerts_severidad; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_alerts_severidad ON public.alerts USING btree (severidad);


--
-- Name: ix_indicators_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_indicators_code ON public.indicators USING btree (code);


--
-- Name: ix_indicators_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_indicators_period ON public.indicators USING btree (period);


--
-- Name: ix_indicators_sector_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_indicators_sector_codigo ON public.indicators USING btree (sector_codigo);


--
-- Name: ix_indicators_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_indicators_source ON public.indicators USING btree (source);


--
-- Name: ix_organizations_pais; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_organizations_pais ON public.organizations USING btree (pais);


--
-- Name: ix_organizations_sector_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_organizations_sector_codigo ON public.organizations USING btree (sector_codigo);


--
-- Name: ix_organizations_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_organizations_tipo ON public.organizations USING btree (tipo);


--
-- Name: ix_patents_applicant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_patents_applicant ON public.patents USING btree (applicant);


--
-- Name: ix_patents_country; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_patents_country ON public.patents USING btree (country);


--
-- Name: ix_patents_filing_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_patents_filing_date ON public.patents USING btree (filing_date);


--
-- Name: ix_patents_inventor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_patents_inventor ON public.patents USING btree (inventor);


--
-- Name: ix_patents_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_patents_organization_id ON public.patents USING btree (organization_id);


--
-- Name: ix_patents_patent_number; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_patents_patent_number ON public.patents USING btree (patent_number);


--
-- Name: ix_patents_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_patents_status ON public.patents USING btree (status);


--
-- Name: ix_patents_technological_sector; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_patents_technological_sector ON public.patents USING btree (technological_sector);


--
-- Name: ix_patents_technology_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_patents_technology_id ON public.patents USING btree (technology_id);


--
-- Name: ix_professional_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_professional_profiles_user_id ON public.professional_profiles USING btree (user_id);


--
-- Name: ix_regulations_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_regulations_category ON public.regulations USING btree (category);


--
-- Name: ix_regulations_issuing_body; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_regulations_issuing_body ON public.regulations USING btree (issuing_body);


--
-- Name: ix_regulations_publication_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_regulations_publication_date ON public.regulations USING btree (publication_date);


--
-- Name: ix_regulations_regulation_number; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_regulations_regulation_number ON public.regulations USING btree (regulation_number);


--
-- Name: ix_regulations_sector_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_regulations_sector_codigo ON public.regulations USING btree (sector_codigo);


--
-- Name: ix_technologies_sector_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_technologies_sector_codigo ON public.technologies USING btree (sector_codigo);


--
-- Name: ix_technologies_trl_nivel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_technologies_trl_nivel ON public.technologies USING btree (trl_nivel);


--
-- Name: ix_users_account_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_users_account_type ON public.users USING btree (account_type);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_users_is_active ON public.users USING btree (is_active);


--
-- Name: ix_users_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_users_organization_id ON public.users USING btree (organization_id);


--
-- Name: ix_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_users_role ON public.users USING btree (role);


--
-- Name: ix_users_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_users_status ON public.users USING btree (status);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: alerts alerts_sector_codigo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_sector_codigo_fkey FOREIGN KEY (sector_codigo) REFERENCES public.industrial_sectores(codigo);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: bulletins bulletins_sector_codigo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bulletins
    ADD CONSTRAINT bulletins_sector_codigo_fkey FOREIGN KEY (sector_codigo) REFERENCES public.industrial_sectores(codigo);


--
-- Name: competitiveness_indices competitiveness_indices_sector_codigo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competitiveness_indices
    ADD CONSTRAINT competitiveness_indices_sector_codigo_fkey FOREIGN KEY (sector_codigo) REFERENCES public.industrial_sectores(codigo);


--
-- Name: users fk_users_approved_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_approved_by FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: follows follows_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: indicators indicators_sector_codigo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.indicators
    ADD CONSTRAINT indicators_sector_codigo_fkey FOREIGN KEY (sector_codigo) REFERENCES public.industrial_sectores(codigo);


--
-- Name: organizations organizations_sector_codigo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_sector_codigo_fkey FOREIGN KEY (sector_codigo) REFERENCES public.industrial_sectores(codigo);


--
-- Name: patent_map_entries patent_map_entries_sector_codigo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patent_map_entries
    ADD CONSTRAINT patent_map_entries_sector_codigo_fkey FOREIGN KEY (sector_codigo) REFERENCES public.industrial_sectores(codigo);


--
-- Name: patents patents_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patents
    ADD CONSTRAINT patents_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: patents patents_technology_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patents
    ADD CONSTRAINT patents_technology_id_fkey FOREIGN KEY (technology_id) REFERENCES public.technologies(id);


--
-- Name: professional_profiles professional_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professional_profiles
    ADD CONSTRAINT professional_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: regulations regulations_sector_codigo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regulations
    ADD CONSTRAINT regulations_sector_codigo_fkey FOREIGN KEY (sector_codigo) REFERENCES public.industrial_sectores(codigo);


--
-- Name: research_publications research_publications_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_publications
    ADD CONSTRAINT research_publications_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: research_publications research_publications_sector_codigo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_publications
    ADD CONSTRAINT research_publications_sector_codigo_fkey FOREIGN KEY (sector_codigo) REFERENCES public.industrial_sectores(codigo);


--
-- Name: technologies technologies_sector_codigo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technologies
    ADD CONSTRAINT technologies_sector_codigo_fkey FOREIGN KEY (sector_codigo) REFERENCES public.industrial_sectores(codigo);


--
-- Name: users users_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- PostgreSQL database dump complete
--

