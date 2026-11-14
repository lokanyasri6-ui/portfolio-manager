import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import api, { errMsg } from '../api';
import { useData } from '../context/DataContext';
import { CATEGORIES, fmtDate, money, num } from '../utils/format';
import { Badge, Btn, Empty, ErrorBox, Glass, inputCls, Label, Modal, PageHeader, PL, Spinner } from '../components/ui';

const blank = { name: '', category: 'Stocks', units: '', purchase_price: '', current_price: '', purchase_date: new Date().toISOString().slice(0, 10), notes: '' };
const FILTERS = ['All', ...CATEGORIES.map((c) => c.label)];

export default function Investments() {
  const { investments, loading, error, reload } = useData();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [form, setForm] = useState(null); // null = closed
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState('');
  const [pageErr, setPageErr] = useState('');

  const rows = useMemo(
    () => investments.filter((i) => (cat === 'All' || i.category === cat) && i.name.toLowerCase().includes(q.trim().toLowerCase())),
    [investments, q, cat]
  );

  const openAdd = () => { setFormErr(''); setForm({ ...blank }); };
  const openEdit = (i) => {
    setFormErr('');
    setForm({
      id: i.id,
      name: i.name,
      category: i.category,
      units: String(i.units),
      purchase_price: String(i.purchase_price),
      current_price: String(i.current_price),
      purchase_date: i.purchase_date ? String(i.purchase_date).slice(0, 10) : '',
      notes: i.notes || '',
    });
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setFormErr('');
    if (!form.name.trim()) return setFormErr('Name is required.');
    if (!(num(form.units) > 0)) return setFormErr('Units must be greater than 0.');
    if (form.purchase_price === '' || num(form.purchase_price) < 0) return setFormErr('Enter a valid purchase price.');
    if (form.current_price === '' || num(form.current_price) < 0) return setFormErr('Enter a valid current price.');
    if (!form.purchase_date) return setFormErr('Purchase date is required.');
    const payload = {
      name: form.name.trim(),
      category: form.category,
      units: num(form.units),
      purchase_price: num(form.purchase_price),
      current_price: num(form.current_price),
      purchase_date: form.purchase_date,
      notes: form.notes,
    };
    setBusy(true);
    try {
      if (form.id != null) await api.put(`/api/investments/${form.id}/`, payload);
      else await api.post('/api/investments/', payload);
      setForm(null);
      await reload();
    } catch (e2) {
      setFormErr(errMsg(e2));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setPageErr('');
    try {
      await api.delete(`/api/investments/${del.id}/`);
      setDel(null);
      await reload();
    } catch (e) {
      setDel(null);
      setPageErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const preview = form ? { inv: num(form.units) * num(form.purchase_price), cur: num(form.units) * num(form.current_price) } : null;

  return (
    <div>
      <PageHeader title="Investments" subtitle="Add, edit and manage everything you own.">
        <Btn onClick={openAdd}><Plus className="h-4 w-4" /> Add investment</Btn>
      </PageHeader>

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="group relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500" />
          <input className={`${inputCls} pl-11`} placeholder="Search by name…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setCat(f)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${cat === f ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/40' : 'border border-slate-200 bg-white/60 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <ErrorBox message={error || pageErr} onRetry={reload} />
        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <Glass>
            <Empty
              title={investments.length ? 'No matches' : 'No investments yet'}
              text={investments.length ? 'Try a different search or filter.' : 'Add your first investment to start tracking.'}
              action={!investments.length && <Btn onClick={openAdd}><Plus className="h-4 w-4" /> Add investment</Btn>}
            />
          </Glass>
        ) : (
          <>
            {/* desktop table */}
            <Glass className="hidden overflow-hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Investment</th><th className="px-3 text-right">Units</th><th className="px-3 text-right">Purchase</th><th className="px-3 text-right">Current</th>
                      <th className="px-3 text-right">Value</th><th className="px-3 text-right">P/L</th><th className="px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <motion.tr layout key={r.id ?? r.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-slate-200/60 transition hover:bg-indigo-500/5 dark:border-white/5">
                        <td className="px-6 py-4">
                          <p className="font-semibold">{r.name}</p>
                          <div className="mt-1 flex items-center gap-2"><Badge cat={r.category} /><span className="flex items-center gap-1 text-xs text-slate-500"><Calendar className="h-3 w-3" />{fmtDate(r.purchase_date)}</span></div>
                          {r.notes && <p className="mt-1 max-w-xs truncate text-xs text-slate-500 dark:text-slate-400">{r.notes}</p>}
                        </td>
                        <td className="px-3 text-right">{r.units}</td>
                        <td className="px-3 text-right">{money(r.purchase_price)}</td>
                        <td className="px-3 text-right">{money(r.current_price)}</td>
                        <td className="px-3 text-right">{money(r.current)}</td>
                        <td className="px-3 text-right"><PL value={r.pl} percent={r.ret} /></td>
                        <td className="px-6 text-right">
                          <button onClick={() => openEdit(r)} title="Edit" className="rounded-xl p-2 transition hover:bg-indigo-500/15 hover:text-indigo-500"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => setDel(r)} title="Delete" className="rounded-xl p-2 transition hover:bg-rose-500/15 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Glass>

            {/* mobile cards */}
            <div className="grid gap-4 md:hidden">
              {rows.map((r) => (
                <Glass key={r.id ?? r.name} className="p-5" hover>
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="font-display font-bold">{r.name}</p><div className="mt-1"><Badge cat={r.category} /></div></div>
                    <div className="flex">
                      <button onClick={() => openEdit(r)} className="rounded-xl p-2 hover:bg-indigo-500/15"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setDel(r)} className="rounded-xl p-2 hover:bg-rose-500/15"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div><dt className="text-xs text-slate-500">Units</dt><dd className="font-semibold">{r.units}</dd></div>
                    <div><dt className="text-xs text-slate-500">Date</dt><dd className="font-semibold">{fmtDate(r.purchase_date)}</dd></div>
                    <div><dt className="text-xs text-slate-500">Purchase</dt><dd className="font-semibold">{money(r.purchase_price)}</dd></div>
                    <div><dt className="text-xs text-slate-500">Current</dt><dd className="font-semibold">{money(r.current_price)}</dd></div>
                    <div className="col-span-2"><dt className="text-xs text-slate-500">Profit / Loss</dt><dd><PL value={r.pl} percent={r.ret} /></dd></div>
                  </dl>
                </Glass>
              ))}
            </div>
          </>
        )}
      </div>

      {/* add / edit */}
      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id != null ? 'Edit investment' : 'Add investment'}>
        {form && (
          <form onSubmit={save} className="space-y-4">
            <ErrorBox message={formErr} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label>Name</Label><input className={inputCls} value={form.name} onChange={set('name')} placeholder="e.g. Reliance Industries" /></div>
              <div><Label>Category</Label>
                <select className={inputCls} value={form.category} onChange={set('category')}>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value} className="text-slate-900">{c.label}</option>)}
                </select>
              </div>
              <div><Label>Purchase date</Label><input type="date" className={inputCls} value={form.purchase_date} onChange={set('purchase_date')} /></div>
              <div><Label>Units</Label><input type="number" step="any" min="0" className={inputCls} value={form.units} onChange={set('units')} placeholder="0" /></div>
              <div><Label>Purchase price (₹)</Label><input type="number" step="any" min="0" className={inputCls} value={form.purchase_price} onChange={set('purchase_price')} placeholder="0.00" /></div>
              <div className="sm:col-span-2"><Label>Current price (₹)</Label><input type="number" step="any" min="0" className={inputCls} value={form.current_price} onChange={set('current_price')} placeholder="0.00" /></div>
              <div className="sm:col-span-2"><Label>Notes</Label><textarea rows={3} className={inputCls} value={form.notes} onChange={set('notes')} placeholder="Optional notes…" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 p-4 text-sm">
              <div><p className="text-xs text-slate-500">Invested</p><p className="font-bold">{money(preview.inv)}</p></div>
              <div><p className="text-xs text-slate-500">Current value</p><p className="font-bold">{money(preview.cur)}</p></div>
            </div>
            <div className="flex justify-end gap-3">
              <Btn type="button" variant="ghost" onClick={() => setForm(null)}>Cancel</Btn>
              <Btn type="submit" loading={busy}>{form.id != null ? 'Save changes' : 'Add investment'}</Btn>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!del} onClose={() => setDel(null)} title="Delete investment?">
        <p className="text-sm text-slate-600 dark:text-slate-300">This will permanently remove <b>{del?.name}</b> from your portfolio.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Btn variant="ghost" onClick={() => setDel(null)}>Cancel</Btn>
          <Btn variant="danger" loading={busy} onClick={remove}>Delete</Btn>
        </div>
      </Modal>
    </div>
  );
}
