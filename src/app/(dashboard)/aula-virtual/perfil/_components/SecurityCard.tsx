export function SecurityCard() {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-5 text-lg font-semibold">Seguridad</h2>

      <p className="text-zinc-400">
        Tu autenticación es administrada por Clerk.
      </p>

      <button className="mt-6 rounded-xl border border-zinc-700 px-4 py-2">
        Administrar cuenta
      </button>
    </section>
  );
}
