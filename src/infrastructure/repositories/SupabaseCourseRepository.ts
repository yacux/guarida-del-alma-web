// Esta clase vive en src/infrastructure/repositories/SupabaseProfileRepository.ts. 
// Su único trabajo es hablar el idioma de la base de datos (SQL / snake_case) y traducir los resultados al idioma de nuestro Core (TypeScript / camelCase).

// Como estamos en el servidor ejecutando un webhook de registro, usamos la SUPABASE_SERVICE_ROLE_KEY para 
// poder saltear las políticas RLS, ya que la alumna aún no inició sesión en la app web.

// src/infrastructure/repositories/SupabaseProfileRepository.ts

import { createClient } from '@supabase/supabase-js';
import { Profile } from '../../core/entities/Profile';
import { IProfileRepository } from '../../core/repositories/IProfileRepository';

// 1. Inicializamos el cliente "Admin" de Supabase.
// Este cliente usa la Service Role Key, dándonos superpoderes en el servidor
// para insertar registros antes de que las políticas RLS bloqueen la petición.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class SupabaseProfileRepository implements IProfileRepository {
  
  // Cumplimos con el contrato que nos exige el Core
  async create(profile: Profile): Promise<Profile> {
    
    // 2. Traducimos nuestra Entidad limpia (camelCase) al formato de la Base de Datos (snake_case)
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: profile.id,                 // "user_2abc..." (ClerkUserId)
          email: profile.email,
          full_name: profile.fullName,    // snake_case en la DB
          avatar_url: profile.avatarUrl,  // snake_case en la DB
          role: profile.role,             // 'student'
          phone: profile.phone,
        }
      ])
      .select() // Le pedimos a Supabase que nos devuelva el registro creado
      .single(); // Como es una sola inserción, pedimos un objeto directo, no un array

    // 3. Si Supabase devuelve un error (ej: email duplicado o problemas de conexión), frenamos todo
    if (error) {
      throw new Error(`[SupabaseProfileRepository] Error al insertar: ${error.message}`);
    }

    // 4. Mapeo de salida: Convertimos el registro de la base de datos (snake_case)
    // nuevamente a nuestra Entidad pura del Core (camelCase) para cumplir la promesa.
    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      avatarUrl: data.avatar_url,
      phone: data.phone,
      role: data.role,
      createdAt: data.created_at, // Asumimos que viene como ISODateString de la DB
      updatedAt: data.updated_at,
    };
  }
}