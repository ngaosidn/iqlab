"use client";

import { useTable } from "@refinedev/core";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter, MoreHorizontal } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function StudentsList() {
  const { tableQuery } = useTable({
    resource: "profiles",
    filters: {
      initial: [
        {
          field: "role",
          operator: "eq",
          value: "user_iqlab",
        },
      ],
    },
  });

  const students = tableQuery?.data?.data || [];
  const isLoading = tableQuery?.isLoading || false;

  return (
    <div className="p-6 md:p-8 space-y-6 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Daftar Murid</h1>
          <p className="text-sm text-slate-500">Kelola data murid SM Tahseena di sini.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Murid
        </Button>
      </div>

      <Card className="border-slate-200/60 shadow-sm">
        <CardHeader className="pb-3 pt-5">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                placeholder="Cari nama atau WhatsApp..." 
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
            <Button variant="outline" size="sm" className="h-9 border-slate-200 text-slate-600 rounded-lg shadow-sm">
              <Filter className="h-4 w-4 mr-2 text-slate-500" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-slate-200/60 overflow-hidden bg-white shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50/80 border-b border-slate-200/60">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-600 h-11">Nama Lengkap</TableHead>
                  <TableHead className="font-semibold text-slate-600 h-11">WhatsApp</TableHead>
                  <TableHead className="font-semibold text-slate-600 h-11">Gender</TableHead>
                  <TableHead className="font-semibold text-slate-600 h-11 text-center">Usia</TableHead>
                  <TableHead className="font-semibold text-slate-600 h-11">Alamat</TableHead>
                  <TableHead className="w-[80px] h-11"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500 text-sm">
                      <div className="flex justify-center items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Memuat data murid...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500 text-sm">
                      Tidak ada data murid ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student: any) => (
                    <TableRow key={student.id} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                      <TableCell className="font-medium text-slate-900">{student.full_name}</TableCell>
                      <TableCell className="text-slate-600 text-sm">{student.whatsapp_number}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={student.gender === 'Ikhwan' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/50' : 'bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200/50'}>
                          {student.gender}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-slate-600 text-sm">{student.age || '-'}</TableCell>
                      <TableCell className="text-slate-500 text-sm truncate max-w-[200px]">{student.address || '-'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center p-0 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-md outline-none transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl shadow-lg border-slate-200/60 min-w-[160px]">
                            <DropdownMenuItem className="cursor-pointer text-sm font-medium">Detail Profil</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-sm font-medium">Edit Data</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-sm font-medium text-red-600 focus:text-red-700 focus:bg-red-50">Hapus</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
