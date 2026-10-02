import { createFileRoute, Link } from "@tanstack/react-router";
import { Progress } from "@touch-grass/ui/components/progress";
import { Button } from "@touch-grass/ui/components/button";
import { Check, ArrowRight } from "lucide-react";
import { challenges, countSpecies } from "@touch-grass/api/domain";
import { useJournal } from "@/lib/use-journal";
import { PageHeading } from "@/components/page";
export const Route = createFileRoute("/challenges")({ component: Challenges });
function Challenges() {
  const { items } = useJournal();
  const counts = {
    discoveries: items.length,
    species: countSpecies(items),
    visits: items.reduce((n, i) => n + i.visits.length, 0),
  };
  return (
    <div className="page page-narrow">
      <PageHeading
        title="Room to wander"
        description="A few things to try when you step outside."
      />
      <div className="wander-intro">
        <img
          src="/images/woodland-illustration.webp"
          alt="An illustrated path through the woods"
        />
        <div>
          <h2>
            Follow something
            <br />
            <em>other than a route.</em>
          </h2>
          <p>
            Ten minutes. A familiar street. Something you haven't noticed
            before.
          </p>
          <Button
            variant="link"
            nativeButton={false}
            render={
              <Link to="/guide/$slug" params={{ slug: "everyday-walk" }} />
            }
          >
            A walking field note <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </div>
      <div className="wander-list">
        {challenges.map((c, index) => {
          const count = Math.min(counts[c.measure], c.target);
          const complete = count === c.target;
          return (
            <article className="wander-item" key={c.id}>
              <img
                src={
                  index % 2
                    ? "/images/fern-study.webp"
                    : "/images/oak-study.webp"
                }
                alt=""
                loading="lazy"
              />
              <div>
                <h2>{c.title}</h2>
                <p>{c.description}</p>
                <div className="wander-progress">
                  <Progress
                    value={(count / c.target) * 100}
                    aria-label={`${c.title}: ${count} of ${c.target}`}
                  />
                  <span>
                    {complete ? "Completed" : `${count} / ${c.target}`}
                  </span>
                </div>
                <Button
                  variant="link"
                  nativeButton={false}
                  render={
                    <Link
                      to={c.measure === "visits" ? "/journal" : "/capture"}
                    />
                  }
                >
                  {complete ? <Check data-icon="inline-start" /> : null}
                  {complete
                    ? "Keep exploring"
                    : c.measure === "visits"
                      ? "Choose a tree to revisit"
                      : "Try this on your walk"}
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </div>
            </article>
          );
        })}
      </div>
      <p className="small-note">
        No streaks. No catching up. Just getting to know your world.
      </p>
    </div>
  );
}
