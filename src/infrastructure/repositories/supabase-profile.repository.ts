import { SupabaseClient } from "@supabase/supabase-js";
import { Profile } from "../../core/entities/Profile";
import { IProfileRepository } from "../../core/repositories/IProfileRepository";

export class SupabaseProfileRepository implements IProfileRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(profile: Profile): Promise<Profile> {
    const { data, error } = await this.supabase
      .from("profiles")
      .insert([
        {
          id: profile.id,
          email: profile.email,
          username: profile.username,
          avatar_url: profile.avatarUrl, // Aquí mapeamos de Core a Base de Datos
          role: profile.role,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(
        `[SupabaseProfileRepository] Error al insertar: ${error.message}`,
      );
    }

    // Usamos el mapper para el dato que devuelve Supabase
    return this.rowToDomain(data);
  }

  async findById(profileId: string): Promise<Profile> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    if (error) {
      throw new Error(
        `[SupabaseProfileRepository] Error al buscar perfil: ${error.message}`,
      );
    }

    // Mapeo directo para un solo objeto
    return this.rowToDomain(data);
  }

  async findAllStudents(): Promise<Profile[]> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("role", "student")
      .order("created_at", { ascending: false }); // 👈 Ordena de más reciente a más antiguo

    if (error) {
      throw new Error(`[ProfileRepository.findAllStudents] ${error.message}`);
    }

    // Mapeo en iteración para el array
    return (data ?? []).map((row) => this.rowToDomain(row));
  }

  // TRADUCTOR CENTRALIZADO (Mapper)
  // Convierte el registro de la DB (snake_case) a nuestra entidad (camelCase)
  private rowToDomain(row: any): Profile {
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      avatarUrl: row.avatar_url,
      role: row.role,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
