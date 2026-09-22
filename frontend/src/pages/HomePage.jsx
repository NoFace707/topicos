import React, { useState, useEffect } from "react";
import { checkHealth } from "../services/api";
import StatusCard from "../components/StatusCard";
import { Code, Terminal, Database, Sparkles, FolderTree, ArrowRight, Check } from "lucide-react";

export default function HomePage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await checkHealth();
      setHealth(data);
    } catch (err) {
      setHealth({ ok: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Hero Section */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          Estructura Base Lista para Desarrollar
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
          Plantilla Fullstack <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">React + Django</span>
        </h1>
        <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
          Proyecto inicializado con React 18 (Vite), Django REST Framework 5.1, base de datos PostgreSQL 16 y orquestación con Docker Compose.
        </p>
      </section>

      {/* Service Health Card */}
      <section>
        <StatusCard health={health} loading={loading} onRefresh={fetchHealth} />
      </section>

      {/* Architecture & Quick Commands Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Commands Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-indigo-400">
            <Terminal className="w-5 h-5" />
            <h3 className="text-lg font-bold text-white">Comandos Rápidos</h3>
          </div>
          <p className="text-sm text-slate-400">
            Puedes levantar todo el entorno con Docker o ejecutar los servicios de forma local:
          </p>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 block mb-1"># Iniciar todos los contenedores:</span>
              <span className="text-emerald-400">docker compose up --build</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 block mb-1"># Crear migraciones o superusuario en backend:</span>
              <span className="text-cyan-400">docker compose exec backend python manage.py createsuperuser</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 block mb-1"># Detener los contenedores:</span>
              <span className="text-amber-400">docker compose down</span>
            </div>
          </div>
        </div>

        {/* Directory Structure Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-cyan-400">
            <FolderTree className="w-5 h-5" />
            <h3 className="text-lg font-bold text-white">Estructura del Proyecto</h3>
          </div>
          <p className="text-sm text-slate-400">
            Organización modular y limpia pensada para escalar:
          </p>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/40">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">backend/src/config/</span>
                <p className="text-slate-400">Configuración global de Django, CORS, base de datos y URLs.</p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/40">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">backend/src/core/</span>
                <p className="text-slate-400">App base con modelos, vistas REST, endpoints y comando wait_for_db.</p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/40">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">frontend/src/services/</span>
                <p className="text-slate-400">Cliente de conexión a la API REST de Django.</p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/40">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">frontend/src/components/</span>
                <p className="text-slate-400">Componentes modulares de React con Tailwind CSS.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
