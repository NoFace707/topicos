import React from "react";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Server, Database, Layout } from "lucide-react";

export default function StatusCard({ health, loading, onRefresh }) {
  const isBackendOk = health?.ok;
  const isDbOk = health?.data?.database?.connected;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-black/40 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Estado de los Servicios
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Diagnóstico en tiempo real de la conectividad entre Frontend, Backend Django y PostgreSQL.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Comprobando..." : "Probar Conexión"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {/* Frontend Status */}
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <Layout className="w-4 h-4 text-cyan-400" />
              Frontend (React)
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">Online</div>
            <p className="text-xs text-slate-400 mt-1">Vite + React 18 + Tailwind</p>
          </div>
        </div>

        {/* Backend Status */}
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <Server className="w-4 h-4 text-indigo-400" />
              Backend (Django)
            </span>
            {loading ? (
              <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
            ) : isBackendOk ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400" />
            )}
          </div>
          <div>
            <div className={`text-2xl font-bold ${isBackendOk ? "text-emerald-400" : "text-rose-400"}`}>
              {isBackendOk ? "Conectado" : "Desconectado"}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isBackendOk ? `Django ${health?.data?.django_version || "5.1"}` : "Esperando backend en :8000"}
            </p>
          </div>
        </div>

        {/* Database Status */}
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <Database className="w-4 h-4 text-blue-400" />
              PostgreSQL
            </span>
            {loading ? (
              <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
            ) : isDbOk ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div>
            <div className={`text-2xl font-bold ${isDbOk ? "text-emerald-400" : "text-amber-400"}`}>
              {isDbOk ? "Conectada" : "Sin conexión"}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isDbOk ? "PostgreSQL 16 Alpine" : health?.data?.database?.error || "Inicia docker compose"}
            </p>
          </div>
        </div>
      </div>

      {health?.data && (
        <div className="mt-4 p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-mono text-slate-400 overflow-x-auto">
          <span className="text-indigo-400 font-semibold">Respuesta de la API (/api/health/):</span>
          <pre className="mt-1 text-slate-300">{JSON.stringify(health.data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
