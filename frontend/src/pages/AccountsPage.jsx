import React, { useCallback, useEffect, useState } from "react";
import { Archive, Banknote, CreditCard, Landmark, Pencil, Plus, RotateCcw, X } from "lucide-react";
import { Button, Card, EmptyState, ErrorBanner, Field, inputClass, LoadingState, PageHeader } from "../components/ui";
import { formatMoney } from "../lib/finance";
import { asList, getAccounts, saveAccount, setAccountArchived } from "../services/budget";

const blank = { name: "", account_type: "bank", opening_balance: "0.00" };
const labels = { cash: "Efectivo", bank: "Banco", credit_card: "Tarjeta" };
const icons = { cash: Banknote, bank: Landmark, credit_card: CreditCard };

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); try { setAccounts(asList(await getAccounts())); setError(""); } catch (err) { setError(err.message); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const openCreate = () => { setEditing(null); setForm(blank); setShowForm(true); };
  const openEdit = (account) => { setEditing(account.id); setForm({ name: account.name, account_type: account.account_type, opening_balance: account.opening_balance }); setShowForm(true); };
  const submit = async (event) => { event.preventDefault(); try { await saveAccount(form, editing); setShowForm(false); await load(); } catch (err) { setError(err.message); } };
  const toggleArchive = async (account) => { try { await setAccountArchived(account.id, !account.is_archived); await load(); } catch (err) { setError(err.message); } };

  return <div><PageHeader eyebrow="Tu dinero" title="Cuentas" description="Registra manualmente efectivo, bancos y tarjetas. Los saldos se calculan desde tus movimientos." action={<Button onClick={openCreate}><Plus className="w-4 h-4" />Nueva cuenta</Button>} /><ErrorBanner message={error} />
    {showForm && <Card className="p-5 mb-6"><div className="flex items-center justify-between mb-5"><h2 className="font-bold">{editing ? "Editar cuenta" : "Nueva cuenta"}</h2><button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white"><X /></button></div><form onSubmit={submit} className="grid md:grid-cols-4 gap-4 items-end"><Field label="Nombre"><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field><Field label="Tipo"><select className={inputClass} value={form.account_type} onChange={(e) => setForm({ ...form, account_type: e.target.value })}><option value="cash">Efectivo</option><option value="bank">Banco</option><option value="credit_card">Tarjeta</option></select></Field><Field label="Saldo inicial" hint="Usa un valor negativo para deuda de tarjeta."><input className={inputClass} type="number" step="0.01" value={form.opening_balance} onChange={(e) => setForm({ ...form, opening_balance: e.target.value })} required /></Field><Button type="submit">Guardar cuenta</Button></form></Card>}
    <Card>{loading ? <LoadingState /> : !accounts.length ? <EmptyState title="Todavía no tienes cuentas" description="Comienza con la cuenta donde hoy guardas tu dinero." onAction={openCreate} actionLabel="Crear primera cuenta" /> : <div className="divide-y divide-slate-800">{accounts.map((account) => { const Icon = icons[account.account_type]; return <div key={account.id} className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${account.is_archived ? "opacity-55" : ""}`}><div className="flex items-center gap-4"><div className="h-11 w-11 rounded-xl bg-slate-800 grid place-items-center text-emerald-400"><Icon className="w-5 h-5" /></div><div><p className="font-bold text-white">{account.name}</p><p className="text-xs text-slate-500">{labels[account.account_type]}{account.is_archived ? " · Archivada" : ""}</p></div></div><div className="flex items-center gap-3 sm:gap-6"><p className={`text-lg font-black ${Number(account.balance) < 0 ? "text-rose-300" : "text-white"}`}>{formatMoney(account.balance)}</p><Button variant="ghost" className="px-3" onClick={() => openEdit(account)}><Pencil className="w-4 h-4" /></Button><Button variant={account.is_archived ? "secondary" : "danger"} className="px-3" onClick={() => toggleArchive(account)}>{account.is_archived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}</Button></div></div>; })}</div>}</Card>
  </div>;
}

