// src/application/use-cases/CreateProfileUseCase.ts
import { Profile, ClerkWebhookUserPayload } from "@/core/entities/Profile";
import { IProfileRepository } from "@/core/repositories";

export class CreateProfileUseCase {
  /**
   * 1. Declaración:
   * Aquí definimos que la clase tendrá una propiedad privada llamada 'profileRepository'.
   * defino que su tipo de dato es 'IProfileRepository'. Eso asegura que cualquier cosa que
   * guardemos aquí debe cumplir con los métodos definidos en dicha interfaz.
   * La palabra 'private' impide que se acceda a esta variable desde fuera de la clase.
   * por el momento, lo unico que tiene esta interfaz es el método 'create', pero en el futuro podría agregar más métodos (findById, update, delete, etc)
   */
  private profileRepository: IProfileRepository;

  /**
   * 2. Constructor:
   * Este método se ejecuta automáticamente cuando hacemos 'new CreateProfileUseCase(...)'.
   * el constructor no recibe desde afuera un parametro. sino que recibe desde ad
   */
  constructor(profileRepository: IProfileRepository) {
    /**
     * 2. Asignación:
     * Tomamos el repositorio que nos pasaron como argumento y lo guardamos
     * en la propiedad 'profileRepository' de nuestra instancia de caso de uso.
     * a la propiedad privada definida arriba (profileRepository)
     * le asignamos el valor del argumento recibido (profileRepository).
     * el de la derecha es el que se le pasa a este constructor cuando se instancia la clase, y el de la izquierda es la propiedad privada de esta clase.
     */
    this.profileRepository = profileRepository;
  }

  // El método execute es el que recibe el argumento de la llamada a este caso de uso cuando a este se le pone .execute
  // recibira el payload del usuario.
  // y defino que el payload recibido debe ser del tipo ClerkWebhookUserPayload,
  // que es el formato específico que Clerk me manda en su webhook.
  async execute(payload: ClerkWebhookUserPayload): Promise<Profile> {
    // 1. Buscamos el email principal del array que nos manda Clerk
    const primaryEmailObj =
      payload.email_addresses.find((e) => e.primary) ||
      payload.email_addresses[0];

    if (!primaryEmailObj) {
      throw new Error("El payload de Clerk no contiene un email válido.");
    }

    // 2. Construimos la entidad base usando tus reglas de dominio
    // esta lógica de construcción del perfil es parte de la "lógica de negocio"
    // y por eso la dejamos aquí, en el caso de uso, que es donde debe estar.
    const newProfile: Profile = {
      id: payload.id,
      email: primaryEmailObj.email_address,
      username: payload.username || "Alumno",
      avatarUrl: payload.image_url,
      role: "student",
      createdAt: new Date().toISOString(), // Asumiendo que ISODateString es un alias de string
      updatedAt: new Date().toISOString(),
    };

    // 3. Delegamos el guardado a la capa de infraestructura
    return await this.profileRepository.create(newProfile);
  }
}

// llamando al caso de uso desde el webhook:

// 1. AQUÍ se inicializa el caso de uso.
// se ejecuta EL CONSTRUCTOR: Pasas la HERRAMIENTA (el repositorio)
// Esto se hace con el "new". No le pasas datos de ningún usuario todavía.
//
// const profileRepository = new SupabaseProfileRepository();

// en este punto, el CU ya tiene la herramienta (el repo) para guardar perfiles, pero no tiene ningún dato de usuario todavía.
// le paso por parametro el repo y dentro del CU se usa en el con
// const createProfileUseCase = new CreateProfileUseCase(profileRepository);

// 2. AQUÍ se ejecuta el caso de uso propiamente dicho.
// se ejecuta EL EXECUTE: Pasas los DATOS (el payload del usuario)
// El caso de uso ya está creado. Ahora le dices "¡Trabaja con estos datos reales!"
// await createProfileUseCase.execute(clerkUserPayload);
