import { Profile } from "../entities/Profile";

export interface IProfileRepository {
  /**
   * Guarda un nuevo perfil en el sistema.
   * La implementación (Supabase, Firebase, o lo que sea) se encargará de los detalles.
   * Esta interface lo que hace es definir un contrato: cualquier clase que implemente IProfileRepository
   * debe tener un método 'create' que reciba un Profile y devuelva una Promise de Profile.
   * Esto nos permite escribir código en la capa de aplicación (casos de uso) sin preocuparnos por cómo se guardan los datos,
   *
   * En el caso del webhook de Clerk, el CreateProfileUseCase va a depender de esta interfaz,
   * y gracias a eso podemos inyectarle cualquier implementación concreta (como SupabaseProfileRepository)
   * sin que el caso de uso tenga que saber nada sobre cómo se guardan los datos.
   * El caso de uso solo sabe que tiene un "profileRepository" que cumple con el contrato definido por IProfileRepository,
   * y eso es todo lo que necesita para funcionar.
   */
  create(profile: Profile): Promise<Profile>; // Solo la firma del método, sin llaves {}
  // para desarrollar en el Futuro:
  // update(profile: Profile): Promise<Profile>;
}

// ¿Por qué no lleva llaves {}?
// Porque en TypeScript:

// Las llaves { ... } significan "así se hace esto" (ejecución/lógica).
// La interfaz significa "esto es lo que hay que hacer" (definición/plano).

// En una interfaz, solo definimos la firma del método (qué recibe y qué devuelve),
// pero no implementamos la lógica de cómo se hace.
// La implementación concreta (con llaves y lógica) se hace en la clase que implementa esta interfaz, como SupabaseProfileRepository.
