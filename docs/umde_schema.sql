--
-- PostgreSQL database dump
--

\restrict KV9eowf2SDd60oajwbC96zPeaSGJfXvdh909vZDO4eDdkUHge0ilM5SgJjzDkPE

-- Dumped from database version 15.18 (Debian 15.18-1.pgdg13+1)
-- Dumped by pg_dump version 15.18 (Debian 15.18-1.pgdg13+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: trips; Type: TABLE; Schema: public; Owner: umde_user
--

CREATE TABLE public.trips (
    id integer NOT NULL,
    pickup_datetime timestamp without time zone,
    dropoff_datetime timestamp without time zone,
    pu_location_id integer,
    do_location_id integer,
    trip_distance double precision,
    fare_amount double precision,
    total_amount double precision,
    payment_type integer,
    rate_code_id integer,
    duration_mins double precision,
    trip_speed double precision,
    fare_per_mile double precision,
    time_of_day character varying(20)
);


ALTER TABLE public.trips OWNER TO umde_user;

--
-- Name: trips_id_seq; Type: SEQUENCE; Schema: public; Owner: umde_user
--

CREATE SEQUENCE public.trips_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.trips_id_seq OWNER TO umde_user;

--
-- Name: trips_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: umde_user
--

ALTER SEQUENCE public.trips_id_seq OWNED BY public.trips.id;


--
-- Name: zones; Type: TABLE; Schema: public; Owner: umde_user
--

CREATE TABLE public.zones (
    location_id integer NOT NULL,
    borough character varying(50),
    zone character varying(100),
    service_zone character varying(50)
);


ALTER TABLE public.zones OWNER TO umde_user;

--
-- Name: trips id; Type: DEFAULT; Schema: public; Owner: umde_user
--

ALTER TABLE ONLY public.trips ALTER COLUMN id SET DEFAULT nextval('public.trips_id_seq'::regclass);


--
-- Name: trips trips_pkey; Type: CONSTRAINT; Schema: public; Owner: umde_user
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_pkey PRIMARY KEY (id);


--
-- Name: zones zones_pkey; Type: CONSTRAINT; Schema: public; Owner: umde_user
--

ALTER TABLE ONLY public.zones
    ADD CONSTRAINT zones_pkey PRIMARY KEY (location_id);


--
-- Name: idx_do_location; Type: INDEX; Schema: public; Owner: umde_user
--

CREATE INDEX idx_do_location ON public.trips USING btree (do_location_id);


--
-- Name: idx_fare_amount; Type: INDEX; Schema: public; Owner: umde_user
--

CREATE INDEX idx_fare_amount ON public.trips USING btree (fare_amount);


--
-- Name: idx_pickup_datetime; Type: INDEX; Schema: public; Owner: umde_user
--

CREATE INDEX idx_pickup_datetime ON public.trips USING btree (pickup_datetime);


--
-- Name: idx_pu_location; Type: INDEX; Schema: public; Owner: umde_user
--

CREATE INDEX idx_pu_location ON public.trips USING btree (pu_location_id);


--
-- Name: idx_time_of_day; Type: INDEX; Schema: public; Owner: umde_user
--

CREATE INDEX idx_time_of_day ON public.trips USING btree (time_of_day);


--
-- Name: trips trips_do_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: umde_user
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_do_location_id_fkey FOREIGN KEY (do_location_id) REFERENCES public.zones(location_id);


--
-- Name: trips trips_pu_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: umde_user
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_pu_location_id_fkey FOREIGN KEY (pu_location_id) REFERENCES public.zones(location_id);


--
-- PostgreSQL database dump complete
--

\unrestrict KV9eowf2SDd60oajwbC96zPeaSGJfXvdh909vZDO4eDdkUHge0ilM5SgJjzDkPE

