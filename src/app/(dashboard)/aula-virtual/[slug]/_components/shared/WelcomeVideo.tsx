// src/app/(dashboard)/aula-virtual/[slug]/_components/shared/WelcomeVideo.tsx

/** Extrae el ID de un URL de YouTube para construir la URL de embed. */
function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?]+)/);
  if (!match) return null;
  return `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1`;
}

interface WelcomeVideoProps {
  welcomeVideoUrl: string | null;
  title?: string;
}

export function WelcomeVideo({
  welcomeVideoUrl,
  title = "Video de bienvenida",
}: WelcomeVideoProps) {
  if (!welcomeVideoUrl) return null;

  const embedUrl = getYouTubeEmbedUrl(welcomeVideoUrl);

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div className="overflow-hidden rounded-xl bg-black">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="aspect-video w-full"
          />
        ) : (
          // Fallback para URLs de video directo (mp4, etc.)
          <video
            src={welcomeVideoUrl}
            controls
            className="aspect-video w-full"
          />
        )}
      </div>
    </section>
  );
}
