"use client";

import { Globe, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPageManager() {
  return (
    <main className="flex-1 p-6 md:p-8 space-y-8 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Landing Page</h1>
          <p className="text-sm text-slate-500">
            Kelola halaman landing page untuk publikasi dan promosi.
          </p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Buat Landing Page
        </Button>
      </div>

      {/* Empty State */}
      <Card className="border-slate-200/60 shadow-sm mt-8">
        <CardContent className="p-12 flex flex-col items-center justify-center text-center">
          <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Globe className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Belum Ada Landing Page</h2>
          <p className="text-slate-500 max-w-sm mb-4">
            Saat ini tidak ada landing page yang aktif. Klik tombol "Buat Landing Page" untuk membuat halaman baru.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
