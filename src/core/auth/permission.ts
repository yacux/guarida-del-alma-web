// src/core/auth/Permission.ts
export enum Permission {
  // Productos
  ManageProducts = "manage_products",
  ViewProducts = "view_products",

  // Contenido educativo
  ManageModules = "manage_modules",
  ManageResources = "manage_resources",

  // Correcciones
  ReviewAssignments = "review_assignments",
  SubmitAssignments = "submit_assignments",

  // Comunicación
  ManageAnnouncements = "manage_announcements",
  ManageMeetings = "manage_meetings",

  // Pagos y matrículas
  ManageEnrollments = "manage_enrollments",
  ManagePayments = "manage_payments",
  ViewOwnEnrollments = "view_own_enrollments",

  // Sesiones individuales
  ManageSessions = "manage_sessions",
  BookSessions = "book_sessions",

  // Admin
  ManageUsers = "manage_users",
  ViewAdminDashboard = "view_admin_dashboard",
}
