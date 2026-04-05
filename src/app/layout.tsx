import type { Metadata } from "next";
import Header from "@/shared/components/Header";
import Footer from "@/shared/components/Footer";
import "./globals.css";
import { Inter, Cormorant_Garamond } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const cormorant = Cormorant_Garamond({
  weight: ["300", "400", "600"], // Variedad de grosores para jerarquía
  style: ["normal", "italic"], // La cursiva de Cormorant es hermosa para frases
  subsets: ["latin"],
  variable: "--font-spiritual",
});

export const metadata: Metadata = {
  title: "La Guarida del Alma",
  description: "Bienestar holístico y espiritual",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${cormorant.variable}`}>
      <body className="min-h-screen flex flex-col bg-fuchsia-100 text-violet-600">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
