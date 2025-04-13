"use client"

import * as React from "react"
import {
  ThemeProvider as NextThemesProvider,
} from 'next-themes'

// Define the props type with all needed properties
type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;  // Add this property
  suppressHydrationWarning?: boolean;   // Add this property too
  // Add any other props you need
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
