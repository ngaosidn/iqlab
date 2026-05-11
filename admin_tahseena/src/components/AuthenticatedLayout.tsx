"use client";

import { Authenticated, useIsAuthenticated } from "@refinedev/core";
import { Sidebar } from "@/components/Sidebar";
import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: authData, isLoading: authLoading } = useIsAuthenticated();
  
  // Kita hapus useEffect yang melakukan router.push karena bisa menyebabkan loop 
  // Jika authLoading atau tidak ter-auth, biarkan komponen Authenticated di bawah yang menangani
  // atau biarkan pengecekan pathname di bawah.

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-pulse text-blue-600 font-medium">Memverifikasi akses...</div>
      </div>
    );
  }

  return (
    <Authenticated 
      key="auth-layout" 
      fallback={null}
      loading={null}
    >
      <div className="flex h-full min-h-screen bg-slate-50/30">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </Authenticated>
  );
};
