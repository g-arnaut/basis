import { login } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col justify-center px-6">
      <p className="label text-forest">Owner access</p>
      <h1 className="display mt-3 text-[4.5rem]">Sign in</h1>
      <form action={login} className="mt-6 space-y-4">
        <input
          name="password"
          type="password"
          required
          autoFocus
          placeholder="Password"
          className="field"
        />
        {error && (
          <p className="text-sm text-loss">Incorrect password.</p>
        )}
        <button
          type="submit"
          className="btn-primary w-full py-3"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
