import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = {
  title: "Ops Login",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-6 py-16 text-acid">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-acid) 1px, transparent 1px), linear-gradient(90deg, var(--color-acid) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative w-full max-w-md border-2 border-acid bg-ink/95 p-8 shadow-[10px_10px_0_0_#dbff3e]">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-acid/55">
          SYS.ADMIN — PERSONAL NODE
        </p>
        <h1 className="mt-4 font-display text-5xl leading-none tracking-tight text-acid">
          OPERATOR
          <br />
          LOGIN
        </h1>
        <p className="mt-4 font-mono text-xs uppercase leading-relaxed tracking-widest text-acid/60">
          Sole admin access. Update projects, copy, and studio details.
        </p>

        <div className="mt-8">
          <AdminLoginForm />
        </div>
      </div>
    </main>
  );
}
