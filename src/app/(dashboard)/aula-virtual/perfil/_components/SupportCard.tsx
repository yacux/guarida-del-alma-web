export function SupportCard() {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-lg font-semibold">¿Necesitás ayuda?</h2>

      <p className="mt-2 text-zinc-400">
        Si tenés dudas sobre tus formaciones o necesitás asistencia, podés
        comunicarte con el equipo de La Guarida del Alma.
      </p>

      <div className="mt-6 flex gap-4">
        <button className="rounded-xl bg-guarida-fuchsia px-5 py-2">
          WhatsApp
        </button>

        <button className="rounded-xl border border-zinc-700 px-5 py-2">
          Enviar email
        </button>
      </div>
    </section>
  );
}
