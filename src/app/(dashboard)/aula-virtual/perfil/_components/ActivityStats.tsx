interface Props {
  profile: any;
}

export function ActivityStats({ profile }: Props) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Mi actividad</h2>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Formaciones activas" value={profile.activeProducts} />

        <Card title="Certificados" value={profile.certificates} />

        <Card title="Miembro desde" value={profile.memberSince} />
      </div>
    </section>
  );
}

function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-sm text-zinc-400">{title}</p>

      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
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
