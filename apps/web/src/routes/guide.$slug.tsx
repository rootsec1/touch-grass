import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@touch-grass/ui/components/button";
import { ArrowLeft, Camera } from "lucide-react";
import { guides } from "@/lib/guides";
export const Route = createFileRoute("/guide/$slug")({ component: Guide });
function Guide() {
  const { slug } = Route.useParams();
  const guide = guides.find((g) => g.slug === slug);
  if (!guide)
    return (
      <div className="page">
        This field note isn't here. <Link to="/explore">Return home</Link>
      </div>
    );
  return (
    <div className="page page-narrow">
      <Button
        variant="ghost"
        className="mb-3"
        nativeButton={false}
        render={<Link to="/explore" />}
      >
        <ArrowLeft data-icon="inline-start" />
        Field notes
      </Button>
      <article className="article">
        <header className="article-heading">
          <div>
            <h1>{guide.title}</h1>
            <p className="meta">Field notes · {guide.time}</p>
          </div>
          <img src={guide.art} alt="" />
        </header>
        <img
          src={`/images/${guide.image}.webp`}
          alt="A quiet moment in nature"
        />
        {guide.sections.map((s) => (
          <section key={s.title}>
            <h2>{s.title}</h2>
            <p>{s.text}</p>
          </section>
        ))}
        <Button
          className="mt-5"
          nativeButton={false}
          render={<Link to="/capture" />}
        >
          <Camera data-icon="inline-start" />
          Make a discovery
        </Button>
      </article>
    </div>
  );
}
