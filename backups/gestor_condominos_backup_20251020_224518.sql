--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

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

DROP DATABASE IF EXISTS gestor_condominos;
--
-- Name: gestor_condominos; Type: DATABASE; Schema: -; Owner: devuser
--

CREATE DATABASE gestor_condominos WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE gestor_condominos OWNER TO devuser;

\connect gestor_condominos

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
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: update_communication_logs_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_communication_logs_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_communication_logs_updated_at() OWNER TO postgres;

--
-- Name: update_document_search_vector(); Type: FUNCTION; Schema: public; Owner: mini-server
--

CREATE FUNCTION public.update_document_search_vector() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('spanish', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('spanish', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('spanish', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_document_search_vector() OWNER TO "mini-server";

--
-- Name: update_tasks_completed_at(); Type: FUNCTION; Schema: public; Owner: mini-server
--

CREATE FUNCTION public.update_tasks_completed_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = CURRENT_TIMESTAMP;
    ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_tasks_completed_at() OWNER TO "mini-server";

--
-- Name: update_tasks_updated_at(); Type: FUNCTION; Schema: public; Owner: mini-server
--

CREATE FUNCTION public.update_tasks_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_tasks_updated_at() OWNER TO "mini-server";

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: mini-server
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO "mini-server";

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: arrears; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.arrears (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    member_id uuid NOT NULL,
    building_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    original_amount numeric(10,2) NOT NULL,
    due_date date NOT NULL,
    description text NOT NULL,
    status character varying(50) NOT NULL,
    last_reminder_sent timestamp without time zone,
    reminder_count integer DEFAULT 0,
    settled_date date,
    settlement_transaction_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.arrears OWNER TO "mini-server";

--
-- Name: attendance_sheets; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.attendance_sheets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    building_id uuid NOT NULL,
    convocatoria_id uuid,
    minute_id uuid,
    meeting_date date NOT NULL,
    total_members integer NOT NULL,
    present_members integer NOT NULL,
    represented_members integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.attendance_sheets OWNER TO "mini-server";

--
-- Name: attendees; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.attendees (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    attendance_sheet_id uuid,
    member_id uuid NOT NULL,
    member_name character varying(255) NOT NULL,
    attendance_type character varying(20) NOT NULL,
    representative_name character varying(255),
    signature text,
    arrival_time time without time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT attendees_attendance_type_check CHECK (((attendance_type)::text = ANY (ARRAY[('present'::character varying)::text, ('represented'::character varying)::text, ('absent'::character varying)::text])))
);


ALTER TABLE public.attendees OWNER TO "mini-server";

--
-- Name: buildings; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.buildings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    address text NOT NULL,
    postal_code character varying(20),
    city character varying(100),
    number_of_units integer DEFAULT 0,
    administrator character varying(255),
    admin_contact character varying(50),
    admin_email character varying(255),
    iban character varying(34),
    bank character varying(255),
    account_number character varying(50),
    swift character varying(11),
    phone character varying(50),
    email character varying(255),
    president_name character varying(255),
    president_email character varying(255),
    secretary_name character varying(255),
    secretary_email character varying(255),
    administrator_name character varying(255),
    administrator_email character varying(255),
    notes text,
    registration_number character varying(100),
    construction_year integer,
    total_units integer,
    legal_framework jsonb,
    statutes jsonb,
    internal_rules jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.buildings OWNER TO "mini-server";

--
-- Name: communication_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.communication_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    member_id uuid NOT NULL,
    building_id uuid NOT NULL,
    communication_type character varying(50) NOT NULL,
    communication_subtype character varying(50),
    channel character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'draft_created'::character varying NOT NULL,
    subject text,
    body_preview text,
    full_content text,
    pdf_url text,
    pdf_filename character varying(255),
    related_convocatoria_id uuid,
    related_minute_id uuid,
    related_transaction_id uuid,
    draft_created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    sent_at timestamp with time zone,
    opened_at timestamp with time zone,
    confirmed_at timestamp with time zone,
    failed_at timestamp with time zone,
    error_message text,
    retry_count integer DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.communication_logs OWNER TO postgres;

--
-- Name: TABLE communication_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.communication_logs IS 'Registo de todas as comunicações enviadas aos condóminos (email, WhatsApp, etc.)';


--
-- Name: COLUMN communication_logs.communication_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.communication_logs.communication_type IS 'Tipo de comunicação: convocatoria, acta, quota, note, letter';


--
-- Name: COLUMN communication_logs.channel; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.communication_logs.channel IS 'Canal utilizado: email ou whatsapp';


--
-- Name: COLUMN communication_logs.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.communication_logs.status IS 'Estado: draft_created, sent, opened, confirmed, failed';


--
-- Name: COLUMN communication_logs.metadata; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.communication_logs.metadata IS 'Dados adicionais em formato JSON (flexível para diferentes tipos de comunicação)';


--
-- Name: convocatorias; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.convocatorias (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    building_id uuid NOT NULL,
    building_name text NOT NULL,
    building_address text NOT NULL,
    postal_code character varying(20),
    city character varying(100),
    assembly_number character varying(50),
    assembly_type character varying(50) NOT NULL,
    meeting_type character varying(50),
    title character varying(255),
    date date NOT NULL,
    meeting_date date,
    "time" character varying(10) NOT NULL,
    location text NOT NULL,
    meeting_location text,
    second_call_enabled boolean DEFAULT true,
    second_call_time character varying(10),
    second_call_date date,
    administrator character varying(255) NOT NULL,
    secretary character varying(255),
    legal_reference text,
    minutes_created boolean DEFAULT false,
    agenda_items jsonb,
    convocation_date date,
    legal_notice_period integer,
    delivery_method character varying(50),
    attached_documents jsonb,
    legal_validation jsonb,
    quorum_requirements jsonb,
    status character varying(50) DEFAULT 'draft'::character varying,
    meeting_subject text,
    president_name character varying(255),
    president_email character varying(255),
    secretary_name character varying(255),
    secretary_email character varying(255),
    administrator_name character varying(255),
    administrator_email character varying(255),
    notification_sent_at timestamp without time zone,
    published_at timestamp without time zone,
    published_by_user_id uuid,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.convocatorias OWNER TO "mini-server";

--
-- Name: document_categories; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.document_categories (
    id integer NOT NULL,
    building_id uuid,
    name character varying(100) NOT NULL,
    description text,
    color character varying(7) DEFAULT '#6366f1'::character varying,
    icon character varying(50) DEFAULT 'folder'::character varying,
    parent_category_id integer,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.document_categories OWNER TO "mini-server";

--
-- Name: document_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: mini-server
--

CREATE SEQUENCE public.document_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.document_categories_id_seq OWNER TO "mini-server";

--
-- Name: document_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: mini-server
--

ALTER SEQUENCE public.document_categories_id_seq OWNED BY public.document_categories.id;


--
-- Name: document_shares; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.document_shares (
    id integer NOT NULL,
    document_id integer,
    member_id uuid,
    permission character varying(20) DEFAULT 'read'::character varying,
    shared_by character varying(100),
    shared_at timestamp without time zone DEFAULT now(),
    expires_at timestamp without time zone
);


ALTER TABLE public.document_shares OWNER TO "mini-server";

--
-- Name: document_shares_id_seq; Type: SEQUENCE; Schema: public; Owner: mini-server
--

CREATE SEQUENCE public.document_shares_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.document_shares_id_seq OWNER TO "mini-server";

--
-- Name: document_shares_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: mini-server
--

ALTER SEQUENCE public.document_shares_id_seq OWNED BY public.document_shares.id;


--
-- Name: documents; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.documents (
    id integer NOT NULL,
    building_id uuid,
    member_id uuid,
    name character varying(255) NOT NULL,
    original_name character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    file_size integer NOT NULL,
    mime_type character varying(100) NOT NULL,
    file_extension character varying(10) NOT NULL,
    category character varying(50) DEFAULT 'general'::character varying NOT NULL,
    subcategory character varying(50),
    tags text[],
    description text,
    version integer DEFAULT 1,
    parent_document_id integer,
    is_current_version boolean DEFAULT true,
    visibility character varying(20) DEFAULT 'building'::character varying,
    is_confidential boolean DEFAULT false,
    access_level character varying(20) DEFAULT 'read'::character varying,
    uploaded_by character varying(100),
    uploaded_at timestamp without time zone DEFAULT now(),
    last_accessed_at timestamp without time zone,
    download_count integer DEFAULT 0,
    search_vector tsvector,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.documents OWNER TO "mini-server";

--
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: mini-server
--

CREATE SEQUENCE public.documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_id_seq OWNER TO "mini-server";

--
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: mini-server
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- Name: financial_periods; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.financial_periods (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    building_id uuid NOT NULL,
    year integer NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    approved_budget jsonb,
    budget_approval_date date,
    budget_approval_minute_id uuid,
    reserve_fund_minimum numeric(12,2),
    reserve_fund_actual numeric(12,2),
    legal_compliance_check jsonb,
    is_closed boolean DEFAULT false,
    closed_at timestamp without time zone,
    total_income numeric(12,2),
    total_expenses numeric(12,2),
    balance numeric(12,2),
    notes text,
    closed_by_user_id uuid,
    initial_balance numeric(12,2),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.financial_periods OWNER TO "mini-server";

--
-- Name: fractions; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.fractions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    building_id uuid NOT NULL,
    member_id uuid,
    unit_number character varying(50) NOT NULL,
    ownership_percentage numeric(5,2),
    surface_area numeric(10,2),
    fraction_type character varying(50),
    is_active boolean DEFAULT true,
    deed_reference character varying(255),
    acquisition_date date,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.fractions OWNER TO "mini-server";

--
-- Name: knex_migrations; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.knex_migrations (
    id integer NOT NULL,
    name character varying(255),
    batch integer,
    migration_time timestamp with time zone
);


ALTER TABLE public.knex_migrations OWNER TO "mini-server";

--
-- Name: knex_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: mini-server
--

CREATE SEQUENCE public.knex_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.knex_migrations_id_seq OWNER TO "mini-server";

--
-- Name: knex_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: mini-server
--

ALTER SEQUENCE public.knex_migrations_id_seq OWNED BY public.knex_migrations.id;


--
-- Name: knex_migrations_lock; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.knex_migrations_lock (
    index integer NOT NULL,
    is_locked integer
);


ALTER TABLE public.knex_migrations_lock OWNER TO "mini-server";

--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE; Schema: public; Owner: mini-server
--

CREATE SEQUENCE public.knex_migrations_lock_index_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.knex_migrations_lock_index_seq OWNER TO "mini-server";

--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: mini-server
--

ALTER SEQUENCE public.knex_migrations_lock_index_seq OWNED BY public.knex_migrations_lock.index;


--
-- Name: letter_templates; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.letter_templates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    building_id uuid,
    name character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    subject character varying(255),
    content text NOT NULL,
    variables text[],
    is_active boolean DEFAULT true,
    legal_basis text,
    required_fields text[],
    validation_rules jsonb,
    title character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.letter_templates OWNER TO "mini-server";

--
-- Name: meeting_members; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.meeting_members (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    building_id uuid NOT NULL,
    minutes_id uuid NOT NULL,
    member_id uuid NOT NULL,
    member_name character varying(255) NOT NULL,
    apartment character varying(50) NOT NULL,
    votes integer DEFAULT 1,
    attendance_type character varying(50) NOT NULL,
    is_president boolean DEFAULT false,
    is_secretary boolean DEFAULT false,
    representative_name character varying(255),
    signature text,
    arrival_time time without time zone,
    departure_time time without time zone,
    voting_power numeric(5,2),
    percentage_represented numeric(5,2),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.meeting_members OWNER TO "mini-server";

--
-- Name: member_annual_fees; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.member_annual_fees (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    member_id uuid NOT NULL,
    building_id uuid NOT NULL,
    financial_period_id uuid,
    year integer NOT NULL,
    fee_amount numeric(10,2) NOT NULL,
    paid_amount numeric(10,2) DEFAULT 0,
    is_paid boolean DEFAULT false,
    due_date date,
    paid_date date,
    payment_method character varying(50),
    transaction_id uuid,
    notes text,
    late_fee numeric(10,2),
    installments integer,
    installment_amount numeric(10,2),
    fraction_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.member_annual_fees OWNER TO "mini-server";

--
-- Name: member_votes; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.member_votes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    minute_agenda_item_id uuid NOT NULL,
    member_id uuid NOT NULL,
    building_id uuid,
    member_name character varying(255) NOT NULL,
    apartment character varying(50) NOT NULL,
    vote character varying(20) NOT NULL,
    voting_power numeric(5,2) DEFAULT 1,
    representative_name character varying(255),
    comments text,
    vote_timestamp timestamp without time zone,
    is_proxy_vote boolean DEFAULT false,
    proxy_document_url text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT member_votes_vote_check CHECK (((vote)::text = ANY (ARRAY[('favor'::character varying)::text, ('against'::character varying)::text, ('abstention'::character varying)::text])))
);


ALTER TABLE public.member_votes OWNER TO "mini-server";

--
-- Name: members; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.members (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    building_id uuid NOT NULL,
    name text NOT NULL,
    apartment character varying(50),
    fraction character varying(50),
    votes integer DEFAULT 0,
    email character varying(255),
    phone character varying(50),
    profile_image text,
    notes text,
    old_annual_fee numeric(10,2) DEFAULT 0,
    old_monthly_fee numeric(10,2) DEFAULT 0,
    new_annual_fee numeric(10,2) DEFAULT 0,
    new_monthly_fee numeric(10,2) DEFAULT 0,
    permilage numeric(10,4) DEFAULT 0,
    is_active boolean DEFAULT true,
    nif character varying(20),
    nif_nie character varying(20),
    address text,
    ownership_percentage numeric(5,2),
    deed_date date,
    legal_representative_id uuid,
    role character varying(50) DEFAULT 'owner'::character varying,
    monthly_fee numeric(10,2),
    annual_fee numeric(10,2),
    avatar_url text,
    secondary_address text,
    secondary_postal_code character varying(10),
    secondary_city character varying(100),
    secondary_country character varying(100) DEFAULT 'Portugal'::character varying,
    user_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    email_consent boolean DEFAULT false,
    email_consent_date timestamp with time zone,
    whatsapp_number character varying(20),
    whatsapp_consent boolean DEFAULT false,
    whatsapp_consent_date timestamp with time zone,
    preferred_communication character varying(20) DEFAULT 'email'::character varying
);


ALTER TABLE public.members OWNER TO "mini-server";

--
-- Name: COLUMN members.email_consent; Type: COMMENT; Schema: public; Owner: mini-server
--

COMMENT ON COLUMN public.members.email_consent IS 'Consentimento para comunicações por email (Lei n.º 8/2022)';


--
-- Name: COLUMN members.email_consent_date; Type: COMMENT; Schema: public; Owner: mini-server
--

COMMENT ON COLUMN public.members.email_consent_date IS 'Data do consentimento para email';


--
-- Name: COLUMN members.whatsapp_number; Type: COMMENT; Schema: public; Owner: mini-server
--

COMMENT ON COLUMN public.members.whatsapp_number IS 'Número WhatsApp com código país (+351...)';


--
-- Name: COLUMN members.whatsapp_consent; Type: COMMENT; Schema: public; Owner: mini-server
--

COMMENT ON COLUMN public.members.whatsapp_consent IS 'Consentimento para comunicações informais por WhatsApp';


--
-- Name: COLUMN members.whatsapp_consent_date; Type: COMMENT; Schema: public; Owner: mini-server
--

COMMENT ON COLUMN public.members.whatsapp_consent_date IS 'Data do consentimento para WhatsApp';


--
-- Name: minute_agenda_items; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.minute_agenda_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    minutes_id uuid,
    building_id uuid,
    item_number integer NOT NULL,
    title text NOT NULL,
    description text,
    discussion text,
    decision text,
    vote_type character varying(50),
    votes_in_favor integer,
    votes_against integer,
    abstentions integer,
    is_approved boolean DEFAULT false,
    legal_requirement character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    convocatoria_id uuid
);


ALTER TABLE public.minute_agenda_items OWNER TO "mini-server";

--
-- Name: minutes; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.minutes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    building_id uuid NOT NULL,
    convocatoria_id uuid,
    minute_number character varying(50) NOT NULL,
    meeting_date date NOT NULL,
    meeting_time character varying(10) NOT NULL,
    end_time character varying(10),
    start_time character varying(10),
    location text NOT NULL,
    meeting_location text,
    assembly_type character varying(50) NOT NULL,
    building_address text NOT NULL,
    building_name character varying(255),
    postal_code character varying(20),
    president_name character varying(255) NOT NULL,
    administrator_custom character varying(255),
    secretary_name character varying(255) NOT NULL,
    secretary_custom character varying(255),
    conclusions text,
    attendees jsonb,
    total_units_represented integer,
    total_percentage_represented numeric(5,2),
    quorum_achieved boolean,
    agenda_development jsonb,
    votes_record jsonb,
    agreements_reached jsonb,
    legal_validity boolean,
    signed_date date,
    president_signature text,
    secretary_signature text,
    final_document_url text,
    attendees_count integer,
    quorum_percentage numeric(5,2),
    quorum_met boolean,
    agenda_items jsonb,
    decisions jsonb,
    voting_results jsonb,
    next_meeting_date date,
    attachments jsonb,
    is_approved boolean DEFAULT false,
    approved_at timestamp without time zone,
    approved_by_user_id uuid,
    notes text,
    status character varying(50) DEFAULT 'draft'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.minutes OWNER TO "mini-server";

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token character varying(500) NOT NULL,
    user_id uuid NOT NULL,
    device_id character varying(255),
    device_name character varying(255),
    ip_address character varying(45),
    user_agent text,
    expires_at timestamp with time zone NOT NULL,
    is_revoked boolean DEFAULT false,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO "mini-server";

--
-- Name: sent_letters; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.sent_letters (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    building_id uuid NOT NULL,
    template_id uuid,
    member_id uuid,
    recipient_name character varying(255) NOT NULL,
    recipient_email character varying(255),
    subject character varying(255) NOT NULL,
    content text NOT NULL,
    send_method character varying(50) NOT NULL,
    sent_date timestamp without time zone,
    delivery_confirmation boolean DEFAULT false,
    tracking_number character varying(100),
    legal_validity boolean,
    created_by_user_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sent_letters OWNER TO "mini-server";

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    building_id uuid NOT NULL,
    minute_id uuid,
    title character varying(255) NOT NULL,
    description text,
    assignee_id uuid,
    assignee_name character varying(255),
    due_date date,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    priority character varying(20) DEFAULT 'medium'::character varying NOT NULL,
    category character varying(100),
    created_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp with time zone,
    completed_by uuid,
    notes text,
    CONSTRAINT tasks_priority_check CHECK (((priority)::text = ANY (ARRAY[('high'::character varying)::text, ('medium'::character varying)::text, ('low'::character varying)::text]))),
    CONSTRAINT tasks_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('in_progress'::character varying)::text, ('completed'::character varying)::text, ('cancelled'::character varying)::text])))
);


ALTER TABLE public.tasks OWNER TO "mini-server";

--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: mini-server
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tasks_id_seq OWNER TO "mini-server";

--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: mini-server
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: transaction_categories; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.transaction_categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    building_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    type character varying(20) NOT NULL,
    transaction_type character varying(20),
    is_active boolean DEFAULT true,
    color character varying(7),
    budget_amount numeric(12,2),
    parent_category_id uuid,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT transaction_categories_type_check CHECK (((type)::text = ANY (ARRAY[('income'::character varying)::text, ('expense'::character varying)::text])))
);


ALTER TABLE public.transaction_categories OWNER TO "mini-server";

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    building_id uuid NOT NULL,
    financial_period_id uuid,
    period_id uuid,
    category_id uuid,
    transaction_date date NOT NULL,
    date date,
    transaction_type character varying(20) NOT NULL,
    type character varying(20),
    description text NOT NULL,
    amount numeric(12,2) NOT NULL,
    fraction_id uuid,
    member_id uuid,
    payment_method character varying(50),
    reference_number character varying(100),
    notes text,
    admin_notes text,
    receipt_url text,
    is_recurring boolean DEFAULT false,
    recurring_frequency character varying(50),
    recurring_months integer[],
    year integer NOT NULL,
    is_fee_payment boolean DEFAULT false,
    is_confirmed boolean DEFAULT true,
    last_modified_by character varying(255),
    tags text[],
    created_by_user_id uuid,
    approved_by_user_id uuid,
    approved_at timestamp without time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT transactions_transaction_type_check CHECK (((transaction_type)::text = ANY (ARRAY[('income'::character varying)::text, ('expense'::character varying)::text])))
);


ALTER TABLE public.transactions OWNER TO "mini-server";

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.user_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    session_token character varying(500) NOT NULL,
    activity_log jsonb DEFAULT '[]'::jsonb,
    last_activity_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    ip_address character varying(45),
    user_agent text,
    device_type character varying(50),
    browser character varying(50),
    os character varying(50),
    country character varying(2),
    city character varying(100),
    is_active boolean DEFAULT true,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_sessions OWNER TO "mini-server";

--
-- Name: users; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    phone character varying(50),
    role text DEFAULT 'member'::text,
    permissions jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    email_verified boolean DEFAULT false,
    email_verified_at timestamp with time zone,
    reset_password_token character varying(255),
    reset_password_expires timestamp with time zone,
    failed_login_attempts integer DEFAULT 0,
    locked_until timestamp with time zone,
    building_id uuid,
    member_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_login_at timestamp with time zone,
    deleted_at timestamp with time zone,
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'manager'::text, 'member'::text])))
);


ALTER TABLE public.users OWNER TO "mini-server";

--
-- Name: voting_results; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.voting_results (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    minute_agenda_item_id uuid NOT NULL,
    total_votes integer NOT NULL,
    votes_in_favor integer NOT NULL,
    votes_against integer NOT NULL,
    abstentions integer NOT NULL,
    quorum_percentage numeric(5,2) NOT NULL,
    is_approved boolean NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.voting_results OWNER TO "mini-server";

--
-- Name: document_categories id; Type: DEFAULT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.document_categories ALTER COLUMN id SET DEFAULT nextval('public.document_categories_id_seq'::regclass);


--
-- Name: document_shares id; Type: DEFAULT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.document_shares ALTER COLUMN id SET DEFAULT nextval('public.document_shares_id_seq'::regclass);


--
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- Name: knex_migrations id; Type: DEFAULT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.knex_migrations ALTER COLUMN id SET DEFAULT nextval('public.knex_migrations_id_seq'::regclass);


--
-- Name: knex_migrations_lock index; Type: DEFAULT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.knex_migrations_lock ALTER COLUMN index SET DEFAULT nextval('public.knex_migrations_lock_index_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Data for Name: arrears; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.arrears (id, member_id, building_id, amount, original_amount, due_date, description, status, last_reminder_sent, reminder_count, settled_date, settlement_transaction_id, created_at, updated_at) FROM stdin;
ee60b8b1-eef6-4bac-aed0-e8827391b17f	1dfa75cd-fafd-43cd-a0f7-038c2ad76812	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	150.00	150.00	2025-01-31	Cuota enero 2025	pending	\N	0	\N	\N	2025-07-21 22:43:21.735595+00	2025-07-21 22:43:21.735595+00
3be52b03-5c1b-4fb7-8084-b0171850343b	6a62625e-1264-4588-b6bf-a7a8ca0771bd	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	300.00	300.00	2024-12-31	Cuotas nov-dic 2024	overdue	\N	0	\N	\N	2025-07-21 22:43:21.735595+00	2025-07-21 22:43:21.735595+00
6acf5715-9bf5-4ee2-9e54-77f3338b34c4	b6c37c55-303d-4e66-8f5d-bedff8f735ee	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	75.00	75.00	2025-02-28	Cuota febrero 2025	pending	\N	0	\N	\N	2025-07-21 22:43:21.735595+00	2025-07-21 22:43:21.735595+00
\.


--
-- Data for Name: attendance_sheets; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.attendance_sheets (id, building_id, convocatoria_id, minute_id, meeting_date, total_members, present_members, represented_members, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: attendees; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.attendees (id, attendance_sheet_id, member_id, member_name, attendance_type, representative_name, signature, arrival_time, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: buildings; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.buildings (id, name, address, postal_code, city, number_of_units, administrator, admin_contact, admin_email, iban, bank, account_number, swift, phone, email, president_name, president_email, secretary_name, secretary_email, administrator_name, administrator_email, notes, registration_number, construction_year, total_units, legal_framework, statutes, internal_rules, created_at, updated_at) FROM stdin;
fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Condomino Buraca 1	Estrada da Circunvalação, nº 1	2610-000	Amadora	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-02 00:49:09.914393+00	2025-07-02 00:49:09.914393+00
\.


--
-- Data for Name: communication_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.communication_logs (id, member_id, building_id, communication_type, communication_subtype, channel, status, subject, body_preview, full_content, pdf_url, pdf_filename, related_convocatoria_id, related_minute_id, related_transaction_id, draft_created_at, sent_at, opened_at, confirmed_at, failed_at, error_message, retry_count, metadata, created_at, updated_at) FROM stdin;
f7e173ce-e103-4d0d-9fb7-09dbabffd290	3aeab2cd-65ad-4f4f-8c15-725f6fa4e745	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	convocatoria	\N	email	sent	Test Communication System	Testing the communication logging system	\N	\N	\N	\N	\N	\N	2025-10-19 12:16:22.495689+00	\N	\N	\N	\N	\N	0	{}	2025-10-19 12:16:22.495689+00	2025-10-19 12:16:22.495689+00
63afbf65-5846-454d-8be1-1059cd80523d	d3ad84ae-c456-4ba7-9300-a78884804e9d	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	convocatoria	\N	whatsapp	draft_created	WhatsApp - convocatoria	*Condomino Buraca 1*\n📢 Convocatória - Assembleia Extraordinária\n\nExmo(a). Sr(a). *Vítor Manuel Sebastian Rodrigues* (Fração RC/DTO)\n\nFica convocado(a) para a Assembleia Extraordinária de Condóminos:\n	*Condomino Buraca 1*\n📢 Convocatória - Assembleia Extraordinária\n\nExmo(a). Sr(a). *Vítor Manuel Sebastian Rodrigues* (Fração RC/DTO)\n\nFica convocado(a) para a Assembleia Extraordinária de Condóminos:\n\n📅 *Data:* 15 de novembro de 2025\n🕐 *1ª Convocatória:* \n🕐 *2ª Convocatória:* meia hora depois\n📍 *Local:* Salão de reuniões do prédio, Rés-do-chão\n\nℹ️ A convocatória oficial completa com a ordem do dia foi enviada por email.\n\n⚠️ Caso não possa comparecer, pode fazer-se representar mediante procuração.\n\nPor favor, confirme a sua presença ou representação.\n\nA Administração	\N	\N	e5eeefdf-35ab-4db4-ba1f-55a7c103123d	\N	\N	2025-10-19 12:28:29.226928+00	\N	\N	\N	\N	\N	0	{}	2025-10-19 12:28:29.226928+00	2025-10-19 12:28:29.226928+00
f374ab7e-2fbd-4ee9-8c1d-236904a6e619	d3ad84ae-c456-4ba7-9300-a78884804e9d	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	convocatoria	\N	whatsapp	draft_created	WhatsApp - convocatoria	*Condomino Buraca 1*\n📢 Convocatória - Assembleia Extraordinária\n\nExmo(a). Sr(a). *Vítor Manuel Sebastian Rodrigues* (Fração RC/DTO)\n\nFica convocado(a) para a Assembleia Extraordinária de Condóminos:\n	*Condomino Buraca 1*\n📢 Convocatória - Assembleia Extraordinária\n\nExmo(a). Sr(a). *Vítor Manuel Sebastian Rodrigues* (Fração RC/DTO)\n\nFica convocado(a) para a Assembleia Extraordinária de Condóminos:\n\n📅 *Data:* 15 de novembro de 2025\n🕐 *1ª Convocatória:* \n🕐 *2ª Convocatória:* meia hora depois\n📍 *Local:* Salão de reuniões do prédio, Rés-do-chão\n\nℹ️ A convocatória oficial completa com a ordem do dia foi enviada por email.\n\n⚠️ Caso não possa comparecer, pode fazer-se representar mediante procuração.\n\nPor favor, confirme a sua presença ou representação.\n\nA Administração	\N	\N	e5eeefdf-35ab-4db4-ba1f-55a7c103123d	\N	\N	2025-10-19 12:29:42.510406+00	\N	\N	\N	\N	\N	0	{}	2025-10-19 12:29:42.510406+00	2025-10-19 12:29:42.510406+00
c1b250d9-e32b-4f0d-9451-ab3b9a17213b	d3ad84ae-c456-4ba7-9300-a78884804e9d	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	convocatoria	\N	whatsapp	draft_created	WhatsApp - convocatoria	*Condomino Buraca 1*\n📢 Convocatória - Assembleia Extraordinária\n\nExmo(a). Sr(a). *Vítor Manuel Sebastian Rodrigues* (Fração RC/DTO)\n\nFica convocado(a) para a Assembleia Extraordinária de Condóminos:\n	*Condomino Buraca 1*\n📢 Convocatória - Assembleia Extraordinária\n\nExmo(a). Sr(a). *Vítor Manuel Sebastian Rodrigues* (Fração RC/DTO)\n\nFica convocado(a) para a Assembleia Extraordinária de Condóminos:\n\n📅 *Data:* 15 de novembro de 2025\n🕐 *1ª Convocatória:* \n🕐 *2ª Convocatória:* meia hora depois\n📍 *Local:* Salão de reuniões do prédio, Rés-do-chão\n\nℹ️ A convocatória oficial completa com a ordem do dia foi enviada por email.\n\n⚠️ Caso não possa comparecer, pode fazer-se representar mediante procuração.\n\nPor favor, confirme a sua presença ou representação.\n\nA Administração	\N	\N	e5eeefdf-35ab-4db4-ba1f-55a7c103123d	\N	\N	2025-10-19 12:30:55.496987+00	\N	\N	\N	\N	\N	0	{}	2025-10-19 12:30:55.496987+00	2025-10-19 12:30:55.496987+00
9727f850-d71a-4f9d-b8a2-0909f413bf09	d3ad84ae-c456-4ba7-9300-a78884804e9d	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	convocatoria	\N	whatsapp	draft_created	WhatsApp - convocatoria	*Condomino Buraca 1*\n📢 Convocatória - Assembleia Extraordinária\n\nExmo(a). Sr(a). *Vítor Manuel Sebastian Rodrigues* (Fração RC/DTO)\n\nFica convocado(a) para a Assembleia Extraordinária de Condóminos:\n	*Condomino Buraca 1*\n📢 Convocatória - Assembleia Extraordinária\n\nExmo(a). Sr(a). *Vítor Manuel Sebastian Rodrigues* (Fração RC/DTO)\n\nFica convocado(a) para a Assembleia Extraordinária de Condóminos:\n\n📅 *Data:* 15 de novembro de 2025\n🕐 *1ª Convocatória:* \n🕐 *2ª Convocatória:* meia hora depois\n📍 *Local:* Salão de reuniões do prédio, Rés-do-chão\n\nℹ️ A convocatória oficial completa com a ordem do dia foi enviada por email.\n\n⚠️ Caso não possa comparecer, pode fazer-se representar mediante procuração.\n\nPor favor, confirme a sua presença ou representação.\n\nA Administração	\N	\N	e5eeefdf-35ab-4db4-ba1f-55a7c103123d	\N	\N	2025-10-19 12:31:35.112908+00	\N	\N	\N	\N	\N	0	{}	2025-10-19 12:31:35.112908+00	2025-10-19 12:31:35.112908+00
42a4d1a5-19ea-454e-a5fb-aacfa4907b64	d3ad84ae-c456-4ba7-9300-a78884804e9d	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	convocatoria	\N	email	draft_created	Convocatória - Assembleia Extraordinária de Condóminos - Condomino Buraca 1	Exmo(a). Sr(a). Vítor Manuel Sebastian Rodrigues, Fração RC/DTO\n\nNos termos e para os efeitos do disposto nos artigos 1432.º e seguintes do Código Civil, convoco V. Exa. para a Assembleia Extraordinár	Exmo(a). Sr(a). Vítor Manuel Sebastian Rodrigues, Fração RC/DTO\n\nNos termos e para os efeitos do disposto nos artigos 1432.º e seguintes do Código Civil, convoco V. Exa. para a Assembleia Extraordinária de Condóminos do edifício "Condomino Buraca 1", sito em Estrada da Circunvalação, nº 1, que terá lugar no dia 15 de novembro de 2025, com a seguinte ordem de trabalhos:\n\n─────────────────────────────────────────────────────────────\n\nORDEM DO DIA\n\n(Consultar documento anexo em PDF)\n\n─────────────────────────────────────────────────────────────\n\nLOCAL E HORÁRIO\n\n📍 Local: Salão de reuniões do prédio, Rés-do-chão\n\n🕐 Primeira convocatória: \n   (É necessário quórum de mais de 50% dos coeficientes)\n\n🕐 Segunda convocatória: meia hora depois\n   (É necessário quórum de mais de 25% dos coeficientes)\n\n─────────────────────────────────────────────────────────────\n\nINFORMAÇÕES IMPORTANTES\n\n• Caso não possa comparecer, poderá fazer-se representar por qualquer pessoa, mediante procuração escrita (Art. 1433.º do Código Civil).\n\n• A procuração deve ser apresentada no início da assembleia.\n\n• Para mais detalhes, consulte o documento anexo em PDF.\n\n• A sua presença ou representação é muito importante para a boa gestão do condomínio.\n\n─────────────────────────────────────────────────────────────\n\nCom os melhores cumprimentos,\n\nA Administração\nAdministrador do Condomínio\n\n\n\n\n─────────────────────────────────────────────────────────────\n\nEste email constitui convocatória oficial nos termos da Lei n.º 8/2022.\nPor favor, confirme a receção e a sua presença/representação respondendo a este email.	\N	\N	e5eeefdf-35ab-4db4-ba1f-55a7c103123d	\N	\N	2025-10-19 12:31:55.942025+00	\N	\N	\N	\N	\N	0	{}	2025-10-19 12:31:55.942025+00	2025-10-19 12:31:55.942025+00
4ccfcee1-1d93-4377-b012-f50bf5e8e54e	d3ad84ae-c456-4ba7-9300-a78884804e9d	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	convocatoria	\N	email	draft_created	Convocatória - Assembleia Extraordinária de Condóminos - Condomino Buraca 1	Exmo(a). Sr(a). Vítor Manuel Sebastian Rodrigues, Fração RC/DTO\n\nNos termos e para os efeitos do disposto nos artigos 1432.º e seguintes do Código Civil, convoco V. Exa. para a Assembleia Extraordinár	Exmo(a). Sr(a). Vítor Manuel Sebastian Rodrigues, Fração RC/DTO\n\nNos termos e para os efeitos do disposto nos artigos 1432.º e seguintes do Código Civil, convoco V. Exa. para a Assembleia Extraordinária de Condóminos do edifício "Condomino Buraca 1", sito em Estrada da Circunvalação, nº 1, que terá lugar no dia 15 de novembro de 2025, com a seguinte ordem de trabalhos:\n\n─────────────────────────────────────────────────────────────\n\nORDEM DO DIA\n\n(Consultar documento anexo em PDF)\n\n─────────────────────────────────────────────────────────────\n\nLOCAL E HORÁRIO\n\n📍 Local: Salão de reuniões do prédio, Rés-do-chão\n\n🕐 Primeira convocatória: 19:00\n   (É necessário quórum de mais de 50% dos coeficientes)\n\n🕐 Segunda convocatória: meia hora depois\n   (É necessário quórum de mais de 25% dos coeficientes)\n\n─────────────────────────────────────────────────────────────\n\nINFORMAÇÕES IMPORTANTES\n\n• Caso não possa comparecer, poderá fazer-se representar por qualquer pessoa, mediante procuração escrita (Art. 1433.º do Código Civil).\n\n• A procuração deve ser apresentada no início da assembleia.\n\n• Para mais detalhes, consulte o documento anexo em PDF.\n\n• A sua presença ou representação é muito importante para a boa gestão do condomínio.\n\n─────────────────────────────────────────────────────────────\n\nCom os melhores cumprimentos,\n\nA Administração\nAdministrador do Condomínio\n\n\n\n\n─────────────────────────────────────────────────────────────\n\nEste email constitui convocatória oficial nos termos da Lei n.º 8/2022.\nPor favor, confirme a receção e a sua presença/representação respondendo a este email.	\N	\N	e5eeefdf-35ab-4db4-ba1f-55a7c103123d	\N	\N	2025-10-19 17:37:00.812396+00	\N	\N	\N	\N	\N	0	{}	2025-10-19 17:37:00.812396+00	2025-10-19 17:37:00.812396+00
dea335ab-0840-477a-a882-034fc369543b	d3ad84ae-c456-4ba7-9300-a78884804e9d	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	convocatoria	\N	whatsapp	draft_created	WhatsApp - convocatoria	*Condomino Buraca 1*\n📢 Convocatória - Assembleia Extraordinária\n\nExmo(a). Sr(a). *Vítor Manuel Sebastian Rodrigues* (Fração RC/DTO)\n\nFica convocado(a) para a Assembleia Extraordinária de Condóminos:\n	*Condomino Buraca 1*\n📢 Convocatória - Assembleia Extraordinária\n\nExmo(a). Sr(a). *Vítor Manuel Sebastian Rodrigues* (Fração RC/DTO)\n\nFica convocado(a) para a Assembleia Extraordinária de Condóminos:\n\n📅 *Data:* 15 de novembro de 2025\n🕐 *1ª Convocatória:* 19:00\n🕐 *2ª Convocatória:* meia hora depois\n📍 *Local:* Salão de reuniões do prédio, Rés-do-chão\n\nℹ️ A convocatória oficial completa com a ordem do dia foi enviada por email.\n\n⚠️ Caso não possa comparecer, pode fazer-se representar mediante procuração.\n\nPor favor, confirme a sua presença ou representação.\n\nA Administração	\N	\N	e5eeefdf-35ab-4db4-ba1f-55a7c103123d	\N	\N	2025-10-19 17:38:30.978562+00	\N	\N	\N	\N	\N	0	{}	2025-10-19 17:38:30.978562+00	2025-10-19 17:38:30.978562+00
d654d1c3-d93b-4806-8a05-f17ac4520be1	d3ad84ae-c456-4ba7-9300-a78884804e9d	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	convocatoria	\N	whatsapp	draft_created	WhatsApp - convocatoria	*Condomino Buraca 1*\n📢 Convocatória - Assembleia Extraordinária\n\nExmo(a). Sr(a). *Vítor Manuel Sebastian Rodrigues* (Fração RC/DTO)\n\nFica convocado(a) para a Assembleia Extraordinária de Condóminos:\n	*Condomino Buraca 1*\n📢 Convocatória - Assembleia Extraordinária\n\nExmo(a). Sr(a). *Vítor Manuel Sebastian Rodrigues* (Fração RC/DTO)\n\nFica convocado(a) para a Assembleia Extraordinária de Condóminos:\n\n📅 *Data:* 15 de novembro de 2025\n🕐 *1ª Convocatória:* 19:00\n🕐 *2ª Convocatória:* meia hora depois\n📍 *Local:* Salão de reuniões do prédio, Rés-do-chão\n\nℹ️ A convocatória oficial completa com a ordem do dia foi enviada por email.\n\n⚠️ Caso não possa comparecer, pode fazer-se representar mediante procuração.\n\nPor favor, confirme a sua presença ou representação.\n\nA Administração	\N	\N	e5eeefdf-35ab-4db4-ba1f-55a7c103123d	\N	\N	2025-10-19 17:45:15.000443+00	\N	\N	\N	\N	\N	0	{}	2025-10-19 17:45:15.000443+00	2025-10-19 17:45:15.000443+00
cb5c4894-72dd-4d94-a212-356bfa9d442b	d3ad84ae-c456-4ba7-9300-a78884804e9d	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	convocatoria	\N	email	draft_created	Convocatória - Assembleia Extraordinária de Condóminos - Condomino Buraca 1	Exmo(a). Sr(a). Vítor Manuel Sebastian Rodrigues, Fração RC/DTO\n\nNos termos e para os efeitos do disposto nos artigos 1432.º e seguintes do Código Civil, convoco V. Exa. para a Assembleia Extraordinár	Exmo(a). Sr(a). Vítor Manuel Sebastian Rodrigues, Fração RC/DTO\n\nNos termos e para os efeitos do disposto nos artigos 1432.º e seguintes do Código Civil, convoco V. Exa. para a Assembleia Extraordinária de Condóminos do edifício "Condomino Buraca 1", sito em Estrada da Circunvalação, nº 1, que terá lugar no dia 15 de novembro de 2025, com a seguinte ordem de trabalhos:\n\n─────────────────────────────────────────────────────────────\n\nORDEM DO DIA\n\n(Consultar documento anexo em PDF)\n\n─────────────────────────────────────────────────────────────\n\nLOCAL E HORÁRIO\n\n📍 Local: Salão de reuniões do prédio, Rés-do-chão\n\n🕐 Primeira convocatória: 19:00\n   (É necessário quórum de mais de 50% dos coeficientes)\n\n🕐 Segunda convocatória: meia hora depois\n   (É necessário quórum de mais de 25% dos coeficientes)\n\n─────────────────────────────────────────────────────────────\n\nINFORMAÇÕES IMPORTANTES\n\n• Caso não possa comparecer, poderá fazer-se representar por qualquer pessoa, mediante procuração escrita (Art. 1433.º do Código Civil).\n\n• A procuração deve ser apresentada no início da assembleia.\n\n• Para mais detalhes, consulte o documento anexo em PDF.\n\n• A sua presença ou representação é muito importante para a boa gestão do condomínio.\n\n─────────────────────────────────────────────────────────────\n\nCom os melhores cumprimentos,\n\nA Administração\nAdministrador do Condomínio\n\n\n\n\n─────────────────────────────────────────────────────────────\n\nEste email constitui convocatória oficial nos termos da Lei n.º 8/2022.\nPor favor, confirme a receção e a sua presença/representação respondendo a este email.	\N	\N	e5eeefdf-35ab-4db4-ba1f-55a7c103123d	\N	\N	2025-10-19 17:46:13.936289+00	\N	\N	\N	\N	\N	0	{}	2025-10-19 17:46:13.936289+00	2025-10-19 17:46:13.936289+00
aa687d47-4bbe-4a1d-84cf-b149db5cc844	d3ad84ae-c456-4ba7-9300-a78884804e9d	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	convocatoria	\N	email	draft_created	Convocatória - Assembleia Extraordinária de Condóminos - Condomino Buraca 1	Exmo(a). Sr(a). Vítor Manuel Sebastian Rodrigues, Fração RC/DTO\n\nNos termos e para os efeitos do disposto nos artigos 1432.º e seguintes do Código Civil, convoco V. Exa. para a Assembleia Extraordinár	Exmo(a). Sr(a). Vítor Manuel Sebastian Rodrigues, Fração RC/DTO\n\nNos termos e para os efeitos do disposto nos artigos 1432.º e seguintes do Código Civil, convoco V. Exa. para a Assembleia Extraordinária de Condóminos do edifício "Condomino Buraca 1", sito em Estrada da Circunvalação, nº 1, que terá lugar no dia 29 de maio de 2025, com a seguinte ordem de trabalhos:\n\n─────────────────────────────────────────────────────────────\n\nORDEM DO DIA\n\n(Consultar documento anexo em PDF)\n\n─────────────────────────────────────────────────────────────\n\nLOCAL E HORÁRIO\n\n📍 Local: Hall do Prédio\n\n🕐 Primeira convocatória: 18:30\n   (É necessário quórum de mais de 50% dos coeficientes)\n\n🕐 Segunda convocatória: meia hora depois\n   (É necessário quórum de mais de 25% dos coeficientes)\n\n─────────────────────────────────────────────────────────────\n\nINFORMAÇÕES IMPORTANTES\n\n• Caso não possa comparecer, poderá fazer-se representar por qualquer pessoa, mediante procuração escrita (Art. 1433.º do Código Civil).\n\n• A procuração deve ser apresentada no início da assembleia.\n\n• Para mais detalhes, consulte o documento anexo em PDF.\n\n• A sua presença ou representação é muito importante para a boa gestão do condomínio.\n\n─────────────────────────────────────────────────────────────\n\nCom os melhores cumprimentos,\n\nA Administração\nAdministrador do Condomínio\n\n\n\n\n─────────────────────────────────────────────────────────────\n\nEste email constitui convocatória oficial nos termos da Lei n.º 8/2022.\nPor favor, confirme a receção e a sua presença/representação respondendo a este email.	\N	\N	38290ab1-3b3a-4020-9280-0c9003deeac6	\N	\N	2025-10-19 17:53:10.697426+00	\N	\N	\N	\N	\N	0	{}	2025-10-19 17:53:10.697426+00	2025-10-19 17:53:10.697426+00
18b94f97-3c17-4bba-9e55-f1aa7b55e94b	d3ad84ae-c456-4ba7-9300-a78884804e9d	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	convocatoria	\N	email	draft_created	Convocatória - Assembleia Extraordinária de Condóminos - Condomino Buraca 1	Exmo(a). Sr(a). Vítor Manuel Sebastian Rodrigues, Fração RC/DTO\n\nNos termos e para os efeitos do disposto nos artigos 1432.º e seguintes do Código Civil, convoco V. Exa. para a Assembleia Extraordinár	Exmo(a). Sr(a). Vítor Manuel Sebastian Rodrigues, Fração RC/DTO\n\nNos termos e para os efeitos do disposto nos artigos 1432.º e seguintes do Código Civil, convoco V. Exa. para a Assembleia Extraordinária de Condóminos do edifício "Condomino Buraca 1", sito em Estrada da Circunvalação, nº 1, que terá lugar no dia 15 de novembro de 2025, com a seguinte ordem de trabalhos:\n\n─────────────────────────────────────────────────────────────\n\nORDEM DO DIA\n\n1. Aprovação de obras na fachada\n   Deliberação sobre a reparação urgente de infiltrações na fachada oeste do edifício\n\n2. Instalação de sistema de videovigilância\n   Votação para aprovação da instalação de câmaras de segurança nas áreas comuns\n\n3. Assuntos gerais\n   Ponto aberto para questões diversas dos condóminos\n\n─────────────────────────────────────────────────────────────\n\nLOCAL E HORÁRIO\n\n📍 Local: Salão de reuniões do prédio, Rés-do-chão\n\n🕐 Primeira convocatória: 19:00\n   (É necessário quórum de mais de 50% dos coeficientes)\n\n🕐 Segunda convocatória: meia hora depois\n   (É necessário quórum de mais de 25% dos coeficientes)\n\n─────────────────────────────────────────────────────────────\n\nINFORMAÇÕES IMPORTANTES\n\n• Caso não possa comparecer, poderá fazer-se representar por qualquer pessoa, mediante procuração escrita (Art. 1433.º do Código Civil).\n\n• A procuração deve ser apresentada no início da assembleia.\n\n• Para mais detalhes, consulte o documento anexo em PDF.\n\n• A sua presença ou representação é muito importante para a boa gestão do condomínio.\n\n─────────────────────────────────────────────────────────────\n\nCom os melhores cumprimentos,\n\nA Administração\nAdministrador do Condomínio\n\n\n\n\n─────────────────────────────────────────────────────────────\n\nEste email constitui convocatória oficial nos termos da Lei n.º 8/2022.\nPor favor, confirme a receção e a sua presença/representação respondendo a este email.	\N	\N	e5eeefdf-35ab-4db4-ba1f-55a7c103123d	\N	\N	2025-10-19 18:09:02.361108+00	\N	\N	\N	\N	\N	0	{}	2025-10-19 18:09:02.361108+00	2025-10-19 18:09:02.361108+00
2939ab95-10a9-47a6-a51a-8bbfc6b0b363	d3ad84ae-c456-4ba7-9300-a78884804e9d	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	convocatoria	\N	email	draft_created	Convocatória - Assembleia Extraordinária de Condóminos - Condomino Buraca 1	Exmo(a). Sr(a). Vítor Manuel Sebastian Rodrigues - Fração RC/DTO\n\nNos termos do disposto nos artigos 1432.º e seguintes do Código Civil, convoco V. Exa. para a Assembleia Extraordinária de Condóminos 	Exmo(a). Sr(a). Vítor Manuel Sebastian Rodrigues - Fração RC/DTO\n\nNos termos do disposto nos artigos 1432.º e seguintes do Código Civil, convoco V. Exa. para a Assembleia Extraordinária de Condóminos do edifício "Condomino Buraca 1", sito em Estrada da Circunvalação, nº 1, que terá lugar no dia 15 de novembro de 2025.\n\n\n════════════════════════════════════════════════════════════\n\nORDEM DO DIA\n\n   1. Aprovação de obras na fachada\n      Deliberação sobre a reparação urgente de infiltrações na fachada oeste do edifício\n      [Votação - Maioria Simples]\n\n   2. Instalação de sistema de videovigilância\n      Votação para aprovação da instalação de câmaras de segurança nas áreas comuns\n      [Votação - Maioria Qualificada]\n\n   3. Assuntos gerais\n      Ponto aberto para questões diversas dos condóminos\n      [Ponto Informativo]\n\n════════════════════════════════════════════════════════════\n\nDATA E HORA\n\n📅 Data: 15 de novembro de 2025\n🕐 Primeira Convocatória: 19:00\n    (Quórum necessário: mais de 50% dos coeficientes)\n\n🕐 Segunda Convocatória: meia hora depois\n    (Quórum necessário: mais de 25% dos coeficientes)\n\n📍 Local: Salão de reuniões do prédio, Rés-do-chão\n\n════════════════════════════════════════════════════════════\n\nINFORMAÇÕES IMPORTANTES\n\n⚠️  Caso não possa comparecer, poderá fazer-se representar por qualquer\n    pessoa mediante procuração escrita (Art. 1433.º do Código Civil).\n\n⚠️  A procuração deve ser apresentada no início da assembleia.\n\n📎  Consulte o documento anexo em PDF para mais detalhes.\n\n✅  A sua presença ou representação é muito importante para a boa\n    gestão do condomínio.\n\n════════════════════════════════════════════════════════════\n\nCom os melhores cumprimentos,\n\nA Administração\nAdministrador do Condomínio\n\n\n\n════════════════════════════════════════════════════════════\n\nEste email constitui convocatória oficial nos termos da Lei n.º 8/2022.\nPor favor, confirme a receção e a sua presença/representação.	\N	\N	e5eeefdf-35ab-4db4-ba1f-55a7c103123d	\N	\N	2025-10-19 18:14:24.846136+00	\N	\N	\N	\N	\N	0	{}	2025-10-19 18:14:24.846136+00	2025-10-19 18:14:24.846136+00
83b8f8af-2f73-43b1-ba69-858c0d823d70	d3ad84ae-c456-4ba7-9300-a78884804e9d	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	convocatoria	\N	email	draft_created	Convocatória - Assembleia Extraordinária de Condóminos - Condomino Buraca 1	Exmo(a). Sr(a). Vítor Manuel Sebastian Rodrigues\nFração RC/DTO\nCondomino Buraca 1\nEstrada da Circunvalação, nº 1\n\n\nAssunto: Convocatória - Assembleia Extraordinária de Condóminos\n\n\nExmo(a). Senhor(a),	Exmo(a). Sr(a). Vítor Manuel Sebastian Rodrigues\nFração RC/DTO\nCondomino Buraca 1\nEstrada da Circunvalação, nº 1\n\n\nAssunto: Convocatória - Assembleia Extraordinária de Condóminos\n\n\nExmo(a). Senhor(a),\n\nNos termos do disposto nos artigos 1432.º e seguintes do Código Civil, tenho a honra de convocar V. Exa. para a Assembleia Extraordinária de Condóminos do edifício em referência, que terá lugar no dia 15 de novembro de 2025, com a seguinte ordem de trabalhos:\n\n\nORDEM DO DIA\n\n1. Aprovação de obras na fachada (Votação - Maioria Simples)\n   Deliberação sobre a reparação urgente de infiltrações na fachada oeste do edifício\n\n2. Instalação de sistema de videovigilância (Votação - Maioria Qualificada)\n   Votação para aprovação da instalação de câmaras de segurança nas áreas comuns\n\n3. Assuntos gerais\n   Ponto aberto para questões diversas dos condóminos\n\n\nDATA E HORÁRIO\n\nData: 15 de novembro de 2025\n\nPrimeira convocatória: 19:00\n(Quórum necessário: mais de 50% dos coeficientes de permilagem)\n\nSegunda convocatória: meia hora depois\n(Quórum necessário: mais de 25% dos coeficientes de permilagem)\n\nLocal: Salão de reuniões do prédio, Rés-do-chão\n\n\nREPRESENTAÇÃO\n\nNos termos do artigo 1433.º do Código Civil, caso não possa comparecer, poderá fazer-se representar por qualquer pessoa mediante procuração escrita, que deverá ser apresentada no início da assembleia.\n\nEstá disponível um modelo de procuração que pode descarregar e imprimir para este efeito.\n\n\nDOCUMENTAÇÃO\n\nA documentação relativa aos assuntos a tratar encontra-se disponível para consulta prévia, podendo ser solicitada à administração.\n\n\nAgradecemos confirmação da sua presença ou representação.\n\nCom os melhores cumprimentos,\n\nA Administração\nAdministrador do Condomínio\n\n\n\n\n---\nEste email constitui convocatória oficial nos termos da Lei n.º 8/2022.\nConvocatória n.º 31	\N	\N	e5eeefdf-35ab-4db4-ba1f-55a7c103123d	\N	\N	2025-10-19 18:24:17.545535+00	\N	\N	\N	\N	\N	0	{}	2025-10-19 18:24:17.545535+00	2025-10-19 18:24:17.545535+00
\.


--
-- Data for Name: convocatorias; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.convocatorias (id, building_id, building_name, building_address, postal_code, city, assembly_number, assembly_type, meeting_type, title, date, meeting_date, "time", location, meeting_location, second_call_enabled, second_call_time, second_call_date, administrator, secretary, legal_reference, minutes_created, agenda_items, convocation_date, legal_notice_period, delivery_method, attached_documents, legal_validation, quorum_requirements, status, meeting_subject, president_name, president_email, secretary_name, secretary_email, administrator_name, administrator_email, notification_sent_at, published_at, published_by_user_id, notes, created_at, updated_at) FROM stdin;
38290ab1-3b3a-4020-9280-0c9003deeac6	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Condomino Buraca 1	Estrada da Circunvalação, nº 1	2610-041	Amadora	30	extraordinary	\N	Assembleia Extraordinária Nº 30	2025-05-29	\N	18:30	Hall do Prédio	\N	t	\N	\N	Vitor Manuel Sebastian Rodrigues	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	sent	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-02 01:18:21.014189+00	2025-10-19 04:57:27.812856+00
bedf6d4d-40c9-430b-97af-c7f1af2b1aee	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Condomino Buraca 1	Estrada da Circunvalação, nº 1	2610-041	Amadora	28	ordinary	\N	Assembleia Ordinária Nº 28	2025-02-10	\N	17:30	Hall do Prédio	\N	t	\N	\N	João Manuel Fernandes Longo	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	sent	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-02 00:59:16.947675+00	2025-10-19 04:57:27.812856+00
651707f1-3658-49f4-b625-2c33f657a749	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Condomino Buraca 1	Estrada da Circunvalação, nº 1	2610-041	Amadora	29	extraordinary	\N	Assembleia Extraordinária Nº 29	2025-03-17	\N	18:00	Hall do Prédio	\N	t	\N	\N	Vítor Manuel Sebastian Rodrigues	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	sent	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-02 00:59:16.947675+00	2025-10-19 04:57:27.812856+00
e5eeefdf-35ab-4db4-ba1f-55a7c103123d	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Condomino Buraca 1	Estrada da Circunvalação, nº 1	\N	\N	31	extraordinary	\N	\N	2025-11-15	2025-11-15	19:00	Salão de reuniões do prédio, Rés-do-chão	\N	t	\N	\N	A Administração	\N	\N	f	[{"type": "votacion", "title": "Aprovação de obras na fachada", "description": "Deliberação sobre a reparação urgente de infiltrações na fachada oeste do edifício", "item_number": 1, "requiredMajority": "simple"}, {"type": "votacion", "title": "Instalação de sistema de videovigilância", "description": "Votação para aprovação da instalação de câmaras de segurança nas áreas comuns", "item_number": 2, "requiredMajority": "cualificada"}, {"type": "informativo", "title": "Assuntos gerais", "description": "Ponto aberto para questões diversas dos condóminos", "item_number": 3}]	\N	\N	\N	\N	\N	\N	draft	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-19 12:26:02.409741+00	2025-10-19 12:26:02.409741+00
\.


--
-- Data for Name: document_categories; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.document_categories (id, building_id, name, description, color, icon, parent_category_id, sort_order, created_at) FROM stdin;
1	\N	legal	Documentos legales y normativos	#2563eb	scale	\N	0	2025-07-21 20:34:07.63228
2	\N	meeting	Actas de reuniones y asambleas	#16a34a	users	\N	0	2025-07-21 20:34:07.63228
3	\N	financial	Documentos financieros y presupuestos	#eab308	calculator	\N	0	2025-07-21 20:34:07.63228
4	\N	contract	Contratos y acuerdos	#dc2626	file-text	\N	0	2025-07-21 20:34:07.63228
5	\N	technical	Documentación técnica	#8b5cf6	wrench	\N	0	2025-07-21 20:34:07.63228
6	\N	legal	Documentos legales y normativos	#2563eb	scale	\N	0	2025-07-21 20:38:15.927275
7	\N	meeting	Actas de reuniones y asambleas	#16a34a	users	\N	0	2025-07-21 20:38:15.927275
8	\N	financial	Documentos financieros y presupuestos	#eab308	calculator	\N	0	2025-07-21 20:38:15.927275
9	\N	contract	Contratos y acuerdos	#dc2626	file-text	\N	0	2025-07-21 20:38:15.927275
10	\N	technical	Documentación técnica	#8b5cf6	wrench	\N	0	2025-07-21 20:38:15.927275
11	\N	general	Documentos generales	#6b7280	file	\N	0	2025-07-21 20:38:15.927275
\.


--
-- Data for Name: document_shares; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.document_shares (id, document_id, member_id, permission, shared_by, shared_at, expires_at) FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.documents (id, building_id, member_id, name, original_name, file_path, file_size, mime_type, file_extension, category, subcategory, tags, description, version, parent_document_id, is_current_version, visibility, is_confidential, access_level, uploaded_by, uploaded_at, last_accessed_at, download_count, search_vector, created_at, updated_at) FROM stdin;
10	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	Apolize Seguro 2024	PDFApolice205375434.pdf	/uploads/file-1750041080619-643214668.pdf	222939	application/pdf	pdf	insurance	\N	{}	\N	1	\N	t	public	f	member	Utilizador Atual	2025-06-16 02:31:21.004147	\N	0	'2024':3A 'apoliz':1A 'segur':2A	2025-06-16 02:31:21.004147	2025-06-16 12:59:46.362788
11	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	d3ad84ae-c456-4ba7-9300-a78884804e9d	foto Pedio	IMG_1176.jpeg	/uploads/file-1750042788399-52016518_compressed.jpg	385900	image/jpeg	jpeg	general	\N	{}	\N	1	\N	t	public	f	member	Utilizador Atual	2025-06-16 02:59:51.833545	\N	0	'fot':1A 'pedi':2A	2025-06-16 02:59:51.833545	2025-06-16 11:14:01.200697
13	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	Apolize Seguro Predio	PDFApolice205375434.pdf	/uploads/doc-1750075771396-300889794.pdf	222939	application/pdf	.pdf	insurance	\N	\N	\N	1	\N	t	members_only	f	read	Utilizador Atual	2025-06-16 12:09:31.850367	\N	0	'apoliz':1A 'predi':3A 'segur':2A	2025-06-16 12:09:31.850367	2025-06-16 12:09:31.850367
\.


--
-- Data for Name: financial_periods; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.financial_periods (id, building_id, year, start_date, end_date, approved_budget, budget_approval_date, budget_approval_minute_id, reserve_fund_minimum, reserve_fund_actual, legal_compliance_check, is_closed, closed_at, total_income, total_expenses, balance, notes, closed_by_user_id, initial_balance, created_at, updated_at) FROM stdin;
d6654826-2b4b-44b9-ac85-32422e709a6d	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	2024	2024-01-01	2024-12-31	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-07-21 22:42:08.881845+00	2025-07-21 22:42:08.881845+00
3e37d275-1b3b-4988-9bf7-b2c20ba41aab	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	2025	2025-01-01	2025-12-31	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	2025-07-21 22:42:08.881845+00	2025-07-21 22:42:08.881845+00
\.


--
-- Data for Name: fractions; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.fractions (id, building_id, member_id, unit_number, ownership_percentage, surface_area, fraction_type, is_active, deed_reference, acquisition_date, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: knex_migrations; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.knex_migrations (id, name, batch, migration_time) FROM stdin;
1	20250626155116_create_users_table.cjs	1	2025-06-26 16:11:15.911+00
2	20250626155143_create_refresh_tokens_table.cjs	1	2025-06-26 16:11:15.926+00
3	20250626155204_create_user_sessions_table.cjs	1	2025-06-26 16:11:15.933+00
\.


--
-- Data for Name: knex_migrations_lock; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.knex_migrations_lock (index, is_locked) FROM stdin;
1	0
\.


--
-- Data for Name: letter_templates; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.letter_templates (id, building_id, name, type, subject, content, variables, is_active, legal_basis, required_fields, validation_rules, title, created_at, updated_at) FROM stdin;
405b999f-235f-4adf-8be5-c7a794a2c11f	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Convocatoria Estándar	convocatoria	Convocatoria Asamblea General	Estimado propietario...	\N	t	\N	\N	\N	\N	2025-07-21 22:43:21.735595+00	2025-07-21 22:43:21.735595+00
97617929-1338-4896-b32e-d80b227d6895	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Aviso de Pago	payment_notice	Aviso de Pago de Cuotas	Le informamos que...	\N	t	\N	\N	\N	\N	2025-07-21 22:43:21.735595+00	2025-07-21 22:43:21.735595+00
\.


--
-- Data for Name: meeting_members; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.meeting_members (id, building_id, minutes_id, member_id, member_name, apartment, votes, attendance_type, is_president, is_secretary, representative_name, signature, arrival_time, departure_time, voting_power, percentage_represented, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: member_annual_fees; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.member_annual_fees (id, member_id, building_id, financial_period_id, year, fee_amount, paid_amount, is_paid, due_date, paid_date, payment_method, transaction_id, notes, late_fee, installments, installment_amount, fraction_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: member_votes; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.member_votes (id, minute_agenda_item_id, member_id, building_id, member_name, apartment, vote, voting_power, representative_name, comments, vote_timestamp, is_proxy_vote, proxy_document_url, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: members; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.members (id, building_id, name, apartment, fraction, votes, email, phone, profile_image, notes, old_annual_fee, old_monthly_fee, new_annual_fee, new_monthly_fee, permilage, is_active, nif, nif_nie, address, ownership_percentage, deed_date, legal_representative_id, role, monthly_fee, annual_fee, avatar_url, secondary_address, secondary_postal_code, secondary_city, secondary_country, user_id, created_at, updated_at, email_consent, email_consent_date, whatsapp_number, whatsapp_consent, whatsapp_consent_date, preferred_communication) FROM stdin;
6a62625e-1264-4588-b6bf-a7a8ca0771bd	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	José Manuel Costa Ricardo	Fração B	B	1	\N	\N	\N	\N	0.00	0.00	0.00	0.00	166.7000	t	\N	\N	\N	16.67	\N	\N	owner	\N	\N	\N	\N	\N	\N	Portugal	\N	2025-07-02 00:59:16.947675+00	2025-10-19 12:27:02.564741+00	t	\N	\N	f	\N	email
b6c37c55-303d-4e66-8f5d-bedff8f735ee	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Maria Albina Correia Sequeira	Fração C	C	1	\N	\N	\N	\N	0.00	0.00	0.00	0.00	166.7000	t	\N	\N	\N	16.67	\N	\N	owner	\N	\N	\N	\N	\N	\N	Portugal	\N	2025-07-02 00:59:16.947675+00	2025-10-19 12:27:02.564741+00	t	\N	\N	f	\N	email
497dc00b-2cf8-4368-9353-bdc462acb156	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	António Manuel Caroça Beirão	Fração E	E	1	\N	\N	\N	\N	0.00	0.00	0.00	0.00	166.7000	t	\N	\N	\N	16.67	\N	\N	owner	\N	\N	\N	\N	\N	\N	Portugal	\N	2025-07-02 00:59:16.947675+00	2025-10-19 12:27:02.564741+00	t	\N	\N	f	\N	email
8b790d78-9d4b-4357-a0ba-9e09ee329415	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	João Manuel Fernandes Longo	Fração F	F	1	\N	\N	\N	\N	0.00	0.00	0.00	0.00	166.7000	t	\N	\N	\N	16.67	\N	\N	owner	\N	\N	\N	\N	\N	\N	Portugal	\N	2025-07-02 00:59:16.947675+00	2025-10-19 12:27:02.564741+00	t	\N	\N	f	\N	email
3aeab2cd-65ad-4f4f-8c15-725f6fa4e745	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Prueba Test	Fração G	G	1	test@example.com	123456789	\N	\N	0.00	0.00	600.00	50.00	166.7000	t	123456789	\N	\N	\N	\N	\N	owner	\N	\N	\N	\N	\N	\N	Portugal	\N	2025-10-19 06:23:51.093317+00	2025-10-19 12:27:02.564741+00	t	\N	\N	f	\N	email
1dfa75cd-fafd-43cd-a0f7-038c2ad76812	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Cristina Maria Bertolo Gouveia	1º ESQ	D	1	cristina@example.com		\N		0.00	0.00	0.00	0.00	150.0000	t	\N	\N	\N	16.67	\N	\N	owner	\N	\N	\N	\N	\N	\N	Portugal	\N	2025-07-02 00:59:16.947675+00	2025-10-19 12:27:02.564741+00	t	\N	\N	f	\N	email
d3ad84ae-c456-4ba7-9300-a78884804e9d	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Vítor Manuel Sebastian Rodrigues	RC/DTO	B	1	vmsebaspt@gmail.com	00351916849786	\N		0.00	0.00	0.00	0.00	150.0000	t	\N	\N	\N	16.67	\N	\N	owner	\N	\N	\N	\N	\N	\N	Portugal	\N	2025-07-02 00:59:16.947675+00	2025-10-19 12:30:41.829834+00	t	\N	+351912345678	t	\N	email
\.


--
-- Data for Name: minute_agenda_items; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.minute_agenda_items (id, minutes_id, building_id, item_number, title, description, discussion, decision, vote_type, votes_in_favor, votes_against, abstentions, is_approved, legal_requirement, created_at, updated_at, convocatoria_id) FROM stdin;
10f23e3d-8105-4b2b-b232-97164d009623	2e656e48-8b5b-457f-a83b-661b77d177cd	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	1	Aprovaçao de contas. 	O administrador cessante apresentou o relatório de contas referente aos exercícios de 2021 a 2024, detalhando as principais rubricas e esclarecendo dúvidas dos presentes.		APROVADO POR UNANIMIDADE	\N	0	0	0	f	\N	2025-06-13 12:31:36.007548+00	2025-06-13 12:31:36.007548+00	\N
96338b7c-599f-4bff-bf9d-2e1f34f26eb8	776956d1-d3de-49a7-8fcc-67c255e88e35	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	1	Leitura e análise dos orçamentos recebidos para as obras a realizar.           - Discussão sobre os valores apresentados. - Organização das fases dos trabalhos. - Escolha do prestador de serviços (se aplicável).	Después de leer los presupuestos entregados, se decidió lo siguiente crear un una previsión para los próximos tres años de gastos del condominio y gastos. En las obras las obras a realizar en primer lugar empezaríamos por la parte lateral izquierda, que es la parte que afecta a las humedades que tiene la fracción de joao el siguiente fase sería el agua y la luz solicitando lo antes posible la petición al ingeniero para que fuese preparando el proyecto y una tercera fase sería esto lo intentaríamos hacer este año y la tercera fase si es posible este año si no a principios del próximo, lo que es la intervención en las escaleras de arreglar y reparar y arreglar y pintar el interior de las escaleras también se decidió siempre hay que dejar como mínimo un 20 % en de reserva en el banco. A fecha de hoy hay 14.000 € faltando por pagar algunos de los condominios algunas cuotas de este año que serán comunicados lo que falta vía carta o e-mail		DISCUTIDO_SEM_VOTACAO	\N	0	0	0	f	\N	2025-06-13 12:56:51.196167+00	2025-06-13 12:56:51.196167+00	\N
bb225805-03c4-489d-8b7a-e4d526b8961d	9f20eca5-96de-4b52-9267-c94a93aed2bb	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	1	 Apresentação do caderno de encargos para a reabilitação do prédio	Após discussão entre os presentes, decidiu-se proceder à revisão do caderno de encargos inicialmente apresentado, com o objetivo de adequá-lo às necessidades identificadas durante a assembleia. O caderno de encargos atualizado será enviado por e-mail a todos os condóminos, permitindo-lhes, com base neste documento, solicitar orçamentos às empresas que entenderem adequadas		DISCUTIDO SEM VOTAÇÃO	\N	0	0	0	f	\N	2025-06-13 12:54:58.593192+00	2025-06-13 12:54:58.593192+00	\N
57c9cc52-f86d-4df0-b11d-b18aa3193069	2e656e48-8b5b-457f-a83b-661b77d177cd	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	2	Debate e apresentação de orçamentos para reabilitação do prédio “saída de emergência  pintura do prédio e coluna eletricidade “ 	Foi discutida a necessidade de reabilitação geral do edifício, incluindo a "saída de emergência", pintura do prédio e coluna de eletricidade. O condómino da fração "F", Sr. José Manuel Costa Ricardo, comprometeu-se a elaborar, para apresentação na próxima assembleia extraordinária, um caderno de encargos com memória descritiva e orçamento para as referidas obras.		APROVADO POR UNANIMIDADE	\N	0	0	0	f	\N	2025-06-13 12:31:36.007548+00	2025-06-13 12:31:36.007548+00	\N
ccc295d8-2a6b-44ca-9849-141a46eecc64	9f20eca5-96de-4b52-9267-c94a93aed2bb	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	2	Discussão e deliberação sobre outros assuntos de interesse geral referentes ao condomínio	Ficou decidido que os orçamentos, elaborados com base no caderno de encargos revisto, deverão ser entregues em envelope fechado até ao dia 29 de maio de 2025. Nesse mesmo dia, realizar-se-á uma nova assembleia destinada à abertura e análise das propostas recebidas, às 18h30 em primeira convocatória e às 19h00 em segunda convocatória. Convidam-se todos os condóminos a participar nesta reunião, assegurando assim um processo de seleção transparente e rigoroso.		DISCUTIDO SEM VOTAÇÃO	\N	0	0	0	f	\N	2025-06-13 12:54:58.593192+00	2025-06-13 12:54:58.593192+00	\N
a9cd93e3-56c1-4b2b-bdc8-0bd5095a241a	2e656e48-8b5b-457f-a83b-661b77d177cd	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	3	Eleição do nova administração do condomínio. 	Procedeu-se à eleição para a nova administração. Foi proposto e eleito o Sr. Vítor Manuel Sebastian Rodrigues (fração "A") como Administrador. Para apoiá-lo, foi nomeado o Sr. João Manuel Fernandes Longo (fração "E") como Secretário.		APROVADO POR UNANIMIDADE	\N	0	0	0	f	\N	2025-06-13 12:31:36.007548+00	2025-06-13 12:31:36.007548+00	\N
a54fa569-d5d6-49e7-8ecd-3fdfc90797f0	2e656e48-8b5b-457f-a83b-661b77d177cd	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	4	Apresentação e aprovação do orçamento em exercício para 2025. 	Apresentou-se um orçamento de 2.375 € para o exercício de 2025, acrescido de 10% (237,50 €) para reforço do fundo comum de reserva, totalizando 2.612,50 €.		APROVADO POR UNANIMIDADE	\N	0	0	0	f	\N	2025-06-13 12:31:36.007548+00	2025-06-13 12:31:36.007548+00	\N
5e05d4c7-0bf5-4275-86bf-49d0a754b727	2e656e48-8b5b-457f-a83b-661b77d177cd	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	5	Outros assuntos de interesse geral referente ao condomínio. 	Foi discutida a atualização do serviço de limpeza das escadas. Anteriormente, o serviço era prestado ao custo de 50 € mensais durante 13 meses. A proposta atual é ajustar para 65 € mensais durante 12 meses.		APROVADO POR UNANIMIDADE	\N	0	0	0	f	\N	2025-06-13 12:31:36.007548+00	2025-06-13 12:31:36.007548+00	\N
1dedb8ff-1188-46bc-ba07-237a70fbab37	2e656e48-8b5b-457f-a83b-661b77d177cd	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	6	Solução para as caixas de correio fixadas na porta. 	Foram analisadas possíveis soluções para a instalação de caixas de correio na porta de entrada. Decidiu-se solicitar orçamentos para avaliar a viabilidade da implementação futura desta melhoria.		ADIADO	\N	0	0	0	f	\N	2025-06-13 12:31:36.007548+00	2025-06-13 12:31:36.007548+00	\N
c10c7c62-6bd8-4300-9c57-9906b19e7ac0	2e656e48-8b5b-457f-a83b-661b77d177cd	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	7	Autorização conjunta para movimentações bancárias. 	Foi discutido e aprovado que todas as operações bancárias, incluindo levantamentos, transferências, pagamentos e a abertura de novas contas em nome do condomínio, deverão ser autorizadas conjuntamente pelo novo administrador, Sr. Vítor Manuel Sebastian Rodrigues (fração "A"), e pelo secretário, Sr. João Manuel Fernandes Longo (fração "E"). A abertura de novas contas exigirá a aprovação prévia da assembleia de condóminos, salvo em casos de urgência, que deverão ser ratificados na assembleia seguinte.		APROVADO POR UNANIMIDADE	\N	0	0	0	f	\N	2025-06-13 12:31:36.007548+00	2025-06-13 12:31:36.007548+00	\N
f0c0c9a2-fe59-429f-a570-7db419c3e238	\N	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	1	Leitura e análise dos orçamentos recebidos para as obras a realizar.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      +\n  - Discussão sobre os valores apresentados.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       +\n  - Organização das fases dos trabalhos.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           +\n  - Escolha do prestador de serviços (se aplicável).	\N	\N	\N	\N	0	0	0	f	\N	2025-05-19 13:37:41.83+00	2025-06-13 10:47:27.409661+00	38290ab1-3b3a-4020-9280-0c9003deeac6
016a0f5b-0ae4-4aa1-937f-ed436a3a053c	\N	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	1	Aprovaçao de contas. 	\N	\N	\N	\N	0	0	0	f	\N	2025-03-18 12:48:06.101+00	2025-06-13 10:47:27.409661+00	bedf6d4d-40c9-430b-97af-c7f1af2b1aee
ec061529-d13f-4dff-88ba-de68d2629b28	\N	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	1	 Apresentação do caderno de encargos para a reabilitação do prédio	\N	\N	\N	\N	0	0	0	f	\N	2025-03-17 08:36:27.393+00	2025-06-13 10:47:27.409661+00	651707f1-3658-49f4-b625-2c33f657a749
3ae3e6ad-d5a4-4e38-bd55-6f12e26dbea7	776956d1-d3de-49a7-8fcc-67c255e88e35	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	2	Outros assuntos de interesse geral.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               +\n  - Espaço para os condóminos apresentarem dúvidas, sugestões ou reclamações	Se volvió abrir el debate sobre las escaleras del tercero, ya que hay una Ata anterior, la cual dice que que ya se había aprobado en el acta número X con el siguiente texto, lo cual el condominio discutió este tema y decidió a follar con la escaleras al tejado con 1/3 del presupuesto como máximo 4100 € que en teoría es lo que cuesta las escaleras, ya que quien usó o quien tiene acceso a tener acceso y va la parte inferior del tejado que no sé cómo se llama en portugués, serán los que tienen que hacer el resto de las obras para por ese motivo también usas sufrían de algo que es de todos			\N	0	0	0	f	\N	2025-06-13 12:56:51.196167+00	2025-06-13 12:56:51.196167+00	\N
241e87a5-8624-44bd-8b04-0f255668dde9	\N	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	2	Discussão e deliberação sobre outros assuntos de interesse geral referentes ao condomínio	\N	\N	\N	\N	0	0	0	f	\N	2025-03-17 08:36:27.393+00	2025-06-13 10:47:27.409661+00	651707f1-3658-49f4-b625-2c33f657a749
ba9a2f74-33a9-4de3-8cbe-cf76e8c61a21	\N	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	2	Debate e apresentação de orçamentos para reabilitação do prédio “saída de emergência  pintura do prédio e coluna eletricidade “ 	\N	\N	\N	\N	0	0	0	f	\N	2025-03-18 12:48:06.101+00	2025-06-13 10:47:27.409661+00	bedf6d4d-40c9-430b-97af-c7f1af2b1aee
b9664f88-ee48-4fe7-b912-93890388716e	\N	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	2	Outros assuntos de interesse geral.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       +\n  - Espaço para os condóminos apresentarem dúvidas, sugestões ou reclamações	\N	\N	\N	\N	0	0	0	f	\N	2025-05-19 13:37:41.83+00	2025-06-13 10:47:27.409661+00	38290ab1-3b3a-4020-9280-0c9003deeac6
3b80fc62-c10b-4dc2-880e-f9eaa150775f	\N	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	3	Eleição do nova administração do condomínio. 	\N	\N	\N	\N	0	0	0	f	\N	2025-03-18 12:48:06.101+00	2025-06-13 10:47:27.409661+00	bedf6d4d-40c9-430b-97af-c7f1af2b1aee
a755bf8a-f3e3-4b0e-83fa-62dd696907d5	\N	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	4	Apresentação e aprovação do orçamento em exercício para 2025. 	\N	\N	\N	\N	0	0	0	f	\N	2025-03-18 12:48:06.101+00	2025-06-13 10:47:27.409661+00	bedf6d4d-40c9-430b-97af-c7f1af2b1aee
6b83cbe7-068a-4203-81a9-7a44d29c42e4	\N	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	5	Outros assuntos de interesse geral referente ao condomínio. 	\N	\N	\N	\N	0	0	0	f	\N	2025-03-18 12:48:06.101+00	2025-06-13 10:47:27.409661+00	bedf6d4d-40c9-430b-97af-c7f1af2b1aee
04287284-a620-4372-9532-d75f9c3a9298	\N	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	6	Solução para as caixas de correio fixadas na porta. 	\N	\N	\N	\N	0	0	0	f	\N	2025-03-18 12:48:06.101+00	2025-06-13 10:47:27.409661+00	bedf6d4d-40c9-430b-97af-c7f1af2b1aee
d394aeaf-9ae5-4549-ba75-097fc37dfed0	\N	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	7	Autorização para a gestão de contas bancárias. 	\N	\N	\N	\N	0	0	0	f	\N	2025-03-18 12:48:06.101+00	2025-06-13 10:47:27.409661+00	bedf6d4d-40c9-430b-97af-c7f1af2b1aee
\.


--
-- Data for Name: minutes; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.minutes (id, building_id, convocatoria_id, minute_number, meeting_date, meeting_time, end_time, start_time, location, meeting_location, assembly_type, building_address, building_name, postal_code, president_name, administrator_custom, secretary_name, secretary_custom, conclusions, attendees, total_units_represented, total_percentage_represented, quorum_achieved, agenda_development, votes_record, agreements_reached, legal_validity, signed_date, president_signature, secretary_signature, final_document_url, attendees_count, quorum_percentage, quorum_met, agenda_items, decisions, voting_results, next_meeting_date, attachments, is_approved, approved_at, approved_by_user_id, notes, status, created_at, updated_at) FROM stdin;
2e656e48-8b5b-457f-a83b-661b77d177cd	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	bedf6d4d-40c9-430b-97af-c7f1af2b1aee	28	2025-02-10	17:30	\N	\N	Hall do Prédio	\N	ordinary	Estrada da Circunvalação, nº 1	Condomino Buraca 1	2610-041	João Manuel Fernandes Longo	\N	Cristina Maria Bertolo Gouveia	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	signed	2025-03-17 09:09:19.069683+00	2025-10-19 04:57:38.347101+00
9f20eca5-96de-4b52-9267-c94a93aed2bb	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	651707f1-3658-49f4-b625-2c33f657a749	29	2025-03-17	18:00	\N	\N	Hall do Prédio	\N	extraordinary	Estrada da Circunvalação, nº 1	Condomino Buraca 1	2610-041	Vítor Manuel Sebastian Rodrigues	\N	João Manuel Fernandes Longo	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	signed	2025-03-17 18:12:24.66613+00	2025-10-19 04:57:38.347101+00
776956d1-d3de-49a7-8fcc-67c255e88e35	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	38290ab1-3b3a-4020-9280-0c9003deeac6	30	2025-05-27	19:00	\N	\N	Hall do Prédio	\N	extraordinary	Estrada da Circunvalação, nº 1	Condomino Buraca 1	2610-041	Vítor Manuel Sebastian Rodrigues	\N	João Manuel Fernandes Longo	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	signed	2025-05-19 12:37:43.108+00	2025-10-19 04:57:38.347101+00
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.refresh_tokens (id, token, user_id, device_id, device_name, ip_address, user_agent, expires_at, is_revoked, revoked_at, created_at, updated_at) FROM stdin;
244bd2a3-dcc3-4728-a426-826a6b5db10a	1ba9fe28847bbe1c8f6b5b73f11b688e65dd8a3421cf5ab6b6e00a48e14ddbed	4171cd13-d28b-4237-a86f-f6683a9ad9fb	\N	\N	::1	curl/8.7.1	2025-07-08 23:27:25.563+00	f	\N	2025-07-01 23:27:25.563849+00	2025-07-01 23:27:25.563849+00
b6302d7e-fb9a-4577-a065-978ab5b7281f	518cd4c8e91bdcbe00b5b565e8e259d4eb595b1200bd05967f7b188781f488cb	4171cd13-d28b-4237-a86f-f6683a9ad9fb	\N	\N	::1	curl/8.7.1	2025-07-08 23:30:06.061+00	f	\N	2025-07-01 23:30:06.061996+00	2025-07-01 23:30:06.061996+00
71496a04-84ca-42b3-945d-0e9abd79381c	beda43eae5e4be0119146bf577d4357e7381af24667d1c5628405fc86873152f	4171cd13-d28b-4237-a86f-f6683a9ad9fb	\N	\N	::1	curl/8.7.1	2025-07-08 23:32:11.567+00	f	\N	2025-07-01 23:32:11.567757+00	2025-07-01 23:32:11.567757+00
8f2e8d2e-0385-41f4-9710-ddebd34e7e02	a4ffa4bf8060c33391a78a40248a79f648ff32412e46e5d2977c0bf9f9b9bf7d	4171cd13-d28b-4237-a86f-f6683a9ad9fb	\N	\N	::1	curl/8.7.1	2025-07-08 23:56:04.972+00	f	\N	2025-07-01 23:56:04.972518+00	2025-07-01 23:56:04.972518+00
7e9b0ee1-0779-49d2-ac87-6305a6848afb	cce475fd93928b31ff50b24a9ff191a73745d69da693228d6b599bed20ae7fcf	4171cd13-d28b-4237-a86f-f6683a9ad9fb	\N	\N	::1	curl/8.7.1	2025-07-09 00:05:16.005+00	f	\N	2025-07-02 00:05:16.005723+00	2025-07-02 00:05:16.005723+00
f460e7fd-0c76-4b38-bd07-2b4ff5d91c58	f4a83079cc130560c5c338bf24d4ce763c77c20abab1bc4a61611546b60711b4	fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	\N	\N	::1	curl/8.7.1	2025-07-09 00:15:46.852+00	f	\N	2025-07-02 00:15:46.852414+00	2025-07-02 00:15:46.852414+00
d4b78f37-fad9-4407-898a-f22f061dfa56	90cc49478b796296071c108398a6e5f37da3548ff403e35ea55032ec52fa8f9c	fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	\N	\N	::ffff:127.0.0.1	curl/8.7.1	2025-07-09 00:24:41.656+00	f	\N	2025-07-02 00:24:41.656824+00	2025-07-02 00:24:41.656824+00
e94dbd1d-e84c-4f18-83e4-c5913bc251c7	351191418b55d84c2cb9e7dbcb540a86d064590e9404021efea61ac65522bd67	4171cd13-d28b-4237-a86f-f6683a9ad9fb	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15	2025-07-09 00:28:47.396+00	f	\N	2025-07-02 00:28:47.396632+00	2025-07-02 00:28:47.396632+00
c1a829f1-b99b-421b-aa6b-855866ba4220	00a2033f1ad85fe027a604c0c46e6f0dcbf5484aa4e1e91d7d54199522133269	fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	\N	\N	::1	curl/8.7.1	2025-07-09 00:29:04.56+00	f	\N	2025-07-02 00:29:04.560362+00	2025-07-02 00:29:04.560362+00
3c1f8087-481d-430f-9d19-d03e08388da9	83aec35584ab0d935dd97f578e28ea7803a4bde37d28942345dd4f50b5d4d140	fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	\N	\N	::1	curl/8.7.1	2025-07-09 00:50:45.293+00	f	\N	2025-07-02 00:50:45.293954+00	2025-07-02 00:50:45.293954+00
7111a2ca-aafd-4eb6-a782-fe93fa3441d1	c2775af9ed67d43a5cf36893b02d73776ecbb524aaa294fccabae9cd8cf2c31a	fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	\N	\N	::1	curl/8.7.1	2025-07-09 00:51:02.585+00	f	\N	2025-07-02 00:51:02.585583+00	2025-07-02 00:51:02.585583+00
5ab188bb-ee46-4238-ba14-70ff1b873a60	1b96ab549a170e6229e84a576ecf0986fdb5379c0b3e89a1a5c644ed4b14a1bd	fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	\N	\N	::1	curl/8.7.1	2025-07-09 00:51:22.137+00	f	\N	2025-07-02 00:51:22.13783+00	2025-07-02 00:51:22.13783+00
c80b2531-8557-4593-8a4a-6049f9c39928	1cf8e0d8ecc05c36291d09f30c7234a39b07d9a436e1a2acafc48081bafff4d2	fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	\N	\N	::1	curl/8.7.1	2025-07-09 00:51:31.803+00	f	\N	2025-07-02 00:51:31.803662+00	2025-07-02 00:51:31.803662+00
ded55f17-f143-422f-9e92-49173614aa7a	d45ab642b01e0628c0c1d9671388a4625d53f5186745e20e9070180e4d664d67	fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	\N	\N	::1	curl/8.7.1	2025-07-09 01:25:45.379+00	f	\N	2025-07-02 01:25:45.379765+00	2025-07-02 01:25:45.379765+00
2bec9996-3e9a-4b9e-a690-fde698d7af45	f7ab6e765fc08be7736c9ebf0ead1db530d6241b35e3e63df123cd1b85b6929b	fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	\N	\N	::1	curl/8.7.1	2025-07-09 01:26:16.39+00	f	\N	2025-07-02 01:26:16.390265+00	2025-07-02 01:26:16.390265+00
09af9c23-1a52-4974-8530-fc904dae7f7f	b477a396e8cd0e9effffdd78de3f0a83e129c9f40558ea367d9c3f9b12a3c996	fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	\N	\N	::1	curl/8.7.1	2025-07-09 01:27:36.508+00	f	\N	2025-07-02 01:27:36.508401+00	2025-07-02 01:27:36.508401+00
243deef2-aee6-44a1-bba8-e112d2981ce4	039774496bf486e574865eb766a1b86f24649be8ada5afb6d94cb38c1b149721	fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	\N	\N	::1	curl/8.7.1	2025-07-09 01:34:44.044+00	f	\N	2025-07-02 01:34:44.044323+00	2025-07-02 01:34:44.044323+00
83cf3582-374e-4d02-a6d0-a01fb960076a	f820d819658c4c948f75ee9b1b27bf387031d304d0d6bb7cceb01d176bca40a2	fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	\N	\N	::1	curl/8.7.1	2025-07-09 01:51:47.404+00	f	\N	2025-07-02 01:51:47.404807+00	2025-07-02 01:51:47.404807+00
ee65417f-08bd-43e1-848c-4ab55be6d8e8	fc6c71953d71cf4ece2d87e7f61a1df6e17d9ee9001d93a3cb243292cc269e92	4171cd13-d28b-4237-a86f-f6683a9ad9fb	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15	2025-07-09 01:52:45.744+00	f	\N	2025-07-02 01:52:45.744942+00	2025-07-02 01:52:45.744942+00
0e5eb263-0373-4e5c-b926-3cb9121abc45	9f53ce44d6e3aa0e58f009c4f47061706c1de191d20d77031da721bce5d63ab2	4171cd13-d28b-4237-a86f-f6683a9ad9fb	\N	\N	::1	axios/1.10.0	2025-07-09 10:57:06.283+00	f	\N	2025-07-02 10:57:06.284283+00	2025-07-02 10:57:06.284283+00
3fadd9d8-bcf5-4e56-978d-db4cc0406663	2aabaa544503bb7338fb14e867d95c7ab3fbc875dc4b745a44404a6534f67f73	4171cd13-d28b-4237-a86f-f6683a9ad9fb	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15	2025-07-09 11:16:26.551+00	t	2025-07-02 11:32:46.23+00	2025-07-02 11:16:26.551557+00	2025-07-02 11:16:26.551557+00
90bc3f80-83f4-4842-96fe-2b7517951313	954dfd133fa116f238aa4bb4e0380e6b24d4eb7e05d9baf045ef304da731cdd4	fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15	2025-07-09 11:33:11.851+00	f	\N	2025-07-02 11:33:11.851562+00	2025-07-02 11:33:11.851562+00
5b2eabea-d29a-4a65-8664-b2ac03016e1f	95e6fe77a0556b7355898224811360d3cc24b5a5d846b7ff7a0d59e70d054960	4171cd13-d28b-4237-a86f-f6683a9ad9fb	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15	2025-07-15 23:13:46.884+00	f	\N	2025-07-08 23:13:46.885291+00	2025-07-08 23:13:46.885291+00
9a13b988-2848-4891-97f4-b2d3ee90bcc5	f895d601aa3d55e8c447ceb94a0ab4f43115f2878e9b137d17f742189f620dee	4171cd13-d28b-4237-a86f-f6683a9ad9fb	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15	2025-07-28 20:12:09.466+00	f	\N	2025-07-21 20:12:09.468521+00	2025-07-21 20:12:09.468521+00
cf7d66f0-3eee-49c7-9085-76b1743ffbc0	b1699b10911f5b28d1bc2dbe239f869ead4f01998fc5ceda7a1cba803ce0978a	4171cd13-d28b-4237-a86f-f6683a9ad9fb	\N	\N	::ffff:172.67.4.173	node	2025-07-28 20:48:34.235+00	f	\N	2025-07-21 20:48:34.236007+00	2025-07-21 20:48:34.236007+00
2c762d05-9bd1-44b0-a7e3-58433f2e4049	17467e752890f70ee452dbae6f95792429b9cec5bd8c8499fbb0135d21103a34	4171cd13-d28b-4237-a86f-f6683a9ad9fb	\N	\N	::ffff:172.67.4.173	node	2025-07-28 20:51:45.113+00	f	\N	2025-07-21 20:51:45.114338+00	2025-07-21 20:51:45.114338+00
d407da38-eaf9-467f-bdac-a3a79aeeaf8b	c2a659cac6004c3fc72c11abd6d6b393094d5305e19b0465e8b194fa1dae230e	4171cd13-d28b-4237-a86f-f6683a9ad9fb	\N	\N	::ffff:172.67.4.173	node	2025-07-28 20:55:00.635+00	f	\N	2025-07-21 20:55:00.636186+00	2025-07-21 20:55:00.636186+00
8c99c0df-131b-4a17-a84b-6347a6c4ba41	76468e08ab8f79d5bf08aecf353f174a325a648370aa12794b2a58768e4f7f37	4171cd13-d28b-4237-a86f-f6683a9ad9fb	\N	\N	::ffff:172.67.4.173	node	2025-07-28 20:57:25.628+00	f	\N	2025-07-21 20:57:25.629668+00	2025-07-21 20:57:25.629668+00
3052748c-cc81-431c-9a24-1bdea6885fa4	7b1e0e21be97474c80572e4dee91395968dd9965959779521d152d224943484e	4171cd13-d28b-4237-a86f-f6683a9ad9fb	\N	\N	::ffff:172.67.4.173	node	2025-07-28 21:01:26.94+00	f	\N	2025-07-21 21:01:26.941467+00	2025-07-21 21:01:26.941467+00
682f8f2d-7080-45fe-8941-817f5fbb4a6d	3e4449a56091c6c5963c9fb6687d744cb249e06fab6bde583f6a0c4d71961207	4171cd13-d28b-4237-a86f-f6683a9ad9fb	\N	\N	::ffff:172.67.4.173	node	2025-07-28 21:02:47.639+00	f	\N	2025-07-21 21:02:47.640209+00	2025-07-21 21:02:47.640209+00
4e727cbe-5266-47ff-8f82-74f2fd7a0542	ba2cd0d17defff1a85dde5c64cfdda99c73cf713b921cc561e735a53ae48b8c2	4171cd13-d28b-4237-a86f-f6683a9ad9fb	\N	\N	::ffff:172.67.4.173	node	2025-07-28 22:46:48.753+00	f	\N	2025-07-21 22:46:48.755252+00	2025-07-21 22:46:48.755252+00
3092ebd5-fff1-4462-b8f4-7ab4646843f2	979b425ce43037c8965e445afbe77829dc31ce14864ea95147426987fa4a3f65	fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	2025-10-26 06:03:12.4+00	f	\N	2025-10-19 06:03:12.400074+00	2025-10-19 06:03:12.400074+00
\.


--
-- Data for Name: sent_letters; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.sent_letters (id, building_id, template_id, member_id, recipient_name, recipient_email, subject, content, send_method, sent_date, delivery_confirmation, tracking_number, legal_validity, created_by_user_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.tasks (id, building_id, minute_id, title, description, assignee_id, assignee_name, due_date, status, priority, category, created_by, created_at, updated_at, completed_at, completed_by, notes) FROM stdin;
4	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	Revisión sistema de incendios	Inspección anual obligatoria	1dfa75cd-fafd-43cd-a0f7-038c2ad76812	Carlos Mendes	2025-09-15	pending	high	safety	1dfa75cd-fafd-43cd-a0f7-038c2ad76812	2025-07-21 20:38:15.894941+00	2025-07-21 20:38:15.894941+00	\N	\N	\N
5	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	Pintura de fachada	Pintar fachada principal del edificio	1dfa75cd-fafd-43cd-a0f7-038c2ad76812	Carlos Mendes	2025-10-01	pending	medium	maintenance	1dfa75cd-fafd-43cd-a0f7-038c2ad76812	2025-07-21 20:38:15.894941+00	2025-07-21 20:38:15.894941+00	\N	\N	\N
\.


--
-- Data for Name: transaction_categories; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.transaction_categories (id, building_id, name, description, type, transaction_type, is_active, color, budget_amount, parent_category_id, sort_order, created_at, updated_at) FROM stdin;
a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e01	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Quotas Mensais	\N	income	\N	t	\N	\N	\N	0	2025-07-02 00:49:09.914393+00	2025-07-02 00:49:09.914393+00
a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e02	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Manutenção	\N	expense	\N	t	\N	\N	\N	0	2025-07-02 00:49:09.914393+00	2025-07-02 00:49:09.914393+00
a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e03	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Limpeza	\N	expense	\N	t	\N	\N	\N	0	2025-07-02 00:49:09.914393+00	2025-07-02 00:49:09.914393+00
a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e04	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Electricidade	\N	expense	\N	t	\N	\N	\N	0	2025-07-02 00:49:09.914393+00	2025-07-02 00:49:09.914393+00
a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e05	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Água	\N	expense	\N	t	\N	\N	\N	0	2025-07-02 00:49:09.914393+00	2025-07-02 00:49:09.914393+00
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.transactions (id, building_id, financial_period_id, period_id, category_id, transaction_date, date, transaction_type, type, description, amount, fraction_id, member_id, payment_method, reference_number, notes, admin_notes, receipt_url, is_recurring, recurring_frequency, recurring_months, year, is_fee_payment, is_confirmed, last_modified_by, tags, created_by_user_id, approved_by_user_id, approved_at, created_at, updated_at) FROM stdin;
cbc30811-8181-4e2f-8d6a-89c5187f9bca	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	\N	\N	2025-01-13	\N	income	\N	TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN	26.13	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2025	f	t	\N	\N	\N	\N	\N	2025-07-02 01:20:22.01452+00	2025-07-02 01:20:22.01452+00
45af40e5-22f8-4bbe-b1aa-551820f5b369	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	\N	\N	2025-01-08	\N	expense	\N	MANUTENCAO DE CONTA VALOR NEGOCIOS 2024	7.99	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2025	f	t	\N	\N	\N	\N	\N	2025-07-02 01:20:22.01452+00	2025-07-02 01:20:22.01452+00
87d15110-e0bc-422a-b1b6-4f119199180a	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	\N	\N	2025-01-08	\N	expense	\N	IMPOSTO DE SELO DEZ 2024	0.32	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2025	f	t	\N	\N	\N	\N	\N	2025-07-02 01:20:22.01452+00	2025-07-02 01:20:22.01452+00
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.user_sessions (id, user_id, session_token, activity_log, last_activity_at, ip_address, user_agent, device_type, browser, os, country, city, is_active, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.users (id, email, password_hash, name, phone, role, permissions, is_active, email_verified, email_verified_at, reset_password_token, reset_password_expires, failed_login_attempts, locked_until, building_id, member_id, created_at, updated_at, last_login_at, deleted_at) FROM stdin;
4171cd13-d28b-4237-a86f-f6683a9ad9fb	admin@example.com	$2b$10$5JytB8TVHs3l828WPONDFOmWRzDDbaj3COWhpi0HeSZJvCxdEkCb.	Administrador	\N	super_admin	{}	t	t	\N	\N	\N	0	\N	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	2025-07-01 22:51:30.465493+00	2025-07-21 22:46:48.738297+00	2025-07-21 22:46:48.735+00	\N
fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	admin@migestpro.com	$2b$10$C/1VIawyjuI9TsZ1OwwwdO2E.ccHknYR5gVmScVw86ymWuBuVbWc2	Administrador	\N	admin	{}	t	f	\N	\N	\N	0	\N	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	2025-07-02 00:15:41.890527+00	2025-10-19 06:03:12.39722+00	2025-10-19 06:03:12.388+00	\N
\.


--
-- Data for Name: voting_results; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.voting_results (id, minute_agenda_item_id, total_votes, votes_in_favor, votes_against, abstentions, quorum_percentage, is_approved, created_at, updated_at) FROM stdin;
\.


--
-- Name: document_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: mini-server
--

SELECT pg_catalog.setval('public.document_categories_id_seq', 11, true);


--
-- Name: document_shares_id_seq; Type: SEQUENCE SET; Schema: public; Owner: mini-server
--

SELECT pg_catalog.setval('public.document_shares_id_seq', 1, false);


--
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: mini-server
--

SELECT pg_catalog.setval('public.documents_id_seq', 5, true);


--
-- Name: knex_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: mini-server
--

SELECT pg_catalog.setval('public.knex_migrations_id_seq', 3, true);


--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE SET; Schema: public; Owner: mini-server
--

SELECT pg_catalog.setval('public.knex_migrations_lock_index_seq', 1, true);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: mini-server
--

SELECT pg_catalog.setval('public.tasks_id_seq', 5, true);


--
-- Name: arrears arrears_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.arrears
    ADD CONSTRAINT arrears_pkey PRIMARY KEY (id);


--
-- Name: attendance_sheets attendance_sheets_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.attendance_sheets
    ADD CONSTRAINT attendance_sheets_pkey PRIMARY KEY (id);


--
-- Name: attendees attendees_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.attendees
    ADD CONSTRAINT attendees_pkey PRIMARY KEY (id);


--
-- Name: buildings buildings_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.buildings
    ADD CONSTRAINT buildings_pkey PRIMARY KEY (id);


--
-- Name: communication_logs communication_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communication_logs
    ADD CONSTRAINT communication_logs_pkey PRIMARY KEY (id);


--
-- Name: convocatorias convocatorias_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.convocatorias
    ADD CONSTRAINT convocatorias_pkey PRIMARY KEY (id);


--
-- Name: document_categories document_categories_building_id_name_key; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.document_categories
    ADD CONSTRAINT document_categories_building_id_name_key UNIQUE (building_id, name);


--
-- Name: document_categories document_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.document_categories
    ADD CONSTRAINT document_categories_pkey PRIMARY KEY (id);


--
-- Name: document_shares document_shares_document_id_member_id_key; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.document_shares
    ADD CONSTRAINT document_shares_document_id_member_id_key UNIQUE (document_id, member_id);


--
-- Name: document_shares document_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.document_shares
    ADD CONSTRAINT document_shares_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: financial_periods financial_periods_building_id_year_key; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.financial_periods
    ADD CONSTRAINT financial_periods_building_id_year_key UNIQUE (building_id, year);


--
-- Name: financial_periods financial_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.financial_periods
    ADD CONSTRAINT financial_periods_pkey PRIMARY KEY (id);


--
-- Name: fractions fractions_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.fractions
    ADD CONSTRAINT fractions_pkey PRIMARY KEY (id);


--
-- Name: knex_migrations_lock knex_migrations_lock_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.knex_migrations_lock
    ADD CONSTRAINT knex_migrations_lock_pkey PRIMARY KEY (index);


--
-- Name: knex_migrations knex_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.knex_migrations
    ADD CONSTRAINT knex_migrations_pkey PRIMARY KEY (id);


--
-- Name: letter_templates letter_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.letter_templates
    ADD CONSTRAINT letter_templates_pkey PRIMARY KEY (id);


--
-- Name: meeting_members meeting_members_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.meeting_members
    ADD CONSTRAINT meeting_members_pkey PRIMARY KEY (id);


--
-- Name: member_annual_fees member_annual_fees_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.member_annual_fees
    ADD CONSTRAINT member_annual_fees_pkey PRIMARY KEY (id);


--
-- Name: member_votes member_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.member_votes
    ADD CONSTRAINT member_votes_pkey PRIMARY KEY (id);


--
-- Name: members members_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_pkey PRIMARY KEY (id);


--
-- Name: minute_agenda_items minute_agenda_items_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.minute_agenda_items
    ADD CONSTRAINT minute_agenda_items_pkey PRIMARY KEY (id);


--
-- Name: minutes minutes_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.minutes
    ADD CONSTRAINT minutes_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: sent_letters sent_letters_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.sent_letters
    ADD CONSTRAINT sent_letters_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: transaction_categories transaction_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.transaction_categories
    ADD CONSTRAINT transaction_categories_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_session_token_unique; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_session_token_unique UNIQUE (session_token);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: voting_results voting_results_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.voting_results
    ADD CONSTRAINT voting_results_pkey PRIMARY KEY (id);


--
-- Name: idx_communication_logs_building_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_communication_logs_building_id ON public.communication_logs USING btree (building_id);


--
-- Name: idx_communication_logs_channel; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_communication_logs_channel ON public.communication_logs USING btree (channel);


--
-- Name: idx_communication_logs_convocatoria; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_communication_logs_convocatoria ON public.communication_logs USING btree (related_convocatoria_id);


--
-- Name: idx_communication_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_communication_logs_created_at ON public.communication_logs USING btree (created_at DESC);


--
-- Name: idx_communication_logs_member_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_communication_logs_member_id ON public.communication_logs USING btree (member_id);


--
-- Name: idx_communication_logs_minute; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_communication_logs_minute ON public.communication_logs USING btree (related_minute_id);


--
-- Name: idx_communication_logs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_communication_logs_status ON public.communication_logs USING btree (status);


--
-- Name: idx_communication_logs_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_communication_logs_type ON public.communication_logs USING btree (communication_type);


--
-- Name: idx_convocatorias_building_id; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX idx_convocatorias_building_id ON public.convocatorias USING btree (building_id);


--
-- Name: idx_documents_building_id; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX idx_documents_building_id ON public.documents USING btree (building_id);


--
-- Name: idx_documents_category; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX idx_documents_category ON public.documents USING btree (category);


--
-- Name: idx_documents_current_version; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX idx_documents_current_version ON public.documents USING btree (is_current_version) WHERE (is_current_version = true);


--
-- Name: idx_documents_member_id; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX idx_documents_member_id ON public.documents USING btree (member_id);


--
-- Name: idx_documents_search; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX idx_documents_search ON public.documents USING gin (search_vector);


--
-- Name: idx_documents_tags; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX idx_documents_tags ON public.documents USING gin (tags);


--
-- Name: idx_members_building_id; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX idx_members_building_id ON public.members USING btree (building_id);


--
-- Name: idx_minutes_building_id; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX idx_minutes_building_id ON public.minutes USING btree (building_id);


--
-- Name: idx_minutes_convocatoria_id; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX idx_minutes_convocatoria_id ON public.minutes USING btree (convocatoria_id);


--
-- Name: idx_tasks_assignee_id; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX idx_tasks_assignee_id ON public.tasks USING btree (assignee_id);


--
-- Name: idx_tasks_building_id; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX idx_tasks_building_id ON public.tasks USING btree (building_id);


--
-- Name: idx_tasks_due_date; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX idx_tasks_due_date ON public.tasks USING btree (due_date);


--
-- Name: idx_tasks_minute_id; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX idx_tasks_minute_id ON public.tasks USING btree (minute_id);


--
-- Name: idx_tasks_status; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);


--
-- Name: idx_transactions_building_id; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX idx_transactions_building_id ON public.transactions USING btree (building_id);


--
-- Name: idx_transactions_date; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX idx_transactions_date ON public.transactions USING btree (transaction_date);


--
-- Name: idx_transactions_member_id; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX idx_transactions_member_id ON public.transactions USING btree (member_id);


--
-- Name: idx_users_building_id; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX idx_users_building_id ON public.users USING btree (building_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_is_active; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX idx_users_is_active ON public.users USING btree (is_active);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: refresh_tokens_expires_at_index; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX refresh_tokens_expires_at_index ON public.refresh_tokens USING btree (expires_at);


--
-- Name: refresh_tokens_is_revoked_index; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX refresh_tokens_is_revoked_index ON public.refresh_tokens USING btree (is_revoked);


--
-- Name: refresh_tokens_token_index; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX refresh_tokens_token_index ON public.refresh_tokens USING btree (token);


--
-- Name: refresh_tokens_user_id_index; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX refresh_tokens_user_id_index ON public.refresh_tokens USING btree (user_id);


--
-- Name: user_sessions_expires_at_index; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX user_sessions_expires_at_index ON public.user_sessions USING btree (expires_at);


--
-- Name: user_sessions_is_active_index; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX user_sessions_is_active_index ON public.user_sessions USING btree (is_active);


--
-- Name: user_sessions_session_token_index; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX user_sessions_session_token_index ON public.user_sessions USING btree (session_token);


--
-- Name: user_sessions_user_id_index; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX user_sessions_user_id_index ON public.user_sessions USING btree (user_id);


--
-- Name: users_building_id_index; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX users_building_id_index ON public.users USING btree (building_id);


--
-- Name: users_email_index; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX users_email_index ON public.users USING btree (email);


--
-- Name: users_is_active_index; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX users_is_active_index ON public.users USING btree (is_active);


--
-- Name: users_role_index; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX users_role_index ON public.users USING btree (role);


--
-- Name: communication_logs trigger_communication_logs_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_communication_logs_updated_at BEFORE UPDATE ON public.communication_logs FOR EACH ROW EXECUTE FUNCTION public.update_communication_logs_updated_at();


--
-- Name: buildings update_buildings_updated_at; Type: TRIGGER; Schema: public; Owner: mini-server
--

CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON public.buildings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: convocatorias update_convocatorias_updated_at; Type: TRIGGER; Schema: public; Owner: mini-server
--

CREATE TRIGGER update_convocatorias_updated_at BEFORE UPDATE ON public.convocatorias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: documents update_document_search_trigger; Type: TRIGGER; Schema: public; Owner: mini-server
--

CREATE TRIGGER update_document_search_trigger BEFORE INSERT OR UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_document_search_vector();


--
-- Name: financial_periods update_financial_periods_updated_at; Type: TRIGGER; Schema: public; Owner: mini-server
--

CREATE TRIGGER update_financial_periods_updated_at BEFORE UPDATE ON public.financial_periods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: members update_members_updated_at; Type: TRIGGER; Schema: public; Owner: mini-server
--

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: minutes update_minutes_updated_at; Type: TRIGGER; Schema: public; Owner: mini-server
--

CREATE TRIGGER update_minutes_updated_at BEFORE UPDATE ON public.minutes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tasks update_tasks_completed_at_trigger; Type: TRIGGER; Schema: public; Owner: mini-server
--

CREATE TRIGGER update_tasks_completed_at_trigger BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_tasks_completed_at();


--
-- Name: tasks update_tasks_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: mini-server
--

CREATE TRIGGER update_tasks_updated_at_trigger BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_tasks_updated_at();


--
-- Name: transactions update_transactions_updated_at; Type: TRIGGER; Schema: public; Owner: mini-server
--

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: mini-server
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: arrears arrears_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.arrears
    ADD CONSTRAINT arrears_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE;


--
-- Name: arrears arrears_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.arrears
    ADD CONSTRAINT arrears_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: arrears arrears_settlement_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.arrears
    ADD CONSTRAINT arrears_settlement_transaction_id_fkey FOREIGN KEY (settlement_transaction_id) REFERENCES public.transactions(id);


--
-- Name: attendance_sheets attendance_sheets_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.attendance_sheets
    ADD CONSTRAINT attendance_sheets_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE;


--
-- Name: attendance_sheets attendance_sheets_convocatoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.attendance_sheets
    ADD CONSTRAINT attendance_sheets_convocatoria_id_fkey FOREIGN KEY (convocatoria_id) REFERENCES public.convocatorias(id);


--
-- Name: attendance_sheets attendance_sheets_minute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.attendance_sheets
    ADD CONSTRAINT attendance_sheets_minute_id_fkey FOREIGN KEY (minute_id) REFERENCES public.minutes(id);


--
-- Name: attendees attendees_attendance_sheet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.attendees
    ADD CONSTRAINT attendees_attendance_sheet_id_fkey FOREIGN KEY (attendance_sheet_id) REFERENCES public.attendance_sheets(id) ON DELETE CASCADE;


--
-- Name: attendees attendees_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.attendees
    ADD CONSTRAINT attendees_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id);


--
-- Name: communication_logs communication_logs_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communication_logs
    ADD CONSTRAINT communication_logs_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE;


--
-- Name: communication_logs communication_logs_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communication_logs
    ADD CONSTRAINT communication_logs_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: communication_logs communication_logs_related_convocatoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communication_logs
    ADD CONSTRAINT communication_logs_related_convocatoria_id_fkey FOREIGN KEY (related_convocatoria_id) REFERENCES public.convocatorias(id) ON DELETE SET NULL;


--
-- Name: communication_logs communication_logs_related_minute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communication_logs
    ADD CONSTRAINT communication_logs_related_minute_id_fkey FOREIGN KEY (related_minute_id) REFERENCES public.minutes(id) ON DELETE SET NULL;


--
-- Name: communication_logs communication_logs_related_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communication_logs
    ADD CONSTRAINT communication_logs_related_transaction_id_fkey FOREIGN KEY (related_transaction_id) REFERENCES public.transactions(id) ON DELETE SET NULL;


--
-- Name: convocatorias convocatorias_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.convocatorias
    ADD CONSTRAINT convocatorias_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE;


--
-- Name: convocatorias convocatorias_published_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.convocatorias
    ADD CONSTRAINT convocatorias_published_by_user_id_fkey FOREIGN KEY (published_by_user_id) REFERENCES public.users(id);


--
-- Name: document_categories document_categories_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.document_categories
    ADD CONSTRAINT document_categories_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE;


--
-- Name: document_categories document_categories_parent_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.document_categories
    ADD CONSTRAINT document_categories_parent_category_id_fkey FOREIGN KEY (parent_category_id) REFERENCES public.document_categories(id) ON DELETE SET NULL;


--
-- Name: document_shares document_shares_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.document_shares
    ADD CONSTRAINT document_shares_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: document_shares document_shares_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.document_shares
    ADD CONSTRAINT document_shares_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: documents documents_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE;


--
-- Name: documents documents_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: documents documents_parent_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_parent_document_id_fkey FOREIGN KEY (parent_document_id) REFERENCES public.documents(id) ON DELETE SET NULL;


--
-- Name: financial_periods financial_periods_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.financial_periods
    ADD CONSTRAINT financial_periods_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE;


--
-- Name: financial_periods financial_periods_closed_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.financial_periods
    ADD CONSTRAINT financial_periods_closed_by_user_id_fkey FOREIGN KEY (closed_by_user_id) REFERENCES public.users(id);


--
-- Name: fractions fractions_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.fractions
    ADD CONSTRAINT fractions_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE;


--
-- Name: fractions fractions_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.fractions
    ADD CONSTRAINT fractions_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: letter_templates letter_templates_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.letter_templates
    ADD CONSTRAINT letter_templates_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE;


--
-- Name: meeting_members meeting_members_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.meeting_members
    ADD CONSTRAINT meeting_members_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE;


--
-- Name: meeting_members meeting_members_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.meeting_members
    ADD CONSTRAINT meeting_members_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id);


--
-- Name: meeting_members meeting_members_minutes_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.meeting_members
    ADD CONSTRAINT meeting_members_minutes_id_fkey FOREIGN KEY (minutes_id) REFERENCES public.minutes(id) ON DELETE CASCADE;


--
-- Name: member_annual_fees member_annual_fees_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.member_annual_fees
    ADD CONSTRAINT member_annual_fees_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE;


--
-- Name: member_annual_fees member_annual_fees_financial_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.member_annual_fees
    ADD CONSTRAINT member_annual_fees_financial_period_id_fkey FOREIGN KEY (financial_period_id) REFERENCES public.financial_periods(id);


--
-- Name: member_annual_fees member_annual_fees_fraction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.member_annual_fees
    ADD CONSTRAINT member_annual_fees_fraction_id_fkey FOREIGN KEY (fraction_id) REFERENCES public.fractions(id);


--
-- Name: member_annual_fees member_annual_fees_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.member_annual_fees
    ADD CONSTRAINT member_annual_fees_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: member_annual_fees member_annual_fees_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.member_annual_fees
    ADD CONSTRAINT member_annual_fees_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id);


--
-- Name: member_votes member_votes_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.member_votes
    ADD CONSTRAINT member_votes_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE;


--
-- Name: member_votes member_votes_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.member_votes
    ADD CONSTRAINT member_votes_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id);


--
-- Name: member_votes member_votes_minute_agenda_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.member_votes
    ADD CONSTRAINT member_votes_minute_agenda_item_id_fkey FOREIGN KEY (minute_agenda_item_id) REFERENCES public.minute_agenda_items(id) ON DELETE CASCADE;


--
-- Name: members members_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE;


--
-- Name: members members_legal_representative_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_legal_representative_id_fkey FOREIGN KEY (legal_representative_id) REFERENCES public.members(id);


--
-- Name: minute_agenda_items minute_agenda_items_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.minute_agenda_items
    ADD CONSTRAINT minute_agenda_items_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE;


--
-- Name: minute_agenda_items minute_agenda_items_convocatoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.minute_agenda_items
    ADD CONSTRAINT minute_agenda_items_convocatoria_id_fkey FOREIGN KEY (convocatoria_id) REFERENCES public.convocatorias(id);


--
-- Name: minute_agenda_items minute_agenda_items_minutes_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.minute_agenda_items
    ADD CONSTRAINT minute_agenda_items_minutes_id_fkey FOREIGN KEY (minutes_id) REFERENCES public.minutes(id) ON DELETE CASCADE;


--
-- Name: minutes minutes_approved_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.minutes
    ADD CONSTRAINT minutes_approved_by_user_id_fkey FOREIGN KEY (approved_by_user_id) REFERENCES public.users(id);


--
-- Name: minutes minutes_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.minutes
    ADD CONSTRAINT minutes_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE;


--
-- Name: minutes minutes_convocatoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.minutes
    ADD CONSTRAINT minutes_convocatoria_id_fkey FOREIGN KEY (convocatoria_id) REFERENCES public.convocatorias(id);


--
-- Name: refresh_tokens refresh_tokens_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sent_letters sent_letters_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.sent_letters
    ADD CONSTRAINT sent_letters_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE;


--
-- Name: sent_letters sent_letters_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.sent_letters
    ADD CONSTRAINT sent_letters_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


--
-- Name: sent_letters sent_letters_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.sent_letters
    ADD CONSTRAINT sent_letters_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id);


--
-- Name: sent_letters sent_letters_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.sent_letters
    ADD CONSTRAINT sent_letters_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.letter_templates(id);


--
-- Name: tasks tasks_assignee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public.members(id);


--
-- Name: tasks tasks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.members(id);


--
-- Name: tasks tasks_minute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_minute_id_fkey FOREIGN KEY (minute_id) REFERENCES public.minutes(id) ON DELETE SET NULL;


--
-- Name: transaction_categories transaction_categories_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.transaction_categories
    ADD CONSTRAINT transaction_categories_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE;


--
-- Name: transaction_categories transaction_categories_parent_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.transaction_categories
    ADD CONSTRAINT transaction_categories_parent_category_id_fkey FOREIGN KEY (parent_category_id) REFERENCES public.transaction_categories(id);


--
-- Name: transactions transactions_approved_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_approved_by_user_id_fkey FOREIGN KEY (approved_by_user_id) REFERENCES public.users(id);


--
-- Name: transactions transactions_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.transaction_categories(id);


--
-- Name: transactions transactions_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


--
-- Name: transactions transactions_financial_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_financial_period_id_fkey FOREIGN KEY (financial_period_id) REFERENCES public.financial_periods(id);


--
-- Name: transactions transactions_fraction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_fraction_id_fkey FOREIGN KEY (fraction_id) REFERENCES public.fractions(id);


--
-- Name: transactions transactions_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: transactions transactions_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.financial_periods(id);


--
-- Name: user_sessions user_sessions_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: voting_results voting_results_minute_agenda_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.voting_results
    ADD CONSTRAINT voting_results_minute_agenda_item_id_fkey FOREIGN KEY (minute_agenda_item_id) REFERENCES public.minute_agenda_items(id) ON DELETE CASCADE;


--
-- Name: TABLE arrears; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON TABLE public.arrears TO devuser;


--
-- Name: TABLE attendance_sheets; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON TABLE public.attendance_sheets TO devuser;


--
-- Name: TABLE attendees; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON TABLE public.attendees TO devuser;


--
-- Name: TABLE buildings; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON TABLE public.buildings TO devuser;


--
-- Name: TABLE convocatorias; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON TABLE public.convocatorias TO devuser;


--
-- Name: TABLE document_categories; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON TABLE public.document_categories TO devuser;


--
-- Name: SEQUENCE document_categories_id_seq; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON SEQUENCE public.document_categories_id_seq TO devuser;


--
-- Name: TABLE document_shares; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON TABLE public.document_shares TO devuser;


--
-- Name: SEQUENCE document_shares_id_seq; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON SEQUENCE public.document_shares_id_seq TO devuser;


--
-- Name: TABLE documents; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON TABLE public.documents TO devuser;


--
-- Name: SEQUENCE documents_id_seq; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON SEQUENCE public.documents_id_seq TO devuser;


--
-- Name: TABLE financial_periods; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON TABLE public.financial_periods TO devuser;


--
-- Name: TABLE fractions; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON TABLE public.fractions TO devuser;


--
-- Name: TABLE knex_migrations; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON TABLE public.knex_migrations TO devuser;


--
-- Name: SEQUENCE knex_migrations_id_seq; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON SEQUENCE public.knex_migrations_id_seq TO devuser;


--
-- Name: TABLE knex_migrations_lock; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON TABLE public.knex_migrations_lock TO devuser;


--
-- Name: SEQUENCE knex_migrations_lock_index_seq; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON SEQUENCE public.knex_migrations_lock_index_seq TO devuser;


--
-- Name: TABLE letter_templates; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON TABLE public.letter_templates TO devuser;


--
-- Name: TABLE meeting_members; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON TABLE public.meeting_members TO devuser;


--
-- Name: TABLE member_annual_fees; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON TABLE public.member_annual_fees TO devuser;


--
-- Name: TABLE member_votes; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON TABLE public.member_votes TO devuser;


--
-- Name: TABLE members; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON TABLE public.members TO devuser;


--
-- Name: TABLE minute_agenda_items; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON TABLE public.minute_agenda_items TO devuser;


--
-- Name: TABLE minutes; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON TABLE public.minutes TO devuser;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON TABLE public.refresh_tokens TO devuser;


--
-- Name: TABLE sent_letters; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON TABLE public.sent_letters TO devuser;


--
-- Name: TABLE tasks; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON TABLE public.tasks TO devuser;


--
-- Name: SEQUENCE tasks_id_seq; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON SEQUENCE public.tasks_id_seq TO devuser;


--
-- Name: TABLE transaction_categories; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON TABLE public.transaction_categories TO devuser;


--
-- Name: TABLE transactions; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON TABLE public.transactions TO devuser;


--
-- Name: TABLE user_sessions; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON TABLE public.user_sessions TO devuser;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON TABLE public.users TO devuser;


--
-- Name: TABLE voting_results; Type: ACL; Schema: public; Owner: mini-server
--

GRANT ALL ON TABLE public.voting_results TO devuser;


--
-- PostgreSQL database dump complete
--

