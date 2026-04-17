--
-- PostgreSQL database dump
--

\restrict kz978vcNXS2NBTC7XC8J7T6FJmvPouGj4CyNADGeEFZvFfQOkT2we2zh8w1rkE0

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-04-17 14:12:53

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
-- TOC entry 2 (class 3079 OID 16389)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5059 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 16427)
-- Name: conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid NOT NULL,
    agent_id uuid,
    channel character varying(50) NOT NULL,
    status character varying(50) DEFAULT 'PENDING'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.conversations OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16416)
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    phone character varying(20),
    email character varying(255),
    metadata jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16448)
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_type character varying(50) NOT NULL,
    content text NOT NULL,
    ai_analysis jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16400)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(100) NOT NULL,
    role character varying(50) DEFAULT 'AGENT'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 5052 (class 0 OID 16427)
-- Dependencies: 222
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conversations (id, customer_id, agent_id, channel, status, created_at) FROM stdin;
766434e8-97fd-45e4-ac30-c76e16495294	8e87247a-f65a-46f8-8616-69493a1e0add	\N	FACEBOOK	ACTIVE	2026-04-17 12:52:42.388456+07
\.


--
-- TOC entry 5051 (class 0 OID 16416)
-- Dependencies: 221
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, name, phone, email, metadata, created_at) FROM stdin;
8e87247a-f65a-46f8-8616-69493a1e0add	Nguyễn văn tèo	0901234567	khachhang@gmail.com	{"source": "facebook"}	2026-04-17 12:52:04.223315+07
\.


--
-- TOC entry 5053 (class 0 OID 16448)
-- Dependencies: 223
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, conversation_id, sender_type, content, ai_analysis, created_at) FROM stdin;
09d98023-13ff-4a6d-bc8c-fc94e5d8f2fd	766434e8-97fd-45e4-ac30-c76e16495294	CUSTOMER	Sản phẩm này còn hàng không shop?	\N	2026-04-17 13:00:15.730444+07
ef71f3bc-69a1-475a-b537-6ed96ceeefe0	766434e8-97fd-45e4-ac30-c76e16495294	STAFF	ko biết	\N	2026-04-17 13:40:50.158527+07
\.


--
-- TOC entry 5050 (class 0 OID 16400)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, full_name, role, created_at) FROM stdin;
d6fc7851-31ce-432b-9d0c-d38e243a1bc8	test@gmail.com	$2b$10$VocfxXyA2WtUHbe0YL8uU.BpUGQPWgF2edaS64RY28kcdWPMxjpJi	Hung basic	ADMIN	2026-04-17 09:42:17.835013+07
530e6a34-11f1-49a2-aa8f-ee094893ecf7	test1@gmail.com	$2b$10$W/cgxNFiceupfpw2lGxtBOYCdhkdfXT0lNsIWD2oRzBB2K5BuGx1O	test	STAFF	2026-04-17 13:47:56.787809+07
\.


--
-- TOC entry 4895 (class 2606 OID 16437)
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- TOC entry 4893 (class 2606 OID 16426)
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- TOC entry 4899 (class 2606 OID 16460)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- TOC entry 4889 (class 2606 OID 16415)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4891 (class 2606 OID 16413)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4896 (class 1259 OID 16466)
-- Name: idx_conversations_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conversations_customer_id ON public.conversations USING btree (customer_id);


--
-- TOC entry 4897 (class 1259 OID 16467)
-- Name: idx_messages_conversation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_conversation_id ON public.messages USING btree (conversation_id);


--
-- TOC entry 4900 (class 2606 OID 16443)
-- Name: conversations conversations_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4901 (class 2606 OID 16438)
-- Name: conversations conversations_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- TOC entry 4902 (class 2606 OID 16461)
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


-- Completed on 2026-04-17 14:12:53

--
-- PostgreSQL database dump complete
--

\unrestrict kz978vcNXS2NBTC7XC8J7T6FJmvPouGj4CyNADGeEFZvFfQOkT2we2zh8w1rkE0

