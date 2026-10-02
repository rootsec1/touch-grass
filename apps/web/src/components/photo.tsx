import { useEffect, useState } from "react";
import { get, set } from "idb-keyval";
import { cn } from "@touch-grass/ui/lib/utils";
import { ImageOff } from "lucide-react";
import { photoUrl } from "@/lib/api";
import { useUser } from "@/lib/use-journal";

export function Photo({
  id,
  blob,
  alt,
  className = "",
  priority = false,
}: {
  id?: string;
  blob?: Blob;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const { user } = useUser();
  const [src, setSrc] = useState<string>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let disposed = false;
    const controller = new AbortController();
    setSrc(undefined);
    let objectUrl: string | undefined;
    setFailed(false);
    async function load() {
      let data = blob;
      if (!data && id && user) {
        data = await get<Blob>(`photo:${user.id}:${id}`);
        if (!data && navigator.onLine) {
          const response = await fetch(photoUrl(id), {
            signal: controller.signal,
          });
          if (!response.ok) throw new Error("Photo unavailable");
          data = await response.blob();
          if (!disposed) await set(`photo:${user.id}:${id}`, data);
        }
      }
      if (!data) throw new Error("Photo not downloaded");
      if (!disposed) {
        objectUrl = URL.createObjectURL(data);
        setSrc(objectUrl);
      }
    }
    void load().catch(() => {
      if (!disposed) setFailed(true);
    });
    return () => {
      disposed = true;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, blob, user?.id]);
  if (failed)
    return (
      <div
        className={cn("photo-fallback", className)}
        role="img"
        aria-label={alt}
      >
        <ImageOff />
        <span>Photo not available</span>
      </div>
    );
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
    />
  );
}
