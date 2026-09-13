import { FormEvent, useState } from 'react';
import { Boxes, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { useInventory } from '../contexts/InventoryContext';

export function Login() {
  const { login, authLoading, authError } = useInventory();
  const [username, setUsername] = useState(import.meta.env.VITE_DEMO_USERNAME ?? 'Jeremiah');
  const [password, setPassword] = useState(import.meta.env.VITE_DEMO_PASSWORD ?? 'Jeremiah@demo1');
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await login(username, password);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-4 py-10">
      <section
        className="surface surface-raised w-full max-w-md rounded-3xl bg-card p-6 sm:p-9"
        aria-labelledby="login-title"
      >
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Boxes className="size-5" />
        </div>
        <p className="mt-6 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Clinic inventory management
        </p>
        <h1 id="login-title" className="mt-2 text-2xl font-semibold sm:text-3xl">
          Welcome back
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Sign in to review supplies, spot low stock and correct physical counts.
        </p>

        <form className="mt-7 space-y-5" onSubmit={submit}>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              autoComplete="username"
              className="mt-1.5 h-11 rounded-xl"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1.5">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="h-11 rounded-xl pr-11"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          {authError && (
            <p
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {authError}
            </p>
          )}
          <Button type="submit" className="h-11 w-full rounded-xl" size="lg" disabled={authLoading}>
            {authLoading && <LoaderCircle className="size-4 animate-spin" />}
            {authLoading ? 'Signing in…' : 'Sign in to console'}
          </Button>
        </form>
        <p className="mt-6 text-xs leading-5 text-muted-foreground">
          Demo credentials are prefilled for this assessment environment.
        </p>
      </section>
    </main>
  );
}
