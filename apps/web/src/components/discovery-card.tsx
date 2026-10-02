import { Link } from "@tanstack/react-router";
import { MapPin, ArrowUpRight } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@touch-grass/ui/components/card";
import { Badge } from "@touch-grass/ui/components/badge";
import { Button } from "@touch-grass/ui/components/button";
import type { JournalEntry } from "@/lib/api";
import { Photo } from "./photo";

export function DiscoveryCard({ item }: { item: JournalEntry }) {
  return (
    <Card className="specimen-card">
      <Link
        to="/journal/$id"
        params={{ id: item.id }}
        className="specimen-photo"
      >
        <Photo id={item.photoIds[0]} alt={item.nickname || item.commonName} />
        {item.followed ? (
          <Badge variant="secondary" className="absolute left-3 top-3">
            Following
          </Badge>
        ) : null}
      </Link>
      <CardHeader>
        <CardTitle>
          <Link to="/journal/$id" params={{ id: item.id }}>
            {item.nickname || item.commonName}
          </Link>
        </CardTitle>
        <CardDescription>
          {item.scientificName || "A discovery to get to know"}
        </CardDescription>
      </CardHeader>
      <CardFooter className="justify-between">
        <span className="meta inline-flex items-center gap-1">
          <MapPin size={13} />
          {item.place ||
            new Date(item.observedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Open ${item.nickname || item.commonName}`}
          nativeButton={false}
          render={<Link to="/journal/$id" params={{ id: item.id }} />}
        >
          <ArrowUpRight />
        </Button>
      </CardFooter>
    </Card>
  );
}
