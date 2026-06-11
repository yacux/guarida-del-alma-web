export * from './IProfileRepository';
// los repositorios son la "puerta de entrada" a la capa de infraestructura, 
// por eso los exportamos todos desde este archivo índice.
// los repositorios concretos (SupabaseProfileRepository, FirebaseProfileRepository, etc) 
// se encargan de los detalles de cómo se guardan los datos,

// Cuando agregues más repositorios (ProductRepository, EnrollmentRepository),
// simplemente los vas agregando acá:
// export * from './IProductRepository';