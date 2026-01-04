'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Configuración conservadora para evitar re-fetches agresivos
            staleTime: 60 * 1000, // Los datos se consideran frescos por 1 minuto
            refetchOnWindowFocus: false, // No recargar al cambiar de pestaña
            retry: 1, // Reintentar 1 vez si falla la petición
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}