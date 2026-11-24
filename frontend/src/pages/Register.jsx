import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AtSign, Lock, Mail, User } from 'lucide-react';
import AuthShell, { Field } from './AuthShell';
import { Btn, ErrorBox } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';

export default function Register() {
  const { register, login } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', username: '', password: '', confirm: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!f.name.trim() || !f.email.trim() || !f.username.trim() || !f.password) return setErr('Please fill in all fields.');
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Enter a valid email address.');
    if (f.password.length < 6) return setErr('Password must be at least 6 characters.');
    if (f.password !== f.confirm) return setErr('Passwords do not match.');
    setBusy(true);
    try {
      await register(f);
    } catch (e2) {
      setBusy(false);
      return setErr(errMsg(e2));
    }
    try {
      await login(f.username.trim(), f.password);
      nav('/dashboard', { replace: true });
    } catch {
      nav('/login', { replace: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start tracking your investments in under a minute."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-indigo-500 hover:underline">Sign in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox message={err} />
        <Field label="Full name" icon={User} value={f.name} onChange={set('name')} placeholder="Your name" autoComplete="name" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" icon={Mail} type="email" value={f.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" />
          <Field label="Username" icon={AtSign} value={f.username} onChange={set('username')} placeholder="username" autoComplete="username" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" icon={Lock} type="password" value={f.password} onChange={set('password')} placeholder="Min 6 characters" autoComplete="new-password" />
          <Field label="Confirm" icon={Lock} type="password" value={f.confirm} onChange={set('confirm')} placeholder="Repeat password" autoComplete="new-password" />
        </div>
        <Btn type="submit" loading={busy} className="w-full py-3.5">Create account</Btn>
      </form>
    </AuthShell>
  );
}
