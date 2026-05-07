"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLogout } from "@refinedev/core";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Settings,
  LogOut,
  ChevronRight
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Daftar Murid",
    href: "/students",
    icon: GraduationCap,
  },
  {
    title: "Daftar Pengajar",
    href: "/teachers",
    icon: Users,
  },
  {
    title: "Konten Belajar",
    href: "/content",
    icon: BookOpen,
  },
  {
    title: "Pengaturan",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { mutate: logout } = useLogout();

  return (
    <div className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col h-screen sticky top-0 text-slate-300 shadow-2xl">
      {/* Branding */}
      <div className="p-6">
        <div className="flex items-center gap-3 font-semibold text-lg text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
            T
          </div>
          <div className="flex flex-col">
            <span className="leading-tight tracking-tight">SM Tahseena</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Administrator</span>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        <div className="mb-4 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Menu Utama
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-indigo-500/10 text-indigo-400" 
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn(
                    "h-4 w-4 transition-colors", 
                    isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                  )} />
                  {item.title}
                </div>
                {isActive && (
                  <ChevronRight className="h-4 w-4 opacity-50" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-800/50 mt-auto bg-slate-950/50">
        <button 
          onClick={() => logout()}
          className="group flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Keluar Sistem
        </button>
      </div>
    </div>
  );
}
