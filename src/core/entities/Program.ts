// src/core/entities/Program.ts

// Aquí defines el Programa Fénix y Flor de Loto.
// Esta entidad debe contener la lógica de qué incluye cada uno
// (ej. una lista de IDs de cursos y la bandera de hasCertificate).

export type ProgramType = "FENIX" | "FLOR_DE_LOTO";

export interface Program {
  id: string;
  name: string;
  durationMonths: number;
  hasCertificate: boolean;
  includesAllContent: boolean;
  individualSessions: number;
  specificServices?: string[]; // IDs de talleres y cursos específicos que incluye
}

// Aquí defines la "verdad" de tus programas
export const PROGRAMS: Record<ProgramType, Program> = {
  FENIX: {
    id: "prog-fenix",
    name: "Programa Fénix",
    durationMonths: 12,
    hasCertificate: true,
    includesAllContent: true,
    individualSessions: 12,
    specificServices: ["amor-propio", "desata-tu-voz", "abuso-narcisista"],
  },
  // AVE FENIX ES UN PROGRAMA QUE
  // - DA ACCESO POR UN ANIO A TODA LA PLATAFORMA
  // - CERTIFICADO DE DANZA TERAPEUTA SHAUMBRA
  // - INCLUYE TODOS LOS CURSOS Y TALLERES DE LA PLATAFORMA
  // - UN ENCUENTRO MENSUAL DURANTE TODO EL ANIO PARA LA FORMACION DE DANZA TERAPEUTICA Y PROFUNDIZAR SOBRE AMOR PROPIO CON PRACTICAS
  // - 2 ENCUENTROS DURANTE EL ANIO PARA PROFUNDIZAR EN EL TALLER DESATA TU VOZ Y EL TALLER RESURGE DESPUES DEL ABUSO NARCISISTA
  // - 12 SESIONES INDIVIDUALES APLICANDO MENTORIA, PNL, HIPNOSIS, COACHING ONTOLOGICO

  FLOR_DE_LOTO: {
    id: "prog-loto",
    name: "Flor de Loto",
    durationMonths: 6,
    hasCertificate: false,
    includesAllContent: false,
    individualSessions: 8,
    specificServices: ["amor-propio", "desata-tu-voz", "abuso-narcisista"],
  },
};
// FLOR DE LOTO ES UN PROGRAMA QUE

// - ACCESO A LA PLATAFORMA POR 6 MESES
// - NO INCLUYE EL CERTIF DE DANZA TERAPIA SHAUMBRA
// - PERO SI: CURSO "AMOR PROPIO", Y LOS 2 TALLERES "DESATA TU VOZ" Y "ABUSO NARCISISTA"
// - CON 8 ENCUENTROS CON SESIONES INDIVIDUALES (1 A 1)
// - 1 ENCUENTRO EN ESE SEMESTRE PARA PROFUNDIZAR SOBRE LOS TALLERES
