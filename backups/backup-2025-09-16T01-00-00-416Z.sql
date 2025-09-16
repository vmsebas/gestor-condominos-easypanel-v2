--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

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
-- Name: arrears_config; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.arrears_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    building_id uuid,
    grace_period_days integer DEFAULT 10,
    late_fee_percentage numeric(5,2) DEFAULT '0'::numeric,
    send_reminders boolean DEFAULT true,
    reminder_frequency_days integer DEFAULT 7,
    max_reminders integer DEFAULT 3,
    auto_generate_arrears boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.arrears_config OWNER TO "mini-server";

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
    CONSTRAINT attendees_attendance_type_check CHECK (((attendance_type)::text = ANY ((ARRAY['present'::character varying, 'represented'::character varying, 'absent'::character varying])::text[])))
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


ALTER TABLE public.document_categories_id_seq OWNER TO "mini-server";

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


ALTER TABLE public.document_shares_id_seq OWNER TO "mini-server";

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


ALTER TABLE public.documents_id_seq OWNER TO "mini-server";

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


ALTER TABLE public.knex_migrations_id_seq OWNER TO "mini-server";

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


ALTER TABLE public.knex_migrations_lock_index_seq OWNER TO "mini-server";

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
    CONSTRAINT member_votes_vote_check CHECK (((vote)::text = ANY ((ARRAY['favor'::character varying, 'against'::character varying, 'abstention'::character varying])::text[])))
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
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.members OWNER TO "mini-server";

--
-- Name: minute_agenda_items; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.minute_agenda_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    minutes_id uuid NOT NULL,
    building_id uuid,
    item_number integer NOT NULL,
    title character varying(255) NOT NULL,
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
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
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
-- Name: payment_history; Type: TABLE; Schema: public; Owner: mini-server
--

CREATE TABLE public.payment_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    transaction_id uuid,
    member_id uuid,
    building_id uuid,
    amount numeric(10,2) NOT NULL,
    payment_date date NOT NULL,
    payment_method character varying(255),
    reference character varying(255),
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.payment_history OWNER TO "mini-server";

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
    CONSTRAINT tasks_priority_check CHECK (((priority)::text = ANY ((ARRAY['high'::character varying, 'medium'::character varying, 'low'::character varying])::text[]))),
    CONSTRAINT tasks_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
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


ALTER TABLE public.tasks_id_seq OWNER TO "mini-server";

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
    CONSTRAINT transaction_categories_type_check CHECK (((type)::text = ANY ((ARRAY['income'::character varying, 'expense'::character varying])::text[])))
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
    status character varying(255) DEFAULT 'pending'::character varying,
    due_date date,
    payment_date date,
    payment_status character varying(255),
    CONSTRAINT transactions_transaction_type_check CHECK (((transaction_type)::text = ANY ((ARRAY['income'::character varying, 'expense'::character varying])::text[])))
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
\.


--
-- Data for Name: arrears_config; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.arrears_config (id, building_id, grace_period_days, late_fee_percentage, send_reminders, reminder_frequency_days, max_reminders, auto_generate_arrears, created_at, updated_at) FROM stdin;
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
9cf64a8a-8570-4f16-94a5-dd48c694324c	Edificio Principal	Rua das Flores, 123	1200-001	Lisboa	8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8	\N	\N	\N	2025-07-02 00:44:57.216072+01	2025-09-09 23:12:00.302344+01
fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Condomino Buraca 1	Estrada da Circunvalação, nº 1	2610-000	Amadora	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5	\N	\N	\N	2025-07-02 01:49:09.914393+01	2025-09-09 23:12:00.308078+01
\.


--
-- Data for Name: convocatorias; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.convocatorias (id, building_id, building_name, building_address, postal_code, city, assembly_number, assembly_type, meeting_type, title, date, meeting_date, "time", location, meeting_location, second_call_enabled, second_call_time, second_call_date, administrator, secretary, legal_reference, minutes_created, agenda_items, convocation_date, legal_notice_period, delivery_method, attached_documents, legal_validation, quorum_requirements, status, meeting_subject, president_name, president_email, secretary_name, secretary_email, administrator_name, administrator_email, notification_sent_at, published_at, published_by_user_id, notes, created_at, updated_at) FROM stdin;
bedf6d4d-40c9-430b-97af-c7f1af2b1aee	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Condomino Buraca 1	Estrada da Circunvalação, nº 1	2610-041	Amadora	\N	ordinary	\N	Assembleia Ordinária Nº 28	2025-02-10	\N	17:30	Hall do Prédio	\N	t	\N	\N	João Manuel Fernandes Longo	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	draft	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-02 01:59:16.947675+01	2025-07-02 01:59:16.947675+01
651707f1-3658-49f4-b625-2c33f657a749	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Condomino Buraca 1	Estrada da Circunvalação, nº 1	2610-041	Amadora	\N	extraordinary	\N	Assembleia Extraordinária Nº 29	2025-03-17	\N	18:00	Hall do Prédio	\N	t	\N	\N	Vítor Manuel Sebastian Rodrigues	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	draft	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-02 01:59:16.947675+01	2025-07-02 01:59:16.947675+01
38290ab1-3b3a-4020-9280-0c9003deeac6	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Condomino Buraca 1	Estrada da Circunvalação, nº 1	2610-041	Amadora	30	extraordinary	\N	Assembleia Extraordinária Nº 30	2025-05-29	\N	18:30	Hall do Prédio	\N	t	\N	\N	Vitor Manuel Sebastian Rodrigues	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	draft	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-02 02:18:21.014189+01	2025-07-02 02:18:21.014189+01
\.


--
-- Data for Name: document_categories; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.document_categories (id, building_id, name, description, color, icon, parent_category_id, sort_order, created_at) FROM stdin;
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
1	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	Regulamento do Condomínio	regulamento_condominio_2025.pdf	/documents/regulamento_condominio_2025.pdf	524288	application/pdf	pdf	legal	\N	\N	Regulamento interno do condomínio aprovado em assembleia	1	\N	t	building	f	read	admin@example.com	2025-09-09 11:35:22.673735	\N	0	'aprov':8B 'assemblei':10B 'condomini':3A,7B 'do':2A,6B 'em':9B 'intern':5B 'regulament':1A,4B	2025-01-15 10:00:00	2025-01-15 10:00:00
2	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	Ata Assembleia Nº 28	ata_assembleia_28_2025.pdf	/documents/ata_assembleia_28_2025.pdf	312456	application/pdf	pdf	minutes	\N	\N	Ata da assembleia ordinária número 28 realizada em 10/02/2025	1	\N	t	building	f	read	admin@example.com	2025-09-09 11:35:22.673735	\N	0	'10/02/2025':13B '28':4A,10B 'assemblei':2A,7B 'ata':1A,5B 'da':6B 'em':12B 'numer':9B 'nº':3A 'ordinari':8B 'realiz':11B	2025-02-11 09:30:00	2025-02-11 09:30:00
3	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	Orçamento 2025	orcamento_2025_aprovado.xlsx	/documents/orcamento_2025_aprovado.xlsx	45678	application/vnd.openxmlformats-officedocument.spreadsheetml.sheet	xlsx	financial	\N	\N	Orçamento aprovado para o exercício de 2025	1	\N	t	building	f	read	admin@example.com	2025-09-09 11:35:22.673735	\N	0	'2025':2A,9B 'aprov':4B 'exercici':7B 'orçament':1A,3B	2025-02-10 15:00:00	2025-02-10 15:00:00
4	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	Contrato Limpeza	contrato_limpeza_2025.pdf	/documents/contrato_limpeza_2025.pdf	234567	application/pdf	pdf	contracts	\N	\N	Contrato com empresa de limpeza para 2025	1	\N	t	building	f	read	admin@example.com	2025-09-09 11:35:22.673735	\N	0	'2025':9B 'com':4B 'contrat':1A,3B 'empres':5B 'limpez':2A,7B	2025-01-05 11:00:00	2025-01-05 11:00:00
5	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	Apólice de Seguro	apolice_seguro_2025.pdf	/documents/apolice_seguro_2025.pdf	456789	application/pdf	pdf	insurance	\N	\N	Apólice de seguro multirriscos do condomínio	1	\N	t	building	f	read	admin@example.com	2025-09-09 11:35:22.673735	\N	0	'apolic':1A,4B 'condomini':9B 'do':8B 'multirrisc':7B 'segur':3A,6B	2025-01-10 14:30:00	2025-01-10 14:30:00
\.


--
-- Data for Name: financial_periods; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.financial_periods (id, building_id, year, start_date, end_date, approved_budget, budget_approval_date, budget_approval_minute_id, reserve_fund_minimum, reserve_fund_actual, legal_compliance_check, is_closed, closed_at, total_income, total_expenses, balance, notes, closed_by_user_id, initial_balance, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: fractions; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.fractions (id, building_id, member_id, unit_number, ownership_percentage, surface_area, fraction_type, is_active, deed_reference, acquisition_date, notes, created_at, updated_at) FROM stdin;
ead748a9-008b-4ad6-9157-c227042ec100	9cf64a8a-8570-4f16-94a5-dd48c694324c	\N	1A	12.50	85.00	apartment	t	\N	\N	\N	2025-09-09 23:12:00.294+01	2025-09-09 23:12:00.294+01
0c0d3ff0-d099-4bf4-a3c3-e7f70366b447	9cf64a8a-8570-4f16-94a5-dd48c694324c	\N	1B	11.00	75.00	apartment	t	\N	\N	\N	2025-09-09 23:12:00.298+01	2025-09-09 23:12:00.298+01
f104290e-7594-4437-b9c6-2ac30ef9f987	9cf64a8a-8570-4f16-94a5-dd48c694324c	\N	2A	13.50	90.00	apartment	t	\N	\N	\N	2025-09-09 23:12:00.299+01	2025-09-09 23:12:00.299+01
68b91be5-b551-4626-8c65-d66121cab8cc	9cf64a8a-8570-4f16-94a5-dd48c694324c	\N	2B	12.00	80.00	apartment	t	\N	\N	\N	2025-09-09 23:12:00.299+01	2025-09-09 23:12:00.299+01
b94f3d22-558f-429a-84b6-15998a636bef	9cf64a8a-8570-4f16-94a5-dd48c694324c	\N	G1	2.50	15.00	garage	t	\N	\N	\N	2025-09-09 23:12:00.3+01	2025-09-09 23:12:00.3+01
680ea118-3f87-4793-b6c9-24bbaa00ed1a	9cf64a8a-8570-4f16-94a5-dd48c694324c	\N	G2	2.50	15.00	garage	t	\N	\N	\N	2025-09-09 23:12:00.3+01	2025-09-09 23:12:00.3+01
e6565c95-4c18-478e-a860-e0c24d476aee	9cf64a8a-8570-4f16-94a5-dd48c694324c	\N	S1	1.50	10.00	storage	t	\N	\N	\N	2025-09-09 23:12:00.301+01	2025-09-09 23:12:00.301+01
363fbdeb-58ad-4cbc-b85e-6459e7a4609a	9cf64a8a-8570-4f16-94a5-dd48c694324c	\N	Loja	18.00	120.00	commercial	t	\N	\N	\N	2025-09-09 23:12:00.301+01	2025-09-09 23:12:00.301+01
cab45e0a-6db2-4cce-8aa0-2a8c7575026f	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	T1	20.00	100.00	apartment	t	\N	\N	\N	2025-09-09 23:12:00.306+01	2025-09-09 23:12:00.306+01
a499c588-f607-4d66-bc96-f9dca3c22305	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	T2	22.00	110.00	apartment	t	\N	\N	\N	2025-09-09 23:12:00.307+01	2025-09-09 23:12:00.307+01
cf3fc619-e76d-411f-ac03-8b9ccba40d31	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	T3	24.00	120.00	apartment	t	\N	\N	\N	2025-09-09 23:12:00.307+01	2025-09-09 23:12:00.307+01
fe3cdaa0-a2c3-43c7-8583-e29c039b0f0e	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	T4	19.00	95.00	apartment	t	\N	\N	\N	2025-09-09 23:12:00.307+01	2025-09-09 23:12:00.307+01
a8b9e262-ee78-47c8-9203-031d3f7a704c	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	P1	4.00	20.00	garage	t	\N	\N	\N	2025-09-09 23:12:00.307+01	2025-09-09 23:12:00.307+01
\.


--
-- Data for Name: knex_migrations; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.knex_migrations (id, name, batch, migration_time) FROM stdin;
1	20250626155116_create_users_table.cjs	1	2025-06-26 17:11:15.911+01
2	20250626155143_create_refresh_tokens_table.cjs	1	2025-06-26 17:11:15.926+01
3	20250626155204_create_user_sessions_table.cjs	1	2025-06-26 17:11:15.933+01
4	20250909_add_arrears_tracking.cjs	2	2025-09-09 17:58:09.132+01
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
7799484f-ee71-4f61-a801-b03b9ca9f2dc	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Carta de Cobranza de Quotas	late_payment	Quotas de Condomínio em Atraso	<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <style>\n        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 40px; }\n        .header { text-align: center; margin-bottom: 30px; }\n        .building-info { text-align: center; margin-bottom: 20px; font-size: 14px; }\n        .date { text-align: right; margin-bottom: 30px; }\n        .recipient { margin-bottom: 20px; }\n        .subject { font-weight: bold; font-size: 16px; margin-bottom: 20px; background-color: #f5f5f5; padding: 10px; border-left: 4px solid #cc0000; }\n        .content { margin-bottom: 30px; text-align: justify; }\n        .signature { margin-top: 40px; }\n        .footer { margin-top: 50px; font-size: 12px; text-align: center; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }\n        .important { color: #cc0000; font-weight: bold; }\n        .legal-notice { font-size: 12px; background-color: #f9f9f9; padding: 10px; margin: 20px 0; border-radius: 5px; }\n    </style>\n</head>\n<body>\n<div class="header">\n    <h2>Condomínio {{building.name}}</h2>\n    <div class="building-info">\n        {{building.address}}, {{building.postalCode}}, {{building.city}}<br>\n        <strong>IBAN:</strong> {{building.iban}}\n    </div>\n</div>\n<div class="date">{{building.city}}, {{date.formatted}}</div>\n<div class="recipient">\n    <strong>Exmo(a). Sr(a).</strong> {{member.name}}<br>\n    <strong>Fracção:</strong> {{member.fraction}} ({{member.permillage}}‰)\n</div>\n<div class="subject">Assunto: Quotas de Condomínio em Atraso - {{payment.period}}</div>\n<div class="content">\n    <p>Venho por este meio informar que, de acordo com os nossos registos, V. Exa. tem em dívida o valor de <span class="important">{{payment.due}}€</span> referente às quotas de condomínio do período <strong>{{payment.period}}</strong>.</p>\n    <p>Este valor corresponde aos seguintes meses em atraso:</p>\n    <ul>\n        <li>Período: <strong>{{payment.period}}</strong></li>\n        <li>Valor em dívida: <strong>{{payment.due}}€</strong></li>\n        <li>Data limite de pagamento original: <strong>{{payment.originalDueDate}}</strong></li>\n    </ul>\n    <p>Conforme o artigo 6º do Decreto-Lei n.º 268/94, de 25 de Outubro, e o Regulamento do Condomínio, solicito a regularização deste valor até <strong>{{payment.dueDate}}</strong>.</p>\n    <div class="legal-notice">\n        <p>Lembramos que, de acordo com a legislação em vigor, o não pagamento das quotas de condomínio pode resultar em:</p>\n        <ol>\n            <li>Aplicação de juros de mora à taxa legal;</li>\n            <li>Procedimento judicial para cobrança coerciva dos valores em dívida;</li>\n            <li>Inclusão das despesas judiciais e honorários de advogado no montante a cobrar.</li>\n        </ol>\n    </div>\n    <p>Para efectuar o pagamento, poderá realizar uma transferência bancária para o IBAN acima indicado, mencionando a sua fracção na descrição.</p>\n    <p>Caso necessite de esclarecimentos adicionais ou pretenda estabelecer um plano de pagamento, por favor entre em contacto com a administração através do telefone <strong>{{building.adminPhone}}</strong> ou e-mail <strong>{{building.adminEmail}}</strong>.</p>\n    <p>Caso já tenha procedido à regularização desta situação após a emissão desta comunicação, por favor desconsidere este aviso.</p>\n</div>\n<div class="signature">\n    <p>Com os melhores cumprimentos,</p>\n    <p><strong>{{building.administrator}}</strong><br>\n    Administração do Condomínio {{building.name}}</p>\n</div>\n<div class="footer">\n    {{building.name}} | {{building.address}}, {{building.city}}, {{building.postalCode}} | Tel: {{building.adminPhone}} | Email: {{building.adminEmail}}\n</div>\n</body>\n</html>	{member.name,member.fraction,member.permillage,payment.due,payment.period,payment.dueDate,payment.originalDueDate,building.name,building.address,building.city,building.postalCode,building.iban,building.administrator,building.adminPhone,building.adminEmail}	t	Decreto-Lei n.º 268/94, de 25 de Outubro	\N	\N	Carta de Cobranza - Quotas em Atraso	2025-09-09 11:36:42.570053+01	2025-09-09 11:36:42.570053+01
316320af-6689-4efa-b1ef-31be15c1ef7b	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Aprovação de Orçamento	budget_approval	Aprovação do Orçamento para o Exercício	<div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px;">\n  <div style="text-align: right; margin-bottom: 20px;">\n    <div>{{building.name}}</div>\n    <div>{{building.address}}</div>\n    <div>Lisboa, {{date.today}}</div>\n  </div>\n  <div style="margin-bottom: 30px;">\n    <div><strong>Estimado/a Sr./Sra. {{member.name}}</strong></div>\n    <div>Fracção: {{member.fraction}}</div>\n    <div>Permilagem: {{member.permillage}}‰</div>\n  </div>\n  <div style="margin-bottom: 20px;">\n    <div><strong>Assunto: Aprovação do Orçamento para o Exercício {{date.year}} – Assembleia n.º {{assembly.number}}/{{date.year}}</strong></div>\n  </div>\n  <div style="margin-bottom: 30px;">\n    <div>Por meio da presente, informamos que na assembleia geral de condóminos n.º {{assembly.number}}/{{date.year}}, celebrada no dia {{assembly.date}}, com a ordem do dia "{{assembly.agenda}}", foi aprovado por maioria o novo orçamento do condomínio, segundo consta na ata n.º {{assembly.number}}/{{date.year}}.</div>\n    <div style="margin-top: 15px;">De acordo com o decidido, a quota correspondente à sua fracção foi estabelecida em <strong>{{payment.newQuota}}€</strong> ({{payment.period}}) em função da sua permilagem.</div>\n    <div style="margin-top: 15px;">Para sua comodidade, o pagamento poderá ser realizado de forma anual ou em quotas mensais de <strong>{{payment.monthlyQuota}}€</strong>, com início a partir de {{payment.startDate}}. O pagamento deverá ser efectuado até ao dia {{payment.dueDate}} mediante transferência bancária para a conta:</div>\n    <div style="margin-left: 20px; margin-top: 15px;"><strong>IBAN: {{payment.iban}}</strong></div>\n    <div style="margin-top: 15px;">Detalhe do orçamento aprovado:</div>\n    <ul>\n      <li>Orçamento operativo: {{payment.operativeBudgetQuota}}€</li>\n      <li>Fundo de reserva: {{payment.reserveFundQuota}}€</li>\n      <li><strong>Total anual: {{payment.newQuota}}€</strong></li>\n    </ul>\n  </div>\n  <div style="margin-top: 40px;">\n    <div>Ficamos à sua disposição para qualquer consulta ou esclarecimento adicional.</div>\n    <div style="margin-top: 15px;">Receba um cordial cumprimento,</div>\n    <div style="margin-top: 15px;"><strong>A Administração do Condomínio</strong></div>\n    <div>{{building.name}}</div>\n  </div>\n</div>	{member.name,member.fraction,member.permillage,assembly.number,assembly.date,assembly.agenda,payment.newQuota,payment.period,payment.monthlyQuota,payment.startDate,payment.dueDate,payment.iban,payment.operativeBudgetQuota,payment.reserveFundQuota,building.name,building.address,date.today,date.year}	t	Lei da Propriedade Horizontal	\N	\N	Aprovação de Orçamento Anual	2025-09-09 11:36:42.570053+01	2025-09-09 11:36:42.570053+01
05fb824c-d9b1-4ce8-a38b-da26829ff155	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Convocatória para Assembleia	meeting_notice	Convocatória - Assembleia de Condóminos	<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">\n  <div style="text-align: center; margin-bottom: 30px;">\n    <h2>CONVOCATÓRIA</h2>\n    <h3>Assembleia de Condóminos</h3>\n    <h3>{{building.name}}</h3>\n  </div>\n  <div style="margin-bottom: 20px;">\n    <p>Exmo(a) Sr(a). <strong>{{member.name}}</strong></p>\n    <p>Fracção: {{member.fraction}}</p>\n  </div>\n  <div style="margin-bottom: 30px;">\n    <p>Nos termos da Lei e do Regulamento do Condomínio, convoco V. Exa. para a Assembleia {{assembly.type}} de Condóminos, a realizar-se no próximo dia <strong>{{meeting.date}}</strong>, às <strong>{{meeting.time}}</strong>, no <strong>{{meeting.location}}</strong>, com a seguinte:</p>\n  </div>\n  <div style="background-color: #f5f5f5; padding: 20px; margin-bottom: 30px;">\n    <h4>ORDEM DE TRABALHOS:</h4>\n    <ol>\n      <li>Aprovação da ata da assembleia anterior</li>\n      <li>Apresentação e aprovação do relatório de contas</li>\n      <li>Discussão e aprovação do orçamento para o próximo exercício</li>\n      <li>Eleição dos órgãos sociais</li>\n      <li>Outros assuntos de interesse geral</li>\n    </ol>\n  </div>\n  <div style="margin-bottom: 30px;">\n    <p><strong>Nota Importante:</strong> Caso não se verifique quórum na hora marcada, a Assembleia reunirá em segunda convocatória, meia hora depois, com qualquer número de presentes, conforme previsto no Regulamento do Condomínio.</p>\n  </div>\n  <div style="margin-bottom: 30px;">\n    <p>A sua presença é fundamental para as decisões que afetam o nosso condomínio.</p>\n  </div>\n  <div style="margin-top: 40px;">\n    <p>Com os melhores cumprimentos,</p>\n    <p><strong>{{building.administrator}}</strong></p>\n    <p>Administração do Condomínio</p>\n    <p>{{date.today}}</p>\n  </div>\n</div>	{member.name,member.fraction,assembly.type,meeting.date,meeting.time,meeting.location,building.name,building.administrator,date.today}	t	Código Civil - Propriedade Horizontal	\N	\N	Convocatória para Assembleia	2025-09-09 11:36:42.570053+01	2025-09-09 11:36:42.570053+01
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

COPY public.members (id, building_id, name, apartment, fraction, votes, email, phone, profile_image, notes, old_annual_fee, old_monthly_fee, new_annual_fee, new_monthly_fee, permilage, is_active, nif, nif_nie, address, ownership_percentage, deed_date, legal_representative_id, role, monthly_fee, annual_fee, avatar_url, secondary_address, secondary_postal_code, secondary_city, secondary_country, user_id, created_at, updated_at) FROM stdin;
22135ace-526d-4fea-b86e-843b51d5a279	9cf64a8a-8570-4f16-94a5-dd48c694324c	João Silva	1A	A	10	joao.silva@email.com	912345678	\N	\N	0.00	0.00	0.00	0.00	0.0000	t	\N	\N	\N	\N	\N	\N	owner	50.00	600.00	\N	\N	\N	\N	Portugal	\N	2025-07-02 00:45:26.351129+01	2025-07-02 00:45:26.351129+01
dc5eb03f-d0f6-4ab4-9500-dd934b28e529	9cf64a8a-8570-4f16-94a5-dd48c694324c	Maria Santos	2B	B	15	maria.santos@email.com	913456789	\N	\N	0.00	0.00	0.00	0.00	0.0000	t	\N	\N	\N	\N	\N	\N	owner	75.00	900.00	\N	\N	\N	\N	Portugal	\N	2025-07-02 00:45:26.351129+01	2025-07-02 00:45:26.351129+01
0ea5a82f-0a2a-420c-b944-6d064e9597ed	9cf64a8a-8570-4f16-94a5-dd48c694324c	Pedro Costa	3C	C	12	pedro.costa@email.com	914567890	\N	\N	0.00	0.00	0.00	0.00	0.0000	t	\N	\N	\N	\N	\N	\N	owner	60.00	720.00	\N	\N	\N	\N	Portugal	\N	2025-07-02 00:45:26.351129+01	2025-07-02 00:45:26.351129+01
1dfa75cd-fafd-43cd-a0f7-038c2ad76812	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Cristina Maria Bertolo Gouveia	\N	\N	0	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.0000	t	\N	\N	\N	\N	\N	\N	owner	\N	\N	\N	\N	\N	\N	Portugal	\N	2025-07-02 01:59:16.947675+01	2025-07-02 01:59:16.947675+01
6a62625e-1264-4588-b6bf-a7a8ca0771bd	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	José Manuel Costa Ricardo	\N	\N	0	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.0000	t	\N	\N	\N	\N	\N	\N	owner	\N	\N	\N	\N	\N	\N	Portugal	\N	2025-07-02 01:59:16.947675+01	2025-07-02 01:59:16.947675+01
b6c37c55-303d-4e66-8f5d-bedff8f735ee	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Maria Albina Correia Sequeira	\N	\N	0	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.0000	t	\N	\N	\N	\N	\N	\N	owner	\N	\N	\N	\N	\N	\N	Portugal	\N	2025-07-02 01:59:16.947675+01	2025-07-02 01:59:16.947675+01
d3ad84ae-c456-4ba7-9300-a78884804e9d	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Vítor Manuel Sebastian Rodrigues	\N	\N	0	vmsebaspt@gmail.com	\N	\N	\N	0.00	0.00	0.00	0.00	0.0000	t	\N	\N	\N	\N	\N	\N	owner	\N	\N	\N	\N	\N	\N	Portugal	\N	2025-07-02 01:59:16.947675+01	2025-07-02 01:59:16.947675+01
497dc00b-2cf8-4368-9353-bdc462acb156	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	António Manuel Caroça Beirão	\N	\N	0	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.0000	t	\N	\N	\N	\N	\N	\N	owner	\N	\N	\N	\N	\N	\N	Portugal	\N	2025-07-02 01:59:16.947675+01	2025-07-02 01:59:16.947675+01
8b790d78-9d4b-4357-a0ba-9e09ee329415	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	João Manuel Fernandes Longo	\N	\N	0	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.0000	t	\N	\N	\N	\N	\N	\N	owner	\N	\N	\N	\N	\N	\N	Portugal	\N	2025-07-02 01:59:16.947675+01	2025-07-02 01:59:16.947675+01
\.


--
-- Data for Name: minute_agenda_items; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.minute_agenda_items (id, minutes_id, building_id, item_number, title, description, discussion, decision, vote_type, votes_in_favor, votes_against, abstentions, is_approved, legal_requirement, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: minutes; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.minutes (id, building_id, convocatoria_id, minute_number, meeting_date, meeting_time, end_time, start_time, location, meeting_location, assembly_type, building_address, building_name, postal_code, president_name, administrator_custom, secretary_name, secretary_custom, conclusions, attendees, total_units_represented, total_percentage_represented, quorum_achieved, agenda_development, votes_record, agreements_reached, legal_validity, signed_date, president_signature, secretary_signature, final_document_url, attendees_count, quorum_percentage, quorum_met, agenda_items, decisions, voting_results, next_meeting_date, attachments, is_approved, approved_at, approved_by_user_id, notes, status, created_at, updated_at) FROM stdin;
2e656e48-8b5b-457f-a83b-661b77d177cd	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	bedf6d4d-40c9-430b-97af-c7f1af2b1aee	28	2025-02-10	17:30	\N	\N	Hall do Prédio	\N	ordinary	Estrada da Circunvalação, nº 1	Condomino Buraca 1	2610-041	João Manuel Fernandes Longo	\N	Cristina Maria Bertolo Gouveia	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	draft	2025-03-17 09:09:19.069683+00	2025-03-17 09:09:19.069683+00
9f20eca5-96de-4b52-9267-c94a93aed2bb	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	651707f1-3658-49f4-b625-2c33f657a749	29	2025-03-17	18:00	\N	\N	Hall do Prédio	\N	extraordinary	Estrada da Circunvalação, nº 1	Condomino Buraca 1	2610-041	Vítor Manuel Sebastian Rodrigues	\N	João Manuel Fernandes Longo	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	draft	2025-03-17 18:12:24.66613+00	2025-03-17 18:12:24.66613+00
776956d1-d3de-49a7-8fcc-67c255e88e35	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	38290ab1-3b3a-4020-9280-0c9003deeac6	30	2025-05-27	19:00	\N	\N	Hall do Prédio	\N	extraordinary	Estrada da Circunvalação, nº 1	Condomino Buraca 1	2610-041	Vítor Manuel Sebastian Rodrigues	\N	João Manuel Fernandes Longo	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	draft	2025-05-19 13:37:43.108+01	2025-06-13 12:56:51.196167+01
\.


--
-- Data for Name: payment_history; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.payment_history (id, transaction_id, member_id, building_id, amount, payment_date, payment_method, reference, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.refresh_tokens (id, token, user_id, device_id, device_name, ip_address, user_agent, expires_at, is_revoked, revoked_at, created_at, updated_at) FROM stdin;
244bd2a3-dcc3-4728-a426-826a6b5db10a	1ba9fe28847bbe1c8f6b5b73f11b688e65dd8a3421cf5ab6b6e00a48e14ddbed	4171cd13-d28b-4237-a86f-f6683a9ad9fb	\N	\N	::1	curl/8.7.1	2025-07-09 00:27:25.563+01	f	\N	2025-07-02 00:27:25.563849+01	2025-07-02 00:27:25.563849+01
b6302d7e-fb9a-4577-a065-978ab5b7281f	518cd4c8e91bdcbe00b5b565e8e259d4eb595b1200bd05967f7b188781f488cb	4171cd13-d28b-4237-a86f-f6683a9ad9fb	\N	\N	::1	curl/8.7.1	2025-07-09 00:30:06.061+01	f	\N	2025-07-02 00:30:06.061996+01	2025-07-02 00:30:06.061996+01
71496a04-84ca-42b3-945d-0e9abd79381c	beda43eae5e4be0119146bf577d4357e7381af24667d1c5628405fc86873152f	4171cd13-d28b-4237-a86f-f6683a9ad9fb	\N	\N	::1	curl/8.7.1	2025-07-09 00:32:11.567+01	f	\N	2025-07-02 00:32:11.567757+01	2025-07-02 00:32:11.567757+01
8f2e8d2e-0385-41f4-9710-ddebd34e7e02	a4ffa4bf8060c33391a78a40248a79f648ff32412e46e5d2977c0bf9f9b9bf7d	4171cd13-d28b-4237-a86f-f6683a9ad9fb	\N	\N	::1	curl/8.7.1	2025-07-09 00:56:04.972+01	f	\N	2025-07-02 00:56:04.972518+01	2025-07-02 00:56:04.972518+01
7e9b0ee1-0779-49d2-ac87-6305a6848afb	cce475fd93928b31ff50b24a9ff191a73745d69da693228d6b599bed20ae7fcf	4171cd13-d28b-4237-a86f-f6683a9ad9fb	\N	\N	::1	curl/8.7.1	2025-07-09 01:05:16.005+01	f	\N	2025-07-02 01:05:16.005723+01	2025-07-02 01:05:16.005723+01
f460e7fd-0c76-4b38-bd07-2b4ff5d91c58	f4a83079cc130560c5c338bf24d4ce763c77c20abab1bc4a61611546b60711b4	fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	\N	\N	::1	curl/8.7.1	2025-07-09 01:15:46.852+01	f	\N	2025-07-02 01:15:46.852414+01	2025-07-02 01:15:46.852414+01
d4b78f37-fad9-4407-898a-f22f061dfa56	90cc49478b796296071c108398a6e5f37da3548ff403e35ea55032ec52fa8f9c	fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	\N	\N	::ffff:127.0.0.1	curl/8.7.1	2025-07-09 01:24:41.656+01	f	\N	2025-07-02 01:24:41.656824+01	2025-07-02 01:24:41.656824+01
e94dbd1d-e84c-4f18-83e4-c5913bc251c7	351191418b55d84c2cb9e7dbcb540a86d064590e9404021efea61ac65522bd67	4171cd13-d28b-4237-a86f-f6683a9ad9fb	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15	2025-07-09 01:28:47.396+01	f	\N	2025-07-02 01:28:47.396632+01	2025-07-02 01:28:47.396632+01
c1a829f1-b99b-421b-aa6b-855866ba4220	00a2033f1ad85fe027a604c0c46e6f0dcbf5484aa4e1e91d7d54199522133269	fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	\N	\N	::1	curl/8.7.1	2025-07-09 01:29:04.56+01	f	\N	2025-07-02 01:29:04.560362+01	2025-07-02 01:29:04.560362+01
3c1f8087-481d-430f-9d19-d03e08388da9	83aec35584ab0d935dd97f578e28ea7803a4bde37d28942345dd4f50b5d4d140	fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	\N	\N	::1	curl/8.7.1	2025-07-09 01:50:45.293+01	f	\N	2025-07-02 01:50:45.293954+01	2025-07-02 01:50:45.293954+01
7111a2ca-aafd-4eb6-a782-fe93fa3441d1	c2775af9ed67d43a5cf36893b02d73776ecbb524aaa294fccabae9cd8cf2c31a	fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	\N	\N	::1	curl/8.7.1	2025-07-09 01:51:02.585+01	f	\N	2025-07-02 01:51:02.585583+01	2025-07-02 01:51:02.585583+01
5ab188bb-ee46-4238-ba14-70ff1b873a60	1b96ab549a170e6229e84a576ecf0986fdb5379c0b3e89a1a5c644ed4b14a1bd	fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	\N	\N	::1	curl/8.7.1	2025-07-09 01:51:22.137+01	f	\N	2025-07-02 01:51:22.13783+01	2025-07-02 01:51:22.13783+01
c80b2531-8557-4593-8a4a-6049f9c39928	1cf8e0d8ecc05c36291d09f30c7234a39b07d9a436e1a2acafc48081bafff4d2	fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	\N	\N	::1	curl/8.7.1	2025-07-09 01:51:31.803+01	f	\N	2025-07-02 01:51:31.803662+01	2025-07-02 01:51:31.803662+01
ded55f17-f143-422f-9e92-49173614aa7a	d45ab642b01e0628c0c1d9671388a4625d53f5186745e20e9070180e4d664d67	fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	\N	\N	::1	curl/8.7.1	2025-07-09 02:25:45.379+01	f	\N	2025-07-02 02:25:45.379765+01	2025-07-02 02:25:45.379765+01
2bec9996-3e9a-4b9e-a690-fde698d7af45	f7ab6e765fc08be7736c9ebf0ead1db530d6241b35e3e63df123cd1b85b6929b	fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	\N	\N	::1	curl/8.7.1	2025-07-09 02:26:16.39+01	f	\N	2025-07-02 02:26:16.390265+01	2025-07-02 02:26:16.390265+01
09af9c23-1a52-4974-8530-fc904dae7f7f	b477a396e8cd0e9effffdd78de3f0a83e129c9f40558ea367d9c3f9b12a3c996	fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	\N	\N	::1	curl/8.7.1	2025-07-09 02:27:36.508+01	f	\N	2025-07-02 02:27:36.508401+01	2025-07-02 02:27:36.508401+01
243deef2-aee6-44a1-bba8-e112d2981ce4	039774496bf486e574865eb766a1b86f24649be8ada5afb6d94cb38c1b149721	fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	\N	\N	::1	curl/8.7.1	2025-07-09 02:34:44.044+01	f	\N	2025-07-02 02:34:44.044323+01	2025-07-02 02:34:44.044323+01
83cf3582-374e-4d02-a6d0-a01fb960076a	f820d819658c4c948f75ee9b1b27bf387031d304d0d6bb7cceb01d176bca40a2	fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	\N	\N	::1	curl/8.7.1	2025-07-09 02:51:47.404+01	f	\N	2025-07-02 02:51:47.404807+01	2025-07-02 02:51:47.404807+01
ee65417f-08bd-43e1-848c-4ab55be6d8e8	fc6c71953d71cf4ece2d87e7f61a1df6e17d9ee9001d93a3cb243292cc269e92	4171cd13-d28b-4237-a86f-f6683a9ad9fb	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15	2025-07-09 02:52:45.744+01	f	\N	2025-07-02 02:52:45.744942+01	2025-07-02 02:52:45.744942+01
0e5eb263-0373-4e5c-b926-3cb9121abc45	9f53ce44d6e3aa0e58f009c4f47061706c1de191d20d77031da721bce5d63ab2	4171cd13-d28b-4237-a86f-f6683a9ad9fb	\N	\N	::1	axios/1.10.0	2025-07-09 11:57:06.283+01	f	\N	2025-07-02 11:57:06.284283+01	2025-07-02 11:57:06.284283+01
3fadd9d8-bcf5-4e56-978d-db4cc0406663	2aabaa544503bb7338fb14e867d95c7ab3fbc875dc4b745a44404a6534f67f73	4171cd13-d28b-4237-a86f-f6683a9ad9fb	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15	2025-07-09 12:16:26.551+01	t	2025-07-02 12:32:46.23+01	2025-07-02 12:16:26.551557+01	2025-07-02 12:16:26.551557+01
90bc3f80-83f4-4842-96fe-2b7517951313	954dfd133fa116f238aa4bb4e0380e6b24d4eb7e05d9baf045ef304da731cdd4	fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15	2025-07-09 12:33:11.851+01	f	\N	2025-07-02 12:33:11.851562+01	2025-07-02 12:33:11.851562+01
8b9166f3-8883-4993-925e-f9bb72cddae1	cedc8c385edfcd0760c6bfb6661536d46a68aca18d07c66018598836f54c9b24	cdf5072e-4e10-4027-a6c4-f617e89ed592	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	2025-09-16 10:59:07.426+01	f	\N	2025-09-09 10:59:07.426723+01	2025-09-09 10:59:07.426723+01
46f7accf-1648-49d6-a194-8584a15b0de0	166e7aa8f76995833050ebe1866c14c69f1b4b43e21283082ef3b8a99d8db950	cdf5072e-4e10-4027-a6c4-f617e89ed592	\N	\N	::1	curl/8.7.1	2025-09-16 12:23:40.932+01	f	\N	2025-09-09 12:23:40.933141+01	2025-09-09 12:23:40.933141+01
b9856ae8-ffee-4474-b4ea-24dd8c355525	dfdf1148294a6b19f1da8ee468d13c9f37b8079731fbc54772474c4a73e4463e	cdf5072e-4e10-4027-a6c4-f617e89ed592	\N	\N	::1	curl/8.7.1	2025-09-16 12:57:55.276+01	f	\N	2025-09-09 12:57:55.276447+01	2025-09-09 12:57:55.276447+01
8d103061-ab19-4a87-bb14-c9315c6b83fb	f0baca9e0a69811c0860da98fc15ed50a96ee1a91fdd997f0dc8f16902e20daa	cdf5072e-4e10-4027-a6c4-f617e89ed592	\N	\N	::1	curl/8.7.1	2025-09-16 17:21:13.176+01	f	\N	2025-09-09 17:21:13.177141+01	2025-09-09 17:21:13.177141+01
b8abc81d-a70a-4fea-b573-7b823ecd04f6	45c79c5429b7af474bf2c6e2ab87394ad01a2b37e6b6f4868e374583271fc285	cdf5072e-4e10-4027-a6c4-f617e89ed592	\N	\N	::1	curl/8.7.1	2025-09-16 17:45:12.949+01	f	\N	2025-09-09 17:45:12.949607+01	2025-09-09 17:45:12.949607+01
437b0a1f-71a0-4938-bf2c-e337d6673750	0bba2bdfb508261ef7fb8bdcb6f11f9916cfdeff211d7e34b415da6d17dc15aa	cdf5072e-4e10-4027-a6c4-f617e89ed592	\N	\N	::1	curl/8.7.1	2025-09-16 17:46:13.188+01	f	\N	2025-09-09 17:46:13.189137+01	2025-09-09 17:46:13.189137+01
da0aaefc-f488-4834-b980-77aa02d6ac39	7725c3dc75b8727d4698581d0baa657f73687ad9ef76a8b9d3cd004fd09838db	cdf5072e-4e10-4027-a6c4-f617e89ed592	\N	\N	::1	curl/8.7.1	2025-09-16 17:50:13.461+01	f	\N	2025-09-09 17:50:13.461974+01	2025-09-09 17:50:13.461974+01
ce3007b5-5633-4541-ac46-61588d2275d3	e59585abb29c48cbda12bc734dc7717354f3ed80e84e63b19440eccc4ff53742	cdf5072e-4e10-4027-a6c4-f617e89ed592	\N	\N	::1	curl/8.7.1	2025-09-16 19:30:46.322+01	f	\N	2025-09-09 19:30:46.322823+01	2025-09-09 19:30:46.322823+01
82a9aa7b-ea59-4d08-b68b-d9c2f84b963f	cc4062df34f257b463eb77ecb24c7f0b84d2c049fdc87dcffed1e021810c935b	4171cd13-d28b-4237-a86f-f6683a9ad9fb	\N	\N	::1	curl/8.7.1	2025-09-16 22:35:58.371+01	f	\N	2025-09-09 22:35:58.372144+01	2025-09-09 22:35:58.372144+01
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
1	9cf64a8a-8570-4f16-94a5-dd48c694324c	\N	Reparar puerta principal	La puerta principal del edificio necesita reparación urgente. El mecanismo de cierre está dañado.	22135ace-526d-4fea-b86e-843b51d5a279	\N	2025-09-16	pending	high	maintenance	\N	2025-09-09 23:38:13.722+01	2025-09-09 23:38:13.722+01	\N	\N	\N
2	9cf64a8a-8570-4f16-94a5-dd48c694324c	\N	Limpieza de áreas comunes	Programar limpieza profunda de pasillos y escaleras	dc5eb03f-d0f6-4ab4-9500-dd934b28e529	\N	2025-09-12	in_progress	medium	cleaning	\N	2025-09-09 23:38:13.722+01	2025-09-09 23:38:13.722+01	\N	\N	\N
3	9cf64a8a-8570-4f16-94a5-dd48c694324c	\N	Revisión sistema eléctrico	Contratar electricista para revisión anual del sistema eléctrico del edificio	0ea5a82f-0a2a-420c-b944-6d064e9597ed	\N	2025-09-23	pending	medium	maintenance	\N	2025-09-09 23:38:13.722+01	2025-09-09 23:38:13.722+01	\N	\N	\N
4	9cf64a8a-8570-4f16-94a5-dd48c694324c	\N	Pintura de fachada	Solicitar presupuestos para pintura de la fachada principal	22135ace-526d-4fea-b86e-843b51d5a279	\N	2025-10-09	pending	low	renovation	\N	2025-09-09 23:38:13.722+01	2025-09-09 23:38:13.722+01	\N	\N	\N
5	9cf64a8a-8570-4f16-94a5-dd48c694324c	\N	Actualizar reglamento interno	Revisar y actualizar el reglamento interno del condominio	dc5eb03f-d0f6-4ab4-9500-dd934b28e529	\N	2025-09-04	completed	low	administrative	\N	2025-08-25 23:38:13.722+01	2025-09-09 23:38:13.722+01	2025-09-07 23:38:13.722+01	\N	\N
\.


--
-- Data for Name: transaction_categories; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.transaction_categories (id, building_id, name, description, type, transaction_type, is_active, color, budget_amount, parent_category_id, sort_order, created_at, updated_at) FROM stdin;
a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e01	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Quotas Mensais	\N	income	\N	t	\N	\N	\N	0	2025-07-02 01:49:09.914393+01	2025-07-02 01:49:09.914393+01
a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e02	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Manutenção	\N	expense	\N	t	\N	\N	\N	0	2025-07-02 01:49:09.914393+01	2025-07-02 01:49:09.914393+01
a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e03	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Limpeza	\N	expense	\N	t	\N	\N	\N	0	2025-07-02 01:49:09.914393+01	2025-07-02 01:49:09.914393+01
a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e04	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Electricidade	\N	expense	\N	t	\N	\N	\N	0	2025-07-02 01:49:09.914393+01	2025-07-02 01:49:09.914393+01
a1c5c5c5-5e5e-4e4e-8e8e-8e8e8e8e8e05	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Água	\N	expense	\N	t	\N	\N	\N	0	2025-07-02 01:49:09.914393+01	2025-07-02 01:49:09.914393+01
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.transactions (id, building_id, financial_period_id, period_id, category_id, transaction_date, date, transaction_type, type, description, amount, fraction_id, member_id, payment_method, reference_number, notes, admin_notes, receipt_url, is_recurring, recurring_frequency, recurring_months, year, is_fee_payment, is_confirmed, last_modified_by, tags, created_by_user_id, approved_by_user_id, approved_at, created_at, updated_at, status, due_date, payment_date, payment_status) FROM stdin;
35ae73b3-fff0-4fe1-b87a-3a3c6f54632e	9cf64a8a-8570-4f16-94a5-dd48c694324c	\N	\N	\N	2025-07-01	\N	income	\N	Pagamento quota julho	50.00	\N	22135ace-526d-4fea-b86e-843b51d5a279	transfer	\N	\N	\N	\N	f	\N	\N	2025	f	t	\N	\N	\N	\N	\N	2025-07-02 00:45:58.085473+01	2025-07-02 00:45:58.085473+01	pending	\N	\N	\N
cbc30811-8181-4e2f-8d6a-89c5187f9bca	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	\N	\N	2025-01-13	\N	income	\N	TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN	26.13	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2025	f	t	\N	\N	\N	\N	\N	2025-07-02 02:20:22.01452+01	2025-07-02 02:20:22.01452+01	pending	\N	\N	\N
45af40e5-22f8-4bbe-b1aa-551820f5b369	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	\N	\N	2025-01-08	\N	expense	\N	MANUTENCAO DE CONTA VALOR NEGOCIOS 2024	7.99	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2025	f	t	\N	\N	\N	\N	\N	2025-07-02 02:20:22.01452+01	2025-07-02 02:20:22.01452+01	pending	\N	\N	\N
87d15110-e0bc-422a-b1b6-4f119199180a	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	\N	\N	2025-01-08	\N	expense	\N	IMPOSTO DE SELO DEZ 2024	0.32	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2025	f	t	\N	\N	\N	\N	\N	2025-07-02 02:20:22.01452+01	2025-07-02 02:20:22.01452+01	pending	\N	\N	\N
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
cdf5072e-4e10-4027-a6c4-f617e89ed592	test@admin.com	$2b$10$V7bY9ylnM4K46NZcClTrkORrExaO980QuKhFJms/np4VFwXfxxRUa	Usuario Test	\N	super_admin	{}	t	t	\N	\N	\N	0	\N	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	2025-09-09 10:58:32.448715+01	2025-09-09 19:30:46.3116+01	2025-09-09 19:30:46.308+01	\N
4171cd13-d28b-4237-a86f-f6683a9ad9fb	admin@example.com	$2b$10$ThRWtZ94.fe6Q4NW6TikseuQ.fXfMCg8I7ynEug.twiq1h2vzKKt6	Administrador	\N	super_admin	{}	t	t	\N	\N	\N	0	\N	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	2025-07-01 23:51:30.465493+01	2025-09-09 22:35:58.370322+01	2025-09-09 22:35:58.368+01	\N
fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	admin@migestpro.com	$2b$10$C/1VIawyjuI9TsZ1OwwwdO2E.ccHknYR5gVmScVw86ymWuBuVbWc2	Administrador	\N	admin	{}	t	f	\N	\N	\N	0	\N	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	2025-07-02 01:15:41.890527+01	2025-09-09 12:05:59.019913+01	2025-07-02 12:33:11.843+01	\N
\.


--
-- Data for Name: voting_results; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.voting_results (id, minute_agenda_item_id, total_votes, votes_in_favor, votes_against, abstentions, quorum_percentage, is_approved, created_at, updated_at) FROM stdin;
\.


--
-- Name: document_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: mini-server
--

SELECT pg_catalog.setval('public.document_categories_id_seq', 1, false);


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

SELECT pg_catalog.setval('public.knex_migrations_id_seq', 4, true);


--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE SET; Schema: public; Owner: mini-server
--

SELECT pg_catalog.setval('public.knex_migrations_lock_index_seq', 1, true);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: mini-server
--

SELECT pg_catalog.setval('public.tasks_id_seq', 5, true);


--
-- Name: arrears_config arrears_config_building_id_unique; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.arrears_config
    ADD CONSTRAINT arrears_config_building_id_unique UNIQUE (building_id);


--
-- Name: arrears_config arrears_config_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.arrears_config
    ADD CONSTRAINT arrears_config_pkey PRIMARY KEY (id);


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
-- Name: payment_history payment_history_pkey; Type: CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.payment_history
    ADD CONSTRAINT payment_history_pkey PRIMARY KEY (id);


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
-- Name: idx_arrears_member_status; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX idx_arrears_member_status ON public.arrears USING btree (member_id, status);


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
-- Name: idx_transactions_status_due_date; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX idx_transactions_status_due_date ON public.transactions USING btree (status, due_date) WHERE ((status)::text = ANY ((ARRAY['pending'::character varying, 'overdue'::character varying])::text[]));


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
-- Name: payment_history_building_id_payment_date_index; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX payment_history_building_id_payment_date_index ON public.payment_history USING btree (building_id, payment_date);


--
-- Name: payment_history_member_id_payment_date_index; Type: INDEX; Schema: public; Owner: mini-server
--

CREATE INDEX payment_history_member_id_payment_date_index ON public.payment_history USING btree (member_id, payment_date);


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
-- Name: arrears_config arrears_config_building_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.arrears_config
    ADD CONSTRAINT arrears_config_building_id_foreign FOREIGN KEY (building_id) REFERENCES public.buildings(id);


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
-- Name: payment_history payment_history_building_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.payment_history
    ADD CONSTRAINT payment_history_building_id_foreign FOREIGN KEY (building_id) REFERENCES public.buildings(id);


--
-- Name: payment_history payment_history_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.payment_history
    ADD CONSTRAINT payment_history_member_id_foreign FOREIGN KEY (member_id) REFERENCES public.members(id);


--
-- Name: payment_history payment_history_transaction_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: mini-server
--

ALTER TABLE ONLY public.payment_history
    ADD CONSTRAINT payment_history_transaction_id_foreign FOREIGN KEY (transaction_id) REFERENCES public.transactions(id);


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
-- PostgreSQL database dump complete
--

