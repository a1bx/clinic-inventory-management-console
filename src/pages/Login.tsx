import { FormEvent, useState } from 'react';
import { Boxes, LoaderCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { useInventory } from '../contexts/InventoryContext';

export function Login() {
  const { login, authLoading, authError } = useInventory();
  const [username, setUsername] = useState('emilys');
  const [password, setPassword] = useState('emilyspass');
  const submit = async (event: FormEvent) => { event.preventDefault(); await login(username, password); };
  return <main className="flex min-h-screen items-center justify-center bg-page px-4 py-10">
    <section className="surface surface-raised w-full max-w-md rounded-2xl p-6 sm:p-8" aria-labelledby="login-title">
      <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Boxes className="size-5" /></div>
      <p className="mt-6 text-xs font-medium uppercase tracking-widest text-muted-foreground">Savannah Informatics</p>
      <h1 id="login-title" className="mt-2 text-2xl font-semibold">Sign in to Supply Console</h1>
      <p className="mt-2 text-sm text-muted-foreground">Use your supplies team account to view and correct clinic stock.</p>
      <form className="mt-6 space-y-4" onSubmit={submit}>
        <div><Label htmlFor="username">Username</Label><Input id="username" autoComplete="username" className="mt-1.5" value={username} onChange={(event) => setUsername(event.target.value)} required /></div>
        <div><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete="current-password" className="mt-1.5" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
        {authError && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{authError}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={authLoading}>{authLoading && <LoaderCircle className="size-4 animate-spin" />}{authLoading ? 'Signing in…' : 'Sign in'}</Button>
      </form>
      <p className="mt-5 text-xs text-muted-foreground">Demo credentials are prefilled. DummyJSON provides the test account.</p>
    </section>
  </main>;
}
