import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@touch-grass/ui/components/button";
import { Input } from "@touch-grass/ui/components/input";
import { Field, FieldLabel, FieldSet } from "@touch-grass/ui/components/field";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@touch-grass/ui/components/alert-dialog";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@touch-grass/ui/components/collapsible";
import { toast } from "@touch-grass/ui/components/toast";
import {
  Camera,
  ImagePlus,
  Leaf,
  TreeDeciduous,
  ScanLine,
  Loader2,
  BookOpen,
  CloudOff,
  ChevronDown,
} from "lucide-react";
import { cn } from "@touch-grass/ui/lib/utils";
import { MAX_PHOTOS } from "@touch-grass/api/domain";
import { PageHeading, ErrorState } from "@/components/page";
import { PhotoGallery } from "@/components/photo-gallery";
import { DiscoveryFields } from "@/components/discovery-fields";
import { IdentificationDetails } from "@/components/identification";
import { api, errorMessage } from "@/lib/api";
import {
  newDraft,
  readDraft,
  removeDraft,
  saveDraft,
  preparePhotos,
  syncDraft,
  imageInput,
  type Draft,
} from "@/lib/journal";
import { useUser, useOnline, useConfig } from "@/lib/use-journal";
export const Route = createFileRoute("/capture")({
  validateSearch: (
    s: Record<string, unknown>,
  ): { draft?: string; visit?: string } => ({
    draft: typeof s.draft === "string" ? s.draft : undefined,
    visit: typeof s.visit === "string" ? s.visit : undefined,
  }),
  component: Capture,
});
function Capture() {
  const search = Route.useSearch();
  const { user, pending } = useUser();
  const online = useOnline();
  const { data: config } = useConfig();
  const [draft, setDraft] = useState<Draft>();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const client = useQueryClient();
  const writeQueue = useRef(Promise.resolve());
  useEffect(() => {
    if (pending) return;
    let active = true;
    void (async () => {
      let loaded = search.draft ? await readDraft(search.draft) : undefined;
      if (loaded?.owner && loaded.owner !== user?.id)
        throw new Error("Sign in to the account that owns this draft.");
      if (search.draft && !loaded)
        throw new Error("This draft was already saved or removed.");
      if (active) setDraft(loaded || newDraft(user?.id || null, search.visit));
    })().catch((e) => {
      if (active) setError(e.message);
    });
    return () => {
      active = false;
    };
  }, [search.draft, search.visit, pending, user?.id]);
  function change(fields: Partial<Draft>) {
    if (!draft) return;
    const next = { ...draft, ...fields };
    setDraft(next);
    if (next.photos.length || draft.photos.length)
      writeQueue.current = writeQueue.current
        .then(() => saveDraft(next))
        .catch((e) =>
          setError(
            errorMessage(
              e,
              "Couldn't keep your changes on this device. Keep this page open and try again.",
            ),
          ),
        );
  }
  async function add(files: FileList | null) {
    if (!files?.length || !draft) return;
    // FileList is live: copy it before the input is reset or any await yields.
    const selected = Array.from(files);
    setBusy("photo");
    setError("");
    try {
      await writeQueue.current;
      const photos = await preparePhotos(selected);
      const next = {
        ...draft,
        photos: [...draft.photos, ...photos].slice(0, MAX_PHOTOS),
        identification: null,
      };
      await saveDraft(next);
      setDraft(next);
      await client.invalidateQueries({ queryKey: ["drafts"] });
      if (!search.draft)
        await navigate({
          to: "/capture",
          search: { draft: next.id, visit: next.discoveryId },
          replace: true,
        });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Couldn't read this photograph.",
      );
    } finally {
      setBusy("");
    }
  }
  async function identify() {
    if (!draft) return;
    setBusy("identify");
    setError("");
    try {
      await writeQueue.current;
      const result = await api.identify.mutate({
        images: await Promise.all(draft.photos.map((p) => imageInput(p.blob))),
        region: draft.place || undefined,
      });
      change({
        identification: result,
        commonName: result.isPlant ? result.commonName : "Unknown plant",
        scientificName: result.isPlant ? result.scientificName : "",
      });
    } catch (e) {
      setError(
        errorMessage(
          e,
          "We couldn’t identify this photo. Your draft is safe; try again when you’re connected.",
        ),
      );
    } finally {
      setBusy("");
    }
  }
  async function save() {
    if (!draft) return;
    setBusy("save");
    setError("");
    try {
      await writeQueue.current;
      await saveDraft(draft);
      if (!online) {
        toast.add({
          title: "Saved on this device",
          description: "Open your journal to sync when you're back online.",
          type: "success",
        });
        await navigate({ to: "/journal" });
        return;
      }
      if (!user) {
        await navigate({
          to: "/login",
          search: { next: `/capture?draft=${draft.id}` },
        });
        return;
      }
      await syncDraft(draft, user.id);
      await Promise.all([
        client.invalidateQueries({ queryKey: ["journal"] }),
        client.invalidateQueries({ queryKey: ["drafts"] }),
      ]);
      toast.add({
        title: draft.discoveryId
          ? "Another page in its story."
          : "A new little connection.",
        description: "Your discovery is safe in your journal.",
        type: "success",
      });
      await navigate({
        to: "/journal/$id",
        params: { id: draft.discoveryId || draft.id },
      });
    } catch (e) {
      setError(
        errorMessage(
          e,
          "Couldn’t save online. Your draft is safe on this device. Try again when you’re connected.",
        ),
      );
    } finally {
      setBusy("");
    }
  }
  function locate() {
    if (!navigator.geolocation) {
      setError(
        "This browser doesn't support location. You can still add a place name.",
      );
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        change({ latitude: p.coords.latitude, longitude: p.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError(
          "Location wasn't available. Add a place name, or allow location in your browser and try again.",
        );
      },
      { timeout: 15000, maximumAge: 60000 },
    );
  }
  return (
    <div className="page capture-page">
      <PageHeading
        title={draft?.discoveryId ? "A return visit" : "What caught your eye?"}
        description={
          draft?.discoveryId
            ? "Same tree. A different day."
            : "Photograph it. Get to know it. Keep the moment."
        }
      />
      {error ? (
        <div className="mb-5">
          <ErrorState message={error} />
        </div>
      ) : null}
      {search.draft ? (
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                className="mb-3"
                disabled={Boolean(busy)}
              />
            }
          >
            Discard draft
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Let this draft go?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the photographs and notes saved on this device.
                Your other discoveries stay in your journal.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep draft</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={() => {
                  void (async () => {
                    await writeQueue.current;
                    await removeDraft(search.draft!);
                    await client.invalidateQueries({ queryKey: ["drafts"] });
                    await navigate({ to: "/journal" });
                  })().catch(() =>
                    setError("Couldn't remove the draft. Try again."),
                  );
                }}
              >
                Discard draft
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
      <Input
        ref={fileRef}
        className="hidden"
        aria-label="Choose nature photographs"
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          void add(e.target.files);
          e.target.value = "";
        }}
      />
      <Input
        ref={cameraRef}
        className="hidden"
        aria-label="Take a nature photograph"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          void add(e.target.files);
          e.target.value = "";
        }}
      />
      <div
        className={cn("capture-layout", !draft?.photos.length && "is-empty")}
      >
        <div>
          {draft?.photos.length ? (
            <>
              <PhotoGallery
                photos={draft.photos}
                alt="Your discovery"
                scanning={busy === "identify"}
                disabled={Boolean(busy)}
                onRemove={(id) =>
                  change({
                    photos: draft.photos.filter((photo) => photo.id !== id),
                    identification: null,
                  })
                }
              />
              <div className="capture-actions">
                <Button
                  variant="outline"
                  disabled={Boolean(busy) || draft.photos.length >= MAX_PHOTOS}
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus data-icon="inline-start" />
                  Add a detail ({draft.photos.length}/3)
                </Button>
                {!draft.discoveryId ? (
                  <Button
                    disabled={Boolean(busy) || !online || config?.ai === false}
                    onClick={() => void identify()}
                  >
                    {busy === "identify" ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <ScanLine data-icon="inline-start" />
                    )}
                    {busy === "identify"
                      ? "Looking closer…"
                      : draft.identification
                        ? "Identify again"
                        : "Identify this plant"}
                  </Button>
                ) : null}
              </div>
              <p className="meta mt-3" role="status">
                {busy === "identify"
                  ? "This can take a moment. Your photos are safely saved on this device."
                  : !online
                    ? "Identification needs a connection. You can still keep this discovery."
                    : "Photos are sent to Google Gemini only when you ask for an identification."}
              </p>
            </>
          ) : (
            <div>
              <div className="viewfinder" aria-hidden="true">
                <img src="/images/oak-study.webp" alt="" />
                <span className="viewfinder-note">
                  A leaf is a lovely place to start.
                </span>
              </div>
              <div className="capture-start-actions">
                <Button
                  variant="field"
                  disabled={!draft || Boolean(busy)}
                  onClick={() => cameraRef.current?.click()}
                >
                  <Camera data-icon="inline-start" />
                  {busy === "photo"
                    ? "Preparing your photo…"
                    : "Take a photograph"}
                </Button>
                <Button
                  variant="ghost"
                  disabled={!draft || Boolean(busy)}
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus data-icon="inline-start" />
                  Choose from your photos
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="result-panel">
          {draft?.photos.length ? (
            <>
              {draft.identification ? (
                <IdentificationDetails result={draft.identification} />
              ) : (
                <div>
                  <h2>
                    {draft.discoveryId
                      ? "What's changed?"
                      : "A name can come later."}
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    {draft.discoveryId
                      ? "New leaves, different light, or simply the pleasure of returning."
                      : "Identify your plant, or save it as an unknown discovery and get to know it over time."}
                  </p>
                </div>
              )}
              <Collapsible
                className="capture-notes"
                defaultOpen={Boolean(search.visit)}
              >
                <CollapsibleTrigger render={<Button variant="ghost" />}>
                  <span>
                    {draft.discoveryId
                      ? "What changed on this visit?"
                      : "Add a note, a nickname, a place"}
                  </span>
                  <ChevronDown data-icon="inline-end" />
                </CollapsibleTrigger>
                <CollapsibleContent keepMounted>
                  <FieldSet disabled={Boolean(busy)}>
                    <DiscoveryFields
                      draft={draft}
                      change={change}
                      onLocate={locate}
                      locating={locating}
                    />
                    {!draft.identification && !draft.discoveryId ? (
                      <Field>
                        <FieldLabel htmlFor="plant-name">
                          Already know its name?
                        </FieldLabel>
                        <Input
                          id="plant-name"
                          value={draft.commonName}
                          onChange={(e) =>
                            change({ commonName: e.target.value })
                          }
                          maxLength={120}
                        />
                      </Field>
                    ) : null}
                  </FieldSet>
                </CollapsibleContent>
              </Collapsible>
              <Button
                variant="field"
                disabled={Boolean(busy) || !draft.commonName.trim()}
                onClick={() => void save()}
              >
                {busy === "save" ? (
                  <Loader2 className="animate-spin" />
                ) : online ? (
                  <BookOpen data-icon="inline-start" />
                ) : (
                  <CloudOff data-icon="inline-start" />
                )}
                {busy === "save"
                  ? "Saving discovery…"
                  : !online
                    ? "Keep as an offline draft"
                    : !user
                      ? "Sign in & save discovery"
                      : draft.discoveryId
                        ? "Save this visit"
                        : "Save to my journal"}
              </Button>
              <p className="meta text-center">
                Photos stay on this device until your journal is synced.
              </p>
            </>
          ) : (
            <div className="capture-guide">
              <h2>Start with a closer look.</h2>
              <p>
                One clear photo is enough to begin. Add a leaf or bark detail to
                help with identification.
              </p>
              <div className="capture-hints">
                <div className="capture-hint">
                  <Leaf />
                  <div>
                    <h3>Notice the details</h3>
                    <p>Include the leaf edge and the way it joins the stem.</p>
                  </div>
                </div>
                <div className="capture-hint">
                  <TreeDeciduous />
                  <div>
                    <h3>Leave it growing</h3>
                    <p>
                      Keep the photograph. Leave the plant where it belongs.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="link"
                nativeButton={false}
                render={
                  <Link to="/guide/$slug" params={{ slug: "look-closer" }} />
                }
              >
                A short guide to looking closer
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
