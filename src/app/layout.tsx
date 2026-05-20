import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ptBR } from "@clerk/localizations";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { QueryClientProvider } from "@/providers/query-client-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RCECAD",
  description: "Engenharia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistMono.variable,
        geistSans.variable,
      )}
    >
      <body className={cn("min-h-full flex flex-col", geistSans.className)}>
        <ClerkProvider localization={ptBR} appearance={{ theme: shadcn }}>
          <TooltipProvider delayDuration={0}>
            <QueryClientProvider>{children}</QueryClientProvider>
          </TooltipProvider>
        </ClerkProvider>
        <Toaster />
      </body>
    </html>
  );
}
