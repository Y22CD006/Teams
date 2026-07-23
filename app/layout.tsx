import type { Metadata } from "next";
import "./globals.css";
import ReduxProvider from "@/components/ReduxProvider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ClerkProvider } from '@clerk/nextjs';

export const metadata: Metadata = {
  title: "Teams",
  description: "Teams-like collaboration platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          <ReduxProvider>
            <QueryProvider>
              {children}
            </QueryProvider>
          </ReduxProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
