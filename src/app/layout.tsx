import { Inter, Space_Grotesk } from 'next/font/google';
import ScrollProvider from '@/components/layout/ScrollProvider';
import FullSidebar from '@/components/layout/FullSidebar';
import './globals.css';
import CustomScrollbar from '@/components/layout/CustomScrollbar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-slate-950 text-slate-50 antialiased selection:bg-cyan-500/30 overflow-hidden">
        {/* SIDEBAR: Fuera del ScrollProvider y con Z-Index Máximo */}
        <div className="fixed top-0 left-0 h-full z-[9999]">
          <FullSidebar />
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <ScrollProvider>
          {/* Margen izquierdo para no tapar contenido (80px = w-20 del sidebar colapsado) */}
          <main className="relative z-0 pl-[5.5rem] w-full min-h-screen">
            {children}
          </main>
          {/* AÑADIR AQUÍ AL FINAL, DENTRO DEL SCROLLPROVIDER PERO FUERA DEL MAIN */}
          <CustomScrollbar />
        </ScrollProvider>
      </body>
    </html>
  );
}
