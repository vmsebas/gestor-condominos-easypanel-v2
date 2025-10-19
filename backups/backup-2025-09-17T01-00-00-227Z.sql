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
9cf64a8a-8570-4f16-94a5-dd48c694324c	Edificio Principal	Rua das Flores, 123	1200-001	Lisboa	10	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-02 00:44:57.216+01	2025-07-02 00:44:57.216+01
fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Condomino Buraca 1	Estrada da Circunvalação, nº 1	2610-000	Amadora	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-02 01:49:09.914+01	2025-07-02 01:49:09.914+01
\.


--
-- Data for Name: convocatorias; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.convocatorias (id, building_id, building_name, building_address, postal_code, city, assembly_number, assembly_type, meeting_type, title, date, meeting_date, "time", location, meeting_location, second_call_enabled, second_call_time, second_call_date, administrator, secretary, legal_reference, minutes_created, agenda_items, convocation_date, legal_notice_period, delivery_method, attached_documents, legal_validation, quorum_requirements, status, meeting_subject, president_name, president_email, secretary_name, secretary_email, administrator_name, administrator_email, notification_sent_at, published_at, published_by_user_id, notes, created_at, updated_at) FROM stdin;
bedf6d4d-40c9-430b-97af-c7f1af2b1aee	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Condomino Buraca 1	Estrada da Circunvalação, nº 1	2610-041	Amadora	\N	ordinary	\N	\N	2025-02-10	\N	17:30	Hall do Prédio	\N	t	\N	\N	João Manuel Fernandes Longo	\N	\N	f	null	\N	\N	\N	\N	\N	\N	draft	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-02 01:59:16.947+01	2025-07-02 01:59:16.947+01
651707f1-3658-49f4-b625-2c33f657a749	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Condomino Buraca 1	Estrada da Circunvalação, nº 1	2610-041	Amadora	\N	extraordinary	\N	\N	2025-03-17	\N	18:00	Hall do Prédio	\N	t	\N	\N	Vítor Manuel Sebastian Rodrigues	\N	\N	f	null	\N	\N	\N	\N	\N	\N	draft	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-02 01:59:16.947+01	2025-07-02 01:59:16.947+01
38290ab1-3b3a-4020-9280-0c9003deeac6	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Condomino Buraca 1	Estrada da Circunvalação, nº 1	2610-041	Amadora	30	extraordinary	\N	\N	2025-05-28	\N	18:30	Hall do Prédio	\N	t	\N	\N	Vitor Manuel Sebastian Rodrigues	\N	\N	f	null	\N	\N	\N	\N	\N	\N	draft	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-02 02:18:21.014+01	2025-07-02 02:18:21.014+01
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
22135ace-526d-4fea-b86e-843b51d5a279	9cf64a8a-8570-4f16-94a5-dd48c694324c	João Silva	1A	A	10	joao.silva@email.com	912345678	\N	\N	0.00	0.00	0.00	0.00	0.0000	t	\N	\N	\N	\N	\N	\N	owner	\N	\N	\N	\N	\N	\N	Portugal	\N	2025-07-02 00:45:26.351+01	2025-07-02 00:45:26.351+01
dc5eb03f-d0f6-4ab4-9500-dd934b28e529	9cf64a8a-8570-4f16-94a5-dd48c694324c	Maria Santos	2B	B	15	maria.santos@email.com	913456789	\N	\N	0.00	0.00	0.00	0.00	0.0000	t	\N	\N	\N	\N	\N	\N	owner	\N	\N	\N	\N	\N	\N	Portugal	\N	2025-07-02 00:45:26.351+01	2025-07-02 00:45:26.351+01
0ea5a82f-0a2a-420c-b944-6d064e9597ed	9cf64a8a-8570-4f16-94a5-dd48c694324c	Pedro Costa	3C	C	12	pedro.costa@email.com	914567890	\N	\N	0.00	0.00	0.00	0.00	0.0000	t	\N	\N	\N	\N	\N	\N	owner	\N	\N	\N	\N	\N	\N	Portugal	\N	2025-07-02 00:45:26.351+01	2025-07-02 00:45:26.351+01
1dfa75cd-fafd-43cd-a0f7-038c2ad76812	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Cristina Maria Bertolo Gouveia	\N	\N	0	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.0000	t	\N	\N	\N	\N	\N	\N	owner	\N	\N	\N	\N	\N	\N	Portugal	\N	2025-07-02 01:59:16.947+01	2025-07-02 01:59:16.947+01
6a62625e-1264-4588-b6bf-a7a8ca0771bd	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	José Manuel Costa Ricardo	\N	\N	0	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.0000	t	\N	\N	\N	\N	\N	\N	owner	\N	\N	\N	\N	\N	\N	Portugal	\N	2025-07-02 01:59:16.947+01	2025-07-02 01:59:16.947+01
b6c37c55-303d-4e66-8f5d-bedff8f735ee	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Maria Albina Correia Sequeira	\N	\N	0	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.0000	t	\N	\N	\N	\N	\N	\N	owner	\N	\N	\N	\N	\N	\N	Portugal	\N	2025-07-02 01:59:16.947+01	2025-07-02 01:59:16.947+01
d3ad84ae-c456-4ba7-9300-a78884804e9d	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	Vítor Manuel Sebastian Rodrigues	\N	\N	0	vmsebaspt@gmail.com	\N	\N	\N	0.00	0.00	0.00	0.00	0.0000	t	\N	\N	\N	\N	\N	\N	owner	\N	\N	\N	\N	\N	\N	Portugal	\N	2025-07-02 01:59:16.947+01	2025-07-02 01:59:16.947+01
497dc00b-2cf8-4368-9353-bdc462acb156	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	António Manuel Caroça Beirão	\N	\N	0	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.0000	t	\N	\N	\N	\N	\N	\N	owner	\N	\N	\N	\N	\N	\N	Portugal	\N	2025-07-02 01:59:16.947+01	2025-07-02 01:59:16.947+01
8b790d78-9d4b-4357-a0ba-9e09ee329415	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	João Manuel Fernandes Longo	\N	\N	0	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.0000	t	\N	\N	\N	\N	\N	\N	owner	\N	\N	\N	\N	\N	\N	Portugal	\N	2025-07-02 01:59:16.947+01	2025-07-02 01:59:16.947+01
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
2e656e48-8b5b-457f-a83b-661b77d177cd	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	bedf6d4d-40c9-430b-97af-c7f1af2b1aee	28	2025-02-10	17:30	\N	\N	Hall do Prédio	\N	ordinary	Estrada da Circunvalação, nº 1	Condomino Buraca 1	2610-041	João Manuel Fernandes Longo	\N	Cristina Maria Bertolo Gouveia	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	draft	2025-03-17 09:09:19.069+00	2025-03-17 09:09:19.069+00
9f20eca5-96de-4b52-9267-c94a93aed2bb	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	651707f1-3658-49f4-b625-2c33f657a749	29	2025-03-17	18:00	\N	\N	Hall do Prédio	\N	extraordinary	Estrada da Circunvalação, nº 1	Condomino Buraca 1	2610-041	Vítor Manuel Sebastian Rodrigues	\N	João Manuel Fernandes Longo	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	draft	2025-03-17 18:12:24.666+00	2025-03-17 18:12:24.666+00
776956d1-d3de-49a7-8fcc-67c255e88e35	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	38290ab1-3b3a-4020-9280-0c9003deeac6	30	2025-05-26	19:00	\N	\N	Hall do Prédio	\N	extraordinary	Estrada da Circunvalação, nº 1	Condomino Buraca 1	2610-041	Vítor Manuel Sebastian Rodrigues	\N	João Manuel Fernandes Longo	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	draft	2025-05-19 13:37:43.108+01	2025-06-13 12:56:51.196+01
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
f48344f0-8240-49f7-af76-19d22eb3de2c	6b8e55fda152d55c870578d32249665f4082dd64fa836b76729616efd2ebf25c	fef78e39-d31f-41cd-a231-535ccf05bead	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	2025-09-23 20:31:19.345+01	f	\N	2025-09-16 20:31:19.345752+01	2025-09-16 20:31:19.345752+01
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
\.


--
-- Data for Name: transaction_categories; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.transaction_categories (id, building_id, name, description, type, transaction_type, is_active, color, budget_amount, parent_category_id, sort_order, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: mini-server
--

COPY public.transactions (id, building_id, financial_period_id, period_id, category_id, transaction_date, date, transaction_type, type, description, amount, fraction_id, member_id, payment_method, reference_number, notes, admin_notes, receipt_url, is_recurring, recurring_frequency, recurring_months, year, is_fee_payment, is_confirmed, last_modified_by, tags, created_by_user_id, approved_by_user_id, approved_at, created_at, updated_at, status, due_date, payment_date, payment_status) FROM stdin;
35ae73b3-fff0-4fe1-b87a-3a3c6f54632e	9cf64a8a-8570-4f16-94a5-dd48c694324c	\N	\N	\N	2025-06-30	\N	income	\N	Pagamento quota julho	50.00	\N	22135ace-526d-4fea-b86e-843b51d5a279	transfer	\N	\N	\N	\N	f	\N	\N	2025	f	t	\N	\N	\N	\N	\N	2025-07-02 00:45:58.085+01	2025-07-02 00:45:58.085+01	pending	\N	\N	\N
cbc30811-8181-4e2f-8d6a-89c5187f9bca	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	\N	\N	2025-01-13	\N	income	\N	TRF CR INTRAB 492 DE VITOR MANUEL SEBASTIAN	26.13	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2025	f	t	\N	\N	\N	\N	\N	2025-07-02 02:20:22.014+01	2025-07-02 02:20:22.014+01	pending	\N	\N	\N
45af40e5-22f8-4bbe-b1aa-551820f5b369	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	\N	\N	2025-01-08	\N	expense	\N	MANUTENCAO DE CONTA VALOR NEGOCIOS 2024	7.99	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2025	f	t	\N	\N	\N	\N	\N	2025-07-02 02:20:22.014+01	2025-07-02 02:20:22.014+01	pending	\N	\N	\N
87d15110-e0bc-422a-b1b6-4f119199180a	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	\N	\N	2025-01-08	\N	expense	\N	IMPOSTO DE SELO DEZ 2024	0.32	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2025	f	t	\N	\N	\N	\N	\N	2025-07-02 02:20:22.014+01	2025-07-02 02:20:22.014+01	pending	\N	\N	\N
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
4171cd13-d28b-4237-a86f-f6683a9ad9fb	admin@example.com	$2b$10$5JytB8TVHs3l828WPONDFOmWRzDDbaj3COWhpi0HeSZJvCxdEkCb.	Administrador	\N	super_admin	{}	t	t	\N	\N	\N	0	\N	9cf64a8a-8570-4f16-94a5-dd48c694324c	\N	2025-07-01 23:51:30.465+01	2025-07-02 12:16:26.548+01	2025-07-02 12:16:26.548+01	\N
fe2c6b79-8fd0-4ab0-a965-a687e3cf2d0e	admin@migestpro.com	$2b$10$C/1VIawyjuI9TsZ1OwwwdO2E.ccHknYR5gVmScVw86ymWuBuVbWc2	Administrador	\N	admin	{}	t	f	\N	\N	\N	0	\N	fb0d83d3-fe04-47cb-ba48-f95538a2a7fc	\N	2025-07-02 01:15:41.89+01	2025-07-02 12:33:11.844+01	2025-07-02 12:33:11.843+01	\N
fef78e39-d31f-41cd-a231-535ccf05bead	admin@condomino.com	$2b$10$hL3Y.u7GUhwtEJuibxJek.web87548ToZT6aNf/KwD1kSi20wz0mC	Admin Usuario	\N	admin	{}	t	t	\N	\N	\N	0	\N	9cf64a8a-8570-4f16-94a5-dd48c694324c	\N	2025-09-16 20:26:02.211916+01	2025-09-16 20:31:19.334583+01	2025-09-16 20:31:19.324+01	\N
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

