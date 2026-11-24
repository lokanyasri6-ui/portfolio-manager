import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import AuthShell, { Field } from './AuthShell';
import { Btn, ErrorBox } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ id: '', pw: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!f.id.trim() || !f.pw) return setErr('Enter your username or email and password.');
    setBusy(true);
    try {
      await login(f.id.trim(), f.pw);
      nav('/dashboard', { replace: true });
    } catch (e2) {
      setErr(errMsg(e2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to see how your portfolio is performing."
      footer={<>New to Folio? <Link to="/register" className="font-semibold text-indigo-500 hover:underline">Create an account</Link></>}
    >
      <form onSubmit={submit} className="space-y-5">
        <ErrorBox message={err} />
        <Field label="Username or email" icon={User} value={f.id} onChange={(e) => setF({ ...f, id: e.target.value })} placeholder="you@example.com" autoComplete="username" />
        <Field label="Password" icon={Lock} type="password" value={f.pw} onChange={(e) => setF({ ...f, pw: e.target.value })} placeholder="••••••••" autoComplete="current-password" />
        <Btn type="submit" loading={busy} className="w-full py-3.5">Sign in</Btn>
      </form>
    </AuthShell>
  );
}
