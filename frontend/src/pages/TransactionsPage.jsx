import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Pencil, Plus, Trash2, X } from "lucide-react";
import { asList, deleteTransaction, getAccounts, getCategories, getDashboard, getTransactions, saveTransaction } from "../services/budget";
import { Button, Card, EmptyState, ErrorBanner, Field, inputClass, LoadingState, PageHeader } from "../components/ui";
import { expenseAmountSuggestion, formatMoney } from "../lib/finance";
import { navigate } from "../lib/router";

const today = () => new Date().toISOString().slice(0, 10);
const blank = { transaction_type: "expense", date: today(), amount: "", memo: "", account: "", category: "", destination_account: "" };

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ type: "", account: "", date_from: "", date_to: "" });
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [suggestingAmount, setSuggestingAmount] = useState(false);
  const [error, setError] = useState("");
  const suggestionRequest = useRef(0);

  const activeAccounts = useMemo(() => accounts.filter((account) => !account.is_archived), [accounts]);
  const activeCategories = useMemo(() => categories.filter((category) => !category.is_archived), [categories]);
  const load = useCallback(async () => { setLoading(true); try { const [movementData, accountData, categoryData] = await Promise.all([getTransactions(filters), getAccounts(), getCategories()]); setTransactions(asList(movementData)); setAccounts(asList(accountData)); setCategories(asList(categoryData)); setError(""); } catch (err) { setError(err.message); } finally { setLoading(false); } }, [filters]);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm({ ...blank, date: today(), account: activeAccounts[0]?.id || "", category: "" }); setShowForm(true); };
  const openEdit = (item) => { setEditing(item.id); setForm({ transaction_type: item.transaction_type, date: item.date, amount: item.amount, memo: item.memo || "", account: item.account, category: item.category || "", destination_account: item.destination_account || "" }); setShowForm(true); };
  const selectExpenseCategory = async (categoryId) => {
    setForm((current) => ({ ...current, category: categoryId, amount: "" }));
    const requestId = suggestionRequest.current + 1;
    suggestionRequest.current = requestId;
    if (!categoryId || editing) return;
    setSuggestingAmount(true);
    try {
      const dashboard = await getDashboard(form.date.slice(0, 7));
      if (suggestionRequest.current !== requestId) return;
      setForm((current) => ({ ...current, amount: expenseAmountSuggestion(dashboard.groups, categoryId) }));
      setError("");
    } catch (err) {
      if (suggestionRequest.current === requestId) setError(err.message);
    } finally {
      if (suggestionRequest.current === requestId) setSuggestingAmount(false);
    }
  };
  const submit = async (event) => { event.preventDefault(); const payload = { ...form, account: Number(form.account), amount: form.amount, category: form.transaction_type === "expense" ? Number(form.category) : null, destination_account: form.transaction_type === "transfer" ? Number(form.destination_account) : null }; try { await saveTransaction(payload, editing); setShowForm(false); await load(); } catch (err) { setError(err.message); } };
  const remove = async (id) => { if (!window.confirm("¿Eliminar este movimiento? Los saldos se recalcularán.")) return; try { await deleteTransaction(id); await load(); } catch (err) { setError(err.message); } };

  return <div><PageHeader eyebrow="Registro manual" title="Movimientos" description="Anota ingresos, gastos y transferencias. No se conecta automáticamente con ninguna entidad bancaria." action={<Button disabled={!activeAccounts.length} onClick={openCreate}><Plus className="w-4 h-4" />Nuevo movimiento</Button>} /><ErrorBanner message={error} />
    <Card className="p-4 mb-5"><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3"><select className={inputClass} value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}><option value="">Todos los tipos</option><option value="income">Ingresos</option><option value="expense">Gastos</option><option value="transfer">Transferencias</option></select><select className={inputClass} value={filters.account} onChange={(e) => setFilters({ ...filters, account: e.target.value })}><option value="">Todas las cuentas</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select><input className={inputClass} type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} aria-label="Fecha inicial" /><input className={inputClass} type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} aria-label="Fecha final" /></div></Card>
    {showForm && <Card className="p-5 mb-5"><div className="flex items-center justify-between mb-5"><h2 className="font-bold">{editing ? "Editar movimiento" : "Nuevo movimiento"}</h2><button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white"><X /></button></div><form onSubmit={submit} className="grid md:grid-cols-2 xl:grid-cols-4 gap-4"><Field label="Tipo"><select className={inputClass} value={form.transaction_type} onChange={(e) => setForm({ ...form, transaction_type: e.target.value })}><option value="expense">Gasto</option><option value="income">Ingreso</option><option value="transfer">Transferencia</option></select></Field><Field label={form.transaction_type === "transfer" ? "Cuenta origen" : "Cuenta"}><select required className={inputClass} value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })}>{activeAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></Field>{form.transaction_type === "expense" && <Field label="Categoría" hint={!editing ? "Al elegirla, se sugerirá su disponible del mes." : undefined}><select required className={inputClass} value={form.category} onChange={(e) => selectExpenseCategory(e.target.value)}><option value="">Selecciona una categoría</option>{activeCategories.map((category) => <option key={category.id} value={category.id}>{category.group_name} · {category.name}</option>)}</select></Field>}{form.transaction_type === "transfer" && <Field label="Cuenta destino"><select required className={inputClass} value={form.destination_account} onChange={(e) => setForm({ ...form, destination_account: e.target.value })}><option value="">Selecciona una cuenta</option>{activeAccounts.filter((account) => String(account.id) !== String(form.account)).map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></Field>}<Field label="Fecha"><input required className={inputClass} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field><Field label="Importe" hint={!editing && form.transaction_type === "expense" ? (suggestingAmount ? "Consultando disponible…" : "Sugerido automáticamente; puedes modificarlo.") : undefined}><input required className={inputClass} type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field><Field label="Concepto"><input className={inputClass} value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} placeholder="Opcional" /></Field><div className="flex items-end"><Button type="submit" className="w-full">Guardar movimiento</Button></div></form></Card>}
    <Card>{loading ? <LoadingState /> : !accounts.length ? <EmptyState title="Primero necesitas una cuenta" description="Crea una cuenta antes de anotar movimientos." onAction={() => navigate("/accounts")} actionLabel="Crear cuenta" /> : !transactions.length ? <EmptyState title="No hay movimientos" description="Registra un ingreso, gasto o transferencia para comenzar tu historial." onAction={openCreate} actionLabel="Registrar movimiento" /> : <div className="divide-y divide-slate-800">{transactions.map((item) => { const typeInfo = item.transaction_type === "income" ? { Icon: ArrowDownLeft, color: "text-emerald-300", sign: "+", label: "Ingreso" } : item.transaction_type === "expense" ? { Icon: ArrowUpRight, color: "text-rose-300", sign: "-", label: "Gasto" } : { Icon: ArrowLeftRight, color: "text-cyan-300", sign: "", label: "Transferencia" }; return <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div className="flex items-center gap-4"><div className={`h-11 w-11 rounded-xl bg-slate-800 grid place-items-center ${typeInfo.color}`}><typeInfo.Icon className="w-5 h-5" /></div><div><p className="font-semibold">{item.memo || typeInfo.label}</p><p className="text-xs text-slate-500">{item.date} · {item.account_name}{item.destination_account_name ? ` → ${item.destination_account_name}` : item.category_name ? ` · ${item.category_name}` : ""}</p></div></div><div className="flex items-center gap-2 sm:gap-4"><span className={`font-black ${typeInfo.color}`}>{typeInfo.sign}{formatMoney(item.amount)}</span><Button variant="ghost" className="px-3" onClick={() => openEdit(item)}><Pencil className="w-4 h-4" /></Button><Button variant="danger" className="px-3" onClick={() => remove(item.id)}><Trash2 className="w-4 h-4" /></Button></div></div>; })}</div>}</Card>
  </div>;
}
