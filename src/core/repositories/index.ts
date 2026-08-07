export * from "./IProfileRepository";
export * from "./IAnnouncementRepository";
export * from "./IEnrollmentRepository";
export * from "./IEntitlementRepository";
export * from "./IMeetingRepository";
export * from "./IModuleRepository";
export * from "./IProductDetailsRepository";
export * from "./IProductRepository";
export * from "./ISessionRepository";
export * from "./ISubmissionRepository";
// los repositorios son la "puerta de entrada" a la capa de infraestructura,
// por eso los exportamos todos desde este archivo índice.
// los repositorios concretos (SupabaseProfileRepository, FirebaseProfileRepository, etc)
// se encargan de los detalles de cómo se guardan los datos,

// Cuando agregues más repositorios (ProductRepository, EnrollmentRepository),
// simplemente los vas agregando acá:
// export * from './IProductRepository';
