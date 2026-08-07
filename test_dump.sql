--
-- PostgreSQL database dump
--

\restrict 6OkbS5WHvNf2nvCzPACltfTORpQklQMAc1WcUu5muRHff68YwPrxj2SZXmZ30q2

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.4

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: booking_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.booking_status AS ENUM (
    'scheduled',
    'completed',
    'cancelled',
    'no_show'
);


ALTER TYPE public.booking_status OWNER TO postgres;

--
-- Name: cal_booking_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.cal_booking_status AS ENUM (
    'confirmed',
    'rejected',
    'cancellation_failed',
    'cancelled_by_student',
    'completed',
    'no_show'
);


ALTER TYPE public.cal_booking_status OWNER TO postgres;

--
-- Name: enrollment_source; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enrollment_source AS ENUM (
    'payment_flow',
    'admin_direct'
);


ALTER TYPE public.enrollment_source OWNER TO postgres;

--
-- Name: enrollment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enrollment_status AS ENUM (
    'active',
    'expired',
    'cancelled',
    'pending'
);


ALTER TYPE public.enrollment_status OWNER TO postgres;

--
-- Name: meeting_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.meeting_type AS ENUM (
    'monthly_course',
    'workshop_live',
    'program_exclusive',
    'individual_session'
);


ALTER TYPE public.meeting_type OWNER TO postgres;

--
-- Name: order_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.order_status AS ENUM (
    'pending_payment',
    'paid',
    'cancelled',
    'refunded'
);


ALTER TYPE public.order_status OWNER TO postgres;

--
-- Name: payment_method; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_method AS ENUM (
    'mercadopago',
    'paypal',
    'bank_transfer',
    'western_union'
);


ALTER TYPE public.payment_method OWNER TO postgres;

--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'cancelled',
    'refunded',
    'awaiting_approval'
);


ALTER TYPE public.payment_status OWNER TO postgres;

--
-- Name: product_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.product_type AS ENUM (
    'course',
    'workshop',
    'program'
);


ALTER TYPE public.product_type OWNER TO postgres;

--
-- Name: submission_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.submission_status AS ENUM (
    'pending_review',
    'approved',
    'failed',
    'recovery_pending'
);


ALTER TYPE public.submission_status OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'student',
    'admin'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- Name: fn_clerk_user_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_clerk_user_id() RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT COALESCE(auth.jwt() ->> 'sub', '');
$$;


ALTER FUNCTION public.fn_clerk_user_id() OWNER TO postgres;

--
-- Name: fn_decrement_session_for_booking(text, integer, text, timestamp with time zone, integer, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_decrement_session_for_booking(p_student_email text, p_cal_booking_id integer, p_cal_booking_uid text, p_scheduled_at timestamp with time zone, p_duration_minutes integer DEFAULT 60, p_raw_payload jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  -- Declaración de variables internas
  v_profile_id  TEXT;   -- Guardará el ID de Clerk de la alumna si existe.
  v_enrollment  RECORD; -- Estructura genérica para retener la fila entera de la matrícula afectada.
BEGIN
  -- ──────────────────────────────────────────────────────────
  -- PASO 1: Control de Idempotencia (Evitar duplicados por reintentos de red)
  -- ──────────────────────────────────────────────────────────
  -- Si Cal.com mandó el mismo webhook dos veces por un micro-corte de red,
  -- validamos si el 'cal_booking_id' ya existe en nuestro historial.
  IF EXISTS (
    SELECT 1 FROM public.historial_reservas
    WHERE cal_booking_id = p_cal_booking_id
  ) THEN
    -- Si ya existe, construimos en caliente un objeto JSON con el resultado anterior
    -- y cortamos la ejecución inmediatamente con RETURN. No tocamos los contadores de nuevo.
    SELECT jsonb_build_object(
      'success',     status = 'confirmed', -- Da true si quedó confirmada, false si no.
      'idempotent',  true,                 -- Bandera informativa para Next.js.
      'status',      status
    ) FROM public.historial_reservas
    WHERE cal_booking_id = p_cal_booking_id
    LIMIT 1
    INTO v_enrollment; -- Usamos temporalmente esta variable para guardar el JSONB construido.
 
    RETURN v_enrollment; -- Devolvemos la respuesta e interrumpimos el flujo aquí.
  END IF;
 
  -- ──────────────────────────────────────────────────────────
  -- PASO 2: Resolver identidad (Cruzar Email con el ID de Clerk)
  -- ──────────────────────────────────────────────────────────
  -- Cal.com solo nos da el email de quien agendó. Buscamos a quién le pertenece en 'profiles'.
  SELECT id INTO v_profile_id
  FROM public.profiles
  WHERE email = p_student_email;
 
  -- CONTROL DE SEGURIDAD: Si no encontramos a nadie con ese email en la plataforma
  IF v_profile_id IS NULL THEN
    -- Dejamos registro de auditoría en el historial marcándolo como rechazado por falta de alumno
    INSERT INTO public.historial_reservas (
      cal_booking_id, cal_booking_uid, student_email,
      scheduled_at, duration_minutes, status, rejection_reason, raw_payload
    ) VALUES (
      p_cal_booking_id, p_cal_booking_uid, p_student_email,
      p_scheduled_at, p_duration_minutes,
      'rejected', 'student_not_found', p_raw_payload
    );
 
    -- Le informamos a Next.js que falló porque la alumna no está registrada
    RETURN jsonb_build_object(
      'success', false,
      'reason',  'student_not_found'
    );
  END IF;
 
  -- ──────────────────────────────────────────────────────────
  -- PASO 3: Control de Concurrencia y Búsqueda de Créditos
  -- ──────────────────────────────────────────────────────────
  -- Buscamos una matrícula que cumpla: ser de la alumna, estar activa, no estar vencida,
  -- que tenga sesiones contratadas (sessions_total > 0) y que le queden créditos disponibles.
  --
  -- CRÍTICO: El comando 'FOR UPDATE' le pone un candado físico a esta fila en el disco duro.
  -- Si la alumna le da click al botón de agendar dos veces a la velocidad de la luz,
  -- el segundo proceso se queda congelado esperando que este primero termine. Evita saldo negativo.
  SELECT *
  INTO v_enrollment
  FROM public.enrollments
  WHERE student_id    = v_profile_id
    AND status        = 'active'
    AND expires_at    > NOW()
    AND sessions_total > 0
    AND sessions_used < sessions_total
  ORDER BY expires_at ASC  -- Si tiene dos matrículas activas, desgastamos primero la que vence más rápido.
  LIMIT 1
  FOR UPDATE;              -- ← Candado anti Race-Conditions.
 
  -- ──────────────────────────────────────────────────────────
  -- PASO 4: Rechazo por Falta de Créditos/Sesiones
  -- ──────────────────────────────────────────────────────────
  -- 'NOT FOUND' es una variable interna de PL/pgSQL que se pone en TRUE si el SELECT anterior dio vacío.
  IF NOT FOUND THEN
    -- Registramos el intento fallido en el historial de reservas como RECHAZADO
    INSERT INTO public.historial_reservas (
      cal_booking_id, cal_booking_uid,
      student_id, student_email,
      scheduled_at, duration_minutes,
      status, rejection_reason, raw_payload
    ) VALUES (
      p_cal_booking_id, p_cal_booking_uid,
      v_profile_id, p_student_email,
      p_scheduled_at, p_duration_minutes,
      'rejected', 'no_sessions_available', p_raw_payload
    );
 
    -- Le avisamos a Next.js para que use su API y cancele el turno automáticamente en Cal.com
    RETURN jsonb_build_object(
      'success', false,
      'reason',  'no_sessions_available'
    );
  END IF;
 
  -- ──────────────────────────────────────────────────────────
  -- PASO 5: Descuento Atómico y Éxito
  -- ──────────────────────────────────────────────────────────
  -- Si pasamos los filtros, sumamos 1 a las sesiones usadas de forma aislada y segura
  UPDATE public.enrollments
  SET sessions_used = sessions_used + 1
  WHERE id = v_enrollment.id;
 
  -- Insertamos la fila en el historial marcándolo con gloria como 'confirmed' (Confirmada)
  INSERT INTO public.historial_reservas (
    cal_booking_id, cal_booking_uid,
    student_id, student_email, enrollment_id,
    scheduled_at, duration_minutes,
    status, raw_payload
  ) VALUES (
    p_cal_booking_id, p_cal_booking_uid,
    v_profile_id, p_student_email, v_enrollment.id,
    p_scheduled_at, p_duration_minutes,
    'confirmed', p_raw_payload
  );
 
  -- Armamos la respuesta exitosa calculando en tiempo real las sesiones que le quedan remanentes
  RETURN jsonb_build_object(
    'success',            true,
    'enrollment_id',      v_enrollment.id,
    'sessions_remaining', (v_enrollment.sessions_total - v_enrollment.sessions_used - 1)
  );
END;
$$;


ALTER FUNCTION public.fn_decrement_session_for_booking(p_student_email text, p_cal_booking_id integer, p_cal_booking_uid text, p_scheduled_at timestamp with time zone, p_duration_minutes integer, p_raw_payload jsonb) OWNER TO postgres;

--
-- Name: FUNCTION fn_decrement_session_for_booking(p_student_email text, p_cal_booking_id integer, p_cal_booking_uid text, p_scheduled_at timestamp with time zone, p_duration_minutes integer, p_raw_payload jsonb); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_decrement_session_for_booking(p_student_email text, p_cal_booking_id integer, p_cal_booking_uid text, p_scheduled_at timestamp with time zone, p_duration_minutes integer, p_raw_payload jsonb) IS 'RPC atómica para procesar un BOOKING_CREATED de Cal.com. Usa FOR UPDATE para prevenir race conditions. Es idempotente: si el cal_booking_id ya existe, retorna el resultado anterior. Retorna JSONB: { success, reason?, enrollment_id?, sessions_remaining? }';


--
-- Name: fn_expand_entitlements_on_enrollment(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_expand_entitlements_on_enrollment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE v_prod_type public.product_type;
BEGIN
  -- Consultamos qué tipo de producto generó esta nueva matrícula ('NEW.product_id')
  SELECT product_type INTO v_prod_type
  FROM public.products WHERE id = NEW.product_id;
 
  -- CASO PROGRAMA COMBO: Si es un programa que agrupa múltiples sub-productos/cursos
  IF v_prod_type = 'program' THEN
    -- Buscamos todos los sub-cursos vinculados a ese programa e insertamos un acceso para cada uno
    INSERT INTO public.user_entitlements
      (student_id, product_id, source_enrollment_id, expires_at, is_active)
    SELECT 
      NEW.student_id, 
      pip.included_product_id, -- El ID del sub-curso incluido
      NEW.id,                  -- Guardamos cuál fue la matrícula madre que le dio este acceso
      NEW.expires_at, 
      TRUE
    FROM public.program_included_products pip
    WHERE pip.program_id = NEW.product_id
    ON CONFLICT (student_id, product_id, source_enrollment_id) DO NOTHING;
  ELSE
    -- CASO INDIVIDUAL: Si compró un solo curso tradicional, le damos acceso simple a ese ID de producto
    INSERT INTO public.user_entitlements
      (student_id, product_id, source_enrollment_id, expires_at, is_active)
    VALUES (NEW.student_id, NEW.product_id, NEW.id, NEW.expires_at, TRUE)
    ON CONFLICT (student_id, product_id, source_enrollment_id) DO NOTHING;
  END IF;
 
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_expand_entitlements_on_enrollment() OWNER TO postgres;

--
-- Name: fn_expire_enrollments(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_expire_enrollments() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Acción 1: Busca matrículas que sigan 'active' pero cuya fecha límite ya pasó, y las vence.
  UPDATE public.enrollments
  SET status = 'expired'
  WHERE status = 'active' AND expires_at < NOW();
 
  -- Acción 2: Da de baja los accesos efectivos a videos y foros para esos alumnos expirados.
  UPDATE public.user_entitlements
  SET is_active = FALSE
  WHERE is_active = TRUE AND expires_at < NOW();
END;
$$;


ALTER FUNCTION public.fn_expire_enrollments() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: historial_reservas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.historial_reservas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cal_booking_id integer NOT NULL,
    cal_booking_uid text NOT NULL,
    student_id text,
    student_email text NOT NULL,
    enrollment_id uuid,
    scheduled_at timestamp with time zone NOT NULL,
    duration_minutes integer DEFAULT 60 NOT NULL,
    status public.cal_booking_status NOT NULL,
    rejection_reason text,
    cal_cancel_error text,
    raw_payload jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.historial_reservas OWNER TO postgres;

--
-- Name: TABLE historial_reservas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.historial_reservas IS 'Auditoría de cada reserva recibida desde Cal.com via webhook. Fuente de verdad para: qué sesiones ocurrieron, cuáles fueron rechazadas, y cuáles tuvieron error al cancelar en Cal.com.';


--
-- Name: COLUMN historial_reservas.cal_booking_uid; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.historial_reservas.cal_booking_uid IS 'UID de Cal.com. Se usa en POST /v1/bookings/{uid}/cancel para cancelar.';


--
-- Name: COLUMN historial_reservas.cal_cancel_error; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.historial_reservas.cal_cancel_error IS 'Mensaje de error si la llamada de cancelación a Cal.com falló. Revisar estas filas manualmente o con un cron de retry.';


--
-- Name: COLUMN historial_reservas.raw_payload; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.historial_reservas.raw_payload IS 'Payload JSON crudo del webhook. Permite re-procesar eventos si es necesario.';


--
-- Name: fn_get_failed_cancellations(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_get_failed_cancellations() RETURNS SETOF public.historial_reservas
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  -- Trae ordenados de más viejos a más nuevos todos los registros donde la API de Cal.com tiró error al intentar cancelar un turno sin créditos
  SELECT * FROM public.historial_reservas
  WHERE status = 'cancellation_failed'
  ORDER BY created_at ASC;
$$;


ALTER FUNCTION public.fn_get_failed_cancellations() OWNER TO postgres;

--
-- Name: fn_get_meeting_intent_count(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_get_meeting_intent_count(p_meeting_id uuid) RETURNS integer
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  -- Cuenta cuántos alumnos hicieron click en "Voy a asistir" para una videollamada / taller en vivo
  SELECT COUNT(*)::INT FROM public.meeting_attendance_intents
  WHERE meeting_id = p_meeting_id;
$$;


ALTER FUNCTION public.fn_get_meeting_intent_count(p_meeting_id uuid) OWNER TO postgres;

--
-- Name: fn_has_access_to_product(text, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_has_access_to_product(p_user_id text, p_product_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  -- Evalúa si existe al menos una fila activa y vigente de derechos para este alumno y producto
  SELECT EXISTS (
    SELECT 1
    FROM public.user_entitlements
    WHERE student_id = p_user_id
      AND product_id = p_product_id
      AND is_active  = TRUE
      AND expires_at > NOW()
  );
$$;


ALTER FUNCTION public.fn_has_access_to_product(p_user_id text, p_product_id uuid) OWNER TO postgres;

--
-- Name: fn_my_role(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_my_role() RETURNS public.user_role
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT role FROM public.profiles WHERE id = public.fn_clerk_user_id();
$$;


ALTER FUNCTION public.fn_my_role() OWNER TO postgres;

--
-- Name: fn_on_payment_completed(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_on_payment_completed() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  -- Declaramos variables internas para guardar datos temporales durante el proceso
  v_order     RECORD;              -- Almacenará toda la fila de la orden de compra
  v_prod_type public.product_type; -- Tipo de producto: 'course', 'program', etc.
  v_duration  INT;                 -- Cuántos meses de acceso otorga el producto
  v_sessions  INT := 0;            -- Contador de sesiones individuales (por defecto 0)
BEGIN
  -- CONTROL DE FLUJO: Solo actuamos si el pago pasa a 'completed'.
  -- Si el nuevo estado NO es completed, O si ya estaba en completed antes (evita duplicados), salimos rápido.
  IF NEW.status <> 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;
 
  -- 1. Buscamos la orden asociada a este pago y guardamos toda su fila en 'v_order'
  SELECT * INTO v_order FROM public.orders WHERE id = NEW.order_id;
  
  -- 2. Automatismo: Como el pago se completó, actualizamos la orden a estado 'paid' (Pagada)
  UPDATE public.orders SET status = 'paid' WHERE id = NEW.order_id;
 
  -- 3. Buscamos las características del producto que se compró en esa orden
  SELECT p.product_type, p.access_duration_months
  INTO v_prod_type, v_duration
  FROM public.products p WHERE p.id = v_order.product_id;
 
  -- 4. CASO ESPECIAL (HEBE): Si lo que compró es un programa completo (por ej. Mentoría Individual)
  -- vamos a buscar cuántas sesiones uno-a-uno incluye ese programa específico.
  IF v_prod_type = 'program' THEN
    SELECT pp.individual_sessions_count INTO v_sessions
    FROM public.product_programs pp WHERE pp.product_id = v_order.product_id;
  END IF;
 
  -- 5. CREACIÓN DE MATRÍCULA: Insertamos el derecho de acceso de la alumna a la plataforma
  INSERT INTO public.enrollments (
    student_id, product_id, order_id, source, status,
    started_at, expires_at, sessions_total, sessions_used
  ) VALUES (
    v_order.student_id,   -- ID de la alumna (proveniente de Clerk)
    v_order.product_id,   -- ID del producto comprado
    v_order.id,           -- ID de la orden de compra
    'payment_flow',       -- Origen: flujo de pago automático
    'active',             -- Estado inicial de la matrícula: activa
    NOW(),                -- Empieza YA
    NOW() + (v_duration || ' months')::INTERVAL, -- Suma los meses configurados a la fecha actual
    v_sessions,           -- Si era programa de Hebe, acá se guardan las 12 sesiones permitidas
    0                     -- Sesiones usadas inicialmente: 0
  )
  -- Si por algún motivo la alumna ya estaba matriculada a este producto exacto, no hacemos nada (evita errores)
  ON CONFLICT (student_id, product_id) DO NOTHING;
 
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_on_payment_completed() OWNER TO postgres;

--
-- Name: fn_set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN 
  -- 'NEW' es un registro especial que contiene los nuevos datos que se quieren guardar.
  -- Modificamos su columna 'updated_at' con la fecha/hora exacta de este milisegundo (NOW()).
  NEW.updated_at = NOW(); 
  
  -- Retornamos 'NEW' para que Postgres continúe con el guardado de la fila modificada.
  RETURN NEW; 
END;
$$;


ALTER FUNCTION public.fn_set_updated_at() OWNER TO postgres;

--
-- Name: fn_unlock_first_module(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_unlock_first_module() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE v_first UUID;
BEGIN
  -- CONTROL DE SEGURIDAD: Si la matrícula NO corresponde a un curso ('course'), cancelamos.
  -- Las sesiones o talleres no tienen estructura de módulos correlativos.
  IF (SELECT product_type FROM public.products WHERE id = NEW.product_id) <> 'course'
  THEN RETURN NEW; END IF;
 
  -- Buscamos el ID del módulo de este curso que tenga el índice de orden más bajo (Módulo 1)
  SELECT id INTO v_first FROM public.modules
  WHERE product_id = NEW.product_id ORDER BY order_index ASC LIMIT 1;
 
  -- Si encontramos el módulo inicial, creamos su registro de progreso marcándolo como desbloqueado
  IF v_first IS NOT NULL THEN
    INSERT INTO public.student_module_progress
      (student_id, enrollment_id, module_id, is_unlocked, unlocked_at)
    VALUES (NEW.student_id, NEW.id, v_first, TRUE, NOW())
    ON CONFLICT (student_id, module_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_unlock_first_module() OWNER TO postgres;

--
-- Name: fn_unlock_next_module_on_submit(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_unlock_next_module_on_submit() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_module_id     UUID;
  v_product_id    UUID;
  v_current_order INT;
  v_next_id       UUID;
BEGIN
  -- CONTROL DE ABUSO: Solo actuamos si es la primera vez que envía la tarea (attempt_number = 1).
  -- Si está re-enviando una corrección fallida, no queremos volver a gatillar el flujo de desbloqueo.
  IF NEW.attempt_number > 1 THEN RETURN NEW; END IF;
 
  -- 1. Obtenemos los datos del módulo actual al que pertenece la tarea entregada
  SELECT m.id, m.product_id, m.order_index
  INTO v_module_id, v_product_id, v_current_order
  FROM public.module_assignments ma
  JOIN public.modules m ON m.id = ma.module_id
  WHERE ma.id = NEW.assignment_id;
 
  -- 2. Buscamos el ID del módulo que sigue en la lista del curso (Módulo actual + 1)
  SELECT id INTO v_next_id FROM public.modules
  WHERE product_id = v_product_id AND order_index = v_current_order + 1;
 
  -- 3. Si existe un módulo siguiente, se lo dejamos disponible en su perfil de alumno
  IF v_next_id IS NOT NULL THEN
    INSERT INTO public.student_module_progress
      (student_id, enrollment_id, module_id, is_unlocked, unlocked_at)
    VALUES (NEW.student_id, NEW.enrollment_id, v_next_id, TRUE, NOW())
    -- Si ya estaba creado por algún motivo, forzamos que se marque como desbloqueado de forma segura
    ON CONFLICT (student_id, module_id)
    DO UPDATE SET
      is_unlocked = TRUE,
      -- COALESCE evalúa parámetros de izquierda a derecha y devuelve el primero que NO sea nulo.
      -- Si ya tenía fecha de desbloqueo la dejamos fija, si no, le ponemos NOW().
      unlocked_at = COALESCE(student_module_progress.unlocked_at, NOW());
  END IF;
 
  -- 4. Marcamos el módulo actual como "completado" en este mismo instante
  UPDATE public.student_module_progress
  SET completed_at = COALESCE(completed_at, NOW())
  WHERE student_id = NEW.student_id AND module_id = v_module_id;
 
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_unlock_next_module_on_submit() OWNER TO postgres;

--
-- Name: fn_update_final_submission_status(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_update_final_submission_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE public.final_activity_submissions
  SET status = CASE WHEN NEW.is_approved
    THEN 'approved'::public.submission_status
    ELSE 'failed'::public.submission_status END
  WHERE id = NEW.submission_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_update_final_submission_status() OWNER TO postgres;

--
-- Name: fn_update_submission_status(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_update_submission_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Cuando Hebe inserta feedback, alteramos la tabla de entregas original
  UPDATE public.assignment_submissions
  SET status = CASE WHEN NEW.is_approved
    THEN 'approved'::public.submission_status -- Si lo aprobó, casteamos el string a tipo ENUM
    ELSE 'failed'::public.submission_status END -- Si no, queda desaprobada
  WHERE id = NEW.submission_id; -- Vincula con la entrega corregida
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_update_submission_status() OWNER TO postgres;

--
-- Name: announcements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.announcements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid,
    meeting_id uuid,
    author_id text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    is_pinned boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.announcements OWNER TO postgres;

--
-- Name: COLUMN announcements.product_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.announcements.product_id IS 'NULL = global de plataforma. Con valor = foro del producto específico.';


--
-- Name: COLUMN announcements.meeting_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.announcements.meeting_id IS 'Vincula el anuncio a la reunión que se está comunicando.';


--
-- Name: assignment_feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignment_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    submission_id uuid NOT NULL,
    reviewer_id text NOT NULL,
    feedback_text text,
    score integer NOT NULL,
    is_approved boolean NOT NULL,
    reviewed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT assignment_feedback_score_check CHECK (((score >= 1) AND (score <= 100)))
);


ALTER TABLE public.assignment_feedback OWNER TO postgres;

--
-- Name: assignment_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignment_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assignment_id uuid NOT NULL,
    student_id text NOT NULL,
    enrollment_id uuid NOT NULL,
    attempt_number integer DEFAULT 1 NOT NULL,
    answers jsonb DEFAULT '[]'::jsonb NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    status public.submission_status DEFAULT 'pending_review'::public.submission_status NOT NULL,
    CONSTRAINT assignment_submissions_attempt_number_check CHECK ((attempt_number >= 1)),
    CONSTRAINT valid_answers CHECK ((jsonb_typeof(answers) = 'array'::text))
);


ALTER TABLE public.assignment_submissions OWNER TO postgres;

--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id text NOT NULL,
    product_id uuid NOT NULL,
    order_id uuid,
    source public.enrollment_source DEFAULT 'payment_flow'::public.enrollment_source NOT NULL,
    enrolled_by text,
    status public.enrollment_status DEFAULT 'active'::public.enrollment_status NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    sessions_total integer DEFAULT 0 NOT NULL,
    sessions_used integer DEFAULT 0 NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT admin_direct_needs_enrolled_by CHECK (((source <> 'admin_direct'::public.enrollment_source) OR (enrolled_by IS NOT NULL))),
    CONSTRAINT enrollments_sessions_total_check CHECK ((sessions_total >= 0)),
    CONSTRAINT enrollments_sessions_used_check CHECK ((sessions_used >= 0)),
    CONSTRAINT expires_after_start CHECK ((expires_at > started_at)),
    CONSTRAINT payment_flow_needs_order CHECK (((source <> 'payment_flow'::public.enrollment_source) OR (order_id IS NOT NULL))),
    CONSTRAINT sessions_not_exceed CHECK ((sessions_used <= sessions_total))
);


ALTER TABLE public.enrollments OWNER TO postgres;

--
-- Name: TABLE enrollments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.enrollments IS 'Registro de qué producto adquirió (o fue habilitado a) cada alumna. Al crearse, el trigger fn_expand_entitlements genera los accesos efectivos.';


--
-- Name: COLUMN enrollments.order_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.enrollments.order_id IS 'NULL si source = "admin_direct". FK real a orders si source = "payment_flow".';


--
-- Name: COLUMN enrollments.enrolled_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.enrollments.enrolled_by IS 'Clerk ID de Hebe cuando source = "admin_direct". NULL en el flujo de pago normal.';


--
-- Name: COLUMN enrollments.expires_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.enrollments.expires_at IS 'Sellado al momento de la compra. Para programas, usa la duración del programa, no la de los productos incluidos.';


--
-- Name: final_activities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.final_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    title text NOT NULL,
    instructions text,
    questions jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT valid_questions CHECK ((jsonb_typeof(questions) = 'array'::text))
);


ALTER TABLE public.final_activities OWNER TO postgres;

--
-- Name: final_activity_feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.final_activity_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    submission_id uuid NOT NULL,
    reviewer_id text NOT NULL,
    feedback_text text,
    score integer NOT NULL,
    is_approved boolean NOT NULL,
    reviewed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT final_activity_feedback_score_check CHECK (((score >= 1) AND (score <= 100)))
);


ALTER TABLE public.final_activity_feedback OWNER TO postgres;

--
-- Name: final_activity_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.final_activity_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    final_activity_id uuid NOT NULL,
    student_id text NOT NULL,
    enrollment_id uuid NOT NULL,
    attempt_number integer DEFAULT 1 NOT NULL,
    answers jsonb DEFAULT '[]'::jsonb NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    status public.submission_status DEFAULT 'pending_review'::public.submission_status NOT NULL,
    CONSTRAINT final_activity_submissions_attempt_number_check CHECK ((attempt_number >= 1)),
    CONSTRAINT valid_answers CHECK ((jsonb_typeof(answers) = 'array'::text))
);


ALTER TABLE public.final_activity_submissions OWNER TO postgres;

--
-- Name: meeting_attendance_intents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.meeting_attendance_intents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    meeting_id uuid NOT NULL,
    student_id text NOT NULL,
    intent_registered_at timestamp with time zone DEFAULT now() NOT NULL,
    attended boolean
);


ALTER TABLE public.meeting_attendance_intents OWNER TO postgres;

--
-- Name: meetings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.meetings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid,
    meeting_type public.meeting_type NOT NULL,
    title text NOT NULL,
    description text,
    scheduled_at timestamp with time zone NOT NULL,
    duration_minutes integer,
    meeting_url text,
    recording_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT meetings_duration_minutes_check CHECK ((duration_minutes > 0))
);


ALTER TABLE public.meetings OWNER TO postgres;

--
-- Name: TABLE meetings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.meetings IS 'Reuniones virtuales. Abiertas a todos los matriculados del producto. La intención de asistencia se registra en meeting_attendance_intents.';


--
-- Name: COLUMN meetings.recording_url; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.meetings.recording_url IS 'URL de la grabación. Se carga post-reunión. Disponible para quienes no asistieron.';


--
-- Name: module_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.module_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    module_id uuid NOT NULL,
    title text NOT NULL,
    instructions text,
    questions jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT valid_questions CHECK ((jsonb_typeof(questions) = 'array'::text))
);


ALTER TABLE public.module_assignments OWNER TO postgres;

--
-- Name: COLUMN module_assignments.questions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.module_assignments.questions IS 'Array JSON de strings: ["Pregunta 1", "Pregunta 2"]. Respuestas en assignment_submissions.answers (array paralelo).';


--
-- Name: module_learning_resources; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.module_learning_resources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    module_id uuid NOT NULL,
    title text NOT NULL,
    resource_type text NOT NULL,
    url text NOT NULL,
    duration_seconds integer,
    order_index integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT module_learning_resources_duration_seconds_check CHECK ((duration_seconds > 0)),
    CONSTRAINT module_learning_resources_order_index_check CHECK ((order_index >= 0)),
    CONSTRAINT valid_resource_type CHECK ((resource_type = ANY (ARRAY['video'::text, 'pdf'::text, 'audio'::text, 'download'::text, 'external_link'::text])))
);


ALTER TABLE public.module_learning_resources OWNER TO postgres;

--
-- Name: TABLE module_learning_resources; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.module_learning_resources IS 'Recursos multimedia de un módulo de curso. Reemplaza module_videos + content_pdf_url. resource_type = TEXT para agregar nuevos tipos sin migrar la DB.';


--
-- Name: COLUMN module_learning_resources.resource_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.module_learning_resources.resource_type IS 'Tipo de recurso. Valores: video | pdf | audio | download | external_link. Para agregar un nuevo tipo, actualizar solo el CHECK constraint.';


--
-- Name: modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    order_index integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT modules_order_index_check CHECK ((order_index >= 0))
);


ALTER TABLE public.modules OWNER TO postgres;

--
-- Name: COLUMN modules.order_index; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.modules.order_index IS 'Posición del módulo en el curso. Empieza en 0.';


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id text NOT NULL,
    product_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    status public.order_status DEFAULT 'pending_payment'::public.order_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT orders_amount_check CHECK ((amount >= (0)::numeric))
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    method public.payment_method NOT NULL,
    status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    external_id text,
    external_status text,
    webhook_payload jsonb,
    proof_url text,
    proof_uploaded_at timestamp with time zone,
    approved_by text,
    approved_at timestamp with time zone,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT payments_amount_check CHECK ((amount >= (0)::numeric))
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: COLUMN payments.external_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payments.external_id IS 'MercadoPago: preference_id. PayPal: order_id. NULL para métodos manuales.';


--
-- Name: COLUMN payments.proof_url; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payments.proof_url IS 'Comprobante subido por la alumna. Solo métodos manuales.';


--
-- Name: COLUMN payments.approved_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payments.approved_by IS 'Clerk ID de Hebe al aprobar/rechazar un comprobante manual.';


--
-- Name: product_courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_courses (
    product_id uuid NOT NULL,
    access_duration_months integer NOT NULL,
    grants_certificate boolean DEFAULT true NOT NULL,
    approval_min_score integer DEFAULT 60 NOT NULL,
    CONSTRAINT product_courses_access_duration_months_check CHECK ((access_duration_months > 0)),
    CONSTRAINT product_courses_approval_min_score_check CHECK (((approval_min_score >= 1) AND (approval_min_score <= 100)))
);


ALTER TABLE public.product_courses OWNER TO postgres;

--
-- Name: TABLE product_courses; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.product_courses IS 'Metadatos de cursos modulares. Otorgan certificado.';


--
-- Name: COLUMN product_courses.approval_min_score; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.product_courses.approval_min_score IS 'Puntaje mínimo (1-100) para considerar una entrega como aprobada.';


--
-- Name: product_programs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_programs (
    product_id uuid NOT NULL,
    access_duration_months integer NOT NULL,
    individual_sessions_count integer DEFAULT 0 NOT NULL,
    grants_certificate boolean DEFAULT false NOT NULL,
    approval_min_score integer DEFAULT 60 NOT NULL,
    CONSTRAINT product_programs_access_duration_months_check CHECK ((access_duration_months > 0)),
    CONSTRAINT product_programs_approval_min_score_check CHECK (((approval_min_score >= 1) AND (approval_min_score <= 100))),
    CONSTRAINT product_programs_individual_sessions_count_check CHECK ((individual_sessions_count >= 0))
);


ALTER TABLE public.product_programs OWNER TO postgres;

--
-- Name: TABLE product_programs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.product_programs IS 'Metadatos de programas bundle. Ave Fénix (12m, 12 sesiones), Flor de Loto (6m, 6 sesiones).';


--
-- Name: COLUMN product_programs.individual_sessions_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.product_programs.individual_sessions_count IS 'Total de sesiones 1-on-1 otorgadas. 12 (Ave Fénix) o 6 (Flor de Loto).';


--
-- Name: product_workshops; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_workshops (
    product_id uuid NOT NULL,
    access_duration_months integer DEFAULT 3 NOT NULL,
    CONSTRAINT product_workshops_access_duration_months_check CHECK ((access_duration_months > 0))
);


ALTER TABLE public.product_workshops OWNER TO postgres;

--
-- Name: TABLE product_workshops; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.product_workshops IS 'Metadatos de talleres planos. Sin módulos, sin certificado. Las tareas se hacen en vivo.';


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    short_description text,
    product_type public.product_type NOT NULL,
    cover_image_url text,
    welcome_video_url text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    price_usd numeric(10,2),
    price_ars numeric(10,2),
    whatsapp_community_url text
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: TABLE products; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.products IS 'Tabla padre de todos los productos. product_type determina qué tabla especializada acompaña a cada fila (Class Table Inheritance).';


--
-- Name: COLUMN products.whatsapp_community_url; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.products.whatsapp_community_url IS 'Link directo al grupo/comunidad de WhatsApp del producto. NULL si el producto no tiene comunidad.';


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id text NOT NULL,
    email text NOT NULL,
    username text DEFAULT ''::text NOT NULL,
    avatar_url text,
    phone text,
    role public.user_role DEFAULT 'student'::public.user_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- Name: TABLE profiles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.profiles IS 'Perfil de usuario gestionado por Clerk. Se crea via webhook de Clerk → API Route de Next.js. id = Clerk User ID (TEXT).';


--
-- Name: COLUMN profiles.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.profiles.id IS 'Clerk User ID. Formato: "user_2abc123xyz". Sirve como FK en todas las tablas que relacionan a un usuario.';


--
-- Name: COLUMN profiles.username; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.profiles.username IS 'Username único configurado en Clerk. Equivale al display name de la alumna.';


--
-- Name: COLUMN profiles.role; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.profiles.role IS '"student" = alumna | "admin" = Hebe (administradora total).';


--
-- Name: program_included_products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.program_included_products (
    program_id uuid NOT NULL,
    included_product_id uuid NOT NULL,
    CONSTRAINT no_self_include CHECK ((program_id <> included_product_id))
);


ALTER TABLE public.program_included_products OWNER TO postgres;

--
-- Name: student_module_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_module_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id text NOT NULL,
    enrollment_id uuid NOT NULL,
    module_id uuid NOT NULL,
    is_unlocked boolean DEFAULT false NOT NULL,
    unlocked_at timestamp with time zone,
    completed_at timestamp with time zone
);


ALTER TABLE public.student_module_progress OWNER TO postgres;

--
-- Name: user_entitlements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_entitlements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id text NOT NULL,
    product_id uuid NOT NULL,
    source_enrollment_id uuid NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_entitlements OWNER TO postgres;

--
-- Name: TABLE user_entitlements; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_entitlements IS 'Accesos efectivos sellados al momento de compra. Es la fuente de verdad para "¿puede esta alumna ver este contenido?". Generado por trigger al crear un enrollment.';


--
-- Name: COLUMN user_entitlements.product_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_entitlements.product_id IS 'El producto concreto accesible. Si compró un programa, habrá una fila por cada producto del programa.';


--
-- Name: COLUMN user_entitlements.expires_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_entitlements.expires_at IS 'Para productos incluidos en un programa, este valor es el expires_at del programa (no el del producto individual).';


--
-- Name: workshop_learning_resources; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workshop_learning_resources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    title text NOT NULL,
    resource_type text NOT NULL,
    url text NOT NULL,
    duration_seconds integer,
    order_index integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT valid_resource_type CHECK ((resource_type = ANY (ARRAY['video'::text, 'pdf'::text, 'audio'::text, 'download'::text, 'external_link'::text]))),
    CONSTRAINT workshop_learning_resources_duration_seconds_check CHECK ((duration_seconds > 0)),
    CONSTRAINT workshop_learning_resources_order_index_check CHECK ((order_index >= 0))
);


ALTER TABLE public.workshop_learning_resources OWNER TO postgres;

--
-- Name: TABLE workshop_learning_resources; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.workshop_learning_resources IS 'Recursos multimedia directamente asociados a un Taller. Misma lógica que module_learning_resources pero sin módulos intermedios.';


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: assignment_feedback assignment_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_feedback
    ADD CONSTRAINT assignment_feedback_pkey PRIMARY KEY (id);


--
-- Name: assignment_feedback assignment_feedback_submission_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_feedback
    ADD CONSTRAINT assignment_feedback_submission_id_key UNIQUE (submission_id);


--
-- Name: assignment_submissions assignment_submissions_assignment_id_student_id_attempt_num_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_assignment_id_student_id_attempt_num_key UNIQUE (assignment_id, student_id, attempt_number);


--
-- Name: assignment_submissions assignment_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_pkey PRIMARY KEY (id);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- Name: enrollments enrollments_student_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_student_id_product_id_key UNIQUE (student_id, product_id);


--
-- Name: final_activities final_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_activities
    ADD CONSTRAINT final_activities_pkey PRIMARY KEY (id);


--
-- Name: final_activities final_activities_product_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_activities
    ADD CONSTRAINT final_activities_product_id_key UNIQUE (product_id);


--
-- Name: final_activity_feedback final_activity_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_activity_feedback
    ADD CONSTRAINT final_activity_feedback_pkey PRIMARY KEY (id);


--
-- Name: final_activity_feedback final_activity_feedback_submission_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_activity_feedback
    ADD CONSTRAINT final_activity_feedback_submission_id_key UNIQUE (submission_id);


--
-- Name: final_activity_submissions final_activity_submissions_final_activity_id_student_id_att_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_activity_submissions
    ADD CONSTRAINT final_activity_submissions_final_activity_id_student_id_att_key UNIQUE (final_activity_id, student_id, attempt_number);


--
-- Name: final_activity_submissions final_activity_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_activity_submissions
    ADD CONSTRAINT final_activity_submissions_pkey PRIMARY KEY (id);


--
-- Name: historial_reservas historial_reservas_cal_booking_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_reservas
    ADD CONSTRAINT historial_reservas_cal_booking_id_key UNIQUE (cal_booking_id);


--
-- Name: historial_reservas historial_reservas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_reservas
    ADD CONSTRAINT historial_reservas_pkey PRIMARY KEY (id);


--
-- Name: meeting_attendance_intents meeting_attendance_intents_meeting_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meeting_attendance_intents
    ADD CONSTRAINT meeting_attendance_intents_meeting_id_student_id_key UNIQUE (meeting_id, student_id);


--
-- Name: meeting_attendance_intents meeting_attendance_intents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meeting_attendance_intents
    ADD CONSTRAINT meeting_attendance_intents_pkey PRIMARY KEY (id);


--
-- Name: meetings meetings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_pkey PRIMARY KEY (id);


--
-- Name: module_assignments module_assignments_module_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.module_assignments
    ADD CONSTRAINT module_assignments_module_id_key UNIQUE (module_id);


--
-- Name: module_assignments module_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.module_assignments
    ADD CONSTRAINT module_assignments_pkey PRIMARY KEY (id);


--
-- Name: module_learning_resources module_learning_resources_module_id_order_index_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.module_learning_resources
    ADD CONSTRAINT module_learning_resources_module_id_order_index_key UNIQUE (module_id, order_index);


--
-- Name: module_learning_resources module_learning_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.module_learning_resources
    ADD CONSTRAINT module_learning_resources_pkey PRIMARY KEY (id);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: modules modules_product_id_order_index_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_product_id_order_index_key UNIQUE (product_id, order_index);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: product_courses product_courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_courses
    ADD CONSTRAINT product_courses_pkey PRIMARY KEY (product_id);


--
-- Name: product_programs product_programs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_programs
    ADD CONSTRAINT product_programs_pkey PRIMARY KEY (product_id);


--
-- Name: product_workshops product_workshops_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_workshops
    ADD CONSTRAINT product_workshops_pkey PRIMARY KEY (product_id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_slug_key UNIQUE (slug);


--
-- Name: profiles profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_key UNIQUE (email);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_username_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_username_unique UNIQUE (username);


--
-- Name: program_included_products program_included_products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.program_included_products
    ADD CONSTRAINT program_included_products_pkey PRIMARY KEY (program_id, included_product_id);


--
-- Name: student_module_progress student_module_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_module_progress
    ADD CONSTRAINT student_module_progress_pkey PRIMARY KEY (id);


--
-- Name: student_module_progress student_module_progress_student_id_module_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_module_progress
    ADD CONSTRAINT student_module_progress_student_id_module_id_key UNIQUE (student_id, module_id);


--
-- Name: user_entitlements user_entitlements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_entitlements
    ADD CONSTRAINT user_entitlements_pkey PRIMARY KEY (id);


--
-- Name: user_entitlements user_entitlements_student_id_product_id_source_enrollment_i_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_entitlements
    ADD CONSTRAINT user_entitlements_student_id_product_id_source_enrollment_i_key UNIQUE (student_id, product_id, source_enrollment_id);


--
-- Name: workshop_learning_resources workshop_learning_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workshop_learning_resources
    ADD CONSTRAINT workshop_learning_resources_pkey PRIMARY KEY (id);


--
-- Name: workshop_learning_resources workshop_learning_resources_product_id_order_index_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workshop_learning_resources
    ADD CONSTRAINT workshop_learning_resources_product_id_order_index_key UNIQUE (product_id, order_index);


--
-- Name: idx_announcements_pinned; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_announcements_pinned ON public.announcements USING btree (is_pinned) WHERE (is_pinned = true);


--
-- Name: idx_announcements_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_announcements_product ON public.announcements USING btree (product_id, created_at DESC);


--
-- Name: idx_enrollments_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_expires ON public.enrollments USING btree (expires_at);


--
-- Name: idx_enrollments_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_product ON public.enrollments USING btree (product_id);


--
-- Name: idx_enrollments_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_source ON public.enrollments USING btree (source);


--
-- Name: idx_enrollments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_status ON public.enrollments USING btree (status);


--
-- Name: idx_enrollments_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_student ON public.enrollments USING btree (student_id);


--
-- Name: idx_entitlements_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_entitlements_active ON public.user_entitlements USING btree (student_id, product_id, expires_at) WHERE (is_active = true);


--
-- Name: idx_entitlements_enrollment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_entitlements_enrollment ON public.user_entitlements USING btree (source_enrollment_id);


--
-- Name: idx_entitlements_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_entitlements_student ON public.user_entitlements USING btree (student_id, product_id);


--
-- Name: idx_final_sub_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_final_sub_student ON public.final_activity_submissions USING btree (student_id, final_activity_id);


--
-- Name: idx_historial_cal_uid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historial_cal_uid ON public.historial_reservas USING btree (cal_booking_uid);


--
-- Name: idx_historial_cancel_failed; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historial_cancel_failed ON public.historial_reservas USING btree (status) WHERE (status = 'cancellation_failed'::public.cal_booking_status);


--
-- Name: idx_historial_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historial_email ON public.historial_reservas USING btree (student_email);


--
-- Name: idx_historial_enrollment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historial_enrollment ON public.historial_reservas USING btree (enrollment_id);


--
-- Name: idx_historial_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historial_status ON public.historial_reservas USING btree (status);


--
-- Name: idx_historial_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historial_student ON public.historial_reservas USING btree (student_id);


--
-- Name: idx_intents_meeting; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_intents_meeting ON public.meeting_attendance_intents USING btree (meeting_id);


--
-- Name: idx_intents_meeting_count; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_intents_meeting_count ON public.meeting_attendance_intents USING btree (meeting_id) WHERE ((attended IS NULL) OR (attended = true));


--
-- Name: idx_intents_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_intents_student ON public.meeting_attendance_intents USING btree (student_id);


--
-- Name: idx_meetings_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_meetings_product ON public.meetings USING btree (product_id, scheduled_at);


--
-- Name: idx_module_learning_resources_module; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_module_learning_resources_module ON public.module_learning_resources USING btree (module_id, order_index);


--
-- Name: idx_module_learning_resources_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_module_learning_resources_type ON public.module_learning_resources USING btree (module_id, resource_type);


--
-- Name: idx_modules_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_modules_product ON public.modules USING btree (product_id, order_index);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_orders_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_student ON public.orders USING btree (student_id);


--
-- Name: idx_payments_awaiting; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_awaiting ON public.payments USING btree (status, created_at) WHERE (status = 'awaiting_approval'::public.payment_status);


--
-- Name: idx_payments_external; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_external ON public.payments USING btree (external_id) WHERE (external_id IS NOT NULL);


--
-- Name: idx_payments_method; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_method ON public.payments USING btree (method);


--
-- Name: idx_payments_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_order ON public.payments USING btree (order_id);


--
-- Name: idx_payments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_status ON public.payments USING btree (status);


--
-- Name: idx_products_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_active ON public.products USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_products_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_type ON public.products USING btree (product_type);


--
-- Name: idx_progress_enrollment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_progress_enrollment ON public.student_module_progress USING btree (enrollment_id);


--
-- Name: idx_progress_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_progress_student ON public.student_module_progress USING btree (student_id, module_id);


--
-- Name: idx_submissions_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_submissions_student ON public.assignment_submissions USING btree (student_id, assignment_id);


--
-- Name: idx_workshop_learning_resources_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_workshop_learning_resources_product ON public.workshop_learning_resources USING btree (product_id, order_index);


--
-- Name: idx_workshop_learning_resources_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_workshop_learning_resources_type ON public.workshop_learning_resources USING btree (product_id, resource_type);


--
-- Name: announcements trg_announcements_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: enrollments trg_enrollments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_enrollments_updated_at BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: historial_reservas trg_historial_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_historial_updated_at BEFORE UPDATE ON public.historial_reservas FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: meetings trg_meetings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_meetings_updated_at BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: assignment_feedback trg_on_assignment_feedback; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_on_assignment_feedback AFTER INSERT ON public.assignment_feedback FOR EACH ROW EXECUTE FUNCTION public.fn_update_submission_status();


--
-- Name: assignment_submissions trg_on_assignment_submitted; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_on_assignment_submitted AFTER INSERT ON public.assignment_submissions FOR EACH ROW EXECUTE FUNCTION public.fn_unlock_next_module_on_submit();


--
-- Name: enrollments trg_on_enrollment_created; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_on_enrollment_created AFTER INSERT ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.fn_expand_entitlements_on_enrollment();


--
-- Name: final_activity_feedback trg_on_final_feedback; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_on_final_feedback AFTER INSERT ON public.final_activity_feedback FOR EACH ROW EXECUTE FUNCTION public.fn_update_final_submission_status();


--
-- Name: payments trg_on_payment_completed; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_on_payment_completed AFTER UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.fn_on_payment_completed();


--
-- Name: orders trg_orders_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: payments trg_payments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: products trg_products_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: profiles trg_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: enrollments trg_unlock_first_module; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_unlock_first_module AFTER INSERT ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.fn_unlock_first_module();


--
-- Name: announcements announcements_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);


--
-- Name: announcements announcements_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE SET NULL;


--
-- Name: announcements announcements_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: assignment_feedback assignment_feedback_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_feedback
    ADD CONSTRAINT assignment_feedback_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id);


--
-- Name: assignment_feedback assignment_feedback_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_feedback
    ADD CONSTRAINT assignment_feedback_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.assignment_submissions(id) ON DELETE CASCADE;


--
-- Name: assignment_submissions assignment_submissions_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.module_assignments(id) ON DELETE CASCADE;


--
-- Name: assignment_submissions assignment_submissions_enrollment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id) ON DELETE CASCADE;


--
-- Name: assignment_submissions assignment_submissions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: enrollments enrollments_enrolled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_enrolled_by_fkey FOREIGN KEY (enrolled_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: enrollments enrollments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE RESTRICT;


--
-- Name: enrollments enrollments_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- Name: enrollments enrollments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: final_activities final_activities_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_activities
    ADD CONSTRAINT final_activities_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: final_activity_feedback final_activity_feedback_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_activity_feedback
    ADD CONSTRAINT final_activity_feedback_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id);


--
-- Name: final_activity_feedback final_activity_feedback_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_activity_feedback
    ADD CONSTRAINT final_activity_feedback_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.final_activity_submissions(id) ON DELETE CASCADE;


--
-- Name: final_activity_submissions final_activity_submissions_enrollment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_activity_submissions
    ADD CONSTRAINT final_activity_submissions_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id) ON DELETE CASCADE;


--
-- Name: final_activity_submissions final_activity_submissions_final_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_activity_submissions
    ADD CONSTRAINT final_activity_submissions_final_activity_id_fkey FOREIGN KEY (final_activity_id) REFERENCES public.final_activities(id) ON DELETE CASCADE;


--
-- Name: final_activity_submissions final_activity_submissions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_activity_submissions
    ADD CONSTRAINT final_activity_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: historial_reservas historial_reservas_enrollment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_reservas
    ADD CONSTRAINT historial_reservas_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id) ON DELETE SET NULL;


--
-- Name: historial_reservas historial_reservas_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_reservas
    ADD CONSTRAINT historial_reservas_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: meeting_attendance_intents meeting_attendance_intents_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meeting_attendance_intents
    ADD CONSTRAINT meeting_attendance_intents_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: meeting_attendance_intents meeting_attendance_intents_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meeting_attendance_intents
    ADD CONSTRAINT meeting_attendance_intents_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: meetings meetings_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: module_assignments module_assignments_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.module_assignments
    ADD CONSTRAINT module_assignments_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: module_learning_resources module_learning_resources_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.module_learning_resources
    ADD CONSTRAINT module_learning_resources_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: modules modules_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: orders orders_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- Name: orders orders_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;


--
-- Name: payments payments_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: payments payments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE RESTRICT;


--
-- Name: product_courses product_courses_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_courses
    ADD CONSTRAINT product_courses_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_programs product_programs_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_programs
    ADD CONSTRAINT product_programs_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_workshops product_workshops_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_workshops
    ADD CONSTRAINT product_workshops_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: program_included_products program_included_products_included_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.program_included_products
    ADD CONSTRAINT program_included_products_included_product_id_fkey FOREIGN KEY (included_product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: program_included_products program_included_products_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.program_included_products
    ADD CONSTRAINT program_included_products_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: student_module_progress student_module_progress_enrollment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_module_progress
    ADD CONSTRAINT student_module_progress_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id) ON DELETE CASCADE;


--
-- Name: student_module_progress student_module_progress_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_module_progress
    ADD CONSTRAINT student_module_progress_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: student_module_progress student_module_progress_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_module_progress
    ADD CONSTRAINT student_module_progress_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_entitlements user_entitlements_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_entitlements
    ADD CONSTRAINT user_entitlements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: user_entitlements user_entitlements_source_enrollment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_entitlements
    ADD CONSTRAINT user_entitlements_source_enrollment_id_fkey FOREIGN KEY (source_enrollment_id) REFERENCES public.enrollments(id) ON DELETE CASCADE;


--
-- Name: user_entitlements user_entitlements_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_entitlements
    ADD CONSTRAINT user_entitlements_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: workshop_learning_resources workshop_learning_resources_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workshop_learning_resources
    ADD CONSTRAINT workshop_learning_resources_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: announcements; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

--
-- Name: announcements announcements: admin gestiona; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "announcements: admin gestiona" ON public.announcements USING ((public.fn_my_role() = 'admin'::public.user_role));


--
-- Name: announcements announcements: ver autenticados; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "announcements: ver autenticados" ON public.announcements FOR SELECT USING ((public.fn_clerk_user_id() <> ''::text));


--
-- Name: assignment_feedback; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.assignment_feedback ENABLE ROW LEVEL SECURITY;

--
-- Name: assignment_submissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: enrollments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

--
-- Name: enrollments enrollments: admin gestiona; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "enrollments: admin gestiona" ON public.enrollments USING ((public.fn_my_role() = 'admin'::public.user_role));


--
-- Name: enrollments enrollments: ver propias o admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "enrollments: ver propias o admin" ON public.enrollments FOR SELECT USING (((student_id = public.fn_clerk_user_id()) OR (public.fn_my_role() = 'admin'::public.user_role)));


--
-- Name: user_entitlements entitlements: admin gestiona; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "entitlements: admin gestiona" ON public.user_entitlements USING ((public.fn_my_role() = 'admin'::public.user_role));


--
-- Name: user_entitlements entitlements: ver propios o admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "entitlements: ver propios o admin" ON public.user_entitlements FOR SELECT USING (((student_id = public.fn_clerk_user_id()) OR (public.fn_my_role() = 'admin'::public.user_role)));


--
-- Name: assignment_feedback feedback: admin gestiona; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "feedback: admin gestiona" ON public.assignment_feedback USING ((public.fn_my_role() = 'admin'::public.user_role));


--
-- Name: assignment_feedback feedback: ver propias o admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "feedback: ver propias o admin" ON public.assignment_feedback FOR SELECT USING (((public.fn_my_role() = 'admin'::public.user_role) OR (EXISTS ( SELECT 1
   FROM public.assignment_submissions s
  WHERE ((s.id = assignment_feedback.submission_id) AND (s.student_id = public.fn_clerk_user_id()))))));


--
-- Name: final_activities; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.final_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: final_activities final_activities: admin gestiona; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "final_activities: admin gestiona" ON public.final_activities USING ((public.fn_my_role() = 'admin'::public.user_role));


--
-- Name: final_activities final_activities: ver con acceso o admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "final_activities: ver con acceso o admin" ON public.final_activities FOR SELECT USING (((public.fn_my_role() = 'admin'::public.user_role) OR public.fn_has_access_to_product(public.fn_clerk_user_id(), product_id)));


--
-- Name: final_activity_feedback; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.final_activity_feedback ENABLE ROW LEVEL SECURITY;

--
-- Name: final_activity_submissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.final_activity_submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: final_activity_feedback final_feedback: admin gestiona; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "final_feedback: admin gestiona" ON public.final_activity_feedback USING ((public.fn_my_role() = 'admin'::public.user_role));


--
-- Name: final_activity_feedback final_feedback: ver propias o admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "final_feedback: ver propias o admin" ON public.final_activity_feedback FOR SELECT USING (((public.fn_my_role() = 'admin'::public.user_role) OR (EXISTS ( SELECT 1
   FROM public.final_activity_submissions s
  WHERE ((s.id = final_activity_feedback.submission_id) AND (s.student_id = public.fn_clerk_user_id()))))));


--
-- Name: final_activity_submissions final_sub: admin gestiona; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "final_sub: admin gestiona" ON public.final_activity_submissions USING ((public.fn_my_role() = 'admin'::public.user_role));


--
-- Name: final_activity_submissions final_sub: alumna inserta; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "final_sub: alumna inserta" ON public.final_activity_submissions FOR INSERT WITH CHECK ((student_id = public.fn_clerk_user_id()));


--
-- Name: final_activity_submissions final_sub: ver propias o admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "final_sub: ver propias o admin" ON public.final_activity_submissions FOR SELECT USING (((student_id = public.fn_clerk_user_id()) OR (public.fn_my_role() = 'admin'::public.user_role)));


--
-- Name: historial_reservas historial: admin gestiona; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "historial: admin gestiona" ON public.historial_reservas USING ((public.fn_my_role() = 'admin'::public.user_role));


--
-- Name: historial_reservas historial: ver propio o admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "historial: ver propio o admin" ON public.historial_reservas FOR SELECT USING (((student_id = public.fn_clerk_user_id()) OR (public.fn_my_role() = 'admin'::public.user_role)));


--
-- Name: historial_reservas; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.historial_reservas ENABLE ROW LEVEL SECURITY;

--
-- Name: meeting_attendance_intents intents: admin gestiona; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "intents: admin gestiona" ON public.meeting_attendance_intents USING ((public.fn_my_role() = 'admin'::public.user_role));


--
-- Name: meeting_attendance_intents intents: alumna cancela; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "intents: alumna cancela" ON public.meeting_attendance_intents FOR DELETE USING ((student_id = public.fn_clerk_user_id()));


--
-- Name: meeting_attendance_intents intents: alumna registra; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "intents: alumna registra" ON public.meeting_attendance_intents FOR INSERT WITH CHECK ((student_id = public.fn_clerk_user_id()));


--
-- Name: meeting_attendance_intents intents: ver propias o admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "intents: ver propias o admin" ON public.meeting_attendance_intents FOR SELECT USING (((student_id = public.fn_clerk_user_id()) OR (public.fn_my_role() = 'admin'::public.user_role)));


--
-- Name: meeting_attendance_intents; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.meeting_attendance_intents ENABLE ROW LEVEL SECURITY;

--
-- Name: meetings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

--
-- Name: meetings meetings: admin gestiona; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "meetings: admin gestiona" ON public.meetings USING ((public.fn_my_role() = 'admin'::public.user_role));


--
-- Name: meetings meetings: ver autenticados; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "meetings: ver autenticados" ON public.meetings FOR SELECT USING ((public.fn_clerk_user_id() <> ''::text));


--
-- Name: module_assignments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.module_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: module_assignments module_assignments: admin gestiona; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "module_assignments: admin gestiona" ON public.module_assignments USING ((public.fn_my_role() = 'admin'::public.user_role));


--
-- Name: module_assignments module_assignments: ver con acceso o admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "module_assignments: ver con acceso o admin" ON public.module_assignments FOR SELECT USING (((public.fn_my_role() = 'admin'::public.user_role) OR (EXISTS ( SELECT 1
   FROM public.modules m
  WHERE ((m.id = module_assignments.module_id) AND public.fn_has_access_to_product(public.fn_clerk_user_id(), m.product_id))))));


--
-- Name: module_learning_resources; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.module_learning_resources ENABLE ROW LEVEL SECURITY;

--
-- Name: module_learning_resources module_learning_resources: admin gestiona; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "module_learning_resources: admin gestiona" ON public.module_learning_resources USING ((public.fn_my_role() = 'admin'::public.user_role));


--
-- Name: module_learning_resources module_learning_resources: ver con acceso o admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "module_learning_resources: ver con acceso o admin" ON public.module_learning_resources FOR SELECT USING (((public.fn_my_role() = 'admin'::public.user_role) OR (EXISTS ( SELECT 1
   FROM public.modules m
  WHERE ((m.id = module_learning_resources.module_id) AND public.fn_has_access_to_product(public.fn_clerk_user_id(), m.product_id))))));


--
-- Name: modules; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

--
-- Name: modules modules: admin gestiona; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "modules: admin gestiona" ON public.modules USING ((public.fn_my_role() = 'admin'::public.user_role));


--
-- Name: modules modules: ver con acceso o admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "modules: ver con acceso o admin" ON public.modules FOR SELECT USING (((public.fn_my_role() = 'admin'::public.user_role) OR public.fn_has_access_to_product(public.fn_clerk_user_id(), product_id)));


--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: orders orders: admin gestiona; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "orders: admin gestiona" ON public.orders USING ((public.fn_my_role() = 'admin'::public.user_role));


--
-- Name: orders orders: alumna crea; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "orders: alumna crea" ON public.orders FOR INSERT WITH CHECK ((student_id = public.fn_clerk_user_id()));


--
-- Name: orders orders: ver propias o admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "orders: ver propias o admin" ON public.orders FOR SELECT USING (((student_id = public.fn_clerk_user_id()) OR (public.fn_my_role() = 'admin'::public.user_role)));


--
-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

--
-- Name: payments payments: admin gestiona; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "payments: admin gestiona" ON public.payments USING ((public.fn_my_role() = 'admin'::public.user_role));


--
-- Name: payments payments: alumna inserta; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "payments: alumna inserta" ON public.payments FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = payments.order_id) AND (o.student_id = public.fn_clerk_user_id())))));


--
-- Name: payments payments: alumna sube comprobante; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "payments: alumna sube comprobante" ON public.payments FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = payments.order_id) AND (o.student_id = public.fn_clerk_user_id()))))) WITH CHECK ((status = 'awaiting_approval'::public.payment_status));


--
-- Name: payments payments: ver propias o admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "payments: ver propias o admin" ON public.payments FOR SELECT USING (((public.fn_my_role() = 'admin'::public.user_role) OR (EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = payments.order_id) AND (o.student_id = public.fn_clerk_user_id()))))));


--
-- Name: product_courses; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.product_courses ENABLE ROW LEVEL SECURITY;

--
-- Name: product_courses product_courses: admin gestiona; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "product_courses: admin gestiona" ON public.product_courses USING ((public.fn_my_role() = 'admin'::public.user_role));


--
-- Name: product_courses product_courses: ver siempre; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "product_courses: ver siempre" ON public.product_courses FOR SELECT USING (true);


--
-- Name: product_programs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.product_programs ENABLE ROW LEVEL SECURITY;

--
-- Name: product_programs product_programs: admin gestiona; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "product_programs: admin gestiona" ON public.product_programs USING ((public.fn_my_role() = 'admin'::public.user_role));


--
-- Name: product_programs product_programs: ver siempre; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "product_programs: ver siempre" ON public.product_programs FOR SELECT USING (true);


--
-- Name: product_workshops; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.product_workshops ENABLE ROW LEVEL SECURITY;

--
-- Name: product_workshops product_workshops: admin gestiona; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "product_workshops: admin gestiona" ON public.product_workshops USING ((public.fn_my_role() = 'admin'::public.user_role));


--
-- Name: product_workshops product_workshops: ver siempre; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "product_workshops: ver siempre" ON public.product_workshops FOR SELECT USING (true);


--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: products products: admin gestiona; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "products: admin gestiona" ON public.products USING ((public.fn_my_role() = 'admin'::public.user_role));


--
-- Name: products products: ver activos o admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "products: ver activos o admin" ON public.products FOR SELECT USING (((is_active = true) OR (public.fn_my_role() = 'admin'::public.user_role)));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles: actualizar propio; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "profiles: actualizar propio" ON public.profiles FOR UPDATE USING ((id = public.fn_clerk_user_id()));


--
-- Name: profiles profiles: admin gestiona; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "profiles: admin gestiona" ON public.profiles USING ((public.fn_my_role() = 'admin'::public.user_role));


--
-- Name: profiles profiles: ver propio o admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "profiles: ver propio o admin" ON public.profiles FOR SELECT USING (((id = public.fn_clerk_user_id()) OR (public.fn_my_role() = 'admin'::public.user_role)));


--
-- Name: program_included_products; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.program_included_products ENABLE ROW LEVEL SECURITY;

--
-- Name: program_included_products program_products: admin gestiona; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "program_products: admin gestiona" ON public.program_included_products USING ((public.fn_my_role() = 'admin'::public.user_role));


--
-- Name: program_included_products program_products: ver siempre; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "program_products: ver siempre" ON public.program_included_products FOR SELECT USING (true);


--
-- Name: student_module_progress progress: admin gestiona; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "progress: admin gestiona" ON public.student_module_progress USING ((public.fn_my_role() = 'admin'::public.user_role));


--
-- Name: student_module_progress progress: ver propio o admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "progress: ver propio o admin" ON public.student_module_progress FOR SELECT USING (((student_id = public.fn_clerk_user_id()) OR (public.fn_my_role() = 'admin'::public.user_role)));


--
-- Name: student_module_progress; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.student_module_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: assignment_submissions submissions: admin gestiona; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "submissions: admin gestiona" ON public.assignment_submissions USING ((public.fn_my_role() = 'admin'::public.user_role));


--
-- Name: assignment_submissions submissions: alumna inserta; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "submissions: alumna inserta" ON public.assignment_submissions FOR INSERT WITH CHECK ((student_id = public.fn_clerk_user_id()));


--
-- Name: assignment_submissions submissions: ver propias o admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "submissions: ver propias o admin" ON public.assignment_submissions FOR SELECT USING (((student_id = public.fn_clerk_user_id()) OR (public.fn_my_role() = 'admin'::public.user_role)));


--
-- Name: user_entitlements; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;

--
-- Name: workshop_learning_resources; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.workshop_learning_resources ENABLE ROW LEVEL SECURITY;

--
-- Name: workshop_learning_resources workshop_learning_resources: admin gestiona; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "workshop_learning_resources: admin gestiona" ON public.workshop_learning_resources USING ((public.fn_my_role() = 'admin'::public.user_role));


--
-- Name: workshop_learning_resources workshop_learning_resources: ver con acceso o admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "workshop_learning_resources: ver con acceso o admin" ON public.workshop_learning_resources FOR SELECT USING (((public.fn_my_role() = 'admin'::public.user_role) OR public.fn_has_access_to_product(public.fn_clerk_user_id(), product_id)));


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION fn_clerk_user_id(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_clerk_user_id() TO anon;
GRANT ALL ON FUNCTION public.fn_clerk_user_id() TO authenticated;
GRANT ALL ON FUNCTION public.fn_clerk_user_id() TO service_role;


--
-- Name: FUNCTION fn_decrement_session_for_booking(p_student_email text, p_cal_booking_id integer, p_cal_booking_uid text, p_scheduled_at timestamp with time zone, p_duration_minutes integer, p_raw_payload jsonb); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_decrement_session_for_booking(p_student_email text, p_cal_booking_id integer, p_cal_booking_uid text, p_scheduled_at timestamp with time zone, p_duration_minutes integer, p_raw_payload jsonb) TO anon;
GRANT ALL ON FUNCTION public.fn_decrement_session_for_booking(p_student_email text, p_cal_booking_id integer, p_cal_booking_uid text, p_scheduled_at timestamp with time zone, p_duration_minutes integer, p_raw_payload jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.fn_decrement_session_for_booking(p_student_email text, p_cal_booking_id integer, p_cal_booking_uid text, p_scheduled_at timestamp with time zone, p_duration_minutes integer, p_raw_payload jsonb) TO service_role;


--
-- Name: FUNCTION fn_expand_entitlements_on_enrollment(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_expand_entitlements_on_enrollment() TO anon;
GRANT ALL ON FUNCTION public.fn_expand_entitlements_on_enrollment() TO authenticated;
GRANT ALL ON FUNCTION public.fn_expand_entitlements_on_enrollment() TO service_role;


--
-- Name: FUNCTION fn_expire_enrollments(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_expire_enrollments() TO anon;
GRANT ALL ON FUNCTION public.fn_expire_enrollments() TO authenticated;
GRANT ALL ON FUNCTION public.fn_expire_enrollments() TO service_role;


--
-- Name: TABLE historial_reservas; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.historial_reservas TO anon;
GRANT ALL ON TABLE public.historial_reservas TO authenticated;
GRANT ALL ON TABLE public.historial_reservas TO service_role;


--
-- Name: FUNCTION fn_get_failed_cancellations(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_get_failed_cancellations() TO anon;
GRANT ALL ON FUNCTION public.fn_get_failed_cancellations() TO authenticated;
GRANT ALL ON FUNCTION public.fn_get_failed_cancellations() TO service_role;


--
-- Name: FUNCTION fn_get_meeting_intent_count(p_meeting_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_get_meeting_intent_count(p_meeting_id uuid) TO anon;
GRANT ALL ON FUNCTION public.fn_get_meeting_intent_count(p_meeting_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.fn_get_meeting_intent_count(p_meeting_id uuid) TO service_role;


--
-- Name: FUNCTION fn_has_access_to_product(p_user_id text, p_product_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_has_access_to_product(p_user_id text, p_product_id uuid) TO anon;
GRANT ALL ON FUNCTION public.fn_has_access_to_product(p_user_id text, p_product_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.fn_has_access_to_product(p_user_id text, p_product_id uuid) TO service_role;


--
-- Name: FUNCTION fn_my_role(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_my_role() TO anon;
GRANT ALL ON FUNCTION public.fn_my_role() TO authenticated;
GRANT ALL ON FUNCTION public.fn_my_role() TO service_role;


--
-- Name: FUNCTION fn_on_payment_completed(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_on_payment_completed() TO anon;
GRANT ALL ON FUNCTION public.fn_on_payment_completed() TO authenticated;
GRANT ALL ON FUNCTION public.fn_on_payment_completed() TO service_role;


--
-- Name: FUNCTION fn_set_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_set_updated_at() TO anon;
GRANT ALL ON FUNCTION public.fn_set_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.fn_set_updated_at() TO service_role;


--
-- Name: FUNCTION fn_unlock_first_module(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_unlock_first_module() TO anon;
GRANT ALL ON FUNCTION public.fn_unlock_first_module() TO authenticated;
GRANT ALL ON FUNCTION public.fn_unlock_first_module() TO service_role;


--
-- Name: FUNCTION fn_unlock_next_module_on_submit(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_unlock_next_module_on_submit() TO anon;
GRANT ALL ON FUNCTION public.fn_unlock_next_module_on_submit() TO authenticated;
GRANT ALL ON FUNCTION public.fn_unlock_next_module_on_submit() TO service_role;


--
-- Name: FUNCTION fn_update_final_submission_status(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_update_final_submission_status() TO anon;
GRANT ALL ON FUNCTION public.fn_update_final_submission_status() TO authenticated;
GRANT ALL ON FUNCTION public.fn_update_final_submission_status() TO service_role;


--
-- Name: FUNCTION fn_update_submission_status(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_update_submission_status() TO anon;
GRANT ALL ON FUNCTION public.fn_update_submission_status() TO authenticated;
GRANT ALL ON FUNCTION public.fn_update_submission_status() TO service_role;


--
-- Name: TABLE announcements; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.announcements TO anon;
GRANT ALL ON TABLE public.announcements TO authenticated;
GRANT ALL ON TABLE public.announcements TO service_role;


--
-- Name: TABLE assignment_feedback; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.assignment_feedback TO anon;
GRANT ALL ON TABLE public.assignment_feedback TO authenticated;
GRANT ALL ON TABLE public.assignment_feedback TO service_role;


--
-- Name: TABLE assignment_submissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.assignment_submissions TO anon;
GRANT ALL ON TABLE public.assignment_submissions TO authenticated;
GRANT ALL ON TABLE public.assignment_submissions TO service_role;


--
-- Name: TABLE enrollments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.enrollments TO anon;
GRANT ALL ON TABLE public.enrollments TO authenticated;
GRANT ALL ON TABLE public.enrollments TO service_role;


--
-- Name: TABLE final_activities; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.final_activities TO anon;
GRANT ALL ON TABLE public.final_activities TO authenticated;
GRANT ALL ON TABLE public.final_activities TO service_role;


--
-- Name: TABLE final_activity_feedback; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.final_activity_feedback TO anon;
GRANT ALL ON TABLE public.final_activity_feedback TO authenticated;
GRANT ALL ON TABLE public.final_activity_feedback TO service_role;


--
-- Name: TABLE final_activity_submissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.final_activity_submissions TO anon;
GRANT ALL ON TABLE public.final_activity_submissions TO authenticated;
GRANT ALL ON TABLE public.final_activity_submissions TO service_role;


--
-- Name: TABLE meeting_attendance_intents; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.meeting_attendance_intents TO anon;
GRANT ALL ON TABLE public.meeting_attendance_intents TO authenticated;
GRANT ALL ON TABLE public.meeting_attendance_intents TO service_role;


--
-- Name: TABLE meetings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.meetings TO anon;
GRANT ALL ON TABLE public.meetings TO authenticated;
GRANT ALL ON TABLE public.meetings TO service_role;


--
-- Name: TABLE module_assignments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.module_assignments TO anon;
GRANT ALL ON TABLE public.module_assignments TO authenticated;
GRANT ALL ON TABLE public.module_assignments TO service_role;


--
-- Name: TABLE module_learning_resources; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.module_learning_resources TO anon;
GRANT ALL ON TABLE public.module_learning_resources TO authenticated;
GRANT ALL ON TABLE public.module_learning_resources TO service_role;


--
-- Name: TABLE modules; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.modules TO anon;
GRANT ALL ON TABLE public.modules TO authenticated;
GRANT ALL ON TABLE public.modules TO service_role;


--
-- Name: TABLE orders; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.orders TO anon;
GRANT ALL ON TABLE public.orders TO authenticated;
GRANT ALL ON TABLE public.orders TO service_role;


--
-- Name: TABLE payments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payments TO anon;
GRANT ALL ON TABLE public.payments TO authenticated;
GRANT ALL ON TABLE public.payments TO service_role;


--
-- Name: TABLE product_courses; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.product_courses TO anon;
GRANT ALL ON TABLE public.product_courses TO authenticated;
GRANT ALL ON TABLE public.product_courses TO service_role;


--
-- Name: TABLE product_programs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.product_programs TO anon;
GRANT ALL ON TABLE public.product_programs TO authenticated;
GRANT ALL ON TABLE public.product_programs TO service_role;


--
-- Name: TABLE product_workshops; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.product_workshops TO anon;
GRANT ALL ON TABLE public.product_workshops TO authenticated;
GRANT ALL ON TABLE public.product_workshops TO service_role;


--
-- Name: TABLE products; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.products TO anon;
GRANT ALL ON TABLE public.products TO authenticated;
GRANT ALL ON TABLE public.products TO service_role;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: postgres
--
 
GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;


--
-- Name: TABLE program_included_products; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.program_included_products TO anon;
GRANT ALL ON TABLE public.program_included_products TO authenticated;
GRANT ALL ON TABLE public.program_included_products TO service_role;


--
-- Name: TABLE student_module_progress; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.student_module_progress TO anon;
GRANT ALL ON TABLE public.student_module_progress TO authenticated;
GRANT ALL ON TABLE public.student_module_progress TO service_role;


--
-- Name: TABLE user_entitlements; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_entitlements TO anon;
GRANT ALL ON TABLE public.user_entitlements TO authenticated;
GRANT ALL ON TABLE public.user_entitlements TO service_role;


--
-- Name: TABLE workshop_learning_resources; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.workshop_learning_resources TO anon;
GRANT ALL ON TABLE public.workshop_learning_resources TO authenticated;
GRANT ALL ON TABLE public.workshop_learning_resources TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict 6OkbS5WHvNf2nvCzPACltfTORpQklQMAc1WcUu5muRHff68YwPrxj2SZXmZ30q2

