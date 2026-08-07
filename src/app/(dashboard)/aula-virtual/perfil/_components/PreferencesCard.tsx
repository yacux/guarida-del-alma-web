export function PreferencesCard() {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-5 text-lg font-semibold">Preferencias</h2>

      <div className="space-y-4">
        <Row label="Idioma" value="Español" />

        <Row label="Zona horaria" value="Argentina" />

        <Row label="Notificaciones" value="Activadas" />
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-400">{label}</span>

      <span>{value}</span>
    </div>
  );
}
