"use client";

import { Provider } from "react-redux";
import { store } from "@/store/store";
import { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { FontScaleProvider } from "@/components/font-scale-provider";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <FontScaleProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" richColors closeButton duration={3000} />
        </ThemeProvider>
      </FontScaleProvider>
    </Provider>
  );
}
