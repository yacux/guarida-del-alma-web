import { Profile } from '../entities/Profile';

export interface IProfileRepository {
  /**
   * Guarda un nuevo perfil en el sistema.
   * La implementación (Supabase, Firebase, o lo que sea) se encargará de los detalles.
   */
  create(profile: Profile): Promise<Profile>;
}