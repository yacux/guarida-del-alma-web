export interface NavLink {
  label: string;
  href: string;
}

export const PUBLIC_NAVIGATION: NavLink[] = [
  {
    label: "Aula Virtual",
    href: "/aula-virtual",
  },
  {
    label: "Sesiones",
    href: "/sesiones",
  },
  {
    label: "Productos",
    href: "/productos",
  },
];
