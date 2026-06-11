import {ClerkProvider} from "@clerk/nextjs";
import type { Metadata } from "next";
import Header from "@/shared/components/organisms/Header";
import Footer from "@/shared/components/organisms/Footer";
import "./globals.css";
import { Inter, Raleway } from "next/font/google";
import Image from "next/image";

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
  title: "La Guarida del Alma",
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
        <ClerkProvider>
          <Image
          src="/lights-1.png.webp"
          alt="alma"
          width={550}
          height={550}
          className="aspect-square light-beam-left animate-light-1"
          priority
          />
          <Image
          src="/lights-2.png.webp"
          alt="alma"
          width={550}
          height={550}
          className="aspect-square light-beam-left animate-light-2"
          priority
          />
          <Header />
          {children}
          <Footer />
        </ClerkProvider>
      </body>
    </html>
  );
}