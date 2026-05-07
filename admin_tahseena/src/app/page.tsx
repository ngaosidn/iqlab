import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, BookOpen, Settings, TrendingUp, Activity, ArrowUpRight } from "lucide-react";

export default function Home() {
  const stats = [
    {
      title: "Total Murid",
      value: "128",
      icon: GraduationCap,
      description: "+12% dari bulan lalu",
      color: "text-indigo-600",
      bg: "bg-indigo-100",
    },
    {
      title: "Total Pengajar",
      value: "14",
      icon: Users,
      description: "2 pengajar baru",
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      title: "Materi Aktif",
      value: "45",
      icon: BookOpen,
      description: "Quran & Hadist",
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      title: "Status Sistem",
      value: "Optimal",
      icon: Activity,
      description: "Semua layanan berjalan",
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
  ];

  return (
    <main className="flex-1 p-6 md:p-8 space-y-8 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ringkasan Sistem</h1>
        <p className="text-sm text-slate-500">
          Selamat datang kembali di <span className="font-medium text-slate-700">SM Tahseena</span>. Berikut adalah performa data Anda hari ini.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="overflow-hidden border-slate-200/60 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <p className="text-xs font-medium text-slate-500">
                  {stat.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-slate-200/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Aktivitas Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="mt-0.5 h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/50">
                    <Users className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <p className="text-sm font-medium leading-none text-slate-900">
                      Pendaftaran Murid Baru
                    </p>
                    <p className="text-sm text-slate-500">
                      Ahmad Fulan telah bergabung ke kelas Tahsin Dewasa.
                    </p>
                  </div>
                  <div className="font-medium text-[11px] text-slate-400">
                    2 jam lalu
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 border-slate-200/60 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Menu Cepat</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 flex-1">
            <button className="group flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 border border-slate-200/50 hover:border-indigo-200 transition-all text-left bg-white shadow-sm hover:shadow">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                  <GraduationCap className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Kelola Murid</div>
                  <div className="text-xs text-slate-500 mt-0.5">Tambah & verifikasi data murid</div>
                </div>
              </div>
              <ArrowUpRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </button>

            <button className="group flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 border border-slate-200/50 hover:border-emerald-200 transition-all text-left bg-white shadow-sm hover:shadow">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Kelola Pengajar</div>
                  <div className="text-xs text-slate-500 mt-0.5">Atur jadwal & materi asatidz</div>
                </div>
              </div>
              <ArrowUpRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
            </button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
