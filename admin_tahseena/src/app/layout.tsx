import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { RefineContext } from "@/providers/RefineContext";
import { Toaster } from "@/components/ui/sonner";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
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
      <body className={`${plusJakartaSans.variable} font-sans antialiased h-full`}>
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
