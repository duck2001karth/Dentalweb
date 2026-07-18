export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Carmo Dental",
  description:
    "Sistema de gestión integral para la clínica odontológica Carmo Dental. Administración de pacientes, agenda de citas, tratamientos, evolución clínica y facturación electrónica.",
  mainNav: [
    {
      title: "Panel de Inicio",
      href: "/admin",
    },
    {
      title: "Pacientes",
      href: "/pacientes",
    },
    {
      title: "Agenda",
      href: "/agenda",
    },
  ],
};