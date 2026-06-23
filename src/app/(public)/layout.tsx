import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import Header from "@/shared/components/organisms/Header";
import Footer from "@/shared/components/organisms/Footer";
import "../globals.css";
import { Inter, Raleway } from "next/font/google";
import Image from "next/image";
import { esES } from "@clerk/localizations";

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
    <main className="min-h-screen flex flex-col bg-linear-to-r via-35% from-guarida-violet via-guarida-dark-violet to-guarida-dark-violet text-guarida-violet">
      <ClerkProvider localization={esES}>
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
    </main>
  );
}
