import React from "react";
import { AlertCircle, Loader2, Plus } from "lucide-react";

export function PageHeader({ eyebrow, title, description, action }) {
  return <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8"><div>{eyebrow && <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-2">{eyebrow}</p>}<h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">{title}</h1>{description && <p className="mt-2 text-slate-400 max-w-2xl">{description}</p>}</div>{action}</div>;
}

export function Card({ children, className = "" }) { return <section className={`rounded-2xl border border-slate-800 bg-slate-900/70 ${className}`}>{children}</section>; }

export function Button({ children, variant = "primary", className = "", ...props }) {
  const variants = { primary: "bg-emerald-400 text-slate-950 hover:bg-emerald-300", secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700", danger: "bg-rose-500/10 text-rose-300 hover:bg-rose-500/20", ghost: "text-slate-400 hover:text-white hover:bg-slate-800" };
  return <button className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`} {...props}>{children}</button>;
}

export function Field({ label, children, hint }) { return <label className="block space-y-2"><span className="text-sm font-semibold text-slate-300">{label}</span>{children}{hint && <span className="block text-xs text-slate-500">{hint}</span>}</label>; }
export const inputClass = "w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10";
export function ErrorBanner({ message }) { if (!message) return null; return <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 flex gap-2"><AlertCircle className="w-5 h-5 shrink-0" />{message}</div>; }
export function LoadingState() { return <div className="py-20 grid place-items-center text-slate-500"><Loader2 className="w-7 h-7 animate-spin" /></div>; }
export function EmptyState({ title, description, onAction, actionLabel = "Crear ahora" }) { return <div className="py-14 px-6 text-center"><div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-slate-800 grid place-items-center text-emerald-400"><Plus /></div><h3 className="font-bold text-white">{title}</h3><p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{description}</p>{onAction && <Button className="mt-5" onClick={onAction}><Plus className="w-4 h-4" />{actionLabel}</Button>}</div>; }

