import type { Metadata } from "next";
import { Inter, Space_Grotesk } from 'next/font/google'; // IMPORTACIÓN CORRECTA SSoT
import "@/app/globals.css";
import FullSidebar from "@/components/layout/FullSidebar";
import ScrollProvider from "@/components/layout/ScrollProvider";
import CustomScrollbar from '@/components/layout/CustomScrollbar'; // COMPONENTE EXISTENTE
import { locales } from "@/i18n/settings";

// CONFIGURACIÓN FIEL AL SSoT
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: "Silph Co. // PokeAcademy",
  description: "Advanced Pokémon Knowledge Hub",
};

// Generación estática para rendimiento (i18n)
export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { lang: string };
}>) {
  return (
    // INYECCIÓN DE LANG DINÁMICO + VARIABLES CSS
    <html lang={params.lang} className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-slate-950 text-slate-50 antialiased selection:bg-cyan-500/30 overflow-hidden">
        
        {/* SIDEBAR: ESTRUCTURA ORIGINAL (Fixed + Z-Index) */}
        <div className="fixed top-0 left-0 h-full z-[9999]">
          <FullSidebar />
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <ScrollProvider>
          {/* Padding Left original para respetar el sidebar colapsado */}
          <main className="relative z-0 pl-[5.5rem] w-full min-h-screen">
            {children}
          </main>
          
          {/* CUSTOM SCROLLBAR ORIGINAL */}
          <CustomScrollbar />
        </ScrollProvider>
      </body>
    </html>
  );
}