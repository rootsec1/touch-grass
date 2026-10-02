import { lazy, Suspense } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@touch-grass/ui/components/button";
import { Skeleton } from "@touch-grass/ui/components/skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@touch-grass/ui/components/empty";
import { MapPin, LockKeyhole } from "lucide-react";
import { useJournal, useOnline } from "@/lib/use-journal";
import { PageHeading, ErrorState, LoadingCards } from "@/components/page";
import { Photo } from "@/components/photo";
const JournalMap = lazy(() => import("@/components/journal-map"));
export const Route = createFileRoute("/map")({ component: MapPage });
function MapPage() {
  const { items, pending, isLoading, error, refetch } = useJournal();
  const online = useOnline();
  const located = items.filter(
    (i) => i.latitude !== null && i.longitude !== null,
  );
  return (
    <div className="page">
      <PageHeading
        title="My places"
        description="Familiar trees. Favourite corners. All yours."
      />
      {pending || isLoading ? (
        <LoadingCards />
      ) : error ? (
        <ErrorState message={error.message} retry={() => void refetch()} />
      ) : located.length ? (
        <>
          <div className="map-layout">
            {online ? (
              <Suspense fallback={<Skeleton className="map-canvas" />}>
                <JournalMap items={located} />
              </Suspense>
            ) : (
              <div className="capture-stage">
                <MapPin />
                <h2>Your places are still here.</h2>
                <p>
                  The basemap needs a connection. Open your discoveries from the
                  list below.
                </p>
              </div>
            )}
            <div className="map-list">
              {located.map((i) => (
                <Link
                  key={i.id}
                  to="/journal/$id"
                  params={{ id: i.id }}
                  className="map-item"
                >
                  <Photo id={i.photoIds[0]} alt="" />
                  <div>
                    <strong>{i.nickname || i.commonName}</strong>
                    <p>
                      {i.place ||
                        `${i.latitude?.toFixed(3)}, ${i.longitude?.toFixed(3)}`}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <p className="small-note">
            <LockKeyhole size={13} />
            Only you can see these pins. Map tiles are provided by
            OpenStreetMap.
          </p>
        </>
      ) : (
        <Empty className="journal-empty">
          <EmptyHeader>
            <img
              className="map-empty-art"
              src="/images/woodland-illustration.webp"
              alt="An illustrated woodland path"
            />
            <EmptyTitle>Somewhere worth returning to.</EmptyTitle>
            <EmptyDescription>
              Save a discovery with a private location pin. Your favourite trees
              will find a home here.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              nativeButton={false}
              variant="field"
              render={<Link to="/capture" />}
            >
              Make a discovery
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </div>
  );
}
