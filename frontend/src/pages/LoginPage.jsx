import React, { useState } from "react";
import { ArrowRight, Check, PiggyBank } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button, ErrorBanner, Field, inputClass } from "../components/ui";

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event) => { event.preventDefault(); setError(""); setSaving(true); try { await (mode === "login" ? login(form) : register(form)); } catch (err) { setError(err.message); } finally { setSaving(false); } };

  return (
    <main className="min-h-screen bg-slate-950 text-white grid lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden lg:flex p-14 xl:p-20 flex-col justify-between border-r border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.16),_transparent_45%)]">
        <div className="flex items-center gap-3"><div className="h-11 w-11 rounded-2xl bg-emerald-400 text-slate-950 grid place-items-center"><PiggyBank /></div><span className="text-xl font-black">Mi Presupuesto</span></div>
        <div className="max-w-xl"><p className="text-emerald-400 font-bold uppercase tracking-[0.2em] text-xs mb-5">Presupuesto consciente</p><h1 className="text-5xl xl:text-6xl font-black tracking-tight leading-[1.05]">Tu dinero, con un trabajo claro.</h1><p className="text-lg text-slate-400 mt-6">Organiza cuentas, asigna cada peso a una categoría y mira con tranquilidad lo que realmente tienes disponible.</p><div className="grid gap-3 mt-8 text-sm text-slate-300">{["Presupuesto mensual por categorías", "Ingresos, gastos y transferencias", "Sin conexión automática con tu banco"].map((item) => <div key={item} className="flex items-center gap-3"><Check className="w-5 h-5 text-emerald-400" />{item}</div>)}</div></div>
        <p className="text-xs text-slate-600">Tus movimientos se registran manualmente y permanecen bajo tu control.</p>
      </section>
      <section className="grid place-items-center p-6 sm:p-10"><div className="w-full max-w-md"><div className="lg:hidden flex items-center gap-3 mb-10"><PiggyBank className="text-emerald-400" /><span className="font-black">Mi Presupuesto</span></div><p className="text-sm font-bold text-emerald-400">{mode === "login" ? "Bienvenido de nuevo" : "Crea tu espacio"}</p><h2 className="text-3xl font-black mt-2">{mode === "login" ? "Inicia sesión" : "Empieza tu presupuesto"}</h2><p className="text-slate-500 mt-2 mb-8">{mode === "login" ? "Continúa donde lo dejaste." : "Solo necesitas un usuario y una contraseña."}</p>
        <form onSubmit={submit} className="space-y-5"><ErrorBanner message={error} /><Field label="Usuario"><input className={inputClass} autoComplete="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></Field><Field label="Contraseña" hint={mode === "register" ? "Mínimo 6 caracteres; no exigimos reglas adicionales." : undefined}><input className={inputClass} type="password" minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></Field><Button type="submit" disabled={saving} className="w-full py-3">{saving ? "Procesando..." : mode === "login" ? "Entrar" : "Crear cuenta"}<ArrowRight className="w-4 h-4" /></Button></form>
        <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="mt-6 text-sm text-slate-400 hover:text-white">{mode === "login" ? "¿Primera vez? Crear una cuenta" : "¿Ya tienes cuenta? Iniciar sesión"}</button></div></section>
    </main>
  );
}

