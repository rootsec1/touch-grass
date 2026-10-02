import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Camera, ChevronRight, LockKeyhole } from "lucide-react";
import { Button } from "@touch-grass/ui/components/button";
import { useJournal } from "@/lib/use-journal";
import { DiscoveryCard } from "@/components/discovery-card";
import { guides } from "@/lib/guides";
export const Route = createFileRoute("/explore")({ component: Home });
function Home() {
  const { items, user } = useJournal();
  return (
    <div className="page home-page">
      <div className="home-intro">
        <div>
          <h1>
            A little more <em>outside.</em>
          </h1>
          <p>
            {user
              ? `Hello, ${user.name.split(" ")[0]}. What will you notice today?`
              : "A pocket journal for your everyday discoveries."}
          </p>
        </div>
        <img className="intro-sprig" src="/images/oak-study.webp" alt="" />
      </div>
      <div className="home-layout">
        <section
          className="woodland-cover"
          aria-label="Start a nature discovery"
        >
          <div className="woodland-window">
            <img
              src="/images/woodland-illustration.webp"
              alt="An illustrated footpath winding between an old oak and a sunlit woodland"
              fetchPriority="high"
            />
            <span className="cover-annotation">Take the slow way.</span>
          </div>
          <div className="cover-caption">
            <div>
              <h2>There's a world at your feet.</h2>
              <p>A leaf, a tree, a name you never knew.</p>
            </div>
            <Button
              variant="field"
              nativeButton={false}
              render={<Link to="/capture" />}
            >
              <Camera data-icon="inline-start" />
              Make a discovery
            </Button>
          </div>
        </section>
        <div className="home-aside">
          <Link to="/challenges" className="invitation">
            <img src="/images/fern-study.webp" alt="" />
            <div>
              <span className="meta">On your next walk</span>
              <h2>Find a leaf worth a second look.</h2>
              <p>Follow your curiosity. See where it goes.</p>
            </div>
            <ChevronRight aria-hidden="true" />
          </Link>
          <section className="field-notes">
            <div className="section-heading">
              <h2>From the field notes</h2>
              <span className="meta">A few minutes of wonder</span>
            </div>
            <div className="guide-list">
              {guides.map((g) => (
                <Link
                  key={g.slug}
                  to="/guide/$slug"
                  params={{ slug: g.slug }}
                  className="guide-link"
                >
                  <img src={g.art} alt="" loading="lazy" />
                  <div>
                    <h3>{g.title}</h3>
                    <p>{g.time}</p>
                  </div>
                  <ArrowRight aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
      {items.length ? (
        <section className="section">
          <div className="section-heading">
            <div>
              <h2>Recently met</h2>
              <p>Another page in your journal.</p>
            </div>
            <Button
              variant="link"
              nativeButton={false}
              render={<Link to="/journal" />}
            >
              View all <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
          <div className="specimen-grid">
            {items.slice(0, 4).map((item) => (
              <DiscoveryCard item={item} key={item.id} />
            ))}
          </div>
        </section>
      ) : (
        <Link to="/journal" className="journal-invitation">
          <span className="book-spine" aria-hidden="true">
            <img src="/images/oak-study.webp" alt="" />
          </span>
          <div>
            <h2>A place for what you find.</h2>
            <p>Your photos, your notes, your field journal.</p>
          </div>
          <ArrowRight aria-hidden="true" />
        </Link>
      )}
      <p className="small-note">
        <LockKeyhole size={12} /> Just you and the world outside. Your journal
        is private.
      </p>
    </div>
  );
}
