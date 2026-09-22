import React, { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Landmark, PiggyBank, WalletCards } from "lucide-react";
import { Card, EmptyState, ErrorBanner, LoadingState, PageHeader } from "../components/ui";
import { currentMonth, formatMoney, monthLabel } from "../lib/finance";
import { navigate } from "../lib/router";
import { getDashboard } from "../services/budget";

export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { setData(await getDashboard(month)); } catch (err) { setError(err.message); } finally { setLoading(false); } }, [month]);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PageHeader eyebrow="Panorama financiero" title="Resumen" description="Una vista clara de lo que tienes y de lo que todavía puedes asignar." action={<input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white" />} />
      <ErrorBanner message={error} />
      {loading ? <LoadingState /> : data && (
        <div className="space-y-6">
          {!data.accounts.length ? <Card><EmptyState title="Crea tu primera cuenta" description="Añade efectivo, una cuenta bancaria o una tarjeta para comenzar a registrar tu dinero." onAction={() => navigate("/accounts")} actionLabel="Añadir cuenta" /></Card> : (
            <>
              <div className="grid md:grid-cols-3 gap-4">
                <SummaryCard icon={WalletCards} label="Saldo neto" value={formatMoney(data.total_balance, data.currency)} />
                <SummaryCard icon={PiggyBank} label="Listo para asignar" value={formatMoney(data.ready_to_assign, data.currency)} danger={Number(data.ready_to_assign) < 0} />
                <SummaryCard icon={Landmark} label="Cuentas activas" value={String(data.accounts.length)} />
              </div>
              {Number(data.ready_to_assign) < 0 && <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200 flex gap-3"><AlertTriangle className="shrink-0" /><div><p className="font-bold">Has asignado más dinero del disponible</p><p className="text-sm text-amber-200/70">Reduce alguna asignación para volver a cero.</p></div></div>}
              <div className="grid xl:grid-cols-[0.8fr_1.2fr] gap-6">
                <Card className="p-5"><div className="flex items-center justify-between mb-4"><h2 className="font-bold">Tus cuentas</h2><button onClick={() => navigate("/accounts")} className="text-sm text-emerald-400 flex items-center gap-1">Administrar <ArrowRight className="w-4 h-4" /></button></div><div className="space-y-2">{data.accounts.map((account) => <div key={account.id} className="flex items-center justify-between rounded-xl bg-slate-950/70 px-4 py-3"><div><p className="font-semibold">{account.name}</p><p className="text-xs text-slate-500">{account.account_type === "credit_card" ? "Tarjeta" : account.account_type === "bank" ? "Banco" : "Efectivo"}</p></div><span className={`font-bold ${Number(account.balance) < 0 ? "text-rose-300" : "text-slate-100"}`}>{formatMoney(account.balance, data.currency)}</span></div>)}</div></Card>
                <Card className="overflow-hidden"><div className="p-5 border-b border-slate-800 flex items-center justify-between"><div><h2 className="font-bold">Presupuesto de {monthLabel(month)}</h2><p className="text-xs text-slate-500 mt-1">Asignado, actividad y disponible</p></div><button onClick={() => navigate("/budget")} className="text-sm text-emerald-400 flex items-center gap-1">Editar <ArrowRight className="w-4 h-4" /></button></div>{!data.groups.length ? <EmptyState title="Organiza tus categorías" description="Crea grupos y categorías antes de repartir tu dinero." onAction={() => navigate("/categories")} actionLabel="Crear categorías" /> : <div>{data.groups.map((group) => <div key={group.id}><div className="grid grid-cols-[1fr_repeat(3,minmax(80px,0.4fr))] gap-3 px-5 py-3 bg-slate-950/60 text-xs font-bold uppercase tracking-wide text-slate-500"><span>{group.name}</span><span className="text-right">Asignado</span><span className="text-right">Actividad</span><span className="text-right">Disponible</span></div>{group.categories.map((category) => <div key={category.id} className="grid grid-cols-[1fr_repeat(3,minmax(80px,0.4fr))] gap-3 px-5 py-3 border-t border-slate-800/60 text-sm"><span className="truncate">{category.name}</span><span className="text-right text-slate-400">{formatMoney(category.assigned, data.currency)}</span><span className="text-right text-slate-400">{formatMoney(category.activity, data.currency)}</span><span className={`text-right font-bold ${Number(category.available) < 0 ? "text-rose-300" : "text-emerald-300"}`}>{formatMoney(category.available, data.currency)}</span></div>)}</div>)}</div>}</Card>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, danger }) {
  return <Card className="p-5"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-400">{label}</span><div className={`h-10 w-10 rounded-xl grid place-items-center ${danger ? "bg-rose-500/10 text-rose-300" : "bg-emerald-400/10 text-emerald-400"}`}><Icon className="w-5 h-5" /></div></div><p className={`text-2xl font-black mt-5 ${danger ? "text-rose-300" : "text-white"}`}>{value}</p></Card>;
}

