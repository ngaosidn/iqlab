import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Beaker, BarChart3, Puzzle } from "lucide-react";

export default function IQLabPage() {
  return (
    <main className="flex-1 p-6 md:p-8 space-y-8 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">I-QLab</h1>
        <p className="text-sm text-slate-500">
          Laboratorium interaktif untuk mengelola eksperimen dan data pembelajaran.
        </p>
      </div>

      <Tabs defaultValue="eksperimen" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 max-w-[600px] bg-slate-200/50 p-1">
          <TabsTrigger value="eksperimen" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
            <Beaker className="w-4 h-4" />
            Eksperimen
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="modul" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">
            <Puzzle className="w-4 h-4" />
            Modul Interaktif
          </TabsTrigger>
        </TabsList>

        <TabsContent value="eksperimen" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
          <Card className="border-slate-200/60 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <Beaker className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Ruang Eksperimen</CardTitle>
                <CardDescription>
                  Kelola simulasi dan tugas interaktif untuk murid.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-slate-50/50 mt-4 text-center p-6">
                <Beaker className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">Area Eksperimen Belum Tersedia</p>
                <p className="text-sm text-slate-400 mt-1">Tambahkan komponen simulasi interaktif di sini nantinya.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
          <Card className="border-slate-200/60 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="p-3 bg-emerald-50 rounded-xl">
                <BarChart3 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Data Analytics</CardTitle>
                <CardDescription>
                  Pantau perkembangan hasil belajar dan skor simulasi murid.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-slate-50/50 mt-4 text-center p-6">
                <BarChart3 className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">Grafik Data Sedang Disiapkan</p>
                <p className="text-sm text-slate-400 mt-1">Integrasikan dengan chart library (misal: Recharts) untuk menampilkan statistik.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modul" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
          <Card className="border-slate-200/60 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="p-3 bg-amber-50 rounded-xl">
                <Puzzle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Manajemen Modul</CardTitle>
                <CardDescription>
                  Buat dan atur modul interaktif pembelajaran Quran.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-slate-50/50 mt-4 text-center p-6">
                <Puzzle className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">Daftar Modul Kosong</p>
                <p className="text-sm text-slate-400 mt-1">Form pembuatan modul interaktif akan ditampilkan di sini.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </main>
  );
}
