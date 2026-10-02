import { useEffect, useState, useSyncExternalStore } from "react";
import { TRPCClientError } from "@trpc/client";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "./auth-client";
import { api } from "./api";
import { cacheJournal, readJournal, getDrafts } from "./journal";

const subscribe = (callback: () => void) => {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
};
export const useOnline = () =>
  useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
type CachedUser = { id: string; name: string; email: string };
export function useUser() {
  const session = authClient.useSession();
  const online = useOnline();
  const unavailable =
    !online ||
    Boolean(
      session.error && (!session.error.status || session.error.status >= 500),
    );
  const [cached, setCached] = useState<CachedUser | null>(null);
  useEffect(() => {
    if (session.data?.user) {
      const { id, name, email } = session.data.user;
      const user = { id, name, email };
      localStorage.setItem("touch-grass:user", JSON.stringify(user));
      setCached(user);
    } else if (unavailable) {
      try {
        setCached(
          JSON.parse(localStorage.getItem("touch-grass:user") || "null"),
        );
      } catch {
        setCached(null);
      }
    } else if (!session.isPending && !session.error) {
      localStorage.removeItem("touch-grass:user");
      setCached(null);
    }
  }, [session.data, session.isPending, session.error, unavailable]);
  return {
    user: session.data?.user || (unavailable ? cached : null),
    pending: session.isPending && !unavailable,
  };
}
export function useJournal() {
  const { user, pending } = useUser();
  const query = useQuery({
    queryKey: ["journal", user?.id],
    enabled: Boolean(user),
    networkMode: "always",
    retry: false,
    queryFn: async () => {
      if (!user) return { items: [], cached: false };
      if (!navigator.onLine)
        return { items: (await readJournal(user.id)) || [], cached: true };
      try {
        const items = await api.journal.list.query();
        await cacheJournal(user.id, items);
        return { items, cached: false };
      } catch (error) {
        if (
          error instanceof TRPCClientError &&
          error.data?.code === "UNAUTHORIZED"
        )
          throw error;
        const items = await readJournal(user.id);
        if (items) return { items, cached: true };
        throw error;
      }
    },
  });
  return {
    ...query,
    user,
    pending,
    items: query.data?.items || [],
    cached: query.data?.cached || false,
  };
}
export function useDrafts() {
  const { user } = useUser();
  return useQuery({
    queryKey: ["drafts", user?.id],
    queryFn: () => getDrafts(user?.id || null),
    networkMode: "always",
  });
}
export const useConfig = () =>
  useQuery({
    queryKey: ["config"],
    queryFn: () => api.config.query(),
    staleTime: 300000,
  });
