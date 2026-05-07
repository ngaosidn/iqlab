import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RefineContext } from "@/providers/RefineContext";
import { Toaster } from "@/components/ui/sonner";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "System Management Tahseena",
  description: "Management system for students, teachers, and content.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}>
        <RefineContext>
          <AuthenticatedLayout>
            {children}
          </AuthenticatedLayout>
          <Toaster />
        </RefineContext>
      </body>
    </html>
  );
}
