import { useMemo, useState } from 'react';
import { Activity, Search, ShieldCheck, UserCheck, UserX, Users } from 'lucide-react';
import api, { errMsg, firstArray, useLoad } from '../api';
import { fmtDate, num } from '../utils/format';
import { Btn, Empty, ErrorBox, Glass, inputCls, KPI, PageHeader, Spinner } from '../components/ui';

const pick = (o, keys) => {
  if (!o) return null;
  for (const k of keys) if (o[k] != null) return num(o[k]);
  return null;
};

export default function Admin() {
  const { data, loading, error, reload } = useLoad(async () => {
    const [s, u] = await Promise.allSettled([api.get('/api/admin/stats/'), api.get('/api/admin/users/')]);
    if (s.status === 'rejected' && u.status === 'rejected') throw s.reason;
    return {
      stats: s.status === 'fulfilled' ? s.value.data : null,
      statsErr: s.status === 'rejected' ? errMsg(s.reason) : null,
      users: u.status === 'fulfilled' ? firstArray(u.value.data) : [],
      usersErr: u.status === 'rejected' ? errMsg(u.reason) : null,
    };
  });
  const [q, setQ] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState('');
  const [override, setOverride] = useState({}); // id -> is_active (optimistic)

  const users = useMemo(() => (data?.users || []).map((u) => ({ ...u, is_active: override[u.id] ?? (u.is_active ?? u.active ?? true) })), [data, override]);
  const filtered = users.filter((u) => `${u.username} ${u.email} ${u.name || ''} ${u.first_name || ''}`.toLowerCase().includes(q.trim().toLowerCase()));

  const stats = data?.stats;
  const total = pick(stats, ['total_users', 'users', 'user_count']) ?? users.length;
  const active = pick(stats, ['active_users', 'active']) ?? users.filter((u) => u.is_active).length;
  const logs = firstArray(stats?.activity_logs ?? stats?.logs ?? stats?.recent_activity ?? stats?.activities ?? null);

  const toggle = async (u) => {
    setBusyId(u.id);
    setMsg('');
    const next = !u.is_active;
    try {
      await api.patch(`/api/admin/users/${u.id}/`, { is_active: next });
      setOverride((o) => ({ ...o, [u.id]: next }));
    } catch (e) {
      setMsg(errMsg(e));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Admin" subtitle="Platform overview and user management." />
      <ErrorBox message={error || data?.statsErr || data?.usersErr} onRetry={reload} />
      <ErrorBox message={msg} />

      <div className="grid gap-4 sm:grid-cols-3">
        <KPI title="Total Users" value={String(total)} icon={Users} from="#6366F1" to="#8B5CF6" />
        <KPI title="Active Users" value={String(active)} icon={UserCheck} from="#10B981" to="#06B6D4" />
        <KPI title="Inactive Users" value={String(Math.max(total - active, 0))} icon={UserX} from="#F43F5E" to="#FB923C" />
      </div>

      <Glass className="overflow-hidden">
        <div className="flex flex-col gap-3 p-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-display text-lg font-bold">Users</h3>
          <div className="group relative sm:w-72">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500" />
            <input className={`${inputCls} py-2.5 pl-11`} placeholder="Search users…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        {filtered.length === 0 ? <Empty title="No users found" /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr><th className="px-6 py-3">User</th><th className="px-3">Email</th><th className="px-3">Joined</th><th className="px-3">Status</th><th className="px-6 text-right">Action</th></tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t border-slate-200/60 transition hover:bg-indigo-500/5 dark:border-white/5">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white">{(u.username || u.email || '?')[0].toUpperCase()}</div>
                        <div><p className="font-semibold">{u.name || u.first_name || u.username}</p><p className="text-xs text-slate-500">@{u.username}</p></div>
                        {(u.is_staff || u.is_superuser) && <ShieldCheck className="h-4 w-4 text-indigo-400" title="Admin" />}
                      </div>
                    </td>
                    <td className="px-3 text-slate-600 dark:text-slate-300">{u.email}</td>
                    <td className="px-3 text-slate-500">{fmtDate(u.date_joined || u.created_at)}</td>
                    <td className="px-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${u.is_active ? 'bg-emerald-500/15 text-emerald-500 ring-emerald-500/30' : 'bg-rose-500/15 text-rose-500 ring-rose-500/30'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />{u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 text-right">
                      <Btn variant={u.is_active ? 'danger' : 'primary'} className="!px-4 !py-2" loading={busyId === u.id} onClick={() => toggle(u)}>
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Glass>

      <Glass className="p-6">
        <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold"><Activity className="h-5 w-5 text-indigo-400" /> Activity logs</h3>
        {logs.length === 0 ? (
          <Empty title="No activity logs" text="The /api/admin/stats/ response did not include any activity log entries." />
        ) : (
          <ul className="space-y-3">
            {logs.map((l, i) => (
              <li key={l.id ?? i} className="flex items-start gap-3 rounded-2xl bg-slate-100/60 p-3 dark:bg-white/5">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 shadow-[0_0_10px_#818cf8]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{l.action || l.message || l.description || l.event || 'Activity'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{[l.user || l.username, fmtDate(l.timestamp || l.created_at || l.date)].filter(Boolean).join(' · ')}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Glass>
    </div>
  );
}
