"use client";

import { useState } from "react";
import { useCreate, useList, useDelete, useUpdate } from "@refinedev/core";
import { toast } from "sonner";
import { supabaseClient } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Megaphone, Plus, Image as ImageIcon, Smile, CalendarClock, Send, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import RichTextEditor from "@/components/RichTextEditor";

const DEFAULT_SORTERS = [{ field: "created_at", order: "desc" as const }];

export default function PengumumanPage() {
  const [publishMode, setPublishMode] = useState<"sekarang" | "nanti">("sekarang");
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [content, setContent] = useState("");
  
  const { mutateAsync } = useCreate();
  const { mutateAsync: updateMutateAsync } = useUpdate();
  const { mutateAsync: deleteMutateAsync } = useDelete();

  const listResult = useList({
    resource: "announcements",
    sorters: DEFAULT_SORTERS,
  }) as any;
  
  const announcements = listResult?.data?.data || listResult?.query?.data?.data || [];

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditItem(null);
      setPreviewUrl(null);
      setPublishMode("sekarang");
      setContent("");
    }
  };

  const handleEdit = (item: any) => {
    setEditItem(item);
    setPreviewUrl(item.image_url || null);
    setContent(item.content || "");
    setPublishMode(new Date(item.published_at) > new Date() ? "nanti" : "sekarang");
    setIsOpen(true);
  };

  const handleDelete = async (item: any) => {
    if (confirm("Apakah Anda yakin ingin menghapus pengumuman ini?")) {
      try {
        // Hapus gambar dari bucket jika ada
        if (item.image_url) {
          const urlParts = item.image_url.split("/");
          const filename = urlParts[urlParts.length - 1];
          
          if (filename) {
            const { error: storageError } = await supabaseClient.storage
              .from("announcement_images")
              .remove([filename]);
            
            if (storageError) {
              console.error("Storage delete error:", storageError);
              toast.error(`Gagal menghapus gambar di storage: ${storageError.message}`);
              // Kita tetap lanjut hapus data tabel jika diinginkan, atau return jika gagal total
            }
          }
        }

        await deleteMutateAsync({ resource: "announcements", id: item.id });
        toast.success("Pengumuman berhasil dihapus!");
      } catch (error: any) {
        toast.error(`Gagal menghapus record: ${error?.message}`);
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const title = formData.get("judul") as string;
    const summary = formData.get("deskripsi") as string;
    const icon = formData.get("icon") as string;
    const target_audience = formData.get("targetAudience") as string;
    const publishModeVal = formData.get("publishMode") as string;
    const imageFile = formData.get("gambar") as File;
    
    let published_at = new Date().toISOString();
    let image_url = null;
    
    if (publishModeVal === "nanti") {
      const tanggal = formData.get("tanggal") as string;
      const waktu = formData.get("waktu") as string;
      if (tanggal && waktu) {
        published_at = new Date(`${tanggal}T${waktu}:00`).toISOString();
      } else {
        toast.error("Pilih tanggal dan waktu terbit yang valid!");
        return;
      }
    }

    if (!title || !content) {
      toast.error("Judul dan isi pengumuman wajib diisi!");
      return;
    }

    // Upload Image jika ada
    if (imageFile && imageFile.size > 0) {
      setIsUploading(true);
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('announcement_images')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (uploadError) {
        toast.error(`Gagal mengunggah gambar: ${uploadError.message}`);
        setIsUploading(false);
        return;
      }
      
      const { data: { publicUrl } } = supabaseClient.storage
        .from('announcement_images')
        .getPublicUrl(fileName);
        
      image_url = publicUrl;
      setIsUploading(false);
    }

    setIsSaving(true);
    try {
      if (editItem) {
        await updateMutateAsync({
          resource: "announcements",
          id: editItem.id,
          values: {
            title,
            summary,
            content,
            icon,
            target_audience,
            published_at,
            ...(image_url ? { image_url } : {}),
          },
        });
        toast.success("Pengumuman berhasil diperbarui!");
      } else {
        // 1. Simpan pengumuman ke database
        const createResult = await mutateAsync({
          resource: "announcements",
          values: {
            title,
            summary,
            content,
            icon,
            target_audience,
            published_at,
            ...(image_url ? { image_url } : {}),
          },
        });

        // 2. KIRIM PUSH NOTIFICATION via Edge Function
        const createdRecord = (createResult as any)?.data;
        if (createdRecord) {
          console.log("[Admin] Memanggil Edge Function notify-announcement...");
          try {
            const { data: fnData, error: fnError } = await supabaseClient.functions.invoke(
              "notify-announcement",
              {
                body: { record: createdRecord },
              }
            );

            if (fnError) {
              console.error("[Admin] Edge Function error:", fnError);
              toast.warning("Pengumuman tersimpan, tapi notifikasi GAGAL dikirim: " + fnError.message);
            } else {
              console.log("[Admin] Push Notification berhasil dikirim! ✅", fnData);
              toast.success("Pengumuman diterbitkan & notifikasi terkirim! 🚀");
            }
          } catch (fnErr: any) {
            console.error("[Admin] Gagal memanggil Edge Function:", fnErr);
            toast.warning("Pengumuman tersimpan, tapi gagal mengirim notifikasi.");
          }
        } else {
          toast.success("Pengumuman berhasil diterbitkan!");
        }
      }
      handleOpenChange(false);
    } catch (error: any) {
      toast.error(`Gagal memproses pengumuman: ${error?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const defaultTanggal = editItem ? new Date(editItem.published_at).toISOString().split('T')[0] : "";
  const defaultWaktu = editItem ? new Date(editItem.published_at).toTimeString().substring(0, 5) : "";

  return (
    <main className="flex-1 p-6 md:p-8 space-y-8 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pengumuman</h1>
          <p className="text-sm text-slate-500">
            Kelola dan siarkan pengumuman penting untuk seluruh pengguna.
          </p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger render={<Button className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 text-white" />}>
            <Plus className="h-4 w-4 mr-2" />
            Buat Pengumuman
          </DialogTrigger>
          <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto p-0 gap-0 border-slate-200/60 shadow-xl rounded-2xl">
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-5">
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-3 font-bold text-slate-800">
                  <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100/50">
                    <Megaphone className="h-5 w-5 text-indigo-600" />
                  </div>
                  Buat Pengumuman Baru
                </DialogTitle>
                <DialogDescription className="text-slate-500 pt-1">
                  Atur konten, visual, dan jadwal siaran pengumuman kepada seluruh pengguna.
                </DialogDescription>
              </DialogHeader>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-6 space-y-8 bg-slate-50/50">
                {/* Section 1: Informasi Dasar */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600">1</span>
                    Informasi Dasar
                  </h3>
                  
                  <div className="grid gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="judul" className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Judul Pengumuman <span className="text-red-500">*</span></Label>
                      <Input id="judul" name="judul" defaultValue={editItem?.title || ""} placeholder="Contoh: Libur Hari Raya Idul Fitri" className="h-11 bg-white border-slate-200 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 transition-all text-sm shadow-sm rounded-xl" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deskripsi" className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Deskripsi Singkat</Label>
                      <Input id="deskripsi" name="deskripsi" defaultValue={editItem?.summary || ""} placeholder="Tuliskan ringkasan singkat (maks. 100 karakter)" className="h-11 bg-white border-slate-200 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 transition-all text-sm shadow-sm rounded-xl" />
                    </div>
                  </div>
                </div>

              {/* Section 2: Target Penerima */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600">2</span>
                  Target Penerima
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex flex-col gap-2 p-4 border rounded-xl cursor-pointer hover:bg-indigo-50/30 transition-all border-slate-200 has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50/40 has-[:checked]:shadow-sm bg-white text-center items-center justify-center">
                    <input 
                      type="radio" 
                      name="targetAudience" 
                      value="semua"
                      defaultChecked={!editItem || editItem.target_audience === "semua"}
                      className="sr-only"
                    />
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mb-1">
                      <span className="text-lg">🌐</span>
                    </div>
                    <span className="text-[13px] font-bold text-slate-900 leading-tight">Semua Pengguna</span>
                    <span className="text-[10px] text-slate-500">Tahseena & I-QLab</span>
                  </label>

                  <label className="flex flex-col gap-2 p-4 border rounded-xl cursor-pointer hover:bg-emerald-50/30 transition-all border-slate-200 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50/40 has-[:checked]:shadow-sm bg-white text-center items-center justify-center">
                    <input 
                      type="radio" 
                      name="targetAudience" 
                      value="tahseena"
                      defaultChecked={editItem?.target_audience === "tahseena"}
                      className="sr-only"
                    />
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center mb-1">
                      <span className="text-lg">📖</span>
                    </div>
                    <span className="text-[13px] font-bold text-slate-900 leading-tight">Khusus Tahseena</span>
                    <span className="text-[10px] text-slate-500">Program Tahsin</span>
                  </label>

                  <label className="flex flex-col gap-2 p-4 border rounded-xl cursor-pointer hover:bg-amber-50/30 transition-all border-slate-200 has-[:checked]:border-amber-600 has-[:checked]:bg-amber-50/40 has-[:checked]:shadow-sm bg-white text-center items-center justify-center">
                    <input 
                      type="radio" 
                      name="targetAudience" 
                      value="iqlab"
                      defaultChecked={editItem?.target_audience === "iqlab"}
                      className="sr-only"
                    />
                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center mb-1">
                      <span className="text-lg">🧪</span>
                    </div>
                    <span className="text-[13px] font-bold text-slate-900 leading-tight">Khusus I-QLab</span>
                    <span className="text-[10px] text-slate-500">Laboratorium Interaktif</span>
                  </label>
                </div>
              </div>

              {/* Section 3: Konten Detail */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600">3</span>
                  Konten & Visual
                </h3>
                
                <div className="space-y-2">
                  <Label>Isi Pengumuman Lengkap</Label>
                  <RichTextEditor 
                    value={content} 
                    onChange={setContent} 
                    placeholder="Tulis isi lengkap pengumuman di sini..." 
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="gambar" className="text-[11px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1.5">
                      Gambar Banner (Opsional)
                    </Label>
                    <div className="relative group cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-white hover:bg-indigo-50/50 hover:border-indigo-300 transition-all shadow-sm">
                      <input id="gambar" name="gambar" type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className="h-[100px] w-full flex flex-col items-center justify-center gap-1.5 relative">
                        {previewUrl ? (
                          <>
                            <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-xs font-semibold">Ganti Gambar</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="h-6 w-6 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                            <span className="text-[11px] font-semibold text-slate-500 group-hover:text-indigo-600">Unggah Gambar</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="icon" className="text-[11px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1.5">
                      Pilih Ikon Header
                    </Label>
                    <div className="relative">
                      <select 
                        id="icon"
                        name="icon"
                        className="flex h-[100px] w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm appearance-none cursor-pointer"
                        size={4}
                        defaultValue={editItem?.icon || "volume-2"}
                      >
                        <option value="bell" className="p-2 mb-1 rounded-lg hover:bg-slate-50 checked:bg-indigo-50 checked:text-indigo-700 checked:font-medium">🔔 Lonceng (bell)</option>
                        <option value="volume-2" className="p-2 mb-1 rounded-lg hover:bg-slate-50 checked:bg-indigo-50 checked:text-indigo-700 checked:font-medium">📢 Pengumuman (volume-2)</option>
                        <option value="alert-circle" className="p-2 mb-1 rounded-lg hover:bg-slate-50 checked:bg-indigo-50 checked:text-indigo-700 checked:font-medium">⚠️ Penting (alert-circle)</option>
                        <option value="info" className="p-2 mb-1 rounded-lg hover:bg-slate-50 checked:bg-indigo-50 checked:text-indigo-700 checked:font-medium">ℹ️ Informasi (info)</option>
                        <option value="star" className="p-2 mb-1 rounded-lg hover:bg-slate-50 checked:bg-indigo-50 checked:text-indigo-700 checked:font-medium">⭐ Spesial (star)</option>
                        <option value="zap" className="p-2 mb-1 rounded-lg hover:bg-slate-50 checked:bg-indigo-50 checked:text-indigo-700 checked:font-medium">⚡ Kilat/Update (zap)</option>
                        <option value="users" className="p-2 mb-1 rounded-lg hover:bg-slate-50 checked:bg-indigo-50 checked:text-indigo-700 checked:font-medium">👥 Grup/Kajian (users)</option>
                        <option value="book-open" className="p-2 mb-1 rounded-lg hover:bg-slate-50 checked:bg-indigo-50 checked:text-indigo-700 checked:font-medium">📖 Materi/Al-Quran (book-open)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Waktu Siaran */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600">4</span>
                  Waktu Siaran
                </h3>
                
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-4 p-4 border rounded-xl cursor-pointer hover:bg-indigo-50/30 transition-all border-slate-200 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50/40 has-[:checked]:shadow-sm bg-white">
                    <input 
                      type="radio" 
                      name="publishMode" 
                      value="sekarang"
                      checked={publishMode === "sekarang"}
                      onChange={() => setPublishMode("sekarang")}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">Terbit Sekarang</span>
                      <span className="text-xs text-slate-500 mt-0.5">Pengumuman akan langsung masuk ke notifikasi pengguna.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-4 p-4 border rounded-xl cursor-pointer hover:bg-indigo-50/30 transition-all border-slate-200 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50/40 has-[:checked]:shadow-sm bg-white">
                    <input 
                      type="radio" 
                      name="publishMode" 
                      value="nanti"
                      checked={publishMode === "nanti"}
                      onChange={() => setPublishMode("nanti")}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">Jadwalkan Nanti</span>
                      <span className="text-xs text-slate-500 mt-0.5">Atur tanggal dan waktu spesifik untuk sistem merilisnya.</span>
                    </div>
                  </label>
                </div>

                {/* Date & Time Picker (Tampil hanya jika "nanti" dipilih) */}
                {publishMode === "nanti" && (
                  <div className="grid grid-cols-2 gap-5 mt-2 p-5 bg-white rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="space-y-2">
                      <Label htmlFor="tanggal" className="text-[11px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1.5">
                        <CalendarClock className="h-3.5 w-3.5" /> Tanggal Terbit
                      </Label>
                      <Input id="tanggal" name="tanggal" type="date" defaultValue={defaultTanggal} className="h-11 bg-white border-slate-200 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 transition-all shadow-sm rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="waktu" className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Waktu Terbit</Label>
                      <Input id="waktu" name="waktu" type="time" defaultValue={defaultWaktu} className="h-11 bg-white border-slate-200 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 transition-all shadow-sm rounded-xl" />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
              <div className="sticky bottom-0 z-10 bg-white/80 backdrop-blur-md border-t border-slate-100 p-5 rounded-b-2xl">
                <DialogFooter className="gap-3 w-full flex-row justify-end items-center">
                  <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="h-11 px-6 rounded-xl font-semibold border-slate-200 text-slate-600 hover:bg-slate-50 mr-2" disabled={isSaving || isUploading}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={isSaving || isUploading} className="h-11 px-6 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200">
                    {isSaving || isUploading ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        {isUploading ? "Mengunggah..." : "Menyimpan..."}
                      </>
                    ) : publishMode === "sekarang" ? (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Terbitkan Sekarang
                      </>
                    ) : (
                      <>
                        <CalendarClock className="h-4 w-4 mr-2" />
                        Jadwalkan Terbit
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

        {announcements.length === 0 ? (
          <Card className="border-slate-200/60 shadow-sm mt-8">
            <CardContent className="p-12 flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Megaphone className="h-8 w-8 text-slate-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Belum Ada Pengumuman</h2>
              <p className="text-slate-500 max-w-sm mb-4">
                Saat ini tidak ada pengumuman yang aktif. Klik tombol "Buat Pengumuman" untuk membuat siaran baru.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-slate-200/60 shadow-sm mt-8 overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-600 h-12">Pengumuman</TableHead>
                    <TableHead className="font-semibold text-slate-600">Target</TableHead>
                    <TableHead className="font-semibold text-slate-600">Jadwal Rilis</TableHead>
                    <TableHead className="font-semibold text-slate-600">Status</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements.map((item: any) => {
                    const isPublished = new Date(item.published_at) <= new Date();
                    return (
                      <TableRow key={item.id} className="hover:bg-slate-50/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {item.image_url ? (
                              <img src={item.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                                <Megaphone className="h-5 w-5 text-indigo-500" />
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 line-clamp-1">{item.title}</span>
                              <span className="text-xs text-slate-500 line-clamp-1">{item.summary || "Tidak ada deskripsi"}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.target_audience === "semua" && <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">Semua</Badge>}
                          {item.target_audience === "tahseena" && <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">Tahseena</Badge>}
                          {item.target_audience === "iqlab" && <Badge variant="secondary" className="bg-amber-50 text-amber-700">I-QLab</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span className="text-slate-900 font-medium">
                              {new Date(item.published_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-slate-500 text-xs">
                              {new Date(item.published_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} WIB
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isPublished ? (
                            <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50/50">Aktif</Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50/50 flex gap-1 w-fit">
                              <CalendarClock className="h-3 w-3" /> Dijadwalkan
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="flex h-8 w-8 p-0 items-center justify-center rounded-md hover:bg-slate-100 transition-colors">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4 text-slate-500" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px] rounded-xl">
                              <DropdownMenuItem className="cursor-pointer" onClick={() => handleEdit(item)}>
                                <Edit className="h-4 w-4 mr-2 text-slate-500" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => handleDelete(item)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                <span>Hapus</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
    </main>
  );
}
