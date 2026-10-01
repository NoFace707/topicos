import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Archive, ArrowLeftRight, Check, ChevronDown, ChevronRight, FolderPlus, Loader2, Pencil, Plus, RotateCcw, X } from "lucide-react";
import { Button, Card, EmptyState, ErrorBanner, Field, LoadingState, PageHeader, inputClass } from "../components/ui";
import { evaluateAllocationExpression } from "../budgetExpression";
import { budgetGroupTotals, currentMonth, formatMoney, monthLabel } from "../lib/finance";
import { asList, getCategories, getDashboard, getGroups, saveAllocation, saveCategory, saveGroup, setCategoryArchived, setGroupArchived, transferEnvelopeFunds } from "../services/budget";

const emptyMetrics = { assigned: "0", activity: "0", available: "0" };

export default function BudgetPage() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState(null);
  const [groups, setGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [draftErrors, setDraftErrors] = useState({});
  const [collapsed, setCollapsed] = useState({});
  const [showArchived, setShowArchived] = useState(false);
  const [groupForm, setGroupForm] = useState(null);
  const [categoryForm, setCategoryForm] = useState(null);
  const [transferForm, setTransferForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboard, groupData, categoryData] = await Promise.all([getDashboard(month), getGroups(), getCategories()]);
      const allGroups = asList(groupData);
      const allCategories = asList(categoryData);
      const metrics = Object.fromEntries(dashboard.groups.flatMap((group) => group.categories.map((category) => [category.id, category])));
      setData(dashboard);
      setGroups(allGroups);
      setCategories(allCategories);
      setDrafts(Object.fromEntries(allCategories.map((category) => [category.id, metrics[category.id]?.assigned || "0"])));
      setDraftErrors({});
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const metricsByCategory = useMemo(() => Object.fromEntries(
    (data?.groups || []).flatMap((group) => group.categories.map((category) => [category.id, category]))
  ), [data]);

  const rowsByGroup = useMemo(() => Object.fromEntries(groups.map((group) => [
    group.id,
    categories
      .filter((category) => category.group === group.id && (showArchived || !category.is_archived))
      .map((category) => ({ ...category, ...(metricsByCategory[category.id] || emptyMetrics) })),
  ])), [groups, categories, metricsByCategory, showArchived]);

  const visibleGroups = groups.filter((group) => showArchived || !group.is_archived);
  const activeCategories = categories.filter((category) => !category.is_archived && !groups.find((group) => group.id === category.group)?.is_archived);

  const saveAssigned = async (category) => {
    let next;
    try {
      next = evaluateAllocationExpression(drafts[category.id]);
      setDraftErrors((current) => ({ ...current, [category.id]: "" }));
    } catch (err) {
      setDraftErrors((current) => ({ ...current, [category.id]: err.message }));
      return;
    }
    if (next === Number(category.assigned || 0).toFixed(2)) {
      setDrafts((current) => ({ ...current, [category.id]: next }));
      return;
    }
    setSaving(category.id);
    setSaved(null);
    try {
      await saveAllocation({ category: category.id, month: `${month}-01`, assigned: next });
      setSaved(category.id);
      await load();
      window.setTimeout(() => setSaved(null), 1600);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  const openEnvelopeTransfer = (category) => {
    const destination = activeCategories.find((item) => item.id !== category.id);
    if (!destination) {
      setError("Necesitas al menos dos sobres activos para mover dinero.");
      return;
    }
    setTransferForm({ source_category: category.id, destination_category: destination.id, amount: "" });
  };

  const submitEnvelopeTransfer = async (event) => {
    event.preventDefault();
    try {
      await transferEnvelopeFunds({
        month: `${month}-01`,
        source_category: Number(transferForm.source_category),
        destination_category: Number(transferForm.destination_category),
        amount: transferForm.amount,
      });
      setTransferForm(null);
      await load();
    } catch (err) { setError(err.message); }
  };

  const submitGroup = async (event) => {
    event.preventDefault();
    try {
      await saveGroup({ name: groupForm.name }, groupForm.id);
      setGroupForm(null);
      await load();
    } catch (err) { setError(err.message); }
  };

  const submitCategory = async (event) => {
    event.preventDefault();
    try {
      await saveCategory({ name: categoryForm.name, group: Number(categoryForm.group) }, categoryForm.id);
      setCategoryForm(null);
      await load();
    } catch (err) { setError(err.message); }
  };

  const toggleGroupArchive = async (group) => {
    try { await setGroupArchived(group.id, !group.is_archived); await load(); }
    catch (err) { setError(err.message); }
  };

  const toggleCategoryArchive = async (category) => {
    try { await setCategoryArchived(category.id, !category.is_archived); await load(); }
    catch (err) { setError(err.message); }
  };

  return <div>
    <PageHeader eyebrow="Plan mensual" title={`Presupuesto de ${monthLabel(month)}`} description="Organiza tus sobres, calcula asignaciones con + o - y mueve dinero desde Disponible." action={<div className="flex flex-wrap gap-2"><input aria-label="Mes del presupuesto" type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white" /><Button variant="secondary" onClick={() => setGroupForm({ name: "" })}><FolderPlus className="w-4 h-4" />Añadir grupo</Button></div>} />
    <ErrorBanner message={error} />

    {groupForm && <Editor title={groupForm.id ? "Editar grupo" : "Nuevo grupo"} onClose={() => setGroupForm(null)} onSubmit={submitGroup}><Field label="Nombre"><input className={inputClass} value={groupForm.name} onChange={(event) => setGroupForm({ ...groupForm, name: event.target.value })} required autoFocus /></Field></Editor>}

    {categoryForm && <Editor title={categoryForm.id ? "Editar categoría" : "Nueva categoría"} onClose={() => setCategoryForm(null)} onSubmit={submitCategory}><Field label="Nombre"><input className={inputClass} value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} required autoFocus /></Field><Field label="Grupo"><select className={inputClass} value={categoryForm.group} onChange={(event) => setCategoryForm({ ...categoryForm, group: event.target.value })}>{groups.filter((group) => !group.is_archived).map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></Field></Editor>}

    {transferForm && <Editor title="Mover dinero entre sobres" onClose={() => setTransferForm(null)} onSubmit={submitEnvelopeTransfer}><Field label="Desde"><select className={inputClass} value={transferForm.source_category} onChange={(event) => { const source = Number(event.target.value); const destination = activeCategories.find((item) => item.id !== source); setTransferForm({ ...transferForm, source_category: source, destination_category: destination?.id || "" }); }}>{activeCategories.map((category) => <option key={category.id} value={category.id}>{category.group_name} · {category.name}</option>)}</select></Field><Field label="Hacia"><select required className={inputClass} value={transferForm.destination_category} onChange={(event) => setTransferForm({ ...transferForm, destination_category: event.target.value })}>{activeCategories.filter((category) => category.id !== Number(transferForm.source_category)).map((category) => <option key={category.id} value={category.id}>{category.group_name} · {category.name}</option>)}</select></Field><Field label="Importe" hint="Puede dejar el sobre origen en negativo."><input required className={inputClass} type="number" min="0.01" step="0.01" value={transferForm.amount} onChange={(event) => setTransferForm({ ...transferForm, amount: event.target.value })} autoFocus /></Field></Editor>}

    {loading ? <LoadingState /> : data && <div className="space-y-5">
      <Card className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${Number(data.ready_to_assign) < 0 ? "border-rose-500/40" : "border-emerald-500/30"}`}><div><p className="text-sm text-slate-400">Listo para asignar</p><p className={`text-3xl font-black mt-1 ${Number(data.ready_to_assign) < 0 ? "text-rose-300" : "text-emerald-300"}`}>{formatMoney(data.ready_to_assign, data.currency)}</p></div>{Number(data.ready_to_assign) < 0 && <div className="flex items-center gap-2 text-sm text-rose-300"><AlertTriangle className="w-5 h-5" />Reduce asignaciones hasta volver a cero.</div>}</Card>

      {!groups.length ? <Card><EmptyState title="Crea tu primer grupo" description="Por ejemplo: Necesidades, Vivienda o Ahorro. Después podrás añadir categorías y asignarles dinero aquí mismo." onAction={() => setGroupForm({ name: "" })} actionLabel="Crear grupo" /></Card> : <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3"><p className="text-sm text-slate-400">Edita <strong className="text-slate-200">Asignado</strong> con valores como 500+50. Pulsa <strong className="text-slate-200">Disponible</strong> para mover fondos.</p><label className="flex items-center gap-2 text-xs font-semibold text-slate-400"><input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} className="accent-emerald-400" />Mostrar archivados</label></div>
        <div className="overflow-x-auto"><div className="min-w-[760px]">
          <div className="grid grid-cols-[minmax(260px,1fr)_160px_150px_150px] gap-4 px-5 py-3 bg-slate-950 text-xs font-bold uppercase tracking-wider text-slate-500"><span>Categoría</span><span className="text-right">Asignado</span><span className="text-right">Actividad</span><span className="text-right">Disponible</span></div>
          {visibleGroups.map((group) => <BudgetGroup key={group.id} group={group} rows={rowsByGroup[group.id] || []} currency={data.currency} isCollapsed={collapsed[group.id]} setCollapsed={() => setCollapsed({ ...collapsed, [group.id]: !collapsed[group.id] })} setGroupForm={setGroupForm} setCategoryForm={setCategoryForm} toggleGroupArchive={toggleGroupArchive} toggleCategoryArchive={toggleCategoryArchive} drafts={drafts} setDrafts={setDrafts} draftErrors={draftErrors} setDraftErrors={setDraftErrors} saveAssigned={saveAssigned} openEnvelopeTransfer={openEnvelopeTransfer} saving={saving} saved={saved} />)}
        </div></div>
      </Card>}
    </div>}
  </div>;
}

function BudgetGroup({ group, rows, currency, isCollapsed, setCollapsed, setGroupForm, setCategoryForm, toggleGroupArchive, toggleCategoryArchive, drafts, setDrafts, draftErrors, setDraftErrors, saveAssigned, openEnvelopeTransfer, saving, saved }) {
  const totals = budgetGroupTotals(rows);
  return <div className={group.is_archived ? "opacity-60" : ""}>
    <div className="group grid grid-cols-[minmax(260px,1fr)_160px_150px_150px] gap-4 px-5 py-3 items-center border-t border-slate-700 bg-slate-800/70">
      <div className="flex items-center gap-2 min-w-0"><button type="button" onClick={setCollapsed} className="p-1 text-slate-400 hover:text-white" aria-label={`${isCollapsed ? "Desplegar" : "Plegar"} ${group.name}`}>{isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button><span className="font-extrabold truncate">{group.name}</span>{group.is_archived && <span className="text-xs text-slate-500">Archivado</span>}<div className="ml-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">{!group.is_archived && <button type="button" onClick={() => setCategoryForm({ name: "", group: group.id })} className="p-1.5 rounded-lg text-emerald-300 hover:bg-emerald-400/10" aria-label={`Añadir categoría a ${group.name}`}><Plus className="w-4 h-4" /></button>}<button type="button" onClick={() => setGroupForm({ ...group })} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white" aria-label={`Editar ${group.name}`}><Pencil className="w-4 h-4" /></button><button type="button" onClick={() => toggleGroupArchive(group)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white" aria-label={`${group.is_archived ? "Reactivar" : "Archivar"} ${group.name}`}>{group.is_archived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}</button></div></div>
      <span className="text-right font-bold">{formatMoney(totals.assigned, currency)}</span><span className="text-right text-slate-300">{formatMoney(totals.activity, currency)}</span><span className={`text-right font-bold ${totals.available < 0 ? "text-rose-300" : "text-slate-100"}`}>{formatMoney(totals.available, currency)}</span>
    </div>
    {!isCollapsed && (!rows.length ? <div className="border-t border-slate-800 px-12 py-4 text-sm text-slate-500">Sin categorías. <button type="button" onClick={() => setCategoryForm({ name: "", group: group.id })} className="font-bold text-emerald-300 hover:text-emerald-200">Añade la primera</button>.</div> : rows.map((category) => <div key={category.id} className={`group grid grid-cols-[minmax(260px,1fr)_160px_150px_150px] gap-4 px-5 py-3 items-center border-t border-slate-800 ${category.is_archived ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-2 pl-8 min-w-0"><span className="h-1.5 w-1.5 rounded-full bg-slate-600 shrink-0" /><span className="font-semibold truncate">{category.name}</span><div className="ml-1 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition"><button type="button" onClick={() => setCategoryForm({ ...category })} className="p-1 text-slate-500 hover:text-white" aria-label={`Editar ${category.name}`}><Pencil className="w-3.5 h-3.5" /></button><button type="button" onClick={() => toggleCategoryArchive(category)} className="p-1 text-slate-500 hover:text-white" aria-label={`${category.is_archived ? "Reactivar" : "Archivar"} ${category.name}`}>{category.is_archived ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}</button></div></div>
      <div className="relative"><input aria-label={`Asignado a ${category.name}`} disabled={category.is_archived || saving === category.id} type="text" inputMode="decimal" value={drafts[category.id] ?? "0"} onChange={(event) => { setDrafts({ ...drafts, [category.id]: event.target.value }); if (draftErrors[category.id]) setDraftErrors({ ...draftErrors, [category.id]: "" }); }} onBlur={() => saveAssigned(category)} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") { setDrafts({ ...drafts, [category.id]: category.assigned }); setDraftErrors({ ...draftErrors, [category.id]: "" }); event.currentTarget.blur(); } }} className={`w-full rounded-lg border bg-slate-950/70 px-3 py-2 pr-8 text-right font-bold text-white outline-none transition hover:border-slate-700 focus:ring-2 focus:ring-emerald-400/10 ${draftErrors[category.id] ? "border-rose-400" : "border-transparent focus:border-emerald-400"}`} />{saving === category.id && <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-emerald-300" />}{saved === category.id && <Check className="absolute right-2.5 top-2.5 h-4 w-4 text-emerald-300" />}{draftErrors[category.id] && <p className="mt-1 text-xs text-rose-300">{draftErrors[category.id]}</p>}</div>
      <span className="text-right text-slate-400">{formatMoney(category.activity, currency)}</span><button type="button" disabled={category.is_archived} onClick={() => openEnvelopeTransfer(category)} className={`ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-right font-black transition hover:bg-slate-800 disabled:cursor-not-allowed ${Number(category.available) < 0 ? "text-rose-300" : "text-emerald-300"}`} aria-label={`Mover dinero desde ${category.name}`}><ArrowLeftRight className="h-3.5 w-3.5" />{formatMoney(category.available, currency)}</button>
    </div>))}
  </div>;
}

function Editor({ title, onClose, onSubmit, children }) {
  return <Card className="p-5 mb-6"><div className="flex items-center justify-between mb-5"><h2 className="font-bold">{title}</h2><button type="button" onClick={onClose} className="text-slate-500 hover:text-white" aria-label="Cerrar editor"><X /></button></div><form onSubmit={onSubmit} className="flex flex-col md:flex-row md:items-end gap-4"><div className="grid flex-1 md:grid-cols-2 gap-4">{children}</div><Button type="submit">Guardar</Button></form></Card>;
}
