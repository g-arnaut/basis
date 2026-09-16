import { login } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col justify-center px-6">
      <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
      <form action={login} className="mt-6 space-y-4">
        <input
          name="password"
          type="password"
          required
          autoFocus
          placeholder="Password"
          className="w-full border-b border-rule bg-transparent py-2 focus:border-ink focus:outline-none"
        />
        {error && (
          <p className="text-sm text-loss">Incorrect password.</p>
        )}
        <button
          type="submit"
          className="w-full rounded-sm bg-ink py-2.5 text-paper"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
