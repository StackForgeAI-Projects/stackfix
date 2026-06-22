"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { LanguageHydrator } from "./LanguageHydrator";
import { IdleSessionGuard } from "./IdleSessionGuard";
import { SearchProvider } from "./SearchProvider";
import { Toaster } from "@stackfix/ui";
import "@/lib/i18n";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageHydrator />
        <SearchProvider>
          <IdleSessionGuard />
          {children}
          <Toaster richColors position="top-right" />
        </SearchProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
