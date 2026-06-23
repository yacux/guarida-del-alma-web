"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  PlayCircle,
  Award,
  Users,
  FileText,
  Video,
  CalendarDays,
} from "lucide-react";

// 1. IMPORTACIONES DEL CORE FULLSTACK
import {
  ProductVariant,
  isProgram,
  isCourse,
  isWorkshop,
} from "@/core/entities/Product";
import {
  Enrollment,
  isEnrollmentActive,
  getRemainingSessionsCount,
} from "@/core/entities/Enrollment";
import { UserEntitlement } from "@/core/entities/Entitlement";

// 2. MODELO DE INTERFAZ (El "UI Model" que une Matrícula + Producto)
interface EnrichedEnrollment {
  enrollment: Enrollment;
  product: ProductVariant;
  progress: number; // Este vendrá de tu tabla de progreso de clases/módulos
}

// 3. MOCK DATA REALISTA EN BASE A TUS TRIGGERS DE BASE DE DATOS (v3 - Año 2026)
const MOCK_ENRICHED_ENROLLMENTS: EnrichedEnrollment[] = [
  {
    progress: 68,
    enrollment: {
      id: "enr-loto-123",
      studentId: "user_clerk_01",
      productId: "prod-flor-loto",
      orderId: "ord-999",
      source: "payment_flow",
      enrolledBy: null,
      status: "active",
      startedAt: "2026-01-10T00:00:00Z",
      expiresAt: "2026-07-10T00:00:00Z", // 6 meses después
      sessionsTotal: 6, // Flor de Loto tiene 6 sesiones
      sessionsUsed: 2,
      notes: null,
      createdAt: "2026-01-10T00:00:00Z",
      updatedAt: "2026-01-10T00:00:00Z",
    },
    product: {
      id: "prod-flor-loto",
      name: "Programa Flor de Loto",
      slug: "flor-de-loto",
      description: "Sanación profunda.",
      shortDescription:
        "Reconexión con tu niña interior y sanación de heridas de la infancia.",
      price_usd: 250,
      price_ars: 220000,
      productType: "program",
      coverImageUrl: null,
      accessDurationMonths: 6,
      welcomeVideoUrl: "https://vimeo.com/... ",
      hasWhatsappCommunity: true,
      isActive: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      programDetails: {
        individualSessionsCount: 6,
        grantsCertificate: true,
        approvalMinScore: 80,
        includedProductIds: ["sub-curso-infancia", "sub-taller-loto"],
      },
    },
  },
  {
    progress: 100,
    enrollment: {
      id: "enr-voz-456",
      studentId: "user_clerk_01",
      productId: "prod-desata-voz",
      orderId: null, // Creado directo por Hebe
      source: "admin_direct",
      enrolledBy: "user_hebe_admin",
      status: "active",
      startedAt: "2026-05-01T00:00:00Z",
      expiresAt: "2026-08-01T00:00:00Z", // 3 meses
      sessionsTotal: 0, // Cursos/Talleres sueltos no tienen sesiones 1-on-1
      sessionsUsed: 0,
      notes: "Habilitación de cortesía por feedback en redes",
      createdAt: "2026-05-01T00:00:00Z",
      updatedAt: "2026-05-01T00:00:00Z",
    },
    product: {
      id: "prod-desata-voz",
      name: "Taller Vivencial: Desata tu Voz",
      slug: "desata-tu-voz",
      description: null,
      shortDescription:
        "Aprende a comunicar tus límites y expresar tu verdad álmica.",
      price_usd: 55,
      price_ars: 45000,
      productType: "workshop",
      coverImageUrl: null,
      accessDurationMonths: 3,
      welcomeVideoUrl: null,
      hasWhatsappCommunity: false,
      isActive: true,
      createdAt: "2026-02-15T00:00:00Z",
      updatedAt: "2026-02-15T00:00:00Z",
      workshopDetails: {
        globalPdfUrl: "/downloads/bitacora-desata-tu-voz.pdf",
      },
    },
  },
];

export default function AulaVirtualPage() {
  const [expandedEnrollmentId, setExpandedEnrollmentId] = useState<
    string | null
  >(null);

  const formatExpiration = (dateStr: string) => {
    const date = new Date(dateStr);
    return `Vence el ${date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* HEADER PRINCIPAL */}
      <div className="border-b border-zinc-800/60 pb-6">
        <div className="flex items-center gap-2 text-guarida-fuchsia mb-1">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest font-sans">
            Espacio Sagrado de Estudio
          </span>
        </div>
        <h1 className="font-spiritual text-3xl md:text-4xl font-bold tracking-wide text-transparent bg-clip-text bg-linear-to-r from-white via-zinc-200 to-zinc-400">
          Mis Aprendizajes activos
        </h1>
      </div>

      {/* RECORRIDO DE MATRÍCULAS (ENROLLMENTS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_ENRICHED_ENROLLMENTS.map(({ enrollment, product, progress }) => {
          // Ejecutamos las reglas del negocio de tus helpers del core
          const isActive = isEnrollmentActive(enrollment);
          const isProg = isProgram(product);
          const isExpanded = expandedEnrollmentId === enrollment.id;
          const remainingSessions = getRemainingSessionsCount(enrollment);

          // Si por alguna razón la matrícula expiró o está pausada, manejamos un estilo visual atenuado
          if (!isActive) return null;

          return (
            <div
              key={enrollment.id}
              onClick={() =>
                isProg &&
                setExpandedEnrollmentId(isExpanded ? null : enrollment.id)
              }
              className={`
                group bg-zinc-900/40 backdrop-blur-md border rounded-2xl p-6 shadow-xl transition-all duration-300 flex flex-col justify-between h-fit
                ${
                  isProg && isExpanded
                    ? "border-guarida-fuchsia bg-zinc-900/80 shadow-guarida-fuchsia/5 lg:col-span-2"
                    : "border-zinc-800/80 hover:border-guarida-violet/50 hover:bg-zinc-900/60"
                }
                ${isProg && !isExpanded ? "cursor-pointer" : ""}
              `}
            >
              <div>
                {/* CABECERA: Identificación del subtipo de producto */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`
                    text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border
                    ${isProgram(product) ? "bg-guarida-fuchsia/10 text-guarida-fuchsia border-guarida-fuchsia/20" : ""}
                    ${isCourse(product) ? "bg-blue-950/20 text-blue-400 border-blue-900/30" : ""}
                    ${isWorkshop(product) ? "bg-purple-950/20 text-purple-400 border-purple-900/30" : ""}
                  `}
                  >
                    {product.productType === "program" &&
                      "🔮 Programa Integral"}
                    {product.productType === "course" &&
                      "📚 Curso Teórico-Práctico"}
                    {product.productType === "workshop" &&
                      "🧘 Taller Vivencial"}
                  </span>

                  {progress === 100 && (
                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold bg-emerald-950/10 px-2 py-0.5 rounded-md border border-emerald-900/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Completado</span>
                    </div>
                  )}
                </div>

                {/* TÍTULOS */}
                <h3 className="font-spiritual text-xl font-bold text-white tracking-wide group-hover:text-guarida-fuchsia/90 transition-colors">
                  {product.name}
                </h3>
                {product.shortDescription && (
                  <p className="text-zinc-400 text-xs mt-1 line-clamp-2">
                    {product.shortDescription}
                  </p>
                )}

                {/* CARACTERÍSTICAS MEDIANTE TYPE GUARDS Y PROPIEDADES BASE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-[11px] text-zinc-400">
                  {product.hasWhatsappCommunity && (
                    <div className="flex items-center gap-1.5 bg-zinc-950/40 px-2.5 py-1.5 rounded-lg border border-zinc-800/40">
                      <Users className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Tribu de WhatsApp</span>
                    </div>
                  )}
                  {product.welcomeVideoUrl && (
                    <div className="flex items-center gap-1.5 bg-zinc-950/40 px-2.5 py-1.5 rounded-lg border border-zinc-800/40">
                      <Video className="w-3.5 h-3.5 text-guarida-fuchsia" />
                      <span>Video de Bienvenida</span>
                    </div>
                  )}

                  {/* Lógica exclusiva de Programas: Sesiones 1-on-1 consumiendo el Enrollment */}
                  {isProg && enrollment.sessionsTotal > 0 && (
                    <div className="flex items-center gap-1.5 bg-amber-950/20 text-amber-300 px-2.5 py-1.5 rounded-lg border border-amber-900/30 col-span-2">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>
                        Sesiones Alquímicas: {remainingSessions} disponibles de{" "}
                        {enrollment.sessionsTotal}
                      </span>
                    </div>
                  )}

                  {/* Lógica exclusiva de Cursos con Certificación */}
                  {isCourse(product) &&
                    product.courseDetails.grantsCertificate && (
                      <div className="flex items-center gap-1.5 bg-zinc-950/40 px-2.5 py-1.5 rounded-lg border border-zinc-800/40 col-span-2">
                        <Award className="w-3.5 h-3.5 text-blue-400" />
                        <span>
                          Otorga Diploma de Honor (Nota mín:{" "}
                          {product.courseDetails.approvalMinScore})
                        </span>
                      </div>
                    )}

                  {/* Lógica exclusiva de Talleres: El manual de lectura global */}
                  {isWorkshop(product) &&
                    product.workshopDetails.globalPdfUrl && (
                      <a
                        href={product.workshopDetails.globalPdfUrl}
                        onClick={(e) => e.stopPropagation()} // Para que no dispare la navegación de la card
                        className="flex items-center gap-1.5 bg-purple-950/30 text-purple-300 px-2.5 py-1.5 rounded-lg border border-purple-900/30 col-span-2 hover:bg-purple-950/50 transition-colors w-fit"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Descargar Bitácora PDF</span>
                      </a>
                    )}
                </div>

                {/* BARRA DE PROGRESO */}
                <div className="mt-5">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-500">Tu avance</span>
                    <span className="font-semibold text-zinc-300">
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-900">
                    <div
                      className="bg-linear-to-r from-guarida-violet to-guarida-fuchsia h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* PIE DE LA TARJETA */}
              <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-medium">
                  {formatExpiration(enrollment.expiresAt)}
                </span>

                {isProg ? (
                  <button className="flex items-center gap-1 text-guarida-fuchsia font-semibold hover:underline">
                    {isExpanded ? (
                      <>
                        Ocultar contenidos <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Ver módulos incluidos (
                        {product.programDetails.includedProductIds.length}){" "}
                        <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                ) : (
                  <button className="flex items-center gap-1 text-guarida-violet font-semibold hover:text-white transition-colors">
                    Entrar al espacio →
                  </button>
                )}
              </div>

              {/* CONTENIDOS ADICIONALES (Expandibles del Programa) */}
              {isProg && isExpanded && (
                <div
                  className="mt-4 pt-4 border-t border-zinc-800/80 space-y-2 animate-fade-in lg:col-span-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Cursos y Talleres amparados bajo esta Matrícula:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {product.programDetails.includedProductIds.map(
                      (subId, idx) => (
                        <div
                          key={subId}
                          className="flex items-center justify-between bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/40 hover:border-zinc-700 transition-colors group/item cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <PlayCircle className="w-4 h-4 text-zinc-500 group-hover/item:text-guarida-fuchsia transition-colors flex-shrink-0" />
                            <span className="text-xs text-zinc-300 truncate font-sans">
                              Fase {idx + 1}: Sub-módulo formativo habilitado
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
