import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { JournalEntry } from "@/lib/api";
import "leaflet/dist/leaflet.css";
export default function JournalMap({ items }: { items: JournalEntry[] }) {
  const element = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    let disposed = false;
    let map: import("leaflet").Map;
    void import("leaflet").then((L) => {
      if (disposed || !element.current) return;
      map = L.map(element.current, { scrollWheelZoom: false }).setView(
        [items[0]!.latitude!, items[0]!.longitude!],
        15,
      );
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      const bounds = L.latLngBounds([]);
      const icon = L.divIcon({
        className: "tree-map-pin",
        html: '<img src="/icon.svg" alt="" /><span></span>',
        iconSize: [32, 40],
        iconAnchor: [16, 38],
        tooltipAnchor: [0, -30],
      });
      for (const item of items) {
        const position: L.LatLngExpression = [item.latitude!, item.longitude!];
        bounds.extend(position);
        const label = document.createElement("span");
        label.textContent = item.nickname || item.commonName;
        L.marker(position, {
          icon,
          title: item.nickname || item.commonName,
          alt: item.nickname || item.commonName,
        })
          .addTo(map)
          .bindTooltip(label)
          .on(
            "click",
            () =>
              void navigate({ to: "/journal/$id", params: { id: item.id } }),
          );
      }
      if (items.length > 1)
        map.fitBounds(bounds, { padding: [35, 35], maxZoom: 16 });
    });
    return () => {
      disposed = true;
      map?.remove();
    };
  }, [items, navigate]);
  return (
    <div
      ref={element}
      className="map-canvas"
      role="region"
      aria-label="Map of your private discoveries"
    />
  );
}
