interface Props {
  profile: any;
}

export function ProfileHero({ profile }: Props) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
      <div className="flex items-center gap-6">
        <img
          src={profile.avatarUrl}
          alt={profile.username}
          className="h-24 w-24 rounded-full object-cover"
        />

        <div>
          <h1 className="text-3xl font-bold text-white">{profile.username}</h1>

          <p className="mt-2 text-zinc-400">{profile.email}</p>

          <button className="mt-5 rounded-xl bg-guarida-fuchsia px-5 py-2 text-sm font-medium">
            Editar perfil
          </button>
        </div>
      </div>
    </section>
  );
}
