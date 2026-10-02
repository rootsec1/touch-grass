import { countSpecies } from "@touch-grass/api/domain";
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@touch-grass/ui/components/button";
import { Input } from "@touch-grass/ui/components/input";
import { Tabs, TabsList, TabsTrigger } from "@touch-grass/ui/components/tabs";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@touch-grass/ui/components/alert";
import { toast } from "@touch-grass/ui/components/toast";
import { Camera, CloudUpload, Loader2 } from "lucide-react";
import { useJournal, useDrafts, useOnline } from "@/lib/use-journal";
import { syncDraft } from "@/lib/journal";
import {
  PageHeading,
  EmptyJournal,
  ErrorState,
  LoadingCards,
} from "@/components/page";
import { DiscoveryCard } from "@/components/discovery-card";
import { Photo } from "@/components/photo";
export const Route = createFileRoute("/journal/")({ component: Journal });
function Journal() {
  const { items, cached, user, pending, isLoading, error, refetch } =
    useJournal();
  const drafts = useDrafts();
  const online = useOnline();
  const client = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [syncError, setSyncError] = useState("");
  const visible = items.filter(
    (i) =>
      (filter !== "following" || i.followed) &&
      `${i.commonName} ${i.scientificName} ${i.nickname} ${i.place} ${i.notes}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const species = countSpecies(items);
  const visits = items.reduce((sum, item) => sum + item.visits.length, 0);
  async function sync() {
    if (!user) return;
    setBusy(true);
    setSyncError("");
    try {
      for (const d of drafts.data || []) await syncDraft(d, user.id);
      await client.invalidateQueries({ queryKey: ["journal"] });
      toast.add({
        title: "All caught up",
        description: "Your discoveries are backed up in your journal.",
        type: "success",
      });
    } catch (e) {
      setSyncError(
        e instanceof Error ? e.message : "Couldn't sync. Your drafts are safe.",
      );
    } finally {
      await drafts.refetch();
      setBusy(false);
    }
  }
  return (
    <div className="page">
      <PageHeading
        title="My field journal"
        description="A growing collection of things you noticed."
        action={
          <Button
            size="icon"
            aria-label="Add a discovery"
            nativeButton={false}
            render={<Link to="/capture" />}
          >
            <Camera />
          </Button>
        }
      />
      {cached ? (
        <Alert className="mb-5">
          <AlertTitle>Your saved journal</AlertTitle>
          <AlertDescription>
            Showing the copy on this device. Connect again to check for updates.
          </AlertDescription>
        </Alert>
      ) : null}
      {drafts.data?.length ? (
        <section className="mb-8">
          <Alert>
            <CloudUpload />
            <AlertTitle>
              {drafts.data.length}{" "}
              {drafts.data.length === 1 ? "discovery" : "discoveries"} saved on
              this device
            </AlertTitle>
            <AlertDescription>
              Saved on this device.{" "}
              {user
                ? "Sync when you're online to keep them across devices."
                : "Sign in to back up your photographs."}
            </AlertDescription>
          </Alert>
          {drafts.data.map((d) => (
            <div className="draft-row" key={d.id}>
              <Photo blob={d.photos[0]?.blob} alt="Draft discovery" />
              <div>
                <strong>{d.nickname || d.commonName}</strong>
                <p className="meta">
                  {d.discoveryId ? "New visit" : "Local draft"} ·{" "}
                  {new Date(d.observedAt).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link to="/capture" search={{ draft: d.id }} />}
              >
                Continue
              </Button>
            </div>
          ))}
          {user ? (
            <Button disabled={!online || busy} onClick={() => void sync()}>
              {busy ? (
                <Loader2 className="animate-spin" />
              ) : (
                <CloudUpload data-icon="inline-start" />
              )}
              {busy ? "Syncing discoveries…" : "Sync all drafts"}
            </Button>
          ) : (
            <Button nativeButton={false} render={<Link to="/login" />}>
              Sign in to sync
            </Button>
          )}
          {syncError ? (
            <div className="mt-4">
              <ErrorState message={syncError} />
            </div>
          ) : null}
        </section>
      ) : null}
      {pending || isLoading ? (
        <LoadingCards />
      ) : error ? (
        <ErrorState message={error.message} retry={() => void refetch()} />
      ) : !items.length ? (
        <EmptyJournal signedIn={Boolean(user)} />
      ) : (
        <>
          <div className="journal-toolbar">
            <Tabs value={filter} onValueChange={(v) => setFilter(String(v))}>
              <TabsList>
                <TabsTrigger value="all">All finds</TabsTrigger>
                <TabsTrigger value="following">Following</TabsTrigger>
              </TabsList>
            </Tabs>
            <Input
              aria-label="Search your journal"
              placeholder="Search names, places, notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div
            className="journal-summary"
            role="group"
            aria-label="Journal totals"
          >
            <span>
              <strong>{items.length}</strong>{" "}
              {items.length === 1 ? "discovery" : "discoveries"}
            </span>
            <span>
              <strong>{species}</strong> species
            </span>
            <span>
              <strong>{visits}</strong> {visits === 1 ? "revisit" : "revisits"}
            </span>
          </div>
          {visible.length ? (
            <div className="specimen-grid">
              {visible.map((item) => (
                <DiscoveryCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-muted-foreground">
              {filter === "following" && !search
                ? "Follow a discovery to keep it close and watch it change."
                : "No discoveries match that search. Try another name or place."}
            </p>
          )}
        </>
      )}
    </div>
  );
}
