import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@touch-grass/ui/components/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@touch-grass/ui/components/alert";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@touch-grass/ui/components/empty";
import { Skeleton } from "@touch-grass/ui/components/skeleton";
import { Camera, ArrowLeft, RefreshCw } from "lucide-react";

export function PageHeading({
  title,
  description,
  action,
  back,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  back?: boolean;
}) {
  return (
    <header className="page-heading">
      {back ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back to journal"
          nativeButton={false}
          render={<Link to="/journal" />}
        >
          <ArrowLeft />
        </Button>
      ) : null}
      <div>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action}
    </header>
  );
}
export function EmptyJournal({ signedIn }: { signedIn: boolean }) {
  return (
    <Empty className="journal-empty">
      <EmptyHeader>
        <div className="empty-specimen" aria-hidden="true">
          <img src="/images/oak-study.webp" alt="" />
          <span>A first leaf. A fresh page.</span>
        </div>
        <EmptyTitle>Your journal starts outside.</EmptyTitle>
        <EmptyDescription>
          Photograph something that catches your eye. Give it a name, a note, a
          place to remember.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          variant="field"
          nativeButton={false}
          render={<Link to="/capture" />}
        >
          <Camera data-icon="inline-start" />
          Find your first discovery
        </Button>
        {!signedIn ? (
          <Button
            variant="link"
            nativeButton={false}
            render={<Link to="/login" />}
          >
            Already have a journal? Sign in
          </Button>
        ) : null}
      </EmptyContent>
    </Empty>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertTitle>We couldn't finish that</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
      {retry ? (
        <Button variant="outline" onClick={retry}>
          <RefreshCw data-icon="inline-start" />
          Try again
        </Button>
      ) : null}
    </Alert>
  );
}
export function LoadingCards() {
  return (
    <div className="specimen-grid" aria-label="Loading your discoveries">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-52 rounded-lg" />
      ))}
    </div>
  );
}
