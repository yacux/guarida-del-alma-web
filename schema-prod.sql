


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


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "storage";


ALTER SCHEMA "storage" OWNER TO "supabase_admin";


CREATE TYPE "public"."booking_status" AS ENUM (
    'scheduled',
    'completed',
    'cancelled',
    'no_show'
);


ALTER TYPE "public"."booking_status" OWNER TO "postgres";


CREATE TYPE "public"."cal_booking_status" AS ENUM (
    'confirmed',
    'rejected',
    'cancellation_failed',
    'cancelled_by_student',
    'completed',
    'no_show'
);


ALTER TYPE "public"."cal_booking_status" OWNER TO "postgres";


CREATE TYPE "public"."enrollment_source" AS ENUM (
    'payment_flow',
    'admin_direct'
);


ALTER TYPE "public"."enrollment_source" OWNER TO "postgres";


CREATE TYPE "public"."enrollment_status" AS ENUM (
    'active',
    'expired',
    'cancelled',
    'pending'
);


ALTER TYPE "public"."enrollment_status" OWNER TO "postgres";


CREATE TYPE "public"."meeting_type" AS ENUM (
    'monthly_course',
    'workshop_live',
    'program_exclusive',
    'individual_session'
);


ALTER TYPE "public"."meeting_type" OWNER TO "postgres";


CREATE TYPE "public"."order_status" AS ENUM (
    'pending_payment',
    'paid',
    'cancelled',
    'refunded'
);


ALTER TYPE "public"."order_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_method" AS ENUM (
    'mercadopago',
    'paypal',
    'bank_transfer',
    'western_union'
);


ALTER TYPE "public"."payment_method" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'completed',
    'failed',
    'cancelled',
    'refunded',
    'awaiting_approval'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."product_type" AS ENUM (
    'course',
    'workshop',
    'program'
);


ALTER TYPE "public"."product_type" OWNER TO "postgres";


CREATE TYPE "public"."submission_status" AS ENUM (
    'pending_review',
    'approved',
    'failed',
    'recovery_pending'
);


ALTER TYPE "public"."submission_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'student',
    'admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "storage"."buckettype" AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE "storage"."buckettype" OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "public"."fn_clerk_user_id"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT COALESCE(auth.jwt() ->> 'sub', '');
$$;


ALTER FUNCTION "public"."fn_clerk_user_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_decrement_session_for_booking"("p_student_email" "text", "p_cal_booking_id" integer, "p_cal_booking_uid" "text", "p_scheduled_at" timestamp with time zone, "p_duration_minutes" integer DEFAULT 60, "p_raw_payload" "jsonb" DEFAULT NULL::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."fn_decrement_session_for_booking"("p_student_email" "text", "p_cal_booking_id" integer, "p_cal_booking_uid" "text", "p_scheduled_at" timestamp with time zone, "p_duration_minutes" integer, "p_raw_payload" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."fn_decrement_session_for_booking"("p_student_email" "text", "p_cal_booking_id" integer, "p_cal_booking_uid" "text", "p_scheduled_at" timestamp with time zone, "p_duration_minutes" integer, "p_raw_payload" "jsonb") IS 'RPC atómica para procesar un BOOKING_CREATED de Cal.com. Usa FOR UPDATE para prevenir race conditions. Es idempotente: si el cal_booking_id ya existe, retorna el resultado anterior. Retorna JSONB: { success, reason?, enrollment_id?, sessions_remaining? }';



CREATE OR REPLACE FUNCTION "public"."fn_expand_entitlements_on_enrollment"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."fn_expand_entitlements_on_enrollment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_expire_enrollments"() RETURNS "void"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."fn_expire_enrollments"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."historial_reservas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cal_booking_id" integer NOT NULL,
    "cal_booking_uid" "text" NOT NULL,
    "student_id" "text",
    "student_email" "text" NOT NULL,
    "enrollment_id" "uuid",
    "scheduled_at" timestamp with time zone NOT NULL,
    "duration_minutes" integer DEFAULT 60 NOT NULL,
    "status" "public"."cal_booking_status" NOT NULL,
    "rejection_reason" "text",
    "cal_cancel_error" "text",
    "raw_payload" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."historial_reservas" OWNER TO "postgres";


COMMENT ON TABLE "public"."historial_reservas" IS 'Auditoría de cada reserva recibida desde Cal.com via webhook. Fuente de verdad para: qué sesiones ocurrieron, cuáles fueron rechazadas, y cuáles tuvieron error al cancelar en Cal.com.';



COMMENT ON COLUMN "public"."historial_reservas"."cal_booking_uid" IS 'UID de Cal.com. Se usa en POST /v1/bookings/{uid}/cancel para cancelar.';



COMMENT ON COLUMN "public"."historial_reservas"."cal_cancel_error" IS 'Mensaje de error si la llamada de cancelación a Cal.com falló. Revisar estas filas manualmente o con un cron de retry.';



COMMENT ON COLUMN "public"."historial_reservas"."raw_payload" IS 'Payload JSON crudo del webhook. Permite re-procesar eventos si es necesario.';



CREATE OR REPLACE FUNCTION "public"."fn_get_failed_cancellations"() RETURNS SETOF "public"."historial_reservas"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  -- Trae ordenados de más viejos a más nuevos todos los registros donde la API de Cal.com tiró error al intentar cancelar un turno sin créditos
  SELECT * FROM public.historial_reservas
  WHERE status = 'cancellation_failed'
  ORDER BY created_at ASC;
$$;


ALTER FUNCTION "public"."fn_get_failed_cancellations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_get_meeting_intent_count"("p_meeting_id" "uuid") RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  -- Cuenta cuántos alumnos hicieron click en "Voy a asistir" para una videollamada / taller en vivo
  SELECT COUNT(*)::INT FROM public.meeting_attendance_intents
  WHERE meeting_id = p_meeting_id;
$$;


ALTER FUNCTION "public"."fn_get_meeting_intent_count"("p_meeting_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_has_access_to_product"("p_user_id" "text", "p_product_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
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


ALTER FUNCTION "public"."fn_has_access_to_product"("p_user_id" "text", "p_product_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_my_role"() RETURNS "public"."user_role"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT role FROM public.profiles WHERE id = public.fn_clerk_user_id();
$$;


ALTER FUNCTION "public"."fn_my_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_on_payment_completed"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."fn_on_payment_completed"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN 
  -- 'NEW' es un registro especial que contiene los nuevos datos que se quieren guardar.
  -- Modificamos su columna 'updated_at' con la fecha/hora exacta de este milisegundo (NOW()).
  NEW.updated_at = NOW(); 
  
  -- Retornamos 'NEW' para que Postgres continúe con el guardado de la fila modificada.
  RETURN NEW; 
END;
$$;


ALTER FUNCTION "public"."fn_set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_unlock_first_module"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."fn_unlock_first_module"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_unlock_next_module_on_submit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."fn_unlock_next_module_on_submit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_update_final_submission_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."fn_update_final_submission_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_update_submission_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."fn_update_submission_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "storage"."allow_any_operation"("expected_operations" "text"[]) RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


ALTER FUNCTION "storage"."allow_any_operation"("expected_operations" "text"[]) OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."allow_only_operation"("expected_operation" "text") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


ALTER FUNCTION "storage"."allow_only_operation"("expected_operation" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."enforce_bucket_lifecycle_service_role"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog'
    AS $$
BEGIN
  IF current_user::text IS DISTINCT FROM TG_ARGV[0]
     AND (
       OLD.lifecycle_configuration IS DISTINCT FROM NEW.lifecycle_configuration
       OR OLD.lifecycle_configuration_generation IS DISTINCT FROM NEW.lifecycle_configuration_generation
     ) THEN
    -- AFTER runs only after caller RLS has accepted the proposed row. The API
    -- recognizes this specific error after rolling back its permission probe;
    -- direct non-service writes still fail and cannot persist the change.
    RAISE EXCEPTION 'bucket control columns may only be changed by the configured storage service role'
      USING ERRCODE = 'PST01',
            SCHEMA = TG_TABLE_SCHEMA,
            TABLE = TG_TABLE_NAME,
            CONSTRAINT = TG_NAME;
  END IF;

  RETURN NULL;
END;
$$;


ALTER FUNCTION "storage"."enforce_bucket_lifecycle_service_role"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."enforce_bucket_name_length"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION "storage"."enforce_bucket_name_length"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."extension"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Get the last path segment (the actual filename)
    SELECT _parts[array_length(_parts, 1)] INTO _filename;
    -- Extract extension: reverse, split on '.', then reverse again
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION "storage"."extension"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."filename"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    RETURN _parts[array_length(_parts, 1)];
END
$$;


ALTER FUNCTION "storage"."filename"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."foldername"("name" "text") RETURNS "text"[]
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION "storage"."foldername"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_common_prefix"("p_key" "text", "p_prefix" "text", "p_delimiter" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    AS $$
SELECT CASE
    WHEN p_delimiter <> ''
         AND position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(
        p_key,
        length(p_prefix)
            + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1))
            + length(p_delimiter) - 1
    )
    ELSE NULL
END;
$$;


ALTER FUNCTION "storage"."get_common_prefix"("p_key" "text", "p_prefix" "text", "p_delimiter" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_size_by_bucket"("noncurrent_versions" "text" DEFAULT 'include'::"text", "delete_markers" "text" DEFAULT 'include'::"text") RETURNS TABLE("size" bigint, "bucket_id" "text")
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    -- COALESCE first: NULL NOT IN (...) evaluates to NULL (not TRUE), so a
    -- bare NOT IN check silently leaves an explicit NULL argument unreset.
    noncurrent_versions := COALESCE(noncurrent_versions, 'include');
    delete_markers := COALESCE(delete_markers, 'include');
    IF noncurrent_versions NOT IN ('exclude', 'only', 'include') THEN
        noncurrent_versions := 'include';
    END IF;
    IF delete_markers NOT IN ('exclude', 'only', 'include') THEN
        delete_markers := 'include';
    END IF;

    return query
        select sum((metadata->>'size')::bigint)::bigint as size, obj.bucket_id
        from "storage".objects as obj
        where (noncurrent_versions != 'exclude' OR obj.archived_at IS NULL)
          and (noncurrent_versions != 'only' OR obj.archived_at IS NOT NULL)
          and (delete_markers != 'exclude' OR NOT obj.is_delete_marker)
          and (delete_markers != 'only' OR obj.is_delete_marker)
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION "storage"."get_size_by_bucket"("noncurrent_versions" "text", "delete_markers" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer DEFAULT 100, "next_key_token" "text" DEFAULT ''::"text", "next_upload_token" "text" DEFAULT ''::"text", "raw_prefix_param" "text" DEFAULT NULL::"text") RETURNS TABLE("key" "text", "id" "text", "created_at" timestamp with time zone)
    LANGUAGE "sql" STABLE
    AS $_$
WITH candidates AS (
    SELECT
        upload.key AS object_key,
        CASE
            WHEN position($3 IN substring(upload.key FROM length(coalesce($7, $2)) + 1)) > 0
            THEN left(
                upload.key,
                length(coalesce($7, $2))
                    + position($3 IN substring(upload.key FROM length(coalesce($7, $2)) + 1))
                    + length($3) - 1
            )
            ELSE upload.key
        END AS result_key,
        upload.id,
        upload.created_at,
        position($3 IN substring(upload.key FROM length(coalesce($7, $2)) + 1)) > 0 AS is_common_prefix
    FROM storage.s3_multipart_uploads AS upload
    WHERE upload.bucket_id = $1
      AND upload.key COLLATE "C" LIKE $2 || '%'
), filtered AS (
    SELECT candidate.*
    FROM candidates AS candidate
    WHERE $5 = ''
       OR candidate.result_key COLLATE "C" > $5
       OR (
           candidate.result_key COLLATE "C" = $5
           AND NOT candidate.is_common_prefix
           AND $6 <> ''
           -- A completed or aborted marker repeats the remaining same-key uploads.
           AND COALESCE(
               (candidate.created_at, candidate.id COLLATE "C") > (
                   SELECT marker.created_at, marker.id COLLATE "C"
                   FROM storage.s3_multipart_uploads AS marker
                   WHERE marker.bucket_id = $1
                     AND marker.key COLLATE "C" = $5
                     AND marker.id = $6
               ),
               TRUE
           )
       )
), ranked AS (
    SELECT
        filtered.*,
        row_number() OVER (
            PARTITION BY filtered.result_key COLLATE "C"
            ORDER BY filtered.created_at, filtered.id COLLATE "C"
        ) AS prefix_rank
    FROM filtered
)
SELECT ranked.result_key, ranked.id, ranked.created_at
FROM ranked
WHERE NOT ranked.is_common_prefix OR ranked.prefix_rank = 1
ORDER BY ranked.result_key COLLATE "C", ranked.created_at, ranked.id COLLATE "C"
LIMIT $4;
$_$;


ALTER FUNCTION "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "next_key_token" "text", "next_upload_token" "text", "raw_prefix_param" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."list_objects_with_delimiter"("_bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer DEFAULT 100, "start_after" "text" DEFAULT ''::"text", "next_token" "text" DEFAULT ''::"text", "sort_order" "text" DEFAULT 'asc'::"text", "noncurrent_versions" "text" DEFAULT 'exclude'::"text", "delete_markers" "text" DEFAULT 'exclude'::"text", "next_token_archived_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "next_token_version" "text" DEFAULT ''::"text") RETURNS TABLE("name" "text", "id" "uuid", "metadata" "jsonb", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "version" "text", "archived_at" timestamp with time zone, "is_delete_marker" boolean, "is_versioned" boolean)
    LANGUAGE "plpgsql" STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_start_relative TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;
    v_version_filter TEXT;

    -- true when noncurrent_versions can return >1 row per name; keeps them
    -- ordered most-recent-first and lets pagination resume mid-key
    v_multi_row BOOLEAN;
    v_name_order TEXT;
    v_exact_range_predicate TEXT;
    v_strict_range_predicate TEXT;
    v_inclusive_range_predicate TEXT;

    -- Seek state for the current name. archived_at is normalized to JavaScript's
    -- millisecond precision and version breaks ties within the same millisecond.
    -- Current rows use 'infinity'; NULL means no tiebreak has been established.
    v_next_seek TEXT;
    v_next_seek_at TIMESTAMPTZ;
    v_next_seek_version TEXT;
    v_next_seek_strict BOOLEAN := false;
    v_cursor_is_folder BOOLEAN;
    v_count INT := 0;
    v_previous_seek TEXT;
    v_previous_seek_at TIMESTAMPTZ;
    v_previous_seek_version TEXT;
    v_previous_count INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;
    v_batch_query_strict TEXT;
    v_delete_marker_peek_query TEXT;
    v_delete_marker_peek_query_strict TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);
    v_next_seek_at := NULL;
    v_next_seek_version := '';

    -- COALESCE first: NULL NOT IN (...) evaluates to NULL (not TRUE), so a
    -- bare NOT IN check silently leaves an explicit NULL argument unreset.
    noncurrent_versions := COALESCE(noncurrent_versions, 'exclude');
    delete_markers := COALESCE(delete_markers, 'exclude');
    IF noncurrent_versions NOT IN ('exclude', 'only', 'include') THEN
        noncurrent_versions := 'exclude';
    END IF;
    IF delete_markers NOT IN ('exclude', 'only', 'include') THEN
        delete_markers := 'exclude';
    END IF;

    v_multi_row := noncurrent_versions IN ('only', 'include');
    v_name_order := CASE WHEN v_is_asc THEN 'ASC' ELSE 'DESC' END;

    v_version_filter := '';
    IF noncurrent_versions = 'exclude' THEN
        v_version_filter := v_version_filter || ' AND o.archived_at IS NULL';
    ELSIF noncurrent_versions = 'only' THEN
        v_version_filter := v_version_filter || ' AND o.archived_at IS NOT NULL';
    END IF;
    IF delete_markers = 'exclude' THEN
        v_version_filter := v_version_filter || ' AND NOT o.is_delete_marker';
    ELSIF delete_markers = 'only' THEN
        v_version_filter := v_version_filter || ' AND o.is_delete_marker';
    END IF;

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Keep caller-provided cursors inside the requested prefix range.
    IF v_start <> '' AND v_upper_bound IS NOT NULL THEN
        IF v_is_asc THEN
            IF v_start COLLATE "C" < v_prefix COLLATE "C" THEN
                v_start := '';
            ELSIF v_start COLLATE "C" >= v_upper_bound COLLATE "C" THEN
                RETURN;
            END IF;
        ELSE
            IF v_start COLLATE "C" < v_prefix COLLATE "C" THEN
                RETURN;
            ELSIF v_start COLLATE "C" >= v_upper_bound COLLATE "C" THEN
                v_start := '';
            END IF;
        END IF;
    END IF;

    v_start_relative := substring(v_start FROM length(v_prefix) + 1);

    -- Direction affects only the indexed name range and its ordering. Cursor
    -- state transitions and within-key version ordering stay shared.
    IF v_is_asc THEN
        v_exact_range_predicate := 'TRUE';
        v_strict_range_predicate := 'o.name COLLATE "C" > $2';
        v_inclusive_range_predicate := 'o.name COLLATE "C" >= $2';
        IF v_upper_bound IS NOT NULL THEN
            v_exact_range_predicate := 'o.name COLLATE "C" < $3';
            v_strict_range_predicate := v_strict_range_predicate || ' AND o.name COLLATE "C" < $3';
            v_inclusive_range_predicate := v_inclusive_range_predicate || ' AND o.name COLLATE "C" < $3';
        END IF;
    ELSE
        v_exact_range_predicate := 'TRUE';
        v_strict_range_predicate := 'o.name COLLATE "C" < $2';
        v_inclusive_range_predicate := 'o.name COLLATE "C" < $2';
        IF v_prefix <> '' THEN
            v_exact_range_predicate := 'o.name COLLATE "C" >= $3';
            v_strict_range_predicate := v_strict_range_predicate || ' AND o.name COLLATE "C" >= $3';
            v_inclusive_range_predicate := v_inclusive_range_predicate || ' AND o.name COLLATE "C" >= $3';
        END IF;
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    -- The multi-row order matches the externally serialized cursor exactly:
    -- archived_at at millisecond precision, then version as the final tiebreak.
    --
    -- When v_multi_row, the seek is a keyset tuple comparison ("name > $2 OR
    -- (name = $2 AND tiebreak)") - Postgres won't split that OR into indexable
    -- form (confirmed even with fully literal values), so as one WHERE clause
    -- it forces a full bucket scan filtered row-by-row. Splitting it into two
    -- independently-indexable branches (exact name match with the tiebreak
    -- filter, vs. strictly-past names) combined with UNION ALL lets each
    -- branch keep name as a real index condition; the outer ORDER BY/LIMIT
    -- re-merges them into the same page the single query used to produce.
    IF v_multi_row THEN
        v_batch_query := format(
            $sql$
            SELECT *
            FROM (
                (
                    SELECT o.name, o.id, o.updated_at, o.created_at,
                           o.last_accessed_at, o.metadata, o.version,
                           o.archived_at, o.is_delete_marker, o.is_versioned
                    FROM storage.objects o
                    WHERE o.bucket_id = $1
                      AND o.name COLLATE "C" = $2
                      AND %s
                      AND NOT $7::boolean
                      AND (
                          $5::timestamptz IS NULL
                          OR COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) < $5
                          OR (
                              COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) = $5
                              AND COALESCE(o.version, '') > $6
                          )
                      )
                      %s
                    ORDER BY
                        COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC,
                        COALESCE(o.version, '') ASC
                    LIMIT $4
                )
                UNION ALL
                (
                    SELECT o.name, o.id, o.updated_at, o.created_at,
                           o.last_accessed_at, o.metadata, o.version,
                           o.archived_at, o.is_delete_marker, o.is_versioned
                    FROM storage.objects o
                    WHERE o.bucket_id = $1
                      AND %s
                      %s
                    ORDER BY
                        o.name COLLATE "C" %s,
                        COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC,
                        COALESCE(o.version, '') ASC
                    LIMIT $4
                )
            ) sub
            ORDER BY
                sub.name COLLATE "C" %s,
                COALESCE(date_trunc('milliseconds', sub.archived_at), 'infinity'::timestamptz) DESC,
                COALESCE(sub.version, '') ASC
            LIMIT $4
            $sql$,
            v_exact_range_predicate,
            v_version_filter,
            v_strict_range_predicate,
            v_version_filter,
            v_name_order,
            v_name_order
        );
    ELSE
        v_batch_query := format(
            $sql$
            SELECT o.name, o.id, o.updated_at, o.created_at,
                   o.last_accessed_at, o.metadata, o.version,
                   o.archived_at, o.is_delete_marker, o.is_versioned
            FROM storage.objects o
            WHERE o.bucket_id = $1
              AND %s
              %s
            ORDER BY o.name COLLATE "C" %s, o.archived_at DESC
            LIMIT $4
            $sql$,
            v_inclusive_range_predicate,
            v_version_filter,
            v_name_order
        );

        -- Strict counterpart of the query above: used once the single-row
        -- ASC batch advance (below) has left v_next_seek pointing at the
        -- last row already emitted, so an inclusive predicate would
        -- re-match it forever. Only single-row mode ever sets strict mode,
        -- so this variant is never needed when v_multi_row.
        v_batch_query_strict := format(
            $sql$
            SELECT o.name, o.id, o.updated_at, o.created_at,
                   o.last_accessed_at, o.metadata, o.version,
                   o.archived_at, o.is_delete_marker, o.is_versioned
            FROM storage.objects o
            WHERE o.bucket_id = $1
              AND %s
              %s
            ORDER BY o.name COLLATE "C" %s, o.archived_at DESC
            LIMIT $4
            $sql$,
            v_strict_range_predicate,
            v_version_filter,
            v_name_order
        );
    END IF;

    -- The static peek predicates cannot use the partial delete-marker index
    -- once PL/pgSQL switches to a generic plan because whether
    -- is_delete_marker is required remains parameter-dependent. Reuse the
    -- already-specialized batch query with a one-row limit for this sparse
    -- filter so the plan sees a literal `o.is_delete_marker` predicate.
    IF delete_markers = 'only' THEN
        v_delete_marker_peek_query :=
            'SELECT marker_page.name FROM (' || v_batch_query || ') marker_page LIMIT 1';
        IF NOT v_multi_row THEN
            v_delete_marker_peek_query_strict :=
                'SELECT marker_page.name FROM (' || v_batch_query_strict || ') marker_page LIMIT 1';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor performs one specialized initial seek so
            -- partial current-version and delete-marker indexes remain available.
            EXECUTE format(
                'SELECT o.name FROM storage.objects o WHERE o.bucket_id = $1%s%s ORDER BY o.name COLLATE "C" DESC LIMIT 1',
                CASE WHEN v_upper_bound IS NOT NULL
                    THEN ' AND o.name COLLATE "C" >= $2 AND o.name COLLATE "C" < $3'
                    ELSE ''
                END,
                v_version_filter
            )
            INTO v_next_seek
            USING _bucket_id, v_prefix, v_upper_bound;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Folder continuation tokens retain their trailing delimiter. A
        -- delimiter-less startAfter is always a literal key boundary.
        v_cursor_is_folder := delimiter_param <> ''
            AND v_start_relative <> ''
            AND right(v_start_relative, length(delimiter_param)) = delimiter_param;

        IF v_cursor_is_folder THEN
            v_next_seek := CASE
                WHEN right(v_start, length(delimiter_param)) = delimiter_param
                    THEN v_start
                ELSE v_start || delimiter_param
            END;
            IF v_is_asc THEN
                v_next_seek := left(v_next_seek, -1)
                    || chr(ascii(right(v_next_seek, 1)) + 1);
            END IF;
            v_next_seek_strict := NOT v_is_asc;
        ELSE
            -- leaf object: when v_multi_row, stay on v_start with the
            -- caller-supplied tiebreak so a page boundary mid-key resumes
            -- that key's remaining rows instead of skipping them. Truncate
            -- to milliseconds like every other v_next_seek_at assignment -
            -- harmless today since object.ts's cursor always round-trips
            -- through JS Date first, but this shouldn't rely on that.
            IF v_multi_row THEN
                v_next_seek := v_start;
                v_next_seek_at := date_trunc('milliseconds', next_token_archived_at);
                v_next_seek_version := coalesce(next_token_version, '');
                v_next_seek_strict := coalesce(next_token, '') = '';
            ELSIF v_is_asc THEN
                v_next_seek := v_start;
                v_next_seek_strict := true;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        v_previous_seek := v_next_seek;
        v_previous_seek_at := v_next_seek_at;
        v_previous_seek_version := v_next_seek_version;
        v_previous_count := v_count;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        -- v_multi_row is branched here (rather than folded into the WHERE
        -- clause as a bound parameter) so each concrete query keeps an
        -- unconditional seek predicate - once PL/pgSQL switches to its
        -- cached generic plan (after 5 calls), a parameter-gated
        -- "(NOT v_multi_row AND name >= $x) OR (v_multi_row AND ...)"
        -- predicate stops the planner from using name as an index
        -- condition at all, degrading every subsequent peek to a full
        -- index scan filtered row-by-row instead of a bounded range scan.
        -- v_multi_row's seek predicate is a keyset tuple comparison
        -- ("name > x OR (name = x AND tiebreak)") - Postgres does not
        -- split this OR into indexable form even with fully literal
        -- values, so it falls back to a full scan filtered row-by-row.
        -- Splitting it into two independently-indexable branches (exact
        -- name match with the tiebreak filter, vs. strictly-past name)
        -- combined with UNION ALL lets each branch keep name as a real
        -- index condition; the outer ORDER BY/LIMIT picks whichever of
        -- the (at most 2) rows sorts first.
        IF delete_markers = 'only' THEN
            EXECUTE CASE WHEN v_next_seek_strict AND NOT v_multi_row
                THEN v_delete_marker_peek_query_strict
                ELSE v_delete_marker_peek_query
            END
                INTO v_peek_name
                USING _bucket_id, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END,
                    1, v_next_seek_at, v_next_seek_version, v_next_seek_strict;
        ELSIF v_multi_row THEN
            IF v_is_asc THEN
                IF v_upper_bound IS NOT NULL THEN
                    SELECT sub.name INTO v_peek_name FROM (
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" = v_next_seek
                           AND o.name COLLATE "C" < v_upper_bound
                           AND NOT v_next_seek_strict
                           AND (v_next_seek_at IS NULL
                                OR COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) < v_next_seek_at
                                OR (COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) = v_next_seek_at
                                    AND COALESCE(o.version, '') > v_next_seek_version))
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC, COALESCE(o.version, '') ASC LIMIT 1)
                        UNION ALL
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" > v_next_seek AND o.name COLLATE "C" < v_upper_bound
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY o.name COLLATE "C" ASC LIMIT 1)
                    ) sub ORDER BY sub.name COLLATE "C" ASC LIMIT 1;
                ELSE
                    SELECT sub.name INTO v_peek_name FROM (
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" = v_next_seek
                           AND NOT v_next_seek_strict
                           AND (v_next_seek_at IS NULL
                                OR COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) < v_next_seek_at
                                OR (COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) = v_next_seek_at
                                    AND COALESCE(o.version, '') > v_next_seek_version))
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC, COALESCE(o.version, '') ASC LIMIT 1)
                        UNION ALL
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" > v_next_seek
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY o.name COLLATE "C" ASC LIMIT 1)
                    ) sub ORDER BY sub.name COLLATE "C" ASC LIMIT 1;
                END IF;
            ELSE
                IF v_upper_bound IS NOT NULL THEN
                    SELECT sub.name INTO v_peek_name FROM (
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" = v_next_seek
                           AND o.name COLLATE "C" >= v_prefix
                           AND NOT v_next_seek_strict
                           AND (v_next_seek_at IS NULL
                                OR COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) < v_next_seek_at
                                OR (COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) = v_next_seek_at
                                    AND COALESCE(o.version, '') > v_next_seek_version))
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC, COALESCE(o.version, '') ASC LIMIT 1)
                        UNION ALL
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY o.name COLLATE "C" DESC LIMIT 1)
                    ) sub ORDER BY sub.name COLLATE "C" DESC LIMIT 1;
                ELSE
                    SELECT sub.name INTO v_peek_name FROM (
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" = v_next_seek
                           AND NOT v_next_seek_strict
                           AND (v_next_seek_at IS NULL
                                OR COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) < v_next_seek_at
                                OR (COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) = v_next_seek_at
                                    AND COALESCE(o.version, '') > v_next_seek_version))
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC, COALESCE(o.version, '') ASC LIMIT 1)
                        UNION ALL
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY o.name COLLATE "C" DESC LIMIT 1)
                    ) sub ORDER BY sub.name COLLATE "C" DESC LIMIT 1;
                END IF;
            END IF;
        ELSE
            -- Single-row mode is always noncurrent_versions='exclude'. Keep
            -- this predicate literal so generic plans use the current index.
            IF v_is_asc THEN
                IF v_next_seek_strict AND v_upper_bound IS NOT NULL THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" > v_next_seek
                      AND o.name COLLATE "C" < v_upper_bound
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" ASC LIMIT 1;
                ELSIF v_next_seek_strict THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" > v_next_seek
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" ASC LIMIT 1;
                ELSIF v_upper_bound IS NOT NULL THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" >= v_next_seek
                      AND o.name COLLATE "C" < v_upper_bound
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" ASC LIMIT 1;
                ELSE
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" >= v_next_seek
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" ASC LIMIT 1;
                END IF;
            ELSE
                IF v_upper_bound IS NOT NULL THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" < v_next_seek
                      AND o.name COLLATE "C" >= v_prefix
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" DESC LIMIT 1;
                ELSE
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" < v_next_seek
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" DESC LIMIT 1;
                END IF;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := v_common_prefix;
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            version := NULL;
            archived_at := NULL;
            is_delete_marker := NULL;
            is_versioned := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1)
                    || chr(ascii(right(v_common_prefix, 1)) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
            v_next_seek_at := NULL;
            v_next_seek_version := '';
            v_next_seek_strict := NOT v_is_asc;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE CASE WHEN v_next_seek_strict AND NOT v_multi_row THEN v_batch_query_strict ELSE v_batch_query END
                USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size, v_next_seek_at, v_next_seek_version,
                v_next_seek_strict
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it. Reset
                    -- strict mode too it may have been set by an earlier
                    -- row in this same batch (see the single-row ASC advance
                    -- below), and v_next_seek here is the folder-triggering
                    -- row's own name, which the next peek must find inclusively.
                    v_next_seek := CASE
                        WHEN v_is_asc THEN v_current.name
                        ELSE v_current.name || delimiter_param
                    END;
                    v_next_seek_at := NULL;
                    v_next_seek_version := '';
                    v_next_seek_strict := false;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                version := v_current.version;
                archived_at := v_current.archived_at;
                is_delete_marker := v_current.is_delete_marker;
                is_versioned := v_current.is_versioned;
                RETURN NEXT;
                v_count := v_count + 1;

                -- when v_multi_row, stay on this name and record its
                -- archived_at as the new tiebreak so remaining rows for the
                -- same key are picked up before moving to the next name
                IF v_multi_row THEN
                    v_next_seek := v_current.name;
                    v_next_seek_at := COALESCE(date_trunc('milliseconds', v_current.archived_at), 'infinity'::timestamptz);
                    v_next_seek_version := COALESCE(v_current.version, '');
                    v_next_seek_strict := false;
                ELSIF v_is_asc THEN
                    -- Appending the delimiter as a fake lexical successor
                    -- would skip a real key like `name || '!'` (or any
                    -- character sorting below the delimiter), which sorts
                    -- between `name` and `name || delimiter`. Track the real
                    -- name and mark the next comparison strict instead.
                    v_next_seek := v_current.name;
                    v_next_seek_strict := true;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;

        IF v_count = v_previous_count
           AND v_next_seek IS NOT DISTINCT FROM v_previous_seek
           AND v_next_seek_at IS NOT DISTINCT FROM v_previous_seek_at
           AND v_next_seek_version IS NOT DISTINCT FROM v_previous_seek_version THEN
            RAISE EXCEPTION 'storage.list_objects_with_delimiter made no progress at seek (%, %, %)',
                v_next_seek, v_next_seek_at, v_next_seek_version;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION "storage"."list_objects_with_delimiter"("_bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "start_after" "text", "next_token" "text", "sort_order" "text", "noncurrent_versions" "text", "delete_markers" "text", "next_token_archived_at" timestamp with time zone, "next_token_version" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."operation"() RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION "storage"."operation"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."protect_bucket_control_columns"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  configuration_changed boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.lifecycle_configuration IS NOT NULL
       OR NEW.lifecycle_configuration_generation IS NOT NULL THEN
      IF NOT pg_has_role(current_user, TG_ARGV[0], 'MEMBER') THEN
        RAISE EXCEPTION 'only members of the configured storage service role may insert lifecycle policy state'
          USING ERRCODE = '42501',
                HINT = format(
                  'Insert with both lifecycle columns NULL and configure lifecycle through the Storage API afterward, or insert as a member of %I.',
                  TG_ARGV[0]
                );
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  configuration_changed =
    OLD.lifecycle_configuration IS DISTINCT FROM NEW.lifecycle_configuration
    OR OLD.lifecycle_configuration_generation IS DISTINCT FROM NEW.lifecycle_configuration_generation;

  IF NOT configuration_changed THEN
    RETURN NEW;
  END IF;

  IF NEW.type IS DISTINCT FROM 'STANDARD' THEN
    RAISE EXCEPTION 'bucket versioning and lifecycle controls require a Standard bucket'
      USING ERRCODE = '0A000';
  END IF;

  IF NEW.lifecycle_configuration IS NULL
     AND NEW.lifecycle_configuration_generation IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.lifecycle_configuration IS NULL
     OR NEW.lifecycle_configuration_generation IS NULL
     OR OLD.lifecycle_configuration IS NOT DISTINCT FROM NEW.lifecycle_configuration
     OR OLD.lifecycle_configuration_generation IS NOT DISTINCT FROM NEW.lifecycle_configuration_generation THEN
    RAISE EXCEPTION 'a changed lifecycle policy requires a new non-null generation'
      USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "storage"."protect_bucket_control_columns"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."protect_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "storage"."protect_delete"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "offsets" integer DEFAULT 0, "search" "text" DEFAULT ''::"text", "sortcolumn" "text" DEFAULT 'name'::"text", "sortorder" "text" DEFAULT 'asc'::"text", "noncurrent_versions" "text" DEFAULT 'exclude'::"text", "delete_markers" "text" DEFAULT 'exclude'::"text") RETURNS TABLE("name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb", "version" "text", "archived_at" timestamp with time zone, "is_delete_marker" boolean, "is_versioned" boolean)
    LANGUAGE "plpgsql" STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_prefix_len INT;
    v_prefix_start INT;
    v_combined_levels INT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;
    v_version_filter TEXT;
    v_multi_row BOOLEAN;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;
    v_delete_marker_peek_query TEXT;
    v_delete_marker_peek_query_strict TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_next_seek_at TIMESTAMPTZ;
    v_next_seek_version TEXT;
    v_next_seek_strict BOOLEAN := false;
    v_count INT := 0;
    v_skipped INT := 0;
    v_previous_seek TEXT;
    v_previous_seek_at TIMESTAMPTZ;
    v_previous_seek_version TEXT;
    v_previous_count INT;
    v_previous_skipped INT;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_prefix_len := length(coalesce(prefix, ''));
    v_prefix_start := coalesce(array_length(string_to_array(coalesce(prefix, ''), v_delimiter), 1), 1);
    v_combined_levels := coalesce(array_length(string_to_array(v_prefix, v_delimiter), 1), 1);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);
    v_next_seek_at := NULL;
    v_next_seek_version := '';

    -- COALESCE first: NULL NOT IN (...) evaluates to NULL (not TRUE), so a
    -- bare NOT IN check silently leaves an explicit NULL argument unreset.
    noncurrent_versions := COALESCE(noncurrent_versions, 'exclude');
    delete_markers := COALESCE(delete_markers, 'exclude');
    IF noncurrent_versions NOT IN ('exclude', 'only', 'include') THEN
        noncurrent_versions := 'exclude';
    END IF;
    IF delete_markers NOT IN ('exclude', 'only', 'include') THEN
        delete_markers := 'exclude';
    END IF;

    v_multi_row := noncurrent_versions IN ('only', 'include');

    v_version_filter := '';
    IF noncurrent_versions = 'exclude' THEN
        v_version_filter := v_version_filter || ' AND o.archived_at IS NULL';
    ELSIF noncurrent_versions = 'only' THEN
        v_version_filter := v_version_filter || ' AND o.archived_at IS NOT NULL';
    END IF;
    IF delete_markers = 'exclude' THEN
        v_version_filter := v_version_filter || ' AND NOT o.is_delete_marker';
    ELSIF delete_markers = 'only' THEN
        v_version_filter := v_version_filter || ' AND o.is_delete_marker';
    END IF;

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT array_to_string(path_tokens[$1:$2], '/') AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $3 || '%%'
                  AND bucket_id = $4
                  AND array_length(objects.path_tokens, 1) <> $2
                  AND ($7 != 'exclude' OR objects.archived_at IS NULL)
                  AND ($7 != 'only' OR objects.archived_at IS NOT NULL)
                  AND ($8 != 'exclude' OR NOT objects.is_delete_marker)
                  AND ($8 != 'only' OR objects.is_delete_marker)
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata,
                   NULL::text AS version,
                   NULL::timestamptz AS archived_at,
                   NULL::boolean AS is_delete_marker,
                   NULL::boolean AS is_versioned FROM folders)
            UNION ALL
            (SELECT array_to_string(path_tokens[$1:$2], '/') AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata,
                   version, archived_at, is_delete_marker, is_versioned
             FROM storage.objects
             WHERE objects.name ILIKE $3 || '%%'
               AND bucket_id = $4
               AND array_length(objects.path_tokens, 1) = $2
               AND ($7 != 'exclude' OR objects.archived_at IS NULL)
               AND ($7 != 'only' OR objects.archived_at IS NOT NULL)
               AND ($8 != 'exclude' OR NOT objects.is_delete_marker)
               AND ($8 != 'only' OR objects.is_delete_marker)
             -- name, then version, as tiebreaks so two versions of the same
             -- key tying on the sort column still sort deterministically
             ORDER BY %I %s, name COLLATE "C" %s, COALESCE(version, '') %s)
            LIMIT $5 OFFSET $6
            $sql$, v_sort_order, v_order_by, v_sort_order, v_sort_order, v_sort_order
        ) USING v_prefix_start, v_combined_levels, v_prefix, bucketname, v_limit, offsets, noncurrent_versions, delete_markers;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build a resume-safe batch query. The exact-name branch returns remaining
    -- versions after the current (archived_at, version) boundary; the strict
    -- name branch returns subsequent keys. UNION ALL keeps both predicates
    -- independently indexable.
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT * FROM (' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" = $2 AND ($5::timestamptz IS NULL OR COALESCE(o.archived_at, ''infinity''::timestamptz) < $5 OR (COALESCE(o.archived_at, ''infinity''::timestamptz) = $5 AND COALESCE(o.version, '''') > $6))' ||
                v_version_filter || ' ORDER BY COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4) UNION ALL ' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" > $2 AND lower(o.name) COLLATE "C" < $3' || v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" ASC, COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4)' ||
                ') sub ORDER BY lower(sub.name) COLLATE "C" ASC, COALESCE(sub.archived_at, ''infinity''::timestamptz) DESC, COALESCE(sub.version, '''') ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT * FROM (' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" = $2 AND ($5::timestamptz IS NULL OR COALESCE(o.archived_at, ''infinity''::timestamptz) < $5 OR (COALESCE(o.archived_at, ''infinity''::timestamptz) = $5 AND COALESCE(o.version, '''') > $6))' ||
                v_version_filter || ' ORDER BY COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4) UNION ALL ' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" > $2' || v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" ASC, COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4)' ||
                ') sub ORDER BY lower(sub.name) COLLATE "C" ASC, COALESCE(sub.archived_at, ''infinity''::timestamptz) DESC, COALESCE(sub.version, '''') ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT * FROM (' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" = $2 AND ($5::timestamptz IS NULL OR COALESCE(o.archived_at, ''infinity''::timestamptz) < $5 OR (COALESCE(o.archived_at, ''infinity''::timestamptz) = $5 AND COALESCE(o.version, '''') > $6))' ||
                v_version_filter || ' ORDER BY COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4) UNION ALL ' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 AND lower(o.name) COLLATE "C" >= $3' || v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" DESC, COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4)' ||
                ') sub ORDER BY lower(sub.name) COLLATE "C" DESC, COALESCE(sub.archived_at, ''infinity''::timestamptz) DESC, COALESCE(sub.version, '''') ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT * FROM (' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" = $2 AND ($5::timestamptz IS NULL OR COALESCE(o.archived_at, ''infinity''::timestamptz) < $5 OR (COALESCE(o.archived_at, ''infinity''::timestamptz) = $5 AND COALESCE(o.version, '''') > $6))' ||
                v_version_filter || ' ORDER BY COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4) UNION ALL ' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2' || v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" DESC, COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4)' ||
                ') sub ORDER BY lower(sub.name) COLLATE "C" DESC, COALESCE(sub.archived_at, ''infinity''::timestamptz) DESC, COALESCE(sub.version, '''') ASC LIMIT $4';
        END IF;
    END IF;

    -- Keep the delete-marker predicate literal so the cached generic
    -- plan can use idx_objects_delete_markers during the main-loop peek.
    IF delete_markers = 'only' THEN
        IF v_multi_row THEN
            v_delete_marker_peek_query :=
                'SELECT marker_page.name FROM (' || v_batch_query || ') marker_page LIMIT 1';
        ELSIF v_is_asc THEN
            -- Two separate literal query strings, not one gated by a bound
            -- boolean: folding "$n AND op1 OR NOT $n AND op2" into a single
            -- query defeats the generic plan's ability to push either
            -- comparison into the index. Branching in PL/pgSQL control flow
            -- instead keeps each query's index condition intact.
            v_delete_marker_peek_query :=
                'SELECT o.name FROM storage.objects o WHERE o.bucket_id = $1 ' ||
                'AND lower(o.name) COLLATE "C" >= $2' ||
                CASE WHEN v_upper_bound IS NOT NULL
                    THEN ' AND lower(o.name) COLLATE "C" < $3'
                    ELSE ''
                END ||
                v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1';
            -- Strict variant: used once the single-row ASC batch advance
            -- (below) has left v_next_seek pointing at the last row already
            -- emitted, so a plain >= would re-match it forever.
            v_delete_marker_peek_query_strict :=
                'SELECT o.name FROM storage.objects o WHERE o.bucket_id = $1 ' ||
                'AND lower(o.name) COLLATE "C" > $2' ||
                CASE WHEN v_upper_bound IS NOT NULL
                    THEN ' AND lower(o.name) COLLATE "C" < $3'
                    ELSE ''
                END ||
                v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1';
        ELSE
            v_delete_marker_peek_query :=
                'SELECT o.name FROM storage.objects o WHERE o.bucket_id = $1 ' ||
                'AND lower(o.name) COLLATE "C" < $2' ||
                CASE WHEN v_upper_bound IS NOT NULL
                    THEN ' AND lower(o.name) COLLATE "C" >= $3'
                    ELSE ''
                END ||
                v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC performs one specialized initial seek so partial current-version
        -- and delete-marker indexes remain available.
        EXECUTE format(
            'SELECT o.name FROM storage.objects o WHERE o.bucket_id = $1%s%s ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1',
            CASE WHEN v_upper_bound IS NOT NULL
                THEN ' AND lower(o.name) COLLATE "C" >= $2 AND lower(o.name) COLLATE "C" < $3'
                ELSE ''
            END,
            v_version_filter
        )
        INTO v_peek_name
        USING bucketname, v_prefix_lower, v_upper_bound;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch and
    -- the delete-marker-only path
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        v_previous_seek := v_next_seek;
        v_previous_seek_at := v_next_seek_at;
        v_previous_seek_version := v_next_seek_version;
        v_previous_count := v_count;
        v_previous_skipped := v_skipped;

        -- STEP 1: PEEK
        v_peek_name := NULL;
        IF delete_markers = 'only' THEN
            EXECUTE CASE WHEN v_next_seek_strict
                THEN v_delete_marker_peek_query_strict
                ELSE v_delete_marker_peek_query
            END
                INTO v_peek_name
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END,
                    1, v_next_seek_at, v_next_seek_version;
        ELSIF v_multi_row AND v_next_seek_at IS NOT NULL THEN
            SELECT o.name INTO v_peek_name
            FROM storage.objects o
            WHERE o.bucket_id = bucketname
              AND lower(o.name) COLLATE "C" = v_next_seek
              AND (COALESCE(o.archived_at, 'infinity'::timestamptz) < v_next_seek_at
                   OR (COALESCE(o.archived_at, 'infinity'::timestamptz) = v_next_seek_at
                       AND COALESCE(o.version, '') > v_next_seek_version))
              AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
              AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
              AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
              AND (delete_markers != 'only' OR o.is_delete_marker)
            ORDER BY COALESCE(o.archived_at, 'infinity'::timestamptz) DESC,
                     COALESCE(o.version, '') ASC
            LIMIT 1;

            -- The current key is exhausted. Clear its version boundary and
            -- make the following ASC name peek strict. Appending '/' is not a
            -- valid lexical successor because keys ending in characters such
            -- as '!' sort between the exhausted name and name || '/'.
            IF v_peek_name IS NULL THEN
                IF v_is_asc THEN
                    v_next_seek_strict := true;
                END IF;
                v_next_seek_at := NULL;
                v_next_seek_version := '';
            END IF;
        END IF;

        -- Single-row mode is always noncurrent_versions='exclude'. Keep the
        -- current-row predicate literal so generic plans use the current index.
        IF delete_markers != 'only' AND v_peek_name IS NULL AND NOT v_multi_row THEN
            IF v_is_asc THEN
                IF v_next_seek_strict AND v_upper_bound IS NOT NULL THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" > v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                    ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
                ELSIF v_next_seek_strict THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" > v_next_seek
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                    ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
                ELSIF v_upper_bound IS NOT NULL THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                    ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
                ELSE
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                    ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
                END IF;
            ELSIF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                  AND o.archived_at IS NULL
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                  AND o.archived_at IS NULL
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        ELSIF delete_markers != 'only' AND v_peek_name IS NULL AND v_is_asc THEN
            IF v_next_seek_strict AND v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" > v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSIF v_next_seek_strict THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" > v_next_seek
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSIF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSIF delete_markers != 'only' AND v_peek_name IS NULL THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- If the peek landed on a different key than we were tracking, any
        -- version boundary belongs to the OLD key and must not leak into the
        -- new one - e.g. the deleteMarkers='only' peek doesn't know or care
        -- whether it's continuing the same key or jumping to a new one, so
        -- it never clears these itself.
        IF lower(v_peek_name) IS DISTINCT FROM v_next_seek THEN
            v_next_seek_at := NULL;
            v_next_seek_version := '';
        END IF;

        -- The peek is authoritative for the next key to process. This is
        -- especially important after exhausting a multi-version key: the
        -- version boundary has been cleared, so executing the batch against
        -- a stale v_next_seek would replay every version of that old key.
        v_next_seek := lower(v_peek_name);
        v_next_seek_strict := false;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := substring(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter) from v_prefix_len + 1);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                version := NULL;
                archived_at := NULL;
                is_delete_marker := NULL;
                is_versioned := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
            v_next_seek_at := NULL;
            v_next_seek_version := '';
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size,
                    v_next_seek_at, v_next_seek_version
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it. Reset
                    -- strict mode too - it may have been set by an earlier
                    -- row in this same batch (see the single-row ASC advance
                    -- below), and v_next_seek here is the folder-triggering
                    -- row's own name, which the next peek must find inclusively.
                    v_next_seek := CASE
                        WHEN v_is_asc THEN lower(v_current.name)
                        ELSE lower(v_current.name) || v_delimiter
                    END;
                    v_next_seek_at := NULL;
                    v_next_seek_version := '';
                    v_next_seek_strict := false;
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := substring(v_current.name from v_prefix_len + 1);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    version := v_current.version;
                    archived_at := v_current.archived_at;
                    is_delete_marker := v_current.is_delete_marker;
                    is_versioned := v_current.is_versioned;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Multi-row mode must remain on this key until all of its
                -- versions have crossed the internal batch boundary.
                IF v_multi_row THEN
                    v_next_seek := lower(v_current.name);
                    v_next_seek_at := COALESCE(v_current.archived_at, 'infinity'::timestamptz);
                    v_next_seek_version := COALESCE(v_current.version, '');
                ELSIF v_is_asc THEN
                    -- Appending the delimiter as a fake lexical successor would
                    -- skip a real key like `name || '!'` (or any character
                    -- sorting below the delimiter), which sorts between `name`
                    -- and `name || delimiter`. Track the real name and mark the
                    -- next comparison strict instead - same fix as the
                    -- exhausted-key case above.
                    v_next_seek := lower(v_current.name);
                    v_next_seek_strict := true;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;

        IF v_count = v_previous_count
           AND v_skipped = v_previous_skipped
           AND v_next_seek IS NOT DISTINCT FROM v_previous_seek
           AND v_next_seek_at IS NOT DISTINCT FROM v_previous_seek_at
           AND v_next_seek_version IS NOT DISTINCT FROM v_previous_seek_version THEN
            RAISE EXCEPTION 'storage.search made no progress at seek (%, %, %)',
                v_next_seek, v_next_seek_at, v_next_seek_version;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text", "noncurrent_versions" "text", "delete_markers" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search_by_timestamp"("p_prefix" "text", "p_bucket_id" "text", "p_limit" integer, "p_level" integer, "p_start_after" "text", "p_sort_order" "text", "p_sort_column" "text", "p_sort_column_after" "text", "noncurrent_versions" "text" DEFAULT 'exclude'::"text", "delete_markers" "text" DEFAULT 'exclude'::"text", "p_start_after_version" "text" DEFAULT ''::"text") RETURNS TABLE("key" "text", "name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb", "version" "text", "archived_at" timestamp with time zone, "is_delete_marker" boolean, "is_versioned" boolean)
    LANGUAGE "plpgsql" STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
    v_prefix_pattern text;
    v_sort_order text;
    v_sort_column text;
    v_version_tiebreak text;
BEGIN
    v_prefix := coalesce(p_prefix, '');
    -- Keep the raw prefix for common-prefix calculations and escape only LIKE metacharacters.
    v_prefix_pattern := replace(v_prefix, chr(92), chr(92) || chr(92));
    v_prefix_pattern := replace(v_prefix_pattern, '%', chr(92) || '%');
    v_prefix_pattern := replace(v_prefix_pattern, '_', chr(92) || '_');

    -- COALESCE first: NULL NOT IN (...) evaluates to NULL (not TRUE), so a
    -- bare NOT IN check silently leaves an explicit NULL argument unreset.
    noncurrent_versions := COALESCE(noncurrent_versions, 'exclude');
    delete_markers := COALESCE(delete_markers, 'exclude');
    IF noncurrent_versions NOT IN ('exclude', 'only', 'include') THEN
        noncurrent_versions := 'exclude';
    END IF;
    IF delete_markers NOT IN ('exclude', 'only', 'include') THEN
        delete_markers := 'exclude';
    END IF;

    -- $9 is only populated in multi-row mode; it's always '' otherwise, so
    -- only use each row's real version as a tiebreak in multi-row mode.
    v_version_tiebreak := CASE WHEN noncurrent_versions IN ('only', 'include') THEN 'COALESCE(version, '''')' ELSE '''''' END;

    -- Defense-in-depth: this function is independently reachable and must
    -- not trust p_sort_order/p_sort_column to already be validated by a
    -- caller. Normalize to the same strict allow-list storage.search_v2
    -- uses before interpolating anything into dynamic SQL below.
    v_sort_order := lower(coalesce(p_sort_order, 'asc'));
    IF v_sort_order NOT IN ('asc', 'desc') THEN
        v_sort_order := 'asc';
    END IF;

    v_sort_column := lower(coalesce(p_sort_column, 'updated_at'));
    IF v_sort_column NOT IN ('updated_at', 'created_at') THEN
        v_sort_column := 'updated_at';
    END IF;

    IF v_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                o.version AS obj_version,
                o.archived_at AS obj_archived_at,
                o.is_delete_marker AS obj_is_delete_marker,
                o.is_versioned AS obj_is_versioned,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $10 || '%%'
              AND ($7 != 'exclude' OR o.archived_at IS NULL)
              AND ($7 != 'only' OR o.archived_at IS NOT NULL)
              AND ($8 != 'exclude' OR NOT o.is_delete_marker)
              AND ($8 != 'only' OR o.is_delete_marker)
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                common_prefix AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                NULL::text AS version,
                NULL::timestamptz AS archived_at,
                NULL::boolean AS is_delete_marker,
                NULL::boolean AS is_versioned,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                obj_version AS version,
                obj_archived_at AS archived_at,
                obj_is_delete_marker AS is_delete_marker,
                obj_is_versioned AS is_versioned,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz),
                    name COLLATE "C",
                    %s
                ) %s ROW(
                    -- truncated the same way as the stored value above
                    date_trunc('milliseconds', COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz)),
                    $5,
                    $9
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata,
            version,
            archived_at,
            is_delete_marker,
            is_versioned
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s,
            COALESCE(version, '') %s
        LIMIT $4
    $sql$,
        v_sort_column,
        v_version_tiebreak,
        v_cursor_op,
        v_sort_column,
        v_sort_order,
        v_sort_order,
        v_sort_order
    );

    -- version is the third tiebreak component for two versions of the same
    -- key tying on both timestamp and name (see filtered CTE / ORDER BY above)
    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after, noncurrent_versions, delete_markers, coalesce(p_start_after_version, ''), v_prefix_pattern;
END;
$_$;


ALTER FUNCTION "storage"."search_by_timestamp"("p_prefix" "text", "p_bucket_id" "text", "p_limit" integer, "p_level" integer, "p_start_after" "text", "p_sort_order" "text", "p_sort_column" "text", "p_sort_column_after" "text", "noncurrent_versions" "text", "delete_markers" "text", "p_start_after_version" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search_v2"("prefix" "text", "bucket_name" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "start_after" "text" DEFAULT ''::"text", "sort_order" "text" DEFAULT 'asc'::"text", "sort_column" "text" DEFAULT 'name'::"text", "sort_column_after" "text" DEFAULT ''::"text", "noncurrent_versions" "text" DEFAULT 'exclude'::"text", "delete_markers" "text" DEFAULT 'exclude'::"text", "start_after_archived_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "start_after_version" "text" DEFAULT ''::"text", "start_after_is_continuation" boolean DEFAULT false) RETURNS TABLE("key" "text", "name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb", "version" "text", "archived_at" timestamp with time zone, "is_delete_marker" boolean, "is_versioned" boolean)
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata,
            l.version,
            l.archived_at,
            l.is_delete_marker,
            l.is_versioned
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            CASE WHEN start_after_is_continuation THEN '' ELSE start_after END,
            CASE WHEN start_after_is_continuation THEN start_after ELSE '' END,
            v_sort_ord,
            noncurrent_versions,
            delete_markers,
            start_after_archived_at,
            start_after_version
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after,
            noncurrent_versions, delete_markers, start_after_version
        );
    END IF;
END;
$$;


ALTER FUNCTION "storage"."search_v2"("prefix" "text", "bucket_name" "text", "limits" integer, "levels" integer, "start_after" "text", "sort_order" "text", "sort_column" "text", "sort_column_after" "text", "noncurrent_versions" "text", "delete_markers" "text", "start_after_archived_at" timestamp with time zone, "start_after_version" "text", "start_after_is_continuation" boolean) OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION "storage"."update_updated_at_column"() OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "public"."announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid",
    "meeting_id" "uuid",
    "author_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "is_pinned" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."announcements" OWNER TO "postgres";


COMMENT ON COLUMN "public"."announcements"."product_id" IS 'NULL = global de plataforma. Con valor = foro del producto específico.';



COMMENT ON COLUMN "public"."announcements"."meeting_id" IS 'Vincula el anuncio a la reunión que se está comunicando.';



CREATE TABLE IF NOT EXISTS "public"."assignment_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "submission_id" "uuid" NOT NULL,
    "reviewer_id" "text" NOT NULL,
    "feedback_text" "text",
    "score" integer NOT NULL,
    "is_approved" boolean NOT NULL,
    "reviewed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "assignment_feedback_score_check" CHECK ((("score" >= 1) AND ("score" <= 100)))
);


ALTER TABLE "public"."assignment_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assignment_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assignment_id" "uuid" NOT NULL,
    "student_id" "text" NOT NULL,
    "enrollment_id" "uuid" NOT NULL,
    "attempt_number" integer DEFAULT 1 NOT NULL,
    "answers" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "public"."submission_status" DEFAULT 'pending_review'::"public"."submission_status" NOT NULL,
    CONSTRAINT "assignment_submissions_attempt_number_check" CHECK (("attempt_number" >= 1)),
    CONSTRAINT "valid_answers" CHECK (("jsonb_typeof"("answers") = 'array'::"text"))
);


ALTER TABLE "public"."assignment_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."enrollments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "text" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "order_id" "uuid",
    "source" "public"."enrollment_source" DEFAULT 'payment_flow'::"public"."enrollment_source" NOT NULL,
    "enrolled_by" "text",
    "status" "public"."enrollment_status" DEFAULT 'active'::"public"."enrollment_status" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "sessions_total" integer DEFAULT 0 NOT NULL,
    "sessions_used" integer DEFAULT 0 NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "admin_direct_needs_enrolled_by" CHECK ((("source" <> 'admin_direct'::"public"."enrollment_source") OR ("enrolled_by" IS NOT NULL))),
    CONSTRAINT "enrollments_sessions_total_check" CHECK (("sessions_total" >= 0)),
    CONSTRAINT "enrollments_sessions_used_check" CHECK (("sessions_used" >= 0)),
    CONSTRAINT "expires_after_start" CHECK (("expires_at" > "started_at")),
    CONSTRAINT "payment_flow_needs_order" CHECK ((("source" <> 'payment_flow'::"public"."enrollment_source") OR ("order_id" IS NOT NULL))),
    CONSTRAINT "sessions_not_exceed" CHECK (("sessions_used" <= "sessions_total"))
);


ALTER TABLE "public"."enrollments" OWNER TO "postgres";


COMMENT ON TABLE "public"."enrollments" IS 'Registro de qué producto adquirió (o fue habilitado a) cada alumna. Al crearse, el trigger fn_expand_entitlements genera los accesos efectivos.';



COMMENT ON COLUMN "public"."enrollments"."order_id" IS 'NULL si source = "admin_direct". FK real a orders si source = "payment_flow".';



COMMENT ON COLUMN "public"."enrollments"."enrolled_by" IS 'Clerk ID de Hebe cuando source = "admin_direct". NULL en el flujo de pago normal.';



COMMENT ON COLUMN "public"."enrollments"."expires_at" IS 'Sellado al momento de la compra. Para programas, usa la duración del programa, no la de los productos incluidos.';



CREATE TABLE IF NOT EXISTS "public"."final_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."final_activities" OWNER TO "postgres";


COMMENT ON TABLE "public"."final_activities" IS 'Representa que un curso tiene una actividad final evaluable. La consigna vive en un PDF del curso, no se duplica en la DB. Las entregas viven en final_activity_submissions.';



CREATE TABLE IF NOT EXISTS "public"."final_activity_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "submission_id" "uuid" NOT NULL,
    "reviewer_id" "text" NOT NULL,
    "feedback_text" "text",
    "score" integer NOT NULL,
    "is_approved" boolean NOT NULL,
    "reviewed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "final_activity_feedback_score_check" CHECK ((("score" >= 1) AND ("score" <= 100)))
);


ALTER TABLE "public"."final_activity_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."final_activity_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "final_activity_id" "uuid" NOT NULL,
    "student_id" "text" NOT NULL,
    "enrollment_id" "uuid" NOT NULL,
    "attempt_number" integer DEFAULT 1 NOT NULL,
    "answers" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "public"."submission_status" DEFAULT 'pending_review'::"public"."submission_status" NOT NULL,
    CONSTRAINT "final_activity_submissions_attempt_number_check" CHECK (("attempt_number" >= 1)),
    CONSTRAINT "valid_answers" CHECK (("jsonb_typeof"("answers") = 'array'::"text"))
);


ALTER TABLE "public"."final_activity_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meeting_attendance_intents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "meeting_id" "uuid" NOT NULL,
    "student_id" "text" NOT NULL,
    "intent_registered_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "attended" boolean
);


ALTER TABLE "public"."meeting_attendance_intents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meetings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid",
    "meeting_type" "public"."meeting_type" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "scheduled_at" timestamp with time zone NOT NULL,
    "duration_minutes" integer,
    "meeting_url" "text",
    "recording_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "meetings_duration_minutes_check" CHECK (("duration_minutes" > 0))
);


ALTER TABLE "public"."meetings" OWNER TO "postgres";


COMMENT ON TABLE "public"."meetings" IS 'Reuniones virtuales. Abiertas a todos los matriculados del producto. La intención de asistencia se registra en meeting_attendance_intents.';



COMMENT ON COLUMN "public"."meetings"."recording_url" IS 'URL de la grabación. Se carga post-reunión. Disponible para quienes no asistieron.';



CREATE TABLE IF NOT EXISTS "public"."module_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "module_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."module_assignments" OWNER TO "postgres";


COMMENT ON TABLE "public"."module_assignments" IS 'Representa que un módulo tiene una tarea evaluable. La consigna vive en el PDF obligatorio del módulo.';



CREATE TABLE IF NOT EXISTS "public"."module_learning_resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "module_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "resource_type" "text" NOT NULL,
    "url" "text",
    "duration_seconds" integer,
    "order_index" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "storage_path" "text",
    CONSTRAINT "module_learning_resources_duration_seconds_check" CHECK (("duration_seconds" > 0)),
    CONSTRAINT "module_learning_resources_order_index_check" CHECK (("order_index" >= 0)),
    CONSTRAINT "valid_resource_location" CHECK (((("resource_type" = 'video'::"text") AND ("url" IS NOT NULL) AND ("storage_path" IS NULL)) OR (("resource_type" = ANY (ARRAY['pdf'::"text", 'audio'::"text"])) AND ("storage_path" IS NOT NULL) AND ("url" IS NULL)))),
    CONSTRAINT "valid_resource_type" CHECK (("resource_type" = ANY (ARRAY['video'::"text", 'pdf'::"text", 'audio'::"text"])))
);


ALTER TABLE "public"."module_learning_resources" OWNER TO "postgres";


COMMENT ON TABLE "public"."module_learning_resources" IS 'Recursos multimedia de un módulo de curso. Reemplaza module_videos + content_pdf_url. resource_type = TEXT para agregar nuevos tipos sin migrar la DB.';



COMMENT ON COLUMN "public"."module_learning_resources"."resource_type" IS 'Tipo de recurso. Valores: video | pdf | audio | download | external_link. Para agregar un nuevo tipo, actualizar solo el CHECK constraint.';



COMMENT ON COLUMN "public"."module_learning_resources"."storage_path" IS 'Path del objeto en el bucket learning-resources. Ej: courses/amor-propio/modules/1/guia.pdf. NULL para recursos de tipo video (usan url externa).';



CREATE TABLE IF NOT EXISTS "public"."modules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "order_index" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "modules_order_index_check" CHECK (("order_index" >= 0))
);


ALTER TABLE "public"."modules" OWNER TO "postgres";


COMMENT ON COLUMN "public"."modules"."order_index" IS 'Posición del módulo en el curso. Empieza en 0.';



CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "text" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "status" "public"."order_status" DEFAULT 'pending_payment'::"public"."order_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "orders_amount_check" CHECK (("amount" >= (0)::numeric))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "method" "public"."payment_method" NOT NULL,
    "status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "external_id" "text",
    "external_status" "text",
    "webhook_payload" "jsonb",
    "proof_url" "text",
    "proof_uploaded_at" timestamp with time zone,
    "approved_by" "text",
    "approved_at" timestamp with time zone,
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "payments_amount_check" CHECK (("amount" >= (0)::numeric))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


COMMENT ON COLUMN "public"."payments"."external_id" IS 'MercadoPago: preference_id. PayPal: order_id. NULL para métodos manuales.';



COMMENT ON COLUMN "public"."payments"."proof_url" IS 'Comprobante subido por la alumna. Solo métodos manuales.';



COMMENT ON COLUMN "public"."payments"."approved_by" IS 'Clerk ID de Hebe al aprobar/rechazar un comprobante manual.';



CREATE TABLE IF NOT EXISTS "public"."product_courses" (
    "product_id" "uuid" NOT NULL,
    "access_duration_months" integer NOT NULL,
    "grants_certificate" boolean DEFAULT true NOT NULL,
    "approval_min_score" integer DEFAULT 60 NOT NULL,
    CONSTRAINT "product_courses_access_duration_months_check" CHECK (("access_duration_months" > 0)),
    CONSTRAINT "product_courses_approval_min_score_check" CHECK ((("approval_min_score" >= 1) AND ("approval_min_score" <= 100)))
);


ALTER TABLE "public"."product_courses" OWNER TO "postgres";


COMMENT ON TABLE "public"."product_courses" IS 'Metadatos de cursos modulares. Otorgan certificado.';



COMMENT ON COLUMN "public"."product_courses"."approval_min_score" IS 'Puntaje mínimo (1-100) para considerar una entrega como aprobada.';



CREATE TABLE IF NOT EXISTS "public"."product_programs" (
    "product_id" "uuid" NOT NULL,
    "access_duration_months" integer NOT NULL,
    "individual_sessions_count" integer DEFAULT 0 NOT NULL,
    "grants_certificate" boolean DEFAULT false NOT NULL,
    "approval_min_score" integer DEFAULT 60 NOT NULL,
    CONSTRAINT "product_programs_access_duration_months_check" CHECK (("access_duration_months" > 0)),
    CONSTRAINT "product_programs_approval_min_score_check" CHECK ((("approval_min_score" >= 1) AND ("approval_min_score" <= 100))),
    CONSTRAINT "product_programs_individual_sessions_count_check" CHECK (("individual_sessions_count" >= 0))
);


ALTER TABLE "public"."product_programs" OWNER TO "postgres";


COMMENT ON TABLE "public"."product_programs" IS 'Metadatos de programas bundle. Ave Fénix (12m, 12 sesiones), Flor de Loto (6m, 6 sesiones).';



COMMENT ON COLUMN "public"."product_programs"."individual_sessions_count" IS 'Total de sesiones 1-on-1 otorgadas. 12 (Ave Fénix) o 6 (Flor de Loto).';



CREATE TABLE IF NOT EXISTS "public"."product_workshops" (
    "product_id" "uuid" NOT NULL,
    "access_duration_months" integer DEFAULT 3 NOT NULL,
    CONSTRAINT "product_workshops_access_duration_months_check" CHECK (("access_duration_months" > 0))
);


ALTER TABLE "public"."product_workshops" OWNER TO "postgres";


COMMENT ON TABLE "public"."product_workshops" IS 'Metadatos de talleres planos. Sin módulos, sin certificado. Las tareas se hacen en vivo.';



CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "short_description" "text",
    "product_type" "public"."product_type" NOT NULL,
    "cover_image_url" "text",
    "welcome_video_url" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "price_usd" numeric(10,2),
    "price_ars" numeric(10,2),
    "whatsapp_community_url" "text"
);


ALTER TABLE "public"."products" OWNER TO "postgres";


COMMENT ON TABLE "public"."products" IS 'Tabla padre de todos los productos. product_type determina qué tabla especializada acompaña a cada fila (Class Table Inheritance).';



COMMENT ON COLUMN "public"."products"."whatsapp_community_url" IS 'Link directo al grupo/comunidad de WhatsApp del producto. NULL si el producto no tiene comunidad.';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "text" NOT NULL,
    "email" "text" NOT NULL,
    "username" "text" DEFAULT ''::"text" NOT NULL,
    "avatar_url" "text",
    "role" "public"."user_role" DEFAULT 'student'::"public"."user_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'Perfil de usuario gestionado por Clerk. Se crea via webhook de Clerk → API Route de Next.js. id = Clerk User ID (TEXT).';



COMMENT ON COLUMN "public"."profiles"."id" IS 'Clerk User ID. Formato: "user_2abc123xyz". Sirve como FK en todas las tablas que relacionan a un usuario.';



COMMENT ON COLUMN "public"."profiles"."username" IS 'Username único configurado en Clerk. Equivale al display name de la alumna.';



COMMENT ON COLUMN "public"."profiles"."role" IS '"student" = alumna | "admin" = Hebe (administradora total).';



CREATE TABLE IF NOT EXISTS "public"."program_included_products" (
    "program_id" "uuid" NOT NULL,
    "included_product_id" "uuid" NOT NULL,
    CONSTRAINT "no_self_include" CHECK (("program_id" <> "included_product_id"))
);


ALTER TABLE "public"."program_included_products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_module_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "text" NOT NULL,
    "enrollment_id" "uuid" NOT NULL,
    "module_id" "uuid" NOT NULL,
    "is_unlocked" boolean DEFAULT false NOT NULL,
    "unlocked_at" timestamp with time zone,
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."student_module_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_entitlements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "text" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "source_enrollment_id" "uuid" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_entitlements" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_entitlements" IS 'Accesos efectivos sellados al momento de compra. Es la fuente de verdad para "¿puede esta alumna ver este contenido?". Generado por trigger al crear un enrollment.';



COMMENT ON COLUMN "public"."user_entitlements"."product_id" IS 'El producto concreto accesible. Si compró un programa, habrá una fila por cada producto del programa.';



COMMENT ON COLUMN "public"."user_entitlements"."expires_at" IS 'Para productos incluidos en un programa, este valor es el expires_at del programa (no el del producto individual).';



CREATE TABLE IF NOT EXISTS "public"."workshop_learning_resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "resource_type" "text" NOT NULL,
    "url" "text",
    "duration_seconds" integer,
    "order_index" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "storage_path" "text",
    CONSTRAINT "valid_resource_location" CHECK (((("resource_type" = 'video'::"text") AND ("url" IS NOT NULL) AND ("storage_path" IS NULL)) OR (("resource_type" = ANY (ARRAY['pdf'::"text", 'audio'::"text"])) AND ("storage_path" IS NOT NULL) AND ("url" IS NULL)))),
    CONSTRAINT "valid_resource_type" CHECK (("resource_type" = ANY (ARRAY['video'::"text", 'pdf'::"text", 'audio'::"text"]))),
    CONSTRAINT "workshop_learning_resources_duration_seconds_check" CHECK (("duration_seconds" > 0)),
    CONSTRAINT "workshop_learning_resources_order_index_check" CHECK (("order_index" >= 0))
);


ALTER TABLE "public"."workshop_learning_resources" OWNER TO "postgres";


COMMENT ON TABLE "public"."workshop_learning_resources" IS 'Recursos multimedia directamente asociados a un Taller. Misma lógica que module_learning_resources pero sin módulos intermedios.';



COMMENT ON COLUMN "public"."workshop_learning_resources"."storage_path" IS 'Path del objeto en el bucket learning-resources. Ej: workshops/taller-voz/resources/material.pdf. NULL para recursos de tipo video (usan url externa).';



CREATE TABLE IF NOT EXISTS "storage"."buckets" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "owner" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "public" boolean DEFAULT false,
    "avif_autodetection" boolean DEFAULT false,
    "file_size_limit" bigint,
    "allowed_mime_types" "text"[],
    "owner_id" "text",
    "type" "storage"."buckettype" DEFAULT 'STANDARD'::"storage"."buckettype" NOT NULL,
    "versioning_status" "text" DEFAULT 'DISABLED'::"text" NOT NULL,
    "lifecycle_configuration" "jsonb",
    "lifecycle_configuration_generation" "uuid",
    CONSTRAINT "buckets_lifecycle_configuration_pair_check" CHECK ((("lifecycle_configuration" IS NULL) = ("lifecycle_configuration_generation" IS NULL))),
    CONSTRAINT "buckets_lifecycle_configuration_shape_check" CHECK ((("lifecycle_configuration" IS NULL) OR (("jsonb_typeof"("lifecycle_configuration") = 'object'::"text") AND ("lifecycle_configuration" ? 'rules'::"text") AND
CASE
    WHEN ("jsonb_typeof"(("lifecycle_configuration" -> 'rules'::"text")) = 'array'::"text") THEN (("jsonb_array_length"(("lifecycle_configuration" -> 'rules'::"text")) >= 1) AND ("jsonb_array_length"(("lifecycle_configuration" -> 'rules'::"text")) <= 1000))
    ELSE false
END))),
    CONSTRAINT "buckets_lifecycle_configuration_standard_only_check" CHECK ((("type" = 'STANDARD'::"storage"."buckettype") OR (("lifecycle_configuration" IS NULL) AND ("lifecycle_configuration_generation" IS NULL)))),
    CONSTRAINT "buckets_versioning_dark_check" CHECK (("versioning_status" = 'DISABLED'::"text")),
    CONSTRAINT "buckets_versioning_standard_only_check" CHECK ((("type" = 'STANDARD'::"storage"."buckettype") OR ("versioning_status" = 'DISABLED'::"text"))),
    CONSTRAINT "buckets_versioning_status_check" CHECK (("versioning_status" = ANY (ARRAY['DISABLED'::"text", 'ENABLED'::"text", 'SUSPENDED'::"text"])))
);


ALTER TABLE "storage"."buckets" OWNER TO "supabase_storage_admin";


COMMENT ON COLUMN "storage"."buckets"."owner" IS 'Field is deprecated, use owner_id instead';



CREATE TABLE IF NOT EXISTS "storage"."buckets_analytics" (
    "name" "text" NOT NULL,
    "type" "storage"."buckettype" DEFAULT 'ANALYTICS'::"storage"."buckettype" NOT NULL,
    "format" "text" DEFAULT 'ICEBERG'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "storage"."buckets_analytics" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."buckets_vectors" (
    "id" "text" NOT NULL,
    "type" "storage"."buckettype" DEFAULT 'VECTOR'::"storage"."buckettype" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."buckets_vectors" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."migrations" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "hash" character varying(40) NOT NULL,
    "executed_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "storage"."migrations" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."objects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bucket_id" "text",
    "name" "text",
    "owner" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_accessed_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb",
    "path_tokens" "text"[] GENERATED ALWAYS AS ("string_to_array"("name", '/'::"text")) STORED,
    "version" "text",
    "owner_id" "text",
    "user_metadata" "jsonb",
    "archived_at" timestamp with time zone,
    "is_delete_marker" boolean DEFAULT false NOT NULL,
    "is_versioned" boolean DEFAULT false NOT NULL
);


ALTER TABLE "storage"."objects" OWNER TO "supabase_storage_admin";


COMMENT ON COLUMN "storage"."objects"."owner" IS 'Field is deprecated, use owner_id instead';



CREATE TABLE IF NOT EXISTS "storage"."s3_multipart_uploads" (
    "id" "text" NOT NULL,
    "in_progress_size" bigint DEFAULT 0 NOT NULL,
    "upload_signature" "text" NOT NULL,
    "bucket_id" "text" NOT NULL,
    "key" "text" NOT NULL COLLATE "pg_catalog"."C",
    "version" "text" NOT NULL,
    "owner_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_metadata" "jsonb",
    "metadata" "jsonb"
);


ALTER TABLE "storage"."s3_multipart_uploads" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."s3_multipart_uploads_parts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "upload_id" "text" NOT NULL,
    "size" bigint DEFAULT 0 NOT NULL,
    "part_number" integer NOT NULL,
    "bucket_id" "text" NOT NULL,
    "key" "text" NOT NULL COLLATE "pg_catalog"."C",
    "etag" "text" NOT NULL,
    "owner_id" "text",
    "version" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."s3_multipart_uploads_parts" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."vector_indexes" (
    "id" "text" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL COLLATE "pg_catalog"."C",
    "bucket_id" "text" NOT NULL,
    "data_type" "text" NOT NULL,
    "dimension" integer NOT NULL,
    "distance_metric" "text" NOT NULL,
    "metadata_configuration" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."vector_indexes" OWNER TO "supabase_storage_admin";


ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assignment_feedback"
    ADD CONSTRAINT "assignment_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assignment_feedback"
    ADD CONSTRAINT "assignment_feedback_submission_id_key" UNIQUE ("submission_id");



ALTER TABLE ONLY "public"."assignment_submissions"
    ADD CONSTRAINT "assignment_submissions_assignment_id_student_id_attempt_num_key" UNIQUE ("assignment_id", "student_id", "attempt_number");



ALTER TABLE ONLY "public"."assignment_submissions"
    ADD CONSTRAINT "assignment_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_student_id_product_id_key" UNIQUE ("student_id", "product_id");



ALTER TABLE ONLY "public"."final_activities"
    ADD CONSTRAINT "final_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."final_activities"
    ADD CONSTRAINT "final_activities_product_id_key" UNIQUE ("product_id");



ALTER TABLE ONLY "public"."final_activity_feedback"
    ADD CONSTRAINT "final_activity_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."final_activity_feedback"
    ADD CONSTRAINT "final_activity_feedback_submission_id_key" UNIQUE ("submission_id");



ALTER TABLE ONLY "public"."final_activity_submissions"
    ADD CONSTRAINT "final_activity_submissions_final_activity_id_student_id_att_key" UNIQUE ("final_activity_id", "student_id", "attempt_number");



ALTER TABLE ONLY "public"."final_activity_submissions"
    ADD CONSTRAINT "final_activity_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."historial_reservas"
    ADD CONSTRAINT "historial_reservas_cal_booking_id_key" UNIQUE ("cal_booking_id");



ALTER TABLE ONLY "public"."historial_reservas"
    ADD CONSTRAINT "historial_reservas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meeting_attendance_intents"
    ADD CONSTRAINT "meeting_attendance_intents_meeting_id_student_id_key" UNIQUE ("meeting_id", "student_id");



ALTER TABLE ONLY "public"."meeting_attendance_intents"
    ADD CONSTRAINT "meeting_attendance_intents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meetings"
    ADD CONSTRAINT "meetings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."module_assignments"
    ADD CONSTRAINT "module_assignments_module_id_key" UNIQUE ("module_id");



ALTER TABLE ONLY "public"."module_assignments"
    ADD CONSTRAINT "module_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."module_learning_resources"
    ADD CONSTRAINT "module_learning_resources_module_id_order_index_key" UNIQUE ("module_id", "order_index");



ALTER TABLE ONLY "public"."module_learning_resources"
    ADD CONSTRAINT "module_learning_resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_product_id_order_index_key" UNIQUE ("product_id", "order_index");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_courses"
    ADD CONSTRAINT "product_courses_pkey" PRIMARY KEY ("product_id");



ALTER TABLE ONLY "public"."product_programs"
    ADD CONSTRAINT "product_programs_pkey" PRIMARY KEY ("product_id");



ALTER TABLE ONLY "public"."product_workshops"
    ADD CONSTRAINT "product_workshops_pkey" PRIMARY KEY ("product_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_unique" UNIQUE ("username");



ALTER TABLE ONLY "public"."program_included_products"
    ADD CONSTRAINT "program_included_products_pkey" PRIMARY KEY ("program_id", "included_product_id");



ALTER TABLE ONLY "public"."student_module_progress"
    ADD CONSTRAINT "student_module_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_module_progress"
    ADD CONSTRAINT "student_module_progress_student_id_module_id_key" UNIQUE ("student_id", "module_id");



ALTER TABLE ONLY "public"."user_entitlements"
    ADD CONSTRAINT "user_entitlements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_entitlements"
    ADD CONSTRAINT "user_entitlements_student_id_product_id_source_enrollment_i_key" UNIQUE ("student_id", "product_id", "source_enrollment_id");



ALTER TABLE ONLY "public"."workshop_learning_resources"
    ADD CONSTRAINT "workshop_learning_resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workshop_learning_resources"
    ADD CONSTRAINT "workshop_learning_resources_product_id_order_index_key" UNIQUE ("product_id", "order_index");



ALTER TABLE ONLY "storage"."buckets_analytics"
    ADD CONSTRAINT "buckets_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."buckets"
    ADD CONSTRAINT "buckets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."buckets_vectors"
    ADD CONSTRAINT "buckets_vectors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."migrations"
    ADD CONSTRAINT "migrations_name_key" UNIQUE ("name");



ALTER TABLE ONLY "storage"."migrations"
    ADD CONSTRAINT "migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."objects"
    ADD CONSTRAINT "objects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads"
    ADD CONSTRAINT "s3_multipart_uploads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."vector_indexes"
    ADD CONSTRAINT "vector_indexes_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_announcements_pinned" ON "public"."announcements" USING "btree" ("is_pinned") WHERE ("is_pinned" = true);



CREATE INDEX "idx_announcements_product" ON "public"."announcements" USING "btree" ("product_id", "created_at" DESC);



CREATE INDEX "idx_enrollments_expires" ON "public"."enrollments" USING "btree" ("expires_at");



CREATE INDEX "idx_enrollments_product" ON "public"."enrollments" USING "btree" ("product_id");



CREATE INDEX "idx_enrollments_source" ON "public"."enrollments" USING "btree" ("source");



CREATE INDEX "idx_enrollments_status" ON "public"."enrollments" USING "btree" ("status");



CREATE INDEX "idx_enrollments_student" ON "public"."enrollments" USING "btree" ("student_id");



CREATE INDEX "idx_entitlements_active" ON "public"."user_entitlements" USING "btree" ("student_id", "product_id", "expires_at") WHERE ("is_active" = true);



CREATE INDEX "idx_entitlements_enrollment" ON "public"."user_entitlements" USING "btree" ("source_enrollment_id");



CREATE INDEX "idx_entitlements_student" ON "public"."user_entitlements" USING "btree" ("student_id", "product_id");



CREATE INDEX "idx_final_sub_student" ON "public"."final_activity_submissions" USING "btree" ("student_id", "final_activity_id");



CREATE INDEX "idx_historial_cal_uid" ON "public"."historial_reservas" USING "btree" ("cal_booking_uid");



CREATE INDEX "idx_historial_cancel_failed" ON "public"."historial_reservas" USING "btree" ("status") WHERE ("status" = 'cancellation_failed'::"public"."cal_booking_status");



CREATE INDEX "idx_historial_email" ON "public"."historial_reservas" USING "btree" ("student_email");



CREATE INDEX "idx_historial_enrollment" ON "public"."historial_reservas" USING "btree" ("enrollment_id");



CREATE INDEX "idx_historial_status" ON "public"."historial_reservas" USING "btree" ("status");



CREATE INDEX "idx_historial_student" ON "public"."historial_reservas" USING "btree" ("student_id");



CREATE INDEX "idx_intents_meeting" ON "public"."meeting_attendance_intents" USING "btree" ("meeting_id");



CREATE INDEX "idx_intents_meeting_count" ON "public"."meeting_attendance_intents" USING "btree" ("meeting_id") WHERE (("attended" IS NULL) OR ("attended" = true));



CREATE INDEX "idx_intents_student" ON "public"."meeting_attendance_intents" USING "btree" ("student_id");



CREATE INDEX "idx_meetings_product" ON "public"."meetings" USING "btree" ("product_id", "scheduled_at");



CREATE INDEX "idx_module_learning_resources_module" ON "public"."module_learning_resources" USING "btree" ("module_id", "order_index");



CREATE INDEX "idx_module_learning_resources_type" ON "public"."module_learning_resources" USING "btree" ("module_id", "resource_type");



CREATE UNIQUE INDEX "idx_module_resources_one_pdf" ON "public"."module_learning_resources" USING "btree" ("module_id") WHERE ("resource_type" = 'pdf'::"text");



COMMENT ON INDEX "public"."idx_module_resources_one_pdf" IS 'Garantiza exactamente 1 PDF por módulo de curso. Los talleres (workshop_learning_resources) no tienen esta restricción.';



CREATE UNIQUE INDEX "idx_module_resources_storage_path" ON "public"."module_learning_resources" USING "btree" ("storage_path") WHERE ("storage_path" IS NOT NULL);



CREATE INDEX "idx_modules_product" ON "public"."modules" USING "btree" ("product_id", "order_index");



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_orders_student" ON "public"."orders" USING "btree" ("student_id");



CREATE INDEX "idx_payments_awaiting" ON "public"."payments" USING "btree" ("status", "created_at") WHERE ("status" = 'awaiting_approval'::"public"."payment_status");



CREATE INDEX "idx_payments_external" ON "public"."payments" USING "btree" ("external_id") WHERE ("external_id" IS NOT NULL);



CREATE INDEX "idx_payments_method" ON "public"."payments" USING "btree" ("method");



CREATE INDEX "idx_payments_order" ON "public"."payments" USING "btree" ("order_id");



CREATE INDEX "idx_payments_status" ON "public"."payments" USING "btree" ("status");



CREATE INDEX "idx_products_active" ON "public"."products" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_products_type" ON "public"."products" USING "btree" ("product_type");



CREATE INDEX "idx_progress_enrollment" ON "public"."student_module_progress" USING "btree" ("enrollment_id");



CREATE INDEX "idx_progress_student" ON "public"."student_module_progress" USING "btree" ("student_id", "module_id");



CREATE INDEX "idx_submissions_student" ON "public"."assignment_submissions" USING "btree" ("student_id", "assignment_id");



CREATE INDEX "idx_workshop_learning_resources_product" ON "public"."workshop_learning_resources" USING "btree" ("product_id", "order_index");



CREATE INDEX "idx_workshop_learning_resources_type" ON "public"."workshop_learning_resources" USING "btree" ("product_id", "resource_type");



CREATE UNIQUE INDEX "idx_workshop_resources_storage_path" ON "public"."workshop_learning_resources" USING "btree" ("storage_path") WHERE ("storage_path" IS NOT NULL);



CREATE UNIQUE INDEX "bname" ON "storage"."buckets" USING "btree" ("name");



CREATE UNIQUE INDEX "buckets_analytics_unique_name_idx" ON "storage"."buckets_analytics" USING "btree" ("name") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_multipart_uploads_list" ON "storage"."s3_multipart_uploads" USING "btree" ("bucket_id", "key", "created_at");



CREATE INDEX "idx_objects_bucket_id_name" ON "storage"."objects" USING "btree" ("bucket_id", "name" COLLATE "C");



CREATE INDEX "idx_objects_bucket_id_name_lower" ON "storage"."objects" USING "btree" ("bucket_id", "lower"("name") COLLATE "C");



CREATE UNIQUE INDEX "idx_objects_current_version" ON "storage"."objects" USING "btree" ("bucket_id", "name" COLLATE "C") WHERE ("archived_at" IS NULL);



CREATE INDEX "idx_objects_delete_markers" ON "storage"."objects" USING "btree" ("bucket_id", "name" COLLATE "C") WHERE "is_delete_marker";



CREATE UNIQUE INDEX "idx_objects_null_version" ON "storage"."objects" USING "btree" ("bucket_id", "name" COLLATE "C") WHERE (NOT "is_versioned");



CREATE INDEX "name_prefix_search" ON "storage"."objects" USING "btree" ("name" "text_pattern_ops");



CREATE UNIQUE INDEX "objects_bucket_id_name_version_key" ON "storage"."objects" USING "btree" ("bucket_id", "name" COLLATE "C", "version") NULLS NOT DISTINCT;



CREATE UNIQUE INDEX "vector_indexes_name_bucket_id_idx" ON "storage"."vector_indexes" USING "btree" ("name", "bucket_id");



CREATE OR REPLACE TRIGGER "trg_announcements_updated_at" BEFORE UPDATE ON "public"."announcements" FOR EACH ROW EXECUTE FUNCTION "public"."fn_set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_enrollments_updated_at" BEFORE UPDATE ON "public"."enrollments" FOR EACH ROW EXECUTE FUNCTION "public"."fn_set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_historial_updated_at" BEFORE UPDATE ON "public"."historial_reservas" FOR EACH ROW EXECUTE FUNCTION "public"."fn_set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_meetings_updated_at" BEFORE UPDATE ON "public"."meetings" FOR EACH ROW EXECUTE FUNCTION "public"."fn_set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_on_assignment_feedback" AFTER INSERT ON "public"."assignment_feedback" FOR EACH ROW EXECUTE FUNCTION "public"."fn_update_submission_status"();



CREATE OR REPLACE TRIGGER "trg_on_assignment_submitted" AFTER INSERT ON "public"."assignment_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."fn_unlock_next_module_on_submit"();



CREATE OR REPLACE TRIGGER "trg_on_enrollment_created" AFTER INSERT ON "public"."enrollments" FOR EACH ROW EXECUTE FUNCTION "public"."fn_expand_entitlements_on_enrollment"();



CREATE OR REPLACE TRIGGER "trg_on_final_feedback" AFTER INSERT ON "public"."final_activity_feedback" FOR EACH ROW EXECUTE FUNCTION "public"."fn_update_final_submission_status"();



CREATE OR REPLACE TRIGGER "trg_on_payment_completed" AFTER UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."fn_on_payment_completed"();



CREATE OR REPLACE TRIGGER "trg_orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."fn_set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_payments_updated_at" BEFORE UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."fn_set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."fn_set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."fn_set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_unlock_first_module" AFTER INSERT ON "public"."enrollments" FOR EACH ROW EXECUTE FUNCTION "public"."fn_unlock_first_module"();



CREATE OR REPLACE TRIGGER "enforce_bucket_name_length_trigger" BEFORE INSERT OR UPDATE OF "name" ON "storage"."buckets" FOR EACH ROW EXECUTE FUNCTION "storage"."enforce_bucket_name_length"();



CREATE OR REPLACE TRIGGER "protect_bucket_control_insert" BEFORE INSERT ON "storage"."buckets" FOR EACH ROW EXECUTE FUNCTION "storage"."protect_bucket_control_columns"('service_role');



CREATE OR REPLACE TRIGGER "protect_bucket_control_update" BEFORE UPDATE OF "lifecycle_configuration", "lifecycle_configuration_generation" ON "storage"."buckets" FOR EACH ROW EXECUTE FUNCTION "storage"."protect_bucket_control_columns"();



CREATE OR REPLACE TRIGGER "protect_bucket_control_update_role" AFTER UPDATE OF "lifecycle_configuration", "lifecycle_configuration_generation" ON "storage"."buckets" FOR EACH ROW EXECUTE FUNCTION "storage"."enforce_bucket_lifecycle_service_role"('service_role');



CREATE OR REPLACE TRIGGER "protect_buckets_delete" BEFORE DELETE ON "storage"."buckets" FOR EACH STATEMENT EXECUTE FUNCTION "storage"."protect_delete"();



CREATE OR REPLACE TRIGGER "protect_objects_delete" BEFORE DELETE ON "storage"."objects" FOR EACH STATEMENT EXECUTE FUNCTION "storage"."protect_delete"();



CREATE OR REPLACE TRIGGER "update_objects_updated_at" BEFORE UPDATE ON "storage"."objects" FOR EACH ROW EXECUTE FUNCTION "storage"."update_updated_at_column"();



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assignment_feedback"
    ADD CONSTRAINT "assignment_feedback_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."assignment_feedback"
    ADD CONSTRAINT "assignment_feedback_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."assignment_submissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assignment_submissions"
    ADD CONSTRAINT "assignment_submissions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "public"."module_assignments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assignment_submissions"
    ADD CONSTRAINT "assignment_submissions_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assignment_submissions"
    ADD CONSTRAINT "assignment_submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_enrolled_by_fkey" FOREIGN KEY ("enrolled_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."final_activities"
    ADD CONSTRAINT "final_activities_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."final_activity_feedback"
    ADD CONSTRAINT "final_activity_feedback_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."final_activity_feedback"
    ADD CONSTRAINT "final_activity_feedback_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."final_activity_submissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."final_activity_submissions"
    ADD CONSTRAINT "final_activity_submissions_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."final_activity_submissions"
    ADD CONSTRAINT "final_activity_submissions_final_activity_id_fkey" FOREIGN KEY ("final_activity_id") REFERENCES "public"."final_activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."final_activity_submissions"
    ADD CONSTRAINT "final_activity_submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."historial_reservas"
    ADD CONSTRAINT "historial_reservas_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."historial_reservas"
    ADD CONSTRAINT "historial_reservas_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."meeting_attendance_intents"
    ADD CONSTRAINT "meeting_attendance_intents_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meeting_attendance_intents"
    ADD CONSTRAINT "meeting_attendance_intents_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meetings"
    ADD CONSTRAINT "meetings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."module_assignments"
    ADD CONSTRAINT "module_assignments_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."module_learning_resources"
    ADD CONSTRAINT "module_learning_resources_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."product_courses"
    ADD CONSTRAINT "product_courses_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_programs"
    ADD CONSTRAINT "product_programs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_workshops"
    ADD CONSTRAINT "product_workshops_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."program_included_products"
    ADD CONSTRAINT "program_included_products_included_product_id_fkey" FOREIGN KEY ("included_product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."program_included_products"
    ADD CONSTRAINT "program_included_products_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_module_progress"
    ADD CONSTRAINT "student_module_progress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_module_progress"
    ADD CONSTRAINT "student_module_progress_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_module_progress"
    ADD CONSTRAINT "student_module_progress_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_entitlements"
    ADD CONSTRAINT "user_entitlements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_entitlements"
    ADD CONSTRAINT "user_entitlements_source_enrollment_id_fkey" FOREIGN KEY ("source_enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_entitlements"
    ADD CONSTRAINT "user_entitlements_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workshop_learning_resources"
    ADD CONSTRAINT "workshop_learning_resources_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "storage"."objects"
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads"
    ADD CONSTRAINT "s3_multipart_uploads_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "storage"."s3_multipart_uploads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "storage"."vector_indexes"
    ADD CONSTRAINT "vector_indexes_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets_vectors"("id");



ALTER TABLE "public"."announcements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "announcements: admin gestiona" ON "public"."announcements" USING (("public"."fn_my_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "announcements: ver autenticados" ON "public"."announcements" FOR SELECT USING (("public"."fn_clerk_user_id"() <> ''::"text"));



ALTER TABLE "public"."assignment_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assignment_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enrollments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "enrollments: admin gestiona" ON "public"."enrollments" USING (("public"."fn_my_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "enrollments: ver propias o admin" ON "public"."enrollments" FOR SELECT USING ((("student_id" = "public"."fn_clerk_user_id"()) OR ("public"."fn_my_role"() = 'admin'::"public"."user_role")));



CREATE POLICY "entitlements: admin gestiona" ON "public"."user_entitlements" USING (("public"."fn_my_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "entitlements: ver propios o admin" ON "public"."user_entitlements" FOR SELECT USING ((("student_id" = "public"."fn_clerk_user_id"()) OR ("public"."fn_my_role"() = 'admin'::"public"."user_role")));



CREATE POLICY "feedback: admin gestiona" ON "public"."assignment_feedback" USING (("public"."fn_my_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "feedback: ver propias o admin" ON "public"."assignment_feedback" FOR SELECT USING ((("public"."fn_my_role"() = 'admin'::"public"."user_role") OR (EXISTS ( SELECT 1
   FROM "public"."assignment_submissions" "s"
  WHERE (("s"."id" = "assignment_feedback"."submission_id") AND ("s"."student_id" = "public"."fn_clerk_user_id"()))))));



ALTER TABLE "public"."final_activities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "final_activities: admin gestiona" ON "public"."final_activities" USING (("public"."fn_my_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "final_activities: ver con acceso o admin" ON "public"."final_activities" FOR SELECT USING ((("public"."fn_my_role"() = 'admin'::"public"."user_role") OR "public"."fn_has_access_to_product"("public"."fn_clerk_user_id"(), "product_id")));



ALTER TABLE "public"."final_activity_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."final_activity_submissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "final_feedback: admin gestiona" ON "public"."final_activity_feedback" USING (("public"."fn_my_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "final_feedback: ver propias o admin" ON "public"."final_activity_feedback" FOR SELECT USING ((("public"."fn_my_role"() = 'admin'::"public"."user_role") OR (EXISTS ( SELECT 1
   FROM "public"."final_activity_submissions" "s"
  WHERE (("s"."id" = "final_activity_feedback"."submission_id") AND ("s"."student_id" = "public"."fn_clerk_user_id"()))))));



CREATE POLICY "final_sub: admin gestiona" ON "public"."final_activity_submissions" USING (("public"."fn_my_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "final_sub: alumna inserta" ON "public"."final_activity_submissions" FOR INSERT WITH CHECK (("student_id" = "public"."fn_clerk_user_id"()));



CREATE POLICY "final_sub: ver propias o admin" ON "public"."final_activity_submissions" FOR SELECT USING ((("student_id" = "public"."fn_clerk_user_id"()) OR ("public"."fn_my_role"() = 'admin'::"public"."user_role")));



CREATE POLICY "historial: admin gestiona" ON "public"."historial_reservas" USING (("public"."fn_my_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "historial: ver propio o admin" ON "public"."historial_reservas" FOR SELECT USING ((("student_id" = "public"."fn_clerk_user_id"()) OR ("public"."fn_my_role"() = 'admin'::"public"."user_role")));



ALTER TABLE "public"."historial_reservas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "intents: admin gestiona" ON "public"."meeting_attendance_intents" USING (("public"."fn_my_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "intents: alumna cancela" ON "public"."meeting_attendance_intents" FOR DELETE USING (("student_id" = "public"."fn_clerk_user_id"()));



CREATE POLICY "intents: alumna registra" ON "public"."meeting_attendance_intents" FOR INSERT WITH CHECK (("student_id" = "public"."fn_clerk_user_id"()));



CREATE POLICY "intents: ver propias o admin" ON "public"."meeting_attendance_intents" FOR SELECT USING ((("student_id" = "public"."fn_clerk_user_id"()) OR ("public"."fn_my_role"() = 'admin'::"public"."user_role")));



ALTER TABLE "public"."meeting_attendance_intents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meetings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "meetings: admin gestiona" ON "public"."meetings" USING (("public"."fn_my_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "meetings: ver autenticados" ON "public"."meetings" FOR SELECT USING (("public"."fn_clerk_user_id"() <> ''::"text"));



ALTER TABLE "public"."module_assignments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "module_assignments: admin gestiona" ON "public"."module_assignments" USING (("public"."fn_my_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "module_assignments: ver con acceso o admin" ON "public"."module_assignments" FOR SELECT USING ((("public"."fn_my_role"() = 'admin'::"public"."user_role") OR (EXISTS ( SELECT 1
   FROM "public"."modules" "m"
  WHERE (("m"."id" = "module_assignments"."module_id") AND "public"."fn_has_access_to_product"("public"."fn_clerk_user_id"(), "m"."product_id"))))));



ALTER TABLE "public"."module_learning_resources" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "module_learning_resources: admin gestiona" ON "public"."module_learning_resources" USING (("public"."fn_my_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "module_learning_resources: ver con acceso o admin" ON "public"."module_learning_resources" FOR SELECT USING ((("public"."fn_my_role"() = 'admin'::"public"."user_role") OR (EXISTS ( SELECT 1
   FROM "public"."modules" "m"
  WHERE (("m"."id" = "module_learning_resources"."module_id") AND "public"."fn_has_access_to_product"("public"."fn_clerk_user_id"(), "m"."product_id"))))));



ALTER TABLE "public"."modules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "modules: admin gestiona" ON "public"."modules" USING (("public"."fn_my_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "modules: ver con acceso o admin" ON "public"."modules" FOR SELECT USING ((("public"."fn_my_role"() = 'admin'::"public"."user_role") OR "public"."fn_has_access_to_product"("public"."fn_clerk_user_id"(), "product_id")));



ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orders: admin gestiona" ON "public"."orders" USING (("public"."fn_my_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "orders: alumna crea" ON "public"."orders" FOR INSERT WITH CHECK (("student_id" = "public"."fn_clerk_user_id"()));



CREATE POLICY "orders: ver propias o admin" ON "public"."orders" FOR SELECT USING ((("student_id" = "public"."fn_clerk_user_id"()) OR ("public"."fn_my_role"() = 'admin'::"public"."user_role")));



ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payments: admin gestiona" ON "public"."payments" USING (("public"."fn_my_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "payments: alumna inserta" ON "public"."payments" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "payments"."order_id") AND ("o"."student_id" = "public"."fn_clerk_user_id"())))));



CREATE POLICY "payments: alumna sube comprobante" ON "public"."payments" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "payments"."order_id") AND ("o"."student_id" = "public"."fn_clerk_user_id"()))))) WITH CHECK (("status" = 'awaiting_approval'::"public"."payment_status"));



CREATE POLICY "payments: ver propias o admin" ON "public"."payments" FOR SELECT USING ((("public"."fn_my_role"() = 'admin'::"public"."user_role") OR (EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "payments"."order_id") AND ("o"."student_id" = "public"."fn_clerk_user_id"()))))));



ALTER TABLE "public"."product_courses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "product_courses: admin gestiona" ON "public"."product_courses" USING (("public"."fn_my_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "product_courses: ver siempre" ON "public"."product_courses" FOR SELECT USING (true);



ALTER TABLE "public"."product_programs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "product_programs: admin gestiona" ON "public"."product_programs" USING (("public"."fn_my_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "product_programs: ver siempre" ON "public"."product_programs" FOR SELECT USING (true);



ALTER TABLE "public"."product_workshops" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "product_workshops: admin gestiona" ON "public"."product_workshops" USING (("public"."fn_my_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "product_workshops: ver siempre" ON "public"."product_workshops" FOR SELECT USING (true);



ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "products: admin gestiona" ON "public"."products" USING (("public"."fn_my_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "products: ver activos o admin" ON "public"."products" FOR SELECT USING ((("is_active" = true) OR ("public"."fn_my_role"() = 'admin'::"public"."user_role")));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles: actualizar propio" ON "public"."profiles" FOR UPDATE USING (("id" = "public"."fn_clerk_user_id"()));



CREATE POLICY "profiles: admin gestiona" ON "public"."profiles" USING (("public"."fn_my_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "profiles: ver propio o admin" ON "public"."profiles" FOR SELECT USING ((("id" = "public"."fn_clerk_user_id"()) OR ("public"."fn_my_role"() = 'admin'::"public"."user_role")));



ALTER TABLE "public"."program_included_products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "program_products: admin gestiona" ON "public"."program_included_products" USING (("public"."fn_my_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "program_products: ver siempre" ON "public"."program_included_products" FOR SELECT USING (true);



CREATE POLICY "progress: admin gestiona" ON "public"."student_module_progress" USING (("public"."fn_my_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "progress: ver propio o admin" ON "public"."student_module_progress" FOR SELECT USING ((("student_id" = "public"."fn_clerk_user_id"()) OR ("public"."fn_my_role"() = 'admin'::"public"."user_role")));



ALTER TABLE "public"."student_module_progress" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "submissions: admin gestiona" ON "public"."assignment_submissions" USING (("public"."fn_my_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "submissions: alumna inserta" ON "public"."assignment_submissions" FOR INSERT WITH CHECK (("student_id" = "public"."fn_clerk_user_id"()));



CREATE POLICY "submissions: ver propias o admin" ON "public"."assignment_submissions" FOR SELECT USING ((("student_id" = "public"."fn_clerk_user_id"()) OR ("public"."fn_my_role"() = 'admin'::"public"."user_role")));



ALTER TABLE "public"."user_entitlements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workshop_learning_resources" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workshop_learning_resources: admin gestiona" ON "public"."workshop_learning_resources" USING (("public"."fn_my_role"() = 'admin'::"public"."user_role"));



CREATE POLICY "workshop_learning_resources: ver con acceso o admin" ON "public"."workshop_learning_resources" FOR SELECT USING ((("public"."fn_my_role"() = 'admin'::"public"."user_role") OR "public"."fn_has_access_to_product"("public"."fn_clerk_user_id"(), "product_id")));



ALTER TABLE "storage"."buckets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."buckets_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."buckets_vectors" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "learning-resources: admin gestiona" ON "storage"."objects" USING ((("bucket_id" = 'learning-resources'::"text") AND ("public"."fn_my_role"() = 'admin'::"public"."user_role"))) WITH CHECK ((("bucket_id" = 'learning-resources'::"text") AND ("public"."fn_my_role"() = 'admin'::"public"."user_role")));



CREATE POLICY "learning-resources: ver con acceso o admin" ON "storage"."objects" FOR SELECT USING ((("bucket_id" = 'learning-resources'::"text") AND (("public"."fn_my_role"() = 'admin'::"public"."user_role") OR (EXISTS ( SELECT 1
   FROM ("public"."module_learning_resources" "mlr"
     JOIN "public"."modules" "m" ON (("m"."id" = "mlr"."module_id")))
  WHERE (("mlr"."storage_path" = "objects"."name") AND "public"."fn_has_access_to_product"("public"."fn_clerk_user_id"(), "m"."product_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."workshop_learning_resources" "wlr"
  WHERE (("wlr"."storage_path" = "objects"."name") AND "public"."fn_has_access_to_product"("public"."fn_clerk_user_id"(), "wlr"."product_id")))))));



ALTER TABLE "storage"."migrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."objects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."s3_multipart_uploads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."s3_multipart_uploads_parts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."vector_indexes" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT USAGE ON SCHEMA "storage" TO "postgres" WITH GRANT OPTION;
GRANT USAGE ON SCHEMA "storage" TO "anon";
GRANT USAGE ON SCHEMA "storage" TO "authenticated";
GRANT USAGE ON SCHEMA "storage" TO "service_role";
GRANT ALL ON SCHEMA "storage" TO "supabase_storage_admin" WITH GRANT OPTION;
GRANT ALL ON SCHEMA "storage" TO "dashboard_user";



GRANT ALL ON FUNCTION "public"."fn_clerk_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_clerk_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_clerk_user_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_decrement_session_for_booking"("p_student_email" "text", "p_cal_booking_id" integer, "p_cal_booking_uid" "text", "p_scheduled_at" timestamp with time zone, "p_duration_minutes" integer, "p_raw_payload" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_decrement_session_for_booking"("p_student_email" "text", "p_cal_booking_id" integer, "p_cal_booking_uid" "text", "p_scheduled_at" timestamp with time zone, "p_duration_minutes" integer, "p_raw_payload" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_decrement_session_for_booking"("p_student_email" "text", "p_cal_booking_id" integer, "p_cal_booking_uid" "text", "p_scheduled_at" timestamp with time zone, "p_duration_minutes" integer, "p_raw_payload" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_expand_entitlements_on_enrollment"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_expand_entitlements_on_enrollment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_expand_entitlements_on_enrollment"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_expire_enrollments"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_expire_enrollments"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_expire_enrollments"() TO "service_role";



GRANT ALL ON TABLE "public"."historial_reservas" TO "anon";
GRANT ALL ON TABLE "public"."historial_reservas" TO "authenticated";
GRANT ALL ON TABLE "public"."historial_reservas" TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_get_failed_cancellations"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_get_failed_cancellations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_get_failed_cancellations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_get_meeting_intent_count"("p_meeting_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_get_meeting_intent_count"("p_meeting_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_get_meeting_intent_count"("p_meeting_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_has_access_to_product"("p_user_id" "text", "p_product_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_has_access_to_product"("p_user_id" "text", "p_product_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_has_access_to_product"("p_user_id" "text", "p_product_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_my_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_my_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_my_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_on_payment_completed"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_on_payment_completed"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_on_payment_completed"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_unlock_first_module"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_unlock_first_module"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_unlock_first_module"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_unlock_next_module_on_submit"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_unlock_next_module_on_submit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_unlock_next_module_on_submit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_update_final_submission_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_update_final_submission_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_update_final_submission_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_update_submission_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_update_submission_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_update_submission_status"() TO "service_role";



GRANT ALL ON TABLE "public"."announcements" TO "anon";
GRANT ALL ON TABLE "public"."announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."announcements" TO "service_role";



GRANT ALL ON TABLE "public"."assignment_feedback" TO "anon";
GRANT ALL ON TABLE "public"."assignment_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."assignment_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."assignment_submissions" TO "anon";
GRANT ALL ON TABLE "public"."assignment_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."assignment_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."enrollments" TO "anon";
GRANT ALL ON TABLE "public"."enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."enrollments" TO "service_role";



GRANT ALL ON TABLE "public"."final_activities" TO "anon";
GRANT ALL ON TABLE "public"."final_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."final_activities" TO "service_role";



GRANT ALL ON TABLE "public"."final_activity_feedback" TO "anon";
GRANT ALL ON TABLE "public"."final_activity_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."final_activity_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."final_activity_submissions" TO "anon";
GRANT ALL ON TABLE "public"."final_activity_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."final_activity_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."meeting_attendance_intents" TO "anon";
GRANT ALL ON TABLE "public"."meeting_attendance_intents" TO "authenticated";
GRANT ALL ON TABLE "public"."meeting_attendance_intents" TO "service_role";



GRANT ALL ON TABLE "public"."meetings" TO "anon";
GRANT ALL ON TABLE "public"."meetings" TO "authenticated";
GRANT ALL ON TABLE "public"."meetings" TO "service_role";



GRANT ALL ON TABLE "public"."module_assignments" TO "anon";
GRANT ALL ON TABLE "public"."module_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."module_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."module_learning_resources" TO "anon";
GRANT ALL ON TABLE "public"."module_learning_resources" TO "authenticated";
GRANT ALL ON TABLE "public"."module_learning_resources" TO "service_role";



GRANT ALL ON TABLE "public"."modules" TO "anon";
GRANT ALL ON TABLE "public"."modules" TO "authenticated";
GRANT ALL ON TABLE "public"."modules" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."product_courses" TO "anon";
GRANT ALL ON TABLE "public"."product_courses" TO "authenticated";
GRANT ALL ON TABLE "public"."product_courses" TO "service_role";



GRANT ALL ON TABLE "public"."product_programs" TO "anon";
GRANT ALL ON TABLE "public"."product_programs" TO "authenticated";
GRANT ALL ON TABLE "public"."product_programs" TO "service_role";



GRANT ALL ON TABLE "public"."product_workshops" TO "anon";
GRANT ALL ON TABLE "public"."product_workshops" TO "authenticated";
GRANT ALL ON TABLE "public"."product_workshops" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."program_included_products" TO "anon";
GRANT ALL ON TABLE "public"."program_included_products" TO "authenticated";
GRANT ALL ON TABLE "public"."program_included_products" TO "service_role";



GRANT ALL ON TABLE "public"."student_module_progress" TO "anon";
GRANT ALL ON TABLE "public"."student_module_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."student_module_progress" TO "service_role";



GRANT ALL ON TABLE "public"."user_entitlements" TO "anon";
GRANT ALL ON TABLE "public"."user_entitlements" TO "authenticated";
GRANT ALL ON TABLE "public"."user_entitlements" TO "service_role";



GRANT ALL ON TABLE "public"."workshop_learning_resources" TO "anon";
GRANT ALL ON TABLE "public"."workshop_learning_resources" TO "authenticated";
GRANT ALL ON TABLE "public"."workshop_learning_resources" TO "service_role";



REVOKE ALL ON TABLE "storage"."buckets" FROM "supabase_storage_admin";
GRANT ALL ON TABLE "storage"."buckets" TO "supabase_storage_admin" WITH GRANT OPTION;
GRANT ALL ON TABLE "storage"."buckets" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "storage"."buckets" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "storage"."buckets" TO "anon";
GRANT ALL ON TABLE "storage"."buckets" TO "postgres" WITH GRANT OPTION;



GRANT ALL ON TABLE "storage"."buckets_analytics" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "storage"."buckets_analytics" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "storage"."buckets_analytics" TO "anon";



GRANT SELECT ON TABLE "storage"."buckets_vectors" TO "service_role";
GRANT SELECT ON TABLE "storage"."buckets_vectors" TO "anon";
GRANT SELECT ON TABLE "storage"."buckets_vectors" TO "authenticated";



REVOKE ALL ON TABLE "storage"."objects" FROM "supabase_storage_admin";
GRANT ALL ON TABLE "storage"."objects" TO "supabase_storage_admin" WITH GRANT OPTION;
GRANT ALL ON TABLE "storage"."objects" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "storage"."objects" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "storage"."objects" TO "anon";
GRANT ALL ON TABLE "storage"."objects" TO "postgres" WITH GRANT OPTION;



GRANT ALL ON TABLE "storage"."s3_multipart_uploads" TO "service_role";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads" TO "authenticated";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads" TO "anon";



GRANT ALL ON TABLE "storage"."s3_multipart_uploads_parts" TO "service_role";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads_parts" TO "authenticated";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads_parts" TO "anon";



GRANT SELECT ON TABLE "storage"."vector_indexes" TO "service_role";
GRANT SELECT ON TABLE "storage"."vector_indexes" TO "anon";
GRANT SELECT ON TABLE "storage"."vector_indexes" TO "authenticated";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "service_role";




