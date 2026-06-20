// Esta clase vive en src/infrastructure/repositories/SupabaseProfileRepository.ts.
// Su único trabajo es hablar el idioma de la base de datos (SQL / snake_case)
// y traducir los resultados al idioma de nuestro Core (TypeScript / camelCase).

// Como estamos en el servidor ejecutando un webhook de registro, usamos la SUPABASE_SERVICE_ROLE_KEY para
// poder saltear las políticas RLS, ya que la alumna aún no inició sesión en la app web.

// este repositorio es el encargado de guardar los perfiles en la base de datos de Supabase.
// los repositorios son la capa que conecta el mundo exterior (bases de datos, APIs, etc.) con nuestro Core limpio.

// Importamos el cliente de Supabase y las interfaces necesarias del Core
import { createClient } from "@supabase/supabase-js";
import { Profile } from "../../core/entities/Profile";
import { IProfileRepository } from "../../core/repositories/IProfileRepository";

// 1. Inicializamos el cliente "Admin" de Supabase.
// Este cliente usa la Service Role Key, dándonos superpoderes en el servidor
// para insertar registros antes de que las políticas RLS bloqueen la petición.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// 2. Creamos la clase que implementa el contrato de IProfileRepository.
// Esta clase es la implementación concreta que se encargará de guardar los perfiles en Supabase.
// en este caso, la interfaz IProfileRepository nos obliga a tener un método 'create' que reciba un Profile y devuelva una Promise de Profile.
export class SupabaseProfileRepository implements IProfileRepository {
  // primero cumplimos el contrato: el método 'create' que recibe un Profile y devuelve una Promise de Profile.
  // este create hace que se cree un ob
  async create(profile: Profile): Promise<Profile> {
    // luego seguimos con la lógica de cómo se guarda el perfil en Supabase:
    // 1. Recibimos un objeto Profile con camelCase (nuestro idioma del Core).
    // ese objeto de clase Profile viene por parametro, cuando se llama a este método create desde el CU CreateProfileUseCase.
    // 2. Usamos el cliente de Supabase para insertar un nuevo registro en la tabla 'profiles'.

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .insert([
        {
          id: profile.id, //
          email: profile.email,
          username: profile.username, // snake_case en la DB
          avatar_url: profile.avatarUrl, // snake_case en la DB
          role: profile.role, // 'student'
        },
        //  inserta en cada columna de profiles los valores del objeto profile recibido
        // por parametro cuando se llama a este método create desde el CU CreateProfileUseCase.
        // recordar que el objeto profile que trae el CU es el payload que llega desde el webhook de Clerk,
        // pero ya transformado a nuestra entidad Profile del Core, con camelCase.

        // SI CAMBIA LA COLUMNA FULL_NAME POR NOMBRE_COMPLETO, solo lo cambio aca en infrastructure.
        // no se entera el CU ni el core, Por eso esta bueno clean arquitecture.
      ])
      .select() // 3. Le pedimos a Supabase que nos devuelva el registro creado
      .single(); // Como es una sola inserción, pasamos ese array de un objeto a un solo objeto con .single()

    // 3. Si Supabase devuelve un error (ej: email duplicado o problemas de conexión), frenamos todo
    if (error) {
      throw new Error(
        `[SupabaseProfileRepository] Error al insertar: ${error.message}`,
      );
    }

    // 4. Mapeo de salida: Convertimos el registro de la base de datos (snake_case)
    // nuevamente a nuestra Entidad pura del Core (camelCase) para cumplir la promesa.
    // O SEA HACEMOS LO INVERSO, VOLVEMOS A CAMELCASE, PORQUE EL CORE SOLO CONOCE ESE FORMATO.
    // Y PROMETIMOS QUE UNA VEZ CREADO EN LA DB, DEVOLVERIAMOS UN OBJETO DE TIPO PROFILE.
    return {
      id: data.id,
      email: data.email,
      username: data.full_name,
      avatarUrl: data.avatar_url,
      role: data.role,
      createdAt: data.created_at, // Asumimos que viene como ISODateString de la DB
      updatedAt: data.updated_at,
    };
  }
}
