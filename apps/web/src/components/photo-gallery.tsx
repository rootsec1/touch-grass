import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@touch-grass/ui/components/button";
import { Photo } from "./photo";

/** The same photo selection interaction for a draft and a saved discovery. */
export function PhotoGallery({
  photos,
  alt,
  scanning = false,
  disabled = false,
  onRemove,
}: {
  photos: { id: string; blob?: Blob }[];
  alt: string;
  scanning?: boolean;
  disabled?: boolean;
  onRemove?: (id: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string>();
  const selected = photos.find((p) => p.id === selectedId) || photos[0];
  if (!selected) return null;
  return (
    <div className="photo-gallery">
      <div className="gallery-main" data-scanning={scanning}>
        <Photo
          id={selected.blob ? undefined : selected.id}
          blob={selected.blob}
          alt={alt}
          priority
        />
      </div>
      <div className="gallery-controls">
        <div
          className="gallery-thumbnails"
          role="group"
          aria-label="Discovery photographs"
        >
          {photos.length > 1 ? (
            photos.map((photo, index) => (
              <Button
                key={photo.id}
                variant="photo"
                aria-label={`View photograph ${index + 1}`}
                aria-pressed={selected.id === photo.id}
                onClick={() => setSelectedId(photo.id)}
              >
                <Photo
                  id={photo.blob ? undefined : photo.id}
                  blob={photo.blob}
                  alt=""
                />
              </Button>
            ))
          ) : (
            <span className="meta">1 photograph</span>
          )}
        </div>
        {onRemove ? (
          <Button
            variant="ghost"
            disabled={disabled}
            aria-label="Remove selected photograph"
            onClick={() => onRemove(selected.id)}
          >
            <X data-icon="inline-start" />
            Remove
          </Button>
        ) : null}
      </div>
    </div>
  );
}
