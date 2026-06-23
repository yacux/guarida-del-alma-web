import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";
import { Inter, Raleway } from "next/font/google";
import { esES } from "@clerk/localizations";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const raleway = Raleway({
  weight: ["300", "400", "600"], // Variedad de grosores para jerarquía
  style: ["normal", "italic"], // La cursiva de Cormorant es hermosa para frases
  subsets: ["latin"],
  variable: "--font-spiritual",
});

export const metadata: Metadata = {
  // Truco extra: Usamos un template para que las subpáginas cambien el título dinámicamente
  title: {
    default: "La Guarida del Alma",
    template: "%s | La Guarida del Alma",
  },
  description: "Bienestar holístico y espiritual",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${raleway.variable}`}>
      <body className="min-h-screen flex flex-col bg-linear-to-r via-35% from-guarida-violet via-guarida-dark-violet to-guarida-dark-violet text-guarida-violet">
        <ClerkProvider localization={esES}>{children}</ClerkProvider>
      </body>
    </html>
  );
}
