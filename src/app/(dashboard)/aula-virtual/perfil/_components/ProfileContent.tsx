import { ActivityStats } from "./ActivityStats";
import { PreferencesCard } from "./PreferencesCard";
import { ProfileHero } from "./ProfileHero";
import { SecurityCard } from "./SecurityCard";
import { SupportCard } from "./SupportCard";

interface Props {
  profile: any;
}

export function ProfileContent({ profile }: Props) {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <ProfileHero profile={profile} />

      <ActivityStats profile={profile} />

      <div className="grid gap-6 lg:grid-cols-2">
        <PreferencesCard />

        <SecurityCard />
      </div>

      <SupportCard />
    </div>
  );
}
