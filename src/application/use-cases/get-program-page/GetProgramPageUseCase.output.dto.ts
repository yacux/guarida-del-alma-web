// src/application/use-cases/program/GetProgramContentsUseCase.output.dto.ts

import type { Program } from "@/core/entities/Product";
import type { Product } from "@/core/entities/Product";
import type { Announcement } from "@/core/entities/Announcement";

export interface GetProgramPageOutput {
  /** El programa con todos sus metadatos */
  program: Program;
  /**
   * Los productos incluidos en el programa.
   * Son Product base (no variantes) — suficiente para renderizar cards.
   */
  includedProducts: Product[];

  /** Avisos del foro del programa, ordenados: pinneados primero, luego por fecha desc. */
  announcements: Announcement[];
}
