import { Profile, ClerkWebhookUserPayload, buildFullName } from '@/core/entities/Profile';
import { IProfileRepository } from '@/core/repositories';

export class CreateProfileUseCase {
  constructor(private profileRepository: IProfileRepository) {}

  async execute(payload: ClerkWebhookUserPayload): Promise<Profile> {
    // 1. Buscamos el email principal del array que nos manda Clerk
    const primaryEmailObj = payload.email_addresses.find(e => e.primary) 
                         || payload.email_addresses[0];
    
    if (!primaryEmailObj) {
      throw new Error("El payload de Clerk no contiene un email válido.");
    }

    // 2. Construimos la entidad base usando tus reglas de dominio
    const newProfile: Profile = {
      id: payload.id,
      email: primaryEmailObj.email_address,
      fullName: buildFullName(payload) || 'Usuario', // Usamos tu helper
      avatarUrl: payload.image_url,
      phone: null, // Por defecto al registrarse
      role: 'student', 
      createdAt: new Date().toISOString(), // Asumiendo que ISODateString es un alias de string
      updatedAt: new Date().toISOString(),
    };

    // 3. Delegamos el guardado a la capa de infraestructura
    return await this.profileRepository.create(newProfile);
  }
}