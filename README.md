# 🌌 La Guarida del Alma

**Plataforma Integral de Bienestar Holístico** *Danza-terapia · Bioneuroemoción · Coaching · E-commerce Terapéutico*

---

## 📝 Descripción del Proyecto

**La Guarida del Alma** es un ecosistema digital diseñado para centralizar y potenciar servicios de sanación y crecimiento personal. La plataforma combina la venta de formación online (cursos y packs), la gestión de sesiones terapéuticas individuales y una tienda exclusiva de productos físicos (ropa y agendas), todo bajo una experiencia de usuario minimalista, profesional y espiritual.

### 🎯 Objetivos Clave
- **Educación:** Venta y visualización de cursos de Danza-terapia y Psicoeducación.
- **Transformación:** Gestión de sesiones de Bioneuroemoción, Hipnosis y Coaching.
- **Comunidad:** Espacio de testimonios y divulgación sobre salud emocional.
- **Comercio:** Tienda integrada de productos físicos que acompañan el proceso terapéutico.

---

## 🛠️ Stack Tecnológico

Este proyecto está construido con un enfoque en **escalabilidad, rendimiento y mantenibilidad**, utilizando las tecnologías más modernas del ecosistema web:

- **Frontend:** [Next.js 14+](https://nextjs.org/) (App Router)
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/) (Diseño responsivo y minimalista)
- **Base de Datos & Auth:** [Supabase](https://supabase.com/) (PostgreSQL + RLS para seguridad)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/) (Tipado estricto para evitar errores)
- **Gestor de Paquetes:** [pnpm](https://pnpm.io/) (Instalaciones rápidas y eficientes)
- **Arquitectura:** **Clean Architecture** (Separación de capas: Domain, Application e Infrastructure)

---

## 🚀 Características Principales

### 👤 Para el Usuario
- **Dashboard de Alumno:** Acceso centralizado a cursos adquiridos y próximos encuentros.
- **Pagos Multimoneda:** Integración con **Mercado Pago** (ARS) y **PayPal** (USD).
- **Reserva de Sesiones:** Sistema intuitivo para agendar terapias individuales.

### 🔐 Para el Administrador (Admin Panel)
- **Gestión de Contenidos:** ABM (Alta, Baja, Modificación) de cursos, productos y precios.
- **Control de Ventas:** Visualización de ingresos y pedidos de la tienda física.
- **Gestión de Clientes:** Listado de alumnos y seguimiento de sesiones.

---

## 📂 Estructura de Carpetas (Clean Architecture)

```text
src/
├── core/               # Capa de Dominio (Entidades e Interfaces)
├── application/        # Casos de Uso (Lógica de Negocio)
├── infrastructure/     # Implementaciones (Supabase, Pasarelas de Pago)
├── components/         # UI Components (Atomic Design)
└── app/                # Next.js App Router (Rutas y Layouts)
