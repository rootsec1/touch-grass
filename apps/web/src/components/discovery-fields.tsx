import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldGroup,
} from "@touch-grass/ui/components/field";
import { Input } from "@touch-grass/ui/components/input";
import { Textarea } from "@touch-grass/ui/components/textarea";
import { Button } from "@touch-grass/ui/components/button";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@touch-grass/ui/components/toggle-group";
import { stages } from "@touch-grass/api/domain";
import { MapPin, X } from "lucide-react";
import type { Draft } from "@/lib/journal";
export function DiscoveryFields({
  draft,
  change,
  onLocate,
  locating,
}: {
  draft: Draft;
  change: (fields: Partial<Draft>) => void;
  onLocate: () => void;
  locating: boolean;
}) {
  return (
    <FieldGroup>
      {!draft.discoveryId ? (
        <>
          <Field>
            <FieldLabel htmlFor="nickname">
              Nickname{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </FieldLabel>
            <Input
              id="nickname"
              maxLength={100}
              value={draft.nickname}
              onChange={(e) => change({ nickname: e.target.value })}
              placeholder="The oak on my way home"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="place">Place</FieldLabel>
            <Input
              id="place"
              maxLength={160}
              value={draft.place}
              onChange={(e) => change({ place: e.target.value })}
              placeholder="A park, a street, a favourite spot"
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={onLocate}
                disabled={locating}
              >
                <MapPin data-icon="inline-start" />
                {locating
                  ? "Finding your location…"
                  : draft.latitude !== null
                    ? "Update private pin"
                    : "Add a private map pin"}
              </Button>
              {draft.latitude !== null ? (
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  aria-label="Remove map pin"
                  onClick={() => change({ latitude: null, longitude: null })}
                >
                  <X />
                </Button>
              ) : null}
            </div>
            <FieldDescription>
              {draft.latitude !== null
                ? "Location added. Only you can see it."
                : "Location is optional and never shared publicly."}
            </FieldDescription>
          </Field>
        </>
      ) : null}
      <Field>
        <FieldLabel>Seasonal stage</FieldLabel>
        <ToggleGroup
          value={[draft.stage]}
          onValueChange={(v) => {
            if (v[0]) change({ stage: v[0] as Draft["stage"] });
          }}
          className="flex-wrap justify-start"
          aria-label="Seasonal stage"
        >
          {stages.map((stage) => (
            <ToggleGroupItem value={stage} key={stage}>
              {stage}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>
      <Field>
        <FieldLabel htmlFor="notes">Field notes</FieldLabel>
        <Textarea
          id="notes"
          value={draft.notes}
          onChange={(e) => change({ notes: e.target.value })}
          placeholder="The light, the leaves, how it felt to be here…"
          maxLength={2000}
        />
      </Field>
    </FieldGroup>
  );
}
