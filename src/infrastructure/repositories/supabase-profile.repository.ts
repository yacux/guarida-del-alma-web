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
          avatar_url: profile.avatarUrl,
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

    return {
      id: data.id,
      email: data.email,
      username: data.username,
      avatarUrl: data.avatar_url,
      role: data.role,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
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

    return {
      id: data.id,
      email: data.email,
      username: data.username,
      avatarUrl: data.avatar_url,
      role: data.role,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
