import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@touch-grass/ui/components/button";
import { Input } from "@touch-grass/ui/components/input";
import { Textarea } from "@touch-grass/ui/components/textarea";
import {
  Field,
  FieldLabel,
  FieldGroup,
} from "@touch-grass/ui/components/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@touch-grass/ui/components/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@touch-grass/ui/components/alert-dialog";
import { toast } from "@touch-grass/ui/components/toast";
import {
  Camera,
  Heart,
  Pencil,
  Trash2,
  MapPin,
  CalendarDays,
  Share2,
  ScanLine,
  Loader2,
} from "lucide-react";
import { useJournal, useOnline } from "@/lib/use-journal";
import { api, photoUrl, type JournalEntry } from "@/lib/api";
import { clearAccountCache, imageInput } from "@/lib/journal";
import { PageHeading, ErrorState, LoadingCards } from "@/components/page";
import { Photo } from "@/components/photo";
import { PhotoGallery } from "@/components/photo-gallery";
import { IdentificationDetails } from "@/components/identification";
export const Route = createFileRoute("/journal/$id")({ component: Detail });
function Detail() {
  const { id } = Route.useParams();
  const { items, user, pending, isLoading, error, refetch } = useJournal();
  const item = items.find((i) => i.id === id);
  if (pending || isLoading)
    return (
      <div className="page">
        <LoadingCards />
      </div>
    );
  if (error)
    return (
      <div className="page">
        <ErrorState message={error.message} retry={() => void refetch()} />
      </div>
    );
  if (!item)
    return (
      <div className="page page-narrow">
        <PageHeading title="A discovery to find" back />
        <p className="mb-5">
          {user
            ? "This discovery isn't in your journal, or isn't available offline yet."
            : "Sign in to open your private journal."}
        </p>
        <Button
          nativeButton={false}
          render={
            <Link
              to={user ? "/journal" : "/login"}
              search={user ? {} : { next: `/journal/${id}` }}
            />
          }
        >
          {user ? "Back to journal" : "Sign in"}
        </Button>
      </div>
    );
  return <Discovery item={item} />;
}
function Discovery({ item }: { item: JournalEntry }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const client = useQueryClient();
  const online = useOnline();
  const navigate = useNavigate();
  async function update(fields: Partial<JournalEntry>) {
    setBusy(true);
    setError("");
    try {
      await api.journal.update.mutate({
        id: item.id,
        commonName: item.commonName,
        scientificName: item.scientificName,
        nickname: item.nickname,
        notes: item.notes,
        place: item.place,
        followed: item.followed,
        ...fields,
      });
      await client.invalidateQueries({ queryKey: ["journal"] });
      setEditing(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Couldn't update this discovery.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function identifySaved() {
    setBusy(true);
    setError("");
    try {
      const images = await Promise.all(
        item.photoIds.map(async (id) => {
          const response = await fetch(photoUrl(id));
          if (!response.ok)
            throw new Error(
              "Couldn't read this photograph. Try again when connected.",
            );
          return imageInput(await response.blob());
        }),
      );
      const identification = await api.identify.mutate({
        images,
        region: item.place || undefined,
      });
      await api.journal.setIdentification.mutate({
        id: item.id,
        identification,
      });
      await client.invalidateQueries({ queryKey: ["journal"] });
      toast.add({
        title: "Identification updated",
        description: "Compare the suggestion with the features you can see.",
        type: "success",
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Couldn't identify this discovery. Your photos are safe.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setError("");
    try {
      await api.journal.remove.mutate({ id: item.id });
      await clearAccountCache(item.userId);
      await client.invalidateQueries({ queryKey: ["journal"] });
      toast.add({ title: "Discovery removed", type: "success" });
      await navigate({ to: "/journal" });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Couldn't remove this discovery.",
      );
      setDeleting(false);
    } finally {
      setBusy(false);
    }
  }
  async function share() {
    const text = `I met ${item.commonName}${item.scientificName ? ` (${item.scientificName})` : ""}. A little closer to nature, with Touch Grass.`;
    try {
      if (navigator.share)
        await navigator.share({ title: "A little discovery", text });
      else {
        await navigator.clipboard.writeText(text);
        toast.add({
          title: "Discovery note copied",
          description: "Your location and private notes stay private.",
          type: "success",
        });
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError"))
        setError("Sharing isn't available here. Try copying the plant's name.");
    }
  }
  return (
    <div className="page">
      <PageHeading
        title={item.nickname || item.commonName}
        back
        description={`First met ${new Date(item.observedAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}`}
      />
      {error ? (
        <div className="mb-5">
          <ErrorState message={error} />
        </div>
      ) : null}
      <div className="detail-layout">
        <div>
          <figure className="discovery-figure">
            <PhotoGallery
              photos={item.photoIds.map((id) => ({ id }))}
              alt={item.commonName}
            />
            <figcaption>
              <span>{item.scientificName || item.commonName}</span>
              <span>{item.stage}</span>
            </figcaption>
          </figure>
          <div className="detail-actions mt-5">
            <Button
              disabled={!online || busy}
              variant={item.followed ? "secondary" : "outline"}
              onClick={() => void update({ followed: !item.followed })}
            >
              <Heart
                className={item.followed ? "fill-current" : ""}
                data-icon="inline-start"
              />
              {item.followed ? "Following" : "Follow this tree"}
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Edit discovery"
              disabled={!online || busy}
              onClick={() => setEditing(true)}
            >
              <Pencil />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Share plant name"
              onClick={() => void share()}
            >
              <Share2 />
            </Button>
          </div>
          <p className="meta mt-3">
            {item.followed
              ? "Following. You can turn on revisit reminders in Settings."
              : "Follow this discovery to find it in your journal favourites."}
          </p>
          {item.place ? (
            <p className="flex items-center gap-2 mt-5">
              <MapPin size={16} />
              {item.place}
            </p>
          ) : null}
          {item.notes ? (
            <p className="mt-4 whitespace-pre-wrap leading-relaxed">
              {item.notes}
            </p>
          ) : null}
        </div>
        <div className="detail-content">
          <Button
            variant="outline"
            className="self-start"
            disabled={!online || busy}
            onClick={() => void identifySaved()}
          >
            {busy ? (
              <Loader2 className="animate-spin" />
            ) : (
              <ScanLine data-icon="inline-start" />
            )}
            {busy
              ? "Looking closer…"
              : item.identification
                ? "Check identification again"
                : "Look for a name"}
          </Button>
          {item.identification ? (
            <IdentificationDetails result={item.identification} />
          ) : (
            <>
              <h2 className="detail-title">{item.commonName}</h2>
              <p className="scientific">
                {item.scientificName || "Still getting acquainted"}
              </p>
              <p className="text-muted-foreground">
                Every observation counts, even without a name. Add a visit with
                a closer photograph, or edit the name when you know more.
              </p>
            </>
          )}
        </div>
      </div>
      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Through the seasons</h2>
            <p>Your visits, gathered in one place.</p>
          </div>
          <Button
            nativeButton={false}
            render={<Link to="/capture" search={{ visit: item.id }} />}
          >
            <Camera data-icon="inline-start" />
            Add a visit
          </Button>
        </div>
        {item.visits.length ? (
          <div className="visit-list">
            {item.visits.map((v) => (
              <article key={v.id}>
                <Photo
                  id={v.photoIds[0]}
                  alt={`Visit on ${new Date(v.observedAt).toLocaleDateString()}`}
                  className="visit-photo"
                />
                <p className="meta flex items-center gap-2">
                  <CalendarDays size={13} />
                  {new Date(v.observedAt).toLocaleDateString()}
                </p>
                <p className="font-medium mt-2">{v.stage}</p>
                {v.notes ? (
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                    {v.notes}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-8 border-y border-border">
            Come back in a few days, a few weeks, or a whole new season. Your
            next visit belongs here.
          </p>
        )}
      </section>
      <Button
        variant="destructive"
        className="mt-6"
        disabled={!online}
        onClick={() => setDeleting(true)}
      >
        <Trash2 data-icon="inline-start" />
        Remove discovery
      </Button>
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your field notes</DialogTitle>
            <DialogDescription>
              Correct a name or keep a memory. Changing its name clears the old
              AI suggestion.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void update({
                commonName: String(f.get("commonName")),
                scientificName: String(f.get("scientificName")),
                nickname: String(f.get("nickname")),
                place: String(f.get("place")),
                notes: String(f.get("notes")),
              });
            }}
          >
            <FieldGroup>
              {[
                { key: "commonName", label: "Common name", max: 120 },
                { key: "scientificName", label: "Scientific name", max: 160 },
                { key: "nickname", label: "Nickname", max: 100 },
                { key: "place", label: "Place", max: 160 },
              ].map((f) => (
                <Field key={f.key}>
                  <FieldLabel htmlFor={f.key}>{f.label}</FieldLabel>
                  <Input
                    id={f.key}
                    name={f.key}
                    defaultValue={item[f.key as "commonName"]}
                    maxLength={f.max}
                    required={f.key === "commonName"}
                  />
                </Field>
              ))}
              <Field>
                <FieldLabel htmlFor="edit-notes">Notes</FieldLabel>
                <Textarea
                  id="edit-notes"
                  name="notes"
                  defaultValue={item.notes}
                  maxLength={2000}
                />
              </Field>
            </FieldGroup>
            <DialogFooter className="mt-5">
              <Button type="submit" disabled={busy}>
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Let this discovery go?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes its photos, notes, and every visit from your journal.
              It can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Keep it</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => void remove()}
            >
              Remove discovery
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
