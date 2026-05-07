"use client";

import { useLogin } from "@refinedev/core";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const { mutate: login, isPending } = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4 font-sans selection:bg-slate-900 selection:text-white">
      <div className="w-full max-w-[400px] space-y-8 rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 sm:p-10">
        
        {/* Header Formulir */}
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white text-xl font-bold shadow-md shadow-slate-900/20">
            T
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">System Management Tahseena</h1>
            <p className="text-sm text-slate-500">
              Masuk ke akun Anda untuk melanjutkan
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            <div className="space-y-2.5 text-left">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@iqlab.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-white border-slate-200 focus-visible:ring-slate-900 transition-all text-base shadow-sm"
              />
            </div>
            <div className="space-y-2.5 text-left">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">Kata Sandi</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 bg-white border-slate-200 focus-visible:ring-slate-900 transition-all text-base shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox id="remember" className="border-slate-300 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900 rounded-[4px]" />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none text-slate-600 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Ingat saya
              </label>
            </div>
            <button type="button" className="text-sm font-medium text-slate-900 hover:text-slate-700 transition-colors">
              Lupa sandi?
            </button>
          </div>

          <Button 
            type="submit" 
            className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm shadow-slate-900/10 group font-medium text-sm rounded-lg" 
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memverifikasi...
              </>
            ) : (
              <>
                Masuk
                <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:translate-x-1 group-hover:opacity-100 transition-transform" />
              </>
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-center gap-1.5 pt-4 text-slate-400">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-xs font-medium">Akses dilindungi enkripsi aman</span>
        </div>

      </div>
    </div>
  );
}

