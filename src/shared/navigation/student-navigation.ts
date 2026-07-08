import { LayoutDashboard, User, Award } from "lucide-react";

export interface NavLink {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export const STUDENT_NAVIGATION: NavLink[] = [
  {
    label: "Mis Formaciones",
    href: "/aula-virtual",
    icon: LayoutDashboard,
  },
  {
    label: "Mi Perfil",
    href: "/aula-virtual/perfil",
    icon: User,
  },
  {
    label: "Mis Certificados",
    href: "/aula-virtual/certificados",
    icon: Award,
  },
];
