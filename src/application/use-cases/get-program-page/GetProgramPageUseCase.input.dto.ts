// src/application/use-cases/get-program-content/GetProgramContentsUseCase.input.dto.ts

export interface GetProgramPageInput {
  /** Slug del programa. Viene de la URL: /aula-virtual/programa-ave-fenix */
  programSlug: string;
}
