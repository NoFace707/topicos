import React, { useState } from "react";
import { ArrowLeftRight, ChartPie, ChevronLeft, ChevronRight, LogOut, Menu, PiggyBank, WalletCards, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { navigate } from "../lib/router";

const items = [
  { path: "/dashboard", label: "Resumen", icon: ChartPie },
  { path: "/accounts", label: "Cuentas", icon: WalletCards },
  { path: "/budget", label: "Presupuesto", icon: PiggyBank },
  { path: "/transactions", label: "Movimientos", icon: ArrowLeftRight },
];

export default function AppShell({ currentPath, children }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const go = (path) => { navigate(path); setOpen(false); };

  const sidebar = (
    <div className="h-full flex flex-col bg-slate-950 border-r border-slate-800">
      <div className="h-20 flex items-center gap-3 px-5 border-b border-slate-800">
        <div className="h-10 w-10 shrink-0 rounded-2xl bg-emerald-400 text-slate-950 grid place-items-center shadow-lg shadow-emerald-500/20"><PiggyBank className="w-6 h-6" /></div>
        {!collapsed && <div><p className="font-extrabold tracking-tight text-white">Mi Presupuesto</p><p className="text-xs text-slate-500">Dale un trabajo a tu dinero</p></div>}
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map(({ path, label, icon: Icon }) => (
          <button key={path} type="button" onClick={() => go(path)} className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${currentPath === path || (currentPath === "/categories" && path === "/budget") || (currentPath === "/" && path === "/dashboard") ? "bg-emerald-400 text-slate-950" : "text-slate-400 hover:bg-slate-900 hover:text-white"}`}>
            <Icon className="w-5 h-5 shrink-0" />{!collapsed && label}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-800 space-y-2">
        {!collapsed && <div className="px-3 py-2"><p className="text-xs text-slate-500">Sesión activa</p><p className="text-sm font-semibold text-slate-200 truncate">{user.username}</p></div>}
        <button type="button" onClick={logout} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"><LogOut className="w-5 h-5" />{!collapsed && "Cerrar sesión"}</button>
        <button type="button" onClick={() => setCollapsed((value) => !value)} className="hidden lg:flex w-full items-center justify-center rounded-xl py-2 text-slate-600 hover:text-slate-300">{collapsed ? <ChevronRight /> : <ChevronLeft />}</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <aside className={`hidden lg:block fixed inset-y-0 left-0 z-30 transition-all ${collapsed ? "w-20" : "w-64"}`}>{sidebar}</aside>
      {open && <div className="lg:hidden fixed inset-0 z-50 flex"><div className="w-72">{sidebar}</div><button className="flex-1 bg-black/70" onClick={() => setOpen(false)} aria-label="Cerrar menú"><X className="absolute top-5 right-5 text-white" /></button></div>}
      <div className={`transition-all ${collapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        <header className="lg:hidden h-16 border-b border-slate-800 px-4 flex items-center justify-between sticky top-0 bg-slate-950/95 backdrop-blur z-20"><button onClick={() => setOpen(true)} className="p-2 text-slate-300" aria-label="Abrir menú"><Menu /></button><span className="font-bold">Mi Presupuesto</span><div className="w-10" /></header>
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
