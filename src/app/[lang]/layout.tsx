import type { Metadata } from "next";
import { Inter, Space_Grotesk } from 'next/font/google';
import "@/app/globals.css";
import FullSidebar from "@/components/layout/FullSidebar";
import ScrollProvider from "@/components/layout/ScrollProvider";
import CustomScrollbar from '@/components/layout/CustomScrollbar';
import { locales } from "@/i18n/settings";
import { getDictionary } from "@/i18n/get-dictionary"; // IMPORTAR

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: "Silph Co. // PokeAcademy",
  description: "Advanced Pokémon Knowledge Hub",
};

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function RootLayout({ // ASYNC AHORA
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { lang: string };
}>) {
  // CARGAR DICCIONARIO
  const dict = await getDictionary(params.lang as any);

  return (
    <html lang={params.lang} className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-slate-950 text-slate-50 antialiased selection:bg-cyan-500/30 overflow-hidden">
        <div className="fixed top-0 left-0 h-full z-[9999]">
          {/* PASAR DATOS AL CLIENT COMPONENT */}
          <FullSidebar lang={params.lang} dict={dict} />
        </div>
        <ScrollProvider>
          <main className="relative z-0 pl-[5.5rem] w-full min-h-screen">
            {children}
          </main>
          <CustomScrollbar />
        </ScrollProvider>
      </body>
    </html>
  );
}