// pages/auth.tsx

"use client";

import { useEffect } from "react";

import { useSession } from "next-auth/react";

import { useRouter } from "next/navigation";

import { Stethoscope } from "lucide-react";

import { UserAuthForm } from "@/components/auth/user-auth";

import { AuthFooter } from "@/components/auth/auth-footer";

export default function AuthenticationPage() {

  const { status } = useSession();

  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }

  }, [status, router]);
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        Cargando...
      </div>
    );
  }

  return (
    <div className="h-screen bg-background text-foreground">
      <div className="h-full md:container relative flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative flex-col bg-muted p-8 lg:p-10 text-slate-900 dark:border-r lg:flex h-60 md:h-full overflow-hidden">

          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url(/dental.jpg)",
              opacity: 0.9,
            }}
          />

          <div className="relative z-20 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
            <Stethoscope className="h-7 w-7 text-slate-900" />
            Carmo Dental
          </div>

          <div className="absolute z-20 bottom-0 left-0 right-0 w-full p-6 lg:p-8">
            <div className="bg-white/10 backdrop-blur-md border-t border-white/40 p-5 rounded-xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] w-full max-w-[90%] mx-auto">

              <blockquote className="space-y-1">
                <p className="text-base lg:text-lg font-medium leading-relaxed text-slate-900 text-center">
                  "Transformamos sonrisas con dedicación y tecnología de punta.
                  Tu salud dental es nuestra prioridad."
                </p>

                <footer className="text-xs font-bold text-slate-600 uppercase tracking-widest text-center mt-2">
                  Equipo de especialistas
                </footer>

              </blockquote>
            </div>
          </div>
        </div>

        <div className="lg:p-8 mt-8 md:mt-0 px-4">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Acceso al Sistema
              </h1>
              <p className="text-sm text-muted-foreground">
                Inicia sesión con tu cuenta para acceder a tu historial clínico y citas.
              </p>
            </div>
            <UserAuthForm />
            <AuthFooter />
          </div>
        </div>
      </div>
    </div>
  );
}