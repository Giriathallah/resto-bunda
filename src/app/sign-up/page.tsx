"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, User, Github } from "lucide-react";
import { signUp, oAuthSignIn } from "@/actions/auth";
import type { OAuthProvider } from "@/generated/prisma";

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await signUp(form);
      // signUp dapat mengembalikan string (error) atau { message }
      if (typeof res === "string") {
        setErrorMsg(res);
        return;
      }
      if (res?.message) {
        setSuccessMsg(res.message); // “Akun Anda berhasil dibuat! Silakan periksa email…”
      } else {
        setErrorMsg("Terjadi kesalahan. Silakan coba lagi.");
      }
    });
  };

  const oauthButton = (
    provider: OAuthProvider,
    label: string,
    icon: React.ReactNode
  ) => (
    <form action={async () => oAuthSignIn(provider)} className="w-full">
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-card border border-border rounded-xl hover:bg-muted transition-all duration-200"
      >
        {icon}
        <span className="text-sm font-medium text-foreground">{label}</span>
      </button>
    </form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-secondary/20 flex items-center justify-center p-4">
      {/* Dekorasi Background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_theme(colors.primary)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_theme(colors.accent)_0%,_transparent_50%)]" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl shadow-2xl p-8 relative overflow-hidden">
          {/* Decorative */}
          <div className="absolute -top-2 -right-2 w-20 h-20 bg-primary/10 rounded-full blur-xl" />
          <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-accent/10 rounded-full blur-lg" />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  R
                </span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Bergabung Sekarang
            </h1>
            <p className="text-muted-foreground text-sm">
              Buat akun untuk mulai berpetualang kuliner
            </p>
          </div>

          {/* OAuth */}
          <div className="space-y-3 mb-6">
            {oauthButton("GOOGLE", "Daftar dengan Google", <GoogleIcon />)}
            {oauthButton(
              "GITHUB",
              "Daftar dengan GitHub",
              <Github className="w-5 h-5 text-foreground" />
            )}
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground font-medium">
                atau gunakan email
              </span>
            </div>
          </div>

          {/* Alert Sukses */}
          {successMsg && (
            <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 px-3 py-2 text-sm">
              <p className="font-medium">{successMsg}</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  Periksa kotak masuk atau folder spam untuk email verifikasi.
                </li>
                <li>Klik tautan verifikasi untuk mengaktifkan akun Anda.</li>
              </ul>
            </div>
          )}

          {/* Alert Error */}
          {errorMsg && !successMsg && (
            <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive px-3 py-2 text-sm">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-medium text-foreground"
              >
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={onChange}
                  className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  placeholder="Masukkan nama lengkap"
                  required
                  disabled={!!successMsg || pending}
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  placeholder="nama@contoh.com"
                  required
                  disabled={!!successMsg || pending}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={onChange}
                  className="w-full pl-10 pr-12 py-3 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  placeholder="Buat kata sandi"
                  required
                  disabled={!!successMsg || pending}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={
                    showPassword
                      ? "Sembunyikan kata sandi"
                      : "Tampilkan kata sandi"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!!successMsg || pending}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              {pending ? "Memproses..." : "Daftar"}
            </button>
          </form>

          {/* Switch */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <Link
                href="/sign-in"
                className="text-primary hover:text-primary/80 font-semibold"
              >
                Masuk
              </Link>
            </p>
            {successMsg && (
              <p className="text-xs text-muted-foreground mt-2">
                Setelah verifikasi email, silakan kembali ke halaman{" "}
                <Link
                  href="/sign-in"
                  className="text-primary hover:text-primary/80 underline"
                >
                  Masuk
                </Link>
                .
              </p>
            )}
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            Dengan mendaftar, Anda menyetujui{" "}
            <a href="#" className="text-primary hover:text-primary/80">
              Ketentuan Layanan
            </a>{" "}
            dan{" "}
            <a href="#" className="text-primary hover:text-primary/80">
              Kebijakan Privasi
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
